const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

const getTargetUserId = (req) => {
  if (req.user.role === 'recruiter' && req.query.candidateId) {
    return req.query.candidateId;
  }
  return req.user._id;
};

router.get('/profile', protect, async (req, res) => {
  const User = require('../models/User');
  const targetUserId = getTargetUserId(req);
  const user = await User.findById(targetUserId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({
    connected: user.linkedinConnected || false,
    name: user.linkedinName || '',
    email: user.linkedinEmail || '',
    picture: user.linkedinProfilePicture || '',
    linkedinId: user.linkedinId || '',
    lastSynced: user.lastLinkedInSync || null,
    publicProfile: user.linkedinProfileUrl || ''
  });
});

module.exports = router;
