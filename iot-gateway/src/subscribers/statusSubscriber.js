const statusHandler = require('../handlers/statusHandler');
const logger = require('../utils/logger');

const handle = async (deviceId, message) => {
  try {
    const status = message.toString().trim().toLowerCase();
    if (status === 'online' || status === 'offline') {
      await statusHandler.process(deviceId, status);
    } else {
      logger.warn(`Invalid status payload from ${deviceId}: ${status}`);
    }
  } catch (err) {
    logger.error(`Error processing status message: ${err.message}`);
  }
};

module.exports = {
  handle
};
