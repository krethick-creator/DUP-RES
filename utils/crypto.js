const crypto = require('crypto');

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const expire = Date.now() + 60 * 60 * 1000;
  return { token, hashed, expire };
};

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(
  (process.env.JWT_SECRET || 'dev-secret-change-me-thirty-two-chars').padEnd(32, '0').substring(0, 32),
  'utf-8'
);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return '';
  const textParts = text.split(':');
  if (textParts.length < 2) return '';
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { generateResetToken, generateVerificationToken, encrypt, decrypt };
