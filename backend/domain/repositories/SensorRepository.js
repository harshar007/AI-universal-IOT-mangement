const { iotPool } = require('../../config/db');
const SensorData = require('../../domain/entities/SensorData');
const AirQuality = require('../../domain/entities/AirQuality');

class SensorRepository {
  async saveSensorReading(sensorData) {
    const queryText = `
      INSERT INTO iot_telemetry (device_id, stream_key, stream_value, timestamp)
      VALUES ($1, $2, $3, $4)
    `;
    // Save temperature
    await iotPool.query(queryText, [sensorData.deviceId, 'temperature', sensorData.temperature, sensorData.timestamp]);
    // Save humidity
    await iotPool.query(queryText, [sensorData.deviceId, 'humidity', sensorData.humidity, sensorData.timestamp]);
  }

  async saveAirQualityReading(deviceId, airQuality) {
    const queryText = `
      INSERT INTO iot_telemetry (device_id, stream_key, stream_value, timestamp)
      VALUES ($1, $2, $3, $4)
    `;
    await iotPool.query(queryText, [deviceId, 'ppm', airQuality.ppm, airQuality.timestamp]);
  }

  async getLatestTelemetry(deviceId) {
    const queryText = `
      SELECT stream_key, stream_value, timestamp 
      FROM iot_telemetry 
      WHERE device_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    const res = await iotPool.query(queryText, [deviceId]);
    
    let temp = null;
    let hum = null;
    let ppm = null;
    let latestTimestamp = new Date();

    res.rows.forEach(row => {
      if (row.stream_key === 'temperature' && temp === null) {
        temp = parseFloat(row.stream_value);
        latestTimestamp = row.timestamp;
      }
      if (row.stream_key === 'humidity' && hum === null) {
        hum = parseFloat(row.stream_value);
      }
      if (row.stream_key === 'ppm' && ppm === null) {
        ppm = parseFloat(row.stream_value);
      }
    });

    const sensorData = temp !== null && hum !== null 
      ? new SensorData(deviceId, temp, hum, latestTimestamp) 
      : null;

    const airQuality = ppm !== null 
      ? new AirQuality(ppm, latestTimestamp) 
      : null;

    return { sensorData, airQuality };
  }

  async getActiveRules(userId = null) {
    if (!userId) return [];
    const queryText = `
      SELECT id, sensor_type as "sensorType", operator, value, is_enabled as "isEnabled", target_recipient as "targetRecipient", user_id as "userId"
      FROM iot_alert_rules
      WHERE is_enabled = true AND user_id = $1
    `;
    try {
      const res = await iotPool.query(queryText, [String(userId)]);
      return res.rows;
    } catch (err) {
      // Fallback default rules if table doesn't exist yet
      return [
        { id: 1, sensorType: 'TEMPERATURE', operator: 'GREATER_THAN', value: 30, isEnabled: true, targetRecipient: 'admin@nexus.io', userId },
        { id: 2, sensorType: 'AIR_QUALITY', operator: 'GREATER_THAN', value: 800, isEnabled: true, targetRecipient: 'admin@nexus.io', userId }
      ];
    }
  }

  async saveAlertLog(alert, userId = null) {
    const queryText = `
      INSERT INTO iot_alerts_history (rule_id, sensor_type, operator, threshold, current_value, message, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    try {
      await iotPool.query(queryText, [alert.ruleId, alert.sensorType, alert.operator, alert.threshold, alert.currentValue, alert.message, userId ? String(userId) : null]);
    } catch (err) {
      console.error('Failed to log alert history:', err.message);
    }
  }
}

module.exports = SensorRepository;
