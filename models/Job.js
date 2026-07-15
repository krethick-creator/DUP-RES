const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  skills: [{ type: String }],
  experienceMin: { type: Number, default: 0 },
  experienceMax: { type: Number, default: 10 },
  salaryMin: { type: Number, default: 0 },
  salaryMax: { type: Number, default: 0 },
  location: { type: String, default: 'Remote' },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
  status: { type: String, enum: ['draft', 'active', 'closed', 'paused'], default: 'active' },
  aiGenerated: { type: Boolean, default: false },
  applicationsCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  recruiterContactEmail: { type: String, trim: true },
  deadline: Date
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
