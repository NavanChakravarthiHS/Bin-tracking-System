import { Bin } from "../models/Bin.js";

const binsData = [
  {
    id: "BIN001",
    location: "College Library",
    fillLevel: 30,
    status: "Normal",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    id: "BIN002",
    location: "Principal's Office",
    fillLevel: 85,
    status: "Full",
    latitude: 12.98,
    longitude: 77.60,
  },
  {
    id: "BIN003",
    location: "Government College of Engineering, Mosalehosahalli",
    fillLevel: 45,
    status: "Normal",
    latitude: 12.884875,
    longitude: 76.166738,
  },
  {
    id: "BIN004",
    location: "Seminar Hall",
    fillLevel: 72,
    status: "Warning",
    latitude: 12.9698,
    longitude: 77.7499,
  },
];

export async function seedBins() {
  const count = await Bin.countDocuments();
  if (count === 0) {
    await Bin.insertMany(binsData);
    console.log("✅ Bins seeded successfully");
  }
}
