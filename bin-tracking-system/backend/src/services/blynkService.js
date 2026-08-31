import { Bin } from "../models/Bin.js";
import { applyFailedSensorRead, applySuccessfulSensorRead, isSensorFresh } from "../utils/sensorMonitoring.js";
import { statusFromFillLevel } from "../utils/binStatus.js";
import { processBinAlert } from "./alertService.js";

const BLYNK_API_URL = process.env.BLYNK_API_URL || "https://blynk.cloud/external/api";

const MAX_BIN_DEPTH_CM = 100;

function calculateBinMetrics(distance, bin = {}) {
  const validDistance = Math.max(0, Math.min(MAX_BIN_DEPTH_CM, distance));
  const fillLevel = Math.round(((MAX_BIN_DEPTH_CM - validDistance) / MAX_BIN_DEPTH_CM) * 100);
  return { fillLevel, status: statusFromFillLevel(fillLevel, bin) };
}

async function fetchBlynkValue(pin) {
  const token = process.env.BLYNK_AUTH_TOKEN;
  if (!token || !pin) return null;

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

      const { fillLevel, status } = calculateBinMetrics(distance, bin);
      const now = new Date();
      const fillChanged = bin.distance !== distance || bin.fillLevel !== fillLevel || bin.status !== status;
      const heartbeatStale = !isSensorFresh(bin.lastSensorUpdate, now.getTime());

      if (fillChanged || heartbeatStale || !bin.sensorConnected || bin.deviceStatus !== "Active") {
        applySuccessfulSensorRead(bin, { distance, fillLevel, status, lastSensorUpdate: now });
        await bin.save();
      }

      // Check alert thresholds (80% warning, 90% critical with TextBee SMS)
      try {
        await processBinAlert({ bin, fillLevel });
      } catch (err) {
        console.error(`Error processing alert for bin ${bin.id}:`, err);
      }

      return bin;
    });

    await Promise.all(updatePromises);
  } catch (error) {
    // Ignored
  }
}
