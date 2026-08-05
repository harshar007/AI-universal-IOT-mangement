import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SlidersHorizontal, Trash2,
  Wifi, WifiOff, Battery, BatteryCharging,
  AlertCircle, CheckCircle2, X, Sliders, Copy, Key, RefreshCw
} from 'lucide-react';
import '../css/Devices.css';

export default function Devices({ devices, onToggleDevice, onAddDevice, onDeleteDevice, onRegenerateToken }) {
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new device
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceCategory, setNewDeviceCategory] = useState('Smart Home');
  const [newDeviceLocation, setNewDeviceLocation] = useState('Living Room');
  const [newDeviceValue, setNewDeviceValue] = useState('');
  const [newDeviceUnit, setNewDeviceUnit] = useState('°C');
  const [newDevicePower, setNewDevicePower] = useState('50');

  // Token / Registration / Copy states
  const [registerResult, setRegisterResult] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [copiedDeviceId, setCopiedDeviceId] = useState(null);

  // Filter & Search logic
  const filteredDevices = devices.filter(device => {
    const matchesCategory = filterCategory === 'All' || device.category === filterCategory;
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setRegisterError('');
    setRegisterResult(null);
    setIsRegeneratingToken(false);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form
    setNewDeviceName('');
    setNewDeviceValue('');
    setRegisterResult(null);
    setIsRegistering(false);
    setRegisterError('');
    setCopied(false);
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardCopyToken = (deviceId, token) => {
    navigator.clipboard.writeText(token);
    setCopiedDeviceId(deviceId);
    setTimeout(() => setCopiedDeviceId(null), 2000);
  };

  const handleRegenerateClick = async (deviceId) => {
    const confirmRegen = window.confirm("Are you sure you want to regenerate the Secret Key for this device? Microcontrollers connected with the old key will need to be updated.");
    if (!confirmRegen) return;

    setIsRegeneratingToken(true);
    setIsModalOpen(true);
    setRegisterResult(null);
    setRegisterError('');

    try {
      const result = await onRegenerateToken(deviceId);
      setRegisterResult(result);
    } catch (err) {
      console.error(err);
      setRegisterError('Failed to regenerate token on gateway server.');
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setNewDeviceCategory(cat);
    // Set typical units based on category
    if (cat === 'Server Room') {
      setNewDeviceUnit('°C');
      setNewDevicePower('15');
    } else if (cat === 'Industrial') {
      setNewDeviceUnit('%');
      setNewDevicePower('400');
    } else {
      setNewDeviceUnit('°C');
      setNewDevicePower('100');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setIsRegistering(true);
    setRegisterError('');

    const newDevice = {
      id: `${newDeviceCategory.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newDeviceName,
      category: newDeviceCategory,
      location: newDeviceLocation,
      status: 'online',
      powerState: true,
      value: newDeviceValue ? parseFloat(newDeviceValue) : 0,
      unit: newDeviceUnit,
      powerDraw: parseInt(newDevicePower) || 0,
      battery: newDeviceCategory === 'Server Room' ? 100 : null,
      lastUpdated: 'Just now'
    };

    try {
      const result = await onAddDevice(newDevice);
      setRegisterResult(result);
    } catch (err) {
      setRegisterError(err.response?.data?.error || err.message || 'Failed to provision device.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="dashboard-header">
        <div>
          <h1>Devices Directory</h1>
          <p className="dashboard-subtitle">Manage and provision active IoT channels</p>
        </div>
        <button className="add-device-btn" onClick={handleOpenModal}>
          <Plus size={16} />
          <span>Add New Device</span>
        </button>
      </header>

      {/* Directory Filters & Search Row */}
      <section className="directory-controls glass-panel">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by device name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-group">
          <SlidersHorizontal size={16} className="text-muted" />
          {['All', 'Smart Home', 'Industrial', 'Server Room'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Devices List Grid */}
      <section className="devices-grid">
        {filteredDevices.length > 0 ? (
          filteredDevices.map(device => {
            const hasBattery = device.battery !== null;
            const isOnline = device.status === 'online';
            const isMaintenance = device.status === 'maintenance';

            return (
              <div key={device.id} className={`device-card glass-panel ${!device.powerState ? 'device-inactive' : ''}`}>
                <div className="device-card-header">
                  <div className="device-meta">
                    <span className={`device-badge-cat ${device.category.toLowerCase().replace(/\s+/g, '-')}`}>
                      {device.category}
                    </span>
                    <span className="device-location">{device.location}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="regenerate-token-btn"
                      onClick={() => handleRegenerateClick(device.id)}
                      title="Regenerate Secret Key"
                      style={{
                        padding: '6px',
                        width: '28px',
                        height: '28px',
                        background: 'none',
                        border: 'none',
                        boxShadow: 'none',
                        borderRadius: '50%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Key size={14} />
                    </button>
                    <button
                      className="configure-device-btn"
                      onClick={() => navigate(`/nexus-customizer?deviceId=${device.id}`)}
                      title="Configure Nunnarri Customizer"
                      style={{
                        padding: '6px',
                        width: '28px',
                        height: '28px',
                        background: 'none',
                        border: 'none',
                        boxShadow: 'none',
                        borderRadius: '50%',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Sliders size={14} />
                    </button>
                    <button
                      className="delete-device-icon-btn"
                      onClick={() => onDeleteDevice(device.id)}
                      title="Delete Device"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="device-card-body">
                  <h3 className="device-title">{device.name}</h3>
                  <div className="device-id-subtext" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace', opacity: 0.8, marginBottom: '0.5rem', textAlign: 'left' }}>
                    ID: {device.id}
                  </div>
                  <div className="device-metrics-row">
                    <div className="device-main-value">
                      <span className="val">{device.value}</span>
                      <span className="unit">{device.unit}</span>
                    </div>

                    {/* WiFi and Battery meters */}
                    <div className="device-secondary-metrics">
                      <div className="metric-icon-text" title="Signal Strength">
                        {isOnline ? (
                          <Wifi size={14} className="text-green" />
                        ) : (
                          <WifiOff size={14} className="text-red" />
                        )}
                        <span>{isOnline ? 'Excellent' : 'Offline'}</span>
                      </div>

                      {hasBattery && (
                        <div className="metric-icon-text" title={`Battery Level: ${device.battery}%`}>
                          <Battery size={14} className={device.battery < 30 ? 'text-red' : 'text-green'} />
                          <span>{device.battery}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="device-card-footer">
                  <div className="status-indicator-block">
                    <span className={`status-led ${device.status}`}></span>
                    <span className="status-text uppercase">{device.status}</span>
                  </div>

                  {device.secretKey && (
                    <button
                      className="card-copy-token-btn"
                      onClick={() => handleCardCopyToken(device.id, device.secretKey)}
                      title="Copy Auth Key / Secret"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      {copiedDeviceId === device.id ? (
                        <>
                          <CheckCircle2 size={10} className="text-green" />
                          <span className="text-green">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Copy Auth</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="toggle-border">
                    <input
                      type="checkbox"
                      id={`switch-dev-${device.id}`}
                      checked={device.powerState}
                      disabled={device.status === 'offline'}
                      onChange={() => onToggleDevice(device.id)}
                    />
                    <label htmlFor={`switch-dev-${device.id}`}>
                      <div className="handle"></div>
                    </label>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-devices-panel glass-panel">
            <AlertCircle size={32} className="text-yellow animate-bounce" />
            <h3>No Devices Found</h3>
            <p>We couldn't find any devices matching your filters. Try adjusting your query or add a new node.</p>
          </div>
        )}
      </section>

      {/* Add Device Overlay Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container glass-panel">
            <div className="modal-header">
              <h3>
                {isRegeneratingToken ? 'Regenerating Secret Key...' : 
                 registerResult ? (newDeviceName ? 'Node Registration Successful' : 'Secret Key Regenerated') : 
                 'Provision New Node Channel'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            {isRegeneratingToken ? (
              <div className="registration-success-pane" style={{ padding: '2rem 0' }}>
                <div className="success-icon-wrapper" style={{ color: 'var(--accent-cyan)' }}>
                  <RefreshCw size={48} className="animate-spin text-cyan" />
                </div>
                <p className="success-message">
                  Contacting the Nunnarri core gateway to generate a new secure authentication token...
                </p>
              </div>
            ) : registerResult ? (
              <div className="registration-success-pane">
                <div className="success-icon-wrapper">
                  <CheckCircle2 size={48} className="text-green animate-bounce" />
                </div>
                <p className="success-message">
                  {newDeviceName 
                    ? "Your device has been successfully registered and provisioned in the Nunnarri core gateway!"
                    : "Your device's secret key has been successfully regenerated and updated in the Nunnarri gateway database!"}
                </p>
                
                <div className="credential-box glass-panel">
                  <div className="credential-row">
                    <span className="cred-label">Device ID:</span>
                    <code className="cred-value">{registerResult.deviceId || registerResult.id}</code>
                  </div>
                  <div className="credential-row token-row">
                    <span className="cred-label">Secret Key / Token:</span>
                    <div className="token-display">
                      <code className="cred-value text-cyan">{registerResult.secretKey}</code>
                      <button 
                        type="button" 
                        onClick={() => handleCopyToken(registerResult.secretKey)} 
                        className="copy-token-btn"
                        title="Copy Secret Key"
                      >
                        {copied ? <CheckCircle2 size={16} className="text-green" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="note-alert yellow" style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} className="text-yellow" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Important:</strong> Copy this secret key now. It acts as the MQTT password for your device and cannot be recovered later!
                  </span>
                </div>

                <button type="button" className="form-btn-submit success-done-btn" onClick={handleCloseModal}>
                  Close & Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Device Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart Cooler, Air Sensor"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newDeviceCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="form-select"
                    >
                      <option value="Smart Home">Smart Home</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Server Room">Server Room</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Installation Area</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kitchen, Lab Zone B"
                      value={newDeviceLocation}
                      onChange={(e) => setNewDeviceLocation(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Value</label>
                    <input
                      type="number"
                      placeholder="e.g. 22"
                      value={newDeviceValue}
                      onChange={(e) => setNewDeviceValue(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit Label</label>
                    <input
                      type="text"
                      placeholder="e.g. °C, %, kWh"
                      value={newDeviceUnit}
                      onChange={(e) => setNewDeviceUnit(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Base Power Draw (Watts)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={newDevicePower}
                    onChange={(e) => setNewDevicePower(e.target.value)}
                    className="form-input"
                  />
                </div>

                {registerError && (
                  <div className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' }}>
                    {registerError}
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="form-btn-cancel" onClick={handleCloseModal} disabled={isRegistering}>
                    Cancel
                  </button>
                  <button type="submit" className="form-btn-submit" disabled={isRegistering}>
                    {isRegistering ? 'Registering...' : 'Provision Node'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
