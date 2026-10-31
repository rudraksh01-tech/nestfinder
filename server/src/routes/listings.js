import { Router } from 'express';
import mongoose from 'mongoose';
import { Listing } from '../models/Listing.js';

const router = Router();

const SORTS = {
  rent_asc: { rent: 1 },
  rent_desc: { rent: -1 },
  metro: { 'nearestMetro.km': 1 },
  newest: { availableFrom: 1 },
};

// Reads a number query param; returns undefined when absent, throws a 400 when invalid.
function num(query, key) {
  if (query[key] === undefined || query[key] === '') return undefined;
  const n = Number(query[key]);
  if (!Number.isFinite(n)) throw Object.assign(new Error(`${key} must be a number`), { status: 400 });
  return n;
}
const list = (value) => (value ? String(value).split(',').map((s) => s.trim()).filter(Boolean) : []);

// GET /api/listings?locality=HSR Layout,Koramangala&bhk=1,2&minRent=15000&maxRent=35000
//   &furnishing=Semi-furnished&tenant=Bachelors&pets=true&maxMetroKm=1.5
//   &techPark=Manyata Tech Park&maxTechParkKm=8&sort=rent_asc&page=1&limit=20
router.get('/', async (req, res) => {
  const q = req.query;
  const filter = {};

  const localities = list(q.locality);
  if (localities.length) filter.locality = { $in: localities };

  const bhks = list(q.bhk).map(Number).filter(Number.isFinite);
  if (bhks.length) filter.bhk = { $in: bhks };

  const minRent = num(q, 'minRent');
  const maxRent = num(q, 'maxRent');
  if (minRent !== undefined || maxRent !== undefined) {
    filter.rent = {};
    if (minRent !== undefined) filter.rent.$gte = minRent;
    if (maxRent !== undefined) filter.rent.$lte = maxRent;
  }

  const furnishing = list(q.furnishing);
  if (furnishing.length) filter.furnishing = { $in: furnishing };

  // A bachelor or family search should also include "Any" listings.
  if (q.tenant) filter.tenantPreference = { $in: [q.tenant, 'Any'] };
  if (q.pets === 'true') filter.petsAllowed = true;

  const maxMetroKm = num(q, 'maxMetroKm');
  if (maxMetroKm !== undefined) filter['nearestMetro.km'] = { $lte: maxMetroKm };

  const maxTechParkKm = num(q, 'maxTechParkKm');
  if (q.techPark) {
    filter.techParks = { $elemMatch: { name: q.techPark, ...(maxTechParkKm !== undefined && { km: { $lte: maxTechParkKm } }) } };
  }

  const sort = SORTS[q.sort] ?? SORTS.rent_asc;
  const limit = Math.min(Math.max(num(q, 'limit') ?? 20, 1), 50);
  const page = Math.max(num(q, 'page') ?? 1, 1);

  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ ...sort, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Listing.countDocuments(filter),
  ]);

  res.json({ total, page, limit, pages: Math.ceil(total / limit), items });
});

// GET /api/listings/NF-001  (or a Mongo _id)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { code: id };
  const listing = await Listing.findOne(query).lean();
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

export default router;
