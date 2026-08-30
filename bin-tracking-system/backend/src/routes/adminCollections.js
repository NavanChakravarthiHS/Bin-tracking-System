import express from "express";
import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { Collection } from "../models/Collection.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { enrichBinsWithCollectors, markBinCollected, needsCollection } from "../services/collectionService.js";

export const adminCollectionsRouter = express.Router();

adminCollectionsRouter.get("/collections", requireAuth, async (_req, res) => {
  try {
    const [allBins, collectors, history] = await Promise.all([
      Bin.find().sort({ fillLevel: -1, id: 1 }).lean(),
      Collector.find().select("name mobile").sort({ name: 1 }).lean(),
      Collection.find().sort({ collectedAt: -1 }).limit(25).lean(),
    ]);

    const pending = await enrichBinsWithCollectors(allBins.filter(needsCollection));

    return res.json({
      pending,
      collectors,
      history,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({ message: "Failed to fetch collection data" });
  }
});

adminCollectionsRouter.post("/bins/:id/collect", requireAuth, async (req, res) => {
  const { collectorId } = req.body || {};

  try {
    const bin = await Bin.findOne({ id: req.params.id });
    if (!bin) return res.status(404).json({ message: "Bin not found" });

    const resolvedCollectorId = collectorId || bin.assignedCollectorId;
    if (!resolvedCollectorId) {
      return res.status(400).json({ message: "Assign a collector before marking this bin as collected" });
    }

    const collector = await Collector.findById(resolvedCollectorId);
    if (!collector) return res.status(404).json({ message: "Collector not found" });

    if (!bin.assignedCollectorId || String(bin.assignedCollectorId) !== String(collector._id)) {
      bin.assignedCollectorId = collector._id;
      await bin.save();
    }

    const result = await markBinCollected({ binId: bin.id, collector });
    if (!result) return res.status(404).json({ message: "Bin not found" });

    return res.json({
      message: "Bin marked as collected",
      bin: result.bin,
      collection: result.collection,
    });
  } catch (error) {
    console.error("Error marking bin collected:", error);
    return res.status(500).json({ message: "Failed to mark bin as collected" });
  }
});
