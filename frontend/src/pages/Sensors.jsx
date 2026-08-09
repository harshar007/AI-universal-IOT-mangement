import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radio, AlertTriangle, Bell, Thermometer, Wind, Plus, Trash2, Calendar, Mail, CheckCircle2 } from 'lucide-react';
import '../css/Sensors.css';

export default function Sensors() {
  const [telemetry, setTelemetry] = useState({
    temperature: 0,
    humidity: 0,
    ppm: 0,
    status: 'UNKNOWN',
    timestamp: null
  });
  const [rules, setRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Rule form states
  const [sensorType, setSensorType] = useState('TEMPERATURE');
  const [operator, setOperator] = useState('GREATER_THAN');
  const [value, setValue] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const deviceId = 'sensor_station_01'; // Default clean architecture device station

  const fetchData = async () => {
    try {
      // 1. Fetch latest telemetry
      const telRes = await axios.get(`/api/sensors/latest/${deviceId}`);
      if (telRes.data && telRes.data.success) {
        setTelemetry({
          temperature: telRes.data.sensor ? telRes.data.sensor.temperature : 0,
          humidity: telRes.data.sensor ? telRes.data.sensor.humidity : 0,
          ppm: telRes.data.airQuality ? telRes.data.airQuality.ppm : 0,
          status: telRes.data.airQuality ? telRes.data.airQuality.status : 'UNKNOWN',
          timestamp: telRes.data.sensor ? telRes.data.sensor.timestamp : null
        });
      }

      // 2. Fetch alert rules
      const rulesRes = await axios.get('/api/sensors/alerts/rules');
      if (rulesRes.data && rulesRes.data.success) {
        setRules(rulesRes.data.rules);
      }

      // 3. Fetch alert logs history
      const historyRes = await axios.get('/api/sensors/alerts/history');
      if (historyRes.data && historyRes.data.success) {
        setAlerts(historyRes.data.alerts);
      }
    } catch (err) {
      console.error('Failed to fetch sensor data:', err.message);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll DB for telemetry updates every 4 seconds
    const interval = setInterval(fetchData, 4000);

    // Establish direct WebSocket listener for real-time alerts and telemetry broadcasts
    const activeToken = localStorage.getItem('authToken');
    const wsAddress = window.location.protocol === 'https:' 
      ? `wss://${window.location.hostname}:5002?token=${activeToken}` 
      : `ws://${window.location.hostname}:5002?token=${activeToken}`;
    let ws = new WebSocket(wsAddress);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'telemetry' && data.deviceId === deviceId) {
          setTelemetry(prev => {
            const updated = { ...prev, timestamp: data.timestamp };
            if (data.streamKey === 'temperature') updated.temperature = parseFloat(data.value);
            if (data.streamKey === 'humidity') updated.humidity = parseFloat(data.value);
            if (data.streamKey === 'ppm') {
              updated.ppm = parseFloat(data.value);
              // Calculate status
              if (updated.ppm <= 350) updated.status = 'GOOD';
              else if (updated.ppm <= 600) updated.status = 'MODERATE';
              else if (updated.ppm <= 1000) updated.status = 'POOR';
              else updated.status = 'HAZARDOUS';
            }
            return updated;
          });
        }

        if (data.event === 'alert_triggered') {
          // Prepend new real-time alert to logs
          setAlerts(prev => [
            {
              id: Date.now(),
              ruleId: data.alert.ruleId,
              sensorType: data.alert.sensorType,
              operator: data.alert.operator,
              threshold: data.alert.threshold,
              currentValue: data.alert.currentValue,
              message: data.alert.message,
              timestamp: new Date().toISOString()
            },
            ...prev
          ]);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!value || isNaN(value)) {
      setError('Please provide a valid threshold numeric value');
      return;
    }
    if (!recipient) {
      setError('Recipient email is required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/sensors/alerts/rules', {
        sensorType,
        operator,
        value: parseFloat(value),
        targetRecipient: recipient
      });

      if (res.data && res.data.success) {
        setSuccessMsg('Alert rule created successfully!');
        setValue('');
        setRecipient('');
        // Refresh rules
        const rulesRes = await axios.get('/api/sensors/alerts/rules');
        if (rulesRes.data && rulesRes.data.success) {
          setRules(rulesRes.data.rules);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register alert rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      const res = await axios.delete(`/api/sensors/alerts/rules/${id}`);
      if (res.data && res.data.success) {
        setRules(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete rule:', err.message);
    }
  };

  const getAQIColorClass = (status) => {
    switch (status) {
      case 'GOOD': return 'aqi-good';
      case 'MODERATE': return 'aqi-moderate';
      case 'POOR': return 'aqi-poor';
      case 'HAZARDOUS': return 'aqi-hazardous';
      default: return '';
    }
  };

  return (
    <div className="page">
      {/* Top Banner */}
      <header className="dashboard-header">
        <div>
          <h1>Air & Alerts</h1>
          <p className="dashboard-subtitle">Clean Architecture Air Quality Station & Rules Console</p>
        </div>
        <div className="dashboard-time-badge glass-panel">
          <Radio size={16} className="text-green animate-pulse" />
          <span>Ingesting ESP8266 Live Feed</span>
        </div>
      </header>

      {/* Dials / Cards Grid */}
      <section className="sensor-dials-grid">
        <div className="dial-card glass-panel border-green">
          <div className="dial-header">
            <Thermometer size={18} className="text-green" />
            <span>TEMPERATURE (DHT11)</span>
          </div>
          <div className="dial-value">
            {telemetry.temperature.toFixed(1)}<span className="dial-unit">°C</span>
          </div>
          <div className="dial-footer text-green">
            ● Thermal core online
          </div>
        </div>

        <div className="dial-card glass-panel border-green">
          <div className="dial-header">
            <Wind size={18} className="text-green" />
            <span>HUMIDITY (DHT11)</span>
          </div>
          <div className="dial-value">
            {telemetry.humidity.toFixed(0)}<span className="dial-unit">%</span>
          </div>
          <div className="dial-footer text-green">
            ● Vapor levels stable
          </div>
        </div>

        <div className="dial-card glass-panel border-green">
          <div className="dial-header">
            <Radio size={18} className="text-green" />
            <span>AIR QUALITY (MQ135)</span>
          </div>
          <div className="dial-value">
            {telemetry.ppm.toFixed(0)}<span className="dial-unit">PPM</span>
          </div>
          <div className="dial-footer">
            <span className={`aqi-badge ${getAQIColorClass(telemetry.status)}`}>
              {telemetry.status}
            </span>
          </div>
        </div>
      </section>

      {/* Split Dashboard Panel: Rules Builder + Logs Feed */}
      <div className="sensor-management-layout">
        {/* Left Side: Rules Management */}
        <section className="rules-builder-card glass-panel">
          <div className="card-header-bar">
            <Bell size={18} className="text-green" />
            <h2>Active Alert Rules</h2>
          </div>
          
          <form onSubmit={handleAddRule} className="rules-creator-form">
            <div className="form-row">
              <div className="form-group">
                <label>Sensor Type</label>
                <select value={sensorType} onChange={(e) => setSensorType(e.target.value)}>
                  <option value="TEMPERATURE">Temperature (°C)</option>
                  <option value="HUMIDITY">Humidity (%)</option>
                  <option value="AIR_QUALITY">Air Quality (PPM)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                  <option value="GREATER_THAN">Is Greater Than (&gt;)</option>
                  <option value="LESS_THAN">Is Less Than (&lt;)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Threshold Value</label>
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder="e.g. 30.5" 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Alert Recipient</label>
                <input 
                  type="email" 
                  placeholder="admin@domain.com" 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="form-error-alert">{error}</div>}
            {successMsg && <div className="form-success-alert"><CheckCircle2 size={14} /> {successMsg}</div>}

            <button type="submit" disabled={loading} className="btn-add-rule glass-btn">
              <Plus size={16} />
              <span>{loading ? 'Adding...' : 'Add Threshold Rule'}</span>
            </button>
          </form>

          {/* Rules List */}
          <div className="rules-table-container">
            {rules.length === 0 ? (
              <p className="no-rules-placeholder">No custom alert rules configured.</p>
            ) : (
              <div className="rules-list-items">
                {rules.map(rule => (
                  <div key={rule.id} className="rule-item-card">
                    <div className="rule-item-details">
                      <span className="rule-sensor-label">{rule.sensorType}</span>
                      <span className="rule-condition-text">
                        {rule.operator === 'GREATER_THAN' ? '>' : '<'} {parseFloat(rule.value).toFixed(1)}
                      </span>
                      <span className="rule-email-badge">
                        <Mail size={12} /> {rule.targetRecipient}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteRule(rule.id)} className="delete-rule-btn" aria-label="Delete Rule">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Alerts History Feed */}
        <section className="alerts-history-card glass-panel">
          <div className="card-header-bar">
            <AlertTriangle size={18} className="text-red" />
            <h2>Triggered Alerts Log</h2>
          </div>

          <div className="alerts-log-container">
            {alerts.length === 0 ? (
              <div className="no-alerts-placeholder">
                <CheckCircle2 size={24} className="text-green" />
                <p>No alerts triggered. Environment levels are stable.</p>
              </div>
            ) : (
              <div className="alerts-timeline">
                {alerts.map(alert => (
                  <div key={alert.id} className="alert-log-item-card border-red">
                    <div className="alert-log-header">
                      <div className="alert-type-badge">
                        <AlertTriangle size={14} />
                        <span>{alert.sensorType} BREACH</span>
                      </div>
                      <span className="alert-time">
                        <Calendar size={12} />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="alert-message">{alert.message}</p>
                    <div className="alert-details-row">
                      <span>Threshold: {parseFloat(alert.threshold).toFixed(1)}</span>
                      <span className="text-red font-bold">Detected: {parseFloat(alert.currentValue).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
