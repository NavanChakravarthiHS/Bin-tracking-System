import mongoose from "mongoose";

const binSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    fillLevel: { type: Number, required: true, default: 0 },
    status: { 
      type: String, 
      enum: ['Normal', 'Warning', 'Full', 'Empty'], 
      default: 'Normal' 
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    lastCollected: { type: Date, default: null },
    assignedCollector: { type: String, default: null },
  },
  { timestamps: true }
);

export const Bin = mongoose.model("Bin", binSchema);
