const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const job = require('../controllers/jobController');

const router = express.Router();

router.get('/', protect, job.getJobs);
router.post('/', protect, authorize('recruiter'), job.createJob);
router.post('/ai/generate', protect, authorize('recruiter'), job.aiCreateJob);

router.get('/:id', protect, job.getJob);
router.put('/:id', protect, authorize('recruiter'), job.updateJob);
router.delete('/:id', protect, authorize('recruiter'), job.deleteJob);
router.post('/:id/apply', protect, authorize('candidate'), job.applyJob);
router.post('/:id/reverse-match', protect, authorize('recruiter'), job.reverseMatch);
router.get('/:jobId/rankings', protect, authorize('recruiter'), job.rankCandidates);

module.exports = router;
