const deviceRegistryRepository = require('../../domain/repositories/DeviceRegistryRepository');

class UpdateDeviceStatus {
  async execute(deviceId, status) {
    return await deviceRegistryRepository.updateDeviceStatus(deviceId, status);
  }
}

module.exports = UpdateDeviceStatus;
