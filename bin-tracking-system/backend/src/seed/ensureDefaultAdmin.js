import bcrypt from "bcrypt";
import { Admin } from "../models/Admin.js";

const DEFAULT_ADMIN = {
  name: "Admin User",
  mobile: "9876543210",
  password: "admin123",
};

export async function ensureDefaultAdmin() {
  const existing = await Admin.findOne({ mobile: DEFAULT_ADMIN.mobile }).lean();
  if (existing) return;

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await Admin.create({ name: DEFAULT_ADMIN.name, mobile: DEFAULT_ADMIN.mobile, passwordHash });
}

