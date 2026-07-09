const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featureName: { type: String, required: true },
  generatedData: { type: mongoose.Schema.Types.Mixed, required: true },
  lastActualCallAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index to quickly look up by userId and featureName
aiCacheSchema.index({ userId: 1, featureName: 1 }, { unique: true });

module.exports = mongoose.model('AICache', aiCacheSchema);
