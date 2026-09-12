import { queryIotDb, queryUserDb } from '../db.js';
import { systemTools } from '../tools/systemTools.js';

export const allResources = [
  {
    uri: 'nunnarri://devices',
    name: 'IoT Devices List',
    description: 'Real-time JSON listing of all registered devices in Nunnarri with online/offline status and metadata.',
    mimeType: 'application/json',
    handler: async () => {
      const res = await queryIotDb('SELECT id, name, status, last_heartbeat, user_id, org_id, created_at FROM iot_devices ORDER BY created_at DESC');
      return JSON.stringify(res.rows, null, 2);
    }
  },

  {
    uri: 'nunnarri://system/health',
    name: 'System Health & Services Status',
    description: 'Current health status of UserDB, IoTDB, and microservices.',
    mimeType: 'application/json',
    handler: async () => {
      const healthTool = systemTools.find(t => t.name === 'get_system_health');
      const health = await healthTool.handler();
      return JSON.stringify(health, null, 2);
    }
  },

  {
    uri: 'nunnarri://system/stats',
    name: 'System Metrics & Statistics',
    description: 'Total metrics for devices, telemetry records, users, and alert history.',
    mimeType: 'application/json',
    handler: async () => {
      const statsTool = systemTools.find(t => t.name === 'get_system_stats');
      const stats = await statsTool.handler();
      return JSON.stringify(stats, null, 2);
    }
  },

  {
    uri: 'nunnarri://alerts/rules',
    name: 'Active Alert Rules',
    description: 'Configured safety threshold rules for temperature, humidity, AQI, and other sensors.',
    mimeType: 'application/json',
    handler: async () => {
      const res = await queryIotDb('SELECT * FROM iot_alert_rules ORDER BY id ASC');
      return JSON.stringify(res.rows, null, 2);
    }
  },

  {
    uri: 'nunnarri://alerts/recent',
    name: 'Recent Triggered Alerts History',
    description: 'Last 20 triggered threshold alert records and sensor safety breaches.',
    mimeType: 'application/json',
    handler: async () => {
      const res = await queryIotDb('SELECT * FROM iot_alerts_history ORDER BY timestamp DESC LIMIT 20');
      return JSON.stringify(res.rows, null, 2);
    }
  }
];

export default allResources;
