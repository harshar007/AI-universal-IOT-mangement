#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================================
// 1. CONFIGURATION: Update these settings
// ==========================================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_SERVER_IP";
const int mqtt_port = 1883;

const char* mqtt_client_id = "esp8266_node";
const char* mqtt_user = "esp8266";
const char* mqtt_password = "YOUR_MQTT_PASSWORD";

// ==========================================================
// MQTT Clients and Topics
// ==========================================================
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

char telemetryTopic[64];
char statusTopic[64];
char commandTopic[64];
char heartbeatTopic[64];

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
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ==========================================================
// MQTT INCOMING MESSAGE CALLBACK
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

  if (doc.containsKey("action")) {
    const char* action = doc["action"];
    int value = doc["value"];
    
    Serial.print("Action Target: ");
    Serial.println(action);
    
    if (strcmp(action, "toggle") == 0 || strcmp(action, "switch") == 0) {
      // Toggle built-in LED
      // Note: On NodeMCU/ESP8266, LOW turns the built-in LED ON, HIGH turns it OFF.
      digitalWrite(LED_BUILTIN, value == 1 ? LOW : HIGH); 
      Serial.print("LED state toggled to: ");
      Serial.println(value == 1 ? "ON" : "OFF");

      // Send Response payload back to the gateway
      char responseTopic[64];
      snprintf(responseTopic, sizeof(responseTopic), "iot/device/%s/response", mqtt_client_id);
      
      StaticJsonDocument<128> responseDoc;
      responseDoc["status"] = "success";
      responseDoc["message"] = "LED toggled successfully";
      
      char responseBuffer[128];
      serializeJson(responseDoc, responseBuffer);
      client.publish(responseTopic, responseBuffer);
    }
  }
}

// ==========================================================
// MQTT RECONNECTION LOOP
// ==========================================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to Nexus MQTT Broker...");
    
    // Connect using mqtt_client_id as Client ID, mqtt_user as Username, and mqtt_password as Password
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password, statusTopic, 1, true, "offline")) {
      Serial.println("connected!");
      
      // Publish "online" status (retains online status on broker)
      client.publish(statusTopic, "online", true);
      
      // Subscribe to receive commands from the Web Dashboard
      client.subscribe(commandTopic);
    } else {
      Serial.print("failed, connection status code = ");
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
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // Start with LED Off (HIGH)

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

  // Send periodic telemetry and heartbeat pings every 10 seconds
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;
    
    // 1. Publish Telemetry (Simulated Temperature sensor reading)
    StaticJsonDocument<128> doc;
    doc["streamKey"] = "temp";
    doc["value"] = 23.8 + random(-10, 10) / 10.0; // Simulated range 22.8°C - 24.8°C

    char telemetryBuffer[128];
    serializeJson(doc, telemetryBuffer);
    
    client.publish(telemetryTopic, telemetryBuffer);
    Serial.print("Published telemetry payload: ");
    Serial.println(telemetryBuffer);
    
    // 2. Publish Heartbeat Ping
    client.publish(heartbeatTopic, "ping");
  }
}
