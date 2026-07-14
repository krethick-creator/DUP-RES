const mongoose = require('mongoose');

const linkedinProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  linkedinId: { type: String, required: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  headline: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  profileUrl: { type: String, default: '' },
  lastSynced: Date
}, { timestamps: true });

module.exports = mongoose.model('LinkedInProfile', linkedinProfileSchema);
