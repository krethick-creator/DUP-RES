const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/certificates/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const resumeFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) && allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only valid PDF and Word documents allowed'), false);
};

const certificateFilter = (req, file, cb) => {
  const allowed = ['.pdf'];
  const allowedMimeTypes = ['application/pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext) && allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only valid PDF files are allowed'), false);
};

const upload = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const certificate = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

upload.certificate = certificate;
module.exports = upload;
