import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { adminBinsRouter } from "./routes/adminBins.js";
import { adminCollectorsRouter } from "./routes/adminCollectors.js";
import { adminCollectionsRouter } from "./routes/adminCollections.js";
import { adminAlertsRouter } from "./routes/adminAlerts.js";
import { adminPerformanceRouter } from "./routes/adminPerformance.js";
import { collectorRouter } from "./routes/collector.js";
import { iotRouter } from "./routes/iot.js";
import { syncAllBins } from "./services/blynkService.js";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return env.frontendOrigins.includes(origin);
}

export function createExpressApp({ onReady } = {}) {
  const app = express();

  if (onReady) {
    app.use(async (_req, _res, next) => {
      try {
        await onReady();
        next();
      } catch (err) {
        next(err);
      }
    });
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/internal/sync-sensors", async (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const isVercelCron = Boolean(req.headers["x-vercel-cron"]);

    if (env.cronSecret) {
      if (token !== env.cronSecret && !isVercelCron) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } else if (env.isVercel && !isVercelCron) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await syncAllBins();
    return res.json({ ok: true, syncedAt: new Date().toISOString() });
  });

  app.use("/admin", adminRouter);
  app.use("/admin", adminBinsRouter);
  app.use("/admin", adminCollectorsRouter);
  app.use("/admin", adminCollectionsRouter);
  app.use("/admin", adminAlertsRouter);
  app.use("/admin", adminPerformanceRouter);
  app.use("/collector", collectorRouter);
  app.use("/iot", iotRouter);

  app.use((err, _req, res, next) => {
    if (err && err.message === "Not allowed by CORS") {
      return res.status(403).json({ message: "CORS: origin not allowed" });
    }
    return next(err);
  });

  return app;
}
