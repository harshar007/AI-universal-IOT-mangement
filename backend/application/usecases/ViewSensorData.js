class ViewSensorData {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(deviceId) {
    if (!deviceId) {
      throw new Error('Device ID is required');
    }
    const latestReading = await this.sensorRepository.getLatestTelemetry(deviceId);
    return latestReading;
  }
}

module.exports = ViewSensorData;
