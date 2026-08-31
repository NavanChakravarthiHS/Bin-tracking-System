import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  seedDefaultAdmin: String(process.env.SEED_DEFAULT_ADMIN || "").toLowerCase() === "true",
  textbeeApiKey: process.env.TEXTBEE_API_KEY || "",
  textbeeDeviceId: process.env.TEXTBEE_DEVICE_ID || "",
  textbeeBaseUrl: process.env.TEXTBEE_BASE_URL || "https://api.textbee.dev/api/v1",
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || "+91",
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

