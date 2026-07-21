const deviceRegistry = require('../devices/deviceRegistry');
const logger = require('../utils/logger');

const handleRegistration = async (deviceId, name) => {
  logger.info(`Handling registration request: deviceId=${deviceId}, name=${name}`);
  if (!deviceId || !name) {
    throw new Error('Device ID and name are required.');
  }

  const registrationDetails = await deviceRegistry.registerDevice(deviceId, name);
  return registrationDetails;
};

module.exports = {
  handleRegistration
};
