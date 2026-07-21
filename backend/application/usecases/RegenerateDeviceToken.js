class RegenerateDeviceToken {
  constructor(deviceRepository) {
    this.deviceRepository = deviceRepository;
  }

  async execute(deviceId, userId = null) {
    const device = await this.deviceRepository.findById(deviceId);
    const deviceName = device ? device.name : 'IoT Node';
    const effectiveUserId = device && device.userId ? device.userId : userId;
    const newSecretKey = this.deviceRepository.generateSecretKey();
    return await this.deviceRepository.updateSecretKey(deviceId, newSecretKey, deviceName, effectiveUserId);
  }
}

module.exports = RegenerateDeviceToken;
