const deviceRegistry = require('../devices/deviceRegistry');
const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');

const process = async (deviceId, status) => {
  logger.info(`Status update: ${deviceId} is now ${status}`);
  
  // 1. Update status in registry / database
  await deviceRegistry.updateDeviceStatus(deviceId, status);

  // 2. Broadcast status update to frontend clients
  websocketServer.broadcast({
    event: 'status',
    deviceId,
    status,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  process
};
