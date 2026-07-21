const logger = require('../../utils/logger');

class RulesEngineEvaluator {
  evaluate(deviceId, streamKey, value, { dispatchCommand, broadcastEvent }) {
    logger.info(`Evaluating automation rules: device=${deviceId}, stream=${streamKey}, value=${value}`);

    // Automation Rule 1: Temperature Alert & Ventilation Control
    if (deviceId === 'server-temp-sensor' && streamKey === 'value') {
      const temp = parseFloat(value);
      
      if (temp > 26.0) {
        logger.warn(`AUTOMATION RULE TRIGGERED: Server temp is high (${temp}°C). Turning on ventilation fan.`);
        
        // Send command to turn ON the ventilation fan
        dispatchCommand('ventilation-fan-01', 'toggle', true);
        dispatchCommand('ventilation-fan-01', 'setValue', 95); // Set speed to 95%
        
        // Broadcast automation trigger event
        broadcastEvent({
          event: 'automation_triggered',
          rule: 'High Temperature Ventilation Control',
          description: `Server temperature (${temp}°C) exceeded 26°C. Activated ventilation-fan-01.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Automation Rule 2: Fridge Temp Monitoring
    if (deviceId === 'kitchen-smart-fridge' && streamKey === 'value') {
      const temp = parseFloat(value);
      if (temp > 10.0) {
        logger.warn(`AUTOMATION ALERT: Smart Fridge temperature is high (${temp}°C). Dispatching safety warnings.`);
        broadcastEvent({
          event: 'automation_alert',
          rule: 'Fridge Temperature Threshold Exceeded',
          description: `Smart fridge temperature is abnormally high (${temp}°C). Please check seal.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}

module.exports = new RulesEngineEvaluator();
