import express from "express";
import bcrypt from "bcrypt";
import { Collector } from "../models/Collector.js";
import { Bin } from "../models/Bin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { assignBinsToCollector, serializeCollectorById, serializeCollectors } from "../services/collectorAssignments.js";

export const adminCollectorsRouter = express.Router();

function validateName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}

function validateMobile(mobile) {
  return /^\d{10}$/.test(String(mobile || ""));
}

adminCollectorsRouter.get("/collectors", requireAuth, async (_req, res) => {
  try {
    const collectors = await serializeCollectors();
    const bins = await Bin.find({ isActive: { $ne: false } }).select("id location status assignedCollectorId").sort({ id: 1 }).lean();
    return res.json({ collectors, bins });
  } catch (error) {
    console.error("Error fetching collectors:", error);
    return res.status(500).json({ message: "Failed to fetch collectors" });
  }
});

adminCollectorsRouter.get("/collectors/:id", requireAuth, async (req, res) => {
  try {
    const collector = await serializeCollectorById(req.params.id);
    if (!collector) return res.status(404).json({ message: "Collector not found" });
    return res.json({ collector });
  } catch (error) {
    console.error("Error fetching collector:", error);
    return res.status(500).json({ message: "Failed to fetch collector" });
  }
});

adminCollectorsRouter.post("/collectors", requireAuth, async (req, res) => {
  const { name, mobile, password, binIds } = req.body || {};

  if (!validateName(name)) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!validateMobile(mobile)) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await Collector.findOne({ mobile: String(mobile) });
    if (existing) {
      return res.status(409).json({ message: "Mobile number already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const collector = await Collector.create({
      name: name.trim(),
      mobile: String(mobile),
      passwordHash,
    });

    await assignBinsToCollector(collector._id, binIds);
    const saved = await serializeCollectorById(collector._id);
    return res.status(201).json({ message: "Collector created", collector: saved });
  } catch (error) {
    console.error("Error creating collector:", error);
    return res.status(500).json({ message: "Failed to create collector" });
  }
});

adminCollectorsRouter.put("/collectors/:id", requireAuth, async (req, res) => {
  const { name, mobile, password, binIds } = req.body || {};

  if (!validateName(name)) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!validateMobile(mobile)) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  if (password != null && password !== "" && (typeof password !== "string" || password.length < 6)) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const collector = await Collector.findById(req.params.id);
    if (!collector) return res.status(404).json({ message: "Collector not found" });

    const duplicate = await Collector.findOne({
      mobile: String(mobile),
      _id: { $ne: collector._id },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Mobile number already registered" });
    }

    collector.name = name.trim();
    collector.mobile = String(mobile);
    if (typeof password === "string" && password.length >= 6) {
      collector.passwordHash = await bcrypt.hash(password, 10);
    }
    await collector.save();

    if (Array.isArray(binIds)) {
      await assignBinsToCollector(collector._id, binIds);
    }

    const saved = await serializeCollectorById(collector._id);
    return res.json({ message: "Collector updated", collector: saved });
  } catch (error) {
    console.error("Error updating collector:", error);
    return res.status(500).json({ message: "Failed to update collector" });
  }
});

adminCollectorsRouter.delete("/collectors/:id", requireAuth, async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id);
    if (!collector) return res.status(404).json({ message: "Collector not found" });

    await Bin.updateMany(
      { assignedCollectorId: collector._id },
      { $set: { assignedCollectorId: null } }
    );
    await collector.deleteOne();

    return res.json({ message: "Collector deleted" });
  } catch (error) {
    console.error("Error deleting collector:", error);
    return res.status(500).json({ message: "Failed to delete collector" });
  }
});

adminCollectorsRouter.post("/bins/:id/assign", requireAuth, async (req, res) => {
  const { collectorId } = req.body || {};

  try {
    const bin = await Bin.findOne({ id: req.params.id });
    if (!bin) return res.status(404).json({ message: "Bin not found" });

    if (!collectorId) {
      bin.assignedCollectorId = null;
      await bin.save();
      return res.json({ message: "Bin unassigned", bin });
    }

    const collector = await Collector.findById(collectorId);
    if (!collector) return res.status(404).json({ message: "Collector not found" });

    bin.assignedCollectorId = collector._id;
    await bin.save();
    return res.json({ message: "Bin reassigned", bin });
  } catch (error) {
    console.error("Error assigning bin:", error);
    return res.status(500).json({ message: "Failed to assign bin" });
  }
});
