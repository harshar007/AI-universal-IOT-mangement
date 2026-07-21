class Device {
  constructor(id, name, secretKey, status = 'offline', lastHeartbeat = null, userId = null) {
    this.id = id;
    this.name = name;
    this.secretKey = secretKey;
    this.status = status;
    this.lastHeartbeat = lastHeartbeat;
    this.userId = userId;
  }
}

module.exports = Device;
