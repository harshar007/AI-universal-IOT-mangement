class GetAllDevices {
  constructor(deviceRepository) {
    this.deviceRepository = deviceRepository;
  }

  async execute(userId) {
    return await this.deviceRepository.findAllByUserId(userId);
  }
}

module.exports = GetAllDevices;
