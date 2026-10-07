import { Alert } from "../models/Alert.js";
import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { alertConfig } from "../config/alertConfig.js";
import {
  sendCollectorAlert,
  sendAdminCriticalAlert,
  sendAdminEscalationAlert,
  sendAdminDeviceOfflineAlert,
  getAdminMobileNumber,
} from "./smsNotificationService.js";

/**
 * Determine Alert State from fill percentage according to rule specifications
 */
export function determineAlertState(fillLevel) {
  const level = Math.max(0, Math.min(100, Math.round(fillLevel)));
  if (level >= alertConfig.fullThreshold) {
    return { state: "FULL", severity: "CRITICAL", alertType: "FULL" };
  }
  if (level >= alertConfig.criticalThreshold) {
    return { state: "CRITICAL", severity: "CRITICAL", alertType: "COLLECTION_REQUIRED" };
  }
  if (level >= alertConfig.priorityThreshold) {
    return { state: "PRIORITY", severity: "PRIORITY", alertType: "PRIORITY" };
  }
  if (level >= alertConfig.warningThreshold) {
    return { state: "WARNING", severity: "WARNING", alertType: "WARNING" };
  }
  return { state: "NORMAL", severity: "NONE", alertType: "NORMAL" };
}

/**
 * Main Role-Based Sensor Alert Processor
 */
export async function processBinAlert({ bin, fillLevel }) {
  // Global disable switch – stop all alerts
  if (alertConfig.disableAllAlerts) {
    console.log('🔕 All alerts are disabled via configuration.');
    return null;
  }
  if (!bin || typeof fillLevel !== "number") return null;

  const currentLevel = Math.max(0, Math.min(100, Math.round(fillLevel)));
  const { state: targetState, severity, alertType } = determineAlertState(currentLevel);
  const previousState = bin.lastAlertState || "NORMAL";

  // If bin has returned to normal (0-59%)
  if (targetState === "NORMAL") {
    bin.consecutiveCriticalReadings = 0;
    if (previousState !== "NORMAL") {
      bin.lastAlertState = "NORMAL";
      bin.lastAlertSeverity = "NONE";
      bin.isEscalated = false;
      bin.escalatedAt = null;
      await bin.save();

      // Resolve all active fill alerts for this bin
      await Alert.updateMany(
        { binId: bin.id, status: "ACTIVE", alertType: { $ne: "DEVICE_OFFLINE" } },
        { $set: { status: "RESOLVED", resolvedAt: new Date() } }
      );
      console.log(`ℹ️ [Alert Reset] Bin ${bin.id} level dropped to ${currentLevel}%. State reset to NORMAL.`);
    }
    return null;
  }

  // Handle consecutive reading requirement for CRITICAL and FULL states
  const isCriticalOrFull = targetState === "CRITICAL" || targetState === "FULL";
  if (isCriticalOrFull) {
    bin.consecutiveCriticalReadings = (bin.consecutiveCriticalReadings || 0) + 1;
    if (bin.consecutiveCriticalReadings < alertConfig.consecutiveReadingsRequired) {
      await bin.save();
      console.log(
        `⏳ [Sensor Stability Check] Bin ${bin.id} reading ${currentLevel}% (${bin.consecutiveCriticalReadings}/${alertConfig.consecutiveReadingsRequired} consecutive readings). Waiting for verification.`
      );
      return null;
    }
  } else {
    // Reset consecutive critical counter if reading is below 95%
    bin.consecutiveCriticalReadings = 0;
  }

  // Duplicate Prevention: Do not resend SMS or recreate incident if already in this alert state
  if (previousState === targetState) {
    await bin.save();
    return null;
  }

  // State Transition confirmed -> Create new alert incident & dispatch appropriate SMS
  bin.lastAlertState = targetState;
  bin.lastAlertSeverity = severity;
  bin.lastAlertAt = new Date();
  await bin.save();

  // Fetch assigned collector details
  let collector = null;
  if (bin.assignedCollectorId) {
    collector = await Collector.findById(bin.assignedCollectorId).select("name mobile").lean();
  }

  const collectorName = collector?.name || bin.assignedCollector || "Assigned Collector";

  // Determine if SMS can be sent (only for integrated bins with live sensor data)
  const canSendSMS = bin.integrationStatus === "INTEGRATED" && bin.sensorConnected;
  if (!canSendSMS) {
    console.log(`🔕 SMS disabled for Bin ${bin.id} (integrationStatus=${bin.integrationStatus}, sensorConnected=${bin.sensorConnected})`);
  }

  let collectorNotified = { sent: false, mobile: "", status: "NOT_SENT", error: "", sentAt: null };
  let adminNotified = { sent: false, mobile: "", status: "NOT_SENT", error: "", sentAt: null };

  // Dispatch SMS according to Role Rules:
  // 1. WARNING (60-79%): Dashboard alert only. NO SMS to collector or admin.
  if (targetState === "WARNING") {
    collectorNotified.status = "NOT_SENT";
    adminNotified.status = "NOT_SENT";
  }

  // 2. PRIORITY (80-94%): SMS to assigned collector ONLY.
  if (targetState === "PRIORITY") {
    if (canSendSMS && collector) {
      const res = await sendCollectorAlert({ bin, fillLevel: currentLevel, alertType: "PRIORITY", collector });
      collectorNotified = { ...res };
    } else {
      collectorNotified.status = "SKIPPED";
      collectorNotified.error = collector ? "SMS disabled for non-integrated bin" : "No collector assigned to this bin";
    }
  }

  // 3. CRITICAL / COLLECTION REQUIRED (95-99%): SMS to assigned collector ONLY. Alert on dashboard.
  if (targetState === "CRITICAL") {
    if (canSendSMS && collector) {
      const res = await sendCollectorAlert({
        bin,
        fillLevel: currentLevel,
        alertType: "COLLECTION_REQUIRED",
        collector,
      });
      collectorNotified = { ...res };
    } else {
      collectorNotified.status = "SKIPPED";
      collectorNotified.error = collector ? "SMS disabled for non-integrated bin" : "No collector assigned to this bin";
    }
  }

  // 4. FULL / OVERFLOW (100%): SMS to BOTH assigned collector and admin.
  if (targetState === "FULL") {
    if (canSendSMS && collector) {
      const resCol = await sendCollectorAlert({ bin, fillLevel: currentLevel, alertType: "FULL", collector });
      collectorNotified = { ...resCol };
    } else {
      collectorNotified.status = "SKIPPED";
      collectorNotified.error = collector ? "SMS disabled for non-integrated bin" : "No collector assigned to this bin";
    }

    if (canSendSMS) {
      const resAdmin = await sendAdminCriticalAlert({ bin, fillLevel: currentLevel, collectorName });
      adminNotified = { ...resAdmin };
    } else {
      adminNotified.status = "SKIPPED";
      adminNotified.error = "Admin SMS disabled for non-integrated bin";
    }
  }

  // Format message summary for dashboard record
  const primaryMessage =
    targetState === "FULL"
      ? `Critical Alert: Bin ${bin.id} at ${bin.location} is 100% full. Collector ${collectorName} and Admin notified.`
      : targetState === "CRITICAL"
      ? `Collection Required: Bin ${bin.id} at ${bin.location} reached ${currentLevel}% capacity.`
      : targetState === "PRIORITY"
      ? `Priority Warning: Bin ${bin.id} at ${bin.location} is at ${currentLevel}% capacity.`
      : `Warning: Bin ${bin.id} at ${bin.location} reached ${currentLevel}% fill level.`;

  // Create persistent Alert record in Database
  const alertDoc = await Alert.create({
    binId: bin.id,
    fillLevel: currentLevel,
    alertType,
    severity,
    status: "ACTIVE",
    location: bin.location,
    latitude: bin.latitude ?? null,
    longitude: bin.longitude ?? null,
    collectorId: collector?._id || null,
    collectorName: collectorName,
    collectorMobile: collector?.mobile || "",
    collectorNotified,
    adminNotified,
    // Backward compatibility fields for legacy UI components
    smsStatus: collectorNotified.status !== "NOT_SENT" ? collectorNotified.status : adminNotified.status,
    smsError: collectorNotified.error || adminNotified.error || "",
    message: primaryMessage,
  });

  console.log(
    `🚨 [Role Alert Triggered] Bin: ${bin.id} | Level: ${currentLevel}% | State: ${targetState} | Collector SMS: ${collectorNotified.status} | Admin SMS: ${adminNotified.status}`
  );

  return alertDoc;
}

/**
 * Retry Failed SMS Notification for an Alert
 */
export async function retryAlertNotification(alertId) {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new Error("Alert not found");
  }

  const bin = await Bin.findOne({ id: alert.binId });
  let collector = null;
  if (alert.collectorId) {
    collector = await Collector.findById(alert.collectorId).select("name mobile").lean();
  } else if (bin?.assignedCollectorId) {
    collector = await Collector.findById(bin.assignedCollectorId).select("name mobile").lean();
  }

  let retried = false;

  // Retry Collector SMS if failed
  if (alert.collectorNotified?.status === "FAILED" && collector?.mobile) {
    const res = await sendCollectorAlert({
      bin: bin || alert,
      fillLevel: alert.fillLevel,
      alertType: alert.alertType,
      collector,
    });
    alert.collectorNotified = { ...res };
    alert.smsStatus = res.status;
    alert.smsError = res.error;
    retried = true;
  }

  // Retry Admin SMS if failed
  if (alert.adminNotified?.status === "FAILED") {
    if (alert.alertType === "ESCALATION") {
      const res = await sendAdminEscalationAlert({ bin: bin || alert });
      alert.adminNotified = { ...res };
      retried = true;
    } else if (alert.alertType === "DEVICE_OFFLINE") {
      const res = await sendAdminDeviceOfflineAlert({ bin: bin || alert });
      alert.adminNotified = { ...res };
      retried = true;
    } else {
      const res = await sendAdminCriticalAlert({
        bin: bin || alert,
        fillLevel: alert.fillLevel,
        collectorName: alert.collectorName,
      });
      alert.adminNotified = { ...res };
      retried = true;
    }
  }

  if (retried) {
    await alert.save();
  }

  return alert;
}
