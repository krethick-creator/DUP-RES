const mongoose = require('mongoose');

const githubProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  publicRepos: { type: Number, default: 0 },
  repos: [{
    name: String,
    description: String,
    language: String,
    stars: Number,
    forks: Number,
    topics: [String],
    rank: Number,
    summary: String,
    architecture: String,
    qualityScore: Number
  }],
  totalCommits: { type: Number, default: 0 },
  totalPRs: { type: Number, default: 0 },
  languages: [{ name: String, percentage: Number }],
  portfolioScore: { type: Number, default: 0 },
  contributionAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  contributionScore: { type: Number, default: 0 },
  projectComplexity: { type: Number, default: 0 },
  codingConsistency: { type: Number, default: 0 },
  repositoryQuality: { type: Number, default: 0 },
  commitFrequency: { type: Number, default: 0 },
  topRepository: { type: String, default: '' },
  openSourceContributions: { type: Number, default: 0 },
  aiCandidateSummary: { type: String, default: '' },
  aiSkillDetection: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiResumeProjectDescriptions: [{ type: mongoose.Schema.Types.Mixed }],
  aiTechStackAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiCandidateStrengths: [{ type: String }],
  aiCandidateWeaknesses: [{ type: String }],
  aiInterviewQuestions: [{ type: mongoose.Schema.Types.Mixed }],
  lastSynced: Date
}, { timestamps: true });

module.exports = mongoose.model('GitHubProfile', githubProfileSchema);
