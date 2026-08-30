export const DEFAULT_WARNING_THRESHOLD = 50;
export const DEFAULT_FULL_THRESHOLD = 80;

export function getThresholds(bin = {}) {
  const warningThreshold = Number(bin.warningThreshold ?? DEFAULT_WARNING_THRESHOLD);
  const fullThreshold = Number(bin.fullThreshold ?? DEFAULT_FULL_THRESHOLD);
  return {
    warningThreshold: Number.isFinite(warningThreshold) ? warningThreshold : DEFAULT_WARNING_THRESHOLD,
    fullThreshold: Number.isFinite(fullThreshold) ? fullThreshold : DEFAULT_FULL_THRESHOLD,
  };
}

export function statusFromFillLevel(fillLevel, bin = {}) {
  const level = Number(fillLevel) || 0;
  const { warningThreshold, fullThreshold } = getThresholds(bin);
  if (level <= 0) return "Collected";
  if (level >= fullThreshold) return "Full";
  if (level >= warningThreshold) return "Warning";
  return "Normal";
}

export function parseBinPayload(body = {}, { requireId = true } = {}) {
  const id = String(body.id || "").trim().toUpperCase();
  const location = String(body.location || "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const warningThreshold = Number(body.warningThreshold ?? DEFAULT_WARNING_THRESHOLD);
  const fullThreshold = Number(body.fullThreshold ?? DEFAULT_FULL_THRESHOLD);
  const blynkPin = body.blynkPin == null || String(body.blynkPin).trim() === ""
    ? null
    : String(body.blynkPin).trim();

  if (requireId && !/^[A-Z0-9_-]{3,20}$/.test(id)) {
    return { error: "Bin ID must be 3-20 characters (letters, numbers, _ or -)" };
  }
  if (!location || location.length < 2) {
    return { error: "Location is required" };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: "Latitude must be a number between -90 and 90" };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Longitude must be a number between -180 and 180" };
  }
  if (!Number.isFinite(warningThreshold) || !Number.isFinite(fullThreshold)) {
    return { error: "Fill-level thresholds must be numbers" };
  }
  if (warningThreshold < 1 || warningThreshold > 99 || fullThreshold < 2 || fullThreshold > 100) {
    return { error: "Thresholds must be between 1 and 100" };
  }
  if (warningThreshold >= fullThreshold) {
    return { error: "Warning threshold must be lower than the full threshold" };
  }

  return {
    id,
    location,
    latitude,
    longitude,
    warningThreshold,
    fullThreshold,
    blynkPin,
  };
}
