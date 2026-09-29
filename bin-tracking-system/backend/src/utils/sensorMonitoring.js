// Monitoring and change detection constants
// 1. Reading interval: Ultrasonic sensor reads every 5 seconds.
// 2. 2% change threshold: Ignores sensor noise when fill level change is < 2%.
// 3. Heartbeat update interval: Updates lastSensorUpdate every 2 minutes (120,000 ms) to keep device status active.
// 4. Stale threshold: Sensor is marked inactive/disconnected after 3 minutes (180,000 ms) without a successful read/heartbeat.
export const SENSOR_FILL_CHANGE_THRESHOLD = 2; // 2% change threshold
export const SENSOR_HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes heartbeat
export const SENSOR_STALE_MS = 3 * 60 * 1000; // 3 minutes stale timeout

export function isSensorFresh(lastSensorUpdate, now = Date.now()) {
  if (!lastSensorUpdate) return false;
  const timestamp = new Date(lastSensorUpdate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return now - timestamp <= SENSOR_STALE_MS;
}

/**
 * Change-Detection and Heartbeat Evaluation:
 * Evaluates whether a new 5-second ultrasonic sensor reading should trigger:
 * - FULL update (fill change >= 2%, status transition, or device reconnection)
 * - HEARTBEAT update (periodic last-seen refresh every 2 minutes)
 * - NO update (suppresses unnecessary DB writes and dashboard noise when change < 2%)
 */
export function evaluateSensorUpdate(bin, currentFill, currentStatus, now = new Date()) {
  const previousFill = bin.fillLevel ?? 0;
  const previousStatus = bin.status || "Normal";

  const fillDiff = Math.abs(currentFill - previousFill);
  // Requirement 4: 2% change threshold to filter sensor noise
  const hasMeaningfulFillChange = fillDiff >= SENSOR_FILL_CHANGE_THRESHOLD;
  // Requirement 5: Immediate update if bin status changes between Normal / Warning / Full / etc.
  const hasStatusChanged = currentStatus !== previousStatus;
  // Immediate update if device was previously offline or disconnected
  const isDeviceReconnected = !bin.sensorConnected || bin.deviceStatus !== "Active";

  const lastUpdateMs = bin.lastSensorUpdate ? new Date(bin.lastSensorUpdate).getTime() : 0;
  const timeSinceLastUpdate = now.getTime() - lastUpdateMs;
  // Requirement 7: Heartbeat update every 2 minutes to keep last-seen active status
  const isHeartbeatDue = timeSinceLastUpdate >= SENSOR_HEARTBEAT_INTERVAL_MS;

  if (hasMeaningfulFillChange || hasStatusChanged || isDeviceReconnected) {
    return {
      shouldUpdate: true,
      isHeartbeatOnly: false,
      reason: hasMeaningfulFillChange
        ? `FILL_CHANGE (${fillDiff}%)`
        : hasStatusChanged
        ? `STATUS_CHANGED (${previousStatus} -> ${currentStatus})`
        : "DEVICE_RECONNECTED",
    };
  }

  if (isHeartbeatDue) {
    return {
      shouldUpdate: true,
      isHeartbeatOnly: true,
      reason: "HEARTBEAT_DUE",
    };
  }

  // Requirement 3 & 6: Do not update if fill level has not meaningfully changed (<2%) and status is unchanged.
  // Dashboard maintains the last received value.
  return {
    shouldUpdate: false,
    isHeartbeatOnly: false,
    reason: "NO_MEANINGFUL_CHANGE",
  };
}

export function buildMonitoringFields(bin, { connected } = {}) {
  const lastSensorUpdate = bin.lastSensorUpdate || null;
  const sensorConnected = typeof connected === "boolean" ? connected : isSensorFresh(lastSensorUpdate);
  const hasHardware = Boolean(bin.blynkPin) || Boolean(lastSensorUpdate);

  return {
    lastSensorUpdate,
    lastSensorAttempt: bin.lastSensorAttempt || lastSensorUpdate,
    sensorConnected,
    deviceStatus: sensorConnected ? "Active" : "Inactive",
    sensorStatus: !hasHardware ? "Not configured" : sensorConnected ? "Connected" : "Disconnected",
  };
}

export function withMonitoring(bin) {
  return {
    ...bin,
    ...buildMonitoringFields(bin),
  };
}

export function applySuccessfulSensorRead(bin, extra = {}) {
  const now = extra.lastSensorUpdate || extra.lastSensorAttempt || new Date();
  Object.assign(bin, extra, {
    lastSensorUpdate: now,
    lastSensorAttempt: now,
    sensorConnected: true,
    deviceStatus: "Active",
  });
  return bin;
}

export function applyFailedSensorRead(bin) {
  const now = new Date();
  const connected = isSensorFresh(bin.lastSensorUpdate, now.getTime());
  bin.lastSensorAttempt = now;
  bin.sensorConnected = connected;
  bin.deviceStatus = connected ? "Active" : "Inactive";
  return bin;
}

