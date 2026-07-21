import React, { useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Activity, ShieldAlert, Cpu } from 'lucide-react';
import '../css/Dashboard.css';

export default function Dashboard({ devices, systemLogs = [], onToggleDevice }) {
  const terminalEndRef = useRef(null);

  // Auto scroll to bottom of the terminal output when a new log is added
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs]);

  // Status summaries
  const activeDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  return (
    <div className="main-content">
      {/* Top Banner */}
      <header className="dashboard-header">
        <div>
          <h1>Operations Console</h1>
          <p className="dashboard-subtitle">Real-time system telemetry and gateway message logs</p>
        </div>
        <div className="dashboard-time-badge glass-panel">
          <Activity size={14} className="text-cyan animate-pulse" />
          <span>Gateway Stream Online</span>
        </div>
      </header>

      {/* Primary Terminal Logs Section */}
      <section className="terminal-dashboard-section">
        <div className="terminal-glass-panel">
          {/* Header of Terminal */}
          <div className="terminal-window-header">
            <div className="terminal-controls">
              <span className="control-dot red"></span>
              <span className="control-dot yellow"></span>
              <span className="control-dot green"></span>
            </div>
            <div className="terminal-title">
              <Terminal size={14} className="text-cyan" />
              <span>gateway-client@nexus-iot:~</span>
            </div>
            <div className="terminal-actions">
              <RefreshCw size={14} className="animate-spin-slow text-cyan" />
            </div>
          </div>
          
          {/* Terminal Code Console Body */}
          <div className="terminal-console-body">
            {systemLogs.map((log, index) => {
              // Color code logs based on type
              let logClass = 'log-info';
              if (log.includes('[telemetry]')) logClass = 'log-telemetry';
              if (log.includes('[status]')) logClass = 'log-status';
              if (log.includes('[command]')) logClass = 'log-command';
              if (log.includes('error')) logClass = 'log-error';

              return (
                <div key={index} className={`terminal-log-line ${logClass}`}>
                  {log}
                </div>
              );
            })}
            <div className="terminal-log-line">
              <span className="terminal-prompt">$ listening for live node packet transmissions...</span>
              <span className="widget-terminal-cursor"></span>
            </div>
            <div ref={terminalEndRef} />
          </div>
        </div>
      </section>

      {/* Connected Channels status row */}
      <section className="dashboard-channels-section" style={{ marginTop: '1.75rem' }}>
        <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            Active Hardware Channels ({activeDevices.length} Online)
          </h2>
          <span className="badge-details" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total Registered: {devices.length}
          </span>
        </div>
        
        <div className="channels-status-grid">
          {devices.map(device => (
            <div key={device.id} className={`channel-status-card glass-panel ${device.status === 'online' ? 'online-glow' : ''}`}>
              <div className="channel-info">
                <div className={`status-indicator-dot ${device.status === 'online' ? 'online' : 'offline'}`}></div>
                <div className="channel-meta">
                  <span className="channel-name">{device.name}</span>
                  <span className="channel-id">{device.id}</span>
                </div>
              </div>
              <div className="channel-value">
                {device.status === 'online' ? (
                  <span className="text-cyan font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                    {device.value} {device.unit}
                  </span>
                ) : (
                  <span className="text-muted" style={{ color: 'var(--text-secondary)' }}>Offline</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
