const AlertRules = require('../../domain/rules/AlertRules');

class SendAlert {
  constructor(alertRulesRepository, alertNotifier) {
    this.alertRulesRepository = alertRulesRepository;
    this.alertNotifier = alertNotifier;
  }

  async execute(sensorData, airQuality, userId = null) {
    // 1. Fetch active alert rules from DB/repository
    const rules = await this.alertRulesRepository.getActiveRules(userId);
    
    // 2. Pass them to our Domain Rules Evaluator
    const rulesEngine = new AlertRules(rules);
    const breachedAlerts = rulesEngine.evaluate(sensorData, airQuality);

    // 3. For any breached rules, trigger notification action via notifier service
    for (const alert of breachedAlerts) {
      await this.alertNotifier.notify(alert, userId);
    }

    return breachedAlerts;
  }
}

module.exports = SendAlert;
