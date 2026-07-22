const db = require('../config/db');
const logger = require('../utils/logger');
const rulesEngine = require('../automation/rulesEngine');
const websocketServer = require('../sockets/websocketServer');

// Clean Architecture integration
const SendAlert = require('../../../backend/application/usecases/SendAlert');
const SensorRepository = require('../../../backend/domain/repositories/SensorRepository');
const DeviceRepository = require('../../../backend/domain/repositories/DeviceRepository');
const AlertNotifier = require('../../../backend/infrastructure/notifiers/AlertNotifier');

const sensorRepository = new SensorRepository();
const deviceRepository = new DeviceRepository();
const alertNotifier = new AlertNotifier(websocketServer);
const sendAlertUseCase = new SendAlert(sensorRepository, alertNotifier);

const saveTelemetry = async (deviceId, streamKey, value) => {
  logger.info(`Telemetry Ingestion: device=${deviceId}, stream=${streamKey}, value=${value}`);
  
  try {
    await db.query(
      'INSERT INTO iot_telemetry (device_id, stream_key, stream_value) VALUES ($1, $2, $3)',
      [deviceId, streamKey, value]
    );
  } catch (err) {
    logger.error('Failed to write telemetry to database: ' + err.message);
  }

  // Look up device details to find the owner userId
  let ownerId = null;
  try {
    const device = await deviceRepository.findById(deviceId);
    if (device) {
      ownerId = device.userId;
    }
  } catch (err) {
    logger.error('Failed to lookup device owner: ' + err.message);
  }

  // 1. Broadcast the update via WebSocket to connected dashboard clients matching ownerId
  websocketServer.broadcast({
    event: 'telemetry',
    deviceId,
    streamKey,
    value,
    timestamp: new Date().toISOString()
  }, ownerId);

  // 2. Clean Architecture: Fetch latest entities and run SendAlert Usecase
  try {
    const { sensorData, airQuality } = await sensorRepository.getLatestTelemetry(deviceId);
    const breachedAlerts = await sendAlertUseCase.execute(sensorData, airQuality, ownerId);
    
    // Save any triggered alerts to history
    for (const alert of breachedAlerts) {
      await sensorRepository.saveAlertLog(alert, ownerId);
    }
  } catch (err) {
    logger.error('Clean Architecture rules check failed: ' + err.message);
  }

  // 3. Pass telemetry details to rules engine to run legacy automated fan controls
  rulesEngine.evaluate(deviceId, streamKey, value);
};

const getRecentTelemetry = async (deviceId, limit = 50) => {
  try {
    const res = await db.query(
      'SELECT stream_key, stream_value, timestamp FROM iot_telemetry WHERE device_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [deviceId, limit]
    );
    return res.rows;
  } catch (err) {
    return [];
  }
};

module.exports = {
  saveTelemetry,
  getRecentTelemetry
};
