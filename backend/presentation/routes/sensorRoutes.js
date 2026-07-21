const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/SensorController');
const auth = require('../middleware/auth');

// Define sensor & alerts routes
router.get('/latest/:deviceId', auth, (req, res) => sensorController.getLatestTelemetry(req, res));
router.get('/alerts/rules', auth, (req, res) => sensorController.getAlertRules(req, res));
router.post('/alerts/rules', auth, (req, res) => sensorController.createAlertRule(req, res));
router.delete('/alerts/rules/:ruleId', auth, (req, res) => sensorController.deleteAlertRule(req, res));
router.get('/alerts/history', auth, (req, res) => sensorController.getAlertsHistory(req, res));

module.exports = router;
