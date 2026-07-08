const express = require('express');
const { protect } = require('../middleware/auth');
const job = require('../controllers/jobController');

const router = express.Router();

router.use(protect);
router.get('/', job.getApplications);
router.put('/:id', job.updateApplication);

module.exports = router;
