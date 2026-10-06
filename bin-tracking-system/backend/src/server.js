import { assertRequiredEnv, env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { createExpressApp } from "./app.js";
import { ensureDefaultAdmin } from "./seed/ensureDefaultAdmin.js";
import { seedBins } from "./seed/seedBins.js";
import { syncAllBins } from "./services/blynkService.js";

let bootPromise;

export async function ensureReady() {
  if (!bootPromise) {
    bootPromise = (async () => {
      assertRequiredEnv();
      await connectDb();
      if (env.seedDefaultAdmin) await ensureDefaultAdmin();
      await seedBins();
    })();
  }
  await bootPromise;
}

const app = createExpressApp({ onReady: ensureReady });

if (!env.isVercel) {
  ensureReady()
    .then(() => {
      setInterval(async () => {
        await syncAllBins();
      }, 5000);

      app.listen(env.port, () => {
        console.log(`\n========================================`);
        console.log(`EcoTrack API running on http://localhost:${env.port}`);
        console.log(`Health: http://localhost:${env.port}/health`);
        console.log(`IoT POST: http://localhost:${env.port}/admin/bins/:id/sensor`);
        console.log(`========================================\n`);
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default app;
