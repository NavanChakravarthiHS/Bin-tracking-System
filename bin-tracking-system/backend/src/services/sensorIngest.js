import { Bin } from "../models/Bin.js";
import { applySuccessfulSensorRead, withMonitoring } from "../utils/sensorMonitoring.js";
import { statusFromFillLevel } from "../utils/binStatus.js";
import { processBinAlert } from "./alertService.js";
import { checkPendingCollectionVerification } from "./collectionService.js";

const DEFAULT_EMPTY_DISTANCE_CM = 50;
const DEFAULT_FULL_DISTANCE_CM = 10;

function fillFromDistance(distance, bin = {}) {
  const emptyDist = Number(bin.emptyDistance) > 0 ? Number(bin.emptyDistance) : DEFAULT_EMPTY_DISTANCE_CM;
  const fullDist  = Number(bin.fullDistance)  > 0 ? Number(bin.fullDistance)  : DEFAULT_FULL_DISTANCE_CM;
  if (emptyDist <= fullDist) return 0; // misconfigured — treat as empty
  const validDist = Math.max(fullDist, Math.min(emptyDist, distance));
  return Math.round(
    ((emptyDist - validDist) / (emptyDist - fullDist)) * 100
  );
}

export async function ingestSensorReading({ binId, body = {} }) {
  const { fillLevel, distance, fillPercentage, deviceId } = body;
  const targetId = String(binId || deviceId || "").trim().toUpperCase();

  if (!targetId) {
    return { status: 400, payload: { message: "Bin ID is required" } };
  }

  let currentFill = null;
  if (typeof fillPercentage === "number") {
    currentFill = Math.round(fillPercentage);
  } else if (typeof fillLevel === "number") {
    currentFill = Math.round(fillLevel);
  }

  const bin = await Bin.findOne({ id: targetId });
  if (!bin) {
    return { status: 404, payload: { message: `Bin '${targetId}' not found` } };
  }

  if (typeof distance === "number") {
    bin.distance = distance;
    if (currentFill === null) {
      currentFill = fillFromDistance(distance, bin);
    }
  }

  if (currentFill === null) {
    return {
      status: 400,
      payload: { message: "Payload must contain distance, fillLevel, or fillPercentage" },
    };
  }

  currentFill = Math.max(0, Math.min(100, currentFill));
  const currentStatus = statusFromFillLevel(currentFill, bin);
  const now = new Date();

  bin.fillLevel = currentFill;
  bin.status = currentStatus;

  applySuccessfulSensorRead(bin, {
    distance: bin.distance,
    fillLevel: currentFill,
    status: currentStatus,
    lastSensorUpdate: now,
  });
  await bin.save();

  try {
    // Check if bin is in collection verification pending state
    await checkPendingCollectionVerification({ bin, currentFill });
    // Respect per-bin notification toggle (disabled for BIN002 during testing)
    if (bin.notificationsEnabled !== false) {
      await processBinAlert({ bin, fillLevel: currentFill });
    } else {
      console.log(`🔕 Notifications disabled for bin ${targetId} — skipping alert processing.`);
    }
  } catch (err) {
    console.error(`Error processing alert for sensor update on bin ${targetId}:`, err);
  }

  return {
    status: 200,
    payload: {
      message: "Sensor data received successfully",
      updated: true,
      bin: withMonitoring(bin.toObject()),
    },
  };
}
