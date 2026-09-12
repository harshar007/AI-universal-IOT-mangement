#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>
#include <SPI.h>
#include <MFRC522.h>

// ============================================================
// ROUTE-LIVE TRANSIT FLEET SYSTEM — ESP8266 DUAL WEB SERVER + MQTT
// ============================================================

// ============================================================
// 1. PIN CONFIGURATION
// ============================================================
#define PIN_LED_BLUE    D0  // GPIO16: Blue LED (WiFi Status)
#define PIN_LED_GREEN   D1  // GPIO5:  Green LED (Data/MQTT)
#define PIN_LED_RED     D2  // GPIO4:  Red LED (RC522 SS Shared)
#define PIN_LED_YELLOW  D7  // GPIO13: Yellow LED
#define PIN_BUZZER      D8  // GPIO15: Buzzer & Alarm Pin

#define RFID_SS_PIN     D2  // GPIO4:  RC522 Chip Select (SDA/SS)
#define RFID_RST_PIN    D3  // GPIO0:  RC522 Reset (RST)
#define GPS_RX_PIN      D4  // GPIO2:  NEO-6M GPS Module TX -> ESP RX

// ============================================================
// 2. NETWORK & MQTT CONFIGURATION
// ============================================================
const char* ssid          = "Asianet-HARSHAR-2G"; // Your Wi-Fi SSID
const char* password      = "Harshar@90";          // Your Wi-Fi Password
const char* mqtt_server   = "79.143.179.156";      // Production VPS Server IP
const int   mqtt_port     = 1883;

// Credentials from your registered device:
const char* mqtt_client_id = "custom-board-1789055577828";
const char* mqtt_user      = "custom-board-1789055577828";
const char* mqtt_password  = "e9e1778781e6f3716fa30fd8136ae0d15abebecc0cb555b5";

// Hardware Peripherals & Servers
WiFiClient espClient;
PubSubClient mqttClient(espClient);
ESP8266WebServer server(80);

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
SoftwareSerial gpsSerial(GPS_RX_PIN, -1);

// MQTT Topics
char telemetryTopic[128];
char statusTopic[128];
char commandTopic[128];
char heartbeatTopic[128];

// System State
struct GpsData {
  double  latitude       = 10.0159;
  double  longitude      = 76.3419;
  float   speedKmh       = 0.0;
  int     satellites     = 8;
  bool    isValid        = true;
};

GpsData currentGps;
String lastScannedRfid   = "NONE";
int    totalRfidScans    = 0;
unsigned long lastMsg     = 0;
unsigned long lastRfidScanTime = 0;

// ============================================================
// 3. HTML + CSS EMBEDDED WEBPAGE (PROGMEM)
// ============================================================
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nunnarri IoT ESP8266 Live Node</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: rgba(30, 41, 59, 0.7);
      --accent-blue: #38bdf8;
      --accent-green: #22c55e;
      --accent-yellow: #eab308;
      --accent-red: #ef4444;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body {
      background: linear-gradient(135deg, #090d16 0%, #0f172a 100%);
      color: var(--text-main);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 20px; }
    .header {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header h1 { font-size: 1.5rem; font-weight: 700; background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .status-badge {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 20px;
      background: rgba(34, 197, 94, 0.15); color: var(--accent-green); font-size: 0.85rem; font-weight: 600;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .status-dot { width: 8px; height: 8px; background: var(--accent-green); border-radius: 50%; box-shadow: 0 0 10px var(--accent-green); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    .card {
      background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .card-title { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600; }
    .card-val { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px; }
    .btn-group { display: flex; gap: 10px; margin-top: 15px; }
    .btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s ease; color: #fff; }
    .btn-blue { background: #0284c7; } .btn-blue:hover { background: #0369a1; }
    .btn-green { background: #16a34a; } .btn-green:hover { background: #15803d; }
    .btn-red { background: #dc2626; } .btn-red:hover { background: #b91c1c; }
    .btn:active { transform: scale(0.96); }
    .rfid-box {
      background: rgba(15, 23, 42, 0.6); border-radius: 12px; padding: 16px; font-family: monospace;
      font-size: 1.2rem; color: var(--accent-yellow); border: 1px dashed rgba(234, 179, 8, 0.4); text-align: center; margin-top: 10px;
    }
    footer { text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>⚡ Nunnarri IoT Node Dashboard</h1>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Device ID: <span>custom-board-1789055577828</span></p>
      </div>
      <div class="status-badge"><div class="status-dot"></div> <span id="mqttStatus">MQTT ONLINE</span></div>
    </div>

    <div class="grid">
      <!-- GPS Telemetry Card -->
      <div class="card">
        <div class="card-title">🛰️ GPS Coordinates</div>
        <div class="card-val" id="gpsCoords">10.0159, 76.3419</div>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px;">
          Speed: <strong id="gpsSpeed">0.0 km/h</strong> | Satellites: <strong id="gpsSats">8</strong>
        </p>
      </div>

      <!-- RFID Scanner Card -->
      <div class="card">
        <div class="card-title">💳 Last Scanned RFID Card</div>
        <div class="rfid-box" id="rfidUid">NONE</div>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px;">
          Total Scans: <strong id="rfidCount">0</strong>
        </p>
      </div>
    </div>

    <!-- Hardware Controls Card -->
    <div class="card">
      <div class="card-title">🎛️ Hardware Control (Web & MQTT Synced)</div>
      <div class="btn-group">
        <button class="btn btn-blue" onclick="controlPin('green', 1)">Green LED (D1) ON</button>
        <button class="btn btn-blue" style="background:#334155" onclick="controlPin('green', 0)">OFF</button>
      </div>
      <div class="btn-group">
        <button class="btn btn-green" onclick="controlPin('blue', 1)">Blue LED (D0) ON</button>
        <button class="btn btn-green" style="background:#334155" onclick="controlPin('blue', 0)">OFF</button>
      </div>
      <div class="btn-group">
        <button class="btn btn-red" onclick="controlPin('master', 1)">🚨 MASTER TRIGGER ALL ON</button>
        <button class="btn btn-red" style="background:#334155" onclick="controlPin('master', 0)">ALL OFF</button>
      </div>
    </div>

    <footer>
      Nunnarri Smart Intelligence IoT Platform &copy; Dual Web Server + MQTT Firmware
    </footer>
  </div>

  <script>
    async function updateData() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        document.getElementById('gpsCoords').innerText = data.lat.toFixed(4) + ", " + data.lng.toFixed(4);
        document.getElementById('gpsSpeed').innerText = data.speed + " km/h";
        document.getElementById('gpsSats').innerText = data.sats;
        document.getElementById('rfidUid').innerText = data.rfid || "NONE";
        document.getElementById('rfidCount').innerText = data.rfid_scans;
        document.getElementById('mqttStatus').innerText = data.mqtt ? "MQTT ONLINE" : "MQTT RETRYING";
      } catch (e) { console.error(e); }
    }

    async function controlPin(target, value) {
      try {
        await fetch(`/control?target=${target}&value=${value}`);
        updateData();
      } catch (e) { console.error(e); }
    }

    setInterval(updateData, 1500);
  </script>
</body>
</html>
)rawliteral";

// ============================================================
// 4. MQTT INCOMING COMMAND CALLBACK
// ============================================================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("MQTT Command received on topic [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String messageTemp;
  for (unsigned int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  Serial.println(messageTemp);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, messageTemp);
  if (error) return;

  int value = 0;
  if (doc.containsKey("value")) value = doc["value"];

  String target = "";
  if (doc.containsKey("target")) target = doc["target"].as<String>();
  else if (doc.containsKey("action")) target = doc["action"].as<String>();
  target.toLowerCase();

  // Execute Hardware Actions
  if (target.indexOf("green") >= 0 || target == "d1") {
    digitalWrite(PIN_LED_GREEN, value == 1 ? HIGH : LOW);
  } else if (target.indexOf("blue") >= 0 || target == "d0") {
    digitalWrite(PIN_LED_BLUE, value == 1 ? HIGH : LOW);
  } else if (target.indexOf("red") >= 0 || target == "d2") {
    digitalWrite(PIN_LED_RED, value == 1 ? HIGH : LOW);
  } else if (target.indexOf("yellow") >= 0 || target == "d7") {
    digitalWrite(PIN_LED_YELLOW, value == 1 ? HIGH : LOW);
  } else if (target.indexOf("buzzer") >= 0 || target == "d8") {
    if (value == 1) tone(PIN_BUZZER, 1000); else { noTone(PIN_BUZZER); digitalWrite(PIN_BUZZER, LOW); }
  } else {
    // MASTER TRIGGER ALL PINS
    digitalWrite(PIN_LED_GREEN, value == 1 ? HIGH : LOW);
    digitalWrite(PIN_LED_BLUE, value == 1 ? HIGH : LOW);
    digitalWrite(PIN_LED_RED, value == 1 ? HIGH : LOW);
    digitalWrite(PIN_LED_YELLOW, value == 1 ? HIGH : LOW);
    if (value == 1) tone(PIN_BUZZER, 1000, 300); else { noTone(PIN_BUZZER); digitalWrite(PIN_BUZZER, LOW); }
  }
}

// ============================================================
// 5. MQTT RECONNECTION LOOP
// ============================================================
void reconnectMQTT() {
  if (!mqttClient.connected()) {
    Serial.print("Connecting to Nunnarri Live Server MQTT Broker (79.143.179.156)...");
    if (mqttClient.connect(mqtt_client_id, mqtt_user, mqtt_password, statusTopic, 1, true, "offline")) {
      Serial.println("connected!");
      mqttClient.publish(statusTopic, "online", true);
      mqttClient.subscribe(commandTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
    }
  }
}

// ============================================================
// 6. HTTP ENDPOINTS FOR EMBEDDED WEB SERVER
// ============================================================
void handleRoot() {
  server.send(200, "text/html", INDEX_HTML);
}

void handleStatus() {
  String json = "{";
  json += "\"lat\":" + String(currentGps.latitude, 6) + ",";
  json += "\"lng\":" + String(currentGps.longitude, 6) + ",";
  json += "\"speed\":" + String(currentGps.speedKmh, 1) + ",";
  json += "\"sats\":" + String(currentGps.satellites) + ",";
  json += "\"rfid\":\"" + lastScannedRfid + "\",";
  json += "\"rfid_scans\":" + String(totalRfidScans) + ",";
  json += "\"mqtt\":" + String(mqttClient.connected() ? "true" : "false");
  json += "}";

  server.send(200, "application/json", json);
}

void handleControl() {
  if (server.hasArg("target") && server.hasArg("value")) {
    String target = server.arg("target");
    int value = server.arg("value").toInt();

    // Trigger local Hardware Callback
    StaticJsonDocument<128> doc;
    doc["target"] = target;
    doc["value"] = value;
    char buffer[128];
    serializeJson(doc, buffer);
    callback((char*)commandTopic, (byte*)buffer, strlen(buffer));

    // Also publish to MQTT broker so web dashboard stays in sync
    if (mqttClient.connected()) {
      char responseTopic[128];
      snprintf(responseTopic, sizeof(responseTopic), "iot/device/%s/response", mqtt_client_id);
      mqttClient.publish(responseTopic, buffer);
    }

    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing Arguments");
  }
}

// ============================================================
// 7. SETUP RUNTIME
// ============================================================
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_BLUE, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  snprintf(telemetryTopic, sizeof(telemetryTopic), "iot/device/%s/telemetry", mqtt_client_id);
  snprintf(statusTopic, sizeof(statusTopic), "iot/device/%s/status", mqtt_client_id);
  snprintf(commandTopic, sizeof(commandTopic), "iot/device/%s/command", mqtt_client_id);
  snprintf(heartbeatTopic, sizeof(heartbeatTopic), "iot/device/%s/heartbeat", mqtt_client_id);

  // Connect Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(300);
    Serial.print(".");
    attempts++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED_BLUE, HIGH);
    Serial.println("✅ [WiFi] Connected!");
    Serial.print("🌐 [Embedded Web Server URL]: http://");
    Serial.println(WiFi.localIP());
  }

  // Setup MQTT Client
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);

  // Setup HTTP Web Server Routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/control", handleControl);
  server.begin();

  // Initialize RFID Reader
  SPI.begin();
  rfid.PCD_Init();

  Serial.println("🚀 System Initialized: Web Server (Port 80) + MQTT Client (Port 1883) Active!");
}

// ============================================================
// 8. MAIN LOOP
// ============================================================
void loop() {
  // 1. Handle HTTP Requests for HTML Web Page
  server.handleClient();

  // 2. Maintain MQTT Connection
  if (!mqttClient.connected()) {
    static unsigned long lastMqttRetry = 0;
    if (millis() - lastMqttRetry > 5000) {
      lastMqttRetry = millis();
      reconnectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // 3. Scan RFID Cards
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    if (uid.length() > 0 && (uid != lastScannedRfid || (millis() - lastRfidScanTime >= 2000))) {
      lastScannedRfid = uid;
      lastRfidScanTime = millis();
      totalRfidScans++;

      tone(PIN_BUZZER, 1000, 500);
      Serial.println("💳 [RFID Scanned] Card UID: " + uid);

      // Send RFID scan event to MQTT
      if (mqttClient.connected()) {
        StaticJsonDocument<128> rfidDoc;
        rfidDoc["streamKey"] = "rfid_scan";
        rfidDoc["card_uid"] = uid;
        char rfidBuffer[128];
        serializeJson(rfidDoc, rfidBuffer);
        mqttClient.publish(telemetryTopic, rfidBuffer);
      }
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // 4. Send Periodic Telemetry & Heartbeat to MQTT every 10s
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;

    if (mqttClient.connected()) {
      mqttClient.publish(heartbeatTopic, "ping");

      StaticJsonDocument<256> doc;
      doc["streamKey"] = "telemetry";
      doc["lat"] = currentGps.latitude;
      doc["lng"] = currentGps.longitude;
      doc["speed"] = currentGps.speedKmh;
      doc["rfid_last"] = lastScannedRfid;

      char buffer[256];
      serializeJson(doc, buffer);
      mqttClient.publish(telemetryTopic, buffer);

      Serial.print("Published Telemetry to MQTT: ");
      Serial.println(buffer);
    }
  }
}
