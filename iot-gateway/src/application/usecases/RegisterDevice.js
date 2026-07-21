const deviceRegistryRepository = require('../../domain/repositories/DeviceRegistryRepository');

class RegisterDevice {
  async execute(deviceId, name, userId = null) {
    return await deviceRegistryRepository.registerDevice(deviceId, name, userId);
  }
}

module.exports = RegisterDevice;
