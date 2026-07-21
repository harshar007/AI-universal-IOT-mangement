require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5002,
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  databaseUrl: process.env.IOT_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5433/nexus_iot_db',
  jwtSecret: process.env.JWT_SECRET || 'nexus_super_secret_key_987654321'
};
