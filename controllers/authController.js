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
    user.emailVerified = true;
    user.verificationMethod = 'email';
    user.emailVerifiedAt = new Date();
    user.verificationToken = undefined;
    if (!user.communicationEmail) {
      user.communicationEmail = user.email;
    }
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const fields = ['name', 'phone', 'location', 'bio', 'skills', 'darkMode', 'linkedinProfileUrl'];
    fields.forEach((f) => { if (req.body[f] !== undefined) req.user[f] = req.body[f]; });

    if (req.body.email && req.body.email.toLowerCase() !== req.user.email) {
      const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already in use' });

      const verificationToken = generateVerificationToken();
      req.user.email = req.body.email.toLowerCase();
      req.user.isVerified = false;
      req.user.emailVerified = false;
      req.user.verificationToken = verificationToken;
      req.user.verificationMethod = 'email';

      await sendEmail({
        to: req.user.email,
        subject: 'Verify your email change',
        html: `<p>Click to verify: <a href="${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}">Verify Email</a></p>`
      });
    }

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

exports.googleAuth = (req, res) => {
  const { token, role } = req.query;
  const config = require('../config');
  const clientId = config.google.clientId;
  
  if (!clientId || clientId === 'your-google-client-id') {
    return res.status(400).send('OAuth Configuration Error: GOOGLE_CLIENT_ID is not configured in .env file.');
  }
  
  const redirectUri = config.google.redirectUri;
  const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify');
  
  let state = '';
  if (token) {
    state = token;
  } else {
    state = `login:${role || 'candidate'}`;
  }
  
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${encodeURIComponent(state)}&access_type=offline&prompt=consent`;
  res.redirect(googleUrl);
};

exports.googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const config = require('../config');
  const OAuthAccount = require('../models/OAuthAccount');
  const User = require('../models/User');
  const { encrypt } = require('../utils/crypto');
  const jwt = require('jsonwebtoken');

  try {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const profileData = userInfo.data;

    let user;
    let isLoginFlow = false;
    let targetRole = 'candidate';

    if (state && state.startsWith('login:')) {
      isLoginFlow = true;
      targetRole = state.split(':')[1] || 'candidate';

      user = await User.findOne({
        $or: [
          { googleId: profileData.id },
          { googleEmail: profileData.email },
          { email: profileData.email }
        ]
      });

      if (!user) {
        const crypto = require('crypto');
        const randomPassword = crypto.randomBytes(16).toString('hex');
        user = new User({
          name: profileData.name || 'Google User',
          email: profileData.email,
          password: randomPassword,
          role: targetRole
        });
      }
    } else {
      const decoded = jwt.verify(state, config.jwt.secret);
      user = await User.findById(decoded.id);
      if (!user) return res.status(404).send('User not found');
      
      if (user.role !== 'recruiter') {
        return res.status(403).send('Only recruiters can connect Gmail accounts.');
      }
    }

    user.emailVerified = true;
    user.isVerified = true;
    user.verificationMethod = 'google';
    user.emailVerifiedAt = new Date();
    user.verifiedGoogleEmail = profileData.email;
    if (!user.communicationEmail) {
      user.communicationEmail = profileData.email;
    }

    user.googleId = profileData.id;
    user.googleEmail = profileData.email;
    user.googleName = profileData.name;
    user.googlePicture = profileData.picture || '';
    user.googleConnected = true;
    user.lastGoogleSync = new Date();
    await user.save();

    await OAuthAccount.deleteOne({ userId: user._id, provider: 'google' });
    
    await OAuthAccount.create({
      userId: user._id,
      provider: 'google',
      providerUserId: profileData.id,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      connectedAt: new Date(),
      lastSynced: new Date()
    });

    if (isLoginFlow) {
      const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
      res.redirect(`${config.clientUrl}/#/login?token=${token}&role=${user.role}`);
    } else {
      res.redirect(`${config.clientUrl}/#/recruiter/email-center`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const config = require('../config');
    const redirectUrl = `${config.clientUrl}/#/${state && state.startsWith('login:') ? 'login' : 'recruiter/email-center'}?error=${encodeURIComponent(error.message || 'Connection Failed')}`;
    res.redirect(redirectUrl);
  }
};

exports.googleStatus = (req, res) => {
  const config = require('../config');
  const hasId = !!config.google.clientId && config.google.clientId !== 'your-google-client-id';
  const hasSecret = !!config.google.clientSecret && config.google.clientSecret !== 'your-google-client-secret';
  res.json({
    configured: hasId && hasSecret,
    clientIdPresent: hasId,
    clientSecretPresent: hasSecret,
    callbackUrl: config.google.redirectUri,
    routesRegistered: true
  });
};

exports.googleDisconnect = async (req, res) => {
  try {
    const OAuthAccount = require('../models/OAuthAccount');
    req.user.googleConnected = false;
    req.user.googleId = '';
    req.user.googleEmail = '';
    req.user.googleName = '';
    req.user.googlePicture = '';
    req.user.lastGoogleSync = undefined;
    await req.user.save();

    await OAuthAccount.deleteOne({ userId: req.user._id, provider: 'google' });
    res.json({ success: true, message: 'Google disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter Send Email
exports.recruiterSendEmail = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Recruiter access only' });
    }
    const gmailService = require('../services/gmailService');
    const result = await gmailService.sendEmail(req.user._id, req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter Reply to Email Thread
exports.recruiterReplyEmail = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Recruiter access only' });
    }
    const gmailService = require('../services/gmailService');
    const result = await gmailService.replyEmail(req.user._id, req.body.threadId, req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter Get Categorized Emails
exports.recruiterGetEmails = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Recruiter access only' });
    }
    const OAuthAccount = require('../models/OAuthAccount');
    const account = await OAuthAccount.findOne({ userId: req.user._id, provider: 'google' });
    if (!account) {
      return res.json({ success: true, connected: false, emails: [], unread: [], starred: [], sent: [], drafts: [] });
    }

    const gmailService = require('../services/gmailService');
    const emails = await gmailService.readInbox(req.user._id, 10).catch(() => []);
    
    const unread = emails.filter(e => e.labelIds && e.labelIds.includes('UNREAD'));
    const starred = emails.filter(e => e.labelIds && e.labelIds.includes('STARRED'));
    const sent = [];
    const drafts = [];

    // Optional fetch for sent/drafts utilizing authenticated client directly
    try {
      const { google } = require('googleapis');
      const config = require('../config');
      const { decrypt } = require('../utils/crypto');
      const auth = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
      auth.setCredentials({
        access_token: decrypt(account.accessToken),
        refresh_token: account.refreshToken ? decrypt(account.refreshToken) : undefined,
        expiry_date: account.expiresAt ? new Date(account.expiresAt).getTime() : undefined
      });
      const gmail = google.gmail({ version: 'v1', auth });
      const sentList = await gmail.users.messages.list({ userId: 'me', q: 'from:me', maxResults: 10 });
      if (sentList.data.messages) {
        for (const m of sentList.data.messages) {
          const detail = await gmail.users.messages.get({ userId: 'me', id: m.id });
          sent.push(detail.data);
        }
      }
    } catch (_) {}

    res.json({
      success: true,
      connected: true,
      emails,
      unread,
      starred,
      sent,
      drafts,
      syncStatus: {
        lastSynced: req.user.lastGoogleSync || new Date(),
        configured: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter Sync Inbox and Parse Attachments
exports.recruiterSyncInbox = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Recruiter access only' });
    }
    const gmailService = require('../services/gmailService');
    const aiService = require('../services/aiService');
    const Resume = require('../models/Resume');
    const fs = require('fs');
    const path = require('path');

    const emails = await gmailService.readInbox(req.user._id, 10);
    let parsedCount = 0;

    for (const email of emails) {
      const headers = email.payload?.headers || [];
      const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const emailMatch = from.match(/<([^>]+)>/) || [null, from];
      const candidateEmail = (emailMatch[1] || from).trim().toLowerCase();

      const attachments = await gmailService.downloadResumeAttachments(req.user._id, email.id).catch(() => []);
      for (const attachment of attachments) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const savedFilePath = path.join(uploadDir, `email_resume_${Date.now()}_${attachment.filename}`);
        fs.writeFileSync(savedFilePath, attachment.data);

        // Find existing candidate or create new
        let candidateUser = await User.findOne({ email: candidateEmail });
        if (!candidateUser) {
          const bcrypt = require('bcryptjs');
          const dummyPassword = await bcrypt.hash('candidate123', 12);
          candidateUser = await User.create({
            name: candidateEmail.split('@')[0],
            email: candidateEmail,
            password: dummyPassword,
            role: 'candidate',
            emailVerified: true,
            isVerified: true
          });
        }

        // Run AI Resume Parser and check authenticity
        const parsed = await aiService.parseResume(savedFilePath, candidateUser._id, { forceRegenerate: true }).catch(() => null);
        const authenticity = await aiService.checkAuthenticity({}, candidateUser._id, { forceRegenerate: true }).catch(() => null);
        
        if (parsed) {
          await Resume.create({
            user: candidateUser._id,
            filename: attachment.filename,
            filepath: savedFilePath,
            parsed: parsed.parsed,
            score: Math.max(0, Math.min(100, parsed.score || 70)),
            authenticityScore: authenticity?.authenticityScore || 80
          });
          parsedCount++;
        }
      }
    }

    req.user.lastGoogleSync = new Date();
    await req.user.save();

    res.json({ success: true, message: `Inbox synchronized successfully. Parsed ${parsedCount} new resumes.`, lastSynced: req.user.lastGoogleSync });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.linkedinAuth = (req, res) => {
  const { token } = req.query;
  const config = require('../config');
  const clientId = config.linkedin.clientId;
  if (!clientId || clientId === 'your-linkedin-client-id') {
    return res.status(400).send('OAuth Configuration Error: LINKEDIN_CLIENT_ID is not configured in .env file.');
  }
  const redirectUri = config.linkedin.redirectUri;
  const state = encodeURIComponent(token);
  const scope = encodeURIComponent('openid profile email');
  const linkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
  res.redirect(linkedinUrl);
};

// Global lock map to prevent duplicate LinkedIn callbacks
const linkedinLocks = new Map();

exports.linkedinCallback = async (req, res) => {
  const { code, state } = req.query;
  const config = require('../config');
  const OAuthAccount = require('../models/OAuthAccount');
  const LinkedInProfile = require('../models/LinkedInProfile');
  const { encrypt } = require('../utils/crypto');
  const jwt = require('jsonwebtoken');

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  // Prevent double processing / duplicate callback execution
  if (linkedinLocks.has(code)) {
    return res.redirect(`${config.clientUrl}/#/candidate/profile`);
  }
  linkedinLocks.set(code, Date.now());
  setTimeout(() => linkedinLocks.delete(code), 60000);

  try {
    let decoded;
    try {
      decoded = jwt.verify(state, config.jwt.secret);
    } catch (jwtErr) {
      throw new Error(`State verification failed: ${jwtErr.message}`);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    // Exchange Auth Code for Access Token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.linkedin.redirectUri,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret
      }).toString()
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errBody}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch LinkedIn user info
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!profileRes.ok) {
      const profileErrBody = await profileRes.text();
      throw new Error(`Failed to retrieve userinfo from LinkedIn: ${profileErrBody}`);
    }

    const profileData = await profileRes.json();

    // Map profile data to User model
    user.linkedinConnected = true;
    user.linkedinId = profileData.sub;
    user.linkedinName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
    user.linkedinEmail = profileData.email;
    user.linkedinHeadline = profileData.headline || 'Software Engineer Candidate';
    user.linkedinProfilePicture = profileData.picture || '';
    user.linkedinProfileUrl = profileData.profileUrl || '';
    user.linkedinAccessToken = encrypt(accessToken);
    user.lastLinkedInSync = new Date();

    await user.save();
    if (process.env.DEBUG === "true") {
      console.log('✓ User Updated');
    }

    // Create or Update LinkedInProfile model
    await LinkedInProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        linkedinId: profileData.sub,
        name: user.linkedinName,
        email: profileData.email,
        headline: user.linkedinHeadline,
        profilePicture: user.linkedinProfilePicture,
        profileUrl: user.linkedinProfileUrl,
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );
    if (process.env.DEBUG === "true") {
      console.log('✓ Profile Synced');
    }

    // Save encrypted token in OAuthAccount collection
    await OAuthAccount.findOneAndUpdate(
      { provider: 'linkedin', providerUserId: profileData.sub },
      {
        userId: user._id,
        provider: 'linkedin',
        providerUserId: profileData.sub,
        accessToken: encrypt(accessToken),
        connectedAt: new Date(),
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );
    if (process.env.DEBUG === "true") {
      console.log('✓ LinkedIn Connected');
    }

    res.redirect(`${config.clientUrl}/#/candidate/profile`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error.message);
    const redirectUrl = `${config.clientUrl}/#/candidate/profile?error=${encodeURIComponent(error.message || 'Connection Failed')}`;
    res.redirect(redirectUrl);
  }
};

exports.linkedinStatus = (req, res) => {
  const config = require('../config');
  const hasId = !!config.linkedin.clientId && config.linkedin.clientId !== 'your-linkedin-client-id';
  const hasSecret = !!config.linkedin.clientSecret && config.linkedin.clientSecret !== 'your-linkedin-client-secret';
  res.json({
    configured: hasId && hasSecret,
    clientIdPresent: hasId,
    clientSecretPresent: hasSecret,
    callbackUrl: config.linkedin.redirectUri,
    routesRegistered: true
  });
};

exports.linkedinDisconnect = async (req, res) => {
  try {
    const OAuthAccount = require('../models/OAuthAccount');
    const LinkedInProfile = require('../models/LinkedInProfile');
    
    req.user.linkedinConnected = false;
    req.user.linkedinId = '';
    req.user.linkedinName = '';
    req.user.linkedinEmail = '';
    req.user.linkedinHeadline = '';
    req.user.linkedinProfilePicture = '';
    req.user.linkedinProfileUrl = '';
    req.user.linkedinAccessToken = '';
    req.user.lastLinkedInSync = undefined;
    await req.user.save();

    await LinkedInProfile.deleteOne({ user: req.user._id });
    await OAuthAccount.deleteOne({ userId: req.user._id, provider: 'linkedin' });

    res.json({ success: true, message: 'LinkedIn disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.linkedinSync = async (req, res) => {
  try {
    const OAuthAccount = require('../models/OAuthAccount');
    const LinkedInProfile = require('../models/LinkedInProfile');
    const { decrypt } = require('../utils/crypto');
    
    // Retrieve decrypted access token from user model directly or fallback to OAuthAccount
    let decryptedToken = '';
    if (req.user.linkedinAccessToken) {
      decryptedToken = decrypt(req.user.linkedinAccessToken);
    } else {
      const account = await OAuthAccount.findOne({ userId: req.user._id, provider: 'linkedin' });
      if (!account) {
        return res.status(400).json({ success: false, message: 'LinkedIn account not connected' });
      }
      decryptedToken = decrypt(account.accessToken);
    }

    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${decryptedToken}` }
    });

    if (!profileRes.ok) {
      throw new Error('Failed to retrieve LinkedIn profile information.');
    }

    const profileData = await profileRes.json();

    req.user.linkedinName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
    req.user.linkedinEmail = profileData.email || req.user.linkedinEmail;
    req.user.linkedinHeadline = profileData.headline || req.user.linkedinHeadline || 'Software Engineer Candidate';
    req.user.linkedinProfilePicture = profileData.picture || req.user.linkedinProfilePicture;
    req.user.linkedinProfileUrl = profileData.profileUrl || req.user.linkedinProfileUrl;
    req.user.lastLinkedInSync = new Date();
    await req.user.save();

    await LinkedInProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        linkedinId: profileData.sub || req.user.linkedinId,
        name: req.user.linkedinName,
        email: req.user.linkedinEmail,
        headline: req.user.linkedinHeadline,
        profilePicture: req.user.linkedinProfilePicture,
        profileUrl: req.user.linkedinProfileUrl,
        lastSynced: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.githubDisconnect = async (req, res) => {
  try {
    req.user.githubConnected = false;
    req.user.githubId = '';
    req.user.githubUsername = '';
    req.user.githubName = '';
    req.user.githubEmail = '';
    req.user.githubAvatar = '';
    req.user.githubAccessToken = '';
    req.user.githubProfileUrl = '';
    await req.user.save();
    res.json({ success: true, message: 'GitHub disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCompanyEmail = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can manage company emails' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const exists = req.user.companyEmails.find(e => e.email === email.toLowerCase());
    if (exists) return res.status(400).json({ success: false, message: 'Email already added' });

    const verificationToken = generateVerificationToken();
    req.user.companyEmails.push({
      email: email.toLowerCase(),
      verified: false,
      verificationToken,
      isDefault: req.user.companyEmails.length === 0
    });
    await req.user.save();

    await sendEmail({
      to: email,
      subject: 'Verify your company email',
      html: `<p>Click to verify your company email: <a href="${req.protocol}://${req.get('host')}/api/auth/recruiter/verify-company-email/${verificationToken}">Verify Company Email</a></p>`
    });

    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyCompanyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ 'companyEmails.verificationToken': req.params.token });
    if (!user) return res.status(400).send('<h1>Verification Failed</h1><p>Invalid or expired verification token.</p>');

    const companyEmail = user.companyEmails.find(e => e.verificationToken === req.params.token);
    if (companyEmail) {
      companyEmail.verified = true;
      companyEmail.verificationToken = undefined;
      await user.save();
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #10B981;">✓ Company Email Verified Successfully!</h1>
          <p>You can close this window and return to your dashboard.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.setPrimaryCompanyEmail = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can manage company emails' });
    }
    const { email } = req.body;
    const target = req.user.companyEmails.find(e => e.email === email.toLowerCase());
    if (!target) return res.status(404).json({ success: false, message: 'Email not found' });
    if (!target.verified) return res.status(400).json({ success: false, message: 'Only verified emails can be set as default' });

    req.user.companyEmails.forEach(e => {
      e.isDefault = (e.email === email.toLowerCase());
    });
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCompanyEmail = async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Only recruiters can manage company emails' });
    }
    const { email } = req.body;
    req.user.companyEmails = req.user.companyEmails.filter(e => e.email !== email.toLowerCase());
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCommunicationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const targetEmail = email.trim().toLowerCase();

    const isGoogle = req.user.verifiedGoogleEmail && (targetEmail === req.user.verifiedGoogleEmail.toLowerCase());
    const isPrimary = req.user.emailVerified && (targetEmail === req.user.email.toLowerCase());
    const isCompany = (req.user.companyEmails || []).some(e => e.email === targetEmail && e.verified);

    if (!isGoogle && !isPrimary && !isCompany) {
      return res.status(400).json({ success: false, message: 'Only verified emails can be set as communication email' });
    }

    req.user.communicationEmail = targetEmail;
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

