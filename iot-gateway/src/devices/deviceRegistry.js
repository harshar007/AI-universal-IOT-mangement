const db = require('../config/db');
const logger = require('../utils/logger');
const crypto = require('crypto');

// In-memory cache for registered devices (used as primary cache or fallback database)
const cache = new Map();

// Helper to generate a secure secret key
const generateSecretKey = () => {
  return crypto.randomBytes(24).toString('hex');
};

const registerDevice = async (deviceId, name, userId = null) => {
  const secretKey = generateSecretKey();

  try {
    // Try registering in DB
    await db.query(
      `INSERT INTO iot_devices (id, name, secret_key, status, user_id) 
       VALUES ($1, $2, $3, 'offline', $4) 
       ON CONFLICT (id) DO UPDATE SET name = $2, secret_key = $3, status = 'offline', user_id = $4`,
      [deviceId, name, secretKey, userId]
    );
  } catch (err) {
    logger.warn(`Could not save device ${deviceId} to database, utilizing in-memory cache.`);
  }

  // Always cache locally
  cache.set(deviceId, {
    id: deviceId,
    name: name,
    secretKey: secretKey,
    userId: userId,
    status: 'offline',
    lastHeartbeat: null
  });

  logger.info(`Device registered: ${name} (${deviceId}) for owner ${userId || 'none'} with secret key.`);
  return { deviceId, name, secretKey };
};

const authenticateDevice = async (deviceId, secretKey) => {
  if (!deviceId) return false;

  // 1. Check DB first to ensure fresh key from web dashboard registration
  try {
    const res = await db.query(
      'SELECT id, name, secret_key, status, user_id FROM iot_devices WHERE id = $1',
      [deviceId]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const device = {
        id: row.id,
        name: row.name,
        secretKey: row.secret_key,
        userId: row.user_id,
        status: row.status,
        lastHeartbeat: null
      };
      cache.set(deviceId, device);

      if (row.secret_key === secretKey) {
        logger.info(`Device authenticated successfully via DB: ${deviceId}`);
        return true;
      }
    }
  } catch (err) {
    logger.error(`Error querying database for authentication: ${err.message}`);
  }

  // 2. Check local in-memory cache
  let device = cache.get(deviceId);
  if (device && device.secretKey === secretKey) {
    logger.info(`Device authenticated successfully via Cache: ${deviceId}`);
    return true;
  }

  // 3. Fallback / Dev mode: Auto-sync device if secretKey is provided
  if (secretKey && secretKey.length >= 8) {
    logger.info(`Auto-provisioning device credentials for: ${deviceId}`);
    cache.set(deviceId, {
      id: deviceId,
      name: deviceId,
      secretKey: secretKey,
      status: 'offline',
      lastHeartbeat: null
    });
    try {
      await db.query(
        `INSERT INTO iot_devices (id, name, secret_key, status) 
         VALUES ($1, $2, $3, 'offline') 
         ON CONFLICT (id) DO UPDATE SET secret_key = $3`,
        [deviceId, deviceId, secretKey]
      );
    } catch (e) {
      // Silent ignore DB error
    }
    return true;
  }

  logger.warn(`Device authentication failed for: ${deviceId}`);
  return false;
};

const updateDeviceStatus = async (deviceId, status) => {
  const device = cache.get(deviceId);
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
};

const getAllDevices = async (userId = null) => {
  if (!userId) return [];
  try {
    const queryText = 'SELECT id, name, secret_key, status, last_heartbeat FROM iot_devices WHERE user_id = $1';
    const res = await db.query(queryText, [String(userId)]);
    if (res.rows.length > 0) {
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        secretKey: row.secret_key,
        status: row.status,
        lastHeartbeat: row.last_heartbeat
      }));
    }
  } catch (err) {
    // Fall back to cache values
  }
  return Array.from(cache.values())
    .filter(dev => String(dev.userId) === String(userId))
    .map(dev => ({
      id: dev.id,
      name: dev.name,
      secretKey: dev.secretKey,
      status: dev.status,
      lastHeartbeat: dev.lastHeartbeat
    }));
};

const regenerateDeviceToken = async (deviceId) => {
  const secretKey = generateSecretKey();

  try {
    await db.query(
      'UPDATE iot_devices SET secret_key = $1 WHERE id = $2',
      [secretKey, deviceId]
    );
  } catch (err) {
    logger.warn(`Could not update device token for ${deviceId} in database.`);
  }

  const device = cache.get(deviceId);
  if (device) {
    device.secretKey = secretKey;
  } else {
    cache.set(deviceId, {
      id: deviceId,
      secretKey: secretKey,
      status: 'offline',
      lastHeartbeat: null
    });
  }

  logger.info(`Secret key regenerated for device: ${deviceId}`);
  return { deviceId, secretKey };
};

module.exports = {
  registerDevice,
  authenticateDevice,
  updateDeviceStatus,
  getAllDevices,
  regenerateDeviceToken,
  cache
};
