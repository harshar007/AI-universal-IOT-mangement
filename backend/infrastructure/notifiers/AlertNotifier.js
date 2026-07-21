class AlertNotifier {
  constructor(websocketServer = null) {
    this.websocketServer = websocketServer;
  }

  async notify(alert) {
    console.warn(`[CRITICAL ALERT] ${alert.sensorType} breached threshold! Value: ${alert.currentValue}. ${alert.message}`);

    // If websocketServer is available (e.g. within gateway or shared process), broadcast it
    if (this.websocketServer && typeof this.websocketServer.broadcast === 'function') {
      this.websocketServer.broadcast({
        event: 'alert_triggered',
        alert,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = AlertNotifier;
