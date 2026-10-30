import express from "express";
import { Alert } from "../models/Alert.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { retryAlertNotification } from "../services/alertService.js";
import { runAlertMonitorCycleIfNeeded } from "../services/alertMonitorService.js";
import { sendSMS } from "../services/textbeeService.js";
import { getAdminMobileNumber } from "../services/smsNotificationService.js";

export const adminAlertsRouter = express.Router();

// GET /admin/alerts - Get all alerts with statistics
adminAlertsRouter.get("/alerts", requireAuth, async (req, res) => {
  try {
    await runAlertMonitorCycleIfNeeded();

    const { status, severity, alertType } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }
    if (severity && severity !== "ALL") {
      query.severity = severity.toUpperCase();
    }
    if (alertType && alertType !== "ALL") {
      query.alertType = alertType.toUpperCase();
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const allAlerts = await Alert.find({}).lean();
    const stats = {
      total: allAlerts.length,
      active: allAlerts.filter((a) => a.status === "ACTIVE").length,
      critical: allAlerts.filter((a) => a.status === "ACTIVE" && a.severity === "CRITICAL").length,
      priority: allAlerts.filter((a) => a.status === "ACTIVE" && a.severity === "PRIORITY").length,
      warning: allAlerts.filter((a) => a.status === "ACTIVE" && a.severity === "WARNING").length,
      deviceOffline: allAlerts.filter((a) => a.status === "ACTIVE" && a.alertType === "DEVICE_OFFLINE").length,
      escalated: allAlerts.filter((a) => a.status === "ACTIVE" && a.alertType === "ESCALATION").length,
      failedNotifications: allAlerts.filter(
        (a) =>
          a.status === "ACTIVE" &&
          (a.collectorNotified?.status === "FAILED" ||
            a.adminNotified?.status === "FAILED" ||
            a.smsStatus === "FAILED")
      ).length,
    };

    return res.json({ alerts, stats });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ message: "Failed to fetch alerts" });
  }
});

// POST /admin/alerts/test-sms - Trigger a test SMS message
adminAlertsRouter.post("/alerts/test-sms", requireAuth, async (req, res) => {
  try {
    const { recipient, message } = req.body || {};
    const adminMobile = await getAdminMobileNumber();
    const targetMobile = (recipient || adminMobile || "").trim();

    if (!targetMobile) {
      return res.status(400).json({
        success: false,
        message: "No recipient mobile number provided and no admin mobile configured",
      });
    }

    const testMessage =
      message ||
      `EcoTrack Test SMS: System alert notification gateway is active and operational at ${new Date().toLocaleTimeString()}.`;

    const result = await sendSMS(targetMobile, testMessage);

    if (result.success) {
      return res.json({
        success: true,
        message: `Test SMS dispatched successfully to ${targetMobile}`,
        messageId: result.messageId,
      });
    } else {
      return res.status(502).json({
        success: false,
        message: `Failed to dispatch SMS: ${result.error || "Gateway error"}`,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error sending test SMS:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to send test SMS" });
  }
});

// POST /admin/alerts/:id/retry - Retry sending failed SMS for an alert
adminAlertsRouter.post("/alerts/:id/retry", requireAuth, async (req, res) => {
  try {
    const alert = await retryAlertNotification(req.params.id);
    return res.json({ message: "Notification retried successfully", alert });
  } catch (error) {
    console.error("Error retrying alert notification:", error);
    return res.status(500).json({ message: error.message || "Failed to retry alert notification" });
  }
});

// PATCH /admin/alerts/:id/dismiss - Dismiss a single alert
adminAlertsRouter.patch("/alerts/:id/dismiss", requireAuth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "DISMISSED" } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    return res.json({ message: "Alert dismissed", alert });
  } catch (error) {
    console.error("Error dismissing alert:", error);
    return res.status(500).json({ message: "Failed to dismiss alert" });
  }
});

// POST /admin/alerts/clear - Clear / dismiss all active alerts
adminAlertsRouter.post("/alerts/clear", requireAuth, async (_req, res) => {
  try {
    await Alert.updateMany(
      { status: "ACTIVE" },
      { $set: { status: "DISMISSED" } }
    );
    return res.json({ message: "All active alerts dismissed" });
  } catch (error) {
    console.error("Error clearing alerts:", error);
    return res.status(500).json({ message: "Failed to clear alerts" });
  }
});
