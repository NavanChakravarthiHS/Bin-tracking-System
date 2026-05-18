import express from "express";
import { Bin } from "../models/Bin.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminBinsRouter = express.Router();

// GET /admin/bins - Get all bins
adminBinsRouter.get("/bins", requireAuth, async (req, res) => {
  try {
    const bins = await Bin.find().sort({ status: 1 }).lean();
    return res.json({ bins });
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
    return res.json({ bin });
  } catch (error) {
    console.error('Error fetching bin:', error);
    return res.status(500).json({ message: "Failed to fetch bin" });
  }
});

// POST /admin/bins/:id/sensor - Public sensor update route for IoT hardware (ESP8266 / ESP32)
adminBinsRouter.post("/bins/:id/sensor", async (req, res) => {
  const { id } = req.params;
  const { fillLevel } = req.body || {};

  if (typeof fillLevel !== "number" || fillLevel < 0 || fillLevel > 100) {
    return res.status(400).json({ message: "Fill level must be a number between 0 and 100" });
  }

  let status = "Normal";
  if (fillLevel >= 80) status = "Full";
  else if (fillLevel >= 50) status = "Warning";
  else if (fillLevel > 0) status = "Normal";
  else status = "Collected";

  const updateFields = { fillLevel, status };
  if (fillLevel > 0) {
    updateFields.lastCollected = null;
    updateFields.assignedCollector = null;
  }

  try {
    const bin = await Bin.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    );

    if (!bin) return res.status(404).json({ message: "Bin not found" });

    // eslint-disable-next-line no-console
    console.log(`📡 IoT Sensor Update - Bin: ${id} | Fill Level: ${fillLevel}% | Status: ${status}`);

    return res.json({ message: "Bin level updated by sensor successfully", bin });
  } catch (error) {
    console.error("Error updating bin via sensor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
