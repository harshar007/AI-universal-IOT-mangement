const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Automatically apply JWT Authentication and Admin Privileges check to all routes
router.use(auth);
router.use(admin);

// Admin API Routes
router.get('/stats', (req, res) => adminController.getStats(req, res));
router.get('/db-diagnostics', (req, res) => adminController.getDbDiagnostics(req, res));
router.get('/users', (req, res) => adminController.getUsers(req, res));
router.post('/users', (req, res) => adminController.createUser(req, res));
router.put('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));
router.put('/users/:id', (req, res) => adminController.updateUserDetails(req, res));
router.delete('/users/:id', (req, res) => adminController.deleteUser(req, res));
router.get('/devices', (req, res) => adminController.getDevices(req, res));
router.delete('/devices/:id', (req, res) => adminController.deleteDevice(req, res));
router.post('/devices/:id/regenerate-token', (req, res) => adminController.regenerateDeviceToken(req, res));
router.get('/audit-logs', (req, res) => adminController.getAuditLogs(req, res));
router.post('/db-maintenance/clear-logs', (req, res) => adminController.clearDeviceLogs(req, res));

module.exports = router;
