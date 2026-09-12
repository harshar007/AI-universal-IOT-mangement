# 🤖 Nunnarri (நுண்ணறி) Model Context Protocol (MCP) Server

Official **Model Context Protocol (MCP)** server for the **நுண்ணறி (Nunnarri) Smart Intelligence IoT Platform**.

This MCP server empowers AI assistants (Antigravity, Claude Desktop, Cursor, OpenAI Agents, Ollama clients, Windsurf, Zed, etc.) to securely observe, diagnose, command, and manage physical microcontrollers (ESP8266, ESP32, STM32), virtual pins (V0–V255), actuators, sensors, and safety alerts.

---

## 🚀 Capabilities

### 🛠️ 20 MCP Tools
- **Device Management**:
  - `list_devices`: List all registered hardware devices with online/offline status and heartbeat timestamps.
  - `get_device`: Retrieve full device diagnostics, owner metadata, and latest pin states.
  - `register_device`: Register a new microcontroller with automatic API key generation.
  - `delete_device`: Remove a device and its telemetry cascade.
- **Physical Actuator & Virtual Pin Control**:
  - `send_device_command`: Dispatch raw actions (e.g. toggle relays, adjust sliders, trigger motors) via MQTT gateway.
  - `set_virtual_pin`: Write values to Blynk-style Virtual Pins (V0 to V255) and dispatch MQTT commands.
  - `get_virtual_pin`: Read the latest state of any virtual pin.
  - `dispatch_ota_update`: Push Over-The-Air firmware updates with download URLs to microcontrollers.
- **Telemetry & Logs**:
  - `get_device_telemetry`: Query time-series telemetry sensor data (temperature, humidity, AQI, voltage, etc.).
  - `publish_telemetry`: Manually inject or ingest telemetry data points.
  - `get_device_logs`: Fetch device-specific or system-wide diagnostic logs.
  - `log_device_event`: Record informational, warning, or error logs.
- **Automated Alerts & Safety**:
  - `list_alert_rules`: View active safety threshold rules.
  - `create_alert_rule`: Configure automated threshold triggers.
  - `delete_alert_rule`: Delete an alert rule.
  - `get_alerts_history`: Review triggered safety breaches and threshold violations.
- **System Intelligence & Diagnostics**:
  - `get_system_health`: Test dual database connectivity (`user-db`, `iot-db`) and microservice status.
  - `get_system_stats`: Aggregate total devices, active telemetry records, logs, and users.
  - `get_audit_logs`: Query administrative and security audit logs.
  - `analyze_anomalies`: Run intelligent anomaly detection across all sensors (temperature spikes >40°C, hazardous AQI >300, offline nodes).

### 📦 5 MCP Resources
- `nunnarri://devices`: Real-time JSON listing of all devices.
- `nunnarri://system/health`: Live health status of dual databases and gateway.
- `nunnarri://system/stats`: Comprehensive platform metrics.
- `nunnarri://alerts/rules`: Active alert rules configuration.
- `nunnarri://alerts/recent`: Latest triggered alert history.

### 💡 3 MCP Prompts
- `diagnose_iot_device`: Guided diagnostic workflow for troubleshooting an IoT device.
- `smart_actuator_copilot`: Natural language smart home / industrial control copilot.
- `iot_environmental_audit`: Facility-wide environmental safety audit prompt.

---

## ⚡ Quick Start

### 1. Installation
```bash
cd mcp-server
npm install
```

### 2. Running the Server

#### Stdio Mode (Default for Local AI Assistants like Claude & Antigravity)
```bash
npm run stdio
```

#### SSE / HTTP Mode (For Remote AI Clients & Web Integrations)
```bash
npm run sse
```
The SSE endpoint will be available at `http://localhost:5007/sse` with message handler at `http://localhost:5007/message`.

---

## 🔌 Connecting to AI Assistants

### Antigravity IDE / CLI
Add to your `mcp.json` or `.gemini/antigravity-cli/mcp_config.json`:
```json
{
  "mcpServers": {
    "nunnarri-iot": {
      "command": "node",
      "args": ["P:/AI-universal-IOT-mangement/mcp-server/src/index.js", "--transport=stdio"],
      "env": {
        "USER_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/user_db",
        "IOT_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/nexus_iot_db",
        "GATEWAY_URL": "http://localhost:5002",
        "BACKEND_URL": "http://localhost:5000"
      }
    }
  }
}
```

### Claude Desktop
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "nunnarri-iot": {
      "command": "node",
      "args": [
        "P:/AI-universal-IOT-mangement/mcp-server/src/index.js",
        "--transport=stdio"
      ],
      "env": {
        "USER_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/user_db",
        "IOT_DATABASE_URL": "postgres://postgres:prabha0312@localhost:5432/nexus_iot_db",
        "GATEWAY_URL": "http://localhost:5002",
        "BACKEND_URL": "http://localhost:5000"
      }
    }
  }
}
```

### Cursor / Windsurf / Zed
In Cursor Settings -> **Features** -> **MCP Servers** -> Add New MCP Server:
- **Name**: `nunnarri-iot`
- **Type**: `command`
- **Command**: `node P:/AI-universal-IOT-mangement/mcp-server/src/index.js --transport=stdio`

---

## 🐳 Docker Deployment

The MCP server is included in `docker-compose.yml`:
```bash
sudo docker compose up -d mcp-server
```

---

## 📜 License
MIT License - Built for open-source AI & Cyber-Physical intelligence.
