const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, from }) => {
  try {
    const sender = from || config.smtp.from;
    if (!config.smtp.user) {
      console.log(`[Email Placeholder] From: ${sender}, To: ${to}, Subject: ${subject}`);
      return { success: true, placeholder: true };
    }
    await getTransporter().sendMail({
      from: sender,
      replyTo: sender,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
