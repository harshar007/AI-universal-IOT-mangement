const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Isolated Automation module routes operational.' });
});

module.exports = router;
