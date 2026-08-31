import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    binId: { type: String, required: true, index: true },
    fillLevel: { type: Number, required: true },
    severity: {
      type: String,
      enum: ["WARNING", "CRITICAL"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "DISMISSED"],
      default: "ACTIVE",
      index: true,
    },
    location: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
      default: null,
    },
    collectorName: { type: String, default: "" },
    collectorMobile: { type: String, default: "" },
    smsStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "SKIPPED", "NOT_SENT"],
      default: "NOT_SENT",
    },
    smsError: { type: String, default: "" },
    smsMessageSid: { type: String, default: "" },
    whatsappStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "SKIPPED", "NOT_SENT"],
      default: "NOT_SENT",
    },
    whatsappError: { type: String, default: "" },
    whatsappMessageSid: { type: String, default: "" },
    message: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Alert = mongoose.model("Alert", alertSchema);
