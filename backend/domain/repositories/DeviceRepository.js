const { iotPool } = require('../../config/db');
const Device = require('../entities/Device');
const crypto = require('crypto');

class DeviceRepository {
  generateSecretKey() {
    return crypto.randomBytes(24).toString('hex');
  }

  async saveDevice(id, name, userId = null) {
    const secretKey = this.generateSecretKey();
    const queryText = `
      INSERT INTO iot_devices (id, name, secret_key, status, user_id) 
      VALUES ($1, $2, $3, 'offline', $4) 
      ON CONFLICT (id) DO UPDATE SET name = $2, secret_key = $3, status = 'offline', user_id = $4
      RETURNING id, name, secret_key, status, last_heartbeat, user_id
    `;
    const result = await iotPool.query(queryText, [id, name, secretKey, userId]);
    const row = result.rows[0];
    return new Device(row.id, row.name, row.secret_key, row.status, row.last_heartbeat, row.user_id);
  }

  async findById(id) {
    const queryText = 'SELECT * FROM iot_devices WHERE id = $1';
    const result = await iotPool.query(queryText, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new Device(row.id, row.name, row.secret_key, row.status, row.last_heartbeat, row.user_id);
  }

  async findAllByUserId(userId = null) {
    if (!userId) return [];
    const queryText = 'SELECT * FROM iot_devices WHERE user_id = $1';
    const result = await iotPool.query(queryText, [String(userId)]);
    return result.rows.map(row => new Device(row.id, row.name, row.secret_key, row.status, row.last_heartbeat, row.user_id));
  }

  async updateSecretKey(id, secretKey, name = 'IoT Node', userId = null) {
    const queryText = `
      INSERT INTO iot_devices (id, name, secret_key, status, user_id)
      VALUES ($1, $2, $3, 'offline', $4)
      ON CONFLICT (id) DO UPDATE SET secret_key = $3, user_id = COALESCE(iot_devices.user_id, $4)
      RETURNING id, name, secret_key, status, last_heartbeat, user_id
    `;
    const result = await iotPool.query(queryText, [id, name, secretKey, userId ? String(userId) : null]);
    const row = result.rows[0];
    return new Device(row.id, row.name, row.secret_key, row.status, row.last_heartbeat, row.user_id);
  }
}

module.exports = DeviceRepository;
