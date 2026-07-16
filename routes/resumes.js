const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const resume = require('../controllers/resumeController');

const router = express.Router();

router.use(protect, authorize('candidate'));

router.post('/manual', resume.createManualResume);
router.post('/generate-ai', resume.generateAIResume);
router.post('/upload', upload.single('resume'), resume.uploadResume);
router.get('/', resume.getResumes);
router.get('/themes', resume.getThemes);
router.get('/theme/:id', resume.getThemeById);
router.post('/theme/apply', resume.applyThemeDirect);
router.post('/theme/favorite', resume.favoriteThemeDirect);
router.post('/theme/customize', resume.customizeThemeDirect);
router.post('/theme/generate', resume.generateAIThemeDirect);
router.post('/optimize', resume.optimizeResumeDirect);
router.get('/versions', resume.getVersionsDirect);
router.post('/version/restore', resume.restoreVersionDirect);

router.post('/:resumeId/theme/apply', resume.applyTheme);
router.post('/:resumeId/theme/favorite', resume.favoriteTheme);
router.put('/:resumeId', resume.updateResumeContent);
router.post('/:resumeId/theme/customize', resume.customizeTheme);
router.post('/:resumeId/theme/generate', resume.generateAITheme);
router.post('/:resumeId/optimize', resume.optimizeResume);
router.get('/:resumeId/versions', resume.getVersions);
router.post('/:resumeId/version/restore', resume.restoreVersion);
router.get('/:id', resume.getResume);
router.post('/:id/simulate', resume.simulateResume);
router.post('/:id/advanced-simulate', resume.advancedSimulateResume);
router.post('/:id/dynamic', resume.dynamicResume);
router.get('/:id/improvement', resume.improvementReport);
router.get('/:id/timeline', resume.getTimeline);

module.exports = router;
