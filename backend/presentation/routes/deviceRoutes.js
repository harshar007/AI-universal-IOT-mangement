const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/DeviceController');
const auth = require('../middleware/auth');

router.post('/register', auth, (req, res) => deviceController.registerDevice(req, res));
router.get('/', auth, (req, res) => deviceController.getAllDevices(req, res));
router.post('/:deviceId/regenerate-token', auth, (req, res) => deviceController.regenerateDeviceToken(req, res));
router.post('/:deviceId/command', auth, (req, res) => deviceController.dispatchDeviceCommand(req, res));
router.post('/:deviceId/ota', auth, (req, res) => deviceController.dispatchDeviceOta(req, res));

module.exports = router;
