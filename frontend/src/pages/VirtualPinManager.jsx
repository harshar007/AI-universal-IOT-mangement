import React from 'react';
import { Sliders, RefreshCw, AlertCircle, Info, ToggleLeft, Activity, Radio, Sun } from 'lucide-react';
import '../css/VirtualPinManager.css';

export default function VirtualPinManager({ devices, onToggleDevice, onChangeDeviceValue }) {
  
  // Map Virtual Pins V0 - V15 dynamically to User's devices for Blynk-style simulation
  const mapPinsToDevices = (devicesList) => {
    const pins = Array(16).fill(null).map((_, idx) => ({
      pin: `V${idx}`,
      deviceId: null,
      deviceName: null,
      streamKey: null,
      streamLabel: 'Unbound datastream channel',
      value: 0,
      type: 'read', // 'read' or 'write'
      widgetType: 'Display',
      min: 0,
      max: 100
    }));

    const getDevice = (suffix) => devicesList.find(d => d.id.endsWith(suffix));

    const ac = getDevice('living-room-ac');
    if (ac) {
      pins[0] = {
        pin: 'V0',
        deviceId: ac.id,
        deviceName: ac.name,
        streamKey: 'powerState',
        streamLabel: 'Power State Relay',
        value: ac.powerState ? 1 : 0,
        type: 'write',
        widgetType: 'Switch'
      };
      pins[1] = {
        pin: 'V1',
        deviceId: ac.id,
        deviceName: ac.name,
        streamKey: 'value',
        streamLabel: 'Target Temperature',
        value: ac.value,
        type: 'write',
        widgetType: 'Slider',
        min: 16,
        max: 30,
        unit: '°C'
      };
    }

    const fridge = getDevice('kitchen-smart-fridge');
    if (fridge) {
      pins[2] = {
        pin: 'V2',
        deviceId: fridge.id,
        deviceName: fridge.name,
        streamKey: 'value',
        streamLabel: 'Fridge Cooling Core',
        value: fridge.value,
        type: 'read',
        widgetType: 'Gauge',
        min: -5,
        max: 15,
        unit: '°C'
      };
    }

    const serverTemp = getDevice('server-temp-sensor');
    if (serverTemp) {
      pins[3] = {
        pin: 'V3',
        deviceId: serverTemp.id,
        deviceName: serverTemp.name,
        streamKey: 'value',
        streamLabel: 'Server Temp Reading',
        value: serverTemp.value,
        type: 'read',
        widgetType: 'Gauge',
        min: 10,
        max: 50,
        unit: '°C'
      };
    }

    const serverHum = getDevice('server-humidity-sensor');
    if (serverHum) {
      pins[4] = {
        pin: 'V4',
        deviceId: serverHum.id,
        deviceName: serverHum.name,
        streamKey: 'value',
        streamLabel: 'Humidity Reading',
        value: serverHum.value,
        type: 'read',
        widgetType: 'Display',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    const grid = getDevice('main-power-grid');
    if (grid) {
      pins[5] = {
        pin: 'V5',
        deviceId: grid.id,
        deviceName: grid.name,
        streamKey: 'value',
        streamLabel: 'Grid Electrical Load',
        value: grid.value,
        type: 'read',
        widgetType: 'Chart',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    const fan = getDevice('ventilation-fan-01');
    if (fan) {
      pins[6] = {
        pin: 'V6',
        deviceId: fan.id,
        deviceName: fan.name,
        streamKey: 'powerState',
        streamLabel: 'Ventilation Fan Switch',
        value: fan.powerState ? 1 : 0,
        type: 'write',
        widgetType: 'Switch'
      };
    }

    const lights = getDevice('backyard-lighting');
    if (lights) {
      pins[9] = {
        pin: 'V9',
        deviceId: lights.id,
        deviceName: lights.name,
        streamKey: 'powerState',
        streamLabel: 'Backyard Floodlights',
        value: lights.powerState ? 1 : 0,
        type: 'write',
        widgetType: 'Switch'
      };
      pins[10] = {
        pin: 'V10',
        deviceId: lights.id,
        deviceName: lights.name,
        streamKey: 'value',
        streamLabel: 'Floodlights Intensity',
        value: lights.value,
        type: 'write',
        widgetType: 'Slider',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    return pins;
  };

  const pinsData = mapPinsToDevices(devices);

  const handleWritePin = (pinObj, nextValue) => {
    if (!pinObj.deviceId) return;

    if (pinObj.streamKey === 'powerState') {
      const state = nextValue === 1 || nextValue === true;
      onToggleDevice(pinObj.deviceId, state);
    } else if (pinObj.streamKey === 'value') {
      onChangeDeviceValue(pinObj.deviceId, parseFloat(nextValue));
    }
  };

  return (
    <div className="vpm-page-container">
      {/* Header */}
      <header className="vpm-header glass-panel">
        <div className="header-title-wrapper">
          <div className="header-icon-badge">
            <Sliders size={24} className="cyan-glow" />
          </div>
          <div>
            <h1 className="vpm-title">Virtual Pin Manager</h1>
            <p className="vpm-subtitle">Map dashboard widget datastreams and inject signals to your firmware pins (V0-V15)</p>
          </div>
        </div>
        <div className="header-info">
          <Info size={16} />
          <span>Blynk C++ Integration Active</span>
        </div>
      </header>

      {/* Grid of Virtual Pins */}
      <div className="vpm-grid">
        {pinsData.map((pinObj) => {
          const isBound = !!pinObj.deviceId;

          return (
            <div key={pinObj.pin} className={`pin-card glass-panel ${isBound ? 'bound' : 'unbound'}`}>
              <div className="pin-card-header">
                <span className="pin-badge font-mono">{pinObj.pin}</span>
                <span className={`pin-status-label ${isBound ? 'active' : 'idle'}`}>
                  {isBound ? pinObj.widgetType.toUpperCase() : 'FREE'}
                </span>
              </div>

              <div className="pin-card-body">
                {isBound ? (
                  <>
                    <h3 className="bound-device">{pinObj.deviceName}</h3>
                    <p className="bound-label">{pinObj.streamLabel}</p>
                    
                    <div className="pin-value-display">
                      <span className="value-num font-mono">
                        {pinObj.widgetType === 'Switch' 
                          ? (pinObj.value === 1 ? 'HIGH (1)' : 'LOW (0)') 
                          : `${pinObj.value}${pinObj.unit || ''}`}
                      </span>
                    </div>

                    <div className="pin-control-action">
                      {pinObj.type === 'write' ? (
                        /* Control Widgets: Allow Writing */
                        pinObj.widgetType === 'Switch' ? (
                          <div className="toggle-switch-wrapper">
                            <button
                              className={`toggle-switch-btn ${pinObj.value === 1 ? 'on' : 'off'}`}
                              onClick={() => handleWritePin(pinObj, pinObj.value === 1 ? 0 : 1)}
                            >
                              {pinObj.value === 1 ? 'SEND LOW' : 'SEND HIGH'}
                            </button>
                          </div>
                        ) : pinObj.widgetType === 'Slider' ? (
                          <div className="slider-wrapper">
                            <input
                              type="range"
                              min={pinObj.min}
                              max={pinObj.max}
                              value={pinObj.value}
                              onChange={(e) => handleWritePin(pinObj, e.target.value)}
                              className="vpm-slider-input"
                            />
                            <div className="slider-ranges font-mono">
                              <span>{pinObj.min}</span>
                              <span>{pinObj.max}</span>
                            </div>
                          </div>
                        ) : null
                      ) : (
                        /* Read-only Widgets: Sensor Telemetry */
                        <div className="sensor-indicator">
                          <Radio size={14} className="live-pulse" />
                          <span>Streaming Sensor Telemetry</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="unbound-state">
                    <p className="unbound-text">Datastream pin is open. Bind this channel to widgets in the Blynk/Nexus Customizer to start receiving telemetry.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
