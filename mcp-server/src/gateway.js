import axios from 'axios';
import { config } from './config.js';
import { queryIotDb } from './db.js';

export async function dispatchCommandToDevice(deviceId, action, value) {
  try {
    const response = await axios.post(
      `${config.gatewayUrl}/api/devices/${deviceId}/command`,
      { action, value },
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (err) {
    // If gateway HTTP is unreachable, log to iot_logs as an attempt
    const errorMsg = err.response?.data?.error || err.message;
    try {
      await queryIotDb(
        "INSERT INTO iot_logs (device_id, message, level) VALUES ($1, $2, 'warn')",
        [deviceId, `MCP command dispatch attempt (${action}=${value}): ${errorMsg}`]
      );
    } catch (_) {}
    return {
      success: false,
      error: `Failed to dispatch command to gateway (${config.gatewayUrl}): ${errorMsg}`
    };
  }
}

export async function dispatchOtaUpdate(deviceId, version, downloadUrl) {
  try {
    const response = await axios.post(
      `${config.gatewayUrl}/api/devices/${deviceId}/ota`,
      { version, downloadUrl },
      { timeout: 5000 }
    );
    return { success: true, data: response.data };
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    return {
      success: false,
      error: `Failed to dispatch OTA update to gateway: ${errorMsg}`
    };
  }
}

export default {
  dispatchCommandToDevice,
  dispatchOtaUpdate
};
