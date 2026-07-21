const ViewSensorData = require('../../application/usecases/ViewSensorData');
const SensorRepository = require('../../domain/repositories/SensorRepository');
const DeviceRepository = require('../../domain/repositories/DeviceRepository');
const { pool } = require('../../config/db');

class SensorController {
  constructor() {
    this.sensorRepository = new SensorRepository();
    this.deviceRepository = new DeviceRepository();
    this.viewSensorDataUseCase = new ViewSensorData(this.sensorRepository);
  }

  async getLatestTelemetry(req, res) {
    const { deviceId } = req.params;
    const userId = req.user?.userId;
    try {
      const device = await this.deviceRepository.findById(deviceId);
      if (device && device.userId && device.userId !== userId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not own this device' });
      }
      
      const data = await this.viewSensorDataUseCase.execute(deviceId);
      
      // Map entity structure to REST presenter JSON response
      res.status(200).json({
        success: true,
        deviceId,
        sensor: data.sensorData ? {
          temperature: data.sensorData.temperature,
          humidity: data.sensorData.humidity,
          timestamp: data.sensorData.timestamp
        } : null,
        airQuality: data.airQuality ? {
          ppm: data.airQuality.ppm,
          status: data.airQuality.status,
          timestamp: data.airQuality.timestamp
        } : null
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async getAlertRules(req, res) {
    try {
      const rules = await this.sensorRepository.getActiveRules();
      res.status(200).json({ success: true, rules });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createAlertRule(req, res) {
    const { sensorType, operator, value, targetRecipient } = req.body;

    if (!sensorType || !operator || value === undefined || !targetRecipient) {
      return res.status(400).json({ success: false, error: 'Missing alert rule parameters' });
    }

    try {
      const queryText = `
        INSERT INTO iot_alert_rules (sensor_type, operator, value, is_enabled, target_recipient)
        VALUES ($1, $2, $3, true, $4)
        RETURNING id
      `;
      const result = await pool.query(queryText, [sensorType, operator, value, targetRecipient]);
      res.status(201).json({ success: true, ruleId: result.rows[0].id, message: 'Alert rule created successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteAlertRule(req, res) {
    const { ruleId } = req.params;
    try {
      const queryText = `
        DELETE FROM iot_alert_rules
        WHERE id = $1
      `;
      await pool.query(queryText, [ruleId]);
      res.status(200).json({ success: true, message: 'Alert rule deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAlertsHistory(req, res) {
    try {
      const queryText = `
        SELECT id, rule_id as "ruleId", sensor_type as "sensorType", operator, threshold, current_value as "currentValue", message, timestamp
        FROM iot_alerts_history
        ORDER BY timestamp DESC
        LIMIT 50
      `;
      const result = await pool.query(queryText);
      res.status(200).json({ success: true, alerts: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new SensorController();
