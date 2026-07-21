class RegisterDevice {
  constructor(deviceRepository) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ deviceId, name, userId }) {
    if (!deviceId || !name) {
      throw new Error('Device ID and name are required.');
    }
    return await this.deviceRepository.saveDevice(deviceId, name, userId);
  }
}

module.exports = RegisterDevice;
