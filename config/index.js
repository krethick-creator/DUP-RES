require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-recruitment',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    pat: process.env.GITHUB_PAT || ''
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || ''
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID || '',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || ''
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@recruitment-platform.com'
  },
  csrfSecret: process.env.CSRF_SECRET || 'csrf-dev-secret'
};
