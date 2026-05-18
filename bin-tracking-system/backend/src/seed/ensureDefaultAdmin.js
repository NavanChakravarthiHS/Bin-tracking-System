import bcrypt from "bcrypt";
import { Admin } from "../models/Admin.js";
import { Collector } from "../models/Collector.js";

const DEFAULT_ADMIN = {
  name: "Admin User",
  mobile: "9876543210",
  password: "admin123",
};

const DEFAULT_COLLECTOR = {
  mobile: "8765432109",
  password: "driver123",
};

export async function ensureDefaultAdmin() {
  const existingAdmin = await Admin.findOne({ mobile: DEFAULT_ADMIN.mobile }).lean();
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    await Admin.create({ name: DEFAULT_ADMIN.name, mobile: DEFAULT_ADMIN.mobile, passwordHash });
  }

  const existingCollector = await Collector.findOne({ mobile: DEFAULT_COLLECTOR.mobile }).lean();
  if (!existingCollector) {
    const passwordHash = await bcrypt.hash(DEFAULT_COLLECTOR.password, 10);
    await Collector.create({ mobile: DEFAULT_COLLECTOR.mobile, passwordHash });
  }
}

