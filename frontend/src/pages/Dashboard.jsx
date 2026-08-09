import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Wifi, WifiOff, Activity, Battery, BatteryLow,
  Plus, ArrowRight, AlertCircle, Layers, Zap
} from 'lucide-react';
import '../css/Dashboard.css';

function StatTile({ icon: Icon, label, value, trend, tone = 'primary' }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">
        <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {trend && <div className={`stat-trend ${trend.direction || ''}`}>{trend.text}</div>}
    </div>
  );
}

function DeviceRow({ device }) {
  const isOnline = device.status === 'online';
  const Icon = isOnline ? Wifi : WifiOff;
  return (
    <div className="device-row">
      <div className={`device-icon ${isOnline ? 'online' : ''}`}>
        <Icon size={16} />
      </div>
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-meta">
          {device.location} • {device.category}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {device.battery !== null && (
          <span className="chip" title={`Battery ${device.battery}%`}>
            {device.battery < 30 ? <BatteryLow size={12} /> : <Battery size={12} />}
            {device.battery}%
          </span>
        )}
        <span className={`chip ${isOnline ? 'chip-success' : 'chip-warning'}`}>
          <span className="chip-dot" />
          {isOnline ? 'Online' : device.status}
        </span>
        <div className="device-value">
          {isOnline ? `${device.value}${device.unit || ''}` : '—'}
        </div>
      </div>
    </div>
  );
}

function classifyLog(log) {
  if (log.includes('[TELEMETRY]')) return 'telemetry';
  if (log.includes('[STATUS]'))    return 'status';
  if (log.includes('[COMMAND]'))   return 'command';
  if (log.includes('[AI AGENT]'))  return 'ai';
  if (log.toLowerCase().includes('error')) return 'error';
  return 'system';
}

export default function Dashboard({ devices, systemLogs = [] }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const online = devices.filter((d) => d.status === 'online');
  const offline = devices.filter((d) => d.status === 'offline');
  const lowBattery = devices.filter((d) => d.battery !== null && d.battery < 30);
  const powered = devices.filter((d) => d.powerState);
  const totalPower = devices.reduce((sum, d) => sum + (d.powerDraw || 0), 0);
  const recent = [...devices].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="page">
      {/* Welcome banner */}
      <div className="dash-welcome">
        <div>
          <h2>{greeting}, Operator</h2>
          <p>
            {online.length} of {devices.length} devices online ·
            {' '}{powered.length} powered · {totalPower.toFixed(0)} W total draw
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/devices" className="btn btn-outlined">
            <Layers size={16} /> Manage devices
          </Link>
          <Link to="/ai-command" className="btn btn-filled">
            Ask AI <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="dash-stats">
        <StatTile
          icon={Cpu}
          label="Devices"
          value={devices.length}
          trend={{ text: `${online.length} online`, direction: 'up' }}
        />
        <StatTile
          icon={Wifi}
          label="Online"
          value={online.length}
          tone="green"
          trend={{ text: `${Math.round((online.length / Math.max(devices.length, 1)) * 100)}% availability` }}
        />
        <StatTile
          icon={AlertCircle}
          label="Offline"
          value={offline.length}
          tone={offline.length > 0 ? 'red' : 'primary'}
        />
        <StatTile
          icon={Zap}
          label="Power Draw"
          value={`${totalPower.toFixed(0)} W`}
          trend={{ text: `${powered.length} active loads` }}
        />
        <StatTile
          icon={Battery}
          label="Low Battery"
          value={lowBattery.length}
          tone={lowBattery.length > 0 ? 'yellow' : 'primary'}
          trend={lowBattery.length > 0 ? { text: 'Needs attention', direction: 'down' } : null}
        />
        <StatTile
          icon={Activity}
          label="Telemetry"
          value={systemLogs.length}
          trend={{ text: 'Last hour' }}
        />
      </div>

      {/* Quick actions */}
      <div className="dash-actions">
        <Link to="/devices" className="btn btn-tonal">
          <Plus size={16} /> Add device
        </Link>
        <Link to="/mqtt-monitor" className="btn btn-outlined">
          <Activity size={16} /> MQTT monitor
        </Link>
        <Link to="/virtual-pins" className="btn btn-outlined">
          <Layers size={16} /> Virtual pins
        </Link>
        <Link to="/analytics" className="btn btn-outlined">
          <Activity size={16} /> Analytics
        </Link>
      </div>

      {/* Two-column grid */}
      <div className="dash-grid">
        {/* Device list */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Connected devices</div>
              <div className="dash-card-subtitle">{devices.length} registered</div>
            </div>
            <Link to="/devices" className="btn btn-text btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dash-card-body">
            {recent.length === 0 ? (
              <div className="empty-state" style={{ margin: 16 }}>
                <Cpu size={32} />
                <h3>No devices yet</h3>
                <p>Add a device to start streaming telemetry.</p>
                <Link to="/devices" className="btn btn-filled" style={{ marginTop: 16 }}>
                  <Plus size={16} /> Add device
                </Link>
              </div>
            ) : (
              recent.map((d) => <DeviceRow key={d.id} device={d} />)
            )}
          </div>
        </div>

        {/* Live activity */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Live activity</div>
              <div className="dash-card-subtitle">Real-time gateway stream</div>
            </div>
            <Link to="/mqtt-monitor" className="btn btn-text btn-sm">
              Open <ArrowRight size={14} />
            </Link>
          </div>
          <div className="log-feed">
            {systemLogs.slice(-60).map((log, i) => {
              const kind = classifyLog(log);
              const m = log.match(/^\[(\d{1,2}:\d{2}:\d{2}[^]]*)\]\s*(.*)$/);
              const time = m ? m[1] : '';
              const body = m ? m[2] : log;
              const tagMatch = body.match(/^\[([A-Z\s]+)\]\s*(.*)$/);
              const tag = tagMatch ? tagMatch[1].trim() : '';
              const rest = tagMatch ? tagMatch[2] : body;
              return (
                <div className="log-line" key={i}>
                  {time && <span className="log-time">{time}</span>}
                  {tag && <span className={`log-tag ${kind}`}>[{tag}]</span>}
                  <span>{rest}</span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
