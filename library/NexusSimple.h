#ifndef NEXUS_SIMPLE_H
#define NEXUS_SIMPLE_H

#include <Arduino.h>

// Virtual Pin constants
#define V0 0
#define V1 1
#define V2 2
#define V3 3
#define V4 4
#define V5 5
#define V6 6
#define V7 7
#define V8 8
#define V9 9
#define V10 10
#define V11 11
#define V12 12
#define V13 13
#define V14 14
#define V15 15

// Parameter parser helper class
class NexusParam {
private:
    const char* _val;
public:
    NexusParam(const char* val) : _val(val) {}
    int asInt() const { return _val ? atoi(_val) : 0; }
    float asFloat() const { return _val ? atof(_val) : 0.0; }
    double asDouble() const { return _val ? atof(_val) : 0.0; }
    const char* asStr() const { return _val ? _val : ""; }
};

// Callback function type definition
typedef void (*NexusWriteHandler)(NexusParam param);

// Macro for virtual pin write handlers
#define NEXUS_WRITE(pin) \
    void NexusWriteHandler_##pin(NexusParam param); \
    struct NexusRegister_##pin { \
        NexusRegister_##pin() { \
            extern void registerNexusHandler(int pin, NexusWriteHandler handler); \
            registerNexusHandler(pin, NexusWriteHandler_##pin); \
        } \
    } nexus_register_##pin; \
    void NexusWriteHandler_##pin(NexusParam param)

// Main class definition
class NexusClass {
private:
    const char* _authToken;
    const char* _ssid;
    const char* _pass;
    bool _connected;
    unsigned long _lastHeartbeat;

public:
    NexusClass();
    void begin(const char* auth, const char* ssid, const char* pass);
    void run();
    void virtualWrite(int pin, int value);
    void virtualWrite(int pin, float value);
    void virtualWrite(int pin, const char* value);
    bool connected() const { return _connected; }
};

extern NexusClass Nexus;

#endif // NEXUS_SIMPLE_H
