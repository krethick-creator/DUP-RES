const mongoose = require('mongoose');

const oAuthAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  providerUserId: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique composite index for userId + provider
oAuthAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('OAuthAccount', oAuthAccountSchema);
