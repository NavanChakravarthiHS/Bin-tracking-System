import { env } from "./env.js";

export const alertConfig = {
  // Thresholds
  warningThreshold: Number(process.env.ALERT_WARNING_THRESHOLD || 60), // 60-79%
  priorityThreshold: Number(process.env.ALERT_PRIORITY_THRESHOLD || 80), // 80-94%
  criticalThreshold: Number(process.env.ALERT_CRITICAL_THRESHOLD || 95), // 95-99%
  fullThreshold: Number(process.env.ALERT_FULL_THRESHOLD || 100), // 100%

  // Timeouts (in minutes)
  escalationTimeoutMinutes: Number(process.env.ESCALATION_TIMEOUT_MINUTES || 30),
  deviceOfflineTimeoutMinutes: Number(process.env.DEVICE_OFFLINE_TIMEOUT_MINUTES || 15),
  verificationTimeoutMinutes: Number(process.env.VERIFICATION_TIMEOUT_MINUTES || 10),

  // Verification Rules
  verificationMaxFillPercentage: Number(process.env.VERIFICATION_MAX_FILL_PERCENTAGE || 30), // Must drop <= 30%
  verificationReadingsRequired: Number(process.env.VERIFICATION_READINGS_REQUIRED || 2), // 2 consistent low readings required

  // False Alert Prevention: Number of consecutive readings required for critical threshold confirmation
  consecutiveReadingsRequired: Number(process.env.CONSECUTIVE_READINGS_REQUIRED || 3),

  // Admin Mobile override (if set in .env)
  adminMobile: process.env.ADMIN_MOBILE || "",
};

export function getEscalationTimeoutMs() {
  return alertConfig.escalationTimeoutMinutes * 60 * 1000;
}

export function getDeviceOfflineTimeoutMs() {
  return alertConfig.deviceOfflineTimeoutMinutes * 60 * 1000;
}

export function getVerificationTimeoutMs() {
  return alertConfig.verificationTimeoutMinutes * 60 * 1000;
}
