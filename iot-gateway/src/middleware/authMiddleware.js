const jwt = require('jsonwebtoken');
const config = require('../config/gatewayConfig');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Unauthorized HTTP request received - no token.');
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      logger.warn('Forbidden HTTP request received - invalid token.');
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
