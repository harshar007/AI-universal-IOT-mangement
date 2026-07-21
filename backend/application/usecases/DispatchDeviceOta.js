const axios = require('axios');
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5002';

class DispatchDeviceOta {
  async execute(deviceId, { version, downloadUrl }) {
    try {
      const response = await axios.post(`${GATEWAY_URL}/api/devices/${deviceId}/ota`, {
        version,
        downloadUrl
      });
      return response.data;
    } catch (err) {
      console.error(`Error forwarding OTA to gateway at ${GATEWAY_URL}: ${err.message}`);
      throw new Error(`Failed to forward OTA to gateway: ${err.response?.data?.error || err.message}`);
    }
  }
}

module.exports = DispatchDeviceOta;
