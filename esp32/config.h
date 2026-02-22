// config.h for ESP32 MQTT Classroom Automation
// Edit these values for your WiFi and device configuration

#ifndef CONFIG_H
#define CONFIG_H

// WiFi/MQTT secrets are kept out of version control. Create `esp32/secrets.h`
// (ignored by git) and define WIFI_SSID, WIFI_PASSWORD, MQTT_USER,
// MQTT_PASSWORD and DEVICE_SECRET there. Example `esp32/secrets.h` is
// provided as a template in the repo.
#include "secrets.h"

// General firmware configuration
#define NUM_SWITCHES 6
#define MAX_COMMAND_QUEUE 16
#define MANUAL_DEBOUNCE_MS 50
#define WDT_TIMEOUT_MS 15000  // 15 seconds watchdog

// Bulk command timing (milliseconds)
// Stagger delay between relay switches during bulk commands to reduce inrush current
#define RELAY_SWITCH_STAGGER_MS 100
// Minimum cooldown between toggles of the same relay (prevents chattering)
#define RELAY_MIN_TOGGLE_MS 200

// MQTT Broker Configuration - Update this to match your network
#define MQTT_BROKER "172.16.3.171"     // Backend server IP
#define MQTT_PORT 1883                 // MQTT port

// MQTT topics
#define STATE_TOPIC "esp32/state"
#define SWITCH_TOPIC "esp32/switches"
#define CONFIG_TOPIC "esp32/config"
#define TELEMETRY_TOPIC "esp32/telemetry"

// MQTT client buffer size
#define MQTT_BUFFER_SIZE 1024

// Status topic and payloads (retained). Broker will hold retained 'online' or LWT 'offline'.
#define STATUS_TOPIC "esp32/status"
#define STATUS_ONLINE "online"
#define STATUS_OFFLINE "offline"
// Offline timeout (ms) used locally to mark device offline if no successful heartbeat
#define OFFLINE_TIMEOUT_MS 60000

// Status QoS for LWT and status publishes. Note: PubSubClient supports QoS for LWT
// during connect. Regular publish() QoS depends on the MQTT client library.
#define STATUS_QOS 1

// Aligned relay and manual switch pin mapping
// relayPins[i] corresponds to manualSwitchPins[i]
// Use `static` so including this header across multiple translation
// units does not create multiple-definition linker errors. These arrays
// are intentionally mutable because CONFIG messages can update GPIO mapping
// at runtime.
static int relayPins[NUM_SWITCHES] = {16, 17, 18, 19, 21, 22};
static int manualSwitchPins[NUM_SWITCHES] = {25, 26, 27, 32, 33, 23};
static int ledPins[NUM_SWITCHES] = {13, 14, 4, 5, 12, 15};  // LED indicators aligned with relays

// Status LED GPIO (used by blink_status.h). Set to a sensible default
// for most ESP32 dev boards; change if your board uses a different pin.
#define STATUS_LED_PIN 2

// LED Brightness Control (PWM)
// Range: 0-255 (0 = off, 255 = full brightness)
// Reduce this value to dim the LED. Try 20-50 for a softer glow.
#define LED_BRIGHTNESS 25

// Welcome Light on Boot - Disabled
// Enable welcome light sequence when device powers on
#define ENABLE_WELCOME_LIGHT false
// Mode 3: Chase effect - stylish staccato flashes like luxury car unlock
#define WELCOME_LIGHT_MODE 3
// Peak brightness during welcome sequence (0-255)
#define WELCOME_LIGHT_PEAK 200
// Duration of welcome sequence in milliseconds (3000 = 3 seconds)
#define WELCOME_LIGHT_DURATION 3000
// Duration of each flash (bright) and off phase in milliseconds
#define WELCOME_LIGHT_FLASH_ON 100   // 100ms bright
#define WELCOME_LIGHT_FLASH_OFF 100  // 100ms dark

// Relay configuration
#define RELAY_ACTIVE_HIGH false  // Set to true if relays are active HIGH, false if active LOW
#define MANUAL_ACTIVE_LOW true  // Set to true if manual switches are active LOW (pulled up), false if active HIGH

// If your manual switches use external pull-down resistors or need INPUT_PULLDOWN
// instead of the default INPUT_PULLUP, set this to true. Default false uses
// INPUT_PULLUP which is common for switches wired to ground (active low).
#define MANUAL_USE_INPUT_PULLDOWN false

// Enable verbose manual-switch diagnostics. Set to true only for debugging
// (will increase serial output). Default: false
#define DEBUG_MANUAL false
// GPIO Pin Usage Summary:
// Relays:         16, 17, 18, 19, 21, 22 (OUTPUT)
// LEDs:           13, 14, 4, 5, 12, 15 (OUTPUT - indicators)
// Manual Switches: 25, 26, 27, 32, 33, 23 (INPUT - INPUT_PULLUP supported)
// Status LED:     2 (OUTPUT - WiFi/MQTT status)
// Available:      34, 35, 36, 39 (input-only), 0 (strap pin), 1, 3 (UART)

#endif // CONFIG_H