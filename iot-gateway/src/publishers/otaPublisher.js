const logger = require('../utils/logger');

let mqttClient = null;

const init = (client) => {
  mqttClient = client;
};

const publishOTAUpdate = (deviceId, version, downloadUrl) => {
  if (!mqttClient) {
    logger.error('MQTT client not initialized in otaPublisher');
    return false;
  }

  const topic = `iot/device/${deviceId}/ota`;
  const payload = JSON.stringify({
    action: 'ota_prepare',
    version,
    downloadUrl,
    timestamp: Date.now()
  });

  logger.info(`Publishing OTA Update details to device ${deviceId}: ${payload}`);
  mqttClient.publish(topic, payload, { qos: 1 });
  return true;
};

module.exports = {
  init,
  publishOTAUpdate
};
