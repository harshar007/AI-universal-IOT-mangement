import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AiController from './pages/AiController.jsx';
import Devices from './pages/Devices.jsx';
import Analytics from './pages/Analytics.jsx';
import Login from './pages/Login.jsx';
import NexusCustomizer from './pages/NexusCustomizer.jsx';
import Docs from './pages/Docs.jsx';
import Developers from './pages/Developers.jsx';
import Sensors from './pages/Sensors.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import VirtualPinManager from './pages/VirtualPinManager.jsx';
import MqttMonitor from './pages/MqttMonitor.jsx';
import axios from 'axios';


export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved && saved !== 'light') {
      localStorage.setItem('theme', 'light');
      return 'light';
    }
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <AppContent
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </Router>
  );
}

const getDefaultDevices = (userId) => [
  {
    id: `user_${userId}_esp32-main-board`,
    name: 'ESP32 Main Gateway Board',
    category: 'ESP32 Board',
    location: 'Lab Bench 1',
    status: 'online',
    powerState: true,
    value: 24,
    unit: '°C',
    powerDraw: 1.2,
    battery: null,
    lastUpdated: 'Just now'
  },
  {
    id: `user_${userId}_esp8266-nodemcu-01`,
    name: 'ESP8266 NodeMCU Telemetry Node',
    category: 'ESP8266 Board',
    location: 'Field Cluster A',
    status: 'online',
    powerState: true,
    value: 48,
    unit: '%',
    powerDraw: 0.8,
    battery: 88,
    lastUpdated: 'Just now'
  },
  {
    id: `user_${userId}_esp32s3-sensor-node`,
    name: 'ESP32-S3 Dual-Core Sensor Station',
    category: 'ESP32-S3 Board',
    location: 'Environmental Rack',
    status: 'online',
    powerState: true,
    value: 21,
    unit: '°C',
    powerDraw: 1.5,
    battery: 95,
    lastUpdated: 'Just now'
  },
  {
    id: `user_${userId}_esp8266-relay-board`,
    name: 'ESP8266 4-Channel Relay Controller',
    category: 'ESP8266 Board',
    location: 'Control Box B',
    status: 'online',
    powerState: true,
    value: 80,
    unit: '%',
    powerDraw: 4.5,
    battery: null,
    lastUpdated: 'Just now'
  },
  {
    id: `user_${userId}_esp32-cam-module`,
    name: 'ESP32-CAM AI Vision Node',
    category: 'ESP32 Board',
    location: 'Perimeter Rig',
    status: 'online',
    powerState: true,
    value: 30,
    unit: 'FPS',
    powerDraw: 2.2,
    battery: null,
    lastUpdated: 'Just now'
  },
  {
    id: `user_${userId}_stm32-esp01-custom`,
    name: 'STM32 + ESP-01 Custom Board',
    category: 'Custom Board',
    location: 'Test Bench 2',
    status: 'online',
    powerState: false,
    value: 65,
    unit: '%',
    powerDraw: 0.9,
    battery: 72,
    lastUpdated: 'Just now'
  }
];

function AppContent({ theme, toggleTheme }) {
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(() => {
    return !!localStorage.getItem('authToken');
  });

  useEffect(() => {
    if (!isAppLoading) return;
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAppLoading]);

  // Loading animation between page transitions
  useEffect(() => {
    if (location.pathname === '/login') {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const token = localStorage.getItem('authToken');
  const isAuthenticated = !!token;
  const isLoginPage = location.pathname === '/login';

  // Get logged in user details
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  const userId = user ? user.id : 'default';

  // Dynamically set or clear Authorization header for all API requests
  useEffect(() => {
    const activeToken = localStorage.getItem('authToken');
    if (activeToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Handle 401 Unauthorized globally (e.g., stale JWT token after database container reset)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          console.warn('Session expired or invalid token. Logging out...');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Shared state of IoT devices scoped to user (loads from localStorage for user isolation)
  const [devices, setDevices] = useState(() => {
    const saved = localStorage.getItem(`nexus_devices_state_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved devices state:', e);
      }
    }
    return getDefaultDevices(userId);
  });

  // Sync devices state when user session shifts
  useEffect(() => {
    const saved = localStorage.getItem(`nexus_devices_state_${userId}`);
    if (saved) {
      try {
        setDevices(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved devices state:', e);
      }
    } else {
      setDevices(getDefaultDevices(userId));
    }
  }, [userId]);

  // Persist user-scoped devices state
  useEffect(() => {
    localStorage.setItem(`nexus_devices_state_${userId}`, JSON.stringify(devices));
  }, [devices, userId]);

  // State to store real-time console/code log outputs for the Dashboard terminal
  const [systemLogs, setSystemLogs] = useState(() => {
    const time = new Date().toLocaleTimeString();
    return [
      `[${time}] Nunnarri System Shell v1.0.0 initializing...`,
      `[${time}] Connecting to PostgreSQL local database... Connected.`,
      `[${time}] Embedded Aedes MQTT Broker listening on port 1883...`,
      `[${time}] IoT Gateway WebSocket Server ready.`
    ];
  });

  // Telemetry Simulation (fluctuate values slightly every few seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prevDevices =>
        prevDevices.map(device => {
          if (!device.powerState || device.status !== 'online') return device;

          let valueShift = 0;
          let powerShift = 0;

          if (device.id.endsWith('living-room-ac')) {
            valueShift = (Math.random() - 0.5) * 0.4;
            powerShift = (Math.random() - 0.5) * 20;
          } else if (device.id.endsWith('server-temp-sensor')) {
            valueShift = (Math.random() - 0.5) * 0.6;
            powerShift = (Math.random() - 0.5) * 2;
          } else if (device.id.endsWith('server-humidity-sensor')) {
            valueShift = (Math.random() - 0.5) * 1.5;
          } else if (device.id.endsWith('main-power-grid')) {
            valueShift = (Math.random() - 0.5) * 1;
            powerShift = (Math.random() - 0.5) * 150;
          } else if (device.id.endsWith('ventilation-fan-01')) {
            valueShift = (Math.random() - 0.5) * 2;
            powerShift = (Math.random() - 0.5) * 10;
          }

          const newValue = parseFloat((device.value + valueShift).toFixed(1));
          const newPower = Math.max(5, Math.round(device.powerDraw + powerShift));

          let newBattery = device.battery;
          if (device.battery !== null && Math.random() > 0.8) {
            newBattery = Math.max(1, device.battery - 1);
          }

          return {
            ...device,
            value: newValue,
            powerDraw: newPower,
            battery: newBattery,
            lastUpdated: 'Just now'
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Periodic AI Autonomous Engine Evaluation Loop
  useEffect(() => {
    if (!isAuthenticated) return;
    const aiInterval = setInterval(async () => {
      try {
        const res = await axios.post('/api/ai/automation/evaluate', { devices });
        if (res.data && res.data.executedDecisions && res.data.executedDecisions.length > 0) {
          const time = new Date().toLocaleTimeString();
          res.data.executedDecisions.forEach(dec => {
            setSystemLogs(prev => [...prev, `[${time}] [AI AGENT] ${dec.deviceName} -> ${dec.action}: ${dec.reason}`].slice(-50));
          });
        }
      } catch (err) {
        // AI evaluation fallback
      }
    }, 10000);

    return () => clearInterval(aiInterval);
  }, [devices, isAuthenticated]);

  // WebSocket Connection to the deployed IoT Gateway
  useEffect(() => {
    if (!isAuthenticated) return;

    const activeToken = localStorage.getItem('authToken');
    const wsAddress = window.location.protocol === 'https:' 
      ? `wss://${window.location.hostname}:5002?token=${activeToken}` 
      : `ws://${window.location.hostname}:5002?token=${activeToken}`;
    console.log('Connecting to IoT Gateway WebSocket:', wsAddress);
    
    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      ws = new WebSocket(wsAddress);

      ws.onopen = () => {
        console.log('Successfully connected to IoT Gateway WebSocket.');
        const time = new Date().toLocaleTimeString();
        setSystemLogs(prev => [...prev, `[${time}] Successfully connected to IoT Gateway WebSocket.`].slice(-50));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket event from Gateway:', data);
          const time = new Date().toLocaleTimeString();

          if (data.event === 'telemetry') {
            const { deviceId, streamKey, value } = data;
            setSystemLogs(prev => [...prev, `[${time}] [TELEMETRY] topic: iot/device/${deviceId}/telemetry | payload: { "streamKey": "${streamKey}", "value": ${value} }`].slice(-100));
            setDevices(prev =>
              prev.map(d => {
                if (d.id === deviceId) {
                  if (streamKey === 'value' || streamKey === 'temp' || streamKey === 'humidity') {
                    return { ...d, value: parseFloat(value), lastUpdated: 'Just now' };
                  }
                  if (streamKey === 'powerState') {
                    const state = value === 1 || value === 'true' || value === true;
                    return { ...d, powerState: state, lastUpdated: 'Just now' };
                  }
                }
                return d;
              })
            );
          }

          if (data.event === 'status') {
            const { deviceId, status } = data;
            setSystemLogs(prev => [...prev, `[${time}] [STATUS] topic: iot/device/${deviceId}/status | payload: { "status": "${status}" }`].slice(-100));
            setDevices(prev =>
              prev.map(d => d.id === deviceId ? { ...d, status, lastUpdated: 'Just now' } : d)
            );
          }

          if (data.event === 'command' || data.event === 'command_dispatched') {
            const { deviceId, action, value } = data;
            setSystemLogs(prev => [...prev, `[${time}] [COMMAND] topic: iot/device/${deviceId}/command | payload: { "action": "${action}", "value": ${value} }`].slice(-100));
            if (action === 'toggle' || action === 'switch' || action === 'command') {
              const state = value === 1 || value === 'true' || value === true;
              setDevices(prev =>
                prev.map(d => d.id === deviceId ? { ...d, powerState: state, lastUpdated: 'Just now' } : d)
              );
            }
          }

          if (data.event === 'log') {
            const { deviceId, message, level } = data;
            setSystemLogs(prev => [...prev, `[${time}] [LOGS] topic: iot/device/${deviceId}/logs | payload: { "level": "${level}", "message": "${message}" }`].slice(-100));
          }

          if (data.event === 'heartbeat') {
            const { deviceId } = data;
            setSystemLogs(prev => [...prev, `[${time}] [HEARTBEAT] topic: iot/device/${deviceId}/heartbeat | payload: { "status": "ping" }`].slice(-100));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('IoT Gateway WebSocket error:', err);
        const time = new Date().toLocaleTimeString();
        setSystemLogs(prev => [...prev, `[${time}] IoT Gateway WebSocket error.`].slice(-50));
      };

      ws.onclose = () => {
        console.log('IoT Gateway WebSocket connection closed. Reconnecting in 5s...');
        const time = new Date().toLocaleTimeString();
        setSystemLogs(prev => [...prev, `[${time}] WebSocket connection closed. Reconnecting...`].slice(-50));
        reconnectTimeout = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAuthenticated, userId]);

  // Fetch registered devices from gateway and sync / auto-register if missing
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncDevices = async () => {
      try {
        const response = await axios.get(`/api/devices?userId=${userId}`);
        const gatewayDevices = response.data;
        console.log('Fetched devices from IoT gateway for user:', userId, gatewayDevices);

        setDevices(prevDevices => {
          // 1. Sync status and secretKey of existing local devices
          const syncedLocal = prevDevices.map(localDev => {
            const gatewayDev = gatewayDevices.find(g => g.id === localDev.id);
            if (gatewayDev) {
              return { ...localDev, status: gatewayDev.status, secretKey: gatewayDev.secretKey };
            } else {
              console.log('Auto-registering device with gateway:', localDev.id);
              axios.post('/api/devices/register', {
                deviceId: localDev.id,
                name: localDev.name,
                userId: userId
              }).then(res => {
                if (res.data && res.data.secretKey) {
                  setDevices(prev => 
                    prev.map(d => d.id === localDev.id ? { ...d, secretKey: res.data.secretKey } : d)
                  );
                }
              }).catch(err => console.error('Failed to auto-register device:', localDev.id, err.message));
              
              return { ...localDev, status: 'offline' };
            }
          });

          // 2. Append remote devices not present in local devices list
          const remoteOnly = gatewayDevices.filter(g => !prevDevices.some(local => local.id === g.id));
          
          if (remoteOnly.length > 0) {
            console.log('Syncing remote-only devices from gateway for user:', userId, remoteOnly);
            
            const mappedRemote = remoteOnly.map(g => {
              let category = 'Smart Home';
              if (g.id.startsWith('industrial-')) {
                category = 'Industrial';
              } else if (g.id.startsWith('server-room-')) {
                category = 'Server Room';
              }
              return {
                id: g.id,
                name: g.name || 'IoT Node',
                category: category,
                location: 'Nunnarri Core',
                status: g.status || 'offline',
                powerState: false,
                value: 0,
                unit: 'units',
                powerDraw: 0,
                battery: null,
                secretKey: g.secretKey,
                lastUpdated: 'Just now'
              };
            });
            return [...syncedLocal, ...mappedRemote];
          }

          return syncedLocal;
        });
      } catch (err) {
        console.error('Failed to sync devices with gateway:', err.message);
      }
    };

    syncDevices();
  }, [userId, isAuthenticated]);

  // Shared Action Handlers
  const handleToggleDevice = async (id, forceState = null) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;
    const targetState = forceState !== null ? forceState : !device.powerState;

    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        return {
          ...d,
          powerState: targetState,
          value: targetState ? d.value : 0,
          powerDraw: targetState ? d.powerDraw : 0
        };
      })
    );

    try {
      await axios.post(`/api/devices/${id}/command`, {
        action: 'toggle',
        value: targetState ? 1 : 0
      });
    } catch (err) {
      console.error(`Failed to dispatch toggle command to gateway for device ${id}:`, err.message);
    }
  };

  const handleChangeDeviceValue = async (id, newValue) => {
    setDevices(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        return {
          ...d,
          value: newValue,
          powerDraw: d.id.endsWith('living-room-ac')
            ? Math.round((30 - newValue) * 100)
            : d.id.endsWith('backyard-lighting')
              ? Math.round(newValue * 1.2)
              : d.powerDraw
        };
      })
    );

    try {
      await axios.post(`/api/devices/${id}/command`, {
        action: 'value',
        value: newValue
      });
    } catch (err) {
      console.error(`Failed to dispatch value command to gateway for device ${id}:`, err.message);
    }
  };

  const handleAddDevice = async (newDevice) => {
    try {
      const response = await axios.post('/api/devices/register', {
        deviceId: newDevice.id,
        name: newDevice.name,
        userId: userId
      });
      const registeredDev = { ...newDevice, secretKey: response.data.secretKey };
      setDevices(prev => [...prev, registeredDev]);
      return response.data;
    } catch (err) {
      console.error(`Failed to register device ${newDevice.id} with gateway:`, err.message);
      throw err;
    }
  };

  const handleRegenerateToken = async (id) => {
    try {
      const response = await axios.post(`/api/devices/${id}/regenerate-token`);
      setDevices(prev =>
        prev.map(d => d.id === id ? { ...d, secretKey: response.data.secretKey } : d)
      );
      return response.data;
    } catch (err) {
      console.error(`Failed to regenerate token for device ${id}:`, err.message);
      throw err;
    }
  };

  const handleDeleteDevice = (id) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const handleRenameDevice = (id, newName) => {
    setDevices(prev =>
      prev.map(d => d.id === id ? { ...d, name: newName } : d)
    );
  };

  // Synchronous route protection redirect (prevents flashing)
  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {!isLoginPage && (
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onUpdateUser={(u) => {
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
          }}
          onLogout={() => setUser(null)}
        />
      )}
      <main
        className="main-content"
        style={isLoginPage ? { marginLeft: 0, width: '100%' } : undefined}
      >
        {pageLoading || isAppLoading ? (
          <div className="page-loader-container">
            <div className="md-spinner" />
            <div className="loading-text">Loading…</div>
          </div>
        ) : (
          <Routes>
          <Route
            path="/login"
            element={<Login onLoginSuccess={(u) => setUser(u)} />}
          />
          <Route
            path="/"
            element={
              <Dashboard
                devices={devices}
                systemLogs={systemLogs}
                onToggleDevice={handleToggleDevice}
                onChangeDeviceValue={handleChangeDeviceValue}
              />
            }
          />
          <Route
            path="/ai-command"
            element={
              <AiController
                devices={devices}
                onToggleDevice={handleToggleDevice}
                onChangeDeviceValue={handleChangeDeviceValue}
              />
            }
          />
          <Route
            path="/devices"
            element={
              <Devices
                devices={devices}
                onToggleDevice={handleToggleDevice}
                onAddDevice={handleAddDevice}
                onDeleteDevice={handleDeleteDevice}
                onRegenerateToken={handleRegenerateToken}
              />
            }
          />
          <Route
            path="/analytics"
            element={<Analytics devices={devices} />}
          />
          <Route
            path="/sensors"
            element={<Sensors />}
          />
          <Route
            path="/nexus-customizer"
            element={
              <NexusCustomizer
                devices={devices}
                onToggleDevice={handleToggleDevice}
                onChangeDeviceValue={handleChangeDeviceValue}
                onRenameDevice={handleRenameDevice}
              />
            }
          />
          <Route
            path="/docs"
            element={<Docs />}
          />
          <Route
            path="/developers"
            element={<Developers />}
          />
          <Route
            path="/admin"
            element={
              user && user.role === 'ADMIN' ? (
                <AdminPanel />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/virtual-pins"
            element={
              <VirtualPinManager
                devices={devices}
                onToggleDevice={handleToggleDevice}
                onChangeDeviceValue={handleChangeDeviceValue}
              />
            }
          />
          <Route
            path="/mqtt-monitor"
            element={
              <MqttMonitor
                systemLogs={systemLogs}
                setSystemLogs={setSystemLogs}
                devices={devices}
                onToggleDevice={handleToggleDevice}
                onChangeDeviceValue={handleChangeDeviceValue}
              />
            }
          />
          {/* Wildcard fallback to prevent blank screens for invalid routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
        )}
      </main>
    </>
  );
}
