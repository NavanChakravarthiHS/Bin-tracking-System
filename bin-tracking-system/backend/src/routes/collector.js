import express from "express";
import bcrypt from "bcrypt";
import { Collector } from "../models/Collector.js";
import { Bin } from "../models/Bin.js";
import { signCollectorJwt } from "../utils/jwt.js";
import { requireCollectorAuth } from "../middleware/requireCollectorAuth.js";
import { markBinCollected } from "../services/collectionService.js";
import { withMonitoring } from "../utils/sensorMonitoring.js";

export const collectorRouter = express.Router();

// POST /collector/signup
collectorRouter.post("/signup", async (req, res) => {
  const { name, mobile, password, confirmPassword } = req.body || {};

  // Validation
  if (!/^\d{10}$/.test(String(mobile || ""))) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Check if mobile already exists
  const existing = await Collector.findOne({ mobile: String(mobile) });
  if (existing) {
    return res.status(409).json({ message: "Mobile number already registered" });
  }

  // Hash password and save
  const passwordHash = await bcrypt.hash(password, 10);
  const collector = await Collector.create({
    name: typeof name === "string" ? name.trim() : "",
    mobile: String(mobile),
    passwordHash,
  });

  return res.status(201).json({ 
    message: "Signup successful", 
    collector: { name: collector.name, mobile: collector.mobile } 
  });
});

// POST /collector/login
collectorRouter.post("/login", async (req, res) => {
  const { mobile, password } = req.body || {};

  if (!/^\d{10}$/.test(String(mobile || ""))) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const collector = await Collector.findOne({ mobile: String(mobile) });
  if (!collector) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, collector.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signCollectorJwt({ collectorId: String(collector._id), mobile: collector.mobile });
  return res.json({ 
    token, 
    collector: { name: collector.name, mobile: collector.mobile } 
  });
});

// GET /collector/me (protected route)
collectorRouter.get("/me", requireCollectorAuth, async (req, res) => {
  const collector = await Collector.findById(req.collector.collectorId)
    .select("name mobile")
    .lean();
  if (!collector) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ collector });
});

// GET /collector/bins - Get all bins (protected route)
collectorRouter.get("/bins", requireCollectorAuth, async (req, res) => {
  try {
    const bins = await Bin.find({
      assignedCollectorId: req.collector.collectorId,
      isActive: { $ne: false },
    })
      .sort({ status: 1 })
      .lean();
    return res.json({ bins: bins.map(withMonitoring) });
  } catch (error) {
    console.error('Error fetching bins:', error);
    return res.status(500).json({ message: "Failed to fetch bins" });
  }
});

// POST /collector/update-status (protected route)
collectorRouter.post("/update-status", requireCollectorAuth, async (req, res) => {
  const { binId, status, fillLevel } = req.body || {};

  if (!binId) {
    return res.status(400).json({ message: "Bin ID is required" });
  }

  try {
    const collector = await Collector.findById(req.collector.collectorId);
    if (!collector) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await markBinCollected({ binId, collector });
    if (!result) {
      return res.status(404).json({ message: "Bin not found" });
    }

    return res.json({
      message: "Bin status updated successfully",
      bin: result.bin,
      collection: result.collection,
    });
  } catch (error) {
    console.error('Error updating bin:', error);
    return res.status(500).json({ message: "Failed to update bin status" });
  }
});
