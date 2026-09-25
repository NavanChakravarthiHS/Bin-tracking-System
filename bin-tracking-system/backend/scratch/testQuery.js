import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { Collection } from '../src/models/Collection.js';
import { Collector } from '../src/models/Collector.js';
import { Bin } from '../src/models/Bin.js';

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bin-tracking-system';
  await mongoose.connect(uri);

  const collector = await Collector.findOne().lean();
  console.log('Collector:', collector?.name, collector?._id);

  const ids = [String(collector._id), collector._id];
  const matched = await Collection.find({ collectorId: { $in: ids } }).lean();
  console.log('Matched collections count:', matched.length);

  const allLogs = await Collection.find().sort({ collectedAt: -1 }).lean();
  console.log('Total collection logs:', allLogs.length);

  await mongoose.disconnect();
}

test().catch(console.error);
