/**
 * Vercel Serverless Entry Point
 *
 * Vercel requires the default export of this file to be a Node.js
 * HTTP handler (i.e. an Express app instance — which implements
 * the (req, res) interface).
 *
 * We call createExpressApp() directly here and pass ensureReady as
 * the onReady hook so the DB connects on the first request and is
 * then cached across warm invocations via globalThis.
 *
 * We deliberately do NOT import from server.js because server.js
 * conditionally calls app.listen() and starts a setInterval, neither
 * of which are valid in a serverless function. Vercel also validates
 * every module in the import graph for a valid default export, which
 * server.js does not guarantee at parse time.
 */

import dotenv from "dotenv";
dotenv.config();

import { assertRequiredEnv, env } from "../src/config/env.js";
import { connectDb } from "../src/db/connect.js";
import { createExpressApp } from "../src/app.js";
import { ensureDefaultAdmin } from "../src/seed/ensureDefaultAdmin.js";
import { seedBins } from "../src/seed/seedBins.js";

let bootPromise;

async function ensureReady() {
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

// createExpressApp returns an Express app instance.
// Express apps implement the Node.js (req, res, next) interface,
// which is exactly what Vercel expects as the default export.
const app = createExpressApp({ onReady: ensureReady });

export default app;
