import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Smartphone, Plus, Trash2, Settings, Save, X, Edit2, 
  ArrowUp, ArrowDown, Radio, Play, RefreshCw, Terminal as TermIcon, 
  Layers, ToggleLeft, Compass, AlertCircle, HelpCircle, Activity, 
  Sliders, Battery, Wifi, Maximize2, Minimize2
} from 'lucide-react';
import axios from 'axios';
import '../css/NexusCustomizer.css';

// Initial default widgets for pre-defined IoT boards
const INITIAL_WIDGETS = {
  'esp32-main-board': [
    { id: 'w-esp-power', type: 'toggle', title: 'Relay V0 Power', stream: 'powerState', theme: 'cyan-theme', size: 'full-width' },
    { id: 'w-esp-pwm', type: 'slider', title: 'PWM Duty Cycle V1', stream: 'value', min: 0, max: 100, theme: 'cyan-theme', size: 'full-width' },
    { id: 'w-esp-volt', type: 'gauge', title: 'Core Voltage', stream: 'powerDraw', min: 0, max: 5, unit: 'V', theme: 'violet-theme', size: 'full-width' },
    { id: 'w-esp-log', type: 'terminal', title: 'ESP32 Serial Monitor', theme: 'green-theme', size: 'full-width' },
  ],
  'esp8266-nodemcu-01': [
    { id: 'w-node-gauge', type: 'gauge', title: 'ADC Sensor V2', stream: 'value', min: 0, max: 100, unit: '%', theme: 'orange-theme', size: 'full-width' },
    { id: 'w-node-batt', type: 'value', title: 'Battery Level', stream: 'battery', unit: '%', theme: 'green-theme', size: 'half-width' },
    { id: 'w-node-conn', type: 'led', title: 'MQTT Link V3', stream: 'status', theme: 'cyan-theme', size: 'half-width' },
    { id: 'w-node-chart', type: 'chart', title: 'Telemetry Stream', stream: 'value', theme: 'orange-theme', size: 'full-width' },
    { id: 'w-node-log', type: 'terminal', title: 'NodeMCU Console', theme: 'green-theme', size: 'full-width' },
  ],
  'esp32s3-sensor-node': [
    { id: 'w-s3-temp', type: 'gauge', title: 'Sensor Core Temp', stream: 'value', min: 0, max: 50, unit: '°C', theme: 'cyan-theme', size: 'full-width' },
    { id: 'w-s3-chart', type: 'chart', title: 'Multi-Sensor Data', stream: 'value', theme: 'cyan-theme', size: 'full-width' },
  ],
  'esp8266-relay-board': [
    { id: 'w-rl-r1', type: 'toggle', title: 'Relay 1 (V4)', stream: 'powerState', theme: 'green-theme', size: 'full-width' },
    { id: 'w-rl-load', type: 'gauge', title: 'Current Draw', stream: 'value', min: 0, max: 100, unit: '%', theme: 'cyan-theme', size: 'full-width' },
    { id: 'w-rl-draw', type: 'value', title: 'Active Load', stream: 'powerDraw', unit: 'W', theme: 'yellow-theme', size: 'half-width' },
    { id: 'w-rl-led', type: 'led', title: 'Relay Status', stream: 'powerState', theme: 'green-theme', size: 'half-width' },
  ],
  'esp32-cam-module': [
    { id: 'w-cam-power', type: 'toggle', title: 'Stream Active V6', stream: 'powerState', theme: 'green-theme', size: 'full-width' },
    { id: 'w-cam-fps', type: 'gauge', title: 'Framerate FPS', stream: 'value', min: 0, max: 60, unit: 'FPS', theme: 'cyan-theme', size: 'full-width' },
    { id: 'w-cam-led', type: 'led', title: 'AI Detection LED', stream: 'powerState', theme: 'green-theme', size: 'full-width' },
  ],
  'stm32-esp01-custom': [
    { id: 'w-stm-power', type: 'toggle', title: 'Bridge Relay V7', stream: 'powerState', theme: 'violet-theme', size: 'full-width' },
    { id: 'w-stm-pwm', type: 'slider', title: 'UART Speed %', stream: 'value', min: 0, max: 100, theme: 'violet-theme', size: 'full-width' },
    { id: 'w-stm-log', type: 'terminal', title: 'Firmware Logs', theme: 'green-theme', size: 'full-width' },
  ]
};

export default function NexusCustomizer({ devices, onToggleDevice, onChangeDeviceValue, onRenameDevice }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlDeviceId = searchParams.get('deviceId');

  // Active Selected Device
  const [selectedDeviceId, setSelectedDeviceId] = useState(urlDeviceId || (devices.length > 0 ? devices[0].id : ''));
  const activeDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Widget Layout state loaded from localStorage or fallback defaults
  const [widgetsMap, setWidgetsMap] = useState(() => {
    const saved = localStorage.getItem('nexus_custom_widgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed parsing saved widgets:', e);
      }
    }
    return INITIAL_WIDGETS;
  });

  // Load custom widgets layout from server on mount
  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const res = await axios.get('/api/widgets');
        if (res.data && res.data.widgetsMap) {
          setWidgetsMap(res.data.widgetsMap);
        }
      } catch (err) {
        console.warn('Failed to load custom widgets from server, using local defaults:', err.message);
      }
    };
    fetchWidgets();
  }, []);

  // Current Device's widgets
  const baseId = selectedDeviceId ? selectedDeviceId.replace(/^user_[^_]+_/, '') : '';
  const deviceWidgets = widgetsMap[selectedDeviceId] || INITIAL_WIDGETS[baseId] || [
    { id: `w-${selectedDeviceId}-power`, type: 'toggle', title: 'Power Relay', stream: 'powerState', theme: 'cyan-theme', size: 'full-width' },
    { id: `w-${selectedDeviceId}-value`, type: 'value', title: 'Reading', stream: 'value', unit: activeDevice?.unit || '', theme: 'cyan-theme', size: 'full-width' }
  ];

  // History buffer for Chart widgets
  const [chartHistory, setChartHistory] = useState({});
  // Terminal logs
  const [terminalLogs, setTerminalLogs] = useState({});

  // Widget configuration modal state
  const [editingWidget, setEditingWidget] = useState(null);
  const [editWidgetTitle, setEditWidgetTitle] = useState('');
  const [editWidgetStream, setEditWidgetStream] = useState('value');
  const [editWidgetMin, setEditWidgetMin] = useState(0);
  const [editWidgetMax, setEditWidgetMax] = useState(100);
  const [editWidgetUnit, setEditWidgetUnit] = useState('');
  const [editWidgetTheme, setEditWidgetTheme] = useState('cyan-theme');
  const [editWidgetSize, setEditWidgetSize] = useState('full-width');

  // Color picker state
  const [pickerHexCodes, setPickerHexCodes] = useState({});

  // Reset selectedDeviceId if URL parameter changes
  useEffect(() => {
    if (urlDeviceId) {
      setSelectedDeviceId(urlDeviceId);
    }
  }, [urlDeviceId]);

  // Monitor device telemetry fluctuations to feed charts and terminals
  useEffect(() => {
    if (!activeDevice) return;

    // 1. Chart history buffer update
    setChartHistory(prev => {
      const history = prev[activeDevice.id] || [];
      const updatedHistory = [...history, activeDevice.value].slice(-15); // keep last 15 points
      return {
        ...prev,
        [activeDevice.id]: updatedHistory
      };
    });

    // 2. Terminal logging updates
    if (Math.random() > 0.4) {
      const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const randomLogs = [
        `[${now}] Nunnarri AI monitor node: rssi -${Math.round(45 + Math.random()*25)}dBm`,
        `[${now}] Dynamic telemetry update: value=${activeDevice.value}${activeDevice.unit || ''}`,
        `[${now}] Power metrics synchronized: load=${activeDevice.powerDraw}W`,
        `[${now}] AI Optimization heartbeat: active=TRUE`,
        `[${now}] Battery state verified: v_cell=${activeDevice.battery !== null ? activeDevice.battery + '%' : 'Grid Power'}`
      ];
      const logLine = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setTerminalLogs(prev => {
        const logs = prev[activeDevice.id] || [`[${now}] Nunnarri AI Core client connected.`];
        const updatedLogs = [...logs, logLine].slice(-6); // Keep last 6 lines
        return {
          ...prev,
          [activeDevice.id]: updatedLogs
        };
      });
    }
  }, [activeDevice?.value, activeDevice?.powerDraw, activeDevice?.powerState, activeDevice?.id]);

  // Save layout map to localstorage and server when edited
  const saveWidgetsMap = async (newMap) => {
    setWidgetsMap(newMap);
    localStorage.setItem('nexus_custom_widgets', JSON.stringify(newMap));
    try {
      await axios.post('/api/widgets', { widgetsMap: newMap });
    } catch (err) {
      console.error('Failed to save custom widgets to server:', err.message);
    }
  };

  // Add a new widget to current device
  const handleAddWidget = (type) => {
    if (!activeDevice) return;

    const id = `w-${type}-${Date.now()}`;
    let newWidget = {
      id,
      type,
      title: `Custom ${type.toUpperCase()}`,
      stream: type === 'toggle' ? 'powerState' : 'value',
      theme: 'cyan-theme',
      size: 'full-width'
    };

    if (type === 'gauge' || type === 'slider') {
      newWidget.min = 0;
      newWidget.max = type === 'slider' && activeDevice.id.endsWith('living-room-ac') ? 30 : 100;
      newWidget.unit = activeDevice.unit || '';
    } else if (type === 'value') {
      newWidget.unit = activeDevice.unit || '';
    }

    const updatedDeviceWidgets = [...deviceWidgets, newWidget];
    saveWidgetsMap({
      ...widgetsMap,
      [activeDevice.id]: updatedDeviceWidgets
    });
  };

  // Remove widget
  const handleDeleteWidget = (widgetId) => {
    const updatedDeviceWidgets = deviceWidgets.filter(w => w.id !== widgetId);
    saveWidgetsMap({
      ...widgetsMap,
      [activeDevice.id]: updatedDeviceWidgets
    });
  };

  // Open Edit Widget modal
  const handleOpenEditWidget = (widget) => {
    setEditingWidget(widget);
    setEditWidgetTitle(widget.title);
    setEditWidgetStream(widget.stream);
    setEditWidgetMin(widget.min !== undefined ? widget.min : 0);
    setEditWidgetMax(widget.max !== undefined ? widget.max : 100);
    setEditWidgetUnit(widget.unit !== undefined ? widget.unit : '');
    setEditWidgetTheme(widget.theme);
    setEditWidgetSize(widget.size || 'full-width');
  };

  // Save Edited Widget
  const handleSaveWidgetSettings = () => {
    if (!editingWidget || !activeDevice) return;

    const updatedDeviceWidgets = deviceWidgets.map(w => {
      if (w.id !== editingWidget.id) return w;
      const updated = {
        ...w,
        title: editWidgetTitle,
        stream: editWidgetStream,
        theme: editWidgetTheme,
        size: editWidgetSize
      };
      if (w.min !== undefined) updated.min = Number(editWidgetMin);
      if (w.max !== undefined) updated.max = Number(editWidgetMax);
      if (w.unit !== undefined) updated.unit = editWidgetUnit;
      return updated;
    });

    saveWidgetsMap({
      ...widgetsMap,
      [activeDevice.id]: updatedDeviceWidgets
    });

    setEditingWidget(null);
  };

  // Reordering widgets
  const handleMoveWidget = (index, direction) => {
    if (!activeDevice) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= deviceWidgets.length) return;

    const updated = [...deviceWidgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    saveWidgetsMap({
      ...widgetsMap,
      [activeDevice.id]: updated
    });
  };

  // Color picker selection handler (mock action for widget)
  const handleSelectColorWheel = (widgetId, e) => {
    const wheel = e.currentTarget;
    const rect = wheel.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 180; // 0 to 360

    // Translate angle to a mock HEX color for display
    let hex = '#00f3ff';
    if (angle >= 0 && angle < 60) hex = '#ef4444'; // Red-ish
    else if (angle >= 60 && angle < 120) hex = '#facc15'; // Yellow
    else if (angle >= 120 && angle < 180) hex = '#10b981'; // Green
    else if (angle >= 180 && angle < 240) hex = '#00f3ff'; // Cyan
    else if (angle >= 240 && angle < 300) hex = '#a855f7'; // Violet
    else hex = '#f97316'; // Orange

    setPickerHexCodes(prev => ({
      ...prev,
      [widgetId]: hex
    }));

    // Trigger log entry in terminal
    const now = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => {
      const logs = prev[activeDevice.id] || [];
      const logLine = `[${now}] LED Hue altered: hex_val=${hex}`;
      return {
        ...prev,
        [activeDevice.id]: [...logs, logLine].slice(-6)
      };
    });
  };

  // SVG Chart path calculation helper
  const renderChartPath = (history, min, max, width = 300, height = 70) => {
    if (!history || history.length < 2) return { path: '', area: '' };

    const dataMin = min !== undefined ? min : Math.min(...history);
    const dataMax = max !== undefined ? max : Math.max(...history);
    const range = dataMax - dataMin || 1;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      // Invert Y since SVGs draw top-to-bottom
      const y = height - ((val - dataMin) / range) * (height - 10) - 5;
      return { x, y };
    });

    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { path: pathD, area: areaD };
  };

  return (
    <div className="page">
      {/* Header Banner */}
      <header className="dashboard-header">
        <div>
          <h1>Nunnarri Custom AI Power Customizer</h1>
          <p className="dashboard-subtitle">Build custom AI-powered device controllers and live dashboards</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className={`blynk-edit-toggle ${isEditMode ? 'active border-orange' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              borderColor: isEditMode ? 'var(--accent-orange)' : 'var(--glass-border)',
              background: isEditMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255,255,255,0.05)',
              color: isEditMode ? 'var(--accent-orange)' : 'var(--text-primary)'
            }}
          >
            <Smartphone size={16} style={{ marginRight: '6px' }} />
            <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Dashboard Layout'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <section className="blynk-workspace">
        
        {/* Left column: Smartphone device mockup */}
        <div className="phone-mockup">
          <div className="phone-notch">
            <div className="phone-speaker"></div>
          </div>
          
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-title-block">
                <span className="phone-app-name">Nunnarri Mobile AI</span>
                <span className="phone-device-name">{activeDevice ? activeDevice.name : 'No device connected'}</span>
              </div>
              <Radio size={18} className="text-cyan animate-pulse" />
            </div>

            {/* Blynk custom widgets panel inside mockup */}
            <div className="blynk-phone-grid">
              {deviceWidgets.length > 0 ? (
                deviceWidgets.map((widget, idx) => {
                  const valStream = activeDevice ? activeDevice[widget.stream] : 0;
                  const isPowerOn = activeDevice ? activeDevice.powerState : false;
                  const isOnline = activeDevice ? activeDevice.status === 'online' : false;

                  return (
                    <div 
                      key={widget.id} 
                      className={`blynk-widget ${widget.size || 'full-width'} ${widget.theme} ${isEditMode ? 'edit-mode-active' : ''}`}
                    >
                      <div className="blynk-widget-header">
                        <span className="blynk-widget-title">{widget.title}</span>
                        {isEditMode && (
                          <div className="widget-edit-controls">
                            {idx > 0 && (
                              <button 
                                className="widget-control-btn" 
                                onClick={() => handleMoveWidget(idx, -1)}
                                title="Move Up"
                              >
                                <ArrowUp size={11} />
                              </button>
                            )}
                            {idx < deviceWidgets.length - 1 && (
                              <button 
                                className="widget-control-btn" 
                                onClick={() => handleMoveWidget(idx, 1)}
                                title="Move Down"
                              >
                                <ArrowDown size={11} />
                              </button>
                            )}
                            <button 
                              className="widget-control-btn btn-edit" 
                              onClick={() => handleOpenEditWidget(widget)}
                              title="Edit Settings"
                            >
                              <Settings size={11} />
                            </button>
                            <button 
                              className="widget-control-btn btn-delete" 
                              onClick={() => handleDeleteWidget(widget.id)}
                              title="Delete Widget"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Render custom widget type bodies */}
                      {widget.type === 'toggle' && (
                        <div className="widget-toggle-buttons-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pin State</span>
                            <span className="widget-toggle-value" style={{ fontSize: '0.75rem', fontWeight: '700', color: isPowerOn ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                              {isPowerOn ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button
                              type="button"
                              className={`toggle-action-btn btn-on ${isPowerOn ? 'active' : ''}`}
                              disabled={!isOnline}
                              onClick={() => { if (!isPowerOn) onToggleDevice(activeDevice.id, true); }}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: isPowerOn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.02)',
                                color: isPowerOn ? 'var(--accent-green)' : 'var(--text-muted)',
                                border: isPowerOn ? '1px solid var(--accent-green)' : '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isPowerOn ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none'
                              }}
                            >
                              ON
                            </button>
                            <button
                              type="button"
                              className={`toggle-action-btn btn-off ${!isPowerOn ? 'active' : ''}`}
                              disabled={!isOnline}
                              onClick={() => { if (isPowerOn) onToggleDevice(activeDevice.id, false); }}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: !isPowerOn ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.02)',
                                color: !isPowerOn ? '#f87171' : 'var(--text-muted)',
                                border: !isPowerOn ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: !isPowerOn ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none'
                              }}
                            >
                              OFF
                            </button>
                          </div>
                        </div>
                      )}

                      {widget.type === 'slider' && (
                        <div className="widget-slider-container">
                          <div className="widget-slider-header">
                            <span>Min: {widget.min}°</span>
                            <span className="current-val">{valStream}{widget.unit}</span>
                            <span>Max: {widget.max}°</span>
                          </div>
                          <input 
                            type="range"
                            min={widget.min}
                            max={widget.max}
                            value={valStream !== null && valStream !== undefined ? valStream : widget.min}
                            disabled={!isPowerOn || !isOnline}
                            onChange={(e) => onChangeDeviceValue(activeDevice.id, parseFloat(e.target.value))}
                            className="blynk-range-input"
                          />
                        </div>
                      )}

                      {widget.type === 'gauge' && (
                        <div className="widget-gauge-container">
                          <svg className="widget-gauge-svg">
                            <circle className="widget-gauge-track" cx="60" cy="60" r="50"></circle>
                            <circle 
                              className="widget-gauge-fill" 
                              cx="60" 
                              cy="60" 
                              r="50"
                              style={{
                                stroke: `var(--accent-${widget.theme.split('-')[0]})`,
                                strokeDasharray: 314,
                                strokeDashoffset: 314 - (314 * Math.min(100, ((valStream - (widget.min || 0)) / ((widget.max - widget.min) || 1)) * 100)) / 100
                              }}
                            ></circle>
                          </svg>
                          <div className="widget-gauge-text">
                            <span className="widget-gauge-value">{valStream}</span>
                            <span className="widget-gauge-unit">{widget.unit}</span>
                          </div>
                        </div>
                      )}

                      {widget.type === 'chart' && (
                        <div style={{ position: 'relative' }}>
                          <svg className="widget-chart-svg">
                            {(() => {
                              const history = chartHistory[activeDevice?.id] || [activeDevice?.value || 0];
                              const { path, area } = renderChartPath(history, widget.min, widget.max);
                              const strokeColor = `var(--accent-${widget.theme.split('-')[0]})`;
                              const fillColor = `var(--accent-${widget.theme.split('-')[0]}-glow)`;
                              return (
                                <>
                                  <path d={area} fill={fillColor} opacity={0.15} />
                                  <path d={path} stroke={strokeColor} fill="none" strokeWidth={2} />
                                </>
                              );
                            })()}
                          </svg>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            <span>Real-time Stream</span>
                            <span>{valStream}{widget.unit}</span>
                          </div>
                        </div>
                      )}

                      {widget.type === 'led' && (
                        <div className="widget-led-row">
                          <div className={`widget-led-light ${isPowerOn && isOnline ? 'led-on' : 'led-off'}`}></div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                            {isOnline ? (isPowerOn ? 'Active Signal Link' : 'Channel Ready') : 'Device Offline'}
                          </span>
                        </div>
                      )}

                      {widget.type === 'value' && (
                        <div className="widget-value-display">
                          {valStream !== null ? `${valStream} ${widget.unit || ''}` : 'N/A'}
                        </div>
                      )}

                      {widget.type === 'rgb' && (
                        <div className="widget-rgb-picker">
                          <div className="rgb-color-wheel" onClick={(e) => handleSelectColorWheel(widget.id, e)}>
                            <div className="rgb-wheel-selector"></div>
                          </div>
                          <span className="rgb-hex-value">RGB: {pickerHexCodes[widget.id] || '#00f3ff'}</span>
                        </div>
                      )}

                      {widget.type === 'terminal' && (
                        <div className="widget-terminal-window">
                          {(terminalLogs[activeDevice?.id] || [`Terminal stream initialized...`]).map((line, lIdx) => (
                            <div key={lIdx} className="widget-terminal-line">{line}</div>
                          ))}
                          <div className="widget-terminal-line">
                            <span>$ listening</span>
                            <span className="widget-terminal-cursor"></span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="blynk-empty-screen">
                  <HelpCircle size={40} className="blynk-empty-screen-icon" />
                  <h4>No Widgets Configured</h4>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Toggle Edit Mode or add widgets from the toolbox on the right.</p>
                </div>
              )}

              {isEditMode && <div className="reorder-hint">Drag/reorder controls are enabled in editor</div>}
            </div>
          </div>
        </div>

        {/* Right column: Configurator & Toolbox panel */}
        <div className="customizer-panel glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Configuration Panel</h3>
          
          {/* Device Selector */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select Active IoT Channel</label>
            <select 
              className="form-select"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                setIsEditMode(false);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              }}
            >
              {devices.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name} ({dev.location})</option>
              ))}
            </select>
          </div>

          {/* Rename Device Name Editor */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Rename Active Device</label>
            <input 
              type="text"
              value={activeDevice ? activeDevice.name : ''}
              onChange={(e) => onRenameDevice(selectedDeviceId, e.target.value)}
              placeholder="Enter custom device name..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Widgets Toolbox (Visible only in Edit Mode or always as dashboard layout reference) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {isEditMode ? '★ Widget Toolbox (Click to add)' : '★ Widget Toolbox (Enable Edit Mode to customize)'}
            </h4>
            
            <div className="widget-toolbox-grid">
              {[
                { type: 'toggle', label: 'Button Switch', icon: ToggleLeft },
                { type: 'slider', label: 'Value Slider', icon: Sliders },
                { type: 'gauge', label: 'Circular Gauge', icon: Activity },
                { type: 'chart', label: 'Telemetry Graph', icon: Radio },
                { type: 'led', label: 'LED Light', icon: Activity },
                { type: 'value', label: 'Value Display', icon: Layers },
                { type: 'rgb', label: 'Color Selector', icon: Compass },
                { type: 'terminal', label: 'Terminal Log', icon: TermIcon },
              ].map(item => {
                const IconComponent = item.icon;
                return (
                  <button 
                    key={item.type}
                    disabled={!isEditMode}
                    className="toolbox-card"
                    onClick={() => handleAddWidget(item.type)}
                  >
                    <IconComponent size={24} className="toolbox-card-icon" />
                    <span className="toolbox-card-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Download C++ Library Card */}
            <div className="glass-panel border-cyan" style={{ padding: '1rem', background: 'rgba(0, 243, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Layers size={20} className="text-cyan" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.85rem' }}>Nunnarri IoT C++ Library</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ESP32 & ESP8266 Driver (v1.0.0)</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                Integrate physical hardware nodes with this dashboard using virtual pins and non-blocking timers.
              </p>
              <a 
                href="/nexus-iot-library.zip" 
                download="nexus-iot-library.zip"
                className="btn-download-library"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem',
                  background: 'var(--accent-cyan)',
                  color: '#000',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 15px rgba(0, 243, 255, 0.25)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Download Driver ZIP
              </a>
            </div>

            {/* Guide Info */}
            <div className="glass-panel" style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <HelpCircle size={18} className="text-cyan" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Nunnarri Customizer Quick Guide:</strong>
                  1. Choose a device to configure.<br />
                  2. Type any name in the **Rename Active Device** box to rename it.<br />
                  3. Toggle **Edit Dashboard Layout** to rearrange widgets or add new ones.<br />
                  4. Use the gear icon on widgets to map properties and customize colors.<br />
                  5. Exit Edit Mode to interact with controls.
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Widget Settings Configuration Modal */}
      {editingWidget && (
        <div className="blynk-modal-backdrop">
          <div className="blynk-modal">
            <div className="blynk-modal-header">
              <h3>Widget Configurations</h3>
              <button 
                onClick={() => setEditingWidget(null)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', width: 'auto', boxShadow: 'none' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="blynk-modal-body">
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Widget Title Label</label>
                <input 
                  type="text"
                  value={editWidgetTitle}
                  onChange={(e) => setEditWidgetTitle(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Datastream Binding</label>
                <select 
                  className="form-select"
                  value={editWidgetStream}
                  onChange={(e) => setEditWidgetStream(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="value">Value Stream (Sensor Settings/Readings)</option>
                  <option value="powerState">Power Draw Relay Switch (powerState)</option>
                  <option value="powerDraw">Electrical Load Consumption (powerDraw)</option>
                  <option value="battery">Energy Reservoir Sensor (battery level)</option>
                </select>
              </div>

              {(editingWidget.type === 'slider' || editingWidget.type === 'gauge') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Min Value</label>
                    <input 
                      type="number"
                      value={editWidgetMin}
                      onChange={(e) => setEditWidgetMin(e.target.value)}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Max Value</label>
                    <input 
                      type="number"
                      value={editWidgetMax}
                      onChange={(e) => setEditWidgetMax(e.target.value)}
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              )}

              {(editingWidget.type === 'slider' || editingWidget.type === 'gauge' || editingWidget.type === 'value') && (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Measurement Unit Tag</label>
                  <input 
                    type="text"
                    placeholder="e.g. °C, %, W, V, A"
                    value={editWidgetUnit}
                    onChange={(e) => setEditWidgetUnit(e.target.value)}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Color Accent Theme</label>
                  <select 
                    className="form-select"
                    value={editWidgetTheme}
                    onChange={(e) => setEditWidgetTheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="cyan-theme">Electric Cyan</option>
                    <option value="violet-theme">Plasma Violet</option>
                    <option value="green-theme">Eco Green</option>
                    <option value="orange-theme">Pulse Orange</option>
                    <option value="yellow-theme">Cyber Yellow</option>
                    <option value="red-theme">Emergency Red</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Widget Width Scale</label>
                  <select 
                    className="form-select"
                    value={editWidgetSize}
                    onChange={(e) => setEditWidgetSize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="full-width">Full Width (2 Columns)</option>
                    <option value="half-width">Half Width (1 Column)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="blynk-modal-footer">
              <button 
                type="button" 
                onClick={() => setEditingWidget(null)}
                style={{
                  background: 'none',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveWidgetSettings}
                style={{
                  background: 'var(--accent-cyan)',
                  color: '#000',
                  fontWeight: '700',
                  border: 'none',
                }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
