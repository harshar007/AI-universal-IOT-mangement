import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, Trash2, Search, ArrowRight, Activity, Radio, Cpu, RefreshCw } from 'lucide-react';
import axios from 'axios';
import '../css/MqttMonitor.css';

export default function MqttMonitor({ systemLogs, setSystemLogs, devices, onToggleDevice, onChangeDeviceValue }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const terminalEndRef = useRef(null);

  // Signal Generator States
  const [selectedDevice, setSelectedDevice] = useState('');
  const [signalType, setSignalType] = useState('powerState');
  const [signalValue, setSignalValue] = useState('1');
  const [sendingSignal, setSendingSignal] = useState(false);
  const [signalSuccess, setSignalSuccess] = useState('');
  const [signalError, setSignalError] = useState('');

  // Default selected device
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  // Auto-scroll terminal to bottom unless paused
  useEffect(() => {
    if (!isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs, isPaused]);

  // Filter logs based on category and search query
  const getFilteredLogs = () => {
    return systemLogs.filter(log => {
      // Apply search query first
      if (searchQuery && !log.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Apply category filter
      if (filter === 'ALL') return true;
      if (filter === 'TELEMETRY') return log.includes('[TELEMETRY]');
      if (filter === 'COMMANDS') return log.includes('[COMMAND]');
      if (filter === 'STATUS') return log.includes('[STATUS]');
      if (filter === 'LOGS') return log.includes('[LOGS]') || log.includes('[LOG]');
      if (filter === 'HEARTBEATS') return log.includes('[HEARTBEAT]');

      return true;
    });
  };

  const handleClearConsole = () => {
    if (window.confirm('Are you sure you want to clear the terminal monitor view?')) {
      setSystemLogs([`[${new Date().toLocaleTimeString()}] Console cleared by operator. Listening for MQTT packet transmissions...`]);
    }
  };

  // Test Signal Dispatcher
  const handlePublishTestSignal = async (e) => {
    e.preventDefault();
    if (!selectedDevice) return;

    setSendingSignal(true);
    setSignalSuccess('');
    setSignalError('');

    try {
      const device = devices.find(d => d.id === selectedDevice);
      const label = device ? device.name : selectedDevice;

      if (signalType === 'powerState') {
        const stateVal = signalValue === '1';
        await axios.post(`/api/devices/${selectedDevice}/command`, {
          action: 'toggle',
          value: stateVal ? 1 : 0
        });
        
        // Optimistically update local state so they see immediate feedback
        onToggleDevice(selectedDevice, stateVal);
        setSignalSuccess(`Command published: ${label} -> powerState = ${stateVal ? 'ON' : 'OFF'}`);
      } else {
        const numericVal = parseFloat(signalValue);
        await axios.post(`/api/devices/${selectedDevice}/command`, {
          action: 'value',
          value: numericVal
        });
        
        onChangeDeviceValue(selectedDevice, numericVal);
        setSignalSuccess(`Value command published: ${label} -> target = ${numericVal}`);
      }

      setTimeout(() => setSignalSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setSignalError(err.response?.data?.error || 'Failed to dispatch command to gateway.');
      setTimeout(() => setSignalError(''), 4000);
    } finally {
      setSendingSignal(false);
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="mqtt-monitor-container">
      {/* Header */}
      <header className="mqtt-header glass-panel">
        <div className="mqtt-title-wrapper">
          <div className="mqtt-badge">
            <Terminal size={24} className="terminal-glow" />
          </div>
          <div>
            <h1 className="mqtt-title">MQTT Live Broker Monitor</h1>
            <p className="mqtt-subtitle">Real-time debugging terminal capturing gateway telemetry, status, and command queues</p>
          </div>
        </div>
        <div className="mqtt-live-pulse-container">
          <span className="live-dot animate-pulse"></span>
          <span className="live-text">BROKER ONLINE</span>
        </div>
      </header>

      {/* Main Console Grid */}
      <div className="mqtt-monitor-grid">
        {/* Left Side: Monitor Console */}
        <section className="terminal-section glass-panel">
          <div className="terminal-controls">
            {/* Filter Tabs */}
            <div className="terminal-tabs">
              {['ALL', 'TELEMETRY', 'COMMANDS', 'STATUS', 'LOGS', 'HEARTBEATS'].map(tab => (
                <button
                  key={tab}
                  className={`terminal-tab-btn ${filter === tab ? 'active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="terminal-actions-row">
              <div className="search-input-wrapper">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Filter payload logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button 
                className={`terminal-control-btn ${isPaused ? 'paused' : ''}`}
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume Scroll' : 'Pause Scroll'}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button 
                className="terminal-control-btn clear"
                onClick={handleClearConsole}
                title="Clear Monitor Console"
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Monospace Code Terminal screen */}
          <div className="terminal-screen font-mono">
            <div className="terminal-logs-viewport">
              {filteredLogs.map((log, index) => {
                let logClass = '';
                if (log.includes('[TELEMETRY]')) logClass = 'log-telemetry';
                else if (log.includes('[COMMAND]')) logClass = 'log-command';
                else if (log.includes('[STATUS]')) logClass = 'log-status';
                else if (log.includes('[LOGS]') || log.includes('[LOG]')) logClass = 'log-device-debug';
                else if (log.includes('[HEARTBEAT]')) logClass = 'log-heartbeat';

                return (
                  <div key={index} className={`terminal-log-line ${logClass}`}>
                    <span className="log-prefix">&gt; </span>
                    <span className="log-text">{log}</span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

        {/* Right Side: MQTT Signal Generator */}
        <section className="generator-section glass-panel">
          <h2 className="section-title"><Activity size={18} className="icon-cyan" /> MQTT Signal Generator</h2>
          <p className="section-desc">Test MQTT device reactions and automation rules by forcing command publishes directly to device topics.</p>

          {signalSuccess && <div className="signal-alert success">{signalSuccess}</div>}
          {signalError && <div className="signal-alert error">{signalError}</div>}

          <form onSubmit={handlePublishTestSignal} className="signal-form">
            <div className="form-group">
              <label>Target Hardware Node</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                required
              >
                <option value="" disabled>Select device...</option>
                {devices.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.id.substring(dev.id.length - 12)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Publish Datastream / Parameter</label>
              <div className="radio-group-horizontal">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="signalType" 
                    value="powerState"
                    checked={signalType === 'powerState'}
                    onChange={() => {
                      setSignalType('powerState');
                      setSignalValue('1');
                    }}
                  />
                  <span>powerState (Toggle)</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="signalType" 
                    value="value"
                    checked={signalType === 'value'}
                    onChange={() => {
                      setSignalType('value');
                      setSignalValue('20');
                    }}
                  />
                  <span>value (Sensor/Slider)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Payload Value</label>
              {signalType === 'powerState' ? (
                <select 
                  value={signalValue} 
                  onChange={(e) => setSignalValue(e.target.value)}
                >
                  <option value="1">HIGH (1) / True</option>
                  <option value="0">LOW (0) / False</option>
                </select>
              ) : (
                <input 
                  type="number"
                  step="0.1"
                  value={signalValue}
                  onChange={(e) => setSignalValue(e.target.value)}
                  required
                />
              )}
            </div>

            <button 
              type="submit" 
              className="publish-signal-btn"
              disabled={sendingSignal || !selectedDevice}
            >
              {sendingSignal ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Publishing command...</span>
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  <span>Publish MQTT Command</span>
                </>
              )}
            </button>
          </form>

          <div className="broker-details-panel">
            <h3 className="details-title"><Radio size={14} /> Broker Details</h3>
            <ul className="details-list">
              <li><strong>Protocol:</strong> MQTT v3.1.1</li>
              <li><strong>Local Host:</strong> `mqtt://localhost:1883`</li>
              <li><strong>Topic Format:</strong> `iot/device/+/command`</li>
              <li><strong>Aedes Core:</strong> Connected</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
