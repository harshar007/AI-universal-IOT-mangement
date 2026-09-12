import pg from 'pg';


const userPool = new pg.Pool({
  connectionString: 'postgres://postgres:prabha0312@localhost:5432/user_db'
});

const iotPool = new pg.Pool({
  connectionString: 'postgres://postgres:prabha0312@localhost:5432/nexus_iot_db'
});

async function init() {
  console.log('Initializing user_db...');
  const uClient = await userPool.connect();
  await uClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      github_id VARCHAR(100) UNIQUE,
      role VARCHAR(20) DEFAULT 'OPERATOR',
      profile_pic TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await uClient.query(`
    CREATE TABLE IF NOT EXISTS user_audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45),
      metadata JSONB,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await uClient.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await uClient.query(`
    CREATE TABLE IF NOT EXISTS organization_members (
      organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'MEMBER',
      PRIMARY KEY (organization_id, user_id)
    );
  `);
  uClient.release();
  console.log('user_db initialized.');

  console.log('Initializing nexus_iot_db...');
  const iClient = await iotPool.connect();
  await iClient.query(`
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
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS iot_telemetry (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
      stream_key VARCHAR(50) NOT NULL,
      stream_value NUMERIC NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS iot_logs (
      id SERIAL PRIMARY KEY,
      device_id VARCHAR(50) REFERENCES iot_devices(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      level VARCHAR(20) DEFAULT 'info',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS iot_alert_rules (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50),
      sensor_type VARCHAR(50) NOT NULL,
      operator VARCHAR(20) NOT NULL,
      value NUMERIC NOT NULL,
      is_enabled BOOLEAN DEFAULT TRUE,
      target_recipient VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS iot_alerts_history (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50),
      rule_id INT,
      sensor_type VARCHAR(50) NOT NULL,
      operator VARCHAR(20) NOT NULL,
      threshold NUMERIC NOT NULL,
      current_value NUMERIC NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS user_ai_settings (
      user_id VARCHAR(50) PRIMARY KEY,
      is_enabled BOOLEAN DEFAULT TRUE,
      current_profile VARCHAR(20) DEFAULT 'SAFETY',
      device_ai_settings JSONB DEFAULT '{}'::jsonb,
      recent_decisions JSONB DEFAULT '[]'::jsonb,
      last_evaluated_at TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS user_widgets (
      user_id VARCHAR(50) PRIMARY KEY,
      widgets_map JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await iClient.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      sender VARCHAR(20) NOT NULL,
      text TEXT NOT NULL,
      commands JSONB DEFAULT '[]'::jsonb,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  iClient.release();
  console.log('nexus_iot_db initialized.');

  await userPool.end();
  await iotPool.end();
}

init().catch(console.error);
