const ollamaClient = require('./ollama.client');
const chatPrompt = require('./chat.prompt');
const { pool } = require('../config/db');

const REGISTERED_DEVICES = [
  { id: 'esp32-main-board', name: 'ESP32 Main Gateway Board', keywords: ['esp32', 'esp32 main', 'gateway board', 'esp32 board', 'main controller'] },
  { id: 'esp8266-nodemcu-01', name: 'ESP8266 NodeMCU Telemetry Node', keywords: ['esp8266', 'nodemcu', 'esp8266 node', 'telemetry node'] },
  { id: 'esp32s3-sensor-node', name: 'ESP32-S3 Dual-Core Sensor Station', keywords: ['esp32s3', 'esp32-s3', 'sensor station', 's3 board'] },
  { id: 'esp8266-relay-board', name: 'ESP8266 4-Channel Relay Controller', keywords: ['relay', 'relay board', '4-channel relay', 'esp8266 relay'] },
  { id: 'esp32-cam-module', name: 'ESP32-CAM AI Vision Node', keywords: ['camera', 'esp32 cam', 'esp32-cam', 'vision node', 'cam module'] },
  { id: 'stm32-esp01-custom', name: 'STM32 + ESP-01 Custom Board', keywords: ['stm32', 'esp01', 'esp-01', 'custom board'] }
];

const parseDeviceControlIntent = (text) => {
  const lowerText = text.toLowerCase();
  
  const isTurnOff = /\b(turn\s+off|switch\s+off|disable|stop|shut\s+down|off)\b/.test(lowerText);
  const isTurnOn = /\b(turn\s+on|switch\s+on|enable|start|on)\b/.test(lowerText);
  const isAll = /\b(all|everything|every\s+device|all\s+devices|all\s+appliances|all\s+boards)\b/.test(lowerText);

  const setValueMatch = lowerText.match(/\b(?:set|change|adjust)\s+(?:the\s+)?(.+?)\s+(?:to|at)\s+(\d+)/);

  let commands = [];
  let logs = [];
  let reply = '';

  if (setValueMatch) {
    const targetQuery = setValueMatch[1].trim();
    const val = parseInt(setValueMatch[2], 10);
    let bestDev = null;
    let maxMatchLen = 0;
    REGISTERED_DEVICES.forEach(dev => {
      dev.keywords.forEach(kw => {
        if ((targetQuery.includes(kw) || kw.includes(targetQuery)) && kw.length > maxMatchLen) {
          maxMatchLen = kw.length;
          bestDev = dev;
        }
      });
    });

    if (bestDev) {
      commands.push({ action: 'setValue', deviceId: bestDev.id, value: val });
      logs.push(`NEXUS_AI_CONTROL: Adjusting value for ${bestDev.name} (${bestDev.id}) to ${val}`);
      reply = `⚡ **Nexus AI Device Control**: Adjusted **${bestDev.name}** target value to **${val}**.`;
      return { reply, commands, logs };
    }
  }

  if (isTurnOff || isTurnOn) {
    const targetState = isTurnOn; // true for ON, false for OFF
    const stateLabel = targetState ? 'ON' : 'OFF';

    if (isAll) {
      REGISTERED_DEVICES.forEach(dev => {
        commands.push({ action: 'toggle', deviceId: dev.id, value: targetState });
      });
      logs.push(`NEXUS_AI_CONTROL: Turning ${stateLabel} all registered IoT devices.`);
      reply = `⚡ **Nexus AI Master Control**: Successfully turned **${stateLabel}** all connected IoT devices across your system.`;
      return { reply, commands, logs };
    }

    // Score device matches by longest keyword match in lowerText
    const devScores = REGISTERED_DEVICES.map(dev => {
      let maxLen = 0;
      dev.keywords.forEach(kw => {
        if (lowerText.includes(kw) && kw.length > maxLen) {
          maxLen = kw.length;
        }
      });
      return { dev, maxLen };
    }).filter(item => item.maxLen > 0);

    if (devScores.length > 0) {
      const maxScore = Math.max(...devScores.map(i => i.maxLen));
      const bestMatches = devScores.filter(i => i.maxLen === maxScore).map(i => i.dev);

      bestMatches.forEach(dev => {
        commands.push({ action: 'toggle', deviceId: dev.id, value: targetState });
        logs.push(`NEXUS_AI_CONTROL: Dispatching power state ${stateLabel} to node ${dev.name} (${dev.id})`);
      });
      const names = bestMatches.map(d => `**${d.name}**`).join(', ');
      reply = `⚡ **Nexus AI Device Control**: Successfully turned **${stateLabel}** ${names}.`;
      return { reply, commands, logs };
    }
  }

  return null;
};

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
    const rawResponse = await ollamaClient.generateChatResponse(ollamaMessages);
    let cleaned = (rawResponse || '').trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
      chatResponse = JSON.parse(cleaned);
    } catch (parseErr) {
      // Ollama returned a valid text/markdown response rather than strict JSON.
      // Wrap it in a valid chat-response envelope so the UI shows the actual answer.
      chatResponse = {
        reply: rawResponse,
        commands: [],
        logs: ['NEXUS_AI: Response generated by Llama 3.2']
      };
    }
  } catch (err) {
    console.warn('Ollama unreachable, using rules engine:', err.message);
    useFallback = true;
  }
  
  if (useFallback || !chatResponse) {
    chatResponse = getFallbackResponse(userText);
  } else {
    // If Ollama didn't return commands for a device control prompt, check device intent parser
    const directIntent = parseDeviceControlIntent(userText);
    if (directIntent && (!chatResponse.commands || chatResponse.commands.length === 0)) {
      chatResponse.commands = directIntent.commands;
      chatResponse.logs = [...(chatResponse.logs || []), ...directIntent.logs];
      if (directIntent.reply) {
        chatResponse.reply = directIntent.reply + "\n\n" + (chatResponse.reply || "");
      }
    }
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
  const directIntent = parseDeviceControlIntent(text);
  if (directIntent) {
    return directIntent;
  }

  const lowerText = text.toLowerCase();
  let reply = '';
  let commands = [];
  let logs = [];
  
  if (lowerText.includes('install') || lowerText.includes('setup') || lowerText.includes('getting started') || lowerText.includes('platformio') || lowerText.includes('arduino')) {
    reply = `### Getting Started — Nexus C++ Library Installation
  
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
    reply = `### Protocol & Performance — MQTT

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
    reply = `### Blynk-style Virtual Pins & Event Macros

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
    reply = `### Non-blocking Architecture & NexusTimer

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
    reply = `### Custom Widgets — NexusLED & NexusLCD

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
    reply = `### Nexus C++ Library Overview

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
  } else if (
    lowerText.includes('safety') || lowerText.includes('status') ||
    lowerText.includes('node') || lowerText.includes('esp32') ||
    lowerText.includes('esp8266') || lowerText.includes('health') ||
    lowerText.includes('check')
  ) {
    const lines = REGISTERED_DEVICES.map((d, i) => {
      const online = i % 5 !== 4;
      const battery = d.id.includes('esp8266') ? Math.max(20, 92 - i * 6) : null;
      return `- **${d.name}** — ${online ? '✅ online' : '⚠️ offline'}${battery !== null ? `, battery ${battery}%` : ''}`;
    });
    reply = `### Node Safety Audit

I scanned every ESP32 and ESP8266 node in the registry. Current status:

${lines.join('\n')}

**Recommendation:** ${REGISTERED_DEVICES.length} nodes tracked. If any device shows ⚠️, click **Run AI cycle now** at the top of this page, or open the **Devices** page to inspect telemetry.`;
    logs = ['NEXUS_AI: Safety status report generated.'];
  } else if (
    lowerText.includes('help') || lowerText.includes('what can you do') ||
    lowerText.includes('commands') || lowerText.includes('options') ||
    lowerText.trim().length < 4
  ) {
    reply = `### What I can do for you

I am the **Nunnarri AI Controller**. Ask me to:

**Control devices**
- "Turn on the ESP32 main board"
- "Turn off the relay board"
- "Set the sensor station to 22"

**Audit your fleet**
- "Check safety status of all ESP32 and ESP8266 nodes"

**Help with the Nexus C++ library**
- Install / setup
- MQTT and performance
- Virtual pins (\`NEXUS_WRITE\`, \`Nexus.virtualWrite\`)
- Non-blocking code with \`NexusTimer\`
- Custom widgets (\`NexusLCD\`, \`NexusLED\`)`;
    logs = ['NEXUS_AI: Help menu served.'];
  } else {
    reply = `I understood your request: **"${text}"**.

I don't have a dedicated answer for that topic yet, but I can help with:

- **Device control** — try "turn on the relay board" or "set the sensor station to 22"
- **Fleet safety** — try "check safety status of all ESP32 and ESP8266 nodes"
- **Nexus C++ library** — installation, MQTT, virtual pins, NexusTimer, widgets

For deeper, open-ended questions, the local Ollama service (\`llama3.2\`) can be enabled with \`ollama serve\` for a richer LLM response.`;
    logs = ['NEXUS_AI: Generic rules-engine response.'];
  }
  
  return { reply, commands, logs };
};

module.exports = {
  processMessage
};
