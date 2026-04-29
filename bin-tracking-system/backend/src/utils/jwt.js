import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAdminJwt({ adminId, mobile, name }) {
  return jwt.sign({ adminId, mobile, name }, env.jwtSecret, { expiresIn: "2h" });
}

export function signCollectorJwt({ collectorId, mobile }) {
  return jwt.sign({ collectorId, mobile }, env.jwtSecret, { expiresIn: "2h" });
}

