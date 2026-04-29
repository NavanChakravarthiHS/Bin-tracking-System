import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.admin = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

