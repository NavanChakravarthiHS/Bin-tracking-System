import { Alert } from "../models/Alert.js";
import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { sendSMS } from "./textbeeService.js";

export function formatAlertMessage({ binId, fillLevel, location, latitude, longitude, collectorName = "Collector" }) {
  const mapsLink =
    latitude != null && longitude != null
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : null;

  const lines = [
    // --- Kannada Section ---
    `🚨 ಕಸ ಸಂಗ್ರಹಣೆ ಎಚ್ಚರಿಕೆ`,
    ``,
    `ಪ್ರಿಯ ${collectorName},`,
    ``,
    `ಬಿನ್ ID: ${binId}`,
    `ತುಂಬಿರುವ ಮಟ್ಟ: ${fillLevel}%`,
    `ಸ್ಥಳ: ${location}`,
    ``,
    `ಈ ಬಿನ್ ನಿಗದಿತ ಸಂಗ್ರಹಣಾ ಮಿತಿಯನ್ನು ತಲುಪಿದೆ. ದಯವಿಟ್ಟು ಸ್ಥಳಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಆದಷ್ಟು ಬೇಗ ಕಸವನ್ನು ಸಂಗ್ರಹಿಸಿ.`,
    ``,
    `──────────────────────────`,
    ``,
    // --- English Section ---
    `🚨 Garbage Collection Alert`,
    ``,
    `Dear ${collectorName},`,
    ``,
    `Bin ID: ${binId}`,
    `Fill Level: ${fillLevel}%`,
    `Location: ${location}`,
    ``,
    `The bin has reached the collection threshold. Please visit the location and collect the garbage at the earliest.`,
    ``,
    mapsLink ? `📍 Google Maps:` : null,
    mapsLink ? mapsLink : null,
    ``,
    `— ಬಿನ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಿಸ್ಟಮ್ | Bin Tracking System`
  ].filter((line) => line !== null);

  return lines.join("\n");
}

export async function processBinAlert({ bin, fillLevel }) {
  if (!bin || typeof fillLevel !== "number") return null;

  const currentLevel = Math.max(0, Math.min(100, Math.round(fillLevel)));
  const warningThreshold = Number(bin.warningThreshold ?? 50);
  const fullThreshold = Number(bin.fullThreshold ?? 80);
  const previousSeverity = bin.lastAlertSeverity || "NONE";

  // If fill level has dropped below warning threshold (e.g. < 50%)
  if (currentLevel < warningThreshold) {
    if (previousSeverity !== "NONE") {
      bin.lastAlertSeverity = "NONE";
      await bin.save();
      // Mark active alerts for this bin as resolved
      await Alert.updateMany(
        { binId: bin.id, status: "ACTIVE" },
        { $set: { status: "RESOLVED", resolvedAt: new Date() } }
      );
      console.log(`ℹ️ [Alert State Reset] Bin ${bin.id} returned to normal (${currentLevel}%). Alert state reset.`);
    }
    return null;
  }

  // Warning level: warningThreshold <= currentLevel < fullThreshold (e.g., 50% to 80%)
  if (currentLevel >= warningThreshold && currentLevel < fullThreshold && currentLevel <= 80) {
    if (previousSeverity === "WARNING" || previousSeverity === "CRITICAL") {
      // Already alerted for this threshold, do not duplicate
      return null;
    }

    bin.lastAlertSeverity = "WARNING";
    bin.lastAlertAt = new Date();
    await bin.save();

    let collector = null;
    if (bin.assignedCollectorId) {
      collector = await Collector.findById(bin.assignedCollectorId).select("name mobile").lean();
    }

    const alertDoc = await Alert.create({
      binId: bin.id,
      fillLevel: currentLevel,
      severity: "WARNING",
      status: "ACTIVE",
      location: bin.location,
      collectorId: collector?._id || null,
      collectorName: collector?.name || "",
      collectorMobile: collector?.mobile || "",
      smsStatus: "NOT_SENT",
      whatsappStatus: "NOT_SENT",
      adminNote: collector
        ? `Warning threshold reached (${currentLevel}%)`
        : `Warning threshold reached (${currentLevel}%). No collector assigned.`,
      message: `Warning: Bin ${bin.id} at ${bin.location} reached ${currentLevel}% fill level.`,
    });

    console.log(`⚠️ [Warning Alert Created] Bin: ${bin.id} | Level: ${currentLevel}%`);
    return alertDoc;
  }

  // Full condition: currentLevel > 80% or currentLevel >= fullThreshold
  if (currentLevel > 80 || currentLevel >= fullThreshold) {
    if (previousSeverity === "CRITICAL") {
      // Already sent critical notification, do not duplicate
      return null;
    }

    bin.lastAlertSeverity = "CRITICAL";
    bin.lastAlertAt = new Date();
    await bin.save();

    let collector = null;
    if (bin.assignedCollectorId) {
      collector = await Collector.findById(bin.assignedCollectorId).select("name mobile").lean();
    }

    const messageText = formatAlertMessage({
      binId: bin.id,
      fillLevel: currentLevel,
      location: bin.location,
      latitude: bin.latitude,
      longitude: bin.longitude,
      collectorName: collector?.name || "Collector",
    });

    // If no assigned collector
    if (!collector || !collector.mobile) {
      const alertDoc = await Alert.create({
        binId: bin.id,
        fillLevel: currentLevel,
        severity: "CRITICAL",
        status: "ACTIVE",
        location: bin.location,
        collectorId: null,
        collectorName: "",
        collectorMobile: "",
        smsStatus: "SKIPPED",
        smsError: "No collector assigned to this bin",
        whatsappStatus: "NOT_SENT",
        adminNote: "No collector assigned to this bin.",
        message: messageText,
      });

      console.warn(`🚨 [Critical Alert - No Collector] Bin: ${bin.id} | Level: ${currentLevel}%. SMS dispatch skipped.`);
      return alertDoc;
    }

    // Collector is assigned: Send SMS alert message via TextBee SMS Gateway
    console.log(`🚨 [Critical Full Alert Dispatch (>80%)] Bin: ${bin.id} (${currentLevel}%) -> Collector: ${collector.name || collector.mobile} (${collector.mobile})`);

    const smsRes = await sendSMS(collector.mobile, messageText);

    const alertDoc = await Alert.create({
      binId: bin.id,
      fillLevel: currentLevel,
      severity: "CRITICAL",
      status: "ACTIVE",
      location: bin.location,
      latitude: bin.latitude ?? null,
      longitude: bin.longitude ?? null,
      collectorId: collector._id,
      collectorName: collector.name || "",
      collectorMobile: collector.mobile,
      smsStatus: smsRes.success ? "SENT" : "FAILED",
      smsError: smsRes.error || "",
      smsMessageSid: smsRes.messageId || "",
      whatsappStatus: "NOT_SENT",
      adminNote: "",
      message: messageText,
    });

    return alertDoc;
  }

  return null;
}

export async function retryAlertNotification(alertId) {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new Error("Alert not found");
  }

  let mobile = alert.collectorMobile;
  let collectorName = alert.collectorName;

  // If mobile is not stored on alert, try to look up from bin's current assigned collector
  if (!mobile) {
    const bin = await Bin.findOne({ id: alert.binId });
    if (bin?.assignedCollectorId) {
      const collector = await Collector.findById(bin.assignedCollectorId).select("name mobile").lean();
      if (collector?.mobile) {
        mobile = collector.mobile;
        collectorName = collector.name || "";
        alert.collectorId = collector._id;
        alert.collectorName = collectorName;
        alert.collectorMobile = mobile;
      }
    }
  }

  if (!mobile) {
    alert.adminNote = "No collector assigned to this bin. Assign a collector first before retrying.";
    await alert.save();
    return alert;
  }

  const messageText = alert.message || formatAlertMessage({
    binId: alert.binId,
    fillLevel: alert.fillLevel,
    location: alert.location,
    latitude: alert.latitude ?? null,
    longitude: alert.longitude ?? null,
    collectorName: collectorName || "Collector",
  });

  // Retry TextBee SMS if not already sent successfully
  if (alert.smsStatus !== "SENT") {
    const smsRes = await sendSMS(mobile, messageText);
    alert.smsStatus = smsRes.success ? "SENT" : "FAILED";
    alert.smsError = smsRes.error || "";
    if (smsRes.messageId) alert.smsMessageSid = smsRes.messageId;
  }

  alert.adminNote = "";
  await alert.save();

  return alert;
}
