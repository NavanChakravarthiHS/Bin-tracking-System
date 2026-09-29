import { Bin } from "../models/Bin.js";
import {
  applyFailedSensorRead,
  applySuccessfulSensorRead,
  evaluateSensorUpdate,
} from "../utils/sensorMonitoring.js";
import { statusFromFillLevel } from "../utils/binStatus.js";
import { processBinAlert } from "./alertService.js";

const BLYNK_API_URL = process.env.BLYNK_API_URL || "https://blynk.cloud/external/api";

const EMPTY_BIN_DISTANCE_CM = 50;
const FULL_BIN_DISTANCE_CM = 10;

function calculateBinMetrics(distance, bin = {}) {
  const validDistance = Math.max(FULL_BIN_DISTANCE_CM, Math.min(EMPTY_BIN_DISTANCE_CM, distance));
  const fillLevel = Math.round(
    ((EMPTY_BIN_DISTANCE_CM - validDistance) / (EMPTY_BIN_DISTANCE_CM - FULL_BIN_DISTANCE_CM)) * 100
  );
  return { fillLevel, status: statusFromFillLevel(fillLevel, bin) };
}

export async function isBlynkHardwareConnected(token = process.env.BLYNK_AUTH_TOKEN) {
  if (!token) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const url = `${BLYNK_API_URL}/isHardwareConnected?token=${token}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const text = await response.text();
    return text.trim().toLowerCase() === "true";
  } catch (error) {
    return false;
  }
}

async function fetchBlynkValue(pin) {
  const token = process.env.BLYNK_AUTH_TOKEN;
  if (!token || !pin) return null;

  // Verify that the physical hardware device is online and connected to Blynk Cloud.
  // Do NOT rely on cached pin values when hardware is disconnected.
  const isConnected = await isBlynkHardwareConnected(token);
  if (!isConnected) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = `${BLYNK_API_URL}/get?token=${token}&${pin}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const text = await response.text();
    let value = text;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) value = parsed[0];
      else value = parsed;
    } catch (e) {
      // Ignored
    }

    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? null : numericValue;
  } catch (error) {
    return null;
  }
}

export async function pushBlynkValue(pin, value) {
  const token = process.env.BLYNK_AUTH_TOKEN;
  if (!token || !pin) return;
  try {
    const url = `${BLYNK_API_URL}/update?token=${token}&${pin}=${value}`;
    await fetch(url);
  } catch (error) {
    // Ignored
  }
}

export async function syncAllBins() {
  try {
    const bins = await Bin.find({ isActive: { $ne: false } });
    
    const updatePromises = bins.map(async (bin) => {
      if (!bin.blynkPin) return bin;

      // 1. Keep ultrasonic sensor reading interval at 5 seconds (called by setInterval in server.js)
      const distance = await fetchBlynkValue(bin.blynkPin);
      if (distance === null) {
        const wasConnected = bin.sensorConnected;
        const wasActive = bin.deviceStatus;
        applyFailedSensorRead(bin);
        if (wasConnected !== bin.sensorConnected || wasActive !== bin.deviceStatus) {
          await bin.save();
        }
        return bin;
      }

      // 2. Calculate current bin fill percentage and status
      const { fillLevel: currentFill, status: currentStatus } = calculateBinMetrics(distance, bin);
      const now = new Date();

      // 3 & 4 & 5 & 7. Evaluate update necessity:
      // - 2% change threshold (abs(currentFill - previousFill) >= 2%)
      // - Status transition (Normal / Warning / Full / etc.) forces immediate update
      // - Heartbeat / last-seen update (every 2 minutes) if fill level is unchanged
      const { shouldUpdate, isHeartbeatOnly } = evaluateSensorUpdate(bin, currentFill, currentStatus, now);

      if (shouldUpdate) {
        if (!isHeartbeatOnly) {
          // Send new fill level & status update to backend & dashboard
          applySuccessfulSensorRead(bin, { distance, fillLevel: currentFill, status: currentStatus, lastSensorUpdate: now });
          await bin.save();

          // Process alert thresholds (80% warning, 90% critical with TextBee SMS)
          try {
            await processBinAlert({ bin, fillLevel: currentFill });
          } catch (err) {
            console.error(`Error processing alert for bin ${bin.id}:`, err);
          }
        } else {
          // Heartbeat update: Update lastSensorUpdate and lastSensorAttempt to maintain active status
          // without modifying fill level or triggering duplicate API/dashboard requests.
          applySuccessfulSensorRead(bin, { lastSensorUpdate: now });
          await bin.save();
        }
      }
      // If shouldUpdate is false: do NOT update database or dashboard.
      // Dashboard maintains the last received value when no update is required.

      return bin;
    });

    await Promise.all(updatePromises);
  } catch (error) {
    // Ignored
  }
}

