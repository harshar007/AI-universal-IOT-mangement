const telemetryStore = require('../telemetry/telemetryStore');
const logger = require('../utils/logger');

const process = async (deviceId, streamKey, value) => {
  logger.info(`Processing telemetry: ${deviceId} -> ${streamKey}=${value}`);
  await telemetryStore.saveTelemetry(deviceId, streamKey, value);
};

module.exports = {
  process
};
