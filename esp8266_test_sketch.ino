#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================================
// 1. CONFIGURATION (Fully Configured with your Wi-Fi & Device Credentials)
// ==========================================================
const char* ssid          = "Asianet-HARSHAR-2G"; // Your Wi-Fi SSID
const char* password      = "Harshar@90";          // Your Wi-Fi Password
const char* mqtt_server   = "192.168.1.36";        // Your PC IPv4 Address
const int   mqtt_port     = 1883;

// Credentials from your Device Registration:
const char* mqtt_client_id = "custom-board-1789045698002";
const char* mqtt_user      = "custom-board-1789045698002";
const char* mqtt_password  = "883d3866aad5b464a08ba8a09e8a09af3dcc938b3ba7bef5";

// ==========================================================
// MQTT Clients and Topics
// ==========================================================
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

char telemetryTopic[128];
char statusTopic[128];
char commandTopic[128];
char heartbeatTopic[128];

// ==========================================================
// WIFI SETUP
// ==========================================================
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Wi-Fi connected successfully!");
  Serial.print("ESP8266 IP Address: ");
  Serial.println(WiFi.localIP());
}

// ==========================================================
// MQTT INCOMING COMMAND CALLBACK (LIGHT ON / OFF CONTROL)
// ==========================================================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Command received on topic [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String messageTemp;
  for (unsigned int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  Serial.println(messageTemp);

  // Parse command JSON payload, e.g. {"action":"toggle", "value":1}
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, messageTemp);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  int value = 0;
  if (doc.containsKey("value")) {
    value = doc["value"];
  } else if (doc.containsKey("state")) {
    String st = doc["state"].as<String>();
    st.toLowerCase();
    if (st == "on" || st == "true" || st == "1") value = 1;
  } else if (doc.containsKey("action")) {
    const char* act = doc["action"];
    if (strcmp(act, "on") == 0) value = 1;
  }

  // Toggle built-in LED
  // On ESP8266: LOW turns LED ON, HIGH turns LED OFF
  if (value == 1) {
    digitalWrite(LED_BUILTIN, LOW);  // TURN LIGHT ON
    Serial.println("💡 BUILT-IN LIGHT IS NOW: ON");
  } else {
    digitalWrite(LED_BUILTIN, HIGH); // TURN LIGHT OFF
    Serial.println("🌑 BUILT-IN LIGHT IS NOW: OFF");
  }

  // Send Response payload back to the gateway
  char responseTopic[128];
  snprintf(responseTopic, sizeof(responseTopic), "iot/device/%s/response", mqtt_client_id);
  
  StaticJsonDocument<128> responseDoc;
  responseDoc["status"] = "success";
  responseDoc["lightState"] = (value == 1) ? "ON" : "OFF";
  
  char responseBuffer[128];
  serializeJson(responseDoc, responseBuffer);
  client.publish(responseTopic, responseBuffer);
}

// ==========================================================
// MQTT RECONNECTION LOOP
// ==========================================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to Nunnarri MQTT Broker...");
    
    // Connect using deviceId as Client ID, Username, and Password
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password, statusTopic, 1, true, "offline")) {
      Serial.println("connected!");
      
      // Publish "online" status (retains online status on broker)
      client.publish(statusTopic, "online", true);
      
      // Subscribe to receive light commands from the Web Dashboard
      client.subscribe(commandTopic);
      Serial.print("Subscribed to topic: ");
      Serial.println(commandTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ==========================================================
// SETUP RUNTIME
// ==========================================================
void setup() {
  Serial.begin(115200);
  
  // Setup built-in LED pin
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // Start with light OFF (HIGH)

  // Dynamically generate topic strings
  snprintf(telemetryTopic, sizeof(telemetryTopic), "iot/device/%s/telemetry", mqtt_client_id);
  snprintf(statusTopic, sizeof(statusTopic), "iot/device/%s/status", mqtt_client_id);
  snprintf(commandTopic, sizeof(commandTopic), "iot/device/%s/command", mqtt_client_id);
  snprintf(heartbeatTopic, sizeof(heartbeatTopic), "iot/device/%s/heartbeat", mqtt_client_id);

  setup_wifi();
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ==========================================================
// MAIN RECURRING LOOP
// ==========================================================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Send heartbeat ping every 10 seconds to maintain online status
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    client.publish(heartbeatTopic, "ping");
  }
}
