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
    integrationStatus: "INTEGRATED",
  },
  {
    id: "BIN002",
    location: "Principal's Office",
    fillLevel: 0,
    distance: 60,
    status: "Normal",
    // BIN002 uses its own Blynk device — token stored here (not in env)
    blynkPin: "V0",
    blynkAuthToken: "WSb0GD_9dtS8jY6qOYzuNQmgZyPp81K0",
    integrationStatus: "INTEGRATED",
    // HC-SR04 calibration for BIN002 hardware
    // emptyDistance: ~60 cm when bin is completely empty
    // fullDistance:  ~10 cm when bin is completely full
    emptyDistance: 60,
    fullDistance: 10,
    // Notifications disabled during initial testing — enable after end-to-end verification
    notificationsEnabled: false,
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
  for (const binDef of binsData) {
    const existing = await Bin.findOne({ id: binDef.id });
    if (!existing) {
      await Bin.create(binDef);
      console.log(`[Seed] Created bin ${binDef.id}`);
    } else {
      let modified = false;
      // Sync Blynk Auth Token and Pin if defined in seed and missing or different
      if (binDef.blynkAuthToken && existing.blynkAuthToken !== binDef.blynkAuthToken) {
        existing.blynkAuthToken = binDef.blynkAuthToken;
        modified = true;
      }
      if (binDef.blynkPin && existing.blynkPin !== binDef.blynkPin) {
        existing.blynkPin = binDef.blynkPin;
        modified = true;
      }
      if (binDef.integrationStatus && existing.integrationStatus !== binDef.integrationStatus) {
        existing.integrationStatus = binDef.integrationStatus;
        modified = true;
      }
      if (binDef.emptyDistance && !existing.emptyDistance) {
        existing.emptyDistance = binDef.emptyDistance;
        modified = true;
      }
      if (binDef.fullDistance && !existing.fullDistance) {
        existing.fullDistance = binDef.fullDistance;
        modified = true;
      }
      if (existing.isActive === false) {
        existing.isActive = true;
        modified = true;
      }
      if (modified) {
        await existing.save();
        console.log(`[Seed] Synchronized configuration for bin ${binDef.id}`);
      }
    }
  }
}
