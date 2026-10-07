import mongoose from "mongoose";

const binSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    fillLevel: { type: Number, required: true, default: 0 },
    status: { 
      type: String, 
      enum: ['Normal', 'Warning', 'Full', 'Empty', 'Collected'], 
      default: 'Normal' 
    },
    blynkPin: { type: String, default: null },
    distance: { type: Number, default: 50 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    lastCollected: { type: Date, default: null },
    assignedCollector: { type: String, default: null },
    assignedCollectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
      default: null,
    },
    lastSensorUpdate: { type: Date, default: null },
    lastSensorAttempt: { type: Date, default: null },
    sensorConnected: { type: Boolean, default: false },
    deviceStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    isActive: { type: Boolean, default: true },
    warningThreshold: { type: Number, default: 50, min: 1, max: 99 },
    fullThreshold: { type: Number, default: 80, min: 2, max: 100 },
    lastAlertSeverity: {
      type: String,
      enum: ["NONE", "WARNING", "PRIORITY", "CRITICAL", "FULL", "DEVICE_OFFLINE"],
      default: "NONE",
    },
    lastAlertState: {
      type: String,
      enum: ["NORMAL", "WARNING", "PRIORITY", "CRITICAL", "FULL"],
      default: "NORMAL",
    },
    consecutiveCriticalReadings: { type: Number, default: 0 },
    lastAlertAt: { type: Date, default: null },
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },
    isDeviceOffline: { type: Boolean, default: false },
    offlineAlertSentAt: { type: Date, default: null },
    isVerificationPending: { type: Boolean, default: false },
    activeCollectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    consecutiveLowReadings: { type: Number, default: 0 },
    verificationStartedAt: { type: Date, default: null },
    qrCode: { type: String, default: null },
  },
  { timestamps: true }
);

export const Bin = mongoose.model("Bin", binSchema);
