import { Bin } from "../models/Bin.js";

const binsData = [
  {
    id: "BIN001",
    location: "MG Road, Bangalore",
    fillLevel: 30,
    status: "Normal",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    id: "BIN002",
    location: "Brigade Road, Bangalore",
    fillLevel: 85,
    status: "Full",
    latitude: 12.98,
    longitude: 77.60,
  },
  {
    id: "BIN003",
    location: "Koramangala, Bangalore",
    fillLevel: 45,
    status: "Normal",
    latitude: 12.9352,
    longitude: 77.6245,
  },
  {
    id: "BIN004",
    location: "Whitefield, Bangalore",
    fillLevel: 72,
    status: "Warning",
    latitude: 12.9698,
    longitude: 77.7499,
  },
  {
    id: "BIN005",
    location: "Hebbal, Bangalore",
    fillLevel: 92,
    status: "Full",
    latitude: 13.0358,
    longitude: 77.6187,
  },
  {
    id: "BIN006",
    location: "JP Nagar, Bangalore",
    fillLevel: 15,
    status: "Normal",
    latitude: 12.9165,
    longitude: 77.6101,
  },
  {
    id: "BIN007",
    location: "Indiranagar, Bangalore",
    fillLevel: 68,
    status: "Normal",
    latitude: 12.9719,
    longitude: 77.6412,
  },
  {
    id: "BIN008",
    location: "HSR Layout, Bangalore",
    fillLevel: 78,
    status: "Warning",
    latitude: 12.9250,
    longitude: 77.6850,
  },
  {
    id: "BIN009",
    location: "Malleshwaram, Bangalore",
    fillLevel: 95,
    status: "Full",
    latitude: 13.0067,
    longitude: 77.5878,
  },
  {
    id: "BIN010",
    location: "Rajajinagar, Bangalore",
    fillLevel: 52,
    status: "Normal",
    latitude: 12.9890,
    longitude: 77.5654,
  },
  {
    id: "BIN011",
    location: "Banashankari, Bangalore",
    fillLevel: 88,
    status: "Full",
    latitude: 12.8946,
    longitude: 77.6264,
  },
  {
    id: "BIN012",
    location: "Marathahalli, Bangalore",
    fillLevel: 41,
    status: "Normal",
    latitude: 13.0159,
    longitude: 77.6543,
  },
  {
    id: "BIN013",
    location: "Electronic City, Bangalore",
    fillLevel: 25,
    status: "Normal",
    latitude: 12.8410,
    longitude: 77.6763,
  },
  {
    id: "BIN014",
    location: "Jayanagar, Bangalore",
    fillLevel: 75,
    status: "Warning",
    latitude: 12.9250,
    longitude: 77.5838,
  },
  {
    id: "BIN015",
    location: "Yelahanka, Bangalore",
    fillLevel: 93,
    status: "Full",
    latitude: 13.1015,
    longitude: 77.5890,
  },
  {
    id: "BIN016",
    location: "BTM Layout, Bangalore",
    fillLevel: 60,
    status: "Normal",
    latitude: 12.9165,
    longitude: 77.6101,
  },
];

export async function seedBins() {
  const count = await Bin.countDocuments();
  if (count === 0) {
    await Bin.insertMany(binsData);
    console.log("✅ Bins seeded successfully");
  }
}
