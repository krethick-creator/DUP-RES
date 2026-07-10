const mongoose = require('mongoose');

const githubStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalCommits: { type: Number, default: 0 },
  totalPRs: { type: Number, default: 0 },
  totalIssues: { type: Number, default: 0 },
  contributionScore: { type: Number, default: 0 },
  codingStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSynced: { type: Date, default: Date.now }
}, { timestamps: true });


module.exports = mongoose.model('GitHubStats', githubStatsSchema);
