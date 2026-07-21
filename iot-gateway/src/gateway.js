const express = require('express');
const cors = require('cors');
const http = require('http');
const config = require('./config/gatewayConfig');
const logger = require('./utils/logger');
const db = require('./config/db');

// Services & Managers
const broker = require('./mqtt/broker');
const client = require('./mqtt/client');
const websocketServer = require('./sockets/websocketServer');
const deviceRegistry = require('./devices/deviceRegistry');
const commandDispatcher = require('./commands/commandDispatcher');
const otaPublisher = require('./publishers/otaPublisher');

const app = express();
app.use(cors());
app.use(express.json());

// Create shared HTTP server for Express and WebSockets
const server = http.createServer(app);

// REST Endpoints handled by main backend. Command dispatching remains here.

// 3. Command Dispatch Endpoint
app.post('/api/devices/:deviceId/command', async (req, res) => {
  const { deviceId } = req.params;
  const { action, value } = req.body;

  try {
    const success = commandDispatcher.dispatchCommand(deviceId, action, value);
    if (success) {
      res.status(200).json({ status: 'success', message: 'Command dispatched' });
    } else {
      res.status(500).json({ error: 'Failed to publish command' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. OTA Update Preparation Endpoint
app.post('/api/devices/:deviceId/ota', async (req, res) => {
  const { deviceId } = req.params;
  const { version, downloadUrl } = req.body;

  if (!version || !downloadUrl) {
    return res.status(400).json({ error: 'version and downloadUrl are required.' });
  }

  try {
    // Notify device on MQTT about the new firmware available
    const success = otaPublisher.publishOTAUpdate(deviceId, version, downloadUrl);
    if (success) {
      logger.info(`OTA Update notification dispatched for ${deviceId}: v${version}`);

      // Log event
      await db.query(
        "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'info')",
        [deviceId, `OTA Update Prepared: Version v${version}, URL: ${downloadUrl}`]
      );

      websocketServer.broadcast({
        event: 'ota_prepared',
        deviceId,
        version,
        downloadUrl,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({ status: 'success', message: 'OTA update dispatched to device' });
    } else {
      res.status(500).json({ error: 'Failed to dispatch OTA update notification' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Server Initialization
const init = async () => {
  logger.info('Starting Nexus IoT Gateway...');

  // 1. Initialize and provision database tables
  await db.initDB();

  // 2. Start Embedded MQTT Broker (Port 1883)
  broker.startBroker();

  // 3. Connect internal MQTT Client to Broker
  // Wait slightly to ensure broker has bound port
  setTimeout(() => {
    client.connectMqttClient();
  }, 1000);

  // 4. Start WebSocket Server (Sharing Express Port 5002)
  websocketServer.initWebSocketServer(server);

  // 5. Start Express API Listener
  server.listen(config.port, () => {
    logger.info(`IoT Gateway REST API listening on port ${config.port}`);
  });
};

init().catch(err => {
  logger.error('Gateway initialization failed: ' + err.stack);
});
