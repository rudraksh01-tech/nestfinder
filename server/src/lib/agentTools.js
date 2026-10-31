// Tools the assistant can call. Each wraps logic the REST API already uses (match scoring,
// fair-rent check), so the agent can never compute a score differently from the pages.
// A tool returns { forModel, forUi }: compact facts for the LLM, and data the chat renders as a card.
// No tool writes anything: book_visit only asks the user to confirm in the UI.
import { Listing } from '../models/Listing.js';
import { AREAS, PARKS, resolveArea, resolveFurnishing, resolveTechPark, resolveTenant } from './areas.js';
import { checkRent } from './fairRent.js';
import { localities } from './geo.js';
import { scoreListing } from './match.js';
import { parsePrefs } from '../routes/match.js';

// Names are free text in the schemas on purpose: Groq rejects a whole tool call when a value is
// outside an enum ("Whitefield" vs "ITPL Whitefield"), which used to leave the reply empty.
// Values are resolved and validated here instead (see areas.js).
const CODE = { type: 'string', description: 'Flat code like NF-002', pattern: '^NF-\\d{1,5}$' };
const LISTING_FIELDS = '-location -createdAt -updatedAt -__v';
// Optional fields also accept null: the smaller fallback model sends null for "not given", and
// Groq would otherwise reject the whole call, costing a repair round. toPrefs and check_rent skip nulls.
const optional = (schema) => ({ ...schema, type: [schema.type, 'null'] });
const optionalAll = (properties) => Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, optional(v)]));

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_flats',
      description:
        "Rank flats for the person's preferences and return the top 3 with match scores. Call it whenever they describe what they want or change a preference. Pass the complete set of preferences known so far: start from CURRENT_PREFERENCES and apply what they just said.",
      parameters: {
        type: 'object',
        properties: optionalAll({
          techPark: { type: 'string', description: `Where they work. Our tech parks: ${PARKS.join(', ')}. An office area like "Whitefield" or "Hebbal" is fine; it is mapped to the nearest park.` },
          budget: { type: 'integer', description: 'Max monthly rent in rupees' },
          bhk: { type: 'integer', description: '1, 2 or 3' },
          tenant: { type: 'string', description: '"Bachelors" or "Family"' },
          furnishing: { type: 'string', description: '"Unfurnished", "Semi-furnished" or "Fully furnished"' },
          pets: { type: 'boolean' },
          gym: { type: 'boolean' },
          quiet: { type: 'boolean' },
          car: { type: 'boolean', description: 'Needs car parking' },
          metro: { type: 'boolean', description: 'Wants a metro station nearby' },
        }),
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_rent',
      description:
        'Check whether a rent (and deposit) is fair by comparing it with similar flats nearby. Usually pass locality, bhk and rent (plus depositMonths if they gave a deposit; convert an amount like "2 lakh" into months of rent). Only when they mention one of our flats by code (like NF-002), pass that code instead.',
      parameters: {
        type: 'object',
        properties: optionalAll({
          code: CODE,
          locality: { type: 'string', description: `The area. Our areas: ${AREAS.join(', ')}. A nearby neighbourhood like "Kasavanahalli" is fine; it is mapped to the area it belongs to.` },
          bhk: { type: 'integer', description: '1, 2 or 3' },
          rent: { type: 'integer', description: 'Monthly rent in rupees' },
          depositMonths: { type: 'number' },
        }),
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_flat',
      description: 'Get the full details of one flat by its code.',
      parameters: { type: 'object', properties: { code: CODE }, required: ['code'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_flats',
      description: 'Compare 2 to 4 flats side by side (rent, deposit, size, metro, office distance, match score).',
      parameters: {
        type: 'object',
        properties: { codes: { type: 'array', items: CODE, minItems: 2, maxItems: 4 } },
        required: ['codes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_visit',
      description:
        'Prepare a visit request for a flat. This does NOT book anything: it shows the person a confirmation card where they enter their name and phone and press Confirm.',
      parameters: {
        type: 'object',
        properties: { code: CODE, date: { type: 'string', description: 'Visit date as YYYY-MM-DD, within the next 60 days' } },
        required: ['code'],
      },
    },
  },
];

export const TOOL_STATUS = {
  search_flats: 'Finding flats that fit',
  check_rent: 'Checking the rent against similar flats',
  get_flat: 'Looking up the flat',
  compare_flats: 'Comparing the flats',
  book_visit: 'Preparing a visit request',
};

// The model's arguments are untrusted: everything is re-validated here, and errors go back to
// the model as a tool result it can explain, not as a crash.
class ToolInputError extends Error {}
const fail = (message) => {
  throw new ToolInputError(message);
};

async function findListing(code) {
  const listing = await Listing.findOne({ code: String(code ?? '').toUpperCase() }, LISTING_FIELDS).lean();
  if (!listing) fail(`There is no flat with code ${code}.`);
  return listing;
}

const flatFacts = (l, match) => ({
  code: l.code,
  area: l.locality,
  bhk: l.bhk,
  rent: l.rent,
  maintenance: l.maintenance,
  deposit_months: l.depositMonths,
  sqft: l.sqft,
  furnishing: l.furnishing,
  tenant: l.tenantPreference,
  pets_allowed: l.petsAllowed,
  parking: l.parking,
  noise: l.noise,
  amenities: l.amenities,
  nearest_metro: `${l.nearestMetro.name} ${l.nearestMetro.km} km`,
  // Split, not mixed: with one list the model sometimes echoed what the person asked for
  // ("quiet") for a flat whose reasons said "Busy, noisy area".
  ...(match && {
    match_percent: match.score,
    fits: match.reasons.filter((r) => r.tone === 'good').map((r) => r.text),
    problems: match.reasons.filter((r) => r.tone !== 'good').map((r) => r.text),
  }),
});

function toPrefs(args) {
  const query = {};
  for (const [key, value] of Object.entries(args ?? {})) {
    if (value !== null && value !== undefined && value !== false && value !== '') query[key] = String(value);
  }
  if (query.techPark) {
    query.techPark = resolveTechPark(query.techPark) ?? fail(`Unknown office "${query.techPark}". Use one of: ${PARKS.join(', ')}.`);
  }
  if (query.tenant) query.tenant = resolveTenant(query.tenant) ?? fail('Tenant must be "Bachelors" or "Family".');
  if (query.furnishing) query.furnishing = resolveFurnishing(query.furnishing) ?? fail('Furnishing must be Unfurnished, Semi-furnished or Fully furnished.');
  try {
    return parsePrefs(query);
  } catch (err) {
    return fail(err.message);
  }
}

const tools = {
  async search_flats(args) {
    const prefs = toPrefs(args);
    if (Object.keys(prefs).length === 0) fail('Ask for at least one preference, such as office or budget.');
    const listings = await Listing.find({}, LISTING_FIELDS).lean();
    const top = listings
      .map((l) => ({ l, match: scoreListing(l, prefs) }))
      .sort((a, b) => b.match.score - a.match.score || a.l.rent - b.l.rent)
      .slice(0, 3);
    return {
      forModel: { preferences: prefs, top_matches: top.map(({ l, match }) => flatFacts(l, match)) },
      forUi: { prefs, matches: top.map(({ l, match }) => ({ code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, score: match.score })) },
    };
  },

  async check_rent(args) {
    let ask = { locality: args?.locality, bhk: args?.bhk, rent: args?.rent, depositMonths: args?.depositMonths };
    let exclude = null;
    if (args?.code) {
      const l = await findListing(args.code);
      ask = { locality: l.locality, bhk: l.bhk, rent: args.rent ?? l.rent, depositMonths: args.depositMonths ?? l.depositMonths, furnishing: l.furnishing };
      exclude = l.code;
    }
    const area = resolveArea(ask.locality);
    if (!area) fail(`Unknown area "${ask.locality ?? ''}". Use one of: ${AREAS.join(', ')}.`);
    ask.locality = area;
    if (![1, 2, 3].includes(ask.bhk)) fail('BHK must be 1, 2 or 3.');
    if (!Number.isFinite(ask.rent) || ask.rent < 3000 || ask.rent > 500000) fail('Rent must be a monthly amount in rupees.');
    const listings = await Listing.find(exclude ? { code: { $ne: exclude } } : {}, 'code locality bhk rent depositMonths furnishing sqft').lean();
    const r = checkRent(ask, listings, localities);
    if (!r.enough) return { forModel: { enough_data: false, compared: r.count, scope: r.scope }, forUi: { ask, enough: false } };
    const summary = {
      flat: `${ask.bhk}BHK in ${ask.locality}`,
      asked_rent: ask.rent,
      similar_flats_compared: r.count,
      scope: r.scope,
      median_rent: r.rent.median,
      usual_range: `${r.rent.low} to ${r.rent.high}`,
      percent_vs_median: r.rent.diffPercent,
      verdict: r.rent.verdict.label,
      ...(r.deposit && { deposit_months: r.deposit.months, typical_deposit_months: r.deposit.typicalMonths, deposit_too_high: r.deposit.aboveTypical }),
      suggested_counter: { rent: r.target.rent, deposit_months: r.target.depositMonths },
    };
    return { forModel: summary, forUi: { ask, enough: true, code: exclude, median: r.rent.median, diff: r.rent.diffPercent, verdict: r.rent.verdict, count: r.count, target: r.target } };
  },

  async get_flat(args) {
    const l = await findListing(args?.code);
    return {
      forModel: { ...flatFacts(l), floor: `${l.floor} of ${l.totalFloors}`, building: l.buildingType, water: l.waterSource, available_from: l.availableFrom?.toISOString().slice(0, 10), tech_parks_km: Object.fromEntries(l.techParks.map((t) => [t.name, t.km])) },
      forUi: { code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent },
    };
  },

  async compare_flats(args, { prefs }) {
    const codes = [...new Set((Array.isArray(args?.codes) ? args.codes : []).map((c) => String(c).toUpperCase()))];
    if (codes.length < 2 || codes.length > 4) fail('Compare between 2 and 4 flats.');
    const found = await Listing.find({ code: { $in: codes } }, LISTING_FIELDS).lean();
    const missing = codes.filter((c) => !found.some((l) => l.code === c));
    if (missing.length) fail(`No flat with code ${missing.join(', ')}.`);
    const scored = Object.keys(prefs).length > 0;
    const flats = codes.map((c) => found.find((l) => l.code === c)).map((l) => ({ l, match: scored ? scoreListing(l, prefs) : null }));
    return {
      forModel: { flats: flats.map(({ l, match }) => flatFacts(l, match)) },
      forUi: { flats: flats.map(({ l, match }) => ({ code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, deposit: l.deposit, depositMonths: l.depositMonths, metroKm: l.nearestMetro.km, score: match?.score ?? null })) },
    };
  },

  async book_visit(args) {
    const l = await findListing(args?.code);
    let date = null;
    if (args?.date) {
      const d = new Date(args.date);
      const today = new Date(new Date().toDateString());
      if (Number.isNaN(d.getTime()) || d < today || d > new Date(today.getTime() + 60 * 86400000)) fail('Pick a visit date within the next 60 days.');
      date = args.date.slice(0, 10);
    }
    return {
      forModel: { status: 'waiting_for_user_confirmation', code: l.code, date, note: 'Nothing is booked yet. The person must enter their name and phone in the card and press Confirm.' },
      forUi: { code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, date },
    };
  },
};

// Runs one tool call. Bad arguments come back as { error } so the model can recover or explain.
export async function runTool(name, rawArguments, context) {
  if (!tools[name]) return { forModel: { error: `Unknown tool ${name}` }, forUi: null };
  let args;
  try {
    args = rawArguments ? JSON.parse(rawArguments) : {};
  } catch {
    return { forModel: { error: 'Arguments were not valid JSON.' }, forUi: null };
  }
  try {
    return await tools[name](args, context);
  } catch (err) {
    if (err instanceof ToolInputError) return { forModel: { error: err.message }, forUi: null };
    throw err;
  }
}
