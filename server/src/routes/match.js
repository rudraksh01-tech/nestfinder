import { Router } from 'express';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { techParks } from '../lib/geo.js';
import { scoreListing } from '../lib/match.js';

const router = Router();

const TENANTS = ['Bachelors', 'Family'];
const FURNISHING = ['Unfurnished', 'Semi-furnished', 'Fully furnished'];
const flag = (v) => v === 'true' || v === '1';

// Turns query params into scoring preferences, rejecting values we cannot score.
export function parsePrefs(q) {
  const prefs = {};
  if (q.budget) {
    prefs.budget = Number(q.budget);
    if (!Number.isFinite(prefs.budget) || prefs.budget < 1000 || prefs.budget > 1000000) throw httpError(400, 'Budget must be between 1,000 and 10,00,000');
  }
  if (q.bhk) {
    prefs.bhk = Number(q.bhk);
    if (![1, 2, 3, 4, 5].includes(prefs.bhk)) throw httpError(400, 'BHK must be 1 to 5');
  }
  if (q.techPark) {
    if (!techParks.some((t) => t.name === q.techPark)) throw httpError(400, 'Unknown tech park');
    prefs.techPark = q.techPark;
  }
  if (q.tenant) {
    if (!TENANTS.includes(q.tenant)) throw httpError(400, 'Tenant must be Bachelors or Family');
    prefs.tenant = q.tenant;
  }
  if (q.furnishing) {
    if (!FURNISHING.includes(q.furnishing)) throw httpError(400, 'Unknown furnishing');
    prefs.furnishing = q.furnishing;
  }
  for (const key of ['pets', 'gym', 'quiet', 'car', 'metro']) if (flag(q[key])) prefs[key] = true;
  return prefs;
}

// GET /api/match?budget=25000&bhk=2&techPark=Manyata Tech Park&tenant=Bachelors&pets=true&metro=true&limit=12
router.get('/', async (req, res) => {
  const prefs = parsePrefs(req.query);
  if (Object.keys(prefs).length === 0) throw httpError(400, 'Tell us at least one preference');
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  // ~120 demo flats: scoring all of them in memory is simpler and fast enough.
  const listings = await Listing.find({}, '-description -location -createdAt -updatedAt -__v').lean();
  const scored = listings
    .map((l) => ({ ...l, match: scoreListing(l, prefs) }))
    .sort((a, b) => b.match.score - a.match.score || a.rent - b.rent);

  res.json({ prefs, total: scored.length, items: scored.slice(0, limit) });
});

export default router;
