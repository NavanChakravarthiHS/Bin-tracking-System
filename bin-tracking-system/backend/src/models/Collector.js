import mongoose from "mongoose";

const collectorSchema = new mongoose.Schema(
  {
    mobile: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/^\d{10}$/, "Mobile must be exactly 10 digits"] 
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Collector = mongoose.model("Collector", collectorSchema);
