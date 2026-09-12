import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const userPool = new Pool({
  connectionString: config.userDatabaseUrl
});

export const iotPool = new Pool({
  connectionString: config.iotDatabaseUrl
});

userPool.on('error', (err) => {
  console.error('[MCP DB] Unexpected error on idle user DB client:', err.message);
});

iotPool.on('error', (err) => {
  console.error('[MCP DB] Unexpected error on idle IoT DB client:', err.message);
});

export async function queryUserDb(text, params) {
  return userPool.query(text, params);
}

export async function queryIotDb(text, params) {
  return iotPool.query(text, params);
}

export async function testDbConnections() {
  const result = { userDb: false, iotDb: false, error: null };
  try {
    await userPool.query('SELECT 1');
    result.userDb = true;
  } catch (err) {
    result.userDbError = err.message;
  }
  try {
    await iotPool.query('SELECT 1');
    result.iotDb = true;
  } catch (err) {
    result.iotDbError = err.message;
  }
  return result;
}

export default {
  userPool,
  iotPool,
  queryUserDb,
  queryIotDb,
  testDbConnections
};
