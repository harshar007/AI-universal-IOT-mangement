#ifndef NEXUS_TIMER_H
#define NEXUS_TIMER_H

#include <Arduino.h>

class NexusTimer {
private:
    unsigned long _interval;
    void (*_callback)();
    unsigned long _lastTime;
    bool _enabled;

public:
    NexusTimer() : _interval(0), _callback(NULL), _lastTime(0), _enabled(false) {}
    
    void setInterval(unsigned long ms, void (*callback)()) {
        _interval = ms;
        _callback = callback;
        _lastTime = millis();
        _enabled = true;
    }
    
    void run() {
        if (!_enabled || !_callback) return;
        unsigned long now = millis();
        if (now - _lastTime >= _interval) {
            _lastTime = now;
            _callback();
        }
    }
    
    void disable() { _enabled = false; }
    void enable() { _enabled = true; }
};

#endif // NEXUS_TIMER_H
