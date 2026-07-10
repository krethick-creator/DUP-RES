const mongoose = require('mongoose');

const githubLanguageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  bytes: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 }
}, { timestamps: true });

githubLanguageSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('GitHubLanguage', githubLanguageSchema);
