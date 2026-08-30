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
    collectedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export const Collection = mongoose.model("Collection", collectionSchema);
