import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Sparkles, ShieldCheck, Leaf, Thermometer,
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle,
  RefreshCw, Cpu, Activity, Info, WifiOff
} from 'lucide-react';
import axios from 'axios';
import '../css/AiController.css';

export default function AiController({ devices = [], onToggleDevice, onChangeDeviceValue }) {
  // AI state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiProfile, setAiProfile] = useState('SAFETY');
  const [deviceAiSettings, setDeviceAiSettings] = useState({});
  const [aiDecisions, setAiDecisions] = useState([
    {
      id: 'dec_1', timestamp: '18:30:12',
      deviceId: 'esp32-main-board', deviceName: 'ESP32 Main Gateway Board',
      action: 'TURN_ON',
      reason: 'Core temperature reached 28.5°C (> 28°C threshold). Safety Guard engaged node relay.',
      profile: 'SAFETY'
    },
    {
      id: 'dec_2', timestamp: '18:25:04',
      deviceId: 'esp8266-relay-board', deviceName: 'ESP8266 4-Channel Relay Controller',
      action: 'VOLTAGE_BALANCE',
      reason: 'Bus voltage fluctuation detected. AI synchronized relay channel loads.',
      profile: 'SAFETY'
    }
  ]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiOnline, setAiOnline] = useState(true);
  // The rules engine is always available — it just won't have LLM-quality
  // open-ended answers when Ollama is offline. The chat input is never blocked.
  const rulesEngineOnline = true;

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1, sender: 'ai',
      text: 'Nunnarri Autonomous AI Controller is active. I am continuously monitoring telemetry streams across your IoT devices. You can configure AI automation profiles above or command me directly using natural language below!',
      timestamp: '18:30'
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const statusRes = await axios.get('/api/ai/automation/status');
        if (statusRes.data) {
          setAiEnabled(statusRes.data.isEnabled);
          setAiProfile(statusRes.data.currentProfile);
          if (statusRes.data.deviceAiSettings) {
            setDeviceAiSettings(statusRes.data.deviceAiSettings);
          }
          if (statusRes.data.recentDecisions?.length > 0) {
            setAiDecisions(statusRes.data.recentDecisions);
          }
          if (typeof statusRes.data.aiOnline === 'boolean') {
            setAiOnline(statusRes.data.aiOnline);
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote AI status, using default state:', err.message);
      }

      try {
        const response = await axios.post('/api/chat/conversation');
        setActiveConversationId(response.data.conversationId);
        const historyResponse = await axios.get(`/api/chat/history?conversationId=${response.data.conversationId}`);
        if (historyResponse.data?.messages?.length > 0) {
          setMessages(historyResponse.data.messages);
        }
      } catch (err) {
        console.warn('Failed to initialize AI Chat session:', err.message);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleAiMaster = async () => {
    const newStatus = !aiEnabled;
    setAiEnabled(newStatus);
    try {
      await axios.post('/api/ai/automation/toggle', { enabled: newStatus });
    } catch (err) { console.error('Failed to toggle AI master engine:', err); }
  };

  const handleSelectProfile = async (profile) => {
    setAiProfile(profile);
    try {
      await axios.post('/api/ai/automation/profile', { profile });
    } catch (err) { console.error('Failed to update AI profile:', err); }
  };

  const handleToggleDeviceAi = async (deviceId) => {
    const current = deviceAiSettings[deviceId] !== false;
    const nextVal = !current;
    setDeviceAiSettings((prev) => ({ ...prev, [deviceId]: nextVal }));
    try {
      await axios.post('/api/ai/automation/device-setting', { deviceId, enabled: nextVal });
    } catch (err) { console.error('Failed to update device AI setting:', err); }
  };

  const handleRunManualEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await axios.post('/api/ai/automation/evaluate', { devices });
      if (res.data?.executedDecisions?.length > 0) {
        setAiDecisions((prev) => [...res.data.executedDecisions, ...prev].slice(0, 50));
        if (res.data.updatedDevices) {
          res.data.updatedDevices.forEach((upDev) => {
            const origDev = devices.find((d) => d.id === upDev.id);
            if (origDev) {
              if (origDev.powerState !== upDev.powerState) onToggleDevice(upDev.id);
              if (origDev.value !== upDev.value) onChangeDeviceValue(upDev.id, upDev.value);
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

  const suggestions = [
    { label: '⚡ Control ESP32', query: 'Turn off ESP32 main board' },
    { label: '🔌 Toggle Relay',  query: 'Turn on ESP8266 relay board' },
    { label: '📡 Sensor Node',   query: 'Turn off ESP32-S3 sensor station' },
    { label: '🚨 Board Safety',  query: 'Check safety status of all ESP32 and ESP8266 nodes' }
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Offline fallback response — backend's rules engine will still respond
    // helpfully. We don't block the user from sending messages.
    try {
      const response = await axios.post('/api/chat/message', {
        message: text,
        conversationId: activeConversationId
      });
      const { message } = response.data;
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          sender: 'ai',
          text: message.text,
          timestamp: message.timestamp
        }
      ]);
      if (message.commands?.length > 0) {
        message.commands.forEach((cmd) => {
          const targetDevice = devices.find((d) => d.id === cmd.deviceId || d.id.endsWith(cmd.deviceId));
          if (!targetDevice) return;
          if (cmd.action === 'setValue') onChangeDeviceValue(targetDevice.id, cmd.value);
          else if (cmd.action === 'toggle' && targetDevice.powerState !== cmd.value) onToggleDevice(targetDevice.id);
        });
      }
    } catch (error) {
      console.error('Error sending AI chat command:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I couldn't reach the AI backend. Check that the ai-backend service is running, then try again. You can still control devices manually from the Devices page.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>AI Controller</h1>
          <p>Autonomous IoT control and natural-language commands</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-filled"
            onClick={handleRunManualEvaluation}
            disabled={!aiEnabled || isEvaluating}
          >
            <RefreshCw size={16} className={isEvaluating ? 'spin' : ''} />
            {isEvaluating ? 'Evaluating…' : 'Run AI cycle now'}
          </button>
        </div>
      </div>

      {/* Online / offline status banner — informational only; rules engine
          always responds, so the chat is never blocked. */}
      {aiOnline ? (
        <div className="ai-status-banner online">
          <CheckCircle2 size={18} />
          <div className="status-text">
            <strong>AI Core is online.</strong> Local Ollama service <code>llama3.2</code> is responding to natural-language queries.
          </div>
        </div>
      ) : (
        <div className="ai-status-banner offline">
          <WifiOff size={18} />
          <div className="status-text">
            <strong>Local LLM (Ollama) is offline.</strong> The rules engine still answers every question — start{' '}
            <code>ollama serve</code> and <code>ollama pull llama3.2</code> to upgrade open-ended answers with the local LLM.
          </div>
          <button
            className="btn btn-outlined btn-sm"
            onClick={async () => {
              try {
                const r = await axios.get('/api/ai/automation/status');
                setAiOnline(r.data?.aiOnline !== false);
              } catch { /* keep current state */ }
            }}
            type="button"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Master AI card */}
      <div className="ai-master-card">
        <div className="ai-master-meta">
          <div className={`ai-master-icon ${aiEnabled ? 'green' : 'red'}`}>
            <Bot size={22} />
          </div>
          <div>
            <h3>Autonomous AI Agent Engine</h3>
            <p>
              {aiEnabled
                ? 'Continuously analyzing telemetry and dispatching automated commands.'
                : 'Manual override active. AI will not dispatch commands until re-enabled.'}
            </p>
          </div>
        </div>
        <button
          className={`btn ${aiEnabled ? 'btn-outlined' : 'btn-filled'}`}
          onClick={handleToggleAiMaster}
          type="button"
        >
          {aiEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {aiEnabled ? 'AI control ON' : 'AI control OFF'}
        </button>
      </div>

      {/* AI Profiles */}
      {aiEnabled && (
        <div className="ai-profiles" style={{ marginBottom: 16 }}>
          <div
            className={`ai-profile-card ${aiProfile === 'SAFETY' ? 'active' : ''}`}
            onClick={() => handleSelectProfile('SAFETY')}
          >
            <h4><ShieldCheck size={16} /> Shield Safety Guard</h4>
            <p>Prioritizes system protection. Triggers cooling &amp; ventilation if temperature &gt; 28°C or AQI PPM &gt; 750.</p>
          </div>
          <div
            className={`ai-profile-card ${aiProfile === 'ECO' ? 'active' : ''}`}
            onClick={() => handleSelectProfile('ECO')}
          >
            <h4><Leaf size={16} /> Eco Energy Saver</h4>
            <p>Optimizes energy draw. Adjusts A/C setpoints to 24°C and dims non-essential high-power loads when idle.</p>
          </div>
          <div
            className={`ai-profile-card ${aiProfile === 'COMFORT' ? 'active' : ''}`}
            onClick={() => handleSelectProfile('COMFORT')}
          >
            <h4><Thermometer size={16} /> Comfort Optimizer</h4>
            <p>Maintains ideal indoor climate at 22°C and balances humidity levels dynamically for user comfort.</p>
          </div>
        </div>
      )}

      {/* Per-device permissions + Decision log */}
      <div className="ai-grid">
        <div className="ai-section">
          <div className="ai-section-head">
            <h3><Cpu size={18} /> Per-device AI permissions</h3>
            <span style={{ fontSize: 12, color: 'var(--md-on-surface-variant)' }}>Toggle AI authority per node</span>
          </div>
          <div className="ai-section-body">
            {devices.length === 0 ? (
              <div className="empty-state" style={{ padding: 24, border: 'none' }}>
                <p>No devices registered yet.</p>
              </div>
            ) : (
              devices.map((dev) => {
                const isDevAiOn = deviceAiSettings[dev.id] !== false;
                return (
                  <div key={dev.id} className="ai-perm-row">
                    <div className="device-info">
                      <div className="device-name">{dev.name}</div>
                      <div className="device-meta">
                        {dev.category} · {dev.value}{dev.unit}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleToggleDeviceAi(dev.id)}
                      disabled={!aiEnabled}
                      style={{
                        background: isDevAiOn && aiEnabled ? 'var(--md-success-container)' : 'var(--md-surface-container-high)',
                        color: isDevAiOn && aiEnabled ? 'var(--md-success)' : 'var(--md-on-surface-variant)',
                        fontWeight: 500,
                      }}
                      type="button"
                    >
                      {isDevAiOn && aiEnabled ? <CheckCircle2 size={14} /> : <Info size={14} />}
                      {isDevAiOn && aiEnabled ? 'AI allowed' : 'Manual only'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="ai-section">
          <div className="ai-section-head">
            <h3><Activity size={18} /> Live AI decision feed</h3>
            <span style={{ fontSize: 12, color: 'var(--md-on-surface-variant)' }}>{aiDecisions.length} events</span>
          </div>
          <div className="ai-section-body">
            {aiDecisions.length === 0 ? (
              <div className="empty-state" style={{ padding: 24, border: 'none' }}>
                <p>No automated decisions yet. The AI is continuously scanning telemetry.</p>
              </div>
            ) : (
              aiDecisions.map((dec) => (
                <div key={dec.id} className="ai-decision">
                  <div className="decision-head">
                    <span className="decision-device">{dec.deviceName}</span>
                    <span className="decision-time">{dec.timestamp}</span>
                  </div>
                  <p className="decision-reason">{dec.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat console + reference panel */}
      <div className="ai-grid">
        <div className="ai-chat">
          <div className="ai-chat-head">
            <Bot size={20} className="text-violet" />
            <h3>NLP Command Console</h3>
            <span className="ai-badge">{aiOnline ? 'Online' : 'Offline fallback'}</span>
          </div>
          <div className="ai-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-msg ${msg.sender}`}>
                <div className="avatar">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="msg-meta">
                    <span>{msg.sender === 'ai' ? 'Nunnarri AI' : 'You'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="msg-bubble">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-suggestions">
            {suggestions.map((s, idx) => (
              <button key={idx} onClick={() => handleSend(s.query)} type="button">
                {s.label}
              </button>
            ))}
          </div>
          <div className="ai-input">
            <input
              type="text"
              placeholder={aiOnline
                ? "Ask the AI — e.g. 'Turn on the relay board' or 'Check safety status of all nodes'"
                : "AI offline — you can still type, the bot will respond in offline mode"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              className="send-btn"
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              type="button"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="ai-ref">
          <h4><Sparkles size={18} /> AI autonomous logic</h4>
          <p>
            The Autonomous AI Engine connects live telemetry from <strong>nexus_iot_db</strong> with user
            identities in <strong>user_db</strong>.
          </p>
          <ul>
            <li>Monitors temperature, humidity, and power draw metrics in real time.</li>
            <li>Executes non-blocking device toggle and value adjustments.</li>
            <li>Logs every action for full transparency and manual override.</li>
            <li>Falls back to deterministic rules when Ollama is unreachable.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
