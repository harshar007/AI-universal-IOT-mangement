#include "NexusSimple.h"

// In-memory array to store virtual pin handlers
NexusWriteHandler pinHandlers[16] = { NULL };

void registerNexusHandler(int pin, NexusWriteHandler handler) {
    if (pin >= 0 && pin < 16) {
        pinHandlers[pin] = handler;
    }
}

NexusClass::NexusClass() : _authToken(NULL), _ssid(NULL), _pass(NULL), _connected(false), _lastHeartbeat(0) {}

void NexusClass::begin(const char* auth, const char* ssid, const char* pass) {
    _authToken = auth;
    _ssid = ssid;
    _pass = pass;
    
    Serial.println("[NEXUS] Starting Nexus IoT Client...");
    Serial.print("[NEXUS] Connecting to SSID: ");
    Serial.println(_ssid);
    
    // Simulate connection delay/sequence
    delay(500);
    Serial.println("[NEXUS] WiFi connected successfully.");
    Serial.print("[NEXUS] Local IP: ");
    Serial.println("192.168.1.150");
    
    Serial.println("[NEXUS] Authenticating with Nexus Gateway server...");
    delay(500);
    _connected = true;
    _lastHeartbeat = millis();
    Serial.println("[NEXUS] Connection established! Heartbeat OK.");
}

void NexusClass::run() {
    if (!_connected) return;
    
    unsigned long now = millis();
    // Send periodic heartbeats every 10 seconds
    if (now - _lastHeartbeat >= 10000L) {
        _lastHeartbeat = now;
        Serial.println("[NEXUS] Sending Keep-Alive Heartbeat -> iot/device/heartbeat");
    }
}

void NexusClass::virtualWrite(int pin, int value) {
    if (!_connected) return;
    Serial.print("[NEXUS] virtualWrite V");
    Serial.print(pin);
    Serial.print(" = ");
    Serial.println(value);
}

void NexusClass::virtualWrite(int pin, float value) {
    if (!_connected) return;
    Serial.print("[NEXUS] virtualWrite V");
    Serial.print(pin);
    Serial.print(" = ");
    Serial.println(value);
}

void NexusClass::virtualWrite(int pin, const char* value) {
    if (!_connected) return;
    Serial.print("[NEXUS] virtualWrite V");
    Serial.print(pin);
    Serial.print(" = ");
    Serial.println(value);
}

// Global instance definition
NexusClass Nexus;
