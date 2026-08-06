import { Bin } from "../models/Bin.js";

const BLYNK_API_URL = process.env.BLYNK_API_URL || "https://blynk.cloud/external/api";

const MAX_BIN_DEPTH_CM = 100;

function calculateBinMetrics(distance) {
  const validDistance = Math.max(0, Math.min(MAX_BIN_DEPTH_CM, distance));
  const fillLevel = Math.round(((MAX_BIN_DEPTH_CM - validDistance) / MAX_BIN_DEPTH_CM) * 100);
  
  let status = "Normal";
  if (fillLevel >= 80) {
    status = "Full";
  } else if (fillLevel >= 50) {
    status = "Warning";
  }

  return { fillLevel, status };
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
    const bins = await Bin.find();
    
    const updatePromises = bins.map(async (bin) => {
      if (!bin.blynkPin) return bin;

      const distance = await fetchBlynkValue(bin.blynkPin);
      if (distance === null) return bin;

      const { fillLevel, status } = calculateBinMetrics(distance);

      if (bin.distance !== distance || bin.fillLevel !== fillLevel || bin.status !== status) {
        bin.distance = distance;
        bin.fillLevel = fillLevel;
        bin.status = status;
        await bin.save();
      }
      return bin;
    });

    await Promise.all(updatePromises);
  } catch (error) {
    // Ignored
  }
}
