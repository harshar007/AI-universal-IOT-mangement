const heartbeatHandler = require('../handlers/heartbeatHandler');
const logger = require('../utils/logger');

const handle = async (deviceId, message) => {
  try {
    const payload = message.toString().trim();
    // Heartbeat payload could just be a timestamp or a simple "ping"
    await heartbeatHandler.process(deviceId, payload);
  } catch (err) {
    logger.error(`Error processing heartbeat message from ${deviceId}: ${err.message}`);
  }
};

module.exports = {
  handle
};
