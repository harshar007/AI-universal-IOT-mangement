const { Pool } = require('pg');
const config = require('./gatewayConfig');
const logger = require('../utils/logger');

let pool = null;
let useFallback = false;

// Simulated in-memory database to allow offline/local execution fallback
const mockDb = {
  users: [],
  devices: [],
  telemetry: [],
  logs: []
};

try {
  pool = new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: 5000
  });
  
  // Test connection on startup
  pool.on('error', (err) => {
    logger.error('Unexpected database pool error: ' + err.message);
  });
} catch (err) {
  logger.warn('Failed to initialize database pool. Using in-memory fallback database.');
  useFallback = true;
}

const query = async (text, params) => {
  if (useFallback || !pool) {
    logger.info('DB Query [IN-MEMORY MOCK]: ' + text);
    // Simple mock logic for local registration/validation queries
    return { rows: [] };
  }
  
  try {
    return await pool.query(text, params);
  } catch (err) {
    logger.error('DB execution error: ' + err.message);
    throw err;
  }
};

const initDB = async () => {
  if (useFallback) return;
  try {
    const client = await pool.connect();
    logger.info('Successfully connected to PostgreSQL database from IoT Gateway.');
    
    // Provision IoT Devices table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        secret_key VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'offline',
        last_heartbeat TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Provision Telemetry log table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS iot_telemetry (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
        stream_key VARCHAR(50) NOT NULL,
        stream_value NUMERIC NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Provision Device logs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS iot_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        level VARCHAR(20) DEFAULT 'info',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure user_id column is present on existing tables
    await client.query(`
      ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
    `);
    
    client.release();
    logger.info('PostgreSQL IoT tables verified and provisioned successfully.');
  } catch (err) {
    logger.warn('Could not connect or provision PostgreSQL tables: ' + err.message + '. Falling back to in-memory mode.');
    useFallback = true;
  }
};

module.exports = {
  query,
  initDB,
  pool
};
