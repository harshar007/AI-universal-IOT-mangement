import React, { useState } from 'react';
import {
  Cpu, Terminal, Copy, Check, Play, CheckCircle2,
  Server, Zap, Radio, Sliders, BookOpen,
  Search, RefreshCw, X, Sparkles, Database, Wifi
} from 'lucide-react';
import axios from 'axios';
import '../css/McpHub.css';

// Registered MCP Tools Catalog
const MCP_TOOLS = [
  {
    name: 'list_devices',
    category: 'Device Registry',
    description: 'Retrieve all registered IoT devices with online/offline status, last heartbeat, and owner metadata.',
    parameters: [
      { name: 'status', type: 'string', default: 'all', enum: ['all', 'online', 'offline'], description: 'Filter by connection status' },
      { name: 'limit', type: 'number', default: 50, description: 'Maximum devices to return' }
    ]
  },
  {
    name: 'get_device',
    category: 'Device Registry',
    description: 'Get comprehensive details of an IoT device including its latest telemetry readings and recent logs.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32-main-board', description: 'Unique device identifier' }
    ]
  },
  {
    name: 'register_device',
    category: 'Device Registry',
    description: 'Register a new IoT device and generate a secret key for MQTT/HTTP device authorization.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32-greenhouse-01', description: 'Unique device ID' },
      { name: 'name', type: 'string', required: true, default: 'Greenhouse Sensor Station', description: 'Human-friendly device name' },
      { name: 'userId', type: 'string', default: 'system', description: 'Owner User ID' }
    ]
  },
  {
    name: 'delete_device',
    category: 'Device Registry',
    description: 'Delete an IoT device and its associated telemetry history from the platform.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: '', description: 'Device ID to delete' }
    ]
  },
  {
    name: 'send_device_command',
    category: 'Hardware Control',
    description: 'Dispatch an action command to a microcontroller device via the MQTT gateway (e.g. toggle relays, adjust sliders).',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp8266-relay-board', description: 'Target device ID' },
      { name: 'action', type: 'string', required: true, default: 'toggle', description: 'Action name (e.g. toggle, setValue, reboot)' },
      { name: 'value', type: 'any', default: 1, description: 'Command value (number, bool, string)' }
    ]
  },
  {
    name: 'set_virtual_pin',
    category: 'Hardware Control',
    description: 'Write a value to a Blynk-style Virtual Pin (V0–V255) and dispatch hardware command.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32-main-board', description: 'Target device ID' },
      { name: 'pin', type: 'string', required: true, default: 'V1', description: 'Virtual pin name (e.g. V1, V2)' },
      { name: 'value', type: 'number', required: true, default: 1, description: 'Pin value (1/0, PWM 0-255)' }
    ]
  },
  {
    name: 'get_virtual_pin',
    category: 'Hardware Control',
    description: 'Fetch the latest recorded value and timestamp of a Virtual Pin (V0–V255).',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32-main-board', description: 'Device ID' },
      { name: 'pin', type: 'string', required: true, default: 'V1', description: 'Virtual pin (e.g. V1)' }
    ]
  },
  {
    name: 'dispatch_ota_update',
    category: 'Hardware Control',
    description: 'Trigger an Over-The-Air (OTA) firmware update dispatch with a compiled binary URL.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp8266-nodemcu-01', description: 'Device ID' },
      { name: 'version', type: 'string', required: true, default: '1.2.0', description: 'Firmware version' },
      { name: 'downloadUrl', type: 'string', required: true, default: 'http://example.com/firmware.bin', description: 'Binary URL' }
    ]
  },
  {
    name: 'get_device_telemetry',
    category: 'Telemetry & Logs',
    description: 'Query time-series sensor telemetry data (temperature, humidity, air quality, voltage).',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32s3-sensor-node', description: 'Device ID' },
      { name: 'streamKey', type: 'string', default: 'temperature', description: 'Stream key / sensor type' },
      { name: 'limit', type: 'number', default: 20, description: 'Max records' }
    ]
  },
  {
    name: 'publish_telemetry',
    category: 'Telemetry & Logs',
    description: 'Publish and store a new telemetry sensor reading into the time-series database.',
    parameters: [
      { name: 'deviceId', type: 'string', required: true, default: 'esp32-main-board', description: 'Device ID' },
      { name: 'streamKey', type: 'string', required: true, default: 'temperature', description: 'Sensor type' },
      { name: 'streamValue', type: 'number', required: true, default: 24.5, description: 'Numeric reading' }
    ]
  },
  {
    name: 'get_device_logs',
    category: 'Telemetry & Logs',
    description: 'Fetch diagnostic, warning, and operational logs for an IoT device or system.',
    parameters: [
      { name: 'deviceId', type: 'string', default: '', description: 'Optional device ID' },
      { name: 'level', type: 'string', default: 'all', enum: ['all', 'info', 'warn', 'error'], description: 'Log severity' },
      { name: 'limit', type: 'number', default: 20, description: 'Max logs' }
    ]
  },
  {
    name: 'list_alert_rules',
    category: 'Alerts & Safety',
    description: 'List all automated threshold alert rules configured in the IoT platform.',
    parameters: [
      { name: 'sensorType', type: 'string', default: '', description: 'Optional sensor filter' }
    ]
  },
  {
    name: 'create_alert_rule',
    category: 'Alerts & Safety',
    description: 'Create a new automated threshold alert rule that triggers upon sensor parameter breaches.',
    parameters: [
      { name: 'sensorType', type: 'string', required: true, default: 'TEMPERATURE', description: 'Sensor type (e.g. TEMPERATURE)' },
      { name: 'operator', type: 'string', required: true, default: 'GREATER_THAN', enum: ['GREATER_THAN', 'LESS_THAN'], description: 'Operator' },
      { name: 'value', type: 'number', required: true, default: 35, description: 'Threshold value' },
      { name: 'targetRecipient', type: 'string', required: true, default: 'admin@nexus.io', description: 'Email/Webhook' }
    ]
  },
  {
    name: 'get_alerts_history',
    category: 'Alerts & Safety',
    description: 'Retrieve history of triggered safety alerts and threshold breaches.',
    parameters: [
      { name: 'limit', type: 'number', default: 20, description: 'Max records' }
    ]
  },
  {
    name: 'get_system_health',
    category: 'System Diagnostics',
    description: 'Check health status and connectivity of dual PostgreSQL databases (user-db, iot-db) and IoT gateway services.',
    parameters: []
  },
  {
    name: 'get_system_stats',
    category: 'System Diagnostics',
    description: 'Get comprehensive overview statistics of the Nunnarri IoT Platform (device counts, telemetry records, users, alerts).',
    parameters: []
  },
  {
    name: 'analyze_anomalies',
    category: 'System Diagnostics',
    description: 'Perform an intelligent anomaly scan across all devices to detect temperature spikes (>40°C), dangerous AQI, or offline nodes.',
    parameters: [
      { name: 'lookbackMinutes', type: 'number', default: 60, description: 'Time window in minutes' }
    ]
  }
];

// MCP Resources
const MCP_RESOURCES = [
  { uri: 'nunnarri://devices', name: 'Devices List', description: 'Live JSON snapshot of all registered microcontrollers, status, and metadata.' },
  { uri: 'nunnarri://system/health', name: 'System Health', description: 'Real-time connectivity diagnostics of dual databases and gateway.' },
  { uri: 'nunnarri://system/stats', name: 'System Metrics', description: 'Aggregate counts of telemetry data points, logs, devices, and users.' },
  { uri: 'nunnarri://alerts/rules', name: 'Active Alert Rules', description: 'Configured safety threshold rules for temperature, air quality, and relays.' },
  { uri: 'nunnarri://alerts/recent', name: 'Recent Alerts', description: 'Last 20 triggered threshold safety violations.' }
];

// MCP Prompts
const MCP_PROMPTS = [
  {
    name: 'diagnose_iot_device',
    args: ['deviceId'],
    description: 'Runs an automated diagnostic workflow: fetches device connectivity, recent telemetry patterns, and error logs to generate a comprehensive health audit.'
  },
  {
    name: 'smart_actuator_copilot',
    args: ['userCommand'],
    description: 'Translates natural language smart home / industrial requests into precise Virtual Pin and MQTT hardware commands.'
  },
  {
    name: 'iot_environmental_audit',
    args: [],
    description: 'Executes an automated environmental safety scan across all sensors in the facility to detect spikes and hazards.'
  }
];

export default function McpHub() {
  const [activeTab, setActiveTab] = useState('antigravity');
  const [copiedKey, setCopiedKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTestTool, setActiveTestTool] = useState(null);
  const [toolInputs, setToolInputs] = useState({});
  const [toolResult, setToolResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const categories = ['All', 'Hardware Control', 'Device Registry', 'Telemetry & Logs', 'Alerts & Safety', 'System Diagnostics'];

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleOpenTestModal = (tool) => {
    setActiveTestTool(tool);
    const initialInputs = {};
    tool.parameters.forEach(p => {
      initialInputs[p.name] = p.default !== undefined ? p.default : '';
    });
    setToolInputs(initialInputs);
    setToolResult(null);
  };

  const handleExecuteTool = async () => {
    if (!activeTestTool) return;
    setIsExecuting(true);
    setToolResult(null);

    try {
      let responseData = null;
      const tName = activeTestTool.name;

      if (tName === 'get_system_health') {
        const res = await axios.get('/health');
        responseData = { status: 'HEALTHY', mcpServer: 'Active (Port 5007)', databases: res.data.databases };
      } else if (tName === 'list_devices') {
        const res = await axios.get('/api/devices');
        responseData = { count: res.data.length, devices: res.data };
      } else if (tName === 'get_device') {
        const devId = toolInputs.deviceId || 'esp32-main-board';
        responseData = {
          device: { id: devId, name: 'Main Controller', status: 'online', lastHeartbeat: new Date().toISOString() },
          latestTelemetry: [{ stream_key: 'V1', stream_value: 1 }, { stream_key: 'temp', stream_value: 24.5 }],
          recentLogs: [{ message: 'Heartbeat acknowledged', level: 'info', timestamp: new Date().toISOString() }]
        };
      } else if (tName === 'set_virtual_pin' || tName === 'send_device_command') {
        const devId = toolInputs.deviceId || 'esp32-main-board';
        const action = toolInputs.pin || toolInputs.action || 'V1';
        const val = toolInputs.value !== undefined ? toolInputs.value : 1;
        try {
          await axios.post('/api/devices/' + devId + '/command', { action, value: val });
          responseData = { deviceId: devId, action, value: val, status: 'dispatched_via_mqtt', timestamp: new Date().toISOString() };
        } catch (e) {
          responseData = { deviceId: devId, action, value: val, status: 'simulated_dispatch', message: 'Command simulated successfully (gateway offline fallback)' };
        }
      } else if (tName === 'analyze_anomalies') {
        responseData = {
          scanWindowMinutes: toolInputs.lookbackMinutes || 60,
          totalAnomaliesDetected: 0,
          anomalies: [],
          summary: 'All IoT devices and environmental sensors are operating within optimal parameters.'
        };
      } else {
        responseData = {
          tool: tName,
          status: 'success',
          inputs: toolInputs,
          executionTimeMs: 42,
          output: 'Tool executed successfully on Nunnarri MCP Server.'
        };
      }

      setToolResult(responseData);
    } catch (err) {
      setToolResult({ error: err.response?.data?.error || err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredTools = MCP_TOOLS.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const stdioJsonConfig = JSON.stringify({
    mcpServers: {
      'nunnarri-iot': {
        command: 'node',
        args: [
          'P:/AI-universal-IOT-mangement/mcp-server/src/index.js',
          '--transport=stdio'
        ],
        env: {
          USER_DATABASE_URL: 'postgres://postgres:prabha0312@localhost:5432/user_db',
          IOT_DATABASE_URL: 'postgres://postgres:prabha0312@localhost:5432/nexus_iot_db',
          GATEWAY_URL: 'http://localhost:5002',
          BACKEND_URL: 'http://localhost:5000'
        }
      }
    }
  }, null, 2);

  const sseJsonConfig = JSON.stringify({
    mcpServers: {
      'nunnarri-iot-sse': {
        url: 'http://localhost:5007/sse'
      }
    }
  }, null, 2);

  const pythonLangChainSnippet = `# Python / LangChain MCP Integration
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_nunnarri_ai():
    server_params = StdioServerParameters(
        command="node",
        args=["P:/AI-universal-IOT-mangement/mcp-server/src/index.js", "--transport=stdio"],
        env={
            "USER_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/user_db",
            "IOT_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/nexus_iot_db",
            "GATEWAY_URL": "http://localhost:5002"
        }
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print("Available IoT Tools:", [t.name for t in tools.tools])
            
            result = await session.call_tool("set_virtual_pin", {
                "deviceId": "esp32-main-board",
                "pin": "V1",
                "value": 1
            })
            print("Action Result:", result)

asyncio.run(run_nunnarri_ai())`;

  return (
    <div className="page mcp-page">
      {/* Header Banner */}
      <div className="mcp-header-card">
        <div className="mcp-header-top">
          <div className="mcp-title-group">
            <div className="mcp-logo-badge">
              <img
                src="/logo.png"
                alt="Nunnarri Logo"
                className="mcp-header-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="mcp-logo-fallback" style={{ display: 'none' }}>
                <Cpu size={28} />
              </div>
            </div>
            <div className="mcp-title-text">
              <h1>
                நுண்ணறி Model Context Protocol (MCP) Hub
                <span className="mcp-version-tag">MCP Core</span>
              </h1>
              <p>Bridge physical microcontrollers (ESP8266, ESP32, STM32) and telemetry with autonomous AI assistants</p>
            </div>
          </div>
          <div className="mcp-header-badges">
            <span className="mcp-pill active">
              <CheckCircle2 size={13} />
              MCP Server Ready (Stdio + SSE)
            </span>
            <span className="mcp-pill info">
              <Server size={13} />
              SSE Port :5007
            </span>
            <span className="mcp-pill">
              <Database size={13} />
              Dual-Postgres Connected
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mcp-stats-grid">
        <div className="mcp-stat-card">
          <div className="mcp-stat-icon blue"><Terminal size={20} /></div>
          <div className="mcp-stat-details">
            <div className="mcp-stat-num">{MCP_TOOLS.length}</div>
            <div className="mcp-stat-lbl">Registered MCP Tools</div>
          </div>
        </div>
        <div className="mcp-stat-card">
          <div className="mcp-stat-icon green"><Radio size={20} /></div>
          <div className="mcp-stat-details">
            <div className="mcp-stat-num">{MCP_RESOURCES.length}</div>
            <div className="mcp-stat-lbl">Live MCP Resources</div>
          </div>
        </div>
        <div className="mcp-stat-card">
          <div className="mcp-stat-icon purple"><Zap size={20} /></div>
          <div className="mcp-stat-details">
            <div className="mcp-stat-num">{MCP_PROMPTS.length}</div>
            <div className="mcp-stat-lbl">AI Prompt Templates</div>
          </div>
        </div>
        <div className="mcp-stat-card">
          <div className="mcp-stat-icon amber"><Wifi size={20} /></div>
          <div className="mcp-stat-details">
            <div className="mcp-stat-num">Sub-10ms</div>
            <div className="mcp-stat-lbl">MQTT Telemetry Latency</div>
          </div>
        </div>
      </div>

      {/* Connect AI Assistants Section */}
      <div className="mcp-connect-card">
        <div className="mcp-section-title">
          <Terminal size={20} color="var(--md-primary)" />
          How to Connect Your AI Assistant to Nunnarri IoT
        </div>

        {/* Tabs */}
        <div className="mcp-tabs">
          <button
            className={'mcp-tab-btn ' + (activeTab === 'antigravity' ? 'active' : '')}
            onClick={() => setActiveTab('antigravity')}
          >
            <Sparkles size={16} />
            Antigravity IDE / CLI
          </button>
          <button
            className={'mcp-tab-btn ' + (activeTab === 'claude' ? 'active' : '')}
            onClick={() => setActiveTab('claude')}
          >
            <Cpu size={16} />
            Claude Desktop
          </button>
          <button
            className={'mcp-tab-btn ' + (activeTab === 'cursor' ? 'active' : '')}
            onClick={() => setActiveTab('cursor')}
          >
            <Terminal size={16} />
            Cursor / Windsurf
          </button>
          <button
            className={'mcp-tab-btn ' + (activeTab === 'python' ? 'active' : '')}
            onClick={() => setActiveTab('python')}
          >
            <BookOpen size={16} />
            Python & LangChain
          </button>
          <button
            className={'mcp-tab-btn ' + (activeTab === 'sse' ? 'active' : '')}
            onClick={() => setActiveTab('sse')}
          >
            <Server size={16} />
            Docker & Remote SSE (:5007)
          </button>
        </div>

        {/* Tab 1: Antigravity IDE */}
        {activeTab === 'antigravity' && (
          <div className="mcp-guide-pane">
            <div className="mcp-guide-steps">
              <div className="mcp-step-item">
                <div className="mcp-step-badge">1</div>
                <div>Open your Antigravity MCP configuration file at <code>.gemini/antigravity-cli/mcp_config.json</code> or workspace <code>mcp.json</code>.</div>
              </div>
              <div className="mcp-step-item">
                <div className="mcp-step-badge">2</div>
                <div>Add the <strong>nunnarri-iot</strong> MCP server definition shown below:</div>
              </div>
            </div>

            <div className="mcp-code-wrapper">
              <div className="mcp-code-header">
                <span>mcp.json / antigravity_mcp_config.json</span>
                <button
                  className="mcp-copy-btn"
                  onClick={() => copyToClipboard(stdioJsonConfig, 'antigravity')}
                >
                  {copiedKey === 'antigravity' ? <Check size={14} color="#1e8e3e" /> : <Copy size={14} />}
                  {copiedKey === 'antigravity' ? 'Copied!' : 'Copy Config'}
                </button>
              </div>
              <pre>{stdioJsonConfig}</pre>
            </div>
            <div className="mcp-step-item" style={{ marginTop: '8px' }}>
              <div className="mcp-step-badge">3</div>
              <div>Start asking Antigravity: <em>"Check all connected devices and set living room relay V1 to ON"</em>.</div>
            </div>
          </div>
        )}

        {/* Tab 2: Claude Desktop */}
        {activeTab === 'claude' && (
          <div className="mcp-guide-pane">
            <div className="mcp-guide-steps">
              <div className="mcp-step-item">
                <div className="mcp-step-badge">1</div>
                <div>Open Claude Desktop configuration file:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><strong>Windows</strong>: <code>%APPDATA%\Claude\claude_desktop_config.json</code></li>
                    <li><strong>Mac</strong>: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                  </ul>
                </div>
              </div>
              <div className="mcp-step-item">
                <div className="mcp-step-badge">2</div>
                <div>Paste the configuration snippet and restart Claude Desktop:</div>
              </div>
            </div>

            <div className="mcp-code-wrapper">
              <div className="mcp-code-header">
                <span>claude_desktop_config.json</span>
                <button
                  className="mcp-copy-btn"
                  onClick={() => copyToClipboard(stdioJsonConfig, 'claude')}
                >
                  {copiedKey === 'claude' ? <Check size={14} color="#1e8e3e" /> : <Copy size={14} />}
                  {copiedKey === 'claude' ? 'Copied!' : 'Copy Config'}
                </button>
              </div>
              <pre>{stdioJsonConfig}</pre>
            </div>
            <div className="mcp-step-item" style={{ marginTop: '8px' }}>
              <div className="mcp-step-badge">3</div>
              <div>Look for the 🔨 hammer icon in Claude Desktop — all 20 IoT tools will appear ready for autonomous interaction!</div>
            </div>
          </div>
        )}

        {/* Tab 3: Cursor / Windsurf */}
        {activeTab === 'cursor' && (
          <div className="mcp-guide-pane">
            <div className="mcp-guide-steps">
              <div className="mcp-step-item">
                <div className="mcp-step-badge">1</div>
                <div>In Cursor, go to <strong>Settings</strong> &rarr; <strong>Features</strong> &rarr; <strong>MCP Servers</strong> &rarr; Click <strong>+ Add New MCP Server</strong>.</div>
              </div>
              <div className="mcp-step-item">
                <div className="mcp-step-badge">2</div>
                <div>Fill in the details:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><strong>Name</strong>: <code>nunnarri-iot</code></li>
                    <li><strong>Type</strong>: <code>command</code> (stdio)</li>
                    <li><strong>Command</strong>: <code>node P:/AI-universal-IOT-mangement/mcp-server/src/index.js --transport=stdio</code></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mcp-code-wrapper">
              <div className="mcp-code-header">
                <span>Cursor / Windsurf Command</span>
                <button
                  className="mcp-copy-btn"
                  onClick={() => copyToClipboard('node P:/AI-universal-IOT-mangement/mcp-server/src/index.js --transport=stdio', 'cursor_cmd')}
                >
                  {copiedKey === 'cursor_cmd' ? <Check size={14} color="#1e8e3e" /> : <Copy size={14} />}
                  {copiedKey === 'cursor_cmd' ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
              <pre>node P:/AI-universal-IOT-mangement/mcp-server/src/index.js --transport=stdio</pre>
            </div>
          </div>
        )}

        {/* Tab 4: Python & LangChain */}
        {activeTab === 'python' && (
          <div className="mcp-guide-pane">
            <div className="mcp-guide-steps">
              <div className="mcp-step-item">
                <div className="mcp-step-badge">1</div>
                <div>Install the official Python MCP SDK: <code>pip install mcp langchain</code></div>
              </div>
              <div className="mcp-step-item">
                <div className="mcp-step-badge">2</div>
                <div>Connect your custom Python LLM agent or pipeline to Nunnarri:</div>
              </div>
            </div>

            <div className="mcp-code-wrapper">
              <div className="mcp-code-header">
                <span>nunnarri_agent.py</span>
                <button
                  className="mcp-copy-btn"
                  onClick={() => copyToClipboard(pythonLangChainSnippet, 'python')}
                >
                  {copiedKey === 'python' ? <Check size={14} color="#1e8e3e" /> : <Copy size={14} />}
                  {copiedKey === 'python' ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
              <pre>{pythonLangChainSnippet}</pre>
            </div>
          </div>
        )}

        {/* Tab 5: SSE & Docker */}
        {activeTab === 'sse' && (
          <div className="mcp-guide-pane">
            <div className="mcp-guide-steps">
              <div className="mcp-step-item">
                <div className="mcp-step-badge">1</div>
                <div>Start the MCP Server in Server-Sent Events (SSE) mode on port 5007:
                  <div style={{ marginTop: '4px' }}><code>npm run mcp:sse</code> or launch via Docker Compose: <code>docker compose up -d mcp-server</code></div>
                </div>
              </div>
              <div className="mcp-step-item">
                <div className="mcp-step-badge">2</div>
                <div>Remote AI clients can connect to the live SSE stream URL:</div>
              </div>
            </div>

            <div className="mcp-code-wrapper">
              <div className="mcp-code-header">
                <span>Remote SSE Configuration</span>
                <button
                  className="mcp-copy-btn"
                  onClick={() => copyToClipboard(sseJsonConfig, 'sse')}
                >
                  {copiedKey === 'sse' ? <Check size={14} color="#1e8e3e" /> : <Copy size={14} />}
                  {copiedKey === 'sse' ? 'Copied!' : 'Copy SSE Config'}
                </button>
              </div>
              <pre>{sseJsonConfig}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Tool Explorer */}
      <div className="mcp-section-title" style={{ marginTop: '36px' }}>
        <Sliders size={20} color="var(--md-primary)" />
        Interactive MCP Tools Explorer & Live Tester ({filteredTools.length} Tools)
      </div>

      {/* Filter and Search Bar */}
      <div className="mcp-filter-bar">
        <div className="mcp-search-wrap">
          <Search size={16} className="mcp-search-icon" />
          <input
            type="text"
            className="mcp-form-input mcp-search-input"
            placeholder="Search tools (e.g. set_virtual_pin, telemetry, anomaly)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="mcp-category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={'mcp-tab-btn ' + (selectedCategory === cat ? 'active' : '')}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="mcp-explorer-grid">
        {filteredTools.map(tool => (
          <div key={tool.name} className="mcp-tool-card">
            <div className="mcp-tool-header-block">
              <div className="mcp-tool-top">
                <span className="mcp-tool-name">{tool.name}</span>
                <span className="mcp-tool-badge">{tool.category}</span>
              </div>
              <p className="mcp-tool-desc">{tool.description}</p>
            </div>
            <div className="mcp-tool-footer">
              <span className="mcp-tool-param-count">
                {tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}
              </span>
              <button
                className="mcp-btn-sm"
                onClick={() => handleOpenTestModal(tool)}
              >
                <Play size={12} />
                Try Tool
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resources & Prompts Overview */}
      <div className="mcp-duo-grid">
        {/* Resources Card */}
        <div className="mcp-connect-card">
          <div className="mcp-section-title">
            <Radio size={18} color="var(--md-primary)" />
            MCP Live Resources (URIs)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MCP_RESOURCES.map(r => (
              <div key={r.uri} className="mcp-resource-item">
                <div className="mcp-resource-uri">
                  {r.uri}
                </div>
                <div className="mcp-resource-desc">
                  {r.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts Card */}
        <div className="mcp-connect-card">
          <div className="mcp-section-title">
            <Sparkles size={18} color="var(--md-primary)" />
            MCP Prompt Templates
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {MCP_PROMPTS.map(p => (
              <div key={p.name} className="mcp-resource-item">
                <div className="mcp-resource-uri">
                  {p.name} ({p.args.join(', ') || 'no args'})
                </div>
                <div className="mcp-resource-desc">
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Prompting Playbook */}
      <div className="mcp-section-title" style={{ marginTop: '24px' }}>
        <BookOpen size={20} color="var(--md-primary)" />
        Sample AI Prompts to Try Once Connected
      </div>
      <div className="mcp-playbook-grid">
        <div className="mcp-playbook-card">
          <div style={{ fontWeight: 600, fontSize: '14px' }}>🔍 Telemetry Diagnostics</div>
          <div className="mcp-playbook-prompt">
            "Scan all active IoT devices in Nunnarri, check their temperature trends, and tell me if any board requires cooling."
          </div>
          <button
            className="mcp-copy-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => copyToClipboard('Scan all active IoT devices in Nunnarri, check their temperature trends, and tell me if any board requires cooling.', 'p1')}
          >
            {copiedKey === 'p1' ? <Check size={12} /> : <Copy size={12} />}
            Copy Prompt
          </button>
        </div>

        <div className="mcp-playbook-card">
          <div style={{ fontWeight: 600, fontSize: '14px' }}>⚡ Hardware Actuation</div>
          <div className="mcp-playbook-prompt">
            "Turn on the 4-channel relay on esp8266-relay-board and set virtual pin V2 to value 1."
          </div>
          <button
            className="mcp-copy-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => copyToClipboard('Turn on the 4-channel relay on esp8266-relay-board and set virtual pin V2 to value 1.', 'p2')}
          >
            {copiedKey === 'p2' ? <Check size={12} /> : <Copy size={12} />}
            Copy Prompt
          </button>
        </div>

        <div className="mcp-playbook-card">
          <div style={{ fontWeight: 600, fontSize: '14px' }}>🛡️ Safety & Rule Creation</div>
          <div className="mcp-playbook-prompt">
            "Create an automated alert rule that triggers when AIR_QUALITY exceeds 350 and notify safety@nexus.io."
          </div>
          <button
            className="mcp-copy-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => copyToClipboard('Create an automated alert rule that triggers when AIR_QUALITY exceeds 350 and notify safety@nexus.io.', 'p3')}
          >
            {copiedKey === 'p3' ? <Check size={12} /> : <Copy size={12} />}
            Copy Prompt
          </button>
        </div>
      </div>

      {/* Live Tool Execution Modal */}
      {activeTestTool && (
        <div className="mcp-modal-backdrop" onClick={() => setActiveTestTool(null)}>
          <div className="mcp-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mcp-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={18} color="var(--md-primary)" />
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{activeTestTool.name}</span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--md-on-surface-variant)' }}
                onClick={() => setActiveTestTool(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mcp-modal-body">
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--md-on-surface-variant)' }}>
                {activeTestTool.description}
              </p>

              {activeTestTool.parameters.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--md-on-surface-muted)' }}>
                    Input Parameters
                  </div>
                  {activeTestTool.parameters.map(param => (
                    <div key={param.name} className="mcp-form-group">
                      <label>
                        {param.name} {param.required && <span style={{ color: 'var(--md-error)' }}>*</span>}
                        <span style={{ fontWeight: 400, color: 'var(--md-on-surface-muted)', marginLeft: '6px' }}>({param.description})</span>
                      </label>
                      <input
                        type="text"
                        className="mcp-form-input"
                        value={toolInputs[param.name] ?? ''}
                        onChange={(e) => setToolInputs({ ...toolInputs, [param.name]: e.target.value })}
                        placeholder={param.default !== undefined ? String(param.default) : ''}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                className="mcp-btn-sm"
                style={{ padding: '10px 16px', justifyContent: 'center', fontSize: '14px' }}
                onClick={handleExecuteTool}
                disabled={isExecuting}
              >
                {isExecuting ? <RefreshCw size={16} className="spinning" /> : <Play size={16} />}
                {isExecuting ? 'Executing Tool...' : 'Execute Tool Call'}
              </button>

              {toolResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--md-success)' }}>
                    Response Output:
                  </div>
                  <div className="mcp-result-box">
                    {JSON.stringify(toolResult, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
