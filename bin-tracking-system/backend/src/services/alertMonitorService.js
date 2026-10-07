import { Bin } from "../models/Bin.js";
import { Alert } from "../models/Alert.js";
import { alertConfig, getEscalationTimeoutMs, getDeviceOfflineTimeoutMs } from "../config/alertConfig.js";
import { sendAdminEscalationAlert, sendAdminDeviceOfflineAlert, getAdminMobileNumber } from "./smsNotificationService.js";
import { checkVerificationTimeouts } from "./collectionService.js";

/**
 * Check and process Escalation Alerts for uncollected critical bins (30 mins)
 */
export async function checkEscalations() {
  try {
    const escalationMs = getEscalationTimeoutMs();
    const escalationCutoff = new Date(Date.now() - escalationMs);

    // Find active critical/full alerts created prior to the 30-minute cutoff
    const uncollectedAlerts = await Alert.find({
      status: "ACTIVE",
      severity: "CRITICAL",
      createdAt: { $lte: escalationCutoff },
      alertType: { $in: ["FULL", "COLLECTION_REQUIRED", "CRITICAL"] },
    }).lean();

    for (const alert of uncollectedAlerts) {
      const bin = await Bin.findOne({ id: alert.binId });
      if (!bin || bin.isEscalated) continue;

      console.log(`⚠️ [Escalation Triggered] Bin ${bin.id} uncollected for 30+ minutes.`);

      // Send Escalation SMS to Admin
      const adminRes = await sendAdminEscalationAlert({
        bin,
        durationMinutes: alertConfig.escalationTimeoutMinutes,
      });

      // Mark bin as escalated
      bin.isEscalated = true;
      bin.escalatedAt = new Date();
      await bin.save();

      // Create an Escalation Alert record in DB
      await Alert.create({
        binId: bin.id,
        fillLevel: bin.fillLevel,
        alertType: "ESCALATION",
        severity: "CRITICAL",
        status: "ACTIVE",
        location: bin.location,
        latitude: bin.latitude ?? null,
        longitude: bin.longitude ?? null,
        collectorId: alert.collectorId || null,
        collectorName: alert.collectorName || "",
        collectorMobile: alert.collectorMobile || "",
        collectorNotified: { status: "NOT_SENT", sent: false, mobile: "" },
        adminNotified: { ...adminRes },
        smsStatus: adminRes.status,
        smsError: adminRes.error || "",
        message: `Escalation Alert: Bin ${bin.id} at ${bin.location} has remained full for 30 minutes and has not been collected. Immediate action required.`,
      });
    }
  } catch (error) {
    console.error("Error in checkEscalations monitor:", error);
  }
}

/**
 * Check and process IoT Device Offline Alerts (15 mins no data)
 */
export async function checkDeviceOfflineStatus() {
  try {
    const offlineMs = getDeviceOfflineTimeoutMs();
    const now = Date.now();
    const offlineCutoff = new Date(now - offlineMs);

    // 1. Detect active bins that have not sent sensor data for > 15 minutes
    const offlineBins = await Bin.find({
      isActive: { $ne: false },
      isDeviceOffline: { $ne: true },
      $or: [
        { lastSensorUpdate: { $lte: offlineCutoff } },
        { lastSensorUpdate: null, createdAt: { $lte: offlineCutoff } },
      ],
    });

    for (const bin of offlineBins) {
      console.log(`📡 [Device Offline Detected] Bin ${bin.id} has no sensor updates for > 15 minutes.`);

      // Send Device Offline SMS to Admin
      const adminRes = await sendAdminDeviceOfflineAlert({
        bin,
        offlineMinutes: alertConfig.deviceOfflineTimeoutMinutes,
      });

      // Update bin state
      bin.isDeviceOffline = true;
      bin.offlineAlertSentAt = new Date();
      bin.deviceStatus = "Inactive";
      bin.sensorConnected = false;
      await bin.save();

      // Create Device Offline alert in DB
      await Alert.create({
        binId: bin.id,
        fillLevel: bin.fillLevel ?? 0,
        alertType: "DEVICE_OFFLINE",
        severity: "DEVICE_OFFLINE",
        status: "ACTIVE",
        location: bin.location,
        latitude: bin.latitude ?? null,
        longitude: bin.longitude ?? null,
        collectorId: bin.assignedCollectorId || null,
        collectorName: bin.assignedCollector || "",
        collectorNotified: { status: "NOT_SENT", sent: false },
        adminNotified: { ...adminRes },
        smsStatus: adminRes.status,
        smsError: adminRes.error || "",
        message: `Device Alert: Bin ${bin.id} at ${bin.location} has been offline for more than 15 minutes. Please check the device.`,
      });
    }

    // 2. Clear offline state if an offline bin comes back online
    const reconnectedBins = await Bin.find({
      isActive: { $ne: false },
      isDeviceOffline: true,
      lastSensorUpdate: { $gt: offlineCutoff },
    });

    for (const bin of reconnectedBins) {
      console.log(`🟢 [Device Reconnected] Bin ${bin.id} sent fresh sensor reading.`);
      bin.isDeviceOffline = false;
      bin.offlineAlertSentAt = null;
      bin.deviceStatus = "Active";
      bin.sensorConnected = true;
      await bin.save();

      // Auto-resolve active DEVICE_OFFLINE alerts for this bin
      await Alert.updateMany(
        { binId: bin.id, alertType: "DEVICE_OFFLINE", status: "ACTIVE" },
        { $set: { status: "RESOLVED", resolvedAt: new Date() } }
      );
    }
  } catch (error) {
    console.error("Error in checkDeviceOfflineStatus monitor:", error);
  }
}

/**
 * Combined Alert Monitoring Loop
 */
export async function runAlertMonitorCycle() {
  await checkEscalations();
  await checkDeviceOfflineStatus();
  await checkVerificationTimeouts();
}

let lastMonitorTimestamp = 0;
const MONITOR_THROTTLE_MS = 30000; // 30 seconds

export async function runAlertMonitorCycleIfNeeded() {
  const now = Date.now();
  if (now - lastMonitorTimestamp < MONITOR_THROTTLE_MS) {
    return;
  }
  lastMonitorTimestamp = now;
  await runAlertMonitorCycle();
}
