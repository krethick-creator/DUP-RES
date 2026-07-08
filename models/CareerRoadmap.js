const mongoose = require('mongoose');

const careerRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Career Roadmap' },
  nodes: [{
    id: String,
    type: { type: String, enum: ['skill', 'project', 'company', 'certification', 'achievement', 'experience', 'goal'] },
    label: String,
    description: String,
    x: Number,
    y: Number,
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    targetDate: Date
  }],
  connections: [{
    from: String,
    to: String
  }],
  progress: { type: Number, default: 0 },
  skillGaps: [{ skill: String, current: Number, required: Number }],
  goals: [{ title: String, deadline: Date, completed: Boolean }]
}, { timestamps: true });

module.exports = mongoose.model('CareerRoadmap', careerRoadmapSchema);
