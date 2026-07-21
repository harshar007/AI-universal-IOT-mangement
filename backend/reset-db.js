const { userPool, iotPool } = require('./config/db');
require('dotenv').config();

const reset = async () => {
  try {
    console.log('--- Resetting User DB ---');
    const uClient = await userPool.connect();
    await uClient.query('DROP TABLE IF EXISTS user_audit_logs CASCADE;');
    await uClient.query('DROP TABLE IF EXISTS organization_members CASCADE;');
    await uClient.query('DROP TABLE IF EXISTS organizations CASCADE;');
    await uClient.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('User DB tables dropped.');
    uClient.release();

    console.log('--- Resetting IoT DB ---');
    const iClient = await iotPool.connect();
    await iClient.query('DROP TABLE IF EXISTS iot_alerts_history CASCADE;');
    await iClient.query('DROP TABLE IF EXISTS iot_alert_rules CASCADE;');
    await iClient.query('DROP TABLE IF EXISTS iot_logs CASCADE;');
    await iClient.query('DROP TABLE IF EXISTS iot_telemetry CASCADE;');
    await iClient.query('DROP TABLE IF EXISTS iot_devices CASCADE;');
    console.log('IoT DB tables dropped.');
    iClient.release();

    console.log('Re-initializing DB schemas...');
    const { initDB } = require('./config/db');
    await initDB();

    console.log('Dual Database reset completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting databases:', error.message);
    process.exit(1);
  }
};

reset();
