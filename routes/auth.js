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

module.exports = router;
