class SensorData {
  constructor(deviceId, temperature, humidity, timestamp = new Date()) {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new Error('Invalid Device ID');
    }
    if (typeof temperature !== 'number') {
      throw new Error('Invalid temperature value');
    }
    if (typeof humidity !== 'number' || humidity < 0 || humidity > 100) {
      throw new Error('Invalid humidity value');
    }
    
    this.deviceId = deviceId;
    this.temperature = temperature;
    this.humidity = humidity;
    this.timestamp = timestamp;
  }

  isExtremeTemperature() {
    return this.temperature > 40 || this.temperature < 5;
  }
}

module.exports = SensorData;
