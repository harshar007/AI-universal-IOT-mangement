import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ArrowRight, CornerDownLeft, Sparkles, CheckCircle } from 'lucide-react';
import axios from 'axios';
import '../css/AiController.css';

export default function AiController({ devices, onToggleDevice, onChangeDeviceValue }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Nexus IoT Assistant online. I am the AI companion for the Nexus C++ Library (ESP32/ESP8266) and the customizable Nexus Web Dashboard. Ask me about library installation, Blynk-style virtual pin workflows, NexusTimer, or how to bind your custom hardware sensors and actuators!',
      timestamp: '13:00'
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const messagesEndRef = useRef(null);

  // Initialize conversation session on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const response = await axios.post('/api/chat/conversation');
        const convId = response.data.conversationId;
        setActiveConversationId(convId);
        
        // Fetch existing history for this conversation
        const historyResponse = await axios.get(`/api/chat/history?conversationId=${convId}`);
        if (historyResponse.data && historyResponse.data.messages && historyResponse.data.messages.length > 0) {
          setMessages(historyResponse.data.messages);
        }
      } catch (err) {
        console.error('Failed to initialize AI Chat session:', err);
      }
    };
    initChat();
  }, []);

  // Auto-scroll chat and terminal logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  // Command suggestions
  const suggestions = [
    { label: '📚 How to install?', query: 'How do I install the Nexus C++ library?' },
    { label: '🔌 ESP32 Connection', query: 'Show me ESP32 WiFi connection code' },
    { label: '⚡ Virtual Pins?', query: 'Explain Blynk-style virtual pin workflow' },
    { label: '⏰ NexusTimer?', query: 'How do I use NexusTimer for non-blocking tasks?' }
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // 1. Add User Message
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

      // 3. Process AI Response & State changes
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
          } else if (cmd.action === 'shutdownAll') {
            devices.forEach(device => {
              if (device.powerState) {
                onToggleDevice(device.id);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Error: Could not establish communication with the isolated AI-Backend.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };


  const handleResetChat = async () => {
    try {
      if (activeConversationId) {
        await axios.delete(`/api/chat/history?conversationId=${activeConversationId}`);
      }
      const response = await axios.post('/api/chat/conversation');
      setActiveConversationId(response.data.conversationId);
      
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: 'Nexus IoT Assistant online. I am the AI companion for the Nexus C++ Library (ESP32/ESP8266) and the customizable Nexus Web Dashboard. Ask me about library installation, Blynk-style virtual pin workflows, NexusTimer, or how to bind your custom hardware sensors and actuators!',
          timestamp: '13:00'
        }
      ]);

    } catch (err) {
      console.error('Failed to reset AI Chat:', err);
    }
  };

  return (
    <div className="main-content">
      {/* Page Header */}
      <header className="dashboard-header">
        <div>
          <h1>AI Command Center</h1>
          <p className="dashboard-subtitle">NLP Device Controller & System Automations</p>
        </div>
      </header>

      {/* Grid Layout: Left Chat + Terminal, Right Recommendations */}
      <div className="ai-layout-grid">

        {/* Chat Console Panel */}
        <div className="container">
          <div className="nav-bar">
            <a href="#chat" onClick={(e) => e.preventDefault()}>
              <Bot size={18} className="text-violet animate-glow" style={{ marginRight: '8px' }} />
              Nexus IoT Assistant
              <span className="ai-badge" style={{ marginLeft: '8px' }}>C++ LIBRARY CORE</span>
            </a>
            <div className="close" onClick={handleResetChat} title="Clear Chat Console">
              <div className="line one"></div>
              <div className="line two"></div>
            </div>
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
            {/* Quick Suggestions list */}
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
                placeholder="Ask AI to toggle appliances..."
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

        {/* Right side: Diagnostics Terminal & Recommendations */}
        <div className="ai-sidebar-column">

          {/* Logo Panel */}
          <div className="logo-panel glass-panel">
            <div className="logo-content">
              <div className="logo-glow-wrapper">
                <img src="/logo.png" alt="Nexus IoT Logo" className="controller-logo" />
                <div className="controller-logo-glow"></div>
              </div>
              <h3 className="logo-brand-name">Nexus IoT</h3>
              <p className="logo-brand-desc">AI Core Automation Engine</p>
            </div>
          </div>

          {/* C++ Quick Reference Panel */}
          <div className="recommendations-panel glass-panel">
            <div className="rec-header">
              <Sparkles size={18} className="text-yellow" />
              <h4>C++ Quick Reference</h4>
            </div>

            <div className="rec-list">
              <div className="rec-card glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="rec-title" style={{ fontSize: '0.85rem', color: '#a78bfa' }}>1. Header Include</span>
                <p className="rec-desc" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Import the correct driver for your board (ESP32 or ESP8266).</p>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', margin: '0', overflowX: 'auto', color: '#fff' }}>
                  {"#include <NexusSimpleEsp32.h>"}
                </pre>
              </div>

              <div className="rec-card glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="rec-title" style={{ fontSize: '0.85rem', color: '#a78bfa' }}>2. Initialize Connection</span>
                <p className="rec-desc" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Provide credentials and start the non-blocking state machine.</p>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', margin: '0', overflowX: 'auto', color: '#fff' }}>
                  {"Nexus.begin(auth, ssid, pass);"}
                </pre>
              </div>

              <div className="rec-card glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="rec-title" style={{ fontSize: '0.85rem', color: '#a78bfa' }}>3. Write to Dashboard Pin</span>
                <p className="rec-desc" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Push sensor telemetry to a specific Virtual Pin.</p>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', margin: '0', overflowX: 'auto', color: '#fff' }}>
                  {"Nexus.virtualWrite(V5, sensorVal);"}
                </pre>
              </div>

              <div className="rec-card glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="rec-title" style={{ fontSize: '0.85rem', color: '#a78bfa' }}>4. Read from Dashboard Pin</span>
                <p className="rec-desc" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Define an event handler macro to process user interactions.</p>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', margin: '0', overflowX: 'auto', color: '#fff' }}>
                  {"NEXUS_WRITE(V2) {\n  int val = param.asInt();\n}"}
                </pre>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
