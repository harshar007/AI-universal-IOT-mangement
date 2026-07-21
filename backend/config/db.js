const { Pool } = require('pg');
require('dotenv').config();

// User Database Connection String
const userConnectionString = process.env.USER_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5432/postgres';

// IoT Database Connection String
const iotConnectionString = process.env.IOT_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5432/postgres';

console.log('Connecting to User Database...');
const userPool = new Pool({
  connectionString: userConnectionString
});

console.log('Connecting to IoT Database...');
const iotPool = new Pool({
  connectionString: iotConnectionString
});

const initDB = async () => {
  try {
    // ==========================================
    // 1. Initialize User Database Tables
    // ==========================================
    const userClient = await userPool.connect();
    console.log('User DB PostgreSQL connected successfully!');

    // Users table
    await userClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'OPERATOR',
        profile_pic TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('User DB Table "users" verified/created.');

    // Ensure role column exists if upgrading existing users table
    await userClient.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT \'OPERATOR\';');
    await userClient.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;');

    // User Audit Logs table
    await userClient.query(`
      CREATE TABLE IF NOT EXISTS user_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('User DB Table "user_audit_logs" verified/created.');

    // Organizations table
    await userClient.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Organization Members table
    await userClient.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'MEMBER',
        PRIMARY KEY (organization_id, user_id)
      );
    `);
    console.log('User DB Tables "organizations" and "organization_members" verified/created.');

    userClient.release();

    // ==========================================
    // 2. Initialize IoT Database Tables
    // ==========================================
    const iotClient = await iotPool.connect();
    console.log('IoT DB PostgreSQL connected successfully!');

    // iot_devices table
    await iotClient.query(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        secret_key VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'offline',
        last_heartbeat TIMESTAMP,
        user_id VARCHAR(50),
        org_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await iotClient.query('ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS org_id INT;');
    console.log('IoT DB Table "iot_devices" verified/created.');

    // iot_telemetry table
    await iotClient.query(`
      CREATE TABLE IF NOT EXISTS iot_telemetry (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
        stream_key VARCHAR(50) NOT NULL,
        stream_value NUMERIC NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('IoT DB Table "iot_telemetry" verified/created.');

    // iot_logs table
    await iotClient.query(`
      CREATE TABLE IF NOT EXISTS iot_logs (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        level VARCHAR(20) DEFAULT 'info',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('IoT DB Table "iot_logs" verified/created.');

    // iot_alert_rules table
    await iotClient.query(`
      CREATE TABLE IF NOT EXISTS iot_alert_rules (
        id SERIAL PRIMARY KEY,
        sensor_type VARCHAR(50) NOT NULL,
        operator VARCHAR(20) NOT NULL,
        value NUMERIC NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        target_recipient VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('IoT DB Table "iot_alert_rules" verified/created.');

    // iot_alerts_history table
    await iotClient.query(`
      CREATE TABLE IF NOT EXISTS iot_alerts_history (
        id SERIAL PRIMARY KEY,
        rule_id INT,
        sensor_type VARCHAR(50) NOT NULL,
        operator VARCHAR(20) NOT NULL,
        threshold NUMERIC NOT NULL,
        current_value NUMERIC NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('IoT DB Table "iot_alerts_history" verified/created.');

    // Seed default rules if empty
    const countRulesRes = await iotClient.query('SELECT COUNT(*) FROM iot_alert_rules');
    if (parseInt(countRulesRes.rows[0].count, 10) === 0) {
      await iotClient.query(`
        INSERT INTO iot_alert_rules (sensor_type, operator, value, is_enabled, target_recipient)
        VALUES 
        ('TEMPERATURE', 'GREATER_THAN', 30.0, true, 'admin@nexus.io'),
        ('AIR_QUALITY', 'GREATER_THAN', 800.0, true, 'admin@nexus.io');
      `);
      console.log('IoT DB Default Alert Rules seeded.');
    }

    iotClient.release();
  } catch (error) {
    console.error('\n======================================================');
    console.error('DATABASE CONNECTION ERROR: Failed to connect to PostgreSQL databases.');
    console.error('Details:', error.message);
    console.error('======================================================\n');
  }
};

module.exports = {
  userPool,
  iotPool,
  pool: iotPool, // Fallback for general queries
  initDB
};
