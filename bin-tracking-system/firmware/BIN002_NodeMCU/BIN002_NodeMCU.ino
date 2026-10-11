/**
 * EcoTrack Smart Bin Tracker – BIN002 Firmware
 * Hardware: ESP8266 NodeMCU + HC-SR04 Ultrasonic Sensor
 *
 * Flow:
 *  1. Read HC-SR04 distance every 5 seconds.
 *  2. Calculate fill percentage using bin-specific calibration.
 *  3. Write distance (V0) and fill % (V1) to Blynk Cloud.
 *  4. POST distance + fill % to the EcoTrack backend (HTTP).
 *
 * Calibration (set to match your physical bin):
 *  BIN_EMPTY_DISTANCE_CM = distance (cm) when bin is completely empty
 *  BIN_FULL_DISTANCE_CM  = distance (cm) when bin is completely full
 *
 * IMPORTANT: Do NOT put real credentials in source control.
 * Use a credentials.h file (add to .gitignore) or the Blynk app config.
 */

#define BLYNK_TEMPLATE_ID   "TMPL3jfKO_EHy"
#define BLYNK_TEMPLATE_NAME "EcoTrack BIN002"
#define BLYNK_AUTH_TOKEN    "WSb0GD_9dtS8jY6qOYzuNQmgZyPp81K0"

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp8266.h>

// === Wi-Fi Credentials ===
// Replace with your actual Wi-Fi SSID and password.
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// === EcoTrack Backend ===
// Production Vercel URL - no trailing slash.
// For local dev, change to your LAN IP: http://192.168.x.x:5000
const char* BACKEND_URL = "https://YOUR_BACKEND.vercel.app";
const char* BIN_ID      = "BIN002";

// === HC-SR04 Wiring ===
const int TRIG_PIN = D6;   // GPIO 12
const int ECHO_PIN = D7;   // GPIO 13

// === BIN002 Distance Calibration (cm) ===
// Measure actual distances with the bin empty and full.
// emptyDistance ~ 60 cm  (sensor-to-bottom when nothing is in the bin)
// fullDistance  ~ 10 cm  (sensor-to-top of waste when bin is full)
const float BIN_EMPTY_DISTANCE_CM = 60.0;
const float BIN_FULL_DISTANCE_CM  = 10.0;

// === Blynk Virtual Pins ===
#define VPIN_DISTANCE    V0  // Distance in cm
#define VPIN_FILL        V1  // Fill percentage (0-100)

// === Timing ===
const unsigned long SENSOR_INTERVAL_MS  = 5000;  // Read every 5 s
const unsigned long HTTP_INTERVAL_MS    = 10000; // POST every 10 s (avoid flooding)
const unsigned long HTTP_TIMEOUT_MS     = 8000;  // HTTP request timeout
const int           HTTP_MAX_RETRIES    = 2;     // Retry failed POSTs once

// === State ===
unsigned long lastSensorRead   = 0;
unsigned long lastHttpPost     = 0;
float         lastDistance     = -1.0;
int           lastFillPercent  = -1;
bool          lastReadValid    = false;

BlynkTimer    timer;

// === HC-SR04: Read raw distance (cm) ===
float readDistanceCm() {
  // Send 10-us pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Receive echo - 30 ms timeout (~5 m max range)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return -1.0;  // No echo received

  float distCm = (float)duration * 0.034 / 2.0;

  // Reject physically implausible readings
  if (distCm < 2.0 || distCm > 400.0) return -1.0;
  return distCm;
}

// === Fill percentage from distance ===
int calcFillPercent(float distCm) {
  if (BIN_EMPTY_DISTANCE_CM <= BIN_FULL_DISTANCE_CM) return 0; // misconfigured
  float clamped = max(BIN_FULL_DISTANCE_CM, min(BIN_EMPTY_DISTANCE_CM, distCm));
  float fill = ((BIN_EMPTY_DISTANCE_CM - clamped) /
                (BIN_EMPTY_DISTANCE_CM - BIN_FULL_DISTANCE_CM)) * 100.0;
  return (int)constrain(fill, 0.0, 100.0);
}

// === HTTP POST to EcoTrack backend ===
bool postToBackend(float distCm, int fillPercent) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected - skipping POST");
    return false;
  }

  String url = String(BACKEND_URL) + "/admin/bins/" + String(BIN_ID) + "/sensor";
  String payload = "{\"distance\":" + String(distCm, 1) +
                   ",\"fillPercentage\":" + String(fillPercent) +
                   ",\"binId\":\"" + String(BIN_ID) + "\"}";

  WiFiClient   wifiClient;
  HTTPClient   http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");

  int attempt = 0;
  int httpCode = -1;

  while (attempt < HTTP_MAX_RETRIES) {
    httpCode = http.POST(payload);
    if (httpCode > 0) break;  // Got a response - stop retrying
    attempt++;
    if (attempt < HTTP_MAX_RETRIES) {
      Serial.printf("[HTTP] Attempt %d failed (code %d), retrying...\n", attempt, httpCode);
      delay(1500);
    }
  }

  http.end();

  if (httpCode == 200) {
    Serial.printf("[HTTP] POST OK - dist=%.1f cm, fill=%d%%\n", distCm, fillPercent);
    return true;
  } else {
    Serial.printf("[HTTP] POST failed - HTTP %d\n", httpCode);
    return false;
  }
}

// === Main sensor + reporting cycle ===
void sensorCycle() {
  unsigned long now = millis();

  // 1. Read sensor every SENSOR_INTERVAL_MS
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;

    float dist = readDistanceCm();

    if (dist < 0) {
      // Invalid reading - do NOT clear lastDistance or mark device offline.
      // Preserve the last valid reading on the dashboard.
      Serial.println("[SENSOR] Invalid reading - preserving last valid value");
    } else {
      int fill = calcFillPercent(dist);

      // Update Blynk virtual pins
      Blynk.virtualWrite(VPIN_DISTANCE, dist);
      Blynk.virtualWrite(VPIN_FILL,     fill);

      lastDistance    = dist;
      lastFillPercent = fill;
      lastReadValid   = true;

      Serial.printf("[SENSOR] distance=%.1f cm  fill=%d%%\n", dist, fill);
    }
  }

  // 2. HTTP POST every HTTP_INTERVAL_MS (only when we have a valid reading)
  if (lastReadValid && now - lastHttpPost >= HTTP_INTERVAL_MS) {
    lastHttpPost = now;
    postToBackend(lastDistance, lastFillPercent);
  }
}

// === Setup ===
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== EcoTrack BIN002 Firmware ===");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Connect to Wi-Fi + Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("Wi-Fi connected: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("Backend URL: %s\n", BACKEND_URL);
  Serial.printf("Calibration: empty=%.0f cm, full=%.0f cm\n",
                BIN_EMPTY_DISTANCE_CM, BIN_FULL_DISTANCE_CM);

  // Run the sensor cycle inside Blynk's cooperative loop
  timer.setInterval(1000L, sensorCycle);
}

// === Loop ===
void loop() {
  Blynk.run();   // Maintains Blynk connection - do NOT block for > 100 ms
  timer.run();   // Fires sensorCycle() every 1 s (checks its own sub-intervals)
}
