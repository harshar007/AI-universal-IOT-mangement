import React, { useState } from 'react';
import { 
  Activity, AlertTriangle, ShieldAlert, 
  TrendingUp, BarChart2, Check, RefreshCw 
} from 'lucide-react';
import '../css/Analytics.css';

export default function Analytics({ devices }) {
  const [anomalies, setAnomalies] = useState([
    {
      id: 'anom-1',
      time: '13:42',
      device: 'Living Room A/C',
      issue: 'Power draw spike (exceeded 1.8kW threshold)',
      severity: 'warning',
      resolved: false
    },
    {
      id: 'anom-2',
      time: '12:15',
      device: 'Server Room Temp Sensor',
      issue: 'Critical thermal increase detected (25.4°C)',
      severity: 'critical',
      resolved: false
    },
    {
      id: 'anom-3',
      time: '09:30',
      device: 'Ventilation Fan 01',
      issue: 'RPM exceeds nominal load ratings by 12%',
      severity: 'warning',
      resolved: true
    },
    {
      id: 'anom-4',
      time: '04:10',
      device: 'Smart Fridge',
      issue: 'Door open warning - continuous power fluctuation',
      severity: 'info',
      resolved: true
    }
  ]);

  const handleResolveAnomaly = (id) => {
    setAnomalies(prev => 
      prev.map(a => a.id === id ? { ...a, resolved: true } : a)
    );
  };

  // Mock telemetry data points for the SVG line chart (7 hours)
  const chartData = [
    { hour: '07:00', load: 1.2 },
    { hour: '08:00', load: 2.1 },
    { hour: '09:00', load: 3.8 },
    { hour: '10:00', load: 2.9 },
    { hour: '11:00', load: 3.4 },
    { hour: '12:00', load: 4.8 },
    { hour: '13:00', load: 4.1 }
  ];

  // Dynamic calculations for stats
  const activePower = devices.reduce((sum, d) => sum + (d.powerState ? d.powerDraw : 0), 0);
  const peakPower = 5.2; // kW
  const avgUptime = '99.98%';
  const carbonFootprint = (activePower * 0.00045).toFixed(3); // Metric Tons CO2/hr

  // Donut chart segments calculation (Mock allocation)
  // Smart Home, Industrial, Server Room
  const catShares = {
    'Smart Home': devices.filter(d => d.category === 'Smart Home' && d.powerState).reduce((sum, d) => sum + d.powerDraw, 0),
    'Industrial': devices.filter(d => d.category === 'Industrial' && d.powerState).reduce((sum, d) => sum + d.powerDraw, 0),
    'Server Room': devices.filter(d => d.category === 'Server Room' && d.powerState).reduce((sum, d) => sum + d.powerDraw, 0)
  };
  const totalShares = catShares['Smart Home'] + catShares['Industrial'] + catShares['Server Room'] || 1;
  const shPercent = ((catShares['Smart Home'] / totalShares) * 100).toFixed(0);
  const indPercent = ((catShares['Industrial'] / totalShares) * 100).toFixed(0);
  const srPercent = ((catShares['Server Room'] / totalShares) * 100).toFixed(0);

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="dashboard-header">
        <div>
          <h1>Analytics AI</h1>
          <p className="dashboard-subtitle">Historical statistics & real-time telemetry assessment</p>
        </div>
      </header>

      {/* Stats Dashboard Summary */}
      <section className="analytics-summary-grid">
        <div className="summary-stat-card glass-panel">
          <span className="stat-label">AVERAGE NODE UPTIME</span>
          <span className="stat-value text-green">{avgUptime}</span>
          <p className="stat-meta">Across 24-hour cycle</p>
        </div>
        <div className="summary-stat-card glass-panel">
          <span className="stat-label">PEAK DEMAND (24H)</span>
          <span className="stat-value text-orange">{peakPower} kW</span>
          <p className="stat-meta">Spike recorded at 12:00</p>
        </div>
        <div className="summary-stat-card glass-panel">
          <span className="stat-label">CO2 OFFSET INDEX</span>
          <span className="stat-value text-cyan">{carbonFootprint} t</span>
          <p className="stat-meta">Estimated emissions per hour</p>
        </div>
      </section>

      {/* Grid: Charts Row */}
      <section className="charts-grid-layout">
        
        {/* Line Chart */}
        <div className="chart-container-card glass-panel">
          <div className="chart-header-row">
            <div className="chart-title-block">
              <TrendingUp size={18} className="text-cyan" />
              <h3>Grid Power Demand Profile</h3>
            </div>
            <span className="chart-timeframe">7-Hour Window</span>
          </div>

          <div className="svg-chart-wrapper">
            <svg viewBox="0 0 500 220" className="svg-line-chart">
              {/* Gradients */}
              <defs>
                <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--glass-border)" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--glass-border)" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="var(--glass-border)" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--glass-border)" />

              {/* Y Axis Labels */}
              <text x="15" y="25" className="chart-axis-text">5kW</text>
              <text x="15" y="75" className="chart-axis-text">3kW</text>
              <text x="15" y="125" className="chart-axis-text">2kW</text>
              <text x="15" y="175" className="chart-axis-text">0kW</text>

              {/* X Axis Labels */}
              {chartData.map((d, i) => (
                <text 
                  key={i} 
                  x={40 + i * 70} 
                  y="205" 
                  textAnchor="middle" 
                  className="chart-axis-text"
                >
                  {d.hour}
                </text>
              ))}

              {/* Area Under Curve */}
              <path 
                d={`
                  M 40,170 
                  L 40,${170 - (chartData[0].load / 5) * 150} 
                  L 110,${170 - (chartData[1].load / 5) * 150} 
                  L 180,${170 - (chartData[2].load / 5) * 150} 
                  L 250,${170 - (chartData[3].load / 5) * 150} 
                  L 320,${170 - (chartData[4].load / 5) * 150} 
                  L 390,${170 - (chartData[5].load / 5) * 150} 
                  L 460,${170 - (chartData[6].load / 5) * 150} 
                  L 460,170 Z
                `}
                fill="url(#chart-glow)"
              />

              {/* Chart Line */}
              <path 
                d={`
                  M 40,${170 - (chartData[0].load / 5) * 150} 
                  L 110,${170 - (chartData[1].load / 5) * 150} 
                  L 180,${170 - (chartData[2].load / 5) * 150} 
                  L 250,${170 - (chartData[3].load / 5) * 150} 
                  L 320,${170 - (chartData[4].load / 5) * 150} 
                  L 390,${170 - (chartData[5].load / 5) * 150} 
                  L 460,${170 - (chartData[6].load / 5) * 150}
                `}
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="3"
                strokeLinecap="round"
                className="chart-path-line"
              />

              {/* Nodes dots */}
              {chartData.map((d, i) => (
                <circle 
                  key={i}
                  cx={40 + i * 70}
                  cy={170 - (d.load / 5) * 150}
                  r="5"
                  fill="var(--bg-primary)"
                  stroke="var(--accent-cyan)"
                  strokeWidth="2"
                  className="chart-dot"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-container-card glass-panel donut-chart-panel">
          <div className="chart-header-row">
            <div className="chart-title-block">
              <BarChart2 size={18} className="text-violet" />
              <h3>Zone Energy Allocation</h3>
            </div>
          </div>

          <div className="donut-content-wrapper">
            <div className="svg-donut-wrapper">
              <svg viewBox="0 0 160 160" className="svg-donut-chart">
                {/* Outer Ring */}
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="18" />
                
                {/* Smart Home Share (Cyan) */}
                <circle 
                  cx="80" cy="80" r="60" 
                  fill="transparent" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth="18"
                  strokeDasharray={`${shPercent * 3.77} 377`}
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                />
                
                {/* Industrial Share (Violet) */}
                <circle 
                  cx="80" cy="80" r="60" 
                  fill="transparent" 
                  stroke="var(--accent-violet)" 
                  strokeWidth="18"
                  strokeDasharray={`${indPercent * 3.77} 377`}
                  strokeDashoffset={`-${shPercent * 3.77}`}
                  transform="rotate(-90 80 80)"
                />

                {/* Server Room Share (Orange) */}
                <circle 
                  cx="80" cy="80" r="60" 
                  fill="transparent" 
                  stroke="var(--accent-orange)" 
                  strokeWidth="18"
                  strokeDasharray={`${srPercent * 3.77} 377`}
                  strokeDashoffset={`-${(parseInt(shPercent) + parseInt(indPercent)) * 3.77}`}
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center-text">
                <span className="donut-num">{activePower}</span>
                <span className="donut-unit">Watts</span>
              </div>
            </div>

            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-swatch cyan"></span>
                <span className="legend-name">Smart Home ({shPercent}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-swatch violet"></span>
                <span className="legend-name">Industrial ({indPercent}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-swatch orange"></span>
                <span className="legend-name">Server Room ({srPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* AI Anomalies Log */}
      <section className="anomalies-section glass-panel">
        <div className="section-header">
          <div className="section-title">
            <AlertTriangle className="text-yellow animate-pulse" size={20} />
            <h3>AI Anomaly Detection Log</h3>
          </div>
          <span className="badge-count text-yellow">{anomalies.filter(a => !a.resolved).length} Pending Alerts</span>
        </div>

        <div className="anomalies-list">
          {anomalies.map(anom => (
            <div 
              key={anom.id} 
              className={`anomaly-item glass-panel ${anom.resolved ? 'resolved' : ''} border-${anom.severity}`}
            >
              <div className="anomaly-meta">
                <span className="anomaly-time">{anom.time}</span>
                <span className={`anomaly-badge-severity ${anom.severity}`}>
                  {anom.severity === 'critical' ? <ShieldAlert size={12} /> : null}
                  {anom.severity}
                </span>
              </div>

              <div className="anomaly-details">
                <span className="anomaly-device">{anom.device}</span>
                <p className="anomaly-issue">{anom.issue}</p>
              </div>

              <div className="anomaly-action-side">
                {anom.resolved ? (
                  <div className="resolved-status">
                    <Check size={14} className="text-green" />
                    <span>Mitigated</span>
                  </div>
                ) : (
                  <button 
                    className="anomaly-resolve-btn"
                    onClick={() => handleResolveAnomaly(anom.id)}
                  >
                    Resolve Alert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
