const User = require('../models/User');
const { sendTokenResponse } = require('../utils/token');
const { generateResetToken, generateVerificationToken } = require('../utils/crypto');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');
const Notification = require('../models/Notification');
const Job = require('../models/Job');

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

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
    const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, notifications, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, results: [] });
    const regex = new RegExp(q, 'i');
    const [users, jobs] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('name email role').limit(5),
      Job.find({ $or: [{ title: regex }, { description: regex }] }).populate('company', 'name').limit(5)
    ]);
    res.json({ success: true, results: { users, jobs } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.githubAuth = (req, res) => {
  const { token } = req.query;
  const config = require('../config');
  const clientId = config.github.clientId;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(token)}&scope=user,repo`;
  res.redirect(githubUrl);
};

exports.githubCallback = async (req, res) => {
  const { code, state } = req.query;
  const config = require('../config');
  const clientId = config.github.clientId;
  const clientSecret = config.github.clientSecret;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(state, config.jwt.secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).send('User not found');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });
   const tokenData = await tokenRes.json();

console.log("GitHub Token Response:");
console.log(tokenData);

const accessToken = tokenData.access_token;

if (!accessToken) {
    return res.status(400).json(tokenData);
}

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ai-recruitment-platform'
      }
    });
    const profileData = await profileRes.json();

    let email = profileData.email || '';
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'ai-recruitment-platform'
        }
      });
      const emails = await emailRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find(e => e.primary) || emails[0];
        email = primary?.email || '';
      }
    }

    user.githubId = String(profileData.id);
    user.githubUsername = profileData.login;
    user.githubName = profileData.name || profileData.login;
    user.githubEmail = email;
    user.githubAvatar = profileData.avatar_url;
    user.githubAccessToken = accessToken;
    user.githubProfileUrl = profileData.html_url;
    user.githubConnected = true;
    await user.save();

    const roleRoutes = { candidate: 'candidate', recruiter: 'recruiter' };
    res.redirect(`${config.clientUrl}/#/${roleRoutes[user.role] || 'candidate'}/github`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
};
