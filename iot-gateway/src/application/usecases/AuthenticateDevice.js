const deviceRegistryRepository = require('../../domain/repositories/DeviceRegistryRepository');

class AuthenticateDevice {
  async execute(deviceId, secretKey) {
    return await deviceRegistryRepository.authenticateDevice(deviceId, secretKey);
  }
}

module.exports = AuthenticateDevice;
