import express from "express";
import { ingestSensorReading } from "../services/sensorIngest.js";

export const iotRouter = express.Router();

async function handleSensorPost(req, res) {
  try {
    const binId = req.params.id || req.body?.binId || req.body?.deviceId;
    const result = await ingestSensorReading({ binId, body: req.body || {} });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("Error updating bin via sensor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

iotRouter.post("/sensor", handleSensorPost);
iotRouter.post("/bins/:id/sensor", handleSensorPost);
