const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: String,
  level: { type: String, enum: ['info', 'warn', 'error', 'security'], default: 'info' }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
