import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { Collection } from "../models/Collection.js";
import { Alert } from "../models/Alert.js";
import { pushBlynkValue } from "./blynkService.js";
import { withMonitoring } from "../utils/sensorMonitoring.js";

export async function markBinCollected({ binId, collector }) {
  const collectedAt = new Date();
  const collectorLabel = collector.name || collector.mobile;

  const bin = await Bin.findOneAndUpdate(
    { id: binId },
    {
      fillLevel: 0,
      distance: 100,
      status: "Collected",
      lastCollected: collectedAt,
      assignedCollector: collectorLabel,
      lastAlertSeverity: "NONE",
    },
    { new: true }
  );

  if (!bin) return null;

  // Mark all active alerts for this bin as resolved
  await Alert.updateMany(
    { binId: bin.id, status: "ACTIVE" },
    { $set: { status: "RESOLVED", resolvedAt: collectedAt } }
  );

  const record = await Collection.create({
    binId: bin.id,
    location: bin.location,
    collectorId: collector._id,
    collectorName: collector.name || "",
    collectorMobile: collector.mobile,
    collectedAt,
  });

  if (bin.blynkPin) {
    await pushBlynkValue(bin.blynkPin, 100);
  }

  return { bin, collection: record };
}

export function needsCollection(bin) {
  if (bin.isActive === false) return false;
  if (typeof bin.fillLevel === "number") {
    const warningThreshold = Number(bin.warningThreshold ?? 50);
    return bin.fillLevel >= warningThreshold;
  }
  return bin.status === "Full" || bin.status === "Warning";
}

export async function enrichBinsWithCollectors(bins) {
  const collectorIds = [...new Set(bins.map((bin) => bin.assignedCollectorId).filter(Boolean))];
  const collectors = collectorIds.length
    ? await Collector.find({ _id: { $in: collectorIds } }).select("name mobile").lean()
    : [];
  const collectorMap = Object.fromEntries(collectors.map((collector) => [String(collector._id), collector]));

  return bins.map((bin) => {
    const assigned = bin.assignedCollectorId ? collectorMap[String(bin.assignedCollectorId)] : null;
    return {
      ...bin,
      ...withMonitoring(bin),
      assignedCollectorName: assigned?.name || null,
      assignedCollectorMobile: assigned?.mobile || null,
    };
  });
}
