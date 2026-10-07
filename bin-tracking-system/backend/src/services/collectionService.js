import { Bin } from "../models/Bin.js";
import { Collector } from "../models/Collector.js";
import { Collection } from "../models/Collection.js";
import { Alert } from "../models/Alert.js";
import { alertConfig, getVerificationTimeoutMs } from "../config/alertConfig.js";
import { pushBlynkValue } from "./blynkService.js";
import { withMonitoring } from "../utils/sensorMonitoring.js";
import { sendAdminCriticalAlert, getAdminMobileNumber } from "./smsNotificationService.js";
import { sendSMS } from "./textbeeService.js";

/**
 * Initiates the Collection Verification Process.
 * Called when a collector taps "Mark as Collected" or scans QR code.
 */
export async function initiateCollectionVerification({ binId, collector, qrCode = null }) {
  const bin = await Bin.findOne({ id: binId });
  if (!bin) {
    return { error: "Bin not found" };
  }

  // QR Code Verification (Optional / Recommended)
  if (qrCode) {
    const scannedCode = String(qrCode).trim().toUpperCase();
    const expectedCode = String(bin.qrCode || bin.id).trim().toUpperCase();
    if (scannedCode !== expectedCode) {
      return { error: `QR Code mismatch. Scanned '${scannedCode}' does not match Bin '${bin.id}'.` };
    }
  }

  const startedAt = new Date();
  const fillBefore = bin.fillLevel ?? 0;
  const collectorLabel = collector.name || collector.mobile;

  // If already verification pending, return existing record
  if (bin.isVerificationPending && bin.activeCollectionId) {
    const existingCollection = await Collection.findById(bin.activeCollectionId);
    if (existingCollection) {
      return {
        success: true,
        message: "Collection verification is already pending sensor confirmation.",
        bin: withMonitoring(bin.toObject()),
        collection: existingCollection,
      };
    }
  }

  // Create Collection record in PENDING state
  const collectionRecord = await Collection.create({
    binId: bin.id,
    location: bin.location,
    collectorId: collector._id,
    collectorName: collector.name || "",
    collectorMobile: collector.mobile,
    fillLevelBefore: fillBefore,
    fillLevelAfter: null,
    collectionStartedAt: startedAt,
    verificationStatus: "PENDING",
    qrScanned: Boolean(qrCode),
    collectedAt: startedAt,
  });

  // Update Bin model state to VERIFICATION_PENDING
  bin.isVerificationPending = true;
  bin.activeCollectionId = collectionRecord._id;
  bin.consecutiveLowReadings = 0;
  bin.verificationStartedAt = startedAt;
  await bin.save();

  console.log(
    `⏳ [Collection Started - Verification Pending] Bin: ${bin.id} | Collector: ${collectorLabel} | Fill Before: ${fillBefore}%`
  );

  return {
    success: true,
    message: "Collection initiated successfully. Sensor verification pending.",
    bin: withMonitoring(bin.toObject()),
    collection: collectionRecord,
  };
}

/**
 * Checks and confirms collection verification on incoming sensor readings.
 */
export async function checkPendingCollectionVerification({ bin, currentFill }) {
  if (!bin || !bin.isVerificationPending || !bin.activeCollectionId) {
    return { verified: false, pending: false };
  }

  const fill = Math.max(0, Math.min(100, Math.round(currentFill)));
  const threshold = alertConfig.verificationMaxFillPercentage; // e.g. 30%

  if (fill <= threshold) {
    bin.consecutiveLowReadings = (bin.consecutiveLowReadings || 0) + 1;

    if (bin.consecutiveLowReadings >= alertConfig.verificationReadingsRequired) {
      // ✅ COLLECTION VERIFIED!
      const verifiedAt = new Date();
      const collectionRecord = await Collection.findById(bin.activeCollectionId);

      let durationSeconds = 0;
      if (collectionRecord && collectionRecord.collectionStartedAt) {
        durationSeconds = Math.max(1, Math.round((verifiedAt.getTime() - collectionRecord.collectionStartedAt.getTime()) / 1000));
      }

      if (collectionRecord) {
        collectionRecord.verificationStatus = "VERIFIED";
        collectionRecord.fillLevelAfter = fill;
        collectionRecord.verifiedAt = verifiedAt;
        collectionRecord.collectedAt = verifiedAt;
        collectionRecord.collectionDurationSeconds = durationSeconds;
        await collectionRecord.save();
      }

      // Reset Bin state
      bin.fillLevel = fill;
      bin.status = "Collected";
      bin.lastCollected = verifiedAt;
      bin.isVerificationPending = false;
      bin.activeCollectionId = null;
      bin.consecutiveLowReadings = 0;
      bin.verificationStartedAt = null;
      bin.lastAlertState = "NORMAL";
      bin.lastAlertSeverity = "NONE";
      bin.consecutiveCriticalReadings = 0;
      bin.isEscalated = false;
      bin.escalatedAt = null;
      await bin.save();

      // Resolve active alerts for this bin
      await Alert.updateMany(
        { binId: bin.id, status: "ACTIVE" },
        { $set: { status: "RESOLVED", resolvedAt: verifiedAt } }
      );

      // Update Blynk if pin configured
      if (bin.blynkPin) {
        await pushBlynkValue(bin.blynkPin, 50);
      }

      console.log(
        `✅ [Collection VERIFIED] Bin: ${bin.id} | Fill After: ${fill}% | Duration: ${durationSeconds}s`
      );

      return { verified: true, collection: collectionRecord };
    } else {
      await bin.save();
      console.log(
        `⏳ [Verification Progress] Bin: ${bin.id} | Fill: ${fill}% <= ${threshold}% (${bin.consecutiveLowReadings}/${alertConfig.verificationReadingsRequired} low readings confirmed)`
      );
    }
  } else {
    // Fill level is still > threshold, reset low reading counter
    bin.consecutiveLowReadings = 0;
    await bin.save();
  }

  return { verified: false, pending: true };
}

/**
 * Checks for Collection Verification Timeouts (10 minutes)
 */
export async function checkVerificationTimeouts() {
  try {
    const timeoutMs = getVerificationTimeoutMs();
    const cutoff = new Date(Date.now() - timeoutMs);

    const timedOutBins = await Bin.find({
      isVerificationPending: true,
      verificationStartedAt: { $lte: cutoff },
    });

    for (const bin of timedOutBins) {
      console.warn(`❌ [Collection Verification FAILED] Bin ${bin.id} did not drop below ${alertConfig.verificationMaxFillPercentage}% within ${alertConfig.verificationTimeoutMinutes} minutes.`);

      const collectionRecord = bin.activeCollectionId
        ? await Collection.findById(bin.activeCollectionId)
        : null;

      const failureMessage = `Sensor fill level remained at ${bin.fillLevel}% (did not drop below ${alertConfig.verificationMaxFillPercentage}% threshold within ${alertConfig.verificationTimeoutMinutes} minutes).`;

      if (collectionRecord) {
        collectionRecord.verificationStatus = "FAILED";
        collectionRecord.fillLevelAfter = bin.fillLevel;
        collectionRecord.failureReason = failureMessage;
        await collectionRecord.save();
      }

      const collectorName = collectionRecord?.collectorName || bin.assignedCollector || "Collector";

      // Reset Bin verification pending status (alert remains ACTIVE!)
      bin.isVerificationPending = false;
      bin.activeCollectionId = null;
      bin.consecutiveLowReadings = 0;
      bin.verificationStartedAt = null;
      await bin.save();

      // Send SMS alert to Admin regarding Verification Failure
      const adminMobile = await getAdminMobileNumber();
      if (adminMobile) {
        const smsMsg = `Collection Failure: Collector ${collectorName} initiated collection for Bin ${bin.id} at ${bin.location}, but verification failed (Fill level remains ${bin.fillLevel}%).`;
        await sendSMS(adminMobile, smsMsg);
      }

      // Create Admin Alert record for Collection Verification Failure
      await Alert.create({
        binId: bin.id,
        fillLevel: bin.fillLevel ?? 0,
        alertType: "COLLECTION_REQUIRED",
        severity: "CRITICAL",
        status: "ACTIVE",
        location: bin.location,
        latitude: bin.latitude ?? null,
        longitude: bin.longitude ?? null,
        collectorId: collectionRecord?.collectorId || null,
        collectorName,
        message: `Collection Verification Failed: Bin ${bin.id} at ${bin.location} was marked as collected by ${collectorName}, but sensor reading (${bin.fillLevel}%) confirms it was not emptied.`,
      });
    }
  } catch (error) {
    console.error("Error checking verification timeouts:", error);
  }
}

/**
 * Backward compatibility wrapper for markBinCollected
 */
export async function markBinCollected({ binId, collector, qrCode = null }) {
  return await initiateCollectionVerification({ binId, collector, qrCode });
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
