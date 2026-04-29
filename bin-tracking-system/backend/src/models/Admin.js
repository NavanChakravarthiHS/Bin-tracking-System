import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "System Administrator" },
    mobile: { type: String, required: true, unique: true, match: [/^\d{10}$/, "Invalid mobile"] },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);

