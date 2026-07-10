const mongoose = require('mongoose');

const githubContributionStatsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  weeklyActivity: { type: mongoose.Schema.Types.Mixed, default: {} },
  monthlyActivity: { type: mongoose.Schema.Types.Mixed, default: {} },
  longestStreak: { type: Number, default: 0 },
  codingStreak: { type: Number, default: 0 },
  heatmap: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('GitHubContributionStats', githubContributionStatsSchema);
