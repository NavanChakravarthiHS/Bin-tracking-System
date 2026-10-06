import { Bin } from "../models/Bin.js";
import { applySuccessfulSensorRead, withMonitoring } from "../utils/sensorMonitoring.js";
import { statusFromFillLevel } from "../utils/binStatus.js";
import { processBinAlert } from "./alertService.js";

const EMPTY_BIN_DISTANCE_CM = 50;
const FULL_BIN_DISTANCE_CM = 10;

function fillFromDistance(distance) {
  const validDist = Math.max(FULL_BIN_DISTANCE_CM, Math.min(EMPTY_BIN_DISTANCE_CM, distance));
  return Math.round(
    ((EMPTY_BIN_DISTANCE_CM - validDist) / (EMPTY_BIN_DISTANCE_CM - FULL_BIN_DISTANCE_CM)) * 100
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
      currentFill = fillFromDistance(distance);
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
  if (currentFill > 0) {
    bin.lastCollected = null;
    bin.assignedCollector = null;
  }

  applySuccessfulSensorRead(bin, {
    distance: bin.distance,
    fillLevel: currentFill,
    status: currentStatus,
    lastSensorUpdate: now,
  });
  await bin.save();

  try {
    await processBinAlert({ bin, fillLevel: currentFill });
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
