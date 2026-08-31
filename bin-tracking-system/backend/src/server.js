import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { assertRequiredEnv, env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { adminRouter } from "./routes/admin.js";
import { adminBinsRouter } from "./routes/adminBins.js";
import { adminCollectorsRouter } from "./routes/adminCollectors.js";
import { adminCollectionsRouter } from "./routes/adminCollections.js";
import { adminAlertsRouter } from "./routes/adminAlerts.js";
import { collectorRouter } from "./routes/collector.js";
import { ensureDefaultAdmin } from "./seed/ensureDefaultAdmin.js";
import { seedBins } from "./seed/seedBins.js";
import { syncAllBins } from "./services/blynkService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "..", "..", "public");

async function bootstrap() {
  assertRequiredEnv();
  await connectDb();
  if (env.seedDefaultAdmin) await ensureDefaultAdmin();
  await seedBins();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Start background polling to sync Blynk data every 5 seconds
  setInterval(async () => {
    await syncAllBins();
  }, 5000);

  // Serve static files from public directory
  app.use(express.static(publicPath));

  // Health check
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // API Routes
  app.use("/admin", adminRouter);
  app.use("/admin", adminBinsRouter);
  app.use("/admin", adminCollectorsRouter);
  app.use("/admin", adminCollectionsRouter);
  app.use("/admin", adminAlertsRouter);
  app.use("/collector", collectorRouter);

  // Serve landing page on root
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "landing-page.html"));
  });

  // Serve admin dashboard (React app will be built here later)
  app.get("/dashboard", (_req, res) => {
    // For now, redirect to landing page
    // Later this will serve the React build
    res.sendFile(path.join(publicPath, "landing-page.html"));
  });

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n========================================`);
    console.log(`🚀 EcoTrack Server Running!`);
    console.log(`========================================`);
    console.log(`📡 Backend API: http://localhost:${env.port}`);
    console.log(`🏠 Landing Page: http://localhost:${env.port}/`);
    console.log(`👤 Admin Login: http://localhost:${env.port}/admin-login.html`);
    console.log(`🚛 Collector Login: http://localhost:${env.port}/collector-login.html`);
    console.log(`📊 Collector Dashboard: http://localhost:${env.port}/collector-dashboard.html`);
    console.log(`✅ Health Check: http://localhost:${env.port}/health`);
    console.log(`========================================\n`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

