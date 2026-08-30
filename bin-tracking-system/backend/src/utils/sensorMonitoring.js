export const SENSOR_STALE_MS = 45_000;

export function isSensorFresh(lastSensorUpdate, now = Date.now()) {
  if (!lastSensorUpdate) return false;
  const timestamp = new Date(lastSensorUpdate).getTime();
  if (Number.isNaN(timestamp)) return false;
  return now - timestamp <= SENSOR_STALE_MS;
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
