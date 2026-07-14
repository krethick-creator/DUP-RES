const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], validate, auth.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], validate, auth.login);

router.post('/logout', auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, auth.updateProfile);
router.post('/forgot-password', body('email').isEmail(), validate, auth.forgotPassword);
router.put('/reset-password/:token', body('password').isLength({ min: 6 }), validate, auth.resetPassword);
router.get('/verify/:token', auth.verifyEmail);

router.get('/notifications', protect, auth.getNotifications);
router.put('/notifications/:id/read', protect, auth.markNotificationRead);
router.get('/search', protect, auth.globalSearch);

router.get('/github', auth.githubAuth);
router.get('/github/callback', auth.githubCallback);
router.post('/github/disconnect', protect, auth.githubDisconnect);

// Google OAuth Preparation
router.get('/google', auth.googleAuth);
router.get('/google/callback', auth.googleCallback);
router.get('/google/status', auth.googleStatus);
router.post('/google/disconnect', protect, auth.googleDisconnect);

// Recruiter Email Center Routes
router.post('/google/send', protect, auth.recruiterSendEmail);
router.post('/google/reply', protect, auth.recruiterReplyEmail);
router.get('/google/emails', protect, auth.recruiterGetEmails);
router.post('/google/sync', protect, auth.recruiterSyncInbox);

// LinkedIn OAuth Preparation
router.get('/linkedin', auth.linkedinAuth);
router.get('/linkedin/callback', auth.linkedinCallback);
router.get('/linkedin/status', auth.linkedinStatus);
router.post('/linkedin/disconnect', protect, auth.linkedinDisconnect);
router.post('/linkedin/sync', protect, auth.linkedinSync);

module.exports = router;
