const deviceRegistry = require('../devices/deviceRegistry');
const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');
const DeviceRepository = require('../../../backend/domain/repositories/DeviceRepository');
const deviceRepository = new DeviceRepository();

const process = async (deviceId, status) => {
  logger.info(`Status update: ${deviceId} is now ${status}`);
  
  // 1. Update status in registry / database
  await deviceRegistry.updateDeviceStatus(deviceId, status);

  // 2. Lookup owner ID
  let ownerId = null;
  try {
    const device = await deviceRepository.findById(deviceId);
    if (device) {
      ownerId = device.userId;
    }
  } catch (err) {
    logger.error('Failed to lookup owner for status broadcast: ' + err.message);
  }

  // 3. Broadcast status update to frontend clients
  websocketServer.broadcast({
    event: 'status',
    deviceId,
    status,
    timestamp: new Date().toISOString()
  }, ownerId);
};

module.exports = {
  process
};
