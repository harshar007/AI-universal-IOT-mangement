import { queryIotDb } from '../db.js';
import { dispatchCommandToDevice, dispatchOtaUpdate } from '../gateway.js';

export const controlTools = [
  {
    name: 'send_device_command',
    description: 'Dispatch a control action to an IoT device/microcontroller via the MQTT gateway (e.g. toggle relays, adjust sliders, trigger motors).',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'action'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Target IoT device ID (e.g. "esp32-main-board", "esp8266-relay-board")'
        },
        action: {
          type: 'string',
          description: 'Action command name (e.g. "toggle", "setValue", "reboot", "setRelay", "setSpeed")'
        },
        value: {
          description: 'Value to send with the command (can be boolean, number, or string)'
        }
      }
    },
    handler: async ({ deviceId, action, value }) => {
      // 1. Verify device exists
      const devRes = await queryIotDb('SELECT id, name, status FROM iot_devices WHERE id = $1', [deviceId]);
      if (devRes.rows.length === 0) {
        throw new Error(`Device "${deviceId}" not found.`);
      }

      // 2. Dispatch via gateway/MQTT
      const result = await dispatchCommandToDevice(deviceId, action, value);

      // 3. Log event
      await queryIotDb(
        "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'info')",
        [deviceId, `MCP command executed: action=${action}, value=${JSON.stringify(value)}`]
      );

      return {
        deviceId,
        action,
        value,
        gatewayResponse: result,
        timestamp: new Date().toISOString()
      };
    }
  },

  {
    name: 'set_virtual_pin',
    description: 'Set or update the state of a Blynk-style Virtual Pin (V0 to V255) on an IoT device. Updates telemetry records and dispatches command to physical hardware.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'pin', 'value'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'IoT device ID'
        },
        pin: {
          type: 'string',
          description: 'Virtual Pin identifier (e.g. "V0", "V1", "V2", "V3", "V255")'
        },
        value: {
          type: 'number',
          description: 'Numerical value to write to the virtual pin (e.g. 1 for ON, 0 for OFF, or 0-255 for PWM)'
        }
      }
    },
    handler: async ({ deviceId, pin, value }) => {
      const normalizedPin = pin.toUpperCase();
      
      // 1. Verify device exists
      const devRes = await queryIotDb('SELECT id, name FROM iot_devices WHERE id = $1', [deviceId]);
      if (devRes.rows.length === 0) {
        throw new Error(`Device "${deviceId}" not found.`);
      }

      // 2. Store in telemetry history
      await queryIotDb(
        'INSERT INTO iot_telemetry (device_id, stream_key, stream_value) VALUES ($1, $2, $3)',
        [deviceId, normalizedPin, value]
      );

      // 3. Dispatch to hardware gateway
      const dispatchResult = await dispatchCommandToDevice(deviceId, normalizedPin, value);

      // 4. Log virtual pin action
      await queryIotDb(
        "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'info')",
        [deviceId, `Virtual Pin ${normalizedPin} updated to ${value}`]
      );

      return {
        deviceId,
        pin: normalizedPin,
        value,
        status: 'applied',
        hardwareDispatch: dispatchResult,
        timestamp: new Date().toISOString()
      };
    }
  },

  {
    name: 'get_virtual_pin',
    description: 'Retrieve the latest recorded value and timestamp of a Virtual Pin (V0 - V255) for a specific IoT device.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'pin'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Target device ID'
        },
        pin: {
          type: 'string',
          description: 'Virtual Pin identifier (e.g. "V1", "V2")'
        }
      }
    },
    handler: async ({ deviceId, pin }) => {
      const normalizedPin = pin.toUpperCase();
      const res = await queryIotDb(`
        SELECT stream_key, stream_value, timestamp
        FROM iot_telemetry
        WHERE device_id = $1 AND UPPER(stream_key) = $2
        ORDER BY timestamp DESC
        LIMIT 1
      `, [deviceId, normalizedPin]);

      if (res.rows.length === 0) {
        return {
          deviceId,
          pin: normalizedPin,
          value: null,
          message: `No telemetry or state recorded yet for Virtual Pin ${normalizedPin}.`
        };
      }

      return {
        deviceId,
        pin: normalizedPin,
        value: parseFloat(res.rows[0].stream_value),
        lastUpdated: res.rows[0].timestamp
      };
    }
  },

  {
    name: 'dispatch_ota_update',
    description: 'Trigger an Over-The-Air (OTA) firmware update dispatch to an ESP8266 or ESP32 microcontroller with a firmware binary download URL.',
    inputSchema: {
      type: 'object',
      required: ['deviceId', 'version', 'downloadUrl'],
      properties: {
        deviceId: {
          type: 'string',
          description: 'Target device ID'
        },
        version: {
          type: 'string',
          description: 'Firmware version string (e.g. "1.2.0")'
        },
        downloadUrl: {
          type: 'string',
          description: 'Accessible HTTP/HTTPS URL of the compiled .bin binary firmware'
        }
      }
    },
    handler: async ({ deviceId, version, downloadUrl }) => {
      const result = await dispatchOtaUpdate(deviceId, version, downloadUrl);
      return {
        deviceId,
        version,
        downloadUrl,
        result
      };
    }
  }
];

export default controlTools;
