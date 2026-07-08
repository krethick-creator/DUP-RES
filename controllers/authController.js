const User = require('../models/User');
const { sendTokenResponse } = require('../utils/token');
const { generateResetToken, generateVerificationToken } = require('../utils/crypto');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const verificationToken = generateVerificationToken();
    const user = await User.create({
      name, email, password,
      role: role || 'candidate',
      verificationToken
    });

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Click to verify: <a href="${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}">Verify Email</a></p>`
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Please use ${user.role} login` });
    }
    user.lastLogin = new Date();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });

    const { token, hashed, expire } = generateResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = expire;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Reset token: ${token}</p><p>Use PUT /api/auth/reset-password/${token}</p>`
    });

    res.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const fields = ['name', 'phone', 'location', 'bio', 'skills', 'darkMode', 'githubUsername'];
    fields.forEach((f) => { if (req.body[f] !== undefined) req.user[f] = req.body[f]; });
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
