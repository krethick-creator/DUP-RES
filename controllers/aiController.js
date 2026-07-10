const aiService = require('../services/aiService');
const GitHubProfile = require('../models/GitHubProfile');
const CareerRoadmap = require('../models/CareerRoadmap');
const Assessment = require('../models/Assessment');
const AICache = require('../models/AICache');
const GitHubRepository = require('../models/GitHubRepository');
const githubService = require('../services/githubService');

exports.githubConnect = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      const profile = await GitHubProfile.findOne({ user: req.user._id });
      return res.json({ success: true, profile });
    }

    const synced = await githubService.syncUserGitHubData(req.user._id, username);
    const analysis = await aiService.analyzeGitHub(synced.repos, { githubUsername: username }, req.user._id, { forceRegenerate: true });

    const profile = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        username,
        repos: analysis.repos || [],
        totalCommits: synced.totalCommits || analysis.totalCommits || 0,
        totalPRs: synced.totalPRs || analysis.totalPRs || 0,
        languages: synced.languages || analysis.languages || [],
        portfolioScore: analysis.portfolioScore || 70,
        contributionScore: analysis.contributionScore || 70,
        projectComplexity: analysis.projectComplexity || 70,
        codingConsistency: analysis.codingConsistency || 70,
        repositoryQuality: analysis.repositoryQuality || 70,
        commitFrequency: analysis.commitFrequency || 70,
        topRepository: analysis.topRepository || '',
        openSourceContributions: analysis.openSourceContributions || 0,
        aiCandidateSummary: analysis.aiCandidateSummary || '',
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );

    if (req.user.role === 'candidate') {
      req.user.githubUsername = username;
      req.user.githubConnected = true;
      await req.user.save();
    }

    res.json({ success: true, profile, repositories: synced.repos });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGitHubProfile = async (req, res) => {
  try {
    const profile = await GitHubProfile.findOne({ user: req.user._id });
    const repositories = await GitHubRepository.find({ user: req.user._id });
    res.json({ success: true, profile, repositories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    const synced = await githubService.syncUserGitHubData(userId);
    const analysis = await aiService.analyzeGitHub(synced.repos, req.user, userId, { forceRegenerate: true });

    const profile = await GitHubProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        username: req.user.githubUsername,
        repos: analysis.repos || [],
        totalCommits: synced.totalCommits || analysis.totalCommits || 0,
        totalPRs: synced.totalPRs || analysis.totalPRs || 0,
        languages: synced.languages || analysis.languages || [],
        portfolioScore: analysis.portfolioScore || 70,
        contributionScore: analysis.contributionScore || 70,
        projectComplexity: analysis.projectComplexity || 70,
        codingConsistency: analysis.codingConsistency || 70,
        repositoryQuality: analysis.repositoryQuality || 70,
        commitFrequency: analysis.commitFrequency || 70,
        topRepository: analysis.topRepository || '',
        openSourceContributions: analysis.openSourceContributions || 0,
        aiCandidateSummary: analysis.aiCandidateSummary || '',
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );

    req.user.githubConnected = true;
    await req.user.save();

    res.json({ success: true, profile, repositories: synced.repos });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoadmap = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    let roadmap = await CareerRoadmap.findOne({ user: req.user._id });
    
    if (force) {
      const generated = await aiService.generateCareerRoadmap(req.user, req.user._id, { forceRegenerate: true });
      roadmap = await CareerRoadmap.findOneAndUpdate(
        { user: req.user._id },
        { user: req.user._id, ...generated },
        { upsert: true, new: true }
      );
    }
    
    res.json({ success: true, roadmap: roadmap || null });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
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
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const roadmap = await CareerRoadmap.findOne({ user: req.user._id });
    if (!roadmap) {
      return res.json({ success: true, analysis: null });
    }
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'roadmap-analyzer' });
    if (!cached && !force) {
      return res.json({ success: true, analysis: null });
    }
    const analysis = await aiService.analyzeRoadmap(roadmap, req.user._id, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'career-leaderboard' });
    if (!cached && !force) {
      return res.json({
        success: true,
        leaderboard: [
          { rank: 1, name: 'Alex Chen', score: 94, growth: '+12%' },
          { rank: 2, name: 'Sarah Kim', score: 91, growth: '+8%' },
          { rank: 3, name: 'Mike Johnson', score: 88, growth: '+15%' },
          { rank: 4, name: 'You', score: 84, growth: '+10%' },
          { rank: 5, name: 'Emma Wilson', score: 82, growth: '+6%' }
        ]
      });
    }
    const data = await aiService.getLeaderboard(null, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBenchmarks = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'benchmark-comparison' });
    if (!cached && !force) {
      return res.json({ success: true, benchmarks: null });
    }
    const data = await aiService.benchmarkComparison(req.user, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCareerGrowth = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'career-growth-predictor' });
    if (!cached && !force) {
      return res.json({ success: true, predictions: null });
    }
    const data = await aiService.predictCareerGrowth(req.user, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLearningScore = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'continuous-learning-score' });
    if (!cached && !force) {
      return res.json({ success: true, score: null });
    }
    const data = await aiService.calculateLearningScore(req.user, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLearningRoadmap = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'learning-roadmap' });
    if (!cached && !force) {
      return res.json({ success: true, modules: null });
    }
    const data = await aiService.generateLearningRoadmap(req.user.skills || [], req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recommendJobs = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'job-recommendation' });
    if (!cached && !force) {
      return res.json({ success: true, recommendations: null });
    }
    const data = await aiService.recommendJobs(req.user, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const generated = await aiService.generateCodingAssessment(req.body.language, req.body.difficulty, req.user._id, { forceRegenerate: true });
    const assessment = await Assessment.create({
      user: req.user._id,
      type: req.body.type || 'coding',
      title: generated.title,
      language: req.body.language,
      questions: generated.problems
    });
    res.status(201).json({ success: true, assessment, generated });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user._id });
    if (!assessment) return res.status(404).json({ success: false, message: 'Not found' });

    if (req.body.code) {
      const review = await aiService.reviewCode(req.body.code, assessment.language, req.user._id, { forceRegenerate: true });
      assessment.code = req.body.code;
      assessment.aiReview = review.suggestions.join('\n');
      assessment.feedback = review;
      assessment.score = review.score;
    }
    assessment.completed = true;
    await assessment.save();
    res.json({ success: true, assessment });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
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
    const data = await aiService.generateInterviewQuestions(req.body.role, req.body.skills, req.body.count, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.candidateAI = async (req, res) => {
  try {
    const data = await aiService.candidateAI(req.body.action, req.body.context, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recruiterAssistant = async (req, res) => {
  try {
    const data = await aiService.recruiterAssistant(req.body.query, req.body.context, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.hiringAnalytics = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'hiring-analytics' });
    if (!cached && !force) {
      return res.json({ success: true, metrics: null, funnel: null });
    }
    const data = await aiService.hiringAnalytics(req.user.companyId, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const slots = await aiService.suggestInterviewSlots(req.body.participants, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...slots });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.projectKnowledge = async (req, res) => {
  try {
    const data = await aiService.projectKnowledge(req.body.project, req.body.question, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.companyGoalPlanner = async (req, res) => {
  try {
    const data = await aiService.planCompanyGoals(req.body.company, req.body.goals, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.softSkills = async (req, res) => {
  try {
    const force = req.query.generate === 'true' || req.query.regenerate === 'true';
    const cached = await AICache.findOne({ userId: req.user._id, featureName: 'soft-skill-inference' });
    if (!cached && !force) {
      return res.json({ success: true, skills: null });
    }
    const data = await aiService.inferSoftSkills(req.user, req.user._id, { forceRegenerate: force });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.explainScore = async (req, res) => {
  try {
    const data = await aiService.explainScore(req.body.score, req.body.context, req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
