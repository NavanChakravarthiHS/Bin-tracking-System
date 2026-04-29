import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireCollectorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, env.jwtSecret);
    
    if (!payload.collectorId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.collector = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
