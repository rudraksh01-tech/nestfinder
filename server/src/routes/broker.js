import { Router } from 'express';
import mongoose from 'mongoose';
import { Lead, LEAD_STATUSES } from '../models/Lead.js';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { localities, nearestMetro, techParkDistances } from '../lib/geo.js';
import { requireBroker } from '../middleware/auth.js';

const router = Router();
router.use(requireBroker);

// Every query below includes `broker: req.brokerId`, so a broker can only see or change their own data.

router.get('/stats', async (req, res) => {
  const broker = new mongoose.Types.ObjectId(String(req.brokerId));
  const [listings, byStatus, upcomingVisits] = await Promise.all([
    Listing.countDocuments({ broker }),
    Lead.aggregate([{ $match: { broker } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Lead.countDocuments({ broker, status: 'visit_scheduled', visitDate: { $gte: new Date(new Date().toDateString()) } }),
  ]);
  const leads = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0]));
  for (const { _id, count } of byStatus) leads[_id] = count;
  res.json({ listings, leads, upcomingVisits });
});

// ---- Leads ----

router.get('/leads', async (req, res) => {
  const filter = { broker: req.brokerId };
  if (req.query.status) {
    if (!LEAD_STATUSES.includes(req.query.status)) throw httpError(400, 'Unknown status');
    filter.status = req.query.status;
  }
  const leads = await Lead.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('listing', 'code locality bhk rent')
    .lean();
  res.json({ leads });
});

router.patch('/leads/:id', async (req, res) => {
  const { status } = req.body ?? {};
  if (!LEAD_STATUSES.includes(status)) throw httpError(400, 'Unknown status');
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Lead not found');
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, broker: req.brokerId },
    { status },
    { new: true },
  ).populate('listing', 'code locality bhk rent');
  if (!lead) throw httpError(404, 'Lead not found');
  res.json({ lead });
});

// ---- Listings ----

// Fields a broker may set. Location, metro and distances are computed by the server.
const EDITABLE = [
  'locality', 'bhk', 'sqft', 'rent', 'depositMonths', 'maintenance', 'furnishing', 'buildingType',
  'floor', 'totalFloors', 'tenantPreference', 'petsAllowed', 'parking', 'amenities', 'waterSource',
  'noise', 'availableFrom', 'description',
];
const pickEditable = (body = {}) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

// Pins the flat to the locality centre and fills in metro and tech-park distances.
function placeInLocality(name) {
  const place = localities.find((l) => l.name === name);
  if (!place) throw httpError(400, 'Pick one of the listed areas');
  const point = { lat: place.lat, lon: place.lon };
  return {
    location: { type: 'Point', coordinates: [point.lon, point.lat] },
    nearestMetro: nearestMetro(point),
    techParks: techParkDistances(point),
  };
}

async function nextCode() {
  const [top] = await Listing.aggregate([
    { $project: { n: { $toInt: { $substrCP: ['$code', 3, 10] } } } },
    { $sort: { n: -1 } },
    { $limit: 1 },
  ]);
  return `NF-${String((top?.n ?? 0) + 1).padStart(3, '0')}`;
}

router.get('/listings', async (req, res) => {
  const listings = await Listing.find({ broker: req.brokerId }).sort({ updatedAt: -1 }).lean();
  res.json({ listings });
});

router.post('/listings', async (req, res) => {
  const data = pickEditable(req.body);
  const listing = new Listing({
    ...data,
    ...placeInLocality(data.locality),
    code: await nextCode(),
    broker: req.brokerId,
    isDemo: false,
  });
  listing.deposit = listing.rent * listing.depositMonths;
  await listing.save();
  res.status(201).json({ listing });
});

router.patch('/listings/:code', async (req, res) => {
  const listing = await Listing.findOne({ code: req.params.code, broker: req.brokerId });
  if (!listing) throw httpError(404, 'Listing not found');
  const data = pickEditable(req.body);
  if (data.locality && data.locality !== listing.locality) Object.assign(listing, placeInLocality(data.locality));
  Object.assign(listing, data);
  listing.deposit = listing.rent * listing.depositMonths;
  await listing.save();
  res.json({ listing });
});

router.delete('/listings/:code', async (req, res) => {
  const listing = await Listing.findOneAndDelete({ code: req.params.code, broker: req.brokerId });
  if (!listing) throw httpError(404, 'Listing not found');
  await Lead.deleteMany({ listing: listing._id });
  res.json({ ok: true });
});

export default router;
