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

    const espMain = getDevice('esp32-main-board') || devicesList[0];
    if (espMain) {
      pins[0] = {
        pin: 'V0',
        deviceId: espMain.id,
        deviceName: espMain.name,
        streamKey: 'powerState',
        streamLabel: 'ESP32 Relay V0 Power',
        value: espMain.powerState ? 1 : 0,
        type: 'write',
        widgetType: 'Switch'
      };
      pins[1] = {
        pin: 'V1',
        deviceId: espMain.id,
        deviceName: espMain.name,
        streamKey: 'value',
        streamLabel: 'PWM Duty Cycle V1',
        value: espMain.value,
        type: 'write',
        widgetType: 'Slider',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    const espNode = getDevice('esp8266-nodemcu-01') || devicesList[1];
    if (espNode) {
      pins[2] = {
        pin: 'V2',
        deviceId: espNode.id,
        deviceName: espNode.name,
        streamKey: 'value',
        streamLabel: 'ESP8266 ADC Sensor V2',
        value: espNode.value,
        type: 'read',
        widgetType: 'Gauge',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    const espS3 = getDevice('esp32s3-sensor-node') || devicesList[2];
    if (espS3) {
      pins[3] = {
        pin: 'V3',
        deviceId: espS3.id,
        deviceName: espS3.name,
        streamKey: 'value',
        streamLabel: 'ESP32-S3 Core Temp V3',
        value: espS3.value,
        type: 'read',
        widgetType: 'Gauge',
        min: 0,
        max: 50,
        unit: '°C'
      };
    }

    const espRelay = getDevice('esp8266-relay-board') || devicesList[3];
    if (espRelay) {
      pins[4] = {
        pin: 'V4',
        deviceId: espRelay.id,
        deviceName: espRelay.name,
        streamKey: 'powerState',
        streamLabel: 'Relay Channel 1 (V4)',
        value: espRelay.powerState ? 1 : 0,
        type: 'write',
        widgetType: 'Switch'
      };
      pins[5] = {
        pin: 'V5',
        deviceId: espRelay.id,
        deviceName: espRelay.name,
        streamKey: 'value',
        streamLabel: 'Relay Board Load V5',
        value: espRelay.value,
        type: 'read',
        widgetType: 'Chart',
        min: 0,
        max: 100,
        unit: '%'
      };
    }

    const espCam = getDevice('esp32-cam-module') || devicesList[4];
    if (espCam) {
      pins[6] = {
        pin: 'V6',
        deviceId: espCam.id,
        deviceName: espCam.name,
        streamKey: 'value',
        streamLabel: 'Vision Stream FPS V6',
        value: espCam.value,
        type: 'read',
        widgetType: 'Display',
        min: 0,
        max: 60,
        unit: 'FPS'
      };
    }

    const stmBoard = getDevice('stm32-esp01-custom') || devicesList[5];
    if (stmBoard) {
      pins[7] = {
        pin: 'V7',
        deviceId: stmBoard.id,
        deviceName: stmBoard.name,
        streamKey: 'powerState',
        streamLabel: 'Bridge Relay V7',
        value: stmBoard.powerState ? 1 : 0,
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
