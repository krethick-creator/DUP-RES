const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Log = require('../models/Log');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

exports.getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').skip((page - 1) * limit).limit(+limit);
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, pagination: { page: +page, limit: +limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('recruiters', 'name email');
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [users, companies, jobs, applications] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments()
    ]);
    res.json({
      success: true,
      stats: {
        users,
        candidates: await User.countDocuments({ role: 'candidate' }),
        recruiters: await User.countDocuments({ role: 'recruiter' }),
        companies,
        jobs,
        applications,
        activeJobs: await Job.countDocuments({ status: 'active' })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().populate('user', 'name email').sort('-createdAt').limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const masked = settings.map((s) => ({
      ...s.toObject(),
      value: s.isSecret && s.value ? '••••••••' : s.value
    }));
    res.json({ success: true, settings: masked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    for (const item of settings) {
      await Settings.findOneAndUpdate(
        { key: item.key },
        { value: item.value, category: item.category, isSecret: item.isSecret, updatedBy: req.user._id },
        { upsert: true }
      );
    }
    res.json({ success: true, message: 'Settings updated' });
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
