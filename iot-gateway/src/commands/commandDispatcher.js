const commandPublisher = require('../publishers/commandPublisher');
const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');

const dispatchCommand = (deviceId, action, value) => {
  logger.info(`Dispatching command to device ${deviceId}: ${action}=${value}`);
  
  // 1. Publish MQTT message to device
  const success = commandPublisher.publish(deviceId, action, value);
  
  if (success) {
    // 2. Broadcast dispatch event to frontend
    websocketServer.broadcast({
      event: 'command_dispatched',
      deviceId,
      action,
      value,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  
  return false;
};

module.exports = {
  dispatchCommand
};
