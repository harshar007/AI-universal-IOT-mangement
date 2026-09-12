import { queryIotDb } from '../db.js';

export const telemetryTools = [
  {
    name: 'get_device_telemetry',
    description: 'Query time-series sensor telemetry data (temperature, humidity, air quality, voltage, etc.) for a device.',
    inputSchema: {
      type: 'object',
      required: ['deviceId'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Device ID to fetch telemetry for'
        },
        streamKey: {
          type: 'string',
          description: 'Optional filter by telemetry stream key (e.g. "temperature", "humidity", "V1", "V2", "aqi")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of data points to return (default: 50)'
        }
      }
    },
    handler: async ({ deviceId, streamKey, limit = 50 }) => {
      let sql = 'SELECT id, stream_key, stream_value, timestamp FROM iot_telemetry WHERE device_id = $1';
      const params = [deviceId];

      if (streamKey) {
        params.push(streamKey);
        sql += ` AND stream_key = $${params.length}`;
      }

      sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await queryIotDb(sql, params);
      return {
        deviceId,
        streamKey: streamKey || 'all',
        dataPointsCount: res.rows.length,
        telemetry: res.rows.map(r => ({
          id: r.id,
          streamKey: r.stream_key,
          value: parseFloat(r.stream_value),
          timestamp: r.timestamp
        }))
      };
    }
  },

  {
    name: 'publish_telemetry',
    description: 'Publish and store a new telemetry sensor reading or virtual pin state in the Nunnarri time-series database.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'streamKey', 'streamValue'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Device ID sending the telemetry'
        },
        streamKey: {
          type: 'string',
          description: 'Telemetry key / sensor type (e.g. "temperature", "humidity", "co2", "V1")'
        },
        streamValue: {
          type: 'number',
          description: 'Numeric telemetry value'
        }
      }
    },
    handler: async ({ deviceId, streamKey, streamValue }) => {
      // 1. Insert telemetry
      const res = await queryIotDb(
        'INSERT INTO iot_telemetry (device_id, stream_key, stream_value) VALUES ($1, $2, $3) RETURNING *',
        [deviceId, streamKey, streamValue]
      );

      // 2. Update device heartbeat and status to online
      await queryIotDb(
        "UPDATE iot_devices SET last_heartbeat = NOW(), status = 'online' WHERE id = $1",
        [deviceId]
      );

      return {
        message: 'Telemetry recorded successfully',
        data: {
          id: res.rows[0].id,
          deviceId: res.rows[0].device_id,
          streamKey: res.rows[0].stream_key,
          streamValue: parseFloat(res.rows[0].stream_value),
          timestamp: res.rows[0].timestamp
        }
      };
    }
  },

  {
    name: 'get_device_logs',
    description: 'Fetch diagnostic, warning, and operational logs recorded for an IoT device or system component.',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'string',
          description: 'Optional device ID filter. If omitted, returns recent logs across all devices.'
        },
        level: {
          type: 'string',
          enum: ['all', 'info', 'warn', 'error'],
          description: 'Log level filter (default: "all")'
        },
        limit: {
          type: 'number',
          description: 'Max logs to return (default: 50)'
        }
      }
    },
    handler: async ({ deviceId, level = 'all', limit = 50 }) => {
      let sql = 'SELECT id, device_id, message, level, timestamp FROM iot_logs';
      const params = [];
      const where = [];

      if (deviceId) {
        params.push(deviceId);
        where.push(`device_id = $${params.length}`);
      }

      if (level && level !== 'all') {
        params.push(level);
        where.push(`level = $${params.length}`);
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
      }

      sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await queryIotDb(sql, params);
      return {
        count: res.rows.length,
        logs: res.rows
      };
    }
  },

  {
    name: 'log_device_event',
    description: 'Record an informational, warning, or error log event into the IoT system log table.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'message'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'IoT device ID'
        },
        message: {
          type: 'string',
          description: 'Log message content'
        },
        level: {
          type: 'string',
          enum: ['info', 'warn', 'error'],
          description: 'Log severity level (default: "info")'
        }
      }
    },
    handler: async ({ deviceId, message, level = 'info' }) => {
      const res = await queryIotDb(
        'INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, $3) RETURNING *',
        [deviceId, message, level]
      );
      return {
        message: 'Log entry recorded',
        log: res.rows[0]
      };
    }
  }
];

export default telemetryTools;
