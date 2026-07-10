const mongoose = require('mongoose');

const githubCommitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: Number, required: true },
  sha: { type: String, required: true },
  message: { type: String, default: '' },
  authorName: { type: String, default: '' },
  authorEmail: { type: String, default: '' },
  date: { type: Date },
  url: { type: String, default: '' }
}, { timestamps: true });

githubCommitSchema.index({ user: 1, repoId: 1, sha: 1 }, { unique: true });

module.exports = mongoose.model('GitHubCommit', githubCommitSchema);
