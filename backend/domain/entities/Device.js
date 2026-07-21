class Device {
  constructor(id, name, secretKey, status = 'offline', lastHeartbeat = null, userId = null) {
    if (!id) {
      throw new Error('Device ID is required.');
    }
    if (!name) {
      throw new Error('Device Name is required.');
    }

    this.id = id;
    this.name = name;
    this.secretKey = secretKey;
    this.status = status;
    this.lastHeartbeat = lastHeartbeat;
    this.userId = userId;
  }
}

module.exports = Device;
