const express = require('express');
const router = express.Router();
const aiAutomationController = require('../controllers/AiAutomationController');
const auth = require('../middleware/auth');

router.get('/automation/status', auth, (req, res) => aiAutomationController.getStatus(req, res));
router.post('/automation/toggle', auth, (req, res) => aiAutomationController.toggleAi(req, res));
router.post('/automation/profile', auth, (req, res) => aiAutomationController.setProfile(req, res));
router.post('/automation/device-setting', auth, (req, res) => aiAutomationController.setDeviceSetting(req, res));
router.post('/automation/evaluate', auth, (req, res) => aiAutomationController.evaluate(req, res));

module.exports = router;
