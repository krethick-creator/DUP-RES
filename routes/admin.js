const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');

const router = express.Router();

router.use(protect);

router.get('/search', admin.globalSearch);
router.get('/notifications', admin.getNotifications);
router.put('/notifications/:id/read', admin.markNotificationRead);

router.use(authorize('admin'));

router.get('/users', admin.getUsers);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);
router.get('/companies', admin.getCompanies);
router.post('/companies', admin.createCompany);
router.put('/companies/:id', admin.updateCompany);
router.get('/stats', admin.getStats);
router.get('/logs', admin.getLogs);
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

module.exports = router;
