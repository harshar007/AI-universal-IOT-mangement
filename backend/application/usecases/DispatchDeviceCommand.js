const axios = require('axios');
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5002';

class DispatchDeviceCommand {
  async execute(deviceId, { action, value }) {
    try {
      const response = await axios.post(`${GATEWAY_URL}/api/devices/${deviceId}/command`, {
        action,
        value
      });
      return response.data;
    } catch (err) {
      console.error(`Error forwarding command to gateway at ${GATEWAY_URL}: ${err.message}`);
      throw new Error(`Failed to forward command to gateway: ${err.response?.data?.error || err.message}`);
    }
  }
}

module.exports = DispatchDeviceCommand;
