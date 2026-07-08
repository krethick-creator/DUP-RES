const crypto = require('crypto');

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const expire = Date.now() + 60 * 60 * 1000;
  return { token, hashed, expire };
};

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { generateResetToken, generateVerificationToken };
