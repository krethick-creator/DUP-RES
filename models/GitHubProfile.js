const mongoose = require('mongoose');

const githubProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true },
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
  lastSynced: Date
}, { timestamps: true });

module.exports = mongoose.model('GitHubProfile', githubProfileSchema);
