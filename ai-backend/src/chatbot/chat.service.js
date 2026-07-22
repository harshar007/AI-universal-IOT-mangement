const ollamaClient = require('./ollama.client');
const chatPrompt = require('./chat.prompt');
const { pool } = require('../config/db');

const processMessage = async (userId, userText) => {
  // Format history for Ollama chat by querying DB
  const queryText = `
    SELECT id, sender, text 
    FROM chat_messages 
    WHERE user_id = $1 
    ORDER BY timestamp ASC
  `;
  const dbRes = await pool.query(queryText, [String(userId)]);
  const messages = dbRes.rows;

  const ollamaMessages = [
    { role: 'system', content: chatPrompt.getSystemPrompt() }
  ];
  
  // Add conversation history
  messages.forEach(msg => {
    ollamaMessages.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });
  
  // Add latest user message
  ollamaMessages.push({ role: 'user', content: userText });
  
  let chatResponse = null;
  let useFallback = false;
  
  try {
    const responseText = await ollamaClient.generateChatResponse(ollamaMessages);
    chatResponse = JSON.parse(responseText);
  } catch (err) {
    console.warn('Ollama request failed or JSON parsing failed. Invoking rule-based offline fallback...');
    useFallback = true;
  }
  
  if (useFallback || !chatResponse) {
    chatResponse = getFallbackResponse(userText);
  }
  
  // Save user message to database
  await pool.query(
    'INSERT INTO chat_messages (user_id, sender, text, commands) VALUES ($1, $2, $3, $4)',
    [String(userId), 'user', userText, '[]']
  );
  
  // Save AI message to database
  const replyText = chatResponse.reply || chatResponse.text || 'I processed your command.';
  const commandsJson = JSON.stringify(chatResponse.commands || []);
  const insertRes = await pool.query(
    'INSERT INTO chat_messages (user_id, sender, text, commands) VALUES ($1, $2, $3, $4) RETURNING id, timestamp',
    [String(userId), 'ai', replyText, commandsJson]
  );
  const newRow = insertRes.rows[0];
  
  const aiMsg = {
    id: String(newRow.id),
    sender: 'ai',
    text: replyText,
    timestamp: new Date(newRow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    commands: chatResponse.commands || [],
    logs: chatResponse.logs || []
  };
  
  return {
    conversationId: String(userId),
    message: aiMsg
  };
};

const getFallbackResponse = (text) => {
  const lowerText = text.toLowerCase();
  let reply = '';
  let commands = [];
  let logs = [];
  
  if (lowerText.includes('install') || lowerText.includes('setup') || lowerText.includes('getting started') || lowerText.includes('platformio') || lowerText.includes('arduino')) {
    reply = `### Getting Started: Nexus C++ Library Installation (Offline Fallback)

To install the Nexus C++ Library on your development machine:

#### 1. Arduino IDE
1. Open the **Arduino IDE**.
2. Go to **Sketch** > **Include Library** > **Manage Libraries...**
3. Search for **"Nexus"** and click **Install**.

#### 2. PlatformIO
Add the following line to your \`platformio.ini\` project configuration file:
\`\`\`ini
lib_deps =
    Nexus
\`\`\`

#### Platform Architecture:
The library uses an event-driven, non-blocking model. Initialize WiFi and connect your ESP32/ESP8266 to your custom dashboard:
\`\`\`cpp
#include <WiFi.h>
#include <NexusSimpleEsp32.h> // Use NexusSimpleEsp8866.h for ESP8266

char auth[] = "YOUR_NEXUS_AUTH_TOKEN";
char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  Nexus.begin(auth, ssid, pass);
}

void loop() {
  Nexus.run();
}
\`\`\``;
    logs = [
      'NEXUS_DOCS: Fetching "Getting Started" installation guide.',
      'SYSTEM: Installation example generated.'
    ];
  } else if (lowerText.includes('mqtt') || lowerText.includes('protocol') || lowerText.includes('latency') || lowerText.includes('performance') || lowerText.includes('footprint') || lowerText.includes('ram') || lowerText.includes('flash')) {
    reply = `### Nexus C++ Library: Protocol & Performance (Offline Fallback)

#### 📡 MQTT Connection Protocol
Unlike traditional HTTP polling, the Nexus library utilizes **MQTT (Message Queuing Telemetry Transport)**. This enables:
- **Persistent, lightweight, and bidirectional connection** with the dashboard.
- **Sub-100ms latency** for immediate sensor feedback and actuator triggering.
- Minimal overhead, optimal for cellular or low-bandwidth connections.

#### ⚡ Footprint & Resource Optimization
The library is engineered from the ground up for devices with restricted memory profiles like the ESP8266 (82KB RAM) and ESP32:
- **Zero dynamic memory allocation (no malloc/free)** after initialization to prevent memory fragmentation.
- **Minimal RAM/Flash footprint** leaving more room for your application code.
- Efficient buffer serialization for custom sensor payloads.`;
    logs = [
      'NEXUS_DOCS: Fetching "Protocol and Performance" technical specifications.'
    ];
  } else if (lowerText.includes('virtual pin') || lowerText.includes('virtualpin') || lowerText.includes('nexus_write') || lowerText.includes('virtualwrite') || lowerText.includes('blynk')) {
    reply = `### Core Concepts: Blynk-style Virtual Pins & Event Macros (Offline Fallback)

Virtual Pins act as logical channels to send and receive arbitrary data between your ESP32/ESP8266 hardware and your fully customizable Nexus Dashboard. Developers can map widgets dynamically on the dashboard to any virtual pin.

#### 1. Writing to Dashboard (Hardware to Cloud)
Use \`Nexus.virtualWrite(pin, value)\` to update custom developer-defined widgets (like gauges, charts, or value displays) on the dashboard:
\`\`\`cpp
// Send temperature reading to Virtual Pin V5
float temp = readTemperature();
Nexus.virtualWrite(V5, temp);
\`\`\`

#### 2. Reading from Dashboard (Cloud to Hardware)
Use the \`NEXUS_WRITE(pin)\` macro to execute code when a user interacts with a custom widget on the dashboard (e.g. toggles a switch or slider):
\`\`\`cpp
// Executed automatically when Virtual Pin V2 changes on the dashboard
NEXUS_WRITE(V2) {
  int switchState = param.asInt(); // Get value as integer (0 or 1)
  digitalWrite(LED_BUILTIN, switchState); // Turn built-in LED on/off
  Serial.print("V2 pin state changed to: ");
  Serial.println(switchState);
}
\`\`\``;
    logs = [
      'NEXUS_DOCS: Fetching "Core Concepts: Virtual Pins" developer guide.'
    ];
  } else if (lowerText.includes('timer') || lowerText.includes('nexustimer') || lowerText.includes('non-blocking') || lowerText.includes('delay')) {
    reply = `### Advanced Features: Non-Blocking Architecture & NexusTimer (Offline Fallback)

Using \`delay()\` in your microcontroller code freezes execution, causing MQTT keep-alive handshakes to time out and disconnect. Nexus uses an internal non-blocking state machine.

#### Using NexusTimer
\`NexusTimer\` allows you to schedule periodic functions safely without using blocking code:
\`\`\`cpp
#include <NexusSimpleEsp32.h>

NexusTimer timer;

// Define a function to read sensors safely
void sendSensorData() {
  float humidity = readHumidity();
  Nexus.virtualWrite(V4, humidity);
}

void setup() {
  Nexus.begin(auth, ssid, pass);
  
  // Set timer to call sendSensorData() every 2000 milliseconds (2 seconds)
  timer.setInterval(2000L, sendSensorData);
}

void loop() {
  Nexus.run();
  timer.run(); // Run the timer engine in the main loop
}
\`\`\``;
    logs = [
      'NEXUS_DOCS: Fetching "Advanced Features: NexusTimer" developer guide.'
    ];
  } else if (lowerText.includes('widget') || lowerText.includes('lcd') || lowerText.includes('led') || lowerText.includes('hardware')) {
    reply = `### Hardware Widgets: Custom Dashboard UI Integration (Offline Fallback)

The Nexus C++ library is a developer-customizable Blynk-style IoT workspace. Instead of hardcoding widgets for a fixed home application product, developers add their own custom widgets on the dashboard and bind them to Virtual Pins.

You can control rich graphical dashboard components directly from your C++ firmware using specialized wrapper classes:

#### 1. NexusLED Class
Provides programmatic control over virtual indicator lights you place on the dashboard:
\`\`\`cpp
NexusLED statusLED(V10); // Bind to Virtual Pin V10

void checkSystemStatus() {
  if (systemOk) {
    statusLED.on(); // Turn indicator ON
    statusLED.setColor("#00FF00"); // Set indicator color to Green
  } else {
    statusLED.blink(500, 500); // Blink every 500ms
    statusLED.setColor("#FF0000"); // Set indicator color to Red
  }
}
\`\`\`

#### 2. NexusLCD Class
Simulates a character LCD (e.g. 16x2) widget added to the dashboard screen:
\`\`\`cpp
NexusLCD lcd(V11); // Bind to Virtual Pin V11

void displayInfo() {
  lcd.clear();
  lcd.print(0, 0, "System Online"); // Print on first row, first column
  lcd.print(0, 1, "Temp: 24.5C");   // Print on second row
}
\`\`\``;
    logs = [
      'NEXUS_DOCS: Fetching "Hardware Widgets" API guidelines.'
    ];
  } else if (lowerText.includes('nexus') || lowerText.includes('library') || lowerText.includes('c++') || lowerText.includes('concept') || lowerText.includes('documentation') || lowerText.includes('docs')) {
    reply = `### Nexus IoT C++ Library Overview (Offline Fallback)

The **Nexus C++ Library** is an open-source, non-blocking bridge designed specifically for **ESP32 and ESP8266 microcontrollers** to connect physical hardware sensors/actuators to the customizable Nexus Web Dashboard.

#### 🚀 Key Features:
- **MQTT Protocol**: Persistent, lightweight, bidirectional connection with sub-100ms latency.
- **Resource Optimized**: Low RAM/Flash usage with no memory leaks or fragmentation.
- **Non-Blocking**: Powered by state machines; communication does not halt your loop.
- **Blynk-style Customization**: Developers customize and design their own dashboard widgets, binding them to Blynk-style virtual pins (\`NEXUS_WRITE\` & \`Nexus.virtualWrite\`).

#### 📖 Documentation Structure:
1. **Getting Started**: Introduction, Platform Architecture, Installation (Arduino/PlatformIO).
2. **Core Concepts**: Device Initialization, Blynk-style Virtual Pin Logic, Event Macros.
3. **Advanced Features**: \`NexusTimer\`, Command Batching, RTC Synchronization, System Events.
4. **Hardware Widgets**: Custom widget binding (Sliders, Buttons, Displays) and helper classes (\`NexusLCD\`, \`NexusLED\`).`;
    logs = [
      'NEXUS_DOCS: Fetching Nexus C++ Library overview documentation.'
    ];
  } else {
    reply = `I analyzed your request: "${text}". The AI Core is currently operating in offline mode. Please ensure the local Ollama service (tinyllama) is active to answer arbitrary questions. 

You can also ask me about the Nexus C++ Library, such as:
- How to **install** it
- How **MQTT protocol** improves latency
- How Blynk-style **virtual pins** work
- How to write non-blocking code using **NexusTimer**
- How to display data on custom developer-defined **widgets** (like LCD or LED) (Offline Fallback)`;
    logs = [
      'PARSER: Offline fallback active.'
    ];
  }
  
  return { reply, commands, logs };
};

module.exports = {
  processMessage
};
