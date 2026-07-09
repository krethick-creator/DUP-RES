const Job = require('../models/Job');
const Application = require('../models/Application');
const aiService = require('../services/aiService');

exports.createJob = async (req, res) => {
  try {
    const company = req.body.company || req.user.companyId;
    if (!company) return res.status(400).json({ success: false, message: 'Company is required' });
    const job = await Job.create({ ...req.body, company, recruiter: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.aiCreateJob = async (req, res) => {
  try {
    const company = req.body.company || req.user.companyId;
    if (!company) return res.status(400).json({ success: false, message: 'Company is required' });
    const generated = await aiService.generateJob(req.body.prompt, req.user._id, { forceRegenerate: true });
    const job = await Job.create({
      ...generated.job,
      ...req.body,
      company,
      recruiter: req.user._id,
      aiGenerated: true
    });
    res.status(201).json({ success: true, job, ai: generated });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (search) filter.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    if (status) filter.status = status;
    if (req.user.role === 'recruiter') filter.recruiter = req.user._id;

    const jobs = await Job.find(filter)
      .populate('company', 'name logo')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Job.countDocuments(filter);
    res.json({ success: true, jobs, pagination: { page: +page, limit: +limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company recruiter', 'name email logo');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    job.viewsCount += 1;
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const screening = await aiService.screenResume({}, job, req.user._id, { forceRegenerate: true });
    const skillMatch = await aiService.matchSkills(req.user.skills || [], job.skills || [], req.user._id, { forceRegenerate: true });

    const application = await Application.create({
      candidate: req.user._id,
      job: job._id,
      resume: req.body.resumeId,
      aiScore: screening.matchScore,
      skillMatch: skillMatch.matchPercentage,
      timeline: [{ status: 'applied', note: 'Application submitted' }]
    });

    job.applicationsCount += 1;
    await job.save();
    res.status(201).json({ success: true, application, screening });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Already applied' });
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const filter = req.user.role === 'candidate'
      ? { candidate: req.user._id }
      : { job: { $in: await Job.find({ recruiter: req.user._id }).distinct('_id') } };

    const applications = await Application.find(filter)
      .populate('candidate', 'name email skills avatar')
      .populate('job', 'title company status')
      .sort('-createdAt');
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.body.status) {
      application.status = req.body.status;
      application.timeline.push({ status: req.body.status, note: req.body.note || '' });
    }
    if (req.body.notes) application.notes = req.body.notes;
    if (req.body.interviewDate) application.interviewDate = req.body.interviewDate;
    await application.save();
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rankCandidates = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email skills experience');
    const ranked = await aiService.rankCandidates(applications.map((a) => ({
      id: a._id,
      name: a.candidate.name,
      skills: a.candidate.skills,
      aiScore: a.aiScore
    })), req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...ranked });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reverseMatch = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    const matches = await aiService.reverseMatch(job, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...matches });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
