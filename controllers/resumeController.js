const Resume = require('../models/Resume');
const aiService = require('../services/aiService');
const AICache = require('../models/AICache');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Resume parsing and authenticity are forced on upload
    const parsed = await aiService.parseResume(req.file.path, req.user._id, { forceRegenerate: true });
    const authenticity = await aiService.checkAuthenticity({}, req.user._id, { forceRegenerate: true });
    const score = Math.max(0, Math.min(100, parsed.score || 70));

    const resume = await Resume.create({
      user: req.user._id,
      filename: req.file.originalname,
      filepath: req.file.path,
      parsed: parsed.parsed,
      score,
      authenticityScore: authenticity.authenticityScore
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.simulateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    // Explicit simulation trigger
    const simulation = await aiService.simulateResume(resume, req.body.scenarios, req.user._id, { forceRegenerate: true });
    resume.simulationResults = simulation;
    await resume.save();
    res.json({ success: true, simulation });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dynamicResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    // Explicit tailoring trigger
    const dynamic = await aiService.generateDynamicResume(resume, req.body.job, req.user._id, { forceRegenerate: true });
    resume.dynamicVersion = JSON.stringify(dynamic);
    await resume.save();
    res.json({ success: true, dynamic });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.improvementReport = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'improvement-report' });
    if (!cached && !force) {
      return res.json({ success: true, report: null });
    }
    
    const report = await aiService.generateImprovementReport(resume, req.user._id, { forceRegenerate: force });
    resume.improvementReport = report;
    await resume.save();
    res.json({ success: true, report });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'resume-timeline' });
    if (!cached && !force) {
      return res.json({ success: true, timeline: null });
    }
    
    const timeline = await aiService.generateTimeline(resume, req.user._id, { forceRegenerate: force });
    res.json({ success: true, timeline });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
