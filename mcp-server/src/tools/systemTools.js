import { queryIotDb, queryUserDb, testDbConnections } from '../db.js';

export const systemTools = [
  {
    name: 'get_system_health',
    description: 'Check the health status and connectivity of the dual PostgreSQL databases (user-db, iot-db) and IoT gateway services.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const dbStatus = await testDbConnections();
      const isHealthy = dbStatus.userDb && dbStatus.iotDb;

      return {
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        databases: {
          userDatabase: {
            connected: dbStatus.userDb,
            error: dbStatus.userDbError || null
          },
          iotDatabase: {
            connected: dbStatus.iotDb,
            error: dbStatus.iotDbError || null
          }
        },
        services: {
          mqttBrokerPort: 1883,
          gatewayPort: 5002,
          backendRestPort: 5000,
          aiBackendPort: 5006,
          mcpServerPort: 5007
        }
      };
    }
  },

  {
    name: 'get_system_stats',
    description: 'Get comprehensive overview statistics of the Nunnarri IoT Platform (device counts, telemetry records, users, alerts).',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      // User DB counts
      let usersCount = 0;
      let orgsCount = 0;
      let auditLogsCount = 0;
      try {
        const uRes = await queryUserDb('SELECT COUNT(*) FROM users');
        usersCount = parseInt(uRes.rows[0].count, 10);
        const oRes = await queryUserDb('SELECT COUNT(*) FROM organizations');
        orgsCount = parseInt(oRes.rows[0].count, 10);
        const aRes = await queryUserDb('SELECT COUNT(*) FROM user_audit_logs');
        auditLogsCount = parseInt(aRes.rows[0].count, 10);
      } catch (_) {}

      // IoT DB counts
      let devicesCount = 0;
      let onlineDevicesCount = 0;
      let telemetryCount = 0;
      let logsCount = 0;
      let rulesCount = 0;
      let alertsCount = 0;
      try {
        const dRes = await queryIotDb('SELECT COUNT(*) FROM iot_devices');
        devicesCount = parseInt(dRes.rows[0].count, 10);

        const onRes = await queryIotDb("SELECT COUNT(*) FROM iot_devices WHERE status = 'online'");
        onlineDevicesCount = parseInt(onRes.rows[0].count, 10);

        const tRes = await queryIotDb('SELECT COUNT(*) FROM iot_telemetry');
        telemetryCount = parseInt(tRes.rows[0].count, 10);

        const lRes = await queryIotDb('SELECT COUNT(*) FROM iot_logs');
        logsCount = parseInt(lRes.rows[0].count, 10);

        const rRes = await queryIotDb('SELECT COUNT(*) FROM iot_alert_rules');
        rulesCount = parseInt(rRes.rows[0].count, 10);

        const alRes = await queryIotDb('SELECT COUNT(*) FROM iot_alerts_history');
        alertsCount = parseInt(alRes.rows[0].count, 10);
      } catch (_) {}

      return {
        platform: 'நுண்ணறி (Nunnarri) Smart Intelligence IoT Platform',
        metrics: {
          totalDevices: devicesCount,
          onlineDevices: onlineDevicesCount,
          offlineDevices: devicesCount - onlineDevicesCount,
          totalTelemetryRecords: telemetryCount,
          totalLogs: logsCount,
          activeAlertRules: rulesCount,
          triggeredAlerts: alertsCount,
          totalUsers: usersCount,
          organizations: orgsCount,
          auditLogs: auditLogsCount
        }
      };
    }
  },

  {
    name: 'get_audit_logs',
    description: 'Query security and administration audit logs recorded in the User Database.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of audit records to return (default: 50)'
        }
      }
    },
    handler: async ({ limit = 50 }) => {
      const res = await queryUserDb(
        'SELECT id, user_id, action, ip_address, metadata, timestamp FROM user_audit_logs ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return {
        count: res.rows.length,
        auditLogs: res.rows
      };
    }
  },

  {
    name: 'analyze_anomalies',
    description: 'Perform an intelligent anomaly scan across all devices and recent telemetry data to detect temperature spikes, sensor dropouts, or threshold violations.',
    inputSchema: {
      type: 'object',
      properties: {
        lookbackMinutes: {
          type: 'number',
          description: 'Number of minutes to scan backwards in telemetry data (default: 60)'
        }
      }
    },
    handler: async ({ lookbackMinutes = 60 }) => {
      // 1. Fetch offline devices
      const offlineRes = await queryIotDb(
        "SELECT id, name, last_heartbeat FROM iot_devices WHERE status = 'offline' OR last_heartbeat < NOW() - INTERVAL '5 minutes'"
      );

      // 2. Fetch extreme telemetry readings in window
      const telemetryRes = await queryIotDb(`
        SELECT t.device_id, d.name as device_name, t.stream_key, t.stream_value, t.timestamp
        FROM iot_telemetry t
        JOIN iot_devices d ON t.device_id = d.id
        WHERE t.timestamp >= NOW() - INTERVAL '${parseInt(lookbackMinutes, 10)} minutes'
        ORDER BY t.timestamp DESC
      `);

      const anomalies = [];

      // Check offline devices
      offlineRes.rows.forEach(dev => {
        anomalies.push({
          severity: 'WARNING',
          type: 'DEVICE_OFFLINE',
          deviceId: dev.id,
          deviceName: dev.name,
          details: `Device has missed heartbeats and is currently offline. Last seen: ${dev.last_heartbeat || 'Never'}`
        });
      });

      // Check threshold anomalies in telemetry
      telemetryRes.rows.forEach(row => {
        const val = parseFloat(row.stream_value);
        const key = (row.stream_key || '').toLowerCase();

        if (key.includes('temp') && val > 40) {
          anomalies.push({
            severity: 'CRITICAL',
            type: 'HIGH_TEMPERATURE',
            deviceId: row.device_id,
            deviceName: row.device_name,
            sensorKey: row.stream_key,
            value: val,
            timestamp: row.timestamp,
            details: `Temperature reading of ${val}°C exceeds critical threshold of 40°C.`
          });
        }

        if ((key.includes('aqi') || key.includes('air')) && val > 300) {
          anomalies.push({
            severity: 'CRITICAL',
            type: 'HAZARDOUS_AIR_QUALITY',
            deviceId: row.device_id,
            deviceName: row.device_name,
            sensorKey: row.stream_key,
            value: val,
            timestamp: row.timestamp,
            details: `Air Quality Index of ${val} is in the hazardous danger zone (>300).`
          });
        }
      });

      return {
        scanWindowMinutes: lookbackMinutes,
        totalAnomaliesDetected: anomalies.length,
        anomalies,
        summary: anomalies.length === 0
          ? 'All IoT devices and environmental sensors are operating within optimal parameters.'
          : `Detected ${anomalies.length} anomaly conditions requiring attention.`
      };
    }
  }
];

export default systemTools;
