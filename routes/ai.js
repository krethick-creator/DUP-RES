const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ai = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

// GitHub
router.post('/github/connect', ai.githubConnect);
router.get('/github/profile', ai.getGitHubProfile);
router.post('/github/sync', ai.syncGitHub);
router.get('/github/insights', ai.getCandidateInsights);
router.get('/github/analysis/repo/:repoName', ai.getRepositoryAnalysis);
router.get('/github/analysis/commits', ai.getCommitAnalysis);
router.get('/github/analysis/prs', ai.getPRAnalysis);
router.get('/github/analysis/issues', ai.getIssueAnalysis);
router.get('/github/analysis/resume', ai.getGeneratedResume);
router.get('/github/analysis/skills', ai.getDetectedSkills);
router.post('/github/analysis/match', ai.getCompanyMatch);

// Career
router.get('/roadmap', authorize('candidate'), ai.getRoadmap);
router.put('/roadmap', authorize('candidate'), ai.updateRoadmap);
router.get('/roadmap/analyze', authorize('candidate'), ai.analyzeRoadmap);
router.get('/leaderboard', ai.getLeaderboard);
router.get('/benchmarks', authorize('candidate'), ai.getBenchmarks);
router.get('/career-growth', authorize('candidate'), ai.getCareerGrowth);
router.get('/learning-score', authorize('candidate'), ai.getLearningScore);
router.get('/learning-roadmap', authorize('candidate'), ai.getLearningRoadmap);
router.get('/job-recommendations', authorize('candidate'), ai.recommendJobs);

// Assessments
router.post('/assessments', authorize('candidate'), ai.createAssessment);
router.get('/assessments', authorize('candidate'), ai.getAssessments);
router.post('/assessments/:id/submit', authorize('candidate'), ai.submitAssessment);

// AI Tools
router.post('/interview-questions', ai.generateInterviewQuestions);
router.post('/candidate-ai', authorize('candidate'), ai.candidateAI);
router.post('/recruiter-assistant', authorize('recruiter'), ai.recruiterAssistant);
router.get('/hiring-analytics', authorize('recruiter'), ai.hiringAnalytics);
router.post('/schedule-interview', ai.scheduleInterview);
router.post('/project-knowledge', ai.projectKnowledge);
router.post('/company-goals', ai.companyGoalPlanner);
router.get('/soft-skills', ai.softSkills);
router.post('/explain-score', ai.explainScore);

module.exports = router;
