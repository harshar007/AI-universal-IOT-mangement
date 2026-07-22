import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Users, Server, Database, Activity, RefreshCw, Plus, 
  Trash2, Key, ShieldCheck, UserX, AlertTriangle, CheckCircle, 
  Search, ShieldAlert, Cpu, Eye, FileText, ChevronRight, Edit2
} from 'lucide-react';
import '../css/AdminPanel.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Domain States
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [dbDiag, setDbDiag] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search/Filters
  const [userQuery, setUserQuery] = useState('');
  const [deviceQuery, setDeviceQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');

  // Create User Modal/Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR'
  });

  // Edit User Modal/Form States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR'
  });

  // Fetch Current Logged-in Admin details
  const currentAdmin = JSON.parse(localStorage.getItem('user') || '{}');

  // Trigger Notifications
  const triggerNotification = (type, message) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // 1. Fetch Overview Stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to load stats overview.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch User Directory
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Device Directory
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/devices');
      setDevices(res.data);
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to load device directory.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Fetch DB Diagnostics
  const fetchDbDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/db-diagnostics');
      setDbDiag(res.data);
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to retrieve database diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to fetch audit ledger.');
    } finally {
      setLoading(false);
    }
  };

  // Tab Selection router
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'devices') fetchDevices();
    if (activeTab === 'db') fetchDbDiagnostics();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Operations: Users
  const handleUpdateUserRole = async (targetId, currentRole) => {
    if (String(targetId) === String(currentAdmin.id)) {
      triggerNotification('error', 'Security constraint: You cannot promote or demote your own user account role.');
      return;
    }

    const nextRole = currentRole === 'ADMIN' ? 'OPERATOR' : 'ADMIN';
    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    try {
      await axios.put(`/api/admin/users/${targetId}/role`, { role: nextRole });
      triggerNotification('success', `User role successfully updated to ${nextRole}.`);
      fetchUsers();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (targetId, targetEmail) => {
    if (String(targetId) === String(currentAdmin.id)) {
      triggerNotification('error', 'Security constraint: You cannot delete your own admin account.');
      return;
    }

    if (!window.confirm(`WARNING: Deleting user "${targetEmail}" is permanent and will disassociate their devices. Proceed?`)) return;

    try {
      await axios.delete(`/api/admin/users/${targetId}`);
      triggerNotification('success', `Account "${targetEmail}" deleted successfully.`);
      fetchUsers();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await axios.post('/api/admin/users', newUserForm);
      triggerNotification('success', `User "${newUserForm.email}" created successfully!`);
      setShowCreateModal(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'OPERATOR' });
      fetchUsers();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to create new user account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const triggerEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const payload = { ...editUserForm };
      if (!payload.password.trim()) {
        delete payload.password;
      }
      await axios.put(`/api/admin/users/${editingUser.id}`, payload);
      triggerNotification('success', `User "${editUserForm.email}" updated successfully!`);
      setShowEditModal(false);

      if (String(editingUser.id) === String(currentAdmin.id)) {
        const updatedLocal = {
          ...currentAdmin,
          name: editUserForm.name,
          email: editUserForm.email,
          role: editUserForm.role
        };
        localStorage.setItem('user', JSON.stringify(updatedLocal));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        fetchUsers();
      }
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to update user account details.');
    } finally {
      setCreatingUser(false);
    }
  };

  // Operations: Devices
  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm(`Are you sure you want to de-register and delete device ID: ${deviceId}?`)) return;

    try {
      await axios.delete(`/api/admin/devices/${deviceId}`);
      triggerNotification('success', `Device ${deviceId} successfully deleted.`);
      fetchDevices();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to delete device.');
    }
  };

  const handleRegenerateToken = async (deviceId) => {
    if (!window.confirm(`Warning: Regenerating secret token for ${deviceId} will disrupt its current connection. Continue?`)) return;

    try {
      const res = await axios.post(`/api/admin/devices/${deviceId}/regenerate-token`);
      triggerNotification('success', `Token regenerated! New token: ${res.data.secretKey}`);
      fetchDevices();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to regenerate device token.');
    }
  };

  // Operations: DB Purging
  const handleClearLogs = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to delete ALL transient device logs and debug messages? This cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/admin/db-maintenance/clear-logs');
      triggerNotification('success', res.data.message);
      if (activeTab === 'overview') fetchStats();
    } catch (err) {
      triggerNotification('error', err.response?.data?.error || 'Failed to clear device logs.');
    } finally {
      setLoading(false);
    }
  };

  // Filters
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredDevices = devices.filter(d => 
    d.id?.toLowerCase().includes(deviceQuery.toLowerCase()) ||
    d.name?.toLowerCase().includes(deviceQuery.toLowerCase()) ||
    d.ownerEmail?.toLowerCase().includes(deviceQuery.toLowerCase())
  );

  const filteredAudits = auditLogs.filter(a => 
    a.action?.toLowerCase().includes(auditQuery.toLowerCase()) ||
    a.user_email?.toLowerCase().includes(auditQuery.toLowerCase()) ||
    a.ip_address?.toLowerCase().includes(auditQuery.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {/* Notifications */}
      {successMsg && (
        <div className="admin-feedback success animate-slide-in">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="admin-feedback error animate-slide-in">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-header glass-panel">
        <div className="header-title-container">
          <div className="admin-badge">
            <Shield size={24} className="badge-icon glow-cyan" />
          </div>
          <div>
            <h1 className="admin-title">Core Admin Command</h1>
            <p className="admin-subtitle">Secure Administration and Diagnostics Console</p>
          </div>
        </div>
        <div className="header-status">
          <div className="pulse-indicator online"></div>
          <span className="status-text">SECURE SESSION</span>
          <button 
            className="refresh-btn" 
            onClick={() => {
              if (activeTab === 'overview') fetchStats();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'devices') fetchDevices();
              if (activeTab === 'db') fetchDbDiagnostics();
              if (activeTab === 'audit') fetchAuditLogs();
            }}
            disabled={loading}
            title="Refresh current tab"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Grid: Navigation & Content */}
      <div className="admin-main-grid">
        {/* Navigation Sidebar */}
        <aside className="admin-nav-sidebar glass-panel">
          <div className="sidebar-section-title">CONTROL CENTER</div>
          <button 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={18} />
            <span>Overview & Health</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>User Directory</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            <Cpu size={18} />
            <span>Device Registry</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'db' ? 'active' : ''}`}
            onClick={() => setActiveTab('db')}
          >
            <Database size={18} />
            <span>DB Diagnostics</span>
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={18} />
            <span>Audit Ledger</span>
          </button>

          <div className="sidebar-divider"></div>
          <div className="sidebar-section-title">MAINTENANCE</div>
          <button className="maintenance-action-btn purge" onClick={handleClearLogs}>
            <Trash2 size={16} />
            <span>Purge Device Logs</span>
          </button>
        </aside>

        {/* Content Panel */}
        <main className="admin-content-panel glass-panel">
          {/* TAB 1: OVERVIEW & MAINTENANCE */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <h2 className="panel-heading">System Diagnostics Overview</h2>
              {loading && !stats ? (
                <div className="panel-loader">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Scanning services...</span>
                </div>
              ) : stats ? (
                <div className="stats-cards-grid">
                  <div className="stats-card glass-panel border-cyan">
                    <Users size={24} className="card-icon cyan" />
                    <div className="card-val">{stats.usersCount}</div>
                    <div className="card-lbl">Total Registered Users</div>
                  </div>
                  <div className="stats-card glass-panel border-violet">
                    <Cpu size={24} className="card-icon violet" />
                    <div className="card-val">{stats.devicesCount}</div>
                    <div className="card-lbl">Registered IoT Devices</div>
                  </div>
                  <div className="stats-card glass-panel border-orange">
                    <Activity size={24} className="card-icon orange" />
                    <div className="card-val">{stats.telemetryCount}</div>
                    <div className="card-lbl">Telemetry Datapoints Logged</div>
                  </div>
                  <div className="stats-card glass-panel border-yellow">
                    <FileText size={24} className="card-icon yellow" />
                    <div className="card-val">{stats.auditLogsCount}</div>
                    <div className="card-lbl">Security Audit Events</div>
                  </div>
                </div>
              ) : null}

              {stats && (
                <div className="diag-health-wrapper">
                  <div className="diag-health-card glass-panel">
                    <h3 className="card-section-title"><Server size={16} /> PostgreSQL Connection Diagnostics</h3>
                    <div className="health-details">
                      <div className="health-row">
                        <span className="health-label">User Database Connection Pool:</span>
                        <span className="health-value highlight-cyan">{stats.dbConnections?.userDb} active backends</span>
                      </div>
                      <div className="health-row">
                        <span className="health-label">IoT Database Connection Pool:</span>
                        <span className="health-value highlight-violet">{stats.dbConnections?.iotDb} active backends</span>
                      </div>
                      <div className="health-row">
                        <span className="health-label">Gateway Communication Bridge:</span>
                        <span className="health-value status-online">OK</span>
                      </div>
                    </div>
                  </div>

                  <div className="diag-health-card glass-panel warning-border">
                    <h3 className="card-section-title warning-text"><AlertTriangle size={16} /> System Maintenance Actions</h3>
                    <p className="card-text">Purge all device logs and debug messages stored in the database. Recommended if storage capacity is constrained or for resetting test environments.</p>
                    <button className="maintenance-action-btn inline purge" onClick={handleClearLogs} disabled={loading}>
                      <Trash2 size={16} />
                      <span>{loading ? 'Purging...' : 'Execute Log Purge'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="panel-actions-bar">
                <h2 className="panel-heading">User Management</h2>
                <div className="action-inputs">
                  <div className="search-input-wrapper">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={userQuery} 
                      onChange={(e) => setUserQuery(e.target.value)} 
                    />
                  </div>
                  <button className="add-user-btn" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} />
                    <span>Create User</span>
                  </button>
                </div>
              </div>

              {loading && users.length === 0 ? (
                <div className="panel-loader">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Loading user files...</span>
                </div>
              ) : (
                <div className="table-responsive glass-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                        <th>Audits</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="no-records">No users matched search criteria.</td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => {
                          const isSelf = String(user.id) === String(currentAdmin.id);
                          return (
                            <tr key={user.id} className={isSelf ? 'row-highlight' : ''}>
                              <td className="font-mono">{user.id}</td>
                              <td>
                                <div className="user-profile-cell">
                                  {user.profile_pic ? (
                                    <img src={user.profile_pic} alt="Avatar" className="user-tbl-avatar" />
                                  ) : (
                                    <div className="user-tbl-placeholder">
                                      {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span>{user.name} {isSelf && <span className="self-tag">(You)</span>}</span>
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`badge-tag ${user.role?.toLowerCase()}`}>
                                  {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'OPERATOR'}
                                </span>
                              </td>
                              <td className="text-small">{new Date(user.created_at).toLocaleString()}</td>
                              <td className="font-mono text-center">{user.audit_count}</td>
                              <td>
                                <div className="actions-cell">
                                  <button 
                                    className="action-btn edit" 
                                    title="Edit User Details"
                                    onClick={() => triggerEditUser(user)}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    className="action-btn toggle-role" 
                                    title={user.role === 'ADMIN' ? 'Demote to Operator' : 'Promote to Admin'}
                                    onClick={() => handleUpdateUserRole(user.id, user.role)}
                                    disabled={isSelf}
                                  >
                                    {user.role === 'ADMIN' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                  </button>
                                  <button 
                                    className="action-btn delete" 
                                    title="Delete User"
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    disabled={isSelf}
                                  >
                                    <UserX size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEVICE REGISTRY */}
          {activeTab === 'devices' && (
            <div className="tab-pane">
              <div className="panel-actions-bar">
                <h2 className="panel-heading">Global Devices Directory</h2>
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search devices by ID, name, owner..." 
                    value={deviceQuery} 
                    onChange={(e) => setDeviceQuery(e.target.value)} 
                  />
                </div>
              </div>

              {loading && devices.length === 0 ? (
                <div className="panel-loader">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Loading device logs...</span>
                </div>
              ) : (
                <div className="table-responsive glass-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Device Name</th>
                        <th>Owner Email</th>
                        <th>Status</th>
                        <th>Secret Key</th>
                        <th>Last Heartbeat</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="no-records">No devices found.</td>
                        </tr>
                      ) : (
                        filteredDevices.map(dev => (
                          <tr key={dev.id}>
                            <td className="font-mono text-small">{dev.id}</td>
                            <td><strong>{dev.name}</strong></td>
                            <td>
                              <span className="owner-email" title={`Owner ID: ${dev.userId || 'System'}`}>
                                {dev.ownerEmail}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill ${dev.status}`}>
                                {dev.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="font-mono text-small secret-cell">
                              <span className="masked-secret">{dev.secretKey ? `${dev.secretKey.substring(0, 10)}...` : 'N/A'}</span>
                            </td>
                            <td className="text-small">
                              {dev.lastHeartbeat ? new Date(dev.lastHeartbeat).toLocaleString() : 'Never'}
                            </td>
                            <td className="text-small">{new Date(dev.createdAt).toLocaleString()}</td>
                            <td>
                              <div className="actions-cell">
                                <button 
                                  className="action-btn token" 
                                  title="Regenerate Token"
                                  onClick={() => handleRegenerateToken(dev.id)}
                                >
                                  <Key size={16} />
                                </button>
                                <button 
                                  className="action-btn delete" 
                                  title="De-register Device"
                                  onClick={() => handleDeleteDevice(dev.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATABASE HEALTH */}
          {activeTab === 'db' && (
            <div className="tab-pane">
              <h2 className="panel-heading">Dual PostgreSQL Engine Health</h2>
              {loading && !dbDiag ? (
                <div className="panel-loader">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Connecting to database pools...</span>
                </div>
              ) : dbDiag ? (
                <div className="db-diagnostics-grid">
                  {/* USER DB */}
                  <div className="db-diag-card glass-panel">
                    <div className="db-card-header cyan-border">
                      <div className="title-and-ver">
                        <Database size={20} className="cyan" />
                        <h3>User Database</h3>
                        <span className="db-ver-badge">Postgres 15-Alpine</span>
                      </div>
                      <div className="db-size-val">{dbDiag.userDb?.totalSize || 'N/A'}</div>
                    </div>
                    <div className="db-table-list">
                      <div className="table-row header">
                        <span>Table Name</span>
                        <span>Row Count</span>
                        <span>Size on Disk</span>
                      </div>
                      {dbDiag.userDb?.tables.map(table => (
                        <div className="table-row" key={table.tableName}>
                          <span className="table-name font-mono">{table.tableName}</span>
                          <span className="table-rows font-mono">{table.rows}</span>
                          <span className="table-size font-mono">{table.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IOT DB */}
                  <div className="db-diag-card glass-panel">
                    <div className="db-card-header violet-border">
                      <div className="title-and-ver">
                        <Database size={20} className="violet" />
                        <h3>IoT Database</h3>
                        <span className="db-ver-badge">Postgres 15-Alpine</span>
                      </div>
                      <div className="db-size-val">{dbDiag.iotDb?.totalSize || 'N/A'}</div>
                    </div>
                    <div className="db-table-list">
                      <div className="table-row header">
                        <span>Table Name</span>
                        <span>Row Count</span>
                        <span>Size on Disk</span>
                      </div>
                      {dbDiag.iotDb?.tables.map(table => (
                        <div className="table-row" key={table.tableName}>
                          <span className="table-name font-mono">{table.tableName}</span>
                          <span className="table-rows font-mono">{table.rows}</span>
                          <span className="table-size font-mono">{table.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="tab-pane">
              <div className="panel-actions-bar">
                <h2 className="panel-heading">Security Audit Ledger</h2>
                <div className="search-input-wrapper">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search logs by action, email, IP..." 
                    value={auditQuery} 
                    onChange={(e) => setAuditQuery(e.target.value)} 
                  />
                </div>
              </div>

              {loading && auditLogs.length === 0 ? (
                <div className="panel-loader">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Loading ledger data...</span>
                </div>
              ) : (
                <div className="table-responsive glass-panel scrollable-ledger">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Log ID</th>
                        <th>User Email</th>
                        <th>Action Triggered</th>
                        <th>IP Address</th>
                        <th>Event Metadata</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAudits.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="no-records">No audit ledger logs found.</td>
                        </tr>
                      ) : (
                        filteredAudits.map(log => (
                          <tr key={log.id}>
                            <td className="font-mono text-small">{log.id}</td>
                            <td>
                              <strong>{log.user_email || 'System Daemon'}</strong>
                            </td>
                            <td>
                              <span className={`audit-action-tag ${log.action}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="font-mono text-small">{log.ip_address || '127.0.0.1'}</td>
                            <td className="font-mono text-small metadata-cell">
                              <pre className="raw-metadata">{JSON.stringify(log.metadata, null, 2)}</pre>
                            </td>
                            <td className="text-small">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create Admin/Operator User</h3>
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value.trim() }))}
                  required 
                  placeholder="name@nexus.io"
                />
              </div>

              <div className="form-group">
                <label>Account Password</label>
                <input 
                  type="password" 
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  required 
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>User Role Profile</label>
                <select 
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="OPERATOR">OPERATOR (Default)</option>
                  <option value="ADMIN">ADMINISTRATOR (Full Access)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn submit" disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit User Details</h3>
            
            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value.trim() }))}
                  required 
                  placeholder="name@nexus.io"
                />
              </div>

              <div className="form-group">
                <label>New Password (Optional)</label>
                <input 
                  type="password" 
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>User Role Profile</label>
                <select 
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  disabled={String(editingUser.id) === String(currentAdmin.id)}
                >
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMINISTRATOR (Full Access)</option>
                </select>
                {String(editingUser.id) === String(currentAdmin.id) && (
                  <span className="size-info" style={{ marginTop: '4px', display: 'block' }}>You cannot demote your own administrator role.</span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn submit" disabled={creatingUser}>
                  {creatingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
