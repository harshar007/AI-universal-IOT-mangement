import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Layers, Activity, Radio,
  BookOpen, Users, Sliders, Terminal, Shield,
  LogOut, Sun, Moon, X, Menu, Sparkles
} from 'lucide-react';
import axios from 'axios';
import '../css/Navbar.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/devices', label: 'Devices', icon: Layers },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/ai-command', label: 'AI Controller', icon: Cpu },
      { to: '/mcp', label: 'MCP AI Hub', icon: Sparkles },
      { to: '/virtual-pins', label: 'Virtual Pins', icon: Sliders },
      { to: '/mqtt-monitor', label: 'MQTT Monitor', icon: Terminal },
      { to: '/analytics', label: 'Analytics', icon: Activity },
      { to: '/sensors', label: 'Sensors & Alerts', icon: Radio },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/nexus-customizer', label: 'Customizer', icon: Sliders },
      { to: '/docs', label: 'Documentation', icon: BookOpen },
      { to: '/developers', label: 'Project Team', icon: Users },
    ],
  },
];

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/devices': 'Devices',
  '/ai-command': 'AI Controller',
  '/mcp': 'MCP AI Hub',
  '/virtual-pins': 'Virtual Pins',
  '/mqtt-monitor': 'MQTT Monitor',
  '/analytics': 'Analytics',
  '/sensors': 'Sensors & Alerts',
  '/nexus-customizer': 'Customizer',
  '/docs': 'Documentation',
  '/developers': 'Project Team',
  '/admin': 'Admin Control',
};

export default function Navbar({ theme, onToggleTheme, user, onUpdateUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePic || '');
  const [profilePicData, setProfilePicData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(user?.profilePic || '');
    setProfilePicData('');
    setErrorMsg('');
    setSuccessMsg('');
  }, [user]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 150;
        let w = img.width, h = img.height;
        let sx = 0, sy = 0, sw = w, sh = h;
        if (w > h) { sx = (w - h) / 2; sw = h; }
        else { sy = (h - w) / 2; sh = w; }
        canvas.width = MAX; canvas.height = MAX;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, MAX, MAX);
        const b64 = canvas.toDataURL('image/jpeg', 0.7);
        const kb = (b64.length * 3) / 4 / 1024;
        if (kb > 50) {
          setErrorMsg('Image still exceeds 50 KB. Choose a simpler image.');
          return;
        }
        setPreviewUrl(b64);
        setProfilePicData(b64);
        setErrorMsg('');
      };
      img.onerror = () => setErrorMsg('Failed to load image file.');
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfilePic = async () => {
    if (!profilePicData) return;
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await axios.put('/api/profile/pic', { profilePic: profilePicData });
      if (response.data?.success) {
        setSuccessMsg('Profile picture updated.');
        if (onUpdateUser) onUpdateUser(response.data.user);
        setTimeout(() => setShowProfileModal(false), 1200);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const currentTitle = PAGE_TITLES[location.pathname] || 'Nunnarri';

  return (
    <>
      {/* Mobile top bar */}
      <header className="app-topbar">
        <button
          className="menu-btn"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <div className="topbar-brand-wrap">
          <img src="/logo.png" alt="Nunnarri Logo" className="topbar-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="topbar-title">{currentTitle}</div>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-actions">
          <button
            className="menu-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          className="app-nav-overlay open"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`app-nav-rail ${isOpen ? 'open' : ''}`} aria-label="Primary">
        <div className="app-nav-brand">
          <img
            src="/logo.png"
            alt="Nunnarri Logo"
            className="brand-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="brand-mark" style={{ display: 'none' }}>N</div>
          <div className="brand-text">
            <span className="brand-name">நுண்ணறி</span>
            <span className="brand-tag">Nunnarri IoT</span>
          </div>
        </div>

        <nav className="app-nav-section" role="navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="app-nav-section-label">{group.label}</div>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {user?.role === 'ADMIN' && (
            <div>
              <div className="app-nav-section-label">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) => `app-nav-item ${isActive ? 'active' : ''}`}
              >
                <Shield className="nav-icon" size={20} />
                <span>Admin Control</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="app-nav-footer">
          {user && (
            <div
              className="app-nav-user"
              onClick={() => setShowProfileModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="avatar">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} />
                ) : (
                  initial
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || 'Operator'}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}

          <button
            className="app-nav-item"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="nav-icon" size={20} />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon className="nav-icon" size={20} />
                <span>Dark mode</span>
              </>
            )}
          </button>

          <button
            className="app-nav-item"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="nav-icon" size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Profile dialog */}
      {showProfileModal && (
        <div className="md-dialog-backdrop" onClick={() => setShowProfileModal(false)}>
          <div
            className="md-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative' }}
          >
            <button
              className="md-dialog-close btn btn-icon"
              onClick={() => setShowProfileModal(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="md-dialog-header">
              <h2 className="md-dialog-title">Profile picture</h2>
            </div>
            <div className="md-dialog-content">
              <div className="profile-dialog-content">
                <div className="profile-avatar-preview">
                  {previewUrl ? <img src={previewUrl} alt="Preview" /> : initial}
                </div>
                <div className="profile-file-input">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <button
                    className="btn btn-outlined btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Choose image
                  </button>
                  <span>Auto-compressed to &lt; 50 KB</span>
                </div>
                {errorMsg && <div className="profile-feedback error">{errorMsg}</div>}
                {successMsg && <div className="profile-feedback success">{successMsg}</div>}
              </div>
            </div>
            <div className="md-dialog-actions">
              <button
                className="btn btn-text"
                onClick={() => setShowProfileModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-filled"
                onClick={handleSaveProfilePic}
                disabled={uploading || !profilePicData}
                type="button"
              >
                {uploading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
