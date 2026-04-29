import express from "express";
import bcrypt from "bcrypt";
import { Admin } from "../models/Admin.js";
import { signAdminJwt } from "../utils/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminRouter = express.Router();

adminRouter.post("/login", async (req, res) => {
  const { mobile, password } = req.body || {};

  if (!/^\d{10}$/.test(String(mobile || ""))) {
    return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const admin = await Admin.findOne({ mobile: String(mobile) });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signAdminJwt({ adminId: String(admin._id), mobile: admin.mobile, name: admin.name });
  return res.json({ token, admin: { name: admin.name, mobile: admin.mobile } });
});

adminRouter.get("/me", requireAuth, async (req, res) => {
  const admin = await Admin.findById(req.admin.adminId).select("name mobile").lean();
  if (!admin) return res.status(401).json({ message: "Unauthorized" });
  return res.json({ admin });
});

