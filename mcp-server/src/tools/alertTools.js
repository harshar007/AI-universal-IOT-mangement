import { queryIotDb } from '../db.js';

export const alertTools = [
  {
    name: 'list_alert_rules',
    description: 'List all automated threshold alert rules configured in the IoT platform (e.g. Temperature > 30°C, Air Quality > 800).',
    inputSchema: {
      type: 'object',
      properties: {
        sensorType: {
          type: 'string',
          description: 'Optional filter by sensor type (e.g. "TEMPERATURE", "AIR_QUALITY", "HUMIDITY")'
        }
      }
    },
    handler: async ({ sensorType }) => {
      let sql = 'SELECT id, user_id, sensor_type, operator, value, is_enabled, target_recipient, created_at FROM iot_alert_rules';
      const params = [];

      if (sensorType) {
        params.push(sensorType.toUpperCase());
        sql += ` WHERE UPPER(sensor_type) = $1`;
      }

      sql += ' ORDER BY id ASC';
      const res = await queryIotDb(sql, params);
      return {
        count: res.rows.length,
        rules: res.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          sensorType: r.sensor_type,
          operator: r.operator,
          thresholdValue: parseFloat(r.value),
          isEnabled: r.is_enabled,
          targetRecipient: r.target_recipient,
          createdAt: r.created_at
        }))
      };
    }
  },

  {
    name: 'create_alert_rule',
    description: 'Create a new automated threshold alert rule that triggers when sensor telemetry breaches safety parameters.',
    inputSchema: {
      type: 'object',
      required: ['sensorType', 'operator', 'value', 'targetRecipient'],
      properties: {
        sensorType: {
          type: 'string',
          description: 'Sensor type to monitor (e.g. "TEMPERATURE", "HUMIDITY", "AIR_QUALITY", "PRESSURE", "VOLTAGE")'
        },
        operator: {
          type: 'string',
          enum: ['GREATER_THAN', 'LESS_THAN', 'EQUALS'],
          description: 'Comparison operator'
        },
        value: {
          type: 'number',
          description: 'Threshold trigger value'
        },
        targetRecipient: {
          type: 'string',
          description: 'Email or webhook address to notify upon trigger (e.g. "admin@nexus.io")'
        },
        userId: {
          type: 'string',
          description: 'Optional owner user ID'
        }
      }
    },
    handler: async ({ sensorType, operator, value, targetRecipient, userId = 'system' }) => {
      const sql = `
        INSERT INTO iot_alert_rules (user_id, sensor_type, operator, value, is_enabled, target_recipient)
        VALUES ($1, $2, $3, $4, true, $5)
        RETURNING *
      `;
      const res = await queryIotDb(sql, [userId, sensorType.toUpperCase(), operator.toUpperCase(), value, targetRecipient]);
      return {
        message: 'Alert rule created successfully',
        rule: res.rows[0]
      };
    }
  },

  {
    name: 'delete_alert_rule',
    description: 'Delete an existing automated alert rule by its rule ID.',
    inputSchema: {
      type: 'object',
      required: ['ruleId'],
      properties: {
        ruleId: {
          type: 'number',
          description: 'ID of the alert rule to delete'
        }
      }
    },
    handler: async ({ ruleId }) => {
      const checkRes = await queryIotDb('SELECT id FROM iot_alert_rules WHERE id = $1', [ruleId]);
      if (checkRes.rows.length === 0) {
        throw new Error(`Alert rule with ID ${ruleId} not found.`);
      }

      await queryIotDb('DELETE FROM iot_alert_rules WHERE id = $1', [ruleId]);
      return {
        message: `Alert rule ${ruleId} deleted successfully.`,
        deletedRuleId: ruleId
      };
    }
  },

  {
    name: 'get_alerts_history',
    description: 'Retrieve history of triggered safety alerts and threshold breaches across the IoT platform.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return (default: 50)'
        }
      }
    },
    handler: async ({ limit = 50 }) => {
      const res = await queryIotDb(
        'SELECT id, user_id, rule_id, sensor_type, operator, threshold, current_value, message, timestamp FROM iot_alerts_history ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return {
        count: res.rows.length,
        alerts: res.rows.map(a => ({
          id: a.id,
          userId: a.user_id,
          ruleId: a.rule_id,
          sensorType: a.sensor_type,
          operator: a.operator,
          threshold: parseFloat(a.threshold),
          currentValue: parseFloat(a.current_value),
          message: a.message,
          timestamp: a.timestamp
        }))
      };
    }
  }
];

export default alertTools;
