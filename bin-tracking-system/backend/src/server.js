import express from "express";
import cors from "cors";
import { assertRequiredEnv, env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { adminRouter } from "./routes/admin.js";
import { collectorRouter } from "./routes/collector.js";
import { ensureDefaultAdmin } from "./seed/ensureDefaultAdmin.js";

async function bootstrap() {
  assertRequiredEnv();
  await connectDb();
  if (env.seedDefaultAdmin) await ensureDefaultAdmin();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/admin", adminRouter);
  app.use("/collector", collectorRouter);

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`EcoTrack backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

