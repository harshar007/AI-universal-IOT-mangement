const logger = require('../utils/logger');

let mqttClient = null;

const init = (client) => {
  mqttClient = client;
};

const publish = (deviceId, action, value) => {
  if (!mqttClient) {
    logger.error('MQTT client not initialized in commandPublisher');
    return false;
  }

  const topic = `iot/device/${deviceId}/command`;
  const payload = JSON.stringify({ action, value, timestamp: Date.now() });

  logger.info(`Publishing Command: topic=${topic}, payload=${payload}`);
  mqttClient.publish(topic, payload, { qos: 1 });
  return true;
};

module.exports = {
  init,
  publish
};
