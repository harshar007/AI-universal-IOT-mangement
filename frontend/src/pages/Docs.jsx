import React, { useState } from 'react';
import {
  BookOpen, Terminal as TermIcon, Cpu, Download, Wifi,
  Code, Key, Settings, AlertCircle, Copy, Check, Info, Shield
} from 'lucide-react';
import '../css/Docs.css';

export default function Docs() {
  const [activeTab, setActiveTab] = useState('esp32');
  const [copiedState, setCopiedState] = useState({});

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedState(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const codeSnippets = {
    dockerRun: `docker compose up --build`,
    registerDevice: `curl -X POST http://localhost:5002/api/devices/register \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId": "living-room-ac", "name": "Living Room AC"}'`,
    esp32Code: `#include <WiFi.h>
#include <NexusSimpleEsp32.h>
#include <NexusTimer.h>

// 1. Enter Your Auth Credentials
char auth[] = "YOUR_DEVICE_SECRET_KEY"; // Generated during registration
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

NexusTimer timer;

// 2. Read from Dashboard Switch (Virtual Pin V2)
NEXUS_WRITE(V2) {
  int switchState = param.asInt();
  digitalWrite(LED_BUILTIN, switchState); // Turn hardware LED on/off
  Serial.print("V2 pin state changed to: ");
  Serial.println(switchState);
}

// 3. Periodic Function: Push Telemetry
void sendSensorData() {
  float temp = 24.5; // Simulate reading sensor
  Nexus.virtualWrite(V5, temp); // Push temp to Gauge/Chart on V5
  Nexus.virtualWrite(V6, "System running OK"); // Push logs to terminal on V6
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  // 4. Initialize Connection
  Nexus.begin(auth, ssid, pass);

  // Schedule telemetry updates every 5000ms (5 seconds)
  timer.setInterval(5000L, sendSensorData);
}

void loop() {
  Nexus.run(); // Maintains MQTT connectivity and dispatches messages
  timer.run(); // Keeps scheduler running
}`,
    esp8266Code: `#include <ESP8266WiFi.h>
#include <NexusSimpleEsp8266.h>
#include <NexusTimer.h>

// 1. Enter Your Auth Credentials
char auth[] = "YOUR_DEVICE_SECRET_KEY"; // Generated during registration
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

NexusTimer timer;

// 2. Read from Dashboard Switch (Virtual Pin V2)
NEXUS_WRITE(V2) {
  int switchState = param.asInt();
  digitalWrite(LED_BUILTIN, switchState); // Turn hardware LED on/off
  Serial.print("V2 pin state changed to: ");
  Serial.println(switchState);
}

// 3. Periodic Function: Push Telemetry
void sendSensorData() {
  float humidity = 45.2; // Simulate reading sensor
  Nexus.virtualWrite(V4, humidity); // Push humidity to Gauge/Chart on V4
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  // 4. Initialize Connection
  Nexus.begin(auth, ssid, pass);

  // Schedule telemetry updates every 5000ms (5 seconds)
  timer.setInterval(5000L, sendSensorData);
}

void loop() {
  Nexus.run(); // Maintains MQTT connectivity and dispatches messages
  timer.run(); // Keeps scheduler running
}`
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>System Documentation</h1>
          <p className="dashboard-subtitle">Step-by-step developer guidelines for setup & hardware integration</p>
        </div>
      </header>

      {/* Docs Grid */}
      <div className="docs-container">

        {/* Sidebar Nav */}
        <aside className="docs-nav glass-panel">
          <h3 className="docs-nav-title">
            <BookOpen size={16} className="text-cyan" />
            <span>Developer Guide</span>
          </h3>
          <ul className="docs-nav-list">
            <li><a href="#overview">1. Platform Overview</a></li>
            <li><a href="#setup">2. Local Gateway Setup</a></li>
            <li><a href="#device-reg">3. Device Registration</a></li>
            <li><a href="#cpp-install">4. C++ Driver Library</a></li>
            <li><a href="#connecting-device">5. Write Microcontroller Code</a></li>
            <li><a href="#api-reference">6. Gateway API Reference</a></li>
            <li><a href="#mqtt-topics">7. MQTT Topic Specs</a></li>
          </ul>
        </aside>

        {/* Content Body */}
        <main className="docs-content">

          {/* Section 1: Overview */}
          <section id="overview" className="docs-section glass-panel">
            <div className="project-banner-alert" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px dashed rgba(6, 182, 212, 0.3)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Info className="text-cyan" size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'left' }}>
                <strong>Academic Final Year Project:</strong> This platform is designed and built as a final year academic contribution. Meet the development team and view project details on the <a href="/developers" style={{ color: 'var(--text-cyan)', textDecoration: 'underline', fontWeight: '600' }}>Project Team Page</a>.
              </div>
            </div>
            <h2>1. Platform Overview</h2>
            <p>
              The <strong>Nunnarri IoT Platform</strong> is a premium, real-time developer workspace built on a Blynk-style virtual pin architecture. Unlike consumer smart home products that enforce a fixed screen template, Nunnarri provides developers full creative control:
            </p>
            <div className="features-grid">
              <div className="feature-item">
                <Cpu className="feature-icon text-cyan" />
                <div>
                  <h4>Blynk-style Virtual Pins</h4>
                  <p>Bind any dashboard widget (toggle switch, slider, radial gauge, chart, or serial terminal) to a virtual pin channel (V0-V15) to stream sensor values or control actuators.</p>
                </div>
              </div>
              <div className="feature-item">
                <Wifi className="feature-icon text-green" />
                <div>
                  <h4>Bidirectional MQTT Connection</h4>
                  <p>Communication is powered by an embedded light-weight MQTT Broker supporting sub-100ms connection latency, zero polling overhead, and persistent device heartbeats.</p>
                </div>
              </div>
              <div className="feature-item">
                <Shield className="feature-icon text-violet" />
                <div>
                  <h4>Device Authentication & Auth Keys</h4>
                  <p>Devices register via secure REST endpoints to obtain custom authorization tokens, safeguarding physical hardware connections and command dispatch pipelines.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Local Gateway Setup */}
          <section id="setup" className="docs-section glass-panel">
            <h2>2. Local Gateway Setup</h2>
            <p>
              The Nunnarri platform runs inside isolated Docker microservices. You can spin up the complete stack, including the PostgreSQL database, Express authentication server, Ollama AI assistant backend, WebSockets, and the IoT communication gateway server, using Docker Compose.
            </p>

            <div className="code-block-wrapper">
              <div className="code-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TermIcon size={14} className="text-muted" />
                  <span>Terminal Command</span>
                </div>
                <button
                  onClick={() => handleCopy('dockerRun', codeSnippets.dockerRun)}
                  className="copy-btn"
                >
                  {copiedState['dockerRun'] ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  <span>{copiedState['dockerRun'] ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre><code>{codeSnippets.dockerRun}</code></pre>
            </div>

            <div className="note-alert">
              <Info size={16} className="text-cyan" />
              <div className="alert-content">
                <strong>Local Port Mapping:</strong>
                <ul>
                  <li><strong>Frontend UI Dashboard:</strong> http://localhost:80</li>
                  <li><strong>Express Auth API Backend:</strong> http://localhost:5000</li>
                  <li><strong>IoT Communication Gateway:</strong> http://localhost:5002</li>
                  <li><strong>Embedded MQTT Broker:</strong> mqtt://localhost:1883</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Device Registration */}
          <section id="device-reg" className="docs-section glass-panel">
            <h2>3. Device Registration</h2>
            <p>
              Before a microcontroller can communicate with the gateway, it must be registered to obtain an authorization token (Secret Key). You can register a device in two ways:
            </p>
            <ol className="step-list">
              <li>
                <strong>Via the UI Dashboard:</strong> Navigate to the <em>Devices Directory</em> page, click <strong>Create New Device</strong>, fill in the ID, name, location, and click register.
              </li>
              <li>
                <strong>Via the Gateway REST API:</strong> Send an HTTP POST request to the registration endpoint:
              </li>
            </ol>

            <div className="code-block-wrapper">
              <div className="code-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code size={14} className="text-muted" />
                  <span>CURL Registration Request</span>
                </div>
                <button
                  onClick={() => handleCopy('registerDevice', codeSnippets.registerDevice)}
                  className="copy-btn"
                >
                  {copiedState['registerDevice'] ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                  <span>{copiedState['registerDevice'] ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre><code>{codeSnippets.registerDevice}</code></pre>
            </div>

            <div className="note-alert border-yellow" style={{ background: 'rgba(250, 204, 21, 0.03)' }}>
              <Key size={16} className="text-yellow" />
              <div className="alert-content">
                <strong style={{ color: 'var(--text-primary)' }}>Important Credentials:</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  The response contains a <code>secretKey</code>. Save this token! It will be used as the device password for MQTT authentication.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: C++ Driver Library */}
          <section id="cpp-install" className="docs-section glass-panel">
            <h2>4. C++ Driver Library</h2>
            <p>
              The Nunnarri C++ library is a lightweight, event-driven driver for ESP32 and ESP8266 microcontrollers. It uses zero dynamic memory allocation after boot to prevent memory fragmentation on low-RAM chips.
            </p>

            <div className="library-card glass-panel border-cyan" style={{ background: 'rgba(0,243,255,0.02)', padding: '1.25rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="lib-icon-badge">
                    <Download size={24} className="text-cyan" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>Nunnarri IoT C++ Library Driver</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Includes: NexusSimple, NexusTimer, NexusLCD, NexusLED (v1.0.0)</span>
                  </div>
                </div>
                <a
                  href="/nexus-iot-library.zip"
                  download="nexus-iot-library.zip"
                  className="btn-download"
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--accent-cyan)',
                    color: '#000',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)'
                  }}
                >
                  Download ZIP
                </a>
              </div>
            </div>

            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>How to Install in Arduino IDE:</h4>
            <ul className="docs-list">
              <li>Download the <code>nexus-iot-library.zip</code> driver archive.</li>
              <li>Open your **Arduino IDE**.</li>
              <li>Navigate to **Sketch** &gt; **Include Library** &gt; **Add .ZIP Library...**</li>
              <li>Select the downloaded zip file to install it.</li>
            </ul>
          </section>

          {/* Section 5: Connecting a Device */}
          <section id="connecting-device" className="docs-section glass-panel">
            <h2>5. Write Microcontroller Code</h2>
            <p>
              Use the following boilerplates to initialize connection, handle dashboard toggles, and send telemetry data.
            </p>

            {/* Platform Tab Switcher */}
            <div className="tab-container">
              <button
                className={`tab-btn ${activeTab === 'esp32' ? 'active' : ''}`}
                onClick={() => setActiveTab('esp32')}
              >
                ESP32 Board
              </button>
              <button
                className={`tab-btn ${activeTab === 'esp8266' ? 'active' : ''}`}
                onClick={() => setActiveTab('esp8266')}
              >
                ESP8266 Board
              </button>
            </div>

            {/* Code view */}
            {activeTab === 'esp32' ? (
              <div className="code-block-wrapper">
                <div className="code-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Code size={14} className="text-muted" />
                    <span>ESP32 Sketch</span>
                  </div>
                  <button
                    onClick={() => handleCopy('esp32', codeSnippets.esp32Code)}
                    className="copy-btn"
                  >
                    {copiedState['esp32'] ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                    <span>{copiedState['esp32'] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre><code>{codeSnippets.esp32Code}</code></pre>
              </div>
            ) : (
              <div className="code-block-wrapper">
                <div className="code-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Code size={14} className="text-muted" />
                    <span>ESP8266 Sketch</span>
                  </div>
                  <button
                    onClick={() => handleCopy('esp8266', codeSnippets.esp8266Code)}
                    className="copy-btn"
                  >
                    {copiedState['esp8266'] ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                    <span>{copiedState['esp8266'] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre><code>{codeSnippets.esp8266Code}</code></pre>
              </div>
            )}
          </section>

          {/* Section 6: API Reference */}
          <section id="api-reference" className="docs-section glass-panel">
            <h2>6. Gateway API Reference</h2>
            <p>
              The IoT Gateway hosts REST API endpoints on port <code>5002</code> for administration, automation, and command dispatch.
            </p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Route</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge-post">POST</span></td>
                  <td><code>/api/devices/register</code></td>
                  <td>Register a new hardware node (generate custom secret key)</td>
                </tr>
                <tr>
                  <td><span className="badge-get">GET</span></td>
                  <td><code>/api/devices</code></td>
                  <td>Get list of all devices, current statuses (online/offline) and last seen metrics</td>
                </tr>
                <tr>
                  <td><span className="badge-post">POST</span></td>
                  <td><code>/api/devices/:deviceId/command</code></td>
                  <td>Dispatch a command payload to trigger device actuators via MQTT</td>
                </tr>
                <tr>
                  <td><span className="badge-post">POST</span></td>
                  <td><code>/api/devices/:deviceId/ota</code></td>
                  <td>Prepare an Over-The-Air firmware update notification for a device</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 7: MQTT Topic Specs */}
          <section id="mqtt-topics" className="docs-section glass-panel" style={{ marginBottom: 0 }}>
            <h2>7. MQTT Topic Specs</h2>
            <p>
              For custom setups, you can connect devices using standard MQTT clients (e.g. PubSubClient) by adhering to this topic convention:
            </p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Topic Pattern</th>
                  <th>Role</th>
                  <th>Example Payload</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/telemetry</code></td>
                  <td>Publish sensor telemetry streams</td>
                  <td><code>{"{\"streamKey\": \"value\", \"value\": 24.5}"}</code></td>
                </tr>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/status</code></td>
                  <td>Publish connection state (retain=true)</td>
                  <td><code>"online"</code> or <code>"offline"</code></td>
                </tr>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/command</code></td>
                  <td>Subscribe to incoming system commands</td>
                  <td><code>{"{\"action\": \"toggle\", \"value\": true}"}</code></td>
                </tr>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/heartbeat</code></td>
                  <td>Publish diagnostic keep-alive status</td>
                  <td><code>{"{\"rssi\": -55, \"battery\": 98, \"uptime\": 3600}"}</code></td>
                </tr>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/logs</code></td>
                  <td>Publish device console messages</td>
                  <td><code>"[SYS] Log message"</code></td>
                </tr>
                <tr>
                  <td><code>iot/device/{"{deviceId}"}/ota</code></td>
                  <td>Subscribe to OTA firmware updates</td>
                  <td><code>{"{\"action\": \"ota_prepare\", \"version\": \"1.0.1\", \"downloadUrl\": \"http://...\"}"}</code></td>
                </tr>
              </tbody>
            </table>
          </section>

        </main>
      </div>
    </div>
  );
}
