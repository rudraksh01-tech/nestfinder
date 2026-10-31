// Loads data/listings.json into MongoDB, replacing existing demo listings.
// Run: npm run seed
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { Listing } from '../src/models/Listing.js';

const { listings } = JSON.parse(await readFile(new URL('../data/listings.json', import.meta.url), 'utf8'));

const docs = listings.map(({ id, location, ...rest }) => ({
  ...rest,
  code: id,
  location: { type: 'Point', coordinates: [location.lon, location.lat] },
}));

await connectDb();
await Listing.syncIndexes();
const { deletedCount } = await Listing.deleteMany({ isDemo: true });
await Listing.insertMany(docs);
console.log(`Removed ${deletedCount} old demo listings, inserted ${docs.length}.`);
await mongoose.disconnect();
