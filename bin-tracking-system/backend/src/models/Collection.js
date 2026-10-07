import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    binId: { type: String, required: true, index: true },
    location: { type: String, default: "" },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
      default: null,
    },
    collectorName: { type: String, default: "" },
    collectorMobile: { type: String, default: "" },
    fillLevelBefore: { type: Number, required: true },
    fillLevelAfter: { type: Number, default: null },
    collectionStartedAt: { type: Date, required: true, default: Date.now },
    verifiedAt: { type: Date, default: null },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    failureReason: { type: String, default: "" },
    collectionDurationSeconds: { type: Number, default: null },
    qrScanned: { type: Boolean, default: false },
    collectedAt: { type: Date, default: Date.now }, // Backward compatibility
  },
  { timestamps: true }
);

export const Collection = mongoose.model("Collection", collectionSchema);
