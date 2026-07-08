const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role ${req.user.role} not authorized` });
  }
  next();
};

module.exports = { protect, authorize };
