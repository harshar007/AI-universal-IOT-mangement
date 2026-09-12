# ⚡ நுண்ணறி (Nunnarri) — Smart Intelligence Cyber-Physical IoT & Local AI Platform

<p align="center">
  <img src="nunnari%20banner%20.png" alt="நுண்ணறி (Nunnarri) Smart Intelligence Platform Banner" width="100%" style="border-radius: 16px; box-shadow: 0 12px 40px rgba(0,242,254,0.25);" />
</p>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![MQTT](https://img.shields.io/badge/MQTT-1883%20Broker-660066?style=for-the-badge&logo=eclipse-mosquitto&logoColor=white)](https://mqtt.org)
[![Ollama AI](https://img.shields.io/badge/AI-Ollama%20%7C%20Llama3.2-FF6F00?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol%201.0-00F2FE?style=for-the-badge&logo=anthropic&logoColor=black)](#-model-context-protocol-mcp--connect-any-ai)

</div>

---

<div align="center">

### **நுண்ணறி • Nunnarri**
#### **இணைப்பு • அறிவு • கட்டுப்பாடு** *(Connectivity • Intelligence • Control)*
#### **Autonomous Cyber-Physical Operating System & Cognitive Hardware Mesh**

</div>

> **நுண்ணறி (Nunnarri)** is an open-source, enterprise-grade **Smart Intelligence IoT Platform & Sovereign AI Core**. The Tamil word **நுண்ணறி** (*Nunnarri*) signifies **Sharp Intelligence / Deep Perception**. Nunnarri seamlessly bridges physical microcontroller hardware (ESP8266, ESP32, Raspberry Pi), sub-millisecond MQTT telemetry channels, dual PostgreSQL databases, and on-premise Large Language Models (LLMs) into a unified, autonomous cyber-physical environment.

---

## 📸 Nunnarri Control Center (HUD Console)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧠 NUNNARRI CONTROL CENTER HUD                                   [ 14 Active ]  [ OPTIMAL ] │
├──────────────────────────────┬────────────────────────────────────────┬─────────────────────┤
│ 🤖 LOCAL AI CORTEX (Ollama)  │ 📊 TELEMETRY GAUGES & REAL-TIME LOGS   │ 🎛️ VIRTUAL PIN HUD  │
│                              │                                        │                     │
│  User: "Optimize HVAC and    │   [ TEMP ]     [ HUMIDITY ]    [ AQI ] │  (V1) RELAY SWITCH  │
│  check room temperature."    │     68°F          42%           32     │  [ ON ] ──────────  │
│                              │    (  O  )       (  O  )      ( O )    │                     │
│  Cortex: "Adjusting Virtual  │                                        │  (V2) SMART LIGHTS  │
│  Pin V3. Room temperature is │ 📈 LIVE SENSOR STREAM (Time-Series)    │  [ AUTO ] ────────  │
│  optimal at 68°F."           │  50|      /\       /\                 │                     │
│                              │  25| ____/  \_____/  \______          │  (V3) PUMP MOTOR    │
│  [Neural Node Visualizer]    │   0+───10:00───10:30───11:00───>       │  [ OFF ] ─────────  │
└──────────────────────────────┴────────────────────────────────────────┴─────────────────────┘
```

---

## 🌌 The Vision Behind Nunnarri (நுண்ணறி)

> [!IMPORTANT]
> **The Autonomous Cyber-Physical Era**: Traditional IoT solutions are passive loggers — blindly collecting metrics while forcing humans to manually write rules and flip switches. **Nunnarri introduces autonomous cognitive loops.** By pairing sub-millisecond telemetry ingestion with local LLMs (Ollama) and Model Context Protocol (MCP) servers, hardware systems can self-diagnose, detect environmental anomalies, and execute real-time physical control.

### 🏛️ Core Pillars of Nunnarri

1. ⚡ **Sub-Millisecond Nervous Telemetry**: Instant bi-directional hardware communication over MQTT (`1883`) and WebSockets (`5002`).
2. 🤖 **100% On-Premise Data Sovereignty**: Zero cloud vendor locks. User data, time-series telemetry, and AI models run locally on your own hardware via Docker.
3. 📌 **Blynk-Style Virtual Pin Architecture**: Bind physical GPIO pins (`V0` to `V255`) to interactive UI widgets, automated rules, and AI function calls.
4. 🔌 **Universal AI Integration (MCP Standard)**: AI Agents (Claude Desktop, Antigravity, Cursor, OpenAI Agents) can directly observe, control, and repair IoT infrastructure using standard MCP protocol schemas.

---

## 🧠 Architectural Analogy: Biological Neural Network vs. Nunnarri

Nunnarri's microservices architecture is engineered to mirror the high-bandwidth nerve impulse routing and cognitive executive control of biological systems:

```mermaid
graph TD
    subgraph PERIPHERAL_NERVES["⚡ Peripheral Nervous System (Sensors & Actuators)"]
        ESP["ESP8266 / ESP32 Microcontrollers"] -->|Sub-10ms MQTT Telemetry| MQTT
    end

    subgraph NERVOUS_CHANNEL["⚡ Central Nerve Channels"]
        MQTT["IoT Gateway (MQTT Broker :1883 / WebSockets :5002)"]
    end

    subgraph REFLEX_ENGINE["🦾 Motor Cortex & Autonomic Reflexes"]
        MQTT -->|Fast Nerve Impulse| BACKEND["Backend REST API & Rule Dispatcher (:5000)"]
        BACKEND -->|Instant Actuation| RELAY["Virtual Pin Actuators (V0 - V255)"]
    end

    subgraph LONG_TERM_MEMORY["💾 Hippocampal Synaptic Memory"]
        BACKEND <-->|Identity & RBAC| UDB[("UserDB (Postgres :5432)")]
        BACKEND <-->|Telemetry Log Storage| IDB[("IotDB (Postgres :5432)")]
    end

    subgraph COGNITIVE_CORTEX["🧠 Executive Prefrontal Cortex"]
        BACKEND <-->|Cognitive Reasoning & Anomaly Signals| AI["AI Backend (Ollama LLM :5006)"]
        AI <-->|Tool Execution & Observations| MCP["MCP Server (Model Context Protocol :5007)"]
    end

    subgraph VISUAL_HUD["👁️ Sensory Perception & Visual HUD"]
        BACKEND <-->|Dynamic REST / WS Stream| UI["React 18 + Vite Glassmorphism Dashboard (:9090)"]
    end
```

### 📊 Structural Metaphor Matrix

| Biological / Cyber-Physical Layer | Nunnarri Architecture Module | Technical Responsibility |
| :--- | :--- | :--- |
| **Prefrontal Cognitive Cortex** | `ai-backend` (Node.js + Ollama LLM) | High-level reasoning, natural language device intent parsing, anomaly evaluation, and predictive maintenance. |
| **Central Nerve Spinal Cord** | `iot-gateway` (Aedes MQTT + WebSockets) | Ultra-low latency transmission of nerve signals (telemetry packets) between physical hardware and server modules. |
| **Autonomic Reflex System** | `backend` (Express API Engine) | Instant safety triggers (e.g. automatically shutting a gas solenoid when sensor threshold exceeds safe limit). |
| **Hippocampal Synaptic Memory** | Dual PostgreSQL (`user-db` + `iot-db`) | Isolated long-term memory. `user-db` protects user identity/secrets while `iot-db` indexes high-frequency sensor records. |
| **Sensory Visual Cortex** | `frontend` (React 18, Vite, Nginx) | Renders physical system states into dynamic glassmorphism charts, interactive gauges, and live MQTT terminals. |
| **Peripheral Nerve Receptors** | Physical Hardware (ESP8266 / ESP32) | Physical sensory perception (temperature, humidity, motion, AQI) and direct physical GPIO motor/relay control. |

---

## 🌟 Key Platform Capabilities

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                FEATURE HIGHLIGHTS                                       │
├──────────────────────────────┬──────────────────────────────┬────────────────────────────┤
│ ⚡ FAST TELEMETRY            │ 📌 VIRTUAL PIN HUD           │ 🤖 ON-PREMISE LOCAL AI     │
│ Sub-millisecond MQTT (1883)  │ Flexible V0-V255 mapping for │ Ollama LLM integration for │
│ and WebSocket data streaming │ relays, PWM, and sensors     │ autonomous IoT control     │
├──────────────────────────────┼──────────────────────────────┼────────────────────────────┤
│ 🔌 NATIVE MCP PROTOCOL       │ 🛡️ DUAL POSTGRESQL MEMORY    │ 🐳 1-CLICK DOCKER STACK    │
│ Standard AI Agent tools for  │ Isolated identity & time-    │ Automated multi-container  │
│ Claude, Cursor, Antigravity  │ series database architecture │ deployment with health checks│
└──────────────────────────────┴──────────────────────────────┴────────────────────────────┘
```

- ⚡ **Sub-Millisecond Ingestion**: Integrated high-throughput Aedes MQTT broker (`1883`) and WebSocket bridge (`5002`).
- 📌 **Virtual Pin System**: Full Blynk-style virtual pin mapping (`V0` to `V255`) supporting push/pull telemetry and hardware triggers.
- 🤖 **Local AI Cortex**: Integrated Ollama AI module featuring Llama3.2 models for natural language interaction, smart automation, and anomaly detection.
- 🔌 **Native Model Context Protocol (MCP)**: Embedded SSE (`5007`) and Stdio MCP server exposing 20+ specialized tools for AI Agent orchestration.
- 🎨 **Glassmorphism HUD**: Responsive, ultra-modern dark/light React UI featuring customizer pages, Virtual Pin Manager, MQTT Live Monitor, and Developer APIs.
- 🔐 **Enterprise Security**: JWT-based stateless authentication, RBAC authorization, per-device API tokens, and optional GitHub OAuth 2.0.

---

## 🏗️ Microservices Architecture & Port Mapping

Nunnarri is structured as 6 fully decoupled, containerized microservices:

| Service Name | Description | Tech Stack | Port Mappings |
| :--- | :--- | :--- | :--- |
| **`frontend`** | Glassmorphism Web App & HUD Console | React 18, Vite, Nginx | `9090:80` |
| **`backend`** | Core REST API, Auth, & Device Dispatcher | Node.js, Express, PostgreSQL | `5005:5000` |
| **`ai-backend`** | Local AI Cortex & Anomaly Engine | Node.js, Ollama LLM, Express | `5006:5006` |
| **`iot-gateway`** | Hardware Gateway, MQTT Broker & WebSockets | Node.js, Aedes MQTT, WS | `1883:1883`, `5002:5002` |
| **`mcp-server`** | Model Context Protocol Server (SSE / Stdio) | Node.js, `@modelcontextprotocol/sdk` | `5007:5007` |
| **`user-db`** | User Account & Authentication Database | PostgreSQL 15 | `5432` (Internal) |
| **`iot-db`** | IoT Telemetry & Device State Database | PostgreSQL 15 | `5432` (Internal) |

---

## 🔌 Model Context Protocol (MCP) — Connect Any AI

Nunnarri includes an enterprise-grade **Model Context Protocol (MCP)** server. This allows AI assistants like **Claude Desktop**, **Antigravity IDE**, **Cursor**, or custom **LangChain / LlamaIndex** agents to observe hardware state, alter virtual pins, and dispatch firmware updates.

### 🛠️ Connecting to Antigravity / Claude Desktop / Cursor

Add the following to your AI environment's MCP configuration (`mcp_config.json` or `claude_desktop_config.json`):

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

### 🛠️ Exposed MCP Capabilities (Tools, Resources & Prompts)

#### 🧰 Tools (20 System Tools)
- `list_devices`: List registered hardware devices with online status.
- `get_device`: Fetch complete metadata and current pin state for a device.
- `register_device`: Provision a new hardware node with generated API keys.
- `send_device_command`: Send raw hardware control payloads to target nodes.
- `set_virtual_pin`: Update a Virtual Pin (`V0`-`V255`) value on a device.
- `get_virtual_pin`: Query current value of a target Virtual Pin.
- `get_device_telemetry`: Fetch time-series historical sensor records.
- `publish_telemetry`: Ingest telemetry data into the platform pipeline.
- `dispatch_ota_update`: Trigger Over-The-Air firmware updates for hardware.
- `analyze_anomalies`: Execute AI statistical anomaly detection over sensor data.
- `get_system_health`: Inspect container metrics and database connectivity.
- *And 9 more admin, log, and alert rule management tools...*

#### 📚 Resources (5 Live Data Streams)
- `nunnarri://devices`: Dynamic JSON stream of all hardware nodes.
- `nunnarri://system/health`: Real-time system diagnostics report.
- `nunnarri://system/stats`: Aggregate device count and network stats.
- `nunnarri://alerts/rules`: Active threshold alert rule configurations.
- `nunnarri://alerts/recent`: Real-time log of security & threshold alerts.

#### 💬 Prompts (3 Autonomous Copilots)
- `diagnose_iot_device`: Guided diagnostic workflow for offline hardware.
- `smart_actuator_copilot`: Safety-checked wizard for high-power relay control.
- `iot_environmental_audit`: Automated environmental data audit and summary.

---

## ⚡ Hardware Firmware Integration (ESP8266 / ESP32)

Upload the production-ready C++ firmware sketch [`esp8266_test_sketch.ino`](esp8266_test_sketch.ino) using Arduino IDE:

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi & Nunnarri IoT Gateway Configuration
const char* ssid          = "YOUR_WIFI_SSID";
const char* password      = "YOUR_WIFI_PASSWORD";
const char* mqtt_server   = "192.168.1.100";  // Docker Host Machine IP
const int   mqtt_port     = 1883;
const char* device_id     = "esp8266_node_01";
const char* device_token  = "NUNNARRI_DEVICE_API_KEY";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  // Send Temperature Telemetry on Virtual Pin V1 every 5 seconds
  StaticJsonDocument<200> doc;
  doc["vPin"] = "V1";
  doc["value"] = 24.5;
  
  char buffer[250];
  serializeJson(doc, buffer);
  client.publish("nunnarri/devices/esp8266_node_01/telemetry", buffer);
  delay(5000);
}
```

---

## 🚀 Quick Start (Docker Deployment)

### 📋 Prerequisites
- [Docker Desktop](https://www.docker.com/) or Docker Engine (`>= 20.10`)
- Docker Compose (`v2.x`)

### ⚡ 1-Command Launch

1. **Clone Repository**:
   ```bash
   git clone https://github.com/harshar007/AI-universal-IOT-mangement.git
   cd AI-universal-IOT-mangement
   ```

2. **Setup Environment Configuration**:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Build & Spin Up All Microservices**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify Running Containers**:
   ```bash
   docker compose ps
   ```

5. **Open Endpoints**:
   - 🌐 **Web Dashboard**: `http://localhost:9090`
   - 🔌 **Backend REST API**: `http://localhost:5005`
   - 🤖 **AI Backend API**: `http://localhost:5006`
   - ⚡ **IoT WebSocket Gateway**: `ws://localhost:5002`
   - 📡 **MQTT Broker**: `mqtt://localhost:1883`
   - 🧩 **MCP Protocol Server**: `http://localhost:5007`

---

## 🗄️ Database Management & pgAdmin Setup

Nunnarri utilizes isolated PostgreSQL instances for maximum security and performance:

- **User Database (`user-db`)**: `postgres://postgres:prabha0312@localhost:5432/user_db`
- **IoT Database (`iot-db`)**: `postgres://postgres:prabha0312@localhost:5432/nexus_iot_db`

Detailed setup steps can be found in [`pgadmin_connection_guide.txt`](pgadmin_connection_guide.txt).

---

## 🔐 GitHub OAuth 2.0 Single Sign-On Setup

1. Navigate to **GitHub Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. Set **Homepage URL**: `http://localhost:9090`
3. Set **Authorization Callback URL**: `http://localhost:9090/api/auth/github/callback`
4. Copy `Client ID` & `Client Secret` into `backend/.env` and `docker-compose.yml`.

---

## 🛠️ Troubleshooting & FAQ

> [!TIP]
> **Q: Port 5432 or 1883 is already in use.**
> - **Fix**: Stop local PostgreSQL or Mosquitto services running on your host machine before starting Docker: `sudo systemctl stop postgresql mosquitto`.

> [!NOTE]
> **Q: Web Dashboard shows blank screen after code edits.**
> - **Fix**: Ensure lucide-react icons are properly imported in components, then rebuild frontend via `docker compose up -d --build frontend`.

---

## 🤝 License & Open Source Community

This project is released under the **[MIT License](LICENSE)**.

- ⭐ **Star this repository** if you find Nunnarri useful for your IoT & AI projects!
- 🔀 **Fork & Contribute**: Pull requests for new MCP tools, UI widgets, and hardware sketches are welcome.

<br/>

<div align="center">

**Designed & Engineered with ❤️ for the Global Cyber-Physical & AI Open-Source Community**

</div>
