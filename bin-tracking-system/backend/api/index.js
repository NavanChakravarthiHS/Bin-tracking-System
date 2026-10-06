// Vercel serverless entry point.
// All HTTP requests are routed here by vercel.json → forwarded to Express app.
import app from "../src/server.js";

export default app;
