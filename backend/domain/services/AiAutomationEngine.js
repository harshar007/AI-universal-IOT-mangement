const { pool } = require('../../config/db');

class AiAutomationEngine {
  async getOrCreateUserSettings(userId) {
    if (!userId) {
      return {
        isEnabled: true,
        currentProfile: 'SAFETY',
        deviceAiSettings: {},
        recentDecisions: [],
        lastEvaluatedAt: null
      };
    }
    const queryText = 'SELECT * FROM user_ai_settings WHERE user_id = $1';
    try {
      const res = await pool.query(queryText, [String(userId)]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          isEnabled: row.is_enabled,
          currentProfile: row.current_profile,
          deviceAiSettings: row.device_ai_settings || {},
          recentDecisions: row.recent_decisions || [],
          lastEvaluatedAt: row.last_evaluated_at
        };
      } else {
        const insertText = `
          INSERT INTO user_ai_settings (user_id, is_enabled, current_profile, device_ai_settings, recent_decisions)
          VALUES ($1, true, 'SAFETY', '{}'::jsonb, '[]'::jsonb)
          ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
          RETURNING *
        `;
        const insertRes = await pool.query(insertText, [String(userId)]);
        const row = insertRes.rows[0];
        return {
          isEnabled: row.is_enabled,
          currentProfile: row.current_profile,
          deviceAiSettings: row.device_ai_settings || {},
          recentDecisions: row.recent_decisions || [],
          lastEvaluatedAt: row.last_evaluated_at
        };
      }
    } catch (err) {
      console.error('Failed to get/create user AI settings from DB:', err.message);
      return {
        isEnabled: true,
        currentProfile: 'SAFETY',
        deviceAiSettings: {},
        recentDecisions: [],
        lastEvaluatedAt: null
      };
    }
  }

  async saveUserSettings(userId, settings) {
    if (!userId) return;
    const queryText = `
      INSERT INTO user_ai_settings (user_id, is_enabled, current_profile, device_ai_settings, recent_decisions, last_evaluated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET 
        is_enabled = EXCLUDED.is_enabled,
        current_profile = EXCLUDED.current_profile,
        device_ai_settings = EXCLUDED.device_ai_settings,
        recent_decisions = EXCLUDED.recent_decisions,
        last_evaluated_at = EXCLUDED.last_evaluated_at
    `;
    try {
      await pool.query(queryText, [
        String(userId),
        settings.isEnabled,
        settings.currentProfile,
        JSON.stringify(settings.deviceAiSettings),
        JSON.stringify(settings.recentDecisions),
        settings.lastEvaluatedAt
      ]);
    } catch (err) {
      console.error('Failed to save user AI settings to DB:', err.message);
    }
  }

  async getStatus(userId) {
    const settings = await this.getOrCreateUserSettings(userId);
    return {
      isEnabled: settings.isEnabled,
      currentProfile: settings.currentProfile,
      deviceAiSettings: settings.deviceAiSettings,
      recentDecisions: settings.recentDecisions.slice(-30),
      lastEvaluatedAt: settings.lastEvaluatedAt
    };
  }

  async toggleAi(userId, enabled) {
    const settings = await this.getOrCreateUserSettings(userId);
    settings.isEnabled = Boolean(enabled);
    await this.saveUserSettings(userId, settings);
    return this.getStatus(userId);
  }

  async setProfile(userId, profile) {
    const settings = await this.getOrCreateUserSettings(userId);
    if (['SAFETY', 'ECO', 'COMFORT'].includes(profile)) {
      settings.currentProfile = profile;
      await this.saveUserSettings(userId, settings);
    }
    return this.getStatus(userId);
  }

  async setDeviceAiSetting(userId, deviceId, enabled) {
    const settings = await this.getOrCreateUserSettings(userId);
    settings.deviceAiSettings[deviceId] = Boolean(enabled);
    await this.saveUserSettings(userId, settings);
    return this.getStatus(userId);
  }

  async evaluateAndExecute(userId, devices = []) {
    const settings = await this.getOrCreateUserSettings(userId);
    if (!settings.isEnabled || !Array.isArray(devices) || devices.length === 0) {
      return { updatedDevices: devices, executedDecisions: [] };
    }

    settings.lastEvaluatedAt = new Date().toISOString();
    const executedDecisions = [];
    const updatedDevices = devices.map(device => {
      const isDeviceAiEnabled = settings.deviceAiSettings[device.id] !== false; // default true
      if (!isDeviceAiEnabled) {
        return device;
      }

      let modifiedDevice = { ...device };
      let decision = null;

      // ===============================================
      // 1. SAFETY GUARD PROFILE RULES
      // ===============================================
      if (settings.currentProfile === 'SAFETY') {
        // Rule S1: Server room or high temp > 28°C -> Force A/C or Ventilation ON
        if ((device.category === 'Server Room' || device.name.toLowerCase().includes('ac') || device.name.toLowerCase().includes('fan')) && device.value > 28 && !device.powerState) {
          modifiedDevice.powerState = true;
          modifiedDevice.status = 'online';
          decision = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: device.id,
            deviceName: device.name,
            action: 'TURN_ON',
            reason: `Temperature exceeded safety limit (${device.value}${device.unit} > 28.0°C). AI turned node ON.`,
            previousState: { powerState: false },
            newState: { powerState: true },
            profile: 'SAFETY'
          };
        }
        // Rule S2: Industrial high load or high temp > 32°C -> Reduce target temp to 20°C
        else if (device.value > 30 && device.name.toLowerCase().includes('ac')) {
          const oldVal = device.value;
          modifiedDevice.value = 21.0;
          decision = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: device.id,
            deviceName: device.name,
            action: 'ADJUST_VALUE',
            reason: `High heat warning (${oldVal}°C). AI engaged Overdrive Cooling to 21°C.`,
            previousState: { value: oldVal },
            newState: { value: 21.0 },
            profile: 'SAFETY'
          };
        }
      }

      // ===============================================
      // 2. ECO SAVER PROFILE RULES
      // ===============================================
      else if (settings.currentProfile === 'ECO') {
        // Rule E1: A/C running below 24°C -> Adjust to eco setpoint 24°C
        if (device.name.toLowerCase().includes('ac') && device.powerState && device.value < 24) {
          const oldVal = device.value;
          modifiedDevice.value = 24.0;
          modifiedDevice.powerDraw = Math.round(device.powerDraw * 0.82);
          decision = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: device.id,
            deviceName: device.name,
            action: 'ECO_OPTIMIZE',
            reason: `Eco Mode: Adjusted A/C setpoint from ${oldVal}°C to 24.0°C (Saved ~18% energy).`,
            previousState: { value: oldVal },
            newState: { value: 24.0 },
            profile: 'ECO'
          };
        }
        // Rule E2: High power draw lighting on -> Dim power draw
        else if (device.name.toLowerCase().includes('lighting') || device.name.toLowerCase().includes('floodlight')) {
          if (device.powerState && device.value > 50) {
            const oldVal = device.value;
            modifiedDevice.value = 40;
            decision = {
              id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              timestamp: new Date().toLocaleTimeString(),
              deviceId: device.id,
              deviceName: device.name,
              action: 'DIM_LOAD',
              reason: `Eco Mode: Dimmed non-essential lighting from ${oldVal}% to 40%.`,
              previousState: { value: oldVal },
              newState: { value: 40 },
              profile: 'ECO'
            };
          }
        }
      }

      // ===============================================
      // 3. COMFORT OPTIMIZER PROFILE RULES
      // ===============================================
      else if (settings.currentProfile === 'COMFORT') {
        // Rule C1: Temperature > 23.5°C -> Set to ideal 22°C
        if (device.name.toLowerCase().includes('ac') && device.value > 23.5) {
          const oldVal = device.value;
          modifiedDevice.value = 22.0;
          modifiedDevice.powerState = true;
          decision = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: device.id,
            deviceName: device.name,
            action: 'COMFORT_TUNE',
            reason: `Comfort Mode: Tuning room temperature from ${oldVal}°C to optimal 22.0°C.`,
            previousState: { value: oldVal },
            newState: { value: 22.0 },
            profile: 'COMFORT'
          };
        }
        // Rule C2: Humidistat node humidity > 48% -> Adjust ventilation fan
        else if (device.name.toLowerCase().includes('humidistat') && device.value > 48) {
          const oldVal = device.value;
          modifiedDevice.value = 44;
          decision = {
            id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toLocaleTimeString(),
            deviceId: device.id,
            deviceName: device.name,
            action: 'HUMIDITY_BALANCE',
            reason: `Comfort Mode: Balancing humidity level from ${oldVal}% to 44%.`,
            previousState: { value: oldVal },
            newState: { value: 44 },
            profile: 'COMFORT'
          };
        }
      }

      if (decision) {
        executedDecisions.push(decision);
        settings.recentDecisions.unshift(decision);
      }

      return modifiedDevice;
    });

    if (settings.recentDecisions.length > 50) {
      settings.recentDecisions = settings.recentDecisions.slice(0, 50);
    }

    await this.saveUserSettings(userId, settings);

    return { updatedDevices, executedDecisions };
  }
}

module.exports = new AiAutomationEngine();
