const DeviceRepository = require('../../domain/repositories/DeviceRepository');
const RegisterDevice = require('../../application/usecases/RegisterDevice');
const GetAllDevices = require('../../application/usecases/GetAllDevices');
const RegenerateDeviceToken = require('../../application/usecases/RegenerateDeviceToken');
const DispatchDeviceCommand = require('../../application/usecases/DispatchDeviceCommand');
const DispatchDeviceOta = require('../../application/usecases/DispatchDeviceOta');

class DeviceController {
  constructor() {
    this.deviceRepository = new DeviceRepository();
    this.registerDeviceUseCase = new RegisterDevice(this.deviceRepository);
    this.getAllDevicesUseCase = new GetAllDevices(this.deviceRepository);
    this.regenerateDeviceTokenUseCase = new RegenerateDeviceToken(this.deviceRepository);
    this.dispatchDeviceCommandUseCase = new DispatchDeviceCommand();
    this.dispatchDeviceOtaUseCase = new DispatchDeviceOta();
  }

  async registerDevice(req, res) {
    const { deviceId, name } = req.body;
    const userId = req.user?.userId;
    try {
      const device = await this.registerDeviceUseCase.execute({ deviceId, name, userId });
      res.status(201).json(device);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAllDevices(req, res) {
    const userId = req.user?.userId;
    try {
      const devices = await this.getAllDevicesUseCase.execute(userId);
      res.status(200).json(devices);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async verifyDeviceOwner(deviceId, userId) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device || String(device.userId) !== String(userId)) {
      const error = new Error('Forbidden: You do not own this device');
      error.status = 403;
      throw error;
    }
    return device;
  }

  async regenerateDeviceToken(req, res) {
    const { deviceId } = req.params;
    const userId = req.user?.userId;
    try {
      await this.verifyDeviceOwner(deviceId, userId);
      const device = await this.regenerateDeviceTokenUseCase.execute(deviceId, userId);
      res.status(200).json(device);
    } catch (err) {
      console.error('regenerateDeviceToken error:', err.message);
      res.status(err.status || 400).json({ error: err.message });
    }
  }

  async dispatchDeviceCommand(req, res) {
    const { deviceId } = req.params;
    const { action, value } = req.body;
    const userId = req.user?.userId;
    try {
      await this.verifyDeviceOwner(deviceId, userId);
      const result = await this.dispatchDeviceCommandUseCase.execute(deviceId, { action, value });
      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }

  async dispatchDeviceOta(req, res) {
    const { deviceId } = req.params;
    const { version, downloadUrl } = req.body;
    const userId = req.user?.userId;
    try {
      await this.verifyDeviceOwner(deviceId, userId);
      const result = await this.dispatchDeviceOtaUseCase.execute(deviceId, { version, downloadUrl });
      res.status(200).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

module.exports = new DeviceController();
