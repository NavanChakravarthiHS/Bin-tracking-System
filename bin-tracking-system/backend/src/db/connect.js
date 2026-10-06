import mongoose from "mongoose";
import { env } from "../config/env.js";

const globalForMongoose = globalThis;

export async function connectDb() {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!globalForMongoose.__ecotrackMongoPromise) {
    globalForMongoose.__ecotrackMongoPromise = mongoose.connect(env.mongoUri);
  }

  await globalForMongoose.__ecotrackMongoPromise;
  return mongoose.connection;
}
