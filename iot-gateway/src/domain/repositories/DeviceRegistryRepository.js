const db = require('../../infrastructure/database/PostgresDb');
const logger = require('../../utils/logger');
const Device = require('../entities/Device');
const crypto = require('crypto');

class DeviceRegistryRepository {
  constructor() {
    this.cache = new Map();
  }

  generateSecretKey() {
    return crypto.randomBytes(24).toString('hex');
  }

  async registerDevice(deviceId, name, userId = null) {
    const secretKey = this.generateSecretKey();

    try {
      await db.query(
        `INSERT INTO iot_devices (id, name, secret_key, status, user_id) 
         VALUES ($1, $2, $3, 'offline', $4) 
         ON CONFLICT (id) DO UPDATE SET name = $2, secret_key = $3, status = 'offline', user_id = $4`,
        [deviceId, name, secretKey, userId]
      );
    } catch (err) {
      logger.warn(`Could not save device ${deviceId} to database, utilizing in-memory cache.`);
    }

    const device = new Device(deviceId, name, secretKey, 'offline', null, userId);
    this.cache.set(deviceId, device);
    return device;
  }

  async authenticateDevice(deviceId, secretKey) {
    let device = this.cache.get(deviceId);

    if (!device) {
      try {
        const res = await db.query(
          'SELECT id, name, secret_key, status, user_id FROM iot_devices WHERE id = $1',
          [deviceId]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          device = new Device(row.id, row.name, row.secret_key, row.status, null, row.user_id);
          this.cache.set(deviceId, device);
        }
      } catch (err) {
        logger.error(`Error querying database for authentication: ${err.message}`);
      }
    }

    if (device && device.secretKey !== secretKey) {
      try {
        const res = await db.query(
          'SELECT secret_key FROM iot_devices WHERE id = $1',
          [deviceId]
        );
        if (res.rows.length > 0 && res.rows[0].secret_key === secretKey) {
          logger.info(`Stale cache key resolved. Syncing regenerated token for device ${deviceId} from DB.`);
          device.secretKey = secretKey;
          this.cache.set(deviceId, device);
        }
      } catch (err) {
        logger.error(`Error re-fetching key from database for verification: ${err.message}`);
      }
    }

    if (device && device.secretKey === secretKey) {
      logger.info(`Device authenticated successfully: ${deviceId}`);
      return true;
    }

    logger.warn(`Device authentication failed for: ${deviceId}`);
    return false;
  }

  async updateDeviceStatus(deviceId, status) {
    const device = this.cache.get(deviceId);
    if (device) {
      device.status = status;
      if (status === 'online') {
        device.lastHeartbeat = new Date();
      }
    }

    try {
      await db.query(
        'UPDATE iot_devices SET status = $1, last_heartbeat = $2 WHERE id = $3',
        [status, status === 'online' ? new Date() : null, deviceId]
      );
    } catch (err) {
      // Silent fail if DB offline
    }
  }

  async getAllDevices(userId = null) {
    try {
      const queryText = userId
        ? 'SELECT id, name, secret_key, status, last_heartbeat, user_id FROM iot_devices WHERE user_id = $1 OR user_id IS NULL'
        : 'SELECT id, name, secret_key, status, last_heartbeat, user_id FROM iot_devices';
      const queryParams = userId ? [userId] : [];

      const res = await db.query(queryText, queryParams);
      if (res.rows.length > 0) {
        return res.rows.map(row => new Device(row.id, row.name, row.secret_key, row.status, row.last_heartbeat, row.user_id));
      }
    } catch (err) {
      // Fall back to cache values
    }

    return Array.from(this.cache.values())
      .filter(dev => !userId || dev.userId === userId || !dev.userId);
  }

  async regenerateDeviceToken(deviceId) {
    const secretKey = this.generateSecretKey();

    try {
      await db.query(
        'UPDATE iot_devices SET secret_key = $1 WHERE id = $2',
        [secretKey, deviceId]
      );
    } catch (err) {
      logger.warn(`Could not update device token for ${deviceId} in database.`);
    }

    let device = this.cache.get(deviceId);
    if (device) {
      device.secretKey = secretKey;
    } else {
      device = new Device(deviceId, 'Unknown Device', secretKey, 'offline', null, null);
      this.cache.set(deviceId, device);
    }

    logger.info(`Secret key regenerated for device: ${deviceId}`);
    return device;
  }
}

module.exports = new DeviceRegistryRepository();
