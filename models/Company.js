const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  website: { type: String, default: '' },
  industry: { type: String, default: '' },
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'], default: '11-50' },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  subscription: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
  subscriptionExpiry: Date,
  recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
