import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";

export async function assignBinsToCollector(collectorId, binIds) {
  const uniqueIds = [...new Set((Array.isArray(binIds) ? binIds : []).map(String).filter(Boolean))];

  await Bin.updateMany(
    { assignedCollectorId: collectorId, id: { $nin: uniqueIds } },
    { $set: { assignedCollectorId: null } }
  );

  if (uniqueIds.length > 0) {
    await Bin.updateMany(
      { id: { $in: uniqueIds } },
      { $set: { assignedCollectorId: collectorId } }
    );
  }
}

export async function serializeCollectors() {
  const [collectors, bins] = await Promise.all([
    Collector.find().select("name mobile createdAt").sort({ createdAt: -1 }).lean(),
    Bin.find({ isActive: { $ne: false } }).select("id location status fillLevel assignedCollectorId").sort({ id: 1 }).lean(),
  ]);

  return collectors.map((collector) => {
    const assignedBins = bins
      .filter((bin) => String(bin.assignedCollectorId || "") === String(collector._id))
      .map((bin) => ({
        id: bin.id,
        location: bin.location,
        status: bin.status,
        fillLevel: bin.fillLevel,
      }));

    return {
      _id: collector._id,
      name: collector.name || "",
      mobile: collector.mobile,
      assignedBins,
      binCount: assignedBins.length,
      createdAt: collector.createdAt,
    };
  });
}

export async function serializeCollectorById(collectorId) {
  const collectors = await serializeCollectors();
  return collectors.find((collector) => String(collector._id) === String(collectorId)) || null;
}
