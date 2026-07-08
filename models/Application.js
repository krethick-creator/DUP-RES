const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  status: {
    type: String,
    enum: ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  aiScore: { type: Number, default: 0 },
  skillMatch: { type: Number, default: 0 },
  ranking: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  interviewDate: Date,
  offerLetter: { type: String, default: '' },
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
