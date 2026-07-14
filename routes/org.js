const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const orgController = require('../controllers/orgController');

// Org CRUD
router.post('/create', protect, orgController.createOrg);
router.get('/list', protect, orgController.getOrgs);
router.get('/:id', protect, orgController.getOrg);
router.delete('/:id', protect, orgController.deleteOrg);

// Departments & Teams
router.post('/:orgId/departments', protect, orgController.addDepartment);
router.post('/:orgId/teams', protect, orgController.addTeam);

// Invitations & Members
router.post('/:orgId/invite', protect, orgController.inviteMember);
router.get('/invite/accept/:token', protect, orgController.acceptInvitation);
router.post('/:orgId/remove-member', protect, orgController.removeMember);

// Collaborative Hiring Board (Kanban)
router.get('/:orgId/pipeline', protect, orgController.getPipeline);
router.post('/pipeline/move', protect, orgController.moveCandidate);

// Jira comments & tasks
router.post('/pipeline/:cardId/comments', protect, orgController.addComment);
router.post('/pipeline/:cardId/tasks', protect, orgController.addTask);
router.post('/pipeline/:cardId/tasks/toggle', protect, orgController.toggleTask);

// AI Balancer, Conflicts, Knowledge Graph & Audit
router.get('/:orgId/workload', protect, orgController.getWorkloadData);
router.get('/pipeline/:cardId/conflict', protect, orgController.detectConflict);
router.get('/:orgId/graph', protect, orgController.getKnowledgeGraph);
router.get('/:orgId/audit-logs', protect, orgController.getAuditLogs);

module.exports = router;
