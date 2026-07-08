const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true },
  parsed: {
    name: String,
    email: String,
    phone: String,
    summary: String,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }],
    certifications: [String]
  },
  score: { type: Number, default: 0 },
  authenticityScore: { type: Number, default: 100 },
  dynamicVersion: { type: String, default: '' },
  simulationResults: { type: mongoose.Schema.Types.Mixed, default: {} },
  improvementReport: { type: mongoose.Schema.Types.Mixed, default: {} },
  isPrimary: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
