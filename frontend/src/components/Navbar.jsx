import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Cpu, Layers, Activity, Radio, Sun, Moon, LogOut, Smartphone, BookOpen, Users, Edit2, X, User, Shield, Sliders, Terminal } from 'lucide-react';
import axios from 'axios';
import '../css/Navbar.css';

export default function Navbar({ theme, onToggleTheme, user, onUpdateUser, onLogout }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Profile Picture Upload States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePic || '');
  const [profilePicData, setProfilePicData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync preview when user changes (e.g. logging in as different user)
  useEffect(() => {
    setPreviewUrl(user?.profilePic || '');
    setProfilePicData('');
    setErrorMsg('');
    setSuccessMsg('');
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
    setIsOpen(false);
    navigate('/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        let sx = 0, sy = 0, sWidth = width, sHeight = height;
        if (width > height) {
          sx = (width - height) / 2;
          sWidth = height;
        } else {
          sy = (height - width) / 2;
          sHeight = width;
        }

        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, MAX_WIDTH, MAX_HEIGHT);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        const base64Length = compressedBase64.length;
        const sizeInKb = (base64Length * 3) / 4 / 1024;

        if (sizeInKb > 50) {
          setErrorMsg('Compressed file still exceeds 50 KB limit. Choose a simpler image.');
          return;
        }

        setPreviewUrl(compressedBase64);
        setProfilePicData(compressedBase64);
        setErrorMsg('');
      };
      img.onerror = () => {
        setErrorMsg('Failed to load image file.');
      };
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
      const response = await axios.put('/api/profile/pic', {
        profilePic: profilePicData
      });
      if (response.data && response.data.success) {
        setSuccessMsg('Profile picture updated successfully!');
        if (onUpdateUser) {
          onUpdateUser(response.data.user);
        }
        setTimeout(() => {
          setShowProfileModal(false);
          setSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to update profile pic:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="mobile-header">
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsOpen(!isOpen)} 
          aria-label="Toggle Menu"
        >
          <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
        </button>
        <div className="mobile-brand">
          <img src="/logo.png" alt="Logo" className="mobile-logo-image" />
          <span className="mobile-brand-name">Nexus IoT</span>
        </div>
      </div>

      {/* Overlay Backdrop for Mobile Drawer */}
      {isOpen && (
        <div className="navbar-overlay" onClick={() => setIsOpen(false)}></div>
      )}

      <aside className={`navbar-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="navbar-brand">
          <div className="brand-logo-container">
            <img src="/logo.png" alt="Logo" className="brand-logo-image" />
            <div className="brand-logo-glow"></div>
          </div>
          <div className="brand-text">
            <span className="brand-name">Nexus IoT</span>
            <span className="brand-tagline">AI Core Console</span>
          </div>
        </div>

        {user && (
          <div className="navbar-user-card glass-panel" onClick={() => setShowProfileModal(true)}>
            <div className="user-avatar-container">
              {user.profilePic ? (
                <img src={user.profilePic} alt="Avatar" className="user-avatar-image" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="avatar-edit-badge">
                <Edit2 size={10} />
              </div>
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        )}

        <nav className="navbar-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            end
          >
            <LayoutDashboard className="nav-icon" size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/ai-command"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Cpu className="nav-icon" size={20} />
            <span>AI Controller</span>
          </NavLink>

          <NavLink
            to="/devices"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Layers className="nav-icon" size={20} />
            <span>Devices Directory</span>
          </NavLink>

          <NavLink
            to="/nexus-customizer"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Smartphone className="nav-icon" size={20} />
            <span>Nexus Customizer</span>
          </NavLink>

          <NavLink
            to="/virtual-pins"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Sliders className="nav-icon" size={20} />
            <span>Virtual Pins</span>
          </NavLink>

          <NavLink
            to="/mqtt-monitor"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Terminal className="nav-icon" size={20} />
            <span>MQTT Live Monitor</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Activity className="nav-icon" size={20} />
            <span>Analytics AI</span>
          </NavLink>

          <NavLink
            to="/sensors"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Radio className="nav-icon" size={20} />
            <span>Air & Alerts</span>
          </NavLink>

          <NavLink
            to="/docs"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="nav-icon" size={20} />
            <span>Documentation</span>
          </NavLink>

          <NavLink
            to="/developers"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Users className="nav-icon" size={20} />
            <span>Project Team</span>
          </NavLink>

          {user && user.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <Shield className="nav-icon" size={20} />
              <span>Admin Control</span>
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="nav-item logout-btn"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              padding: '0.8rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              fontFamily: 'inherit'
            }}
          >
            <LogOut className="nav-icon" size={20} />
            <span>Log Out</span>
          </button>
        </nav>

        <div className="theme-switcher-container">
          <span className="theme-switcher-label">Theme</span>
          <label className="theme-switch">
            <input
              type="checkbox"
              className="theme-switch__checkbox"
              checked={theme === 'dark'}
              onChange={onToggleTheme}
            />
            <div className="theme-switch__container">
              <div className="theme-switch__circle-container">
                <div className="theme-switch__sun-moon-container">
                  <div className="theme-switch__moon">
                    <div className="theme-switch__spot"></div>
                    <div className="theme-switch__spot"></div>
                    <div className="theme-switch__spot"></div>
                  </div>
                </div>
              </div>
              <div className="theme-switch__clouds"></div>
              <div className="theme-switch__stars-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </label>
        </div>

        <div className="navbar-status-card glass-panel">
          <div className="status-header">
            <span className="status-dot"></span>
            <span className="status-title">SYSTEM MONITOR</span>
          </div>
          <p className="status-description">AI Core v3.5-Active is scanning 12 node channels in real-time.</p>
          <div className="status-bar-container">
            <div className="status-bar-fill animate-scanning"></div>
          </div>
        </div>
      </aside>

      {/* Profile Photo Modal Overlay */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>
              <X size={20} />
            </button>
            <h3 className="profile-modal-title">Update Profile Photo</h3>
            
            <div className="profile-preview-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="profile-preview-image" />
              ) : (
                <div className="profile-preview-placeholder">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            <div className="file-input-wrapper">
              <label htmlFor="avatar-file-upload" className="custom-file-upload">
                Select Profile Image
              </label>
              <input 
                id="avatar-file-upload" 
                type="file" 
                accept=".jpg,.jpeg,.png" 
                onChange={handleImageChange} 
                className="file-input-hidden"
              />
              <span className="size-info">Will be auto-compressed to square under 50 KB</span>
            </div>

            {errorMsg && <div className="profile-modal-error">{errorMsg}</div>}
            {successMsg && <div className="profile-modal-success">{successMsg}</div>}

            <button 
              className="profile-modal-btn save" 
              onClick={handleSaveProfilePic} 
              disabled={uploading || !profilePicData}
            >
              {uploading ? 'Uploading...' : 'Save Avatar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
