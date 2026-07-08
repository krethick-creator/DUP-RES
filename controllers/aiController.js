const aiService = require('../services/aiService');
const GitHubProfile = require('../models/GitHubProfile');
const CareerRoadmap = require('../models/CareerRoadmap');
const Assessment = require('../models/Assessment');

exports.githubConnect = async (req, res) => {
  try {
    const { username } = req.body;
    const analysis = await aiService.analyzeGitHub(username);
    const profile = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, username, ...analysis, lastSynced: new Date() },
      { upsert: true, new: true }
    );
    req.user.githubUsername = username;
    req.user.githubConnected = true;
    await req.user.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGitHubProfile = async (req, res) => {
  try {
    const profile = await GitHubProfile.findOne({ user: req.user._id });
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncGitHub = async (req, res) => {
  try {
    const profile = await GitHubProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'GitHub not connected' });
    const analysis = await aiService.analyzeGitHub(profile.username);
    Object.assign(profile, analysis, { lastSynced: new Date() });
    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    let roadmap = await CareerRoadmap.findOne({ user: req.user._id });
    if (!roadmap) {
      const generated = await aiService.generateCareerRoadmap(req.user);
      roadmap = await CareerRoadmap.create({ user: req.user._id, ...generated });
    }
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.analyzeRoadmap = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ user: req.user._id });
    const analysis = await aiService.analyzeRoadmap(roadmap);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const data = await aiService.getLeaderboard();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBenchmarks = async (req, res) => {
  try {
    const data = await aiService.benchmarkComparison(req.user);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCareerGrowth = async (req, res) => {
  try {
    const data = await aiService.predictCareerGrowth(req.user);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLearningScore = async (req, res) => {
  try {
    const data = await aiService.calculateLearningScore(req.user);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLearningRoadmap = async (req, res) => {
  try {
    const data = await aiService.generateLearningRoadmap(req.user.skills || []);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recommendJobs = async (req, res) => {
  try {
    const data = await aiService.recommendJobs(req.user);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const generated = await aiService.generateCodingAssessment(req.body.language, req.body.difficulty);
    const assessment = await Assessment.create({
      user: req.user._id,
      type: req.body.type || 'coding',
      title: generated.title,
      language: req.body.language,
      questions: generated.problems
    });
    res.status(201).json({ success: true, assessment, generated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.body.code) {
      const review = await aiService.reviewCode(req.body.code, assessment.language);
      assessment.code = req.body.code;
      assessment.aiReview = review.suggestions.join('\n');
      assessment.feedback = review;
      assessment.score = review.score;
    }
    assessment.completed = true;
    await assessment.save();
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateInterviewQuestions = async (req, res) => {
  try {
    const data = await aiService.generateInterviewQuestions(req.body.role, req.body.skills, req.body.count);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.candidateAI = async (req, res) => {
  try {
    const data = await aiService.candidateAI(req.body.action, req.body.context);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recruiterAssistant = async (req, res) => {
  try {
    const data = await aiService.recruiterAssistant(req.body.query, req.body.context);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.hiringAnalytics = async (req, res) => {
  try {
    const data = await aiService.hiringAnalytics(req.user.companyId);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const slots = await aiService.suggestInterviewSlots(req.body.participants);
    res.json({ success: true, ...slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.projectKnowledge = async (req, res) => {
  try {
    const data = await aiService.projectKnowledge(req.body.project, req.body.question);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.companyGoalPlanner = async (req, res) => {
  try {
    const data = await aiService.planCompanyGoals(req.body.company, req.body.goals);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.softSkills = async (req, res) => {
  try {
    const data = await aiService.inferSoftSkills(req.user);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.explainScore = async (req, res) => {
  try {
    const data = await aiService.explainScore(req.body.score, req.body.context);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
