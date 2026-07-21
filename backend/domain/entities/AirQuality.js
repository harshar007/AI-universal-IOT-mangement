class AirQuality {
  constructor(ppm, timestamp = new Date()) {
    if (typeof ppm !== 'number' || ppm < 0) {
      throw new Error('Invalid PPM value');
    }
    this.ppm = ppm;
    this.status = this.determineStatus(ppm);
    this.timestamp = timestamp;
  }

  determineStatus(ppm) {
    if (ppm <= 350) return 'GOOD';
    if (ppm <= 600) return 'MODERATE';
    if (ppm <= 1000) return 'POOR';
    return 'HAZARDOUS';
  }

  isUnhealthy() {
    return this.status === 'POOR' || this.status === 'HAZARDOUS';
  }
}

module.exports = AirQuality;
