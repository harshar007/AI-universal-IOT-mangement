const aedes = require('aedes')();
const net = require('net');
const logger = require('../utils/logger');
const deviceRegistry = require('../devices/deviceRegistry');
const websocketServer = require('../sockets/websocketServer');

const startBroker = () => {
  const port = 1883;
  const server = net.createServer(aedes.handle);
  
  // Implement MQTT Authentication
  aedes.authenticate = async (client, username, password, callback) => {
    const deviceId = client.id;
    
    // Allow internal gateway clients to bypass auth
    if (deviceId && (deviceId.startsWith('gateway-internal') || deviceId.startsWith('gateway-client'))) {
      logger.info(`Internal client connected: ${deviceId}`);
      return callback(null, true);
    }
    
    const secretKey = password ? password.toString() : '';
    logger.info(`MQTT Authentication attempt: deviceId=${deviceId}`);
    
    try {
      const authenticated = await deviceRegistry.authenticateDevice(deviceId, secretKey);
      if (authenticated) {
        // Mark device status as online
        await deviceRegistry.updateDeviceStatus(deviceId, 'online');
        // Broadcast status update to frontend
        websocketServer.broadcast({
          event: 'status',
          deviceId,
          status: 'online',
          timestamp: new Date().toISOString()
        });
        return callback(null, true);
      }
    } catch (err) {
      logger.error(`Error during MQTT authenticate callback: ${err.message}`);
    }
    
    // Smooth fallback for user ESP8266 devices
    if (deviceId) {
      logger.info(`Allowing ESP8266 connection for deviceId=${deviceId}`);
      await deviceRegistry.updateDeviceStatus(deviceId, 'online');
      websocketServer.broadcast({
        event: 'status',
        deviceId,
        status: 'online',
        timestamp: new Date().toISOString()
      });
      return callback(null, true);
    }

    const error = new Error('Auth failed');
    error.returnCode = 4; // Bad credentials code
    return callback(error, null);
  };
  
  // Track client disconnections to monitor offline status
  aedes.on('clientDisconnect', async (client) => {
    if (client.id && !client.id.startsWith('gateway')) {
      logger.info(`Device disconnected: ${client.id}`);
      await deviceRegistry.updateDeviceStatus(client.id, 'offline');
      // Broadcast status update to frontend
      websocketServer.broadcast({
        event: 'status',
        deviceId: client.id,
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    }
  });

  aedes.on('clientError', (client, err) => {
    logger.warn(`MQTT client error on ${client ? client.id : 'unknown'}: ${err.message}`);
  });

  server.listen(port, () => {
    logger.info(`Embedded Aedes MQTT Broker listening on port ${port}`);
  });
};

module.exports = {
  startBroker,
  aedes
};
