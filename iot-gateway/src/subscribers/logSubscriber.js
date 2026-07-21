const db = require('../config/db');
const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');

const handle = async (deviceId, message) => {
  const logMessage = message.toString();
  logger.info(`Device log from [${deviceId}]: ${logMessage}`);
  
  try {
    await db.query(
      "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'info')",
      [deviceId, logMessage]
    );
  } catch (err) {
    // Silent fail if DB offline
  }

  // Broadcast log to web dashboard clients
  websocketServer.broadcast({
    event: 'log',
    deviceId,
    message: logMessage,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  handle
};
