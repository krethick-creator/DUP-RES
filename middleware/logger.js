const Log = require('../models/Log');

const logAction = (action, level = 'info') => async (req, res, next) => {
  try {
    await Log.create({
      action,
      user: req.user?._id,
      details: { method: req.method, path: req.path },
      ip: req.ip,
      level
    });
  } catch (_) { /* non-blocking */ }
  next();
};

module.exports = { logAction };
