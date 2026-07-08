const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const resume = require('../controllers/resumeController');

const router = express.Router();

router.use(protect, authorize('candidate'));

router.post('/upload', upload.single('resume'), resume.uploadResume);
router.get('/', resume.getResumes);
router.get('/:id', resume.getResume);
router.post('/:id/simulate', resume.simulateResume);
router.post('/:id/dynamic', resume.dynamicResume);
router.get('/:id/improvement', resume.improvementReport);
router.get('/:id/timeline', resume.getTimeline);

module.exports = router;
