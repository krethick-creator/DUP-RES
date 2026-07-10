const mongoose = require('mongoose');

const githubRepositorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: Number, required: true },
  name: { type: String, required: true },
  fullName: { type: String },
  description: { type: String },
  htmlUrl: { type: String },
  size: { type: Number },
  stars: { type: Number },
  forks: { type: Number },
  watchers: { type: Number },
  openIssuesCount: { type: Number },
  language: { type: String },
  languages: { type: mongoose.Schema.Types.Mixed },
  topics: [{ type: String }],
  createdDate: { type: Date },
  updatedDate: { type: Date },
  defaultBranch: { type: String },
  readme: { type: String },
  license: { type: String },
  homepage: { type: String },
  archived: { type: Boolean },
  visibility: { type: String },
  latestCommit: { type: mongoose.Schema.Types.Mixed },
  commits: [{ type: mongoose.Schema.Types.Mixed }],
  pullRequests: [{ type: mongoose.Schema.Types.Mixed }],
  issues: [{ type: mongoose.Schema.Types.Mixed }],
  contributors: [{ type: mongoose.Schema.Types.Mixed }],
  branches: [{ type: String }],
  releases: [{ type: mongoose.Schema.Types.Mixed }],
  contributionActivity: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

githubRepositorySchema.index({ user: 1, repoId: 1 }, { unique: true });

module.exports = mongoose.model('GitHubRepository', githubRepositorySchema);
