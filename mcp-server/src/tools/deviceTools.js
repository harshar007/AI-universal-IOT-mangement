import crypto from 'crypto';
import { queryIotDb, queryUserDb } from '../db.js';

export const deviceTools = [
  {
    name: 'list_devices',
    description: 'Retrieve a list of all registered IoT devices in the Nunnarri platform with online/offline status, last heartbeat, and owner metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'online', 'offline'],
          description: 'Filter devices by connection status (default: "all")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of devices to return (default: 50)'
        }
      }
    },
    handler: async ({ status = 'all', limit = 50 }) => {
      let sql = 'SELECT id, name, status, last_heartbeat, user_id, org_id, created_at FROM iot_devices';
      const params = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` WHERE status = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await queryIotDb(sql, params);
      return {
        count: result.rows.length,
        devices: result.rows
      };
    }
  },

  {
    name: 'get_device',
    description: 'Get comprehensive details of a specific IoT device including its latest telemetry readings, logs, and connection status.',
    inputSchema: {
      type: 'object',
      required: ['deviceId'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Unique identifier of the IoT device (e.g. "esp32-main-board", "esp8266-nodemcu-01")'
        }
      }
    },
    handler: async ({ deviceId }) => {
      const devRes = await queryIotDb('SELECT * FROM iot_devices WHERE id = $1', [deviceId]);
      if (devRes.rows.length === 0) {
        throw new Error(`Device not found with ID: ${deviceId}`);
      }

      const device = devRes.rows[0];

      // Fetch latest telemetry for each pin/stream
      const telemRes = await queryIotDb(`
        SELECT DISTINCT ON (stream_key) stream_key, stream_value, timestamp
        FROM iot_telemetry
        WHERE device_id = $1
        ORDER BY stream_key, timestamp DESC
      `, [deviceId]);

      // Fetch last 5 logs
      const logsRes = await queryIotDb(
        'SELECT id, message, level, timestamp FROM iot_logs WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 5',
        [deviceId]
      );

      return {
        device: {
          id: device.id,
          name: device.name,
          status: device.status,
          lastHeartbeat: device.last_heartbeat,
          userId: device.user_id,
          orgId: device.org_id,
          createdAt: device.created_at
        },
        latestTelemetry: telemRes.rows,
        recentLogs: logsRes.rows
      };
    }
  },

  {
    name: 'register_device',
    description: 'Register a new IoT device into the Nunnarri platform and generate a device API secret key for MQTT/HTTP authorization.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'name'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Unique device identifier (alphanumeric and dashes, e.g. "esp32-greenhouse-01")'
        },
        name: {
          type: 'string',
          description: 'Human-readable name for the device (e.g. "Greenhouse Dual Sensor Node")'
        },
        userId: {
          type: 'string',
          description: 'Optional User ID or email of device owner'
        },
        orgId: {
          type: 'number',
          description: 'Optional Organization ID'
        }
      }
    },
    handler: async ({ deviceId, name, userId = 'system', orgId = null }) => {
      const secretKey = 'nunnarri_' + crypto.randomBytes(16).toString('hex');
      const insertSql = `
        INSERT INTO iot_devices (id, name, secret_key, status, user_id, org_id)
        VALUES ($1, $2, $3, 'offline', $4, $5)
        RETURNING id, name, secret_key, status, user_id, org_id, created_at
      `;
      const res = await queryIotDb(insertSql, [deviceId, name, secretKey, userId, orgId]);
      
      // Log registration
      await queryIotDb(
        "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'info')",
        [deviceId, `Device registered via MCP by user ${userId}`]
      );

      return {
        message: 'Device successfully registered in Nunnarri platform',
        device: res.rows[0]
      };
    }
  },

  {
    name: 'delete_device',
    description: 'Delete an IoT device and its associated telemetry history from the platform.',
    inputSchema: {
      type: 'object',
      required: ['deviceId'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Device ID to delete'
        }
      }
    },
    handler: async ({ deviceId }) => {
      const checkRes = await queryIotDb('SELECT id, name FROM iot_devices WHERE id = $1', [deviceId]);
      if (checkRes.rows.length === 0) {
        throw new Error(`Device "${deviceId}" does not exist.`);
      }

      await queryIotDb('DELETE FROM iot_devices WHERE id = $1', [deviceId]);
      return {
        message: `Device "${deviceId}" and its telemetry history have been successfully deleted.`,
        deletedDeviceId: deviceId
      };
    }
  }
];

export default deviceTools;
