import { env } from "../config/env.js";
import { Bin } from "../models/Bin.js";
import {
  applyFailedSensorRead,
  applySuccessfulSensorRead,
  evaluateSensorUpdate,
} from "../utils/sensorMonitoring.js";
import { statusFromFillLevel } from "../utils/binStatus.js";
import { processBinAlert } from "./alertService.js";
import { checkPendingCollectionVerification } from "./collectionService.js";

const BLYNK_API_URL = env.blynkApiUrl;

// Default calibration constants (used when a bin does not have per-bin values set).
const DEFAULT_EMPTY_DISTANCE_CM = 50;
const DEFAULT_FULL_DISTANCE_CM = 10;

/**
 * Resolve the Blynk distance virtual pin for a bin.
 * The blynkPin field may be stored as "V0" or as a comma-separated list like "V0,V1".
 * For distance polling we always use the FIRST pin only.
 */
function resolveDistancePin(blynkPin) {
  if (!blynkPin) return null;
  return String(blynkPin).split(',')[0].trim() || null;
}

export function resolveBinAuthToken(bin) {
  if (!bin) return env.blynkAuthToken;
  if (typeof bin === "string") return bin.trim();
  if (bin.blynkAuthToken && String(bin.blynkAuthToken).trim()) {
    return String(bin.blynkAuthToken).trim();
  }
  const id = String(bin.id || "").trim().toUpperCase();
  if (id === "BIN002") {
    return env.blynkAuthTokenBin2 || "WSb0GD_9dtS8jY6qOYzuNQmgZyPp81K0";
  }
  return env.blynkAuthToken;
}

function calculateBinMetrics(distance, bin = {}) {
  const emptyDist = Number(bin.emptyDistance) > 0 ? Number(bin.emptyDistance) : DEFAULT_EMPTY_DISTANCE_CM;
  const fullDist  = Number(bin.fullDistance)  > 0 ? Number(bin.fullDistance)  : DEFAULT_FULL_DISTANCE_CM;
  // Guard against misconfiguration (emptyDist must be strictly greater than fullDist)
  if (emptyDist <= fullDist) {
    console.warn(`[BIN ${bin.id}] Invalid calibration: emptyDistance (${emptyDist}) <= fullDistance (${fullDist}). Using defaults.`);
    return calculateBinMetrics(distance, { ...bin, emptyDistance: DEFAULT_EMPTY_DISTANCE_CM, fullDistance: DEFAULT_FULL_DISTANCE_CM });
  }
  const validDistance = Math.max(fullDist, Math.min(emptyDist, distance));
  const fillLevel = Math.round(
    ((emptyDist - validDistance) / (emptyDist - fullDist)) * 100
  );
  return { fillLevel, status: statusFromFillLevel(fillLevel, bin) };
}

export async function isBlynkHardwareConnected(token = env.blynkAuthToken) {
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

async function fetchBlynkValue(pin, binToken) {
  const token = binToken || env.blynkAuthToken;
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

export async function pushBlynkValue(pin, value, binToken) {
  const token = binToken || env.blynkAuthToken;
  if (!token || !pin) return;
  try {
    const url = `${BLYNK_API_URL}/update?token=${token}&${pin}=${value}`;
    await fetch(url);
  } catch (error) {
    // Ignored
  }
}

/**
 * Live hardware reading on demand for collection verification
 */
export async function fetchLiveBinReading(bin) {
  if (!bin) return null;
  const distancePin = resolveDistancePin(bin.blynkPin) || "V0";
  const token = resolveBinAuthToken(bin);
  if (!token) return null;

  const isConnected = await isBlynkHardwareConnected(token);
  if (!isConnected) {
    return { connected: false, distance: null, fillLevel: null, reason: "Hardware device offline in Blynk Cloud" };
  }

  const distance = await fetchBlynkValue(distancePin, token);
  if (distance === null) {
    return { connected: false, distance: null, fillLevel: null, reason: "Unable to read distance from Blynk pin" };
  }

  const { fillLevel, status } = calculateBinMetrics(distance, bin);
  return {
    connected: true,
    distance,
    fillLevel,
    status,
    readAt: new Date(),
  };
}

export async function syncAllBins() {
  try {
    const bins = await Bin.find({ isActive: { $ne: false } });
    
    const updatePromises = bins.map(async (bin) => {
      // Auto-assign blynkPin for BIN002 if missing
      if (!bin.blynkPin && String(bin.id).toUpperCase() === "BIN002") {
        bin.blynkPin = "V0";
      }
      if (!bin.blynkPin) return bin;

      const token = resolveBinAuthToken(bin);
      let configUpdated = false;
      if (!bin.blynkAuthToken && token) {
        bin.blynkAuthToken = token;
        configUpdated = true;
      }
      if (bin.isActive === false && String(bin.id).toUpperCase() === "BIN002") {
        bin.isActive = true;
        configUpdated = true;
      }

      // 1. Keep ultrasonic sensor reading interval at 5 seconds (called by setInterval in server.js)
      const distancePin = resolveDistancePin(bin.blynkPin);
      const distance = await fetchBlynkValue(distancePin, token);
      if (distance === null) {
        const wasConnected = bin.sensorConnected;
        const wasActive = bin.deviceStatus;
        applyFailedSensorRead(bin);
        if (configUpdated || wasConnected !== bin.sensorConnected || wasActive !== bin.deviceStatus) {
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

          // Process alert thresholds and pending collection verification
          try {
            await checkPendingCollectionVerification({ bin, currentFill });
            // Respect per-bin notification toggle (disabled for BIN002 during testing)
            if (bin.notificationsEnabled !== false) {
              await processBinAlert({ bin, fillLevel: currentFill });
            } else {
              console.log(`🔕 Notifications disabled for bin ${bin.id} — skipping alert.`);
            }
          } catch (err) {
            console.error(`Error processing alert for bin ${bin.id}:`, err);
          }
        } else {
          // Heartbeat update: Update lastSensorUpdate and lastSensorAttempt to maintain active status
          // without modifying fill level or triggering duplicate API/dashboard requests.
          applySuccessfulSensorRead(bin, { lastSensorUpdate: now });
          await bin.save();
        }
      } else if (bin.isVerificationPending && bin.activeCollectionId) {
        // Fallback safety guard: always check pending collection verification
        try {
          await checkPendingCollectionVerification({ bin, currentFill });
        } catch (err) {
          console.error(`Error checking pending verification for bin ${bin.id}:`, err);
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

let lastSyncTimestamp = 0;
const SYNC_THROTTLE_MS = 10000; // 10 seconds

export async function syncAllBinsIfNeeded() {
  const now = Date.now();
  if (now - lastSyncTimestamp < SYNC_THROTTLE_MS) {
    return;
  }
  lastSyncTimestamp = now;
  await syncAllBins();
}



