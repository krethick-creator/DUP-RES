const Resume = require('../models/Resume');
const aiService = require('../services/aiService');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const parsed = await aiService.parseResume(req.file.path);
    const authenticity = await aiService.checkAuthenticity({});
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
    const simulation = await aiService.simulateResume(resume, req.body.scenarios);
    resume.simulationResults = simulation;
    await resume.save();
    res.json({ success: true, simulation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dynamicResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const dynamic = await aiService.generateDynamicResume(resume, req.body.job);
    resume.dynamicVersion = JSON.stringify(dynamic);
    await resume.save();
    res.json({ success: true, dynamic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.improvementReport = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const report = await aiService.generateImprovementReport(resume);
    resume.improvementReport = report;
    await resume.save();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    const timeline = await aiService.generateTimeline(resume);
    res.json({ success: true, timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
