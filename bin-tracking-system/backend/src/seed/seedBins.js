import { Bin } from "../models/Bin.js";

const binsData = [
  {
    id: "BIN001",
    location: "College Library",
    fillLevel: 30,
    distance: 70,
    blynkPin: "V0",
    status: "Normal",
    latitude: 12.884826192901519,
    longitude: 76.16705545090305,
  },
  {
    id: "BIN002",
    location: "Principal's Office",
    fillLevel: 85,
    status: "Full",
    latitude: 12.88434509283807,
    longitude: 76.16648145829812,
  },
  {
    id: "BIN003",
    location: "Government College of Engineering, Mosalehosahalli",
    fillLevel: 45,
    status: "Normal",
    latitude: 12.88399547624362,
    longitude: 76.16687634296892,
  },
  {
    id: "BIN004",
    location: "Seminar Hall",
    fillLevel: 72,
    status: "Warning",
    latitude: 12.883773704898823,
    longitude: 76.16671399141555,
  },
];

export async function seedBins() {
  const count = await Bin.countDocuments();
  if (count === 0) {
    await Bin.insertMany(binsData);
    console.log("Bins seeded successfully");
  }
}
