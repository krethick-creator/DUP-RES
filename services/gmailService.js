const { google } = require('googleapis');
const config = require('../config');
const OAuthAccount = require('../models/OAuthAccount');
const { decrypt, encrypt } = require('../utils/crypto');

const getOAuth2Client = async (userId) => {
  const account = await OAuthAccount.findOne({ userId, provider: 'google' });
  if (!account) throw new Error('Google account not connected');

  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  const decryptedAccessToken = decrypt(account.accessToken);
  const decryptedRefreshToken = account.refreshToken ? decrypt(account.refreshToken) : undefined;

  oauth2Client.setCredentials({
    access_token: decryptedAccessToken,
    refresh_token: decryptedRefreshToken,
    expiry_date: account.expiresAt ? new Date(account.expiresAt).getTime() : undefined
  });

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      account.accessToken = encrypt(tokens.access_token);
      if (tokens.expiry_date) {
        account.expiresAt = new Date(tokens.expiry_date);
      }
      await account.save();
    }
  });

  return oauth2Client;
};

const gmailService = {
  /**
   * Read User Inbox
   */
  async readInbox(userId, maxResults = 10) {
    const auth = await getOAuth2Client(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'label:INBOX'
    });

    const messages = response.data.messages || [];
    const detailedMessages = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      detailedMessages.push(detail.data);
    }

    return detailedMessages;
  },

  /**
   * Search Emails
   */
  async searchEmails(userId, query, maxResults = 10) {
    const auth = await getOAuth2Client(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query
    });

    const messages = response.data.messages || [];
    const detailedMessages = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      detailedMessages.push(detail.data);
    }

    return detailedMessages;
  },

  /**
   * Download Resume Attachments
   */
  async downloadResumeAttachments(userId, messageId) {
    const auth = await getOAuth2Client(userId);
    const gmail = google.gmail({ version: 'v1', auth });
    
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId
    });

    const attachments = [];
    const parts = message.data.payload.parts || [];

    for (const part of parts) {
      if (part.filename && part.body && part.body.attachmentId) {
        const ext = part.filename.split('.').pop().toLowerCase();
        if (['pdf', 'doc', 'docx'].includes(ext)) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId,
            id: part.body.attachmentId
          });
          
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            data: Buffer.from(attachment.data.data, 'base64')
          });
        }
      }
    }

    return attachments;
  },

  /**
   * Send Email
   */
  async sendEmail(userId, { to, subject, html, text }) {
    const auth = await getOAuth2Client(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      html || text
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return response.data;
  },

  /**
   * Reply to Email thread
   */
  async replyEmail(userId, threadId, { to, subject, html, text }) {
    const auth = await getOAuth2Client(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId
    });

    const messages = thread.data.messages || [];
    const lastMsg = messages[messages.length - 1];
    const messageIdHeader = lastMsg.headers.find(h => h.name.toLowerCase() === 'message-id')?.value || '';
    const subjectHeader = lastMsg.headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    
    const replySubject = subject || (subjectHeader.toLowerCase().startsWith('re:') ? subjectHeader : `Re: ${subjectHeader}`);

    const messageParts = [
      `To: ${to}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${messageIdHeader}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      html || text
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId
      }
    });

    return response.data;
  },

  /**
   * List Recruiter Inbox (can be read as inbox with high maxResults or specific search)
   */
  async listRecruiterInbox(userId) {
    return this.readInbox(userId, 20);
  }
};

module.exports = gmailService;
