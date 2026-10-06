import express from "express";
import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { withMonitoring } from "../utils/sensorMonitoring.js";
import { parseBinPayload, statusFromFillLevel } from "../utils/binStatus.js";
import { Collection } from "../models/Collection.js";
import { processBinAlert } from "../services/alertService.js";
import { ingestSensorReading } from "../services/sensorIngest.js";

export const adminBinsRouter = express.Router();

// GET /admin/bins - Get all bins
adminBinsRouter.get("/bins", requireAuth, async (req, res) => {
  try {
    const filter = req.query.includeInactive === "true" ? {} : { isActive: { $ne: false } };
    const bins = await Bin.find(filter).sort({ status: 1, id: 1 }).lean();
    const collectorIds = [...new Set(bins.map((bin) => bin.assignedCollectorId).filter(Boolean))];
    const collectors = collectorIds.length
      ? await Collector.find({ _id: { $in: collectorIds } }).select("name mobile").lean()
      : [];
    const collectorMap = Object.fromEntries(collectors.map((collector) => [String(collector._id), collector]));

    const enrichedBins = bins.map((bin) => {
      const assigned = bin.assignedCollectorId ? collectorMap[String(bin.assignedCollectorId)] : null;
      return withMonitoring({
        ...bin,
        assignedCollectorName: assigned?.name || null,
        assignedCollectorMobile: assigned?.mobile || null,
      });
    });

    return res.json({ bins: enrichedBins });
  } catch (error) {
    console.error('Error fetching bins:', error);
    return res.status(500).json({ message: "Failed to fetch bins" });
  }
});

// GET /admin/bins/:id - Get single bin
adminBinsRouter.get("/bins/:id", requireAuth, async (req, res) => {
  try {
    const bin = await Bin.findOne({ id: req.params.id }).lean();
    if (!bin) return res.status(404).json({ message: "Bin not found" });
    return res.json({ bin: withMonitoring(bin) });
  } catch (error) {
    console.error('Error fetching bin:', error);
    return res.status(500).json({ message: "Failed to fetch bin" });
  }
});

adminBinsRouter.post("/bins", requireAuth, async (req, res) => {
  const parsed = parseBinPayload(req.body, { requireId: true });
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  try {
    const existing = await Bin.findOne({ id: parsed.id });
    if (existing) return res.status(409).json({ message: "Bin ID already exists" });

    const fillLevel = 0;
    const bin = await Bin.create({
      id: parsed.id,
      location: parsed.location,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      warningThreshold: parsed.warningThreshold,
      fullThreshold: parsed.fullThreshold,
      blynkPin: parsed.blynkPin,
      fillLevel,
      distance: 50,
      status: statusFromFillLevel(fillLevel, parsed),
      isActive: true,
    });

    return res.status(201).json({ message: "Bin created", bin: withMonitoring(bin.toObject()) });
  } catch (error) {
    console.error("Error creating bin:", error);
    return res.status(500).json({ message: "Failed to create bin" });
  }
});

adminBinsRouter.put("/bins/:id", requireAuth, async (req, res) => {
  const parsed = parseBinPayload(req.body, { requireId: true });
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  try {
    const bin = await Bin.findOne({ id: req.params.id });
    if (!bin) return res.status(404).json({ message: "Bin not found" });

    if (parsed.id !== bin.id) {
      const duplicate = await Bin.findOne({ id: parsed.id });
      if (duplicate) return res.status(409).json({ message: "Bin ID already exists" });
      await Collection.updateMany({ binId: bin.id }, { $set: { binId: parsed.id } });
      bin.id = parsed.id;
    }

    bin.location = parsed.location;
    bin.latitude = parsed.latitude;
    bin.longitude = parsed.longitude;
    bin.warningThreshold = parsed.warningThreshold;
    bin.fullThreshold = parsed.fullThreshold;
    bin.blynkPin = parsed.blynkPin;
    bin.status = statusFromFillLevel(bin.fillLevel, parsed);
    await bin.save();

    // Trigger alert evaluation for any threshold breaches after manual update
    try {
      await processBinAlert({ bin, fillLevel: bin.fillLevel });
    } catch (err) {
      console.error(`Error processing alert after admin bin update ${bin.id}:`, err);
    }

    return res.json({ message: "Bin updated", bin: withMonitoring(bin.toObject()) });
  } catch (error) {
    console.error("Error updating bin:", error);
    return res.status(500).json({ message: "Failed to update bin" });
  }
});

adminBinsRouter.patch("/bins/:id/active", requireAuth, async (req, res) => {
  const isActive = Boolean(req.body?.isActive);

  try {
    const bin = await Bin.findOneAndUpdate(
      { id: req.params.id },
      { $set: { isActive } },
      { new: true }
    );
    if (!bin) return res.status(404).json({ message: "Bin not found" });
    return res.json({
      message: isActive ? "Bin activated" : "Bin deactivated",
      bin: withMonitoring(bin.toObject()),
    });
  } catch (error) {
    console.error("Error updating bin active state:", error);
    return res.status(500).json({ message: "Failed to update bin" });
  }
});

adminBinsRouter.delete("/bins/:id", requireAuth, async (req, res) => {
  try {
    const bin = await Bin.findOneAndDelete({ id: req.params.id });
    if (!bin) return res.status(404).json({ message: "Bin not found" });
    return res.json({ message: "Bin deleted" });
  } catch (error) {
    console.error("Error deleting bin:", error);
    return res.status(500).json({ message: "Failed to delete bin" });
  }
});

// POST /admin/bins/:id/sensor - Public sensor update route for IoT hardware (NodeMCU / ESP8266 / ESP32)
adminBinsRouter.post("/bins/:id/sensor", async (req, res) => {
  try {
    const result = await ingestSensorReading({
      binId: req.params.id,
      body: req.body || {},
    });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("Error updating bin via sensor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

