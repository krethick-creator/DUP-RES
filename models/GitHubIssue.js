const mongoose = require('mongoose');

const githubIssueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: Number, required: true },
  issueId: { type: Number, required: true },
  title: { type: String, default: '' },
  state: { type: String, default: '' },
  number: { type: Number },
  htmlUrl: { type: String, default: '' },
  createdDate: { type: Date },
  closedDate: { type: Date },
  userLogin: { type: String, default: '' },
  isPullRequest: { type: Boolean, default: false }
}, { timestamps: true });

githubIssueSchema.index({ user: 1, repoId: 1, issueId: 1 }, { unique: true });

module.exports = mongoose.model('GitHubIssue', githubIssueSchema);
