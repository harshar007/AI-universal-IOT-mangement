#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==========================================================
// 1. PIN DEFINITIONS AND DRIVER SETUP
// ==========================================================
#define DHTPIN D4         // DHT11 Data Pin connected to D4 (GPIO2)
#define DHTTYPE DHT11     // DHT 11
DHT dht(DHTPIN, DHTTYPE);

#define MQ135_PIN A0      // MQ135 Analog Pin connected to A0

// ==========================================================
// 2. CONFIGURATION: Update these settings
// ==========================================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "YOUR_SERVER_IP";
const int mqtt_port = 1883;

const char* mqtt_client_id = "sensor_station_01";
const char* mqtt_user = "esp8266";
const char* mqtt_password = "YOUR_MQTT_PASSWORD";

// ==========================================================
// 3. MQTT TOPICS
// ==========================================================
char telemetryTopic[64];
char statusTopic[64];
char commandTopic[64];
char heartbeatTopic[64];

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

// ==========================================================
// 4. WIFI SETUP
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
// 5. MQTT RECONNECTION
// ==========================================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    
    // Connect using mqtt_client_id, mqtt_user and mqtt_password
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_password, statusTopic, 1, true, "offline")) {
      Serial.println("connected!");
      
      // Publish "online" status (retains online status on broker)
      client.publish(statusTopic, "online", true);
      
      // Subscribe to command topic
      client.subscribe(commandTopic);
    } else {
      Serial.print("failed, status state = ");
      Serial.print(client.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// ==========================================================
// 6. INCOMING MQTT COMMANDS CALLBACK
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
  
  // Custom command logic can be processed here
}

// ==========================================================
// 7. SETUP ARDUINO RUNTIME
// ==========================================================
void setup() {
  Serial.begin(115200);
  
  // Initialize DHT11 sensor
  dht.begin();
  
  // Set MQ135 pin mode
  pinMode(MQ135_PIN, INPUT);

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
// 8. MAIN LOOP
// ==========================================================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Read sensors and publish telemetry every 10 seconds
  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;

    // A. Read DHT11 Temperature & Humidity
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    // B. Read MQ135 Air Quality PPM value
    int gasRaw = analogRead(MQ135_PIN);
    // Linear scale calibration: convert analog reading to estimated PPM value
    float ppm = gasRaw * 0.488; 

    // Check if sensor readings are valid
    if (isnan(temp) || isnan(hum)) {
      Serial.println("DHT11 sensor reading failed!");
      return;
    }

    Serial.printf("Temp: %.1f C | Humidity: %.1f %% | MQ135 PPM: %.1f\n", temp, hum, ppm);

    // C. Publish Temperature Telemetry
    StaticJsonDocument<128> tempDoc;
    tempDoc["streamKey"] = "temperature";
    tempDoc["value"] = temp;
    char tempBuffer[128];
    serializeJson(tempDoc, tempBuffer);
    client.publish(telemetryTopic, tempBuffer);

    // D. Publish Humidity Telemetry
    StaticJsonDocument<128> humDoc;
    humDoc["streamKey"] = "humidity";
    humDoc["value"] = hum;
    char humBuffer[128];
    serializeJson(humDoc, humBuffer);
    client.publish(telemetryTopic, humBuffer);

    // E. Publish Air Quality PPM Telemetry
    StaticJsonDocument<128> ppmDoc;
    ppmDoc["streamKey"] = "ppm";
    ppmDoc["value"] = ppm;
    char ppmBuffer[128];
    serializeJson(ppmDoc, ppmBuffer);
    client.publish(telemetryTopic, ppmBuffer);

    // F. Publish Heartbeat Ping
    client.publish(heartbeatTopic, "ping");
  }
}
