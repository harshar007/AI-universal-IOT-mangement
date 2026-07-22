const { Pool } = require('pg');
require('dotenv').config();

const iotConnectionString = process.env.IOT_DATABASE_URL || 'postgres://postgres:prabha0312@localhost:5433/nexus_iot_db';

const pool = new Pool({
  connectionString: iotConnectionString
});

module.exports = {
  pool
};
