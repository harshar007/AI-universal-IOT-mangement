const { WebSocketServer } = require('ws');
const logger = require('../utils/logger');

let wss = null;

const initWebSocketServer = (httpServer) => {
  wss = new WebSocketServer({ server: httpServer });
  
  logger.info('WebSocket Server initialized on same port as HTTP server.');
  
  wss.on('connection', (ws) => {
    logger.info('Frontend client connected to gateway WebSocket.');
    
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

const broadcast = (data) => {
  if (!wss) return;
  
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN state
      client.send(payload);
    }
  });
};

module.exports = {
  initWebSocketServer,
  broadcast
};
