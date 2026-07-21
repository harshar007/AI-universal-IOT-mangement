#ifndef NEXUS_LCD_H
#define NEXUS_LCD_H

#include "NexusSimple.h"

class NexusLCD {
private:
    int _pin;
public:
    NexusLCD(int pin) : _pin(pin) {}
    
    void clear() {
        Nexus.virtualWrite(_pin, "CLR");
    }
    
    void print(int col, int row, const char* str) {
        char buffer[64];
        snprintf(buffer, sizeof(buffer), "LCD:%d:%d:%s", col, row, str);
        Nexus.virtualWrite(_pin, buffer);
    }
};

#endif // NEXUS_LCD_H
