import { sendSMS } from "./textbeeService.js";
import { Admin } from "../models/Admin.js";
import { alertConfig } from "../config/alertConfig.js";

/**
 * Resolves the primary Admin phone number from env or database
 */
export async function getAdminMobileNumber() {
  if (alertConfig.adminMobile) {
    return alertConfig.adminMobile;
  }
  try {
    const admin = await Admin.findOne().select("mobile").lean();
    if (admin?.mobile) {
      return admin.mobile;
    }
  } catch (error) {
    console.error("Error looking up admin mobile number:", error);
  }
  return "";
}

/**
 * Centralized Message Templates
 */
export const smsTemplates = {
  collectorPriority: ({ binId, location, fillLevel }) =>
    `Notice: Bin ${binId} at ${location} is at ${fillLevel}% capacity and nearing full level.`,

  collectorCritical: ({ binId, location, fillLevel }) =>
    `Urgent: Bin ${binId} at ${location} has reached ${fillLevel}% capacity. Please collect it immediately.`,

  collectorFull: ({ binId, location }) =>
    `Urgent: Bin ${binId} at ${location} is full. Please collect it immediately.`,

  adminCriticalFull: ({ binId, location, collectorName }) =>
    `Critical Alert: Bin ${binId} at ${location} has reached full capacity. Collector ${collectorName || "Collector"} has been notified.`,

  adminEscalation: ({ binId, location, durationMinutes = 30 }) =>
    `Escalation Alert: Bin ${binId} at ${location} has remained full for ${durationMinutes} minutes and has not been collected. Immediate action required.`,

  adminDeviceOffline: ({ binId, location, offlineMinutes = 15 }) =>
    `Device Alert: Bin ${binId} at ${location} has been offline for more than ${offlineMinutes} minutes. Please check the device.`,
};

/**
 * Send SMS Alert to Garbage Collector
 */
export async function sendCollectorAlert({ bin, fillLevel, alertType, collector }) {
  if (!collector || !collector.mobile) {
    return {
      sent: false,
      status: "SKIPPED",
      error: "No collector assigned to this bin",
      mobile: "",
    };
  }

  let message = "";
  if (alertType === "PRIORITY") {
    message = smsTemplates.collectorPriority({
      binId: bin.id,
      location: bin.location,
      fillLevel,
    });
  } else if (alertType === "COLLECTION_REQUIRED") {
    message = smsTemplates.collectorCritical({
      binId: bin.id,
      location: bin.location,
      fillLevel,
    });
  } else if (alertType === "FULL") {
    message = smsTemplates.collectorFull({
      binId: bin.id,
      location: bin.location,
    });
  } else {
    message = smsTemplates.collectorCritical({
      binId: bin.id,
      location: bin.location,
      fillLevel,
    });
  }

  console.log(`📱 [SMS -> Collector (${collector.mobile})] Alert: ${alertType} | Bin: ${bin.id}`);
  const result = await sendSMS(collector.mobile, message);

  return {
    sent: result.success,
    status: result.success ? "SENT" : "FAILED",
    error: result.error || "",
    mobile: collector.mobile,
    message,
    sentAt: result.success ? new Date() : null,
  };
}

/**
 * Send SMS Critical Alert to Admin (100% / full capacity reached)
 */
export async function sendAdminCriticalAlert({ bin, fillLevel, collectorName }) {
  const adminMobile = await getAdminMobileNumber();
  if (!adminMobile) {
    return {
      sent: false,
      status: "SKIPPED",
      error: "No admin mobile number found in environment or database",
      mobile: "",
    };
  }

  const message = smsTemplates.adminCriticalFull({
    binId: bin.id,
    location: bin.location,
    collectorName,
  });

  console.log(`🚨 [SMS -> Admin (${adminMobile})] Critical Alert | Bin: ${bin.id}`);
  const result = await sendSMS(adminMobile, message);

  return {
    sent: result.success,
    status: result.success ? "SENT" : "FAILED",
    error: result.error || "",
    mobile: adminMobile,
    message,
    sentAt: result.success ? new Date() : null,
  };
}

/**
 * Send SMS Escalation Alert to Admin (Uncollected after 30 mins)
 */
export async function sendAdminEscalationAlert({ bin, durationMinutes = alertConfig.escalationTimeoutMinutes }) {
  const adminMobile = await getAdminMobileNumber();
  if (!adminMobile) {
    return {
      sent: false,
      status: "SKIPPED",
      error: "No admin mobile number found in environment or database",
      mobile: "",
    };
  }

  const message = smsTemplates.adminEscalation({
    binId: bin.id,
    location: bin.location,
    durationMinutes,
  });

  console.log(`⏳ [SMS -> Admin Escalation (${adminMobile})] Bin: ${bin.id} uncollected for ${durationMinutes}m`);
  const result = await sendSMS(adminMobile, message);

  return {
    sent: result.success,
    status: result.success ? "SENT" : "FAILED",
    error: result.error || "",
    mobile: adminMobile,
    message,
    sentAt: result.success ? new Date() : null,
  };
}

/**
 * Send SMS Device Offline Alert to Admin (No sensor data for 15+ mins)
 */
export async function sendAdminDeviceOfflineAlert({ bin, offlineMinutes = alertConfig.deviceOfflineTimeoutMinutes }) {
  const adminMobile = await getAdminMobileNumber();
  if (!adminMobile) {
    return {
      sent: false,
      status: "SKIPPED",
      error: "No admin mobile number found in environment or database",
      mobile: "",
    };
  }

  const message = smsTemplates.adminDeviceOffline({
    binId: bin.id,
    location: bin.location,
    offlineMinutes,
  });

  console.log(`📡 [SMS -> Admin Device Offline (${adminMobile})] Bin: ${bin.id} offline for ${offlineMinutes}m`);
  const result = await sendSMS(adminMobile, message);

  return {
    sent: result.success,
    status: result.success ? "SENT" : "FAILED",
    error: result.error || "",
    mobile: adminMobile,
    message,
    sentAt: result.success ? new Date() : null,
  };
}
