class AlertRules {
  constructor(rules = []) {
    this.rules = rules;
  }

  evaluate(sensorData, airQuality) {
    const breachedAlerts = [];

    for (const rule of this.rules) {
      if (!rule.isEnabled) continue;

      let value = null;
      if (rule.sensorType === 'TEMPERATURE' && sensorData) {
        value = sensorData.temperature;
      } else if (rule.sensorType === 'HUMIDITY' && sensorData) {
        value = sensorData.humidity;
      } else if (rule.sensorType === 'AIR_QUALITY' && airQuality) {
        value = airQuality.ppm;
      }

      if (value !== null) {
        const isBreached = rule.operator === 'GREATER_THAN' 
          ? value > rule.value 
          : value < rule.value;

        if (isBreached) {
          breachedAlerts.push({
            ruleId: rule.id,
            sensorType: rule.sensorType,
            operator: rule.operator,
            threshold: rule.value,
            currentValue: value,
            targetRecipient: rule.targetRecipient,
            message: `${rule.sensorType} of ${value} breached threshold (${rule.operator} ${rule.value})`
          });
        }
      }
    }

    return breachedAlerts;
  }
}

module.exports = AlertRules;
