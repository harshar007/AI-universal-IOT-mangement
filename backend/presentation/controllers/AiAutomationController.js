const aiAutomationEngine = require('../../domain/services/AiAutomationEngine');

class AiAutomationController {
  async getStatus(req, res) {
    const userId = req.user?.userId;
    try {
      const status = await aiAutomationEngine.getStatus(userId);
      res.status(200).json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async toggleAi(req, res) {
    const { enabled } = req.body;
    const userId = req.user?.userId;
    try {
      const status = await aiAutomationEngine.toggleAi(userId, enabled);
      res.status(200).json(status);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async setProfile(req, res) {
    const { profile } = req.body;
    const userId = req.user?.userId;
    try {
      const status = await aiAutomationEngine.setProfile(userId, profile);
      res.status(200).json(status);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async setDeviceSetting(req, res) {
    const { deviceId, enabled } = req.body;
    const userId = req.user?.userId;
    try {
      const status = await aiAutomationEngine.setDeviceAiSetting(userId, deviceId, enabled);
      res.status(200).json(status);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async evaluate(req, res) {
    const { devices } = req.body;
    const userId = req.user?.userId;
    try {
      const result = await aiAutomationEngine.evaluateAndExecute(userId, devices || []);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AiAutomationController();
