const express = require('express');
const { protect } = require('../middleware/auth');
const GitHubProfile = require('../models/GitHubProfile');
const GitHubRepository = require('../models/GitHubRepository');
const GitHubCommit = require('../models/GitHubCommit');
const GitHubPullRequest = require('../models/GitHubPullRequest');
const GitHubIssue = require('../models/GitHubIssue');
const GitHubLanguage = require('../models/GitHubLanguage');
const GitHubStats = require('../models/GitHubStats');
const githubService = require('../services/githubService');

const router = express.Router();

router.use(protect);

const getOrSyncProfile = async (targetUserId) => {
  const User = require('../models/User');
  const user = await User.findById(targetUserId).select('+githubAccessToken');
  if (!user || !user.githubConnected) {
    return null;
  }
  let profile = await GitHubProfile.findOne({ user: targetUserId });
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (!profile || !profile.lastSynced || profile.lastSynced < oneDayAgo) {
    const syncResult = await githubService.syncAllGitHubData(targetUserId, false);
    profile = syncResult.profile;
  }
  return profile;
};

const getTargetUserId = (req) => {
  if (req.user.role === 'recruiter' && req.query.candidateId) {
    return req.query.candidateId;
  }
  return req.user._id;
};

// GET /api/github/profile
router.get('/profile', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const profile = await getOrSyncProfile(targetUserId);
    const stats = await GitHubStats.findOne({ user: targetUserId });
    res.json({ success: true, profile, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/github/repositories
router.get('/repositories', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    await getOrSyncProfile(targetUserId);
    const repositories = await GitHubRepository.find({ user: targetUserId });
    res.json({ success: true, repositories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/github/commits
router.get('/commits', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const commits = await GitHubCommit.find({ user: targetUserId });
    res.json({ success: true, commits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/github/pullrequests
router.get('/pullrequests', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const pullrequests = await GitHubPullRequest.find({ user: targetUserId });
    res.json({ success: true, pullrequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/github/issues
router.get('/issues', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const issues = await GitHubIssue.find({ user: targetUserId });
    res.json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/github/languages
router.get('/languages', async (req, res) => {
  try {
    const targetUserId = getTargetUserId(req);
    const languages = await GitHubLanguage.find({ user: targetUserId });
    res.json({ success: true, languages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/github/sync
router.post('/sync', async (req, res) => {
  try {
    const userId = req.user._id;
    const data = await githubService.syncAllGitHubData(userId, true);
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
