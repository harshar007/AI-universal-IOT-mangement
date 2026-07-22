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
      if (!device || String(device.userId) !== String(userId)) {
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
    const userId = req.user?.userId;
    try {
      let rules = await this.sensorRepository.getActiveRules(userId);
      if (rules.length === 0) {
        // Seed default rules for this user
        const queryText = `
          INSERT INTO iot_alert_rules (user_id, sensor_type, operator, value, is_enabled, target_recipient)
          VALUES 
          ($1, 'TEMPERATURE', 'GREATER_THAN', 30.0, true, 'admin@nexus.io'),
          ($1, 'AIR_QUALITY', 'GREATER_THAN', 800.0, true, 'admin@nexus.io')
          RETURNING id, sensor_type as "sensorType", operator, value, is_enabled as "isEnabled", target_recipient as "targetRecipient", user_id as "userId"
        `;
        const seedRes = await pool.query(queryText, [String(userId)]);
        rules = seedRes.rows;
      }
      res.status(200).json({ success: true, rules });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createAlertRule(req, res) {
    const { sensorType, operator, value, targetRecipient } = req.body;
    const userId = req.user?.userId;

    if (!sensorType || !operator || value === undefined || !targetRecipient) {
      return res.status(400).json({ success: false, error: 'Missing alert rule parameters' });
    }

    try {
      const queryText = `
        INSERT INTO iot_alert_rules (user_id, sensor_type, operator, value, is_enabled, target_recipient)
        VALUES ($1, $2, $3, $4, true, $5)
        RETURNING id
      `;
      const result = await pool.query(queryText, [String(userId), sensorType, operator, value, targetRecipient]);
      res.status(201).json({ success: true, ruleId: result.rows[0].id, message: 'Alert rule created successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteAlertRule(req, res) {
    const { ruleId } = req.params;
    const userId = req.user?.userId;
    try {
      const queryText = `
        DELETE FROM iot_alert_rules
        WHERE id = $1 AND user_id = $2
      `;
      await pool.query(queryText, [ruleId, String(userId)]);
      res.status(200).json({ success: true, message: 'Alert rule deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAlertsHistory(req, res) {
    const userId = req.user?.userId;
    try {
      const queryText = `
        SELECT id, rule_id as "ruleId", sensor_type as "sensorType", operator, threshold, current_value as "currentValue", message, timestamp
        FROM iot_alerts_history
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT 50
      `;
      const result = await pool.query(queryText, [String(userId)]);
      res.status(200).json({ success: true, alerts: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new SensorController();
