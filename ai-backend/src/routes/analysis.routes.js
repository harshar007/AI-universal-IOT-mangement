const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Isolated Analysis module routes operational.' });
});

module.exports = router;
