const assert = require('assert');
const http = require('http');

// Define Registered IoT Microcontroller Boards
const REGISTERED_DEVICES = [
  { id: 'esp32-main-board', name: 'ESP32 Main Gateway Board', keywords: ['esp32', 'esp32 main', 'gateway board', 'esp32 board', 'main controller'] },
  { id: 'esp8266-nodemcu-01', name: 'ESP8266 NodeMCU Telemetry Node', keywords: ['esp8266', 'nodemcu', 'esp8266 node', 'telemetry node'] },
  { id: 'esp32s3-sensor-node', name: 'ESP32-S3 Dual-Core Sensor Station', keywords: ['esp32s3', 'esp32-s3', 'sensor station', 's3 board'] },
  { id: 'esp8266-relay-board', name: 'ESP8266 4-Channel Relay Controller', keywords: ['relay', 'relay board', '4-channel relay', 'esp8266 relay'] },
  { id: 'esp32-cam-module', name: 'ESP32-CAM AI Vision Node', keywords: ['camera', 'esp32 cam', 'esp32-cam', 'vision node', 'cam module'] },
  { id: 'stm32-esp01-custom', name: 'STM32 + ESP-01 Custom Board', keywords: ['stm32', 'esp01', 'esp-01', 'custom board'] }
];

// Natural Language Intent Parser Function
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

// Execute Test Suite
function runDummyTestSuite() {
  console.log('----------------------------------------------------');
  console.log('🧪 RUNNING DUMMY TEST SUITE: NEXUS IOT BOARD CONTROL');
  console.log('----------------------------------------------------\n');

  let passed = 0;
  let failed = 0;

  function runTest(testName, fn) {
    try {
      fn();
      console.log(`  ✔ PASS: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`  ✘ FAIL: ${testName}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Turn off ESP32 Main Board
  runTest('Command "turn off esp32 main board" toggles esp32-main-board to false', () => {
    const result = parseDeviceControlIntent('turn off esp32 main board');
    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.commands.length, 1);
    assert.strictEqual(result.commands[0].deviceId, 'esp32-main-board');
    assert.strictEqual(result.commands[0].action, 'toggle');
    assert.strictEqual(result.commands[0].value, false);
  });

  // TEST 2: Turn on ESP8266 Relay Board
  runTest('Command "turn on esp8266 relay" toggles esp8266-relay-board to true', () => {
    const result = parseDeviceControlIntent('turn on esp8266 relay');
    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.commands.length, 1);
    assert.strictEqual(result.commands[0].deviceId, 'esp8266-relay-board');
    assert.strictEqual(result.commands[0].action, 'toggle');
    assert.strictEqual(result.commands[0].value, true);
  });

  // TEST 3: Set PWM duty cycle on ESP32
  runTest('Command "set esp32 duty cycle to 85" sets value 85 for esp32-main-board', () => {
    const result = parseDeviceControlIntent('set esp32 duty cycle to 85');
    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.commands.length, 1);
    assert.strictEqual(result.commands[0].deviceId, 'esp32-main-board');
    assert.strictEqual(result.commands[0].action, 'setValue');
    assert.strictEqual(result.commands[0].value, 85);
  });

  // TEST 4: Master Control - Turn off all boards
  runTest('Command "turn off all boards" toggles all 6 registered IoT boards to false', () => {
    const result = parseDeviceControlIntent('turn off all boards');
    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.commands.length, 6);
    result.commands.forEach(cmd => {
      assert.strictEqual(cmd.action, 'toggle');
      assert.strictEqual(cmd.value, false);
    });
  });

  // TEST 5: ESP32-CAM Vision Module Toggle
  runTest('Command "turn on esp32 cam" toggles esp32-cam-module to true', () => {
    const result = parseDeviceControlIntent('turn on esp32 cam');
    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.commands[0].deviceId, 'esp32-cam-module');
    assert.strictEqual(result.commands[0].value, true);
  });

  console.log('\n----------------------------------------------------');
  console.log(`📊 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------');
}

runDummyTestSuite();
