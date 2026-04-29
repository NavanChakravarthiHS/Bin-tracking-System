import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  seedDefaultAdmin: String(process.env.SEED_DEFAULT_ADMIN || "").toLowerCase() === "true",
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

