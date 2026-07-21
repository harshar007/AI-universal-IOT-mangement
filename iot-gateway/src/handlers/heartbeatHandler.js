const deviceRegistry = require('../devices/deviceRegistry');
const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');

const process = async (deviceId, payload) => {
  logger.info(`Heartbeat received from ${deviceId}: ${payload}`);
  
  // Update last seen timestamp and status to online in registry/cache
  const device = deviceRegistry.cache.get(deviceId);
  if (device) {
    device.lastHeartbeat = new Date();
    if (device.status !== 'online') {
      await deviceRegistry.updateDeviceStatus(deviceId, 'online');
    }
  }

  // Broadcast heartbeat event to dashboard
  websocketServer.broadcast({
    event: 'heartbeat',
    deviceId,
    payload,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  process
};
