import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { completeJson, llmEnabled } from '../lib/llm.js';
import { scoreListing } from '../lib/match.js';
import { parsePrefs } from './match.js';

const router = Router();

const decideLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please wait a few minutes.' },
});

const MAX = 4;

function parseCodes(raw) {
  const codes = [...new Set(String(raw ?? '').split(',').map((s) => s.trim()).filter((s) => /^NF-\d{1,5}$/.test(s)))];
  if (codes.length < 1) throw httpError(400, 'Pick at least one flat');
  if (codes.length > MAX) throw httpError(400, `You can compare up to ${MAX} flats`);
  return codes;
}

// Loads the flats in the order given, each with a match score when preferences are known.
async function load(codes, prefs) {
  const found = await Listing.find({ code: { $in: codes } }, '-location -createdAt -updatedAt -__v').lean();
  const byCode = new Map(found.map((l) => [l.code, l]));
  const scored = Object.keys(prefs).length > 0;
  return codes
    .filter((c) => byCode.has(c))
    .map((c) => ({ ...byCode.get(c), match: scored ? scoreListing(byCode.get(c), prefs) : null }));
}

// GET /api/compare?codes=NF-001,NF-002&budget=30000&techPark=...
router.get('/', async (req, res) => {
  const codes = parseCodes(req.query.codes);
  const prefs = parsePrefs(req.query);
  const items = await load(codes, prefs);
  res.json({ prefs, items, missing: codes.filter((c) => !items.some((i) => i.code === c)) });
});

const DECIDE_PROMPT = `You help someone choose between shortlisted rental flats in Bengaluru (demo data).
Use ONLY the facts given. Never invent amenities, prices or distances; distances are straight-line and approximate.
If preferences are given, weigh them most (dealbreakers like pets or tenant type matter a lot); otherwise judge on value for money,
commute-friendly location (metro distance), deposit and practical comfort.
Write in plain English, short and specific, no markdown. Each reason under 20 words and must cite a concrete fact (number, amenity or rule).`;

// POST /api/compare/decide  { codes: [...], prefs: {...} }
router.post('/decide', decideLimiter, async (req, res) => {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const codes = parseCodes((req.body?.codes ?? []).join(','));
  if (codes.length < 2) throw httpError(400, 'Shortlist at least two flats to compare');
  let prefs = {};
  try {
    prefs = parsePrefs(req.body?.prefs ?? {});
  } catch {
    prefs = {};
  }
  const items = await load(codes, prefs);
  if (items.length < 2) throw httpError(404, 'Some of these flats are no longer listed');

  const facts = items.map((l) => ({
    code: l.code,
    area: l.locality,
    bhk: l.bhk,
    sqft: l.sqft,
    rent: l.rent,
    maintenance: l.maintenance,
    deposit_months: l.depositMonths,
    furnishing: l.furnishing,
    building: l.buildingType,
    floor: `${l.floor} of ${l.totalFloors}`,
    tenant_preference: l.tenantPreference,
    pets_allowed: l.petsAllowed,
    parking: l.parking,
    noise: l.noise,
    water: l.waterSource,
    amenities: l.amenities,
    nearest_metro: `${l.nearestMetro.name}, ${l.nearestMetro.km} km`,
    tech_parks_km: Object.fromEntries(l.techParks.map((t) => [t.name, t.km])),
    available_from: l.availableFrom?.toISOString().slice(0, 10),
    ...(l.match && { match_percent: l.match.score, match_reasons: l.match.reasons.map((r) => `${r.tone}: ${r.text}`) }),
  }));

  // `pick` and `runnerUp` are limited to the shortlisted codes, so the model cannot name another flat.
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['pick', 'headline', 'reasons', 'runnerUp', 'runnerUpWhen', 'watchOut'],
    properties: {
      pick: { type: 'string', enum: items.map((i) => i.code) },
      headline: { type: 'string' },
      reasons: { type: 'array', items: { type: 'string' } },
      runnerUp: { type: 'string', enum: items.map((i) => i.code) },
      runnerUpWhen: { type: 'string' },
      watchOut: { type: 'string' },
    },
  };
  const decision = await completeJson(
    [
      { role: 'system', content: DECIDE_PROMPT },
      {
        role: 'user',
        content:
          `PREFERENCES: ${JSON.stringify(prefs)}\nFLATS: ${JSON.stringify(facts)}\n\n` +
          'Return: pick (best flat), headline (one sentence why), reasons (exactly 3), runnerUp (a different flat), ' +
          'runnerUpWhen (one sentence: when the runner-up would be the better choice), watchOut (one thing to check before paying a deposit for the pick).',
      },
    ],
    'flat_decision',
    schema,
  );
  if (decision.runnerUp === decision.pick) decision.runnerUp = items.find((i) => i.code !== decision.pick).code;
  decision.reasons = decision.reasons.slice(0, 3);

  res.json({ decision });
});

export default router;
