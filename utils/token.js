const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, { expiresIn: config.jwt.expire });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        darkMode: user.darkMode,
        isVerified: user.isVerified
      }
    });
};

module.exports = { generateToken, sendTokenResponse };
