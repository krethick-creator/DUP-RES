const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' },
  category: { type: String, enum: ['api', 'oauth', 'email', 'database', 'security', 'feature'], default: 'api' },
  isSecret: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
