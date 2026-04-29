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
