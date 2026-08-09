import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, SlidersHorizontal, Trash2,
  Wifi, WifiOff, Battery, BatteryLow,
  AlertCircle, CheckCircle2, X,
  Copy, Key, RefreshCw, Power, PowerOff,
  LayoutGrid, List, Cpu, MapPin,
  ArrowUpDown, FilterX
} from 'lucide-react';
import '../css/Devices.css';

const CATEGORIES = ['All', 'Smart Home', 'Industrial', 'Server Room', 'ESP32 Board', 'ESP8266 Board', 'Custom Board'];
const STATUSES   = ['All', 'Online', 'Offline', 'Maintenance'];

function StatusChip({ status }) {
  const map = {
    online:      { cls: 'chip-success', label: 'Online' },
    offline:     { cls: 'chip-warning', label: 'Offline' },
    maintenance: { cls: 'chip-info',    label: 'Maintenance' },
  };
  const s = map[status] || { cls: '', label: status };
  return (
    <span className={`chip ${s.cls}`}>
      <span className="chip-dot" />
      {s.label}
    </span>
  );
}

function CategoryIcon({ category, status, size = 20 }) {
  const tone =
    status === 'online'   ? 'green'  :
    status === 'maintenance' ? 'yellow' :
    'red';
  return (
    <div className={`dev-card-icon ${status === 'online' ? 'green' : tone}`}>
      <Cpu size={size} />
    </div>
  );
}

export default function Devices({
  devices,
  onToggleDevice,
  onAddDevice,
  onDeleteDevice,
  onRegenerateToken,
  onChangeDeviceValue
}) {
  const navigate = useNavigate();

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus]   = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // Multi-select
  const [selectedIds, setSelectedIds] = useState(new Set());

  // View
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  // Modal: add / regenerate / success
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerResult, setRegisterResult] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form
  const [newDevice, setNewDevice] = useState({
    name: '',
    category: 'Smart Home',
    location: '',
    value: '',
    unit: '°C',
    powerDraw: 50,
  });

  // Derived
  const locations = useMemo(() => {
    const set = new Set(devices.map((d) => d.location).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [devices]);

  const categoryCounts = useMemo(() => {
    const counts = { All: devices.length };
    devices.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = devices.filter((d) => {
      const matchesSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
      const matchesStatus   = filterStatus   === 'All' ||
        (filterStatus === 'Online' && d.status === 'online') ||
        (filterStatus === 'Offline' && d.status === 'offline') ||
        (filterStatus === 'Maintenance' && d.status === 'maintenance');
      const matchesLocation = filterLocation === 'All' || d.location === filterLocation;
      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':   return a.name.localeCompare(b.name);
        case 'name-desc':  return b.name.localeCompare(a.name);
        case 'value-asc':  return (a.value || 0) - (b.value || 0);
        case 'value-desc': return (b.value || 0) - (a.value || 0);
        case 'power-desc': return (b.powerDraw || 0) - (a.powerDraw || 0);
        case 'status':     return (a.status || '').localeCompare(b.status || '');
        default: return 0;
      }
    });
    return list;
  }, [devices, searchQuery, filterCategory, filterStatus, filterLocation, sortBy]);

  // Selection
  const allSelected = filteredDevices.length > 0 && filteredDevices.every((d) => selectedIds.has(d.id));
  const someSelected = !allSelected && filteredDevices.some((d) => selectedIds.has(d.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allSelected) return new Set();
      const next = new Set(prev);
      filteredDevices.forEach((d) => next.add(d.id));
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Modal handlers
  const openAddModal = () => {
    setRegisterError('');
    setRegisterResult(null);
    setIsRegeneratingToken(false);
    setNewDevice({ name: '', category: 'Smart Home', location: '', value: '', unit: '°C', powerDraw: 50 });
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setRegisterResult(null);
    setRegisterError('');
    setIsRegistering(false);
    setCopied(false);
  };

  const handleCopyToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDevice.name.trim() || !newDevice.location.trim()) return;
    setIsRegistering(true);
    setRegisterError('');
    const device = {
      id: `${newDevice.category.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newDevice.name.trim(),
      category: newDevice.category,
      location: newDevice.location.trim(),
      status: 'online',
      powerState: true,
      value: newDevice.value === '' ? 0 : parseFloat(newDevice.value),
      unit: newDevice.unit || '',
      powerDraw: parseFloat(newDevice.powerDraw) || 0,
      battery: newDevice.category === 'Server Room' ? 100 : null,
      lastUpdated: 'Just now',
    };
    try {
      const result = await onAddDevice(device);
      setRegisterResult(result || device);
    } catch (err) {
      setRegisterError(err.response?.data?.error || err.message || 'Failed to provision device.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegenerateClick = async (deviceId) => {
    if (!window.confirm('Regenerate the Secret Key? Microcontrollers using the old key must be updated.')) return;
    setIsRegeneratingToken(true);
    setIsModalOpen(true);
    setRegisterResult(null);
    setRegisterError('');
    try {
      const result = await onRegenerateToken(deviceId);
      setRegisterResult(result);
    } catch (err) {
      setRegisterError('Failed to regenerate token.');
    } finally {
      setIsRegeneratingToken(false);
    }
  };

  // Batch operations
  const handleBatchPower = async (state) => {
    for (const id of selectedIds) {
      try { await onToggleDevice(id, state); } catch (e) { /* ignore individual */ }
    }
    clearSelection();
  };
  const handleBatchDelete = () => {
    if (!window.confirm(`Delete ${selectedIds.size} selected device(s)?`)) return;
    selectedIds.forEach((id) => onDeleteDevice(id));
    clearSelection();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterLocation('All');
    setSortBy('name-asc');
  };
  const hasActiveFilters =
    searchQuery !== '' ||
    filterCategory !== 'All' ||
    filterStatus !== 'All' ||
    filterLocation !== 'All';

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>Devices</h1>
          <p>Provision, monitor, and manage your IoT fleet</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-filled" onClick={openAddModal}>
            <Plus size={16} /> Add device
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dev-toolbar">
        <div className="dev-search">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Search devices by name, location, ID, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="dev-view-toggle">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Grid view"
            type="button"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="List view"
            type="button"
          >
            <List size={16} />
          </button>
        </div>
        <select
          className="dev-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="value-desc">Value (high–low)</option>
          <option value="value-asc">Value (low–high)</option>
          <option value="power-desc">Power draw (high–low)</option>
          <option value="status">Status</option>
        </select>
        {hasActiveFilters && (
          <button className="btn btn-text btn-sm" onClick={clearFilters} type="button">
            <FilterX size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="dev-filters" style={{ marginBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`dev-filter-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
            <span className="count">{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </div>

      {/* Status + location filters */}
      <div className="dev-filters" style={{ marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`dev-filter-chip ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </button>
        ))}
        {locations.length > 2 && (
          <select
            className="dev-select"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={{ marginLeft: 'auto' }}
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'All' ? 'All locations' : `📍 ${loc}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="dev-selection-bar">
          <span className="selection-count">
            {selectedIds.size} device{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          <button className="btn btn-text btn-sm" onClick={clearSelection} type="button">
            Clear
          </button>
          <div className="spacer" />
          <button className="btn btn-outlined btn-sm" onClick={() => handleBatchPower(true)} type="button">
            <Power size={14} /> Power on
          </button>
          <button className="btn btn-outlined btn-sm" onClick={() => handleBatchPower(false)} type="button">
            <PowerOff size={14} /> Power off
          </button>
          <button className="btn btn-outlined btn-sm" onClick={handleBatchDelete} type="button">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Devices list */}
      {filteredDevices.length === 0 ? (
        <div className="empty-state">
          <Cpu size={36} />
          <h3>No devices found</h3>
          <p>
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Add your first device to start streaming telemetry.'}
          </p>
          {hasActiveFilters ? (
            <button className="btn btn-outlined" onClick={clearFilters} style={{ marginTop: 16 }} type="button">
              Clear filters
            </button>
          ) : (
            <button className="btn btn-filled" onClick={openAddModal} style={{ marginTop: 16 }} type="button">
              <Plus size={16} /> Add device
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="dev-grid">
          {filteredDevices.map((device) => {
            const selected = selectedIds.has(device.id);
            return (
              <div
                key={device.id}
                className={`dev-card ${selected ? 'selected' : ''} ${device.status === 'offline' ? 'offline' : ''}`}
              >
                <label className="md-checkbox card-select" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(device.id)}
                  />
                  <span className="md-checkbox-mark">
                    {selected && <CheckCircle2 size={14} />}
                  </span>
                </label>

                <div className="dev-card-actions">
                  {device.secretKey && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Regenerate secret key"
                      onClick={() => handleRegenerateClick(device.id)}
                    >
                      <Key size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    title="Configure"
                    onClick={() => navigate(`/nexus-customizer?deviceId=${device.id}`)}
                  >
                    <SlidersHorizontal size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete "${device.name}"?`)) onDeleteDevice(device.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="dev-card-top">
                  <CategoryIcon category={device.category} status={device.status} />
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 90 }}>
                    <div className="dev-card-name">{device.name}</div>
                    <div className="dev-card-id">{device.id}</div>
                  </div>
                </div>

                <div className="dev-card-meta">
                  <MapPin size={12} /> {device.location} · {device.category}
                </div>

                <div className="dev-card-value">
                  {device.status === 'online' ? (
                    <>
                      <span className="num">{device.value}</span>
                      <span className="unit">{device.unit}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 16, color: 'var(--md-on-surface-muted)' }}>Offline</span>
                  )}
                </div>

                <div className="dev-card-stats">
                  <StatusChip status={device.status} />
                  {device.battery !== null && (
                    <span className="chip">
                      {device.battery < 30 ? <BatteryLow size={12} /> : <Battery size={12} />}
                      {device.battery}%
                    </span>
                  )}
                  {device.powerDraw > 0 && (
                    <span className="chip">{device.powerDraw} W</span>
                  )}
                </div>

                <div className="dev-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-on-surface-variant)', fontSize: 13 }}>
                    {device.status === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {device.status === 'online' ? 'Connected' : 'Disconnected'}
                  </div>
                  <label className="md-switch" title="Power">
                    <input
                      type="checkbox"
                      checked={device.powerState}
                      disabled={device.status === 'offline'}
                      onChange={() => onToggleDevice(device.id)}
                    />
                    <span className="md-switch-track" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="md-card" style={{ padding: 0 }}>
          {/* Header row */}
          <div className="dev-table-row" style={{ background: 'var(--md-surface-container)', fontWeight: 500, fontSize: 12, color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <label className="md-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleSelectAll}
              />
              <span className="md-checkbox-mark">
                {allSelected && <CheckCircle2 size={14} />}
              </span>
            </label>
            <div>Device</div>
            <div className="col-hide-sm">Status</div>
            <div>Value</div>
            <div className="col-hide-sm">Battery</div>
            <div className="col-hide-sm">Power</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {filteredDevices.map((device) => {
            const selected = selectedIds.has(device.id);
            return (
              <div
                key={device.id}
                className={`dev-table-row ${selected ? 'selected' : ''}`}
              >
                <label className="md-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(device.id)}
                  />
                  <span className="md-checkbox-mark">
                    {selected && <CheckCircle2 size={14} />}
                  </span>
                </label>
                <div>
                  <div className="device-name">{device.name}</div>
                  <div className="device-id">{device.location} · {device.category}</div>
                </div>
                <div className="col-hide-sm">
                  <StatusChip status={device.status} />
                </div>
                <div className="device-val">
                  {device.status === 'online'
                    ? `${device.value}${device.unit || ''}`
                    : '—'}
                </div>
                <div className="col-hide-sm" style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>
                  {device.battery !== null ? `${device.battery}%` : '—'}
                </div>
                <div className="col-hide-sm" style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>
                  {device.powerDraw} W
                </div>
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => navigate(`/nexus-customizer?deviceId=${device.id}`)}
                    title="Configure"
                  >
                    <SlidersHorizontal size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete "${device.name}"?`)) onDeleteDevice(device.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <label className="md-switch" title="Power">
                    <input
                      type="checkbox"
                      checked={device.powerState}
                      disabled={device.status === 'offline'}
                      onChange={() => onToggleDevice(device.id)}
                    />
                    <span className="md-switch-track" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Regenerate modal */}
      {isModalOpen && (
        <div className="md-dialog-backdrop" onClick={closeModal}>
          <div className="md-dialog" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button
              className="md-dialog-close btn btn-icon"
              onClick={closeModal}
              type="button"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="md-dialog-header">
              <h2 className="md-dialog-title">
                {isRegeneratingToken
                  ? 'Regenerating secret key'
                  : registerResult
                    ? (isRegeneratingToken ? 'Secret key updated' : 'Device registered')
                    : 'Add a new device'}
              </h2>
            </div>
            <div className="md-dialog-content">
              {isRegeneratingToken && !registerResult ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div className="md-spinner" style={{ margin: '0 auto 16px' }} />
                  <p>Contacting the Nunnarri gateway to generate a new key…</p>
                </div>
              ) : registerResult ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--md-success)', marginBottom: 16 }}>
                    <CheckCircle2 size={20} />
                    <span>
                      {isRegeneratingToken
                        ? 'The secret key was regenerated successfully.'
                        : 'Your device is provisioned in the Nunnarri gateway.'}
                    </span>
                  </div>
                  <div className="md-field">
                    <label>Device ID</label>
                    <div className="token-display">
                      <code style={{ flex: 1 }}>{registerResult.deviceId || registerResult.id}</code>
                    </div>
                  </div>
                  <div className="md-field" style={{ marginTop: 12 }}>
                    <label>Secret key (MQTT password)</label>
                    <div className="token-display">
                      <code style={{ flex: 1, wordBreak: 'break-all' }}>{registerResult.secretKey}</code>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopyToken(registerResult.secretKey)}
                      >
                        {copied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--md-warning-container)', color: 'var(--md-warning)', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Copy this key now — it cannot be retrieved later.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="dev-form" id="add-device-form">
                  <div className="md-field full">
                    <label>Device name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Cooler, Air Sensor"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    />
                  </div>
                  <div className="md-field">
                    <label>Category</label>
                    <select
                      value={newDevice.category}
                      onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })}
                    >
                      <option>Smart Home</option>
                      <option>Industrial</option>
                      <option>Server Room</option>
                      <option>ESP32 Board</option>
                      <option>ESP8266 Board</option>
                      <option>Custom Board</option>
                    </select>
                  </div>
                  <div className="md-field">
                    <label>Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kitchen, Lab Zone B"
                      value={newDevice.location}
                      onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    />
                  </div>
                  <div className="md-field">
                    <label>Initial value</label>
                    <input
                      type="number"
                      placeholder="e.g. 22"
                      value={newDevice.value}
                      onChange={(e) => setNewDevice({ ...newDevice, value: e.target.value })}
                    />
                  </div>
                  <div className="md-field">
                    <label>Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. °C, %, kWh"
                      value={newDevice.unit}
                      onChange={(e) => setNewDevice({ ...newDevice, unit: e.target.value })}
                    />
                  </div>
                  <div className="md-field full">
                    <label>Base power draw (W)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newDevice.powerDraw}
                      onChange={(e) => setNewDevice({ ...newDevice, powerDraw: e.target.value })}
                    />
                  </div>
                  {registerError && (
                    <div className="full" style={{ color: 'var(--md-error)', fontSize: 13 }}>
                      {registerError}
                    </div>
                  )}
                </form>
              )}
            </div>
            <div className="md-dialog-actions">
              <button className="btn btn-text" onClick={closeModal} type="button">
                {registerResult ? 'Close' : 'Cancel'}
              </button>
              {!registerResult && !isRegeneratingToken && (
                <button
                  className="btn btn-filled"
                  type="submit"
                  form="add-device-form"
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Registering…' : 'Register device'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
