const logger = require('../utils/logger');
const websocketServer = require('../sockets/websocketServer');

// Lazy-loaded dependencies to avoid circular reference loops on load
let commandDispatcher = null;

const evaluate = (deviceId, streamKey, value) => {
  logger.info(`Evaluating automation rules: device=${deviceId}, stream=${streamKey}, value=${value}`);
  
  if (!commandDispatcher) {
    commandDispatcher = require('../commands/commandDispatcher');
  }

  // Automation Rule 1: ESP32-S3 High Thermal Alert & Relay Safety Trigger
  if ((deviceId === 'esp32s3-sensor-node' || deviceId.includes('esp32')) && streamKey === 'value') {
    const temp = parseFloat(value);
    
    if (temp > 28.0) {
      logger.warn(`AUTOMATION RULE TRIGGERED: ESP32-S3 core temp high (${temp}°C). Engaging ESP8266 relay board.`);
      
      // Send command to turn ON the relay board
      commandDispatcher.dispatchCommand('esp8266-relay-board', 'toggle', true);
      commandDispatcher.dispatchCommand('esp8266-relay-board', 'setValue', 100);
      
      // Broadcast automation trigger event
      websocketServer.broadcast({
        event: 'automation_triggered',
        rule: 'High Thermal Relay Safety Control',
        description: `ESP32 sensor node core temp (${temp}°C) exceeded 28°C threshold. Engaged esp8266-relay-board.`,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Automation Rule 2: ESP8266 NodeMCU Voltage Level Watchdog
  if ((deviceId === 'esp8266-nodemcu-01' || deviceId.includes('esp8266')) && streamKey === 'battery') {
    const batt = parseFloat(value);
    if (batt < 20.0) {
      logger.warn(`AUTOMATION ALERT: ESP8266 node battery low (${batt}%). Dispatching maintenance alert.`);
      websocketServer.broadcast({
        event: 'automation_alert',
        rule: 'ESP8266 Battery Safeguard Exceeded',
        description: `ESP8266 telemetry node battery level critical (${batt}%).`,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = {
  evaluate
};
