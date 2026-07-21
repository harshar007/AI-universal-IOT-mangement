#ifndef NEXUS_LED_H
#define NEXUS_LED_H

#include "NexusSimple.h"

class NexusLED {
private:
    int _pin;
public:
    NexusLED(int pin) : _pin(pin) {}
    
    void on() {
        Nexus.virtualWrite(_pin, 255);
    }
    
    void off() {
        Nexus.virtualWrite(_pin, 0);
    }
    
    void setColor(const char* hexColor) {
        char buffer[32];
        snprintf(buffer, sizeof(buffer), "COLOR:%s", hexColor);
        Nexus.virtualWrite(_pin, buffer);
    }
};

#endif // NEXUS_LED_H
