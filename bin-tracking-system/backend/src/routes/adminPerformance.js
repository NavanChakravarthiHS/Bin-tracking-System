import express from "express";
import { Collection } from "../models/Collection.js";
import { Collector } from "../models/Collector.js";
import { Bin } from "../models/Bin.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminPerformanceRouter = express.Router();

// ─── Helper: compute score ───────────────────────────────────────────────────
function computeScore({ totalAssigned, completed, missed, avgMinutes }) {
  if (totalAssigned === 0) return 0;
  const completionRate = (completed / totalAssigned) * 100;
  const missedPenalty = Math.min(missed * 5, 30);
  const timePenalty = Math.max(0, (avgMinutes - 15) * 0.5); // Penalty for >15 min avg
  const score = Math.max(0, Math.min(100, completionRate - missedPenalty - timePenalty));
  return Math.round(score);
}

function scoreBand(score) {
  if (score >= 90) return { label: "Excellent", color: "green" };
  if (score >= 75) return { label: "Good", color: "yellow" };
  if (score >= 60) return { label: "Needs Improvement", color: "orange" };
  return { label: "Poor", color: "red" };
}

// ─── GET /admin/performance/summary ─────────────────────────────────────────
adminPerformanceRouter.get("/performance/summary", requireAuth, async (_req, res) => {
  try {
    const [collectors, allBins, allCollections] = await Promise.all([
      Collector.find().select("name mobile createdAt").lean(),
      Bin.find({ isActive: { $ne: false } }).select("id location assignedCollectorId status").lean(),
      Collection.find().lean(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCollections = allCollections.filter(
      (c) => new Date(c.collectedAt) >= todayStart
    );

    // Per-collector stats
    const collectorMap = {};
    collectors.forEach((c) => {
      collectorMap[String(c._id)] = {
        _id: c._id,
        name: c.name || "",
        mobile: c.mobile,
        assignedBins: allBins.filter(
          (b) => String(b.assignedCollectorId) === String(c._id)
        ),
        collections: allCollections.filter(
          (col) => String(col.collectorId) === String(c._id)
        ),
        todayCollections: todayCollections.filter(
          (col) => String(col.collectorId) === String(c._id)
        ),
      };
    });

    const collectorStats = collectors.map((collector) => {
      const info = collectorMap[String(collector._id)];
      const totalAssigned = info.assignedBins.length;
      const completed = info.collections.length;
      const missed = Math.max(0, totalAssigned - info.todayCollections.length);
      const avgMinutes = 10; // Approximate; no start-time stored yet

      const score = computeScore({ totalAssigned, completed, missed, avgMinutes });
      const band = scoreBand(score);

      return {
        _id: collector._id,
        name: collector.name || "",
        mobile: collector.mobile,
        assignedArea: info.assignedBins.map((b) => b.location).join(", ").slice(0, 40) || "—",
        assignedBinCount: totalAssigned,
        binsCollectedAllTime: completed,
        binsCollectedToday: info.todayCollections.length,
        missed,
        avgMinutes,
        overflowHandled: info.collections.filter((c) => c.overflowHandled).length,
        score,
        scoreBand: band,
        status: totalAssigned > 0 ? (info.todayCollections.length > 0 ? "Active" : "Inactive") : "Unassigned",
        assignedBins: info.assignedBins,
      };
    });

    const totalCollectorsCount = collectors.length;
    const activeCollectorsCount = collectorStats.filter((c) => c.status === "Active").length;
    const todayTotal = todayCollections.length;
    const avgScore =
      collectorStats.length > 0
        ? Math.round(
            collectorStats.reduce((sum, c) => sum + c.score, 0) / collectorStats.length
          )
        : 0;
    const missedTotal = collectorStats.reduce((sum, c) => sum + c.missed, 0);
    const overflowTotal = collectorStats.reduce((sum, c) => sum + c.overflowHandled, 0);

    return res.json({
      summary: {
        totalCollectors: totalCollectorsCount,
        activeCollectors: activeCollectorsCount,
        collectionsToday: todayTotal,
        avgCollectionTime: 10,
        missedCollections: missedTotal,
        overflowHandled: overflowTotal,
        avgPerformanceScore: avgScore,
      },
      collectors: collectorStats,
    });
  } catch (error) {
    console.error("Error fetching performance summary:", error);
    return res.status(500).json({ message: "Failed to fetch performance summary" });
  }
});

// ─── GET /admin/performance/collector/:id ────────────────────────────────────
adminPerformanceRouter.get("/performance/collector/:id", requireAuth, async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id).lean();
    if (!collector) return res.status(404).json({ message: "Collector not found" });

    const [assignedBins, allCollections] = await Promise.all([
      Bin.find({ assignedCollectorId: collector._id, isActive: { $ne: false } })
        .select("id location status fillLevel")
        .lean(),
      Collection.find({ collectorId: collector._id }).sort({ collectedAt: -1 }).lean(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todayCollections = allCollections.filter((c) => new Date(c.collectedAt) >= todayStart);
    const weekCollections = allCollections.filter((c) => new Date(c.collectedAt) >= weekStart);
    const monthCollections = allCollections.filter((c) => new Date(c.collectedAt) >= monthStart);

    const totalAssigned = assignedBins.length;
    const missed = Math.max(0, totalAssigned - todayCollections.length);
    const score = computeScore({
      totalAssigned,
      completed: allCollections.length,
      missed,
      avgMinutes: 10,
    });
    const band = scoreBand(score);

    // Weekly trend (Mon–Sun current week)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const dayCollections = allCollections.filter((c) => {
        const dt = new Date(c.collectedAt);
        return dt >= d && dt <= dEnd;
      });
      weeklyTrend.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toISOString().slice(0, 10),
        count: dayCollections.length,
      });
    }

    return res.json({
      collector: {
        _id: collector._id,
        name: collector.name || "",
        mobile: collector.mobile,
        assignedArea: assignedBins.map((b) => b.location).join(", ").slice(0, 80) || "—",
        status: todayCollections.length > 0 ? "Active" : totalAssigned > 0 ? "Inactive" : "Unassigned",
        score,
        scoreBand: band,
        assignedBinCount: totalAssigned,
        assignedBins,
        todayCount: todayCollections.length,
        weekCount: weekCollections.length,
        monthCount: monthCollections.length,
        missed,
        delayed: 0,
        overflowHandled: allCollections.filter((c) => c.overflowHandled).length,
        avgMinutes: 10,
        weeklyTrend,
        history: allCollections.slice(0, 100).map((c) => ({
          _id: c._id,
          binId: c.binId,
          location: c.location,
          collectedAt: c.collectedAt,
          status: "Completed",
          minutes: 10,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching collector performance:", error);
    return res.status(500).json({ message: "Failed to fetch collector details" });
  }
});

// ─── GET /admin/performance/charts ───────────────────────────────────────────
adminPerformanceRouter.get("/performance/charts", requireAuth, async (_req, res) => {
  try {
    const [collectors, allCollections, allBins] = await Promise.all([
      Collector.find().select("name mobile").lean(),
      Collection.find().lean(),
      Bin.find({ isActive: { $ne: false } }).select("location assignedCollectorId").lean(),
    ]);

    // Weekly performance (last 7 days) per-collector
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const entry = {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toISOString().slice(0, 10),
        total: 0,
      };

      collectors.forEach((c) => {
        const count = allCollections.filter((col) => {
          const dt = new Date(col.collectedAt);
          return String(col.collectorId) === String(c._id) && dt >= d && dt <= dEnd;
        }).length;
        entry[c.name || c.mobile] = count;
        entry.total += count;
      });

      weeklyData.push(entry);
    }

    // Collector comparison (total bins collected)
    const collectorComparison = collectors.map((c) => ({
      name: c.name || c.mobile,
      collected: allCollections.filter((col) => String(col.collectorId) === String(c._id)).length,
      assignedBins: allBins.filter((b) => String(b.assignedCollectorId) === String(c._id)).length,
    }));

    // Area-wise performance
    const areaMap = {};
    allCollections.forEach((col) => {
      const loc = col.location || "Unknown";
      if (!areaMap[loc]) areaMap[loc] = { area: loc, collected: 0 };
      areaMap[loc].collected += 1;
    });
    allBins.forEach((bin) => {
      const loc = bin.location || "Unknown";
      if (!areaMap[loc]) areaMap[loc] = { area: loc, collected: 0 };
    });
    const areaPerformance = Object.values(areaMap)
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 10);

    // Average collection time (static 10 min; real data would need timestamps)
    const avgTimeComparison = collectors.map((c) => ({
      name: c.name || c.mobile,
      avgMinutes: 10,
    }));

    return res.json({
      weeklyData,
      collectorComparison,
      avgTimeComparison,
      areaPerformance,
      collectorNames: collectors.map((c) => c.name || c.mobile),
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return res.status(500).json({ message: "Failed to fetch chart data" });
  }
});

// ─── GET /admin/performance/attention ────────────────────────────────────────
adminPerformanceRouter.get("/performance/attention", requireAuth, async (_req, res) => {
  try {
    const [collectors, allBins, allCollections] = await Promise.all([
      Collector.find().select("name mobile").lean(),
      Bin.find({ isActive: { $ne: false } }).select("id location status assignedCollectorId").lean(),
      Collection.find().lean(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const alerts = [];

    collectors.forEach((collector) => {
      const assigned = allBins.filter(
        (b) => String(b.assignedCollectorId) === String(collector._id)
      );
      const todayCollected = allCollections.filter(
        (c) =>
          String(c.collectorId) === String(collector._id) &&
          new Date(c.collectedAt) >= todayStart
      ).length;

      const missed = Math.max(0, assigned.length - todayCollected);
      if (missed > 0) {
        alerts.push({
          type: "missed",
          severity: missed >= 3 ? "red" : "orange",
          collectorId: String(collector._id),
          collectorName: collector.name || collector.mobile,
          message: `${missed} missed collection${missed > 1 ? "s" : ""} today`,
        });
      }
    });

    // Overflow bins (Full status)
    const fullBins = allBins.filter((b) => b.status === "Full");
    fullBins.forEach((bin) => {
      alerts.push({
        type: "overflow",
        severity: "red",
        binId: bin.id,
        area: bin.location,
        message: `Bin ${bin.id} at ${bin.location} is overflowing`,
      });
    });

    // Areas needing support (Warning status)
    const warningBins = allBins.filter((b) => b.status === "Warning");
    const warningAreas = [...new Set(warningBins.map((b) => b.location))];
    warningAreas.slice(0, 5).forEach((area) => {
      const count = warningBins.filter((b) => b.location === area).length;
      alerts.push({
        type: "area",
        severity: "yellow",
        area,
        message: `${count} bin${count > 1 ? "s" : ""} at warning level in ${area}`,
      });
    });

    return res.json({ alerts });
  } catch (error) {
    console.error("Error fetching attention alerts:", error);
    return res.status(500).json({ message: "Failed to fetch attention data" });
  }
});

// ─── GET /admin/performance/report ───────────────────────────────────────────
// Accepts query params: type, dateFrom, dateTo, collectorId, area
adminPerformanceRouter.get("/performance/report", requireAuth, async (req, res) => {
  try {
    const { type, dateFrom, dateTo, collectorId, area } = req.query;

    // Build date range filter
    let startDate = null;
    let endDate = null;

    if (dateFrom) {
      startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
    }
    if (dateTo) {
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
    }

    // Build collection query
    const collectionQuery = {};
    if (startDate && endDate) {
      collectionQuery.collectedAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      collectionQuery.collectedAt = { $gte: startDate };
    }
    if (collectorId && collectorId !== "all") {
      let objId = null;
      try {
        const mongoose = (await import("mongoose")).default;
        objId = new mongoose.Types.ObjectId(collectorId);
      } catch (e) {}

      const ids = [String(collectorId)];
      if (objId) ids.push(objId);
      collectionQuery.collectorId = { $in: ids };
    }
    if (area && area !== "all") {
      const escapedArea = area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      collectionQuery.location = { $regex: escapedArea, $options: "i" };
    }

    // Fetch data
    const [collectors, allBins, matchedCollections] = await Promise.all([
      Collector.find(collectorId && collectorId !== "all"
        ? { _id: collectorId }
        : {}
      ).select("name mobile createdAt").lean(),
      Bin.find({ isActive: { $ne: false } }).select("id location status assignedCollectorId").lean(),
      Collection.find(collectionQuery).sort({ collectedAt: -1 }).lean(),
    ]);

    // Filter collections by area if needed (already done in query, but double-check)
    let collections = matchedCollections;

    // Per-collector breakdown
    const collectorStats = collectors.map((collector) => {
      const assignedBins = allBins.filter(
        (b) => String(b.assignedCollectorId) === String(collector._id)
      );
      const collectorCollections = collections.filter(
        (c) => String(c.collectorId) === String(collector._id)
      );

      const totalAssigned = assignedBins.length;
      const completed = collectorCollections.length;

      // Missed = assigned bins that have no collection in the period
      const collectedBinIds = new Set(collectorCollections.map((c) => c.binId));
      const missed = assignedBins.filter((b) => !collectedBinIds.has(b.id)).length;

      const score = computeScore({ totalAssigned, completed, missed, avgMinutes: 10 });
      const band = scoreBand(score);

      // Area breakdown
      const areaMap = {};
      collectorCollections.forEach((c) => {
        const loc = c.location || "Unknown";
        if (!areaMap[loc]) areaMap[loc] = 0;
        areaMap[loc] += 1;
      });

      // Weekly trend (last 7 days or within date range)
      const trendDays = 7;
      const weeklyTrend = [];
      for (let i = trendDays - 1; i >= 0; i--) {
        const d = endDate ? new Date(endDate) : new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setHours(23, 59, 59, 999);
        const dayCount = collectorCollections.filter((c) => {
          const dt = new Date(c.collectedAt);
          return dt >= d && dt <= dEnd;
        }).length;
        weeklyTrend.push({
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          date: d.toISOString().slice(0, 10),
          count: dayCount,
        });
      }

      return {
        _id: collector._id,
        name: collector.name || "",
        mobile: collector.mobile,
        assignedBinCount: totalAssigned,
        completed,
        missed,
        score,
        scoreBand: band,
        avgMinutes: 10,
        overflowHandled: 0,
        delayed: 0,
        completionRate: totalAssigned > 0 ? Math.round((completed / Math.max(completed + missed, 1)) * 100) : 0,
        areaBreakdown: Object.entries(areaMap).map(([loc, count]) => ({ area: loc, count })),
        weeklyTrend,
        assignedBins,
      };
    });

    // Summary
    const totalCollections = collections.length;
    const totalMissed = collectorStats.reduce((s, c) => s + c.missed, 0);
    const totalCompleted = collectorStats.reduce((s, c) => s + c.completed, 0);
    const totalAssigned = collectorStats.reduce((s, c) => s + c.assignedBinCount, 0);
    const avgScore =
      collectorStats.length > 0
        ? Math.round(collectorStats.reduce((s, c) => s + c.score, 0) / collectorStats.length)
        : 0;

    // Area breakdown across all collections
    const areaMap = {};
    collections.forEach((c) => {
      const loc = c.location || "Unknown";
      if (!areaMap[loc]) areaMap[loc] = { area: loc, count: 0, collectors: new Set() };
      areaMap[loc].count += 1;
      if (c.collectorName) areaMap[loc].collectors.add(c.collectorName);
    });
    const areaBreakdown = Object.values(areaMap)
      .map((a) => ({ area: a.area, count: a.count, collectorCount: a.collectors.size }))
      .sort((a, b) => b.count - a.count);

    // Detailed collection log
    const collectionLog = collections.map((c) => ({
      _id: c._id,
      binId: c.binId,
      location: c.location || "",
      collectorName: c.collectorName || "",
      collectorMobile: c.collectorMobile || "",
      collectedAt: c.collectedAt,
    }));

    return res.json({
      reportMeta: {
        type: type || "all_logs",
        dateFrom: startDate ? startDate.toISOString() : null,
        dateTo: endDate ? endDate.toISOString() : null,
        area: area || "All Areas",
        generatedAt: new Date().toISOString(),
      },
      summary: {
        totalCollectors: collectors.length,
        totalAssigned,
        totalCompleted,
        totalMissed,
        totalCollections,
        avgScore,
        avgCollectionTime: 10,
        completionRate: (totalCompleted + totalMissed) > 0
          ? Math.round((totalCompleted / (totalCompleted + totalMissed)) * 100)
          : 0,
      },
      collectorStats,
      areaBreakdown,
      collectionLog,
    });
  } catch (error) {
    console.error("Error generating report data:", error);
    return res.status(500).json({ message: "Failed to generate report data" });
  }
});

