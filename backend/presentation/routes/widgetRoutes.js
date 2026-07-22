const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/WidgetController');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => widgetController.getWidgetsMap(req, res));
router.post('/', auth, (req, res) => widgetController.saveWidgetsMap(req, res));

module.exports = router;
