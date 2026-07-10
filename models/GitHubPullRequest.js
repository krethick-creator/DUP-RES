const mongoose = require('mongoose');

const githubPullRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: Number, required: true },
  prId: { type: Number, required: true },
  title: { type: String, default: '' },
  state: { type: String, default: '' },
  number: { type: Number },
  htmlUrl: { type: String, default: '' },
  createdDate: { type: Date },
  closedDate: { type: Date },
  mergedDate: { type: Date },
  userLogin: { type: String, default: '' }
}, { timestamps: true });

githubPullRequestSchema.index({ user: 1, repoId: 1, prId: 1 }, { unique: true });

module.exports = mongoose.model('GitHubPullRequest', githubPullRequestSchema);
