const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['coding', 'code-review', 'interview'], default: 'coding' },
  title: String,
  language: String,
  code: String,
  questions: [{ question: String, answer: String, score: Number }],
  score: { type: Number, default: 0 },
  feedback: { type: mongoose.Schema.Types.Mixed, default: {} },
  aiReview: String,
  duration: Number,
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
