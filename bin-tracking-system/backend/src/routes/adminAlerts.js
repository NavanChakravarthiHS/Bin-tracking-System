import express from "express";
import { Alert } from "../models/Alert.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { retryAlertNotification } from "../services/alertService.js";

export const adminAlertsRouter = express.Router();

// GET /admin/alerts - Get all alerts with statistics
adminAlertsRouter.get("/alerts", requireAuth, async (req, res) => {
  try {
    const { status, severity } = req.query;
    const query = {};

    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }
    if (severity && severity !== "ALL") {
      query.severity = severity.toUpperCase();
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
      warning: allAlerts.filter((a) => a.status === "ACTIVE" && a.severity === "WARNING").length,
      failedNotifications: allAlerts.filter(
        (a) => a.status === "ACTIVE" && a.smsStatus === "FAILED"
      ).length,
    };

    return res.json({ alerts, stats });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ message: "Failed to fetch alerts" });
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
