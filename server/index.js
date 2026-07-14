const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const config = require('../config');
const connectDB = require('../database/connection');

const app = express();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

connectDB();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/resumes', require('../routes/resumes'));
app.use('/api/jobs', require('../routes/jobs'));
app.use('/api/applications', require('../routes/applications'));
app.use('/api/ai', require('../routes/ai'));
app.use('/api/github', require('../routes/github'));
app.use('/api/org', require('../routes/org'));
app.use('/api/linkedin', require('../routes/linkedin'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('[Socket] Member connected:', socket.id);

  socket.on('join_org', (orgId) => {
    socket.join(orgId);
    console.log(`[Socket] Member ${socket.id} joined Org room: ${orgId}`);
  });

  socket.on('typing', (data) => {
    socket.to(data.orgId).emit('typing', { username: data.username, cardId: data.cardId });
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Member disconnected:', socket.id);
  });
});

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}`);
});

module.exports = app;
