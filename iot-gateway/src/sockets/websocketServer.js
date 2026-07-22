const { WebSocketServer } = require('ws');
const logger = require('../utils/logger');
const url = require('url');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_987654321';

let wss = null;

const initWebSocketServer = (httpServer) => {
  wss = new WebSocketServer({ server: httpServer });
  
  logger.info('WebSocket Server initialized on same port as HTTP server.');
  
  wss.on('connection', (ws, req) => {
    logger.info('Frontend client connected to gateway WebSocket.');
    
    // Authenticate client by checking JWT token from query parameters
    let userId = null;
    try {
      const parsedUrl = url.parse(req.url, true);
      const token = parsedUrl.query.token;
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        ws.userId = userId;
        logger.info(`WebSocket client successfully authenticated for User ID: ${userId}`);
      } else {
        logger.warn('WebSocket connection request has no auth token.');
      }
    } catch (err) {
      logger.warn(`WebSocket client authentication failed: ${err.message}`);
    }

    ws.send(JSON.stringify({
      event: 'connection',
      status: 'connected',
      message: 'Nexus Gateway WebSocket Link Established.'
    }));

    ws.on('close', () => {
      logger.info('Frontend client disconnected from WebSocket.');
    });
    
    ws.on('error', (err) => {
      logger.error('WebSocket client connection error: ' + err.message);
    });
  });
};

const broadcast = (data, ownerId = null) => {
  if (!wss) return;
  
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN state
      // If ownerId is provided, filter out clients that don't match the owner
      if (ownerId && String(client.userId) !== String(ownerId)) {
        return;
      }
      client.send(payload);
    }
  });
};

module.exports = {
  initWebSocketServer,
  broadcast
};
