export const allPrompts = [
  {
    name: 'diagnose_iot_device',
    description: 'Provide an end-to-end diagnostic evaluation of an IoT device, analyzing its telemetry stream, error logs, and connectivity.',
    arguments: [
      {
        name: 'deviceId',
        description: 'The ID of the IoT device to diagnose (e.g. "esp32-main-board")',
        required: true
      }
    ],
    handler: async (args) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please perform an in-depth diagnostic analysis for the IoT device "${args.deviceId}".

Steps to execute:
1. Use the "get_device" tool to fetch its connection status and latest telemetry.
2. Use the "get_device_logs" tool for "${args.deviceId}" to review any warnings or errors.
3. Use the "get_device_telemetry" tool to inspect recent sensor trends.
4. Synthesize your findings into a clear diagnostic report with:
   - Device Operational State (Online / Stale / Offline)
   - Sensor Readings summary and sanity check
   - Identified Errors or Anomalies
   - Recommended Maintenance or Configuration Actions (e.g. virtual pin tweaks, reboot, or threshold adjustments).`
            }
          }
        ]
      };
    }
  },

  {
    name: 'smart_actuator_copilot',
    description: 'Assist in converting human natural language requests into precise Virtual Pin and MQTT actuator commands.',
    arguments: [
      {
        name: 'userCommand',
        description: 'The user natural language request (e.g. "Turn off all relays and set living room HVAC pin V3 to 22")',
        required: true
      }
    ],
    handler: async (args) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are the Nunnarri (நுண்ணறி) Smart Actuator & Virtual Pin Copilot.

The user asked: "${args.userCommand}"

Follow these guidelines:
1. Use "list_devices" to identify target devices in the system.
2. Map the request to appropriate tools:
   - "set_virtual_pin" for Blynk-style Virtual Pins (V0-V255).
   - "send_device_command" for generic actuator triggers ("toggle", "setValue", "reboot").
3. Execute the necessary tool calls.
4. Provide a friendly, clear confirmation message explaining what actions were dispatched to hardware.`
            }
          }
        ]
      };
    }
  },

  {
    name: 'iot_environmental_audit',
    description: 'Perform a comprehensive environmental safety audit across all telemetry sensors in the facility.',
    arguments: [],
    handler: async () => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please run an environmental safety audit for the entire Nunnarri IoT deployment.

Steps:
1. Call "analyze_anomalies" to detect any temperature spikes (>40°C), dangerous AQI (>300), or offline nodes.
2. Call "list_alert_rules" and "get_alerts_history" to review configured safety limits and recent threshold breaches.
3. Summarize overall environmental safety status, highlight any immediate hazards, and suggest automated safety rule improvements.`
            }
          }
        ]
      };
    }
  }
];

export default allPrompts;
