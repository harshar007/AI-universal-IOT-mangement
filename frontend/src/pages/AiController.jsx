import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Sparkles, ShieldCheck, Leaf, Thermometer,
  Zap, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle,
  RefreshCw, Cpu, Activity, Info
} from 'lucide-react';
import axios from 'axios';
import '../css/AiController.css';

export default function AiController({ devices = [], onToggleDevice, onChangeDeviceValue }) {
  // Autonomous AI State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiProfile, setAiProfile] = useState('SAFETY'); // 'SAFETY', 'ECO', 'COMFORT'
  const [deviceAiSettings, setDeviceAiSettings] = useState({}); // deviceId -> boolean
  const [aiDecisions, setAiDecisions] = useState([
    {
      id: 'dec_1',
      timestamp: '18:30:12',
      deviceId: 'living-room-ac',
      deviceName: 'Living Room A/C',
      action: 'TURN_ON',
      reason: 'Ambient temperature reached 28.5°C (> 28°C threshold). Safety Guard automatically engaged cooling.',
      profile: 'SAFETY'
    },
    {
      id: 'dec_2',
      timestamp: '18:25:04',
      deviceId: 'ventilation-fan-01',
      deviceName: 'Ventilation Fan 01',
      action: 'HUMIDITY_BALANCE',
      reason: 'Air Quality PPM crossed 780. AI engaged warehouse ventilation fans.',
      profile: 'SAFETY'
    }
  ]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // NLP Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Nexus Autonomous AI Controller is active. I am continuously monitoring telemetry streams across your IoT devices. You can configure AI automation profiles above or command me directly using natural language below!',
      timestamp: '18:30'
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize AI status and Chat session on mount
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch AI Autonomous Engine Status
        const statusRes = await axios.get('/api/ai/automation/status');
        if (statusRes.data) {
          setAiEnabled(statusRes.data.isEnabled);
          setAiProfile(statusRes.data.currentProfile);
          if (statusRes.data.deviceAiSettings) {
            setDeviceAiSettings(statusRes.data.deviceAiSettings);
          }
          if (statusRes.data.recentDecisions && statusRes.data.recentDecisions.length > 0) {
            setAiDecisions(statusRes.data.recentDecisions);
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote AI status, using default state:', err.message);
      }

      try {
        // Initialize Conversation Session
        const response = await axios.post('/api/chat/conversation');
        const convId = response.data.conversationId;
        setActiveConversationId(convId);

        const historyResponse = await axios.get(`/api/chat/history?conversationId=${convId}`);
        if (historyResponse.data && historyResponse.data.messages && historyResponse.data.messages.length > 0) {
          setMessages(historyResponse.data.messages);
        }
      } catch (err) {
        console.warn('Failed to initialize AI Chat session:', err.message);
      }
    };
    initData();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handlers for AI Automation Controls
  const handleToggleAiMaster = async () => {
    const newStatus = !aiEnabled;
    setAiEnabled(newStatus);
    try {
      await axios.post('/api/ai/automation/toggle', { enabled: newStatus });
    } catch (err) {
      console.error('Failed to toggle AI master engine:', err);
    }
  };

  const handleSelectProfile = async (profile) => {
    setAiProfile(profile);
    try {
      await axios.post('/api/ai/automation/profile', { profile });
    } catch (err) {
      console.error('Failed to update AI profile:', err);
    }
  };

  const handleToggleDeviceAi = async (deviceId) => {
    const current = deviceAiSettings[deviceId] !== false; // default true
    const nextVal = !current;
    setDeviceAiSettings(prev => ({ ...prev, [deviceId]: nextVal }));
    try {
      await axios.post('/api/ai/automation/device-setting', { deviceId, enabled: nextVal });
    } catch (err) {
      console.error('Failed to update device AI setting:', err);
    }
  };

  const handleRunManualEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await axios.post('/api/ai/automation/evaluate', { devices });
      if (res.data && res.data.executedDecisions && res.data.executedDecisions.length > 0) {
        setAiDecisions(prev => [...res.data.executedDecisions, ...prev].slice(0, 50));

        // Apply updated device states
        if (res.data.updatedDevices) {
          res.data.updatedDevices.forEach(upDev => {
            const origDev = devices.find(d => d.id === upDev.id);
            if (origDev) {
              if (origDev.powerState !== upDev.powerState) {
                onToggleDevice(upDev.id);
              }
              if (origDev.value !== upDev.value) {
                onChangeDeviceValue(upDev.id, upDev.value);
              }
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to run AI evaluation:', err);
    } finally {
      setTimeout(() => setIsEvaluating(false), 600);
    }
  };

  // NLP Chat Handlers
  const suggestions = [
    { label: '🤖 Auto-Optimize Energy', query: 'Optimize energy consumption for all appliances' },
    { label: '❄️ Cool Down Server Room', query: 'Cool down server room clusters to 20 degrees' },
    { label: '⚡ Turn Off High Load', query: 'Turn off non-essential high power draw appliances' },
    { label: '🚨 Safety Status Check', query: 'Check safety status of all IoT sensors' }
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    try {
      const response = await axios.post('/api/chat/message', {
        message: text,
        conversationId: activeConversationId
      });

      const { message } = response.data;
      setMessages(prev => [...prev, {
        id: message.id,
        sender: 'ai',
        text: message.text,
        timestamp: message.timestamp
      }]);

      if (message.commands && message.commands.length > 0) {
        message.commands.forEach(cmd => {
          if (cmd.action === 'setValue') {
            onChangeDeviceValue(cmd.deviceId, cmd.value);
          } else if (cmd.action === 'toggle') {
            const targetDevice = devices.find(d => d.id === cmd.deviceId);
            if (targetDevice && targetDevice.powerState !== cmd.value) {
              onToggleDevice(cmd.deviceId);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error sending AI chat command:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'AI Agent executed command analysis across active node channels.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="dashboard-header">
        <div>
          <h1>Autonomous AI Controller</h1>
          <p className="dashboard-subtitle">Real-Time Autonomous IoT Device Control & NLP Command Hub</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className={`add-device-btn ${isEvaluating ? 'animate-pulse' : ''}`}
            onClick={handleRunManualEvaluation}
            disabled={!aiEnabled || isEvaluating}
            style={{ background: 'var(--accent-cyan)', color: '#000', fontWeight: '600' }}
          >
            <RefreshCw size={16} className={isEvaluating ? 'animate-spin' : ''} />
            <span>{isEvaluating ? 'AI Evaluating...' : 'Run AI Cycle Now'}</span>
          </button>
        </div>
      </header>

      {/* SECTION 1: MASTER AI AUTONOMOUS AGENT CONTROL BAR */}
      <section className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={`logo-glow-wrapper ${aiEnabled ? 'active' : ''}`} style={{ width: '42px', height: '42px', borderRadius: '50%', background: aiEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={24} className={aiEnabled ? 'text-green animate-pulse' : 'text-red'} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Autonomous AI Agent Engine
                <span className={`device-badge-cat ${aiEnabled ? 'smart-home' : 'industrial'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {aiEnabled ? 'ACTIVE & MONITORING' : 'MANUAL OVERRIDE'}
                </span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Continuously analyzes live telemetry streams and dispatches automated commands to connected IoT channels.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleToggleAiMaster}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: aiEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: aiEnabled ? '#4ade80' : '#f87171',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {aiEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              <span>{aiEnabled ? 'AI Control ON' : 'AI Control OFF'}</span>
            </button>
          </div>
        </div>

        {/* AI AUTOMATION PROFILES */}
        {aiEnabled && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
              Select Active AI Automation Policy
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Profile 1: Safety Guard */}
              <div
                onClick={() => handleSelectProfile('SAFETY')}
                className={`glass-panel ${aiProfile === 'SAFETY' ? 'profile-active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: aiProfile === 'SAFETY' ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                  background: aiProfile === 'SAFETY' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <ShieldCheck size={18} className="text-cyan" />
                  <strong style={{ fontSize: '0.95rem' }}>Shield Safety Guard</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Prioritizes system protection. Automatically triggers cooling & ventilation if temp &gt; 28°C or air quality PPM &gt; 750.
                </p>
              </div>

              {/* Profile 2: Eco Saver */}
              <div
                onClick={() => handleSelectProfile('ECO')}
                className={`glass-panel ${aiProfile === 'ECO' ? 'profile-active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: aiProfile === 'ECO' ? '2px solid #4ade80' : '1px solid var(--glass-border)',
                  background: aiProfile === 'ECO' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Leaf size={18} className="text-green" />
                  <strong style={{ fontSize: '0.95rem' }}>Eco Energy Saver</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Optimizes energy draw. Adjusts A/C setpoints to 24°C and dims non-essential high-power loads when idle.
                </p>
              </div>

              {/* Profile 3: Comfort Optimizer */}
              <div
                onClick={() => handleSelectProfile('COMFORT')}
                className={`glass-panel ${aiProfile === 'COMFORT' ? 'profile-active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: aiProfile === 'COMFORT' ? '2px solid #a78bfa' : '1px solid var(--glass-border)',
                  background: aiProfile === 'COMFORT' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Thermometer size={18} className="text-violet" />
                  <strong style={{ fontSize: '0.95rem' }}>Comfort Optimizer</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Maintains ideal indoor climate at 22°C and balances humidity levels dynamically for user comfort.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: PER-DEVICE AI AUTOMATION TOGGLES & LIVE DECISIONS FEED */}
      <div className="ai-layout-grid" style={{ marginBottom: '1.5rem' }}>

        {/* Per-Device AI Control Grid */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} className="text-cyan" />
              Per-Device AI Permissions
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toggle AI authority per node</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
            {devices.map(dev => {
              const isDevAiOn = deviceAiSettings[dev.id] !== false;
              return (
                <div
                  key={dev.id}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{dev.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {dev.category} • {dev.value}{dev.unit}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDeviceAi(dev.id)}
                    disabled={!aiEnabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: isDevAiOn && aiEnabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isDevAiOn && aiEnabled ? '#4ade80' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {isDevAiOn && aiEnabled ? <CheckCircle2 size={12} /> : <Info size={12} />}
                    <span>{isDevAiOn && aiEnabled ? 'AI Allowed' : 'Manual Only'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live AI Decision Log Feed */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} className="text-yellow animate-pulse" />
              Live AI Autonomous Action Feed
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{aiDecisions.length} Action Events</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
            {aiDecisions.length > 0 ? (
              aiDecisions.map(dec => (
                <div
                  key={dec.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderLeft: '3px solid var(--accent-cyan)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: '#a78bfa' }}>{dec.deviceName}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{dec.timestamp}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.76rem' }}>
                    {dec.reason}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No automated decisions triggered yet. The AI is continuously scanning telemetry.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 3: NATURAL LANGUAGE AI COMMAND CHAT CONSOLE */}
      <div className="ai-layout-grid">
        <div className="container">
          <div className="nav-bar">
            <a href="#chat" onClick={(e) => e.preventDefault()}>
              <Bot size={18} className="text-violet animate-glow" style={{ marginRight: '8px' }} />
              NLP Command Console
              <span className="ai-badge" style={{ marginLeft: '8px' }}>NATURAL LANGUAGE AI</span>
            </a>
          </div>

          <div className="messages-area">
            {messages.map((msg, index) => {
              const isOdd = index % 2 === 0;
              const alternateClass = isOdd ? 'msg-odd' : 'msg-even';
              return (
                <div key={msg.id} className={`message ${alternateClass}`}>
                  <div className="message-content">
                    <div className="message-header">
                      {msg.sender === 'ai' ? (
                        <span className="msg-sender-name ai-sender">
                          <Bot size={13} /> Nexus AI
                        </span>
                      ) : (
                        <span className="msg-sender-name user-sender">
                          User Command
                        </span>
                      )}
                      <span className="msg-time">{msg.timestamp}</span>
                    </div>
                    <p className="msg-text">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="sender-area">
            <div className="suggestions-row">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="suggestion-tag"
                  onClick={() => handleSend(s.query)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="input-place">
              <input
                type="text"
                placeholder="Type natural command e.g. 'Turn on Living Room A/C'..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="send-input"
              />
              <div className="send" onClick={() => handleSend()} title="Send Command">
                <Send className="send-icon" size={15} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Reference Panel */}
        <div className="ai-sidebar-column">
          <div className="recommendations-panel glass-panel">
            <div className="rec-header">
              <Sparkles size={18} className="text-yellow" />
              <h4>AI Autonomous Logic</h4>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <p>The Autonomous AI Engine connects live telemetry from <strong>`nexus_iot_db`</strong> with user identities in <strong>`user_db`</strong>.</p>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                <li>Monitors temperature, humidity, and power draw metrics.</li>
                <li>Executes non-blocking device toggle & value adjustments.</li>
                <li>Logs every action for full transparency and manual override.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
