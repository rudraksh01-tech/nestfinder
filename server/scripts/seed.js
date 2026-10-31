// Resets the demo data: 3 demo brokers, data/listings.json split between them, and sample leads.
// Listings and leads created by real brokers (isDemo: false) are left alone.
// Run: npm run seed
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { Broker } from '../src/models/Broker.js';
import { Lead } from '../src/models/Lead.js';
import { Listing } from '../src/models/Listing.js';

// The first broker is the public demo login shown on the login page.
export const DEMO_LOGIN = { email: 'demo@nestfinder.test', password: 'demo1234' };
const BROKERS = [
  { name: 'Asha Rao', agency: 'Asha Homes (demo)', email: DEMO_LOGIN.email, password: DEMO_LOGIN.password },
  { name: 'Kiran Shetty', agency: 'Shetty Rentals (demo)', email: 'kiran@nestfinder.test' },
  { name: 'Meera Iyer', agency: 'Iyer Properties (demo)', email: 'meera@nestfinder.test' },
];

const SAMPLE_LEADS = [
  { name: 'Rohit Verma', message: 'Is the rent negotiable? I work at Manyata.', status: 'new' },
  { name: 'Sneha Kulkarni', message: 'Can I visit this weekend?', status: 'visit_scheduled', visitInDays: 2 },
  { name: 'Arjun Nair', message: 'Are pets allowed? I have a small dog.', status: 'contacted' },
  { name: 'Priya Menon', message: 'Looking to move in next month with my family.', status: 'visit_scheduled', visitInDays: 4 },
  { name: 'Vikram Singh', message: 'Is the deposit fixed at this amount?', status: 'new' },
  { name: 'Ananya Das', message: 'What is the water supply like?', status: 'closed' },
  { name: 'Karthik Reddy', message: 'Bachelor, working in Whitefield. Available?', status: 'new' },
  { name: 'Fatima Sheikh', message: 'Can the owner add a washing machine?', status: 'contacted' },
  { name: 'Rahul Joshi', message: 'Please share more photos.', status: 'visit_scheduled', visitInDays: 6 },
  { name: 'Divya Pillai', message: 'Is there power backup?', status: 'new' },
];

const { listings } = JSON.parse(await readFile(new URL('../data/listings.json', import.meta.url), 'utf8'));

await connectDb();
await Promise.all([Listing.syncIndexes(), Broker.syncIndexes(), Lead.syncIndexes()]);

// Upsert brokers so their ids stay stable; the demo password is reset every run.
const brokers = [];
for (const b of BROKERS) {
  const broker = (await Broker.findOne({ email: b.email })) ?? new Broker({ email: b.email });
  Object.assign(broker, { name: b.name, agency: b.agency, isDemo: true });
  await broker.setPassword(b.password ?? randomBytes(24).toString('hex'));
  await broker.save();
  brokers.push(broker);
}

// Split listings between brokers by locality, so each broker "owns" a few areas.
const localityNames = [...new Set(listings.map((l) => l.locality))];
const docs = listings.map(({ id, location, ...rest }) => ({
  ...rest,
  code: id,
  location: { type: 'Point', coordinates: [location.lon, location.lat] },
  broker: brokers[localityNames.indexOf(rest.locality) % brokers.length]._id,
}));

// Demo listings are recreated with new ids, so drop every lead pointing at them too.
const oldListingIds = await Listing.find({ isDemo: true }).distinct('_id');
const { deletedCount: oldLeads } = await Lead.deleteMany({ $or: [{ isDemo: true }, { listing: { $in: oldListingIds } }] });
const { deletedCount: oldListings } = await Listing.deleteMany({ isDemo: true });
const inserted = await Listing.insertMany(docs);

// Sample leads go to the demo broker, spread across their listings.
const demoListings = inserted.filter((l) => l.broker.equals(brokers[0]._id));
const today = new Date(new Date().toDateString());
const leads = SAMPLE_LEADS.map((s, i) => ({
  listing: demoListings[(i * 3) % demoListings.length]._id,
  broker: brokers[0]._id,
  name: s.name,
  phone: `98450${String(10000 + i * 137).slice(-5)}`,
  message: s.message,
  status: s.status,
  visitDate: s.visitInDays ? new Date(today.getTime() + s.visitInDays * 86400000) : undefined,
  isDemo: true,
  createdAt: new Date(Date.now() - (i + 1) * 5 * 3600000),
}));
await Lead.insertMany(leads);

console.log(`Brokers: ${brokers.map((b) => b.email).join(', ')}`);
console.log(`Listings: removed ${oldListings}, inserted ${inserted.length} (demo broker owns ${demoListings.length}).`);
console.log(`Leads: removed ${oldLeads}, inserted ${leads.length}.`);
await mongoose.disconnect();
