const telemetryHandler = require('../handlers/telemetryHandler');
const logger = require('../utils/logger');

const handle = async (deviceId, message) => {
  try {
    const payload = JSON.parse(message.toString());
    // Payload should look like: { streamKey: "value", value: 24.5 }
    const streamKey = payload.streamKey || 'value';
    const value = parseFloat(payload.value);
    
    if (isNaN(value)) {
      throw new Error('Value is not a number');
    }
    
    await telemetryHandler.process(deviceId, streamKey, value);
  } catch (err) {
    logger.warn(`Failed to parse telemetry message from ${deviceId}: ${err.message}. Raw: ${message.toString()}`);
  }
};

module.exports = {
  handle
};
