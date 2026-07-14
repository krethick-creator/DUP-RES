const aiService = require('../services/aiService');
const GitHubProfile = require('../models/GitHubProfile');
const CareerRoadmap = require('../models/CareerRoadmap');
const Assessment = require('../models/Assessment');
const AICache = require('../models/AICache');
const GitHubRepository = require('../models/GitHubRepository');
const githubService = require('../services/githubService');

exports.githubConnect = async (req, res) => {
  try {
    // If first connect or already connected, automatically sync using user's stored OAuth token
    if (!req.user.githubConnected) {
      return res.status(400).json({ success: false, message: 'Please connect your GitHub account via OAuth first.' });
    }

    // syncAllGitHubData checks cache and only calls GitHub if lastSynced is older than 24h or forceSync is true
    const synced = await githubService.syncAllGitHubData(req.user._id, false);
    const analysis = await aiService.analyzeGitHub(synced.repos, req.user, req.user._id, { forceRegenerate: false });

    const profile = await GitHubProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
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

    res.json({ success: true, profile, repositories: synced.repos });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGitHubProfile = async (req, res) => {
  try {
    // Determine which user profile to fetch (logged-in user or candidate ID passed by recruiter)
    let targetUserId = req.user._id;
    if (req.user.role === 'recruiter' && req.query.candidateId) {
      targetUserId = req.query.candidateId;
    }

    const profile = await GitHubProfile.findOne({ user: targetUserId });
    const repositories = await GitHubRepository.find({ user: targetUserId });
    res.json({ success: true, profile, repositories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncGitHub = async (req, res) => {
  try {
    const userId = req.user._id;
    // Always force sync when clicking 'Sync GitHub'
    const synced = await githubService.syncAllGitHubData(userId, true);
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

const getTargetUserId = (req) => {
  if (req.user.role === 'recruiter' && req.query.candidateId) {
    return req.query.candidateId;
  }
  return req.user._id;
};

exports.getRepositoryAnalysis = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repoName = req.params.repoName;
    const repo = await GitHubRepository.findOne({ user: targetUserId, name: repoName });
    if (!repo) return res.status(404).json({ success: false, message: 'Repository not found' });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.analyzeRepository(repo, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommitAnalysis = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const commits = await GitHubCommit.find({ user: targetUserId });
    const stats = await GitHubContributionStats.findOne({ user: targetUserId });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.analyzeCommits(commits, stats || {}, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPRAnalysis = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const pulls = await GitHubPullRequest.find({ user: targetUserId });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.analyzePullRequests(pulls, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIssueAnalysis = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const issues = await GitHubIssue.find({ user: targetUserId });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.analyzeIssues(issues, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGeneratedResume = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repos = await GitHubRepository.find({ user: targetUserId });
    const languages = await GitHubLanguage.find({ user: targetUserId });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.generateResumeFromGitHub(repos, languages, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDetectedSkills = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repos = await GitHubRepository.find({ user: targetUserId });
    const languages = await GitHubLanguage.find({ user: targetUserId });
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.detectSkills(repos, languages, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanyMatch = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const profile = await GitHubProfile.findOne({ user: targetUserId });
    if (!profile) return res.status(404).json({ success: false, message: 'GitHub Profile cache not found' });
    const jobSkills = req.body.jobSkills || [];
    const job = req.body.job || {};
    const force = req.query.regenerate === 'true';
    const analysis = await aiService.companyMatching(profile, jobSkills, job, targetUserId, { forceRegenerate: force });
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCandidateInsights = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const profile = await GitHubProfile.findOne({ user: targetUserId });
    const repos = await GitHubRepository.find({ user: targetUserId });
    const languages = await GitHubLanguage.find({ user: targetUserId });
    const stats = await GitHubContributionStats.findOne({ user: targetUserId });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Candidate has not connected GitHub or synced profile yet.' });
    }

    res.json({
      success: true,
      profile,
      repositoriesCount: repos.length,
      languages,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// AI PROJECT WORKSPACE CONTROLLERS
// ==========================================

const AIContextBuilder = require('../services/AIContextBuilder');
const { generateStructuredContent } = require('../services/geminiClient');

const MOCK_FILES = {
  'package.json': `{
  "name": "ai-talent-recruitment",
  "version": "1.0.0",
  "description": "Premium AI-Powered Talent Evaluation and Recruitment Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "@google/genai": "^0.1.1",
    "jsonwebtoken": "^9.0.1",
    "bcryptjs": "^2.4.3",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6"
  }
}`,
  'server.js': `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/talent-ai')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('App running on port 5000');
});

const io = socketIo(server);
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});
`,
  'README.md': `# AI Recruitment Platform

A production-grade application facilitating technical evaluation of candidates through GitHub portfolios, resume analysis, and real-time coding workspace tools.

## Architecture

- **Backend**: Express.js with Mongoose ODM and MongoDB caching.
- **Frontend**: Custom Vanilla JS and CSS SPA Dashboard with Monaco Editor integration.
- **AI Engine**: Gemini 2.5 Flash for ATS scoring, resume alignment, and project assessments.

## Run Locally

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
  'docker-compose.yml': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://db:27017/talent-ai
      - JWT_SECRET=supersecret
    depends_on:
      - db

  db:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
`,
  'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  'src/App.js': `import React from 'react';

function App() {
  return (
    <div className="App" style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Welcome to AI Project IDE Workspace</h1>
      <p>Select files from the Repository Explorer on the left sidebar to inspect and interact.</p>
    </div>
  );
}

export default App;
`,
  'src/components/Auth.js': `import React, { useState } from 'react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
  );
}
`,
  'src/components/Dashboard.js': `import React from 'react';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <h3>Candidate Dashboard</h3>
      <p>Synchronize resume and LinkedIn data instantly.</p>
    </div>
  );
}
`,
  'models/User.js': `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
  skills: [{ type: String }],
  githubConnected: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
`,
  'controllers/authController.js': `const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  res.json({ success: true, token, user });
};
`,
  'middleware/auth.js': `const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
`
};

const getGithubHeaders = async (userId) => {
  const User = require('../models/User');
  const config = require('../config');
  const user = await User.findById(userId).select('+githubAccessToken');
  if (!user) return null;
  const token = user.githubAccessToken || config.github.pat;
  const headers = {
    'User-Agent': 'ai-recruitment-platform',
    'Accept': 'application/vnd.github+json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// GET /api/ai/project-workspace/tree/:repoName
exports.getProjectTree = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repoName = req.params.repoName;
    const repo = await GitHubRepository.findOne({ user: targetUserId, name: repoName });
    
    if (!repo) {
      // Fallback: return mock tree
      return res.json({ success: true, tree: Object.keys(MOCK_FILES).map(p => ({ path: p, type: p.includes('/') ? 'file' : 'file' })) });
    }

    const headers = await getGithubHeaders(targetUserId);
    const profile = await GitHubProfile.findOne({ user: targetUserId });
    const owner = profile?.username || req.user.githubUsername || 'owner';

    // Query GitHub API recursively
    const branch = repo.defaultBranch || 'main';
    const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`;
    
    const response = await fetch(treeUrl, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    res.json({ success: true, tree: data.tree || [] });
  } catch (error) {
    // Graceful fallback to mock project tree structure
    const tree = Object.keys(MOCK_FILES).map(path => {
      return { path, type: 'file' };
    });
    res.json({ success: true, tree, source: 'mock', message: error.message });
  }
};

// GET /api/ai/project-workspace/file/:repoName
exports.getProjectFile = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repoName = req.params.repoName;
    const filePath = req.query.path || '';

    if (MOCK_FILES[filePath]) {
      return res.json({ success: true, content: MOCK_FILES[filePath], path: filePath });
    }

    const repo = await GitHubRepository.findOne({ user: targetUserId, name: repoName });
    if (!repo) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const headers = await getGithubHeaders(targetUserId);
    const profile = await GitHubProfile.findOne({ user: targetUserId });
    const owner = profile?.username || req.user.githubUsername || 'owner';
    const branch = repo.defaultBranch || 'main';

    const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`;
    const response = await fetch(fileUrl, { headers });
    if (!response.ok) {
      throw new Error('File fetch failed');
    }
    const data = await response.json();
    if (data.content) {
      const decodedContent = Buffer.from(data.content, 'base64').toString('utf8');
      return res.json({ success: true, content: decodedContent, path: filePath });
    }
    res.status(400).json({ success: false, message: 'Invalid file format' });
  } catch (error) {
    if (MOCK_FILES[filePath]) {
      return res.json({ success: true, content: MOCK_FILES[filePath], path: filePath, source: 'mock' });
    }
    res.status(404).json({ success: false, message: 'File not found / API rate limit reached', error: error.message });
  }
};

// POST /api/ai/project-workspace/chat
exports.projectWorkspaceChat = async (req, res) => {
  try {
    const { repoName, question, history, candidateId } = req.body;
    const targetUserId = candidateId || req.user._id;

    const fullContext = await AIContextBuilder.buildContext(targetUserId);
    const textContext = AIContextBuilder.formatPromptContext(fullContext);

    // AI summary cached inside database
    const featureName = `project-chat-${repoName}-${question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '')}`;
    const cached = await AICache.findOne({ userId: targetUserId, featureName });
    if (cached) {
      return res.json({ success: true, response: cached.generatedData.response, source: 'cache' });
    }

    const prompt = `
      You are the AI Project Knowledge Assistant.
      Answer the question about this repository "${repoName}" based ONLY on the candidate's profile, resume, LinkedIn, and GitHub repositories.
      
      Here is the unified candidate context:
      ${textContext}

      Current Question: "${question}"
      
      Formulate a detailed, premium, professional markdown response answering the question. If the user asks about Docker, JWT, database, etc. explain it reference to the files and details provided. Do not invent any outside details, rely on standard implementations matching their technologies.
      
      Return a JSON object:
      {
        "response": "markdown response here"
      }
    `;

    let responseText = "Placeholder explanation: This project uses a full-stack node and react environment. JWT is implemented for secure token validation. Express middleware handles credentials parsing.";
    if (process.env.AI_ENABLED === "true") {
      try {
        const result = await generateStructuredContent(prompt, { temperature: 0.3 });
        if (result && result.response) {
          responseText = result.response;
        }
      } catch (err) {
        console.error('Gemini call failed in IDE assistant chat:', err);
      }
    }

    const dataToSave = { response: responseText };
    await AICache.findOneAndUpdate(
      { userId: targetUserId, featureName },
      { userId: targetUserId, featureName, generatedData: dataToSave, lastActualCallAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true, response: responseText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/project-workspace/intelligence/:repoName
exports.getProjectIntelligence = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repoName = req.params.repoName;
    const force = req.query.regenerate === 'true';

    const featureName = `project-intelligence-${repoName}`;
    if (!force) {
      const cached = await AICache.findOne({ userId: targetUserId, featureName });
      if (cached) {
        return res.json({ success: true, intelligence: cached.generatedData, source: 'cache' });
      }
    }

    const fullContext = await AIContextBuilder.buildContext(targetUserId);
    const textContext = AIContextBuilder.formatPromptContext(fullContext);

    const prompt = `
      Analyze the repository "${repoName}" for candidate ${fullContext.profile.name}.
      Based on the profile, project context, and file list, evaluate the following:
      - Project Overview
      - Architecture Summary
      - Folder Explanation
      - Technology Stack
      - Database Flow
      - Authentication Flow
      - API Flow
      - Dependencies
      - Code Complexity Score (1-100)
      - Contribution Summary
      - Repository Timeline
      - Commit Summary
      - Important Files
      - Unused Files
      - Dead Code Detection
      - Security Warnings
      - Project Score (1-100)
      - Portfolio Score (1-100)
      - Technical Score (1-100)
      - Interview Difficulty (Easy/Medium/Hard)
      - ATS Project Score (1-100)

      Return a JSON object exactly with these fields:
      {
        "projectOverview": "Description",
        "architectureSummary": "Summary",
        "folderExplanation": "Explanation",
        "techStack": ["React", "Express", "MongoDB"],
        "databaseFlow": "Flow description",
        "authFlow": "Auth flow details",
        "apiFlow": "API paths description",
        "dependencies": ["express", "mongoose"],
        "codeComplexity": 78,
        "contributionSummary": "Contribution details",
        "timeline": "Timeline summary",
        "commitSummary": "Commits summary",
        "importantFiles": ["server.js", "controllers/authController.js"],
        "unusedFiles": ["test-old.js"],
        "deadCode": "Dead code details",
        "securityWarnings": ["Outdated packages", "JWT secret hardcoded in fallback mode"],
        "projectScore": 85,
        "portfolioScore": 88,
        "technicalScore": 90,
        "interviewDifficulty": "Medium",
        "atsScore": 87
      }
    `;

    const fallback = {
      projectOverview: "An advanced Full-Stack Talent Management platform utilizing AI engines for parsing, evaluating, and filtering candidate profiles.",
      architectureSummary: "A Model-View-Controller (MVC) server-side layout built with Express, integrated with a React Single Page Application frontend.",
      folderExplanation: "Root contains the backend files, server.js handles connection, models holds schemas, client contains client dashboard UI assets.",
      techStack: ["Node.js", "Express.js", "React.js", "MongoDB", "Socket.IO", "Monaco Editor"],
      databaseFlow: "Candidate profiles are synced and stored in MongoDB. AI caching layers are saved inside AICache schema.",
      authFlow: "Uses JSON Web Token (JWT) verification inside Express middleware and local browser token storage.",
      apiFlow: "REST APIs are available under /api/auth, /api/github, and /api/ai endpoints.",
      dependencies: ["express", "mongoose", "jsonwebtoken", "bcryptjs", "socket.io"],
      codeComplexity: 78,
      contributionSummary: "Strong commit velocity with documentation benchmarks. Focused on core components, database integration, and helper scripts.",
      timeline: "Development started recently with major contributions to authorization and model setups.",
      commitSummary: "Initial schema creation, auth controller implementation, front-end dashboard alignment.",
      importantFiles: ["server.js", "controllers/authController.js", "models/User.js"],
      unusedFiles: ["temp-script.js"],
      deadCode: "No significant dead code identified. Deprecated local auth paths are clean.",
      securityWarnings: ["Hardcoded secrets in default settings", "Limiter package configuration missing production rates"],
      projectScore: 84,
      portfolioScore: 82,
      technicalScore: 86,
      interviewDifficulty: "Medium",
      atsScore: 85
    };

    let resultData = fallback;
    if (process.env.AI_ENABLED === "true") {
      try {
        const result = await generateStructuredContent(prompt, { temperature: 0.2 });
        if (result) resultData = { ...fallback, ...result };
      } catch (err) {
        console.error('Gemini call failed for project intelligence:', err);
      }
    }

    await AICache.findOneAndUpdate(
      { userId: targetUserId, featureName },
      { userId: targetUserId, featureName, generatedData: resultData, lastActualCallAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true, intelligence: resultData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/project-workspace/visualizations/:repoName
exports.getProjectVisualizations = async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const repoName = req.params.repoName;
    const force = req.query.regenerate === 'true';

    const featureName = `project-viz-${repoName}`;
    if (!force) {
      const cached = await AICache.findOne({ userId: targetUserId, featureName });
      if (cached) {
        return res.json({ success: true, visualizations: cached.generatedData, source: 'cache' });
      }
    }

    const fullContext = await AIContextBuilder.buildContext(targetUserId);
    const textContext = AIContextBuilder.formatPromptContext(fullContext);

    const prompt = `
      Create architecture, database, dependency, and mind map visualizations for candidate ${fullContext.profile.name}'s repository "${repoName}".
      Provide clean, working Mermaid.js diagrams for:
      - Dependency Graph
      - Architecture Diagram
      - Database Relationship Diagram
      - API Flow Diagram
      - Technology Mind Map

      Return a JSON object exactly with these fields:
      {
        "dependencyGraph": "Mermaid diagram code here",
        "architectureDiagram": "Mermaid diagram code here",
        "databaseDiagram": "Mermaid diagram code here",
        "apiFlowDiagram": "Mermaid diagram code here",
        "mindMap": "Mermaid diagram code here"
      }
    `;

    const fallback = {
      dependencyGraph: `graph TD
  App[app.js] --> Express[express]
  App --> Mongoose[mongoose]
  App --> JWT[jsonwebtoken]
  Mongoose --> MongoDB[(MongoDB)]`,
      architectureDiagram: `graph LR
  Client[SPA Client] <--> LoadBalancer[Express Port 5000]
  LoadBalancer <--> Controllers[Controllers]
  Controllers <--> Models[Mongoose Models]
  Models <--> DB[(MongoDB Cache)]`,
      databaseDiagram: `erDiagram
  User ||--o{ Resume : uploads
  User ||--o{ Assessment : completes
  User ||--o{ GitHubRepository : syncs
  User {
    string id
    string name
    string email
  }
  Resume {
    string filename
    string score
  }`,
      apiFlowDiagram: `graph TD
  Request[Client Request] --> AuthCheck{Auth Middleware}
  AuthCheck -- Success --> Controller[Execute Controller]
  AuthCheck -- Fail --> Error[401 Unauthorized]
  Controller --> DBQuery[Mongoose DB Call]
  DBQuery --> Response[Send JSON Response]`,
      mindMap: `graph TD
  Root[Project Stack]
  Root --> Backend[Node.js / Express]
  Root --> Frontend[Vanilla SPA / Charts]
  Root --> Database[MongoDB Cache]
  Root --> AI[Gemini 2.5 API]`
    };

    let resultData = fallback;
    if (process.env.AI_ENABLED === "true") {
      try {
        const result = await generateStructuredContent(prompt, { temperature: 0.2 });
        if (result) resultData = { ...fallback, ...result };
      } catch (err) {
        console.error('Gemini call failed for project visualizations:', err);
      }
    }

    await AICache.findOneAndUpdate(
      { userId: targetUserId, featureName },
      { userId: targetUserId, featureName, generatedData: resultData, lastActualCallAt: new Date() },
      { upsert: true }
    );

    res.json({ success: true, visualizations: resultData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/candidate-intelligence/:candidateId
exports.getCandidateIntelligence = async (req, res) => {
  try {
    const candidateId = req.params.candidateId;
    const fullContext = await AIContextBuilder.buildContext(candidateId);

    // Generate summary details for timelines
    const resumeScore = fullContext.resume?.atsScore || 78;
    const githubScore = fullContext.github?.portfolioScore || 70;
    const codingScore = fullContext.assessments?.[0]?.score || 80;
    const interviewScore = 82;
    const learningScore = 85;
    const careerScore = 88;
    const portfolioScore = 80;
    const atsScore = resumeScore;

    // Compile timeline events
    const timeline = [];
    if (fullContext.resume) {
      (fullContext.resume.experience || []).forEach((exp, idx) => {
        timeline.push({
          id: `exp-${idx}`,
          title: exp.role,
          subtitle: exp.company,
          description: exp.description,
          date: exp.duration,
          type: 'experience',
          icon: '💼'
        });
      });
      (fullContext.resume.education || []).forEach((edu, idx) => {
        timeline.push({
          id: `edu-${idx}`,
          title: edu.degree,
          subtitle: edu.institution,
          description: '',
          date: edu.year,
          type: 'education',
          icon: '🎓'
        });
      });
      (fullContext.resume.certifications || []).forEach((cert, idx) => {
        timeline.push({
          id: `cert-${idx}`,
          title: cert,
          subtitle: 'Certified',
          description: '',
          date: 'Completed',
          type: 'certificate',
          icon: '📜'
        });
      });
    }

    // Add github contributions to timeline
    if (fullContext.github) {
      (fullContext.github.repositories || []).slice(0, 5).forEach((repo, idx) => {
        timeline.push({
          id: `repo-${idx}`,
          title: `Project: ${repo.name}`,
          subtitle: `GitHub Repository (${repo.language})`,
          description: repo.description,
          date: `${repo.stars} stars • ${repo.commitsCount} commits`,
          type: 'project',
          icon: '🐙'
        });
      });
    }

    res.json({
      success: true,
      context: fullContext,
      scores: {
        resumeScore,
        githubScore,
        portfolioScore,
        codingScore,
        interviewScore,
        learningScore,
        careerScore,
        atsScore
      },
      timeline: timeline.sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Intercept recruiterAssistant to fetch unified context automatically
const originalRecruiterAssistant = exports.recruiterAssistant;
exports.recruiterAssistant = async (req, res) => {
  try {
    const { query, candidateId } = req.body;
    if (candidateId) {
      const fullContext = await AIContextBuilder.buildContext(candidateId);
      const textContext = AIContextBuilder.formatPromptContext(fullContext);
      req.body.context = textContext;
    }
    const aiService = require('../services/aiService');
    const data = await aiService.recruiterAssistant(req.body.query, req.body.context || 'Guest profile', req.user._id, { forceRegenerate: true });
    res.json({ success: true, ...data });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};


