// Generates ~120 sample (demo) flat listings around real Bengaluru localities.
// Uses a seeded random generator so the same data comes out every run.
// Run: node scripts/generate-listings.js  (reads data/places.json + data/metro-stations.json, writes data/listings.json)
import { readFile, writeFile } from 'node:fs/promises';

const SEED = 2026;
const dataDir = new URL('../data/', import.meta.url);
const readJson = async (file) => JSON.parse(await readFile(new URL(file, dataDir), 'utf8'));

const { localities, techParks } = await readJson('places.json');
const stations = await readJson('metro-stations.json');

// mulberry32: tiny deterministic PRNG.
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const between = (min, max) => min + rand() * (max - min);
const int = (min, max) => Math.floor(between(min, max + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const weighted = (pairs) => {
  let r = rand() * pairs.reduce((s, [, w]) => s + w, 0);
  for (const [value, w] of pairs) if ((r -= w) < 0) return value;
  return pairs.at(-1)[0];
};
const roundTo = (n, step) => Math.round(n / step) * step;

// Straight-line distance in km between two lat/lon points.
function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const km = (n) => Math.round(n * 10) / 10;

// Approximate monthly rent (INR) for an unfurnished 1BHK, plus how busy the area is
// and how family-oriented landlords there tend to be. Demo assumptions, not market data.
const AREA = {
  'Koramangala':     { rent1: 26000, noise: 'high',   family: 0.3, extra: 2 },
  'Indiranagar':     { rent1: 28000, noise: 'high',   family: 0.3, extra: 2 },
  'HSR Layout':      { rent1: 24000, noise: 'medium', family: 0.35, extra: 2 },
  'BTM Layout':      { rent1: 17000, noise: 'high',   family: 0.3, extra: 2 },
  'Jayanagar':       { rent1: 20000, noise: 'medium', family: 0.6 },
  'JP Nagar':        { rent1: 17000, noise: 'medium', family: 0.5 },
  'Whitefield':      { rent1: 20000, noise: 'medium', family: 0.4, extra: 2 },
  'Marathahalli':    { rent1: 18000, noise: 'high',   family: 0.3, extra: 2 },
  'Bellandur':       { rent1: 23000, noise: 'medium', family: 0.4, extra: 2 },
  'Sarjapur Road':   { rent1: 20000, noise: 'medium', family: 0.45, extra: 2 },
  'Electronic City': { rent1: 13000, noise: 'medium', family: 0.35, extra: 2 },
  'Hebbal':          { rent1: 21000, noise: 'medium', family: 0.45, extra: 2 },
  'Yelahanka':       { rent1: 14000, noise: 'low',    family: 0.6 },
  'Malleshwaram':    { rent1: 20000, noise: 'medium', family: 0.65 },
  'Rajajinagar':     { rent1: 17000, noise: 'medium', family: 0.6 },
  'Banashankari':    { rent1: 15000, noise: 'medium', family: 0.6 },
  'Basavanagudi':    { rent1: 18000, noise: 'low',    family: 0.7 },
  'Hennur':          { rent1: 16000, noise: 'low',    family: 0.45 },
  'Kalyan Nagar':    { rent1: 18000, noise: 'medium', family: 0.4 },
  'KR Puram':        { rent1: 14000, noise: 'high',   family: 0.4 },
  'Mahadevapura':    { rent1: 18000, noise: 'medium', family: 0.4 },
  'Hulimavu':        { rent1: 15000, noise: 'low',    family: 0.5 },
  'Thanisandra':     { rent1: 16000, noise: 'low',    family: 0.45 },
  'Domlur':          { rent1: 25000, noise: 'medium', family: 0.4 },
  'Vijayanagar':     { rent1: 15000, noise: 'medium', family: 0.6 },
};
const BASE_PER_AREA = 4; // 25 areas x 4 + 20 extras in busy tech areas = 120

const BHK = {
  1: { rentX: 1,   sqft: [500, 700] },
  2: { rentX: 1.6, sqft: [900, 1250] },
  3: { rentX: 2.3, sqft: [1350, 1800] },
};
const FURNISHING = { Unfurnished: 1, 'Semi-furnished': 1.08, 'Fully furnished': 1.2 };
const BUILDING = {
  'Gated society':       { rentX: 1.12, amenityOdds: 0.8, floors: [8, 22] },
  'Standalone building': { rentX: 1,    amenityOdds: 0.35, floors: [3, 5] },
  'Independent house':   { rentX: 0.95, amenityOdds: 0.1, floors: [2, 3] },
};
const AMENITIES = ['Gym', 'Swimming pool', 'Power backup', 'Lift', '24x7 security', 'Clubhouse', "Children's play area", 'CCTV'];
const WATER = [['Cauvery (BWSSB)', 4], ['Borewell', 2], ['Cauvery + borewell', 3], ['Tanker supply', 1]];

function nearestMetro(point) {
  let best = null;
  for (const s of stations) {
    const d = haversineKm(point, s);
    if (!best || d < best.d) best = { s, d };
  }
  return { name: best.s.name, lines: best.s.lines, km: km(best.d) };
}

function describe(l) {
  const building = l.buildingType.toLowerCase();
  const parts = [
    `${l.bhk}BHK ${l.furnishing.toLowerCase()} flat in ${/^[aeiou]/.test(building) ? 'an' : 'a'} ${building} in ${l.locality}, ${l.floor === 0 ? 'on the ground floor' : `on floor ${l.floor}`} of ${l.totalFloors}.`,
    l.nearestMetro.km <= 1.5
      ? `${l.nearestMetro.name} metro is a short walk away.`
      : `Nearest metro is ${l.nearestMetro.name}, about ${l.nearestMetro.km} km away.`,
    { low: 'Quiet street, good for working from home.', medium: 'Moderate traffic noise during peak hours.', high: 'Busy area with cafes and shops close by; expect some street noise.' }[l.noise],
    l.petsAllowed ? 'Pets are welcome.' : 'No pets, as per the owner.',
    { Family: 'Owner prefers a family.', Bachelors: 'Bachelors welcome.', Any: 'Open to families and working professionals.' }[l.tenantPreference],
    l.amenities.includes('Gym') ? 'Gym on the premises.' : null,
    `Water: ${l.waterSource}.`,
  ];
  return parts.filter(Boolean).join(' ');
}

const today = new Date('2026-11-01');
const listings = [];

for (const place of localities) {
  const area = AREA[place.name];
  if (!area) throw new Error(`No AREA settings for ${place.name}`);
  const count = BASE_PER_AREA + (area.extra ?? 0);

  for (let i = 0; i < count; i++) {
    const bhk = weighted([[1, 3], [2, 5], [3, 2]]);
    const furnishing = weighted([['Unfurnished', 3], ['Semi-furnished', 5], ['Fully furnished', 2]]);
    const buildingType = weighted([['Gated society', 4], ['Standalone building', 4], ['Independent house', 2]]);
    const building = BUILDING[buildingType];

    // Place the flat within about 1.2 km of the locality centre.
    const lat = Number((place.lat + between(-0.011, 0.011)).toFixed(6));
    const lon = Number((place.lon + between(-0.011, 0.011)).toFixed(6));
    const point = { lat, lon };

    const rent = roundTo(
      area.rent1 * BHK[bhk].rentX * FURNISHING[furnishing] * building.rentX * between(0.88, 1.15),
      500,
    );
    // Most owners ask 2-6 months; a few ask 10 (Fair Rent Check should flag these).
    const depositMonths = weighted([[2, 2], [3, 3], [5, 3], [6, 3], [8, 1], [10, 1]]);

    const totalFloors = int(...building.floors);
    const amenities = AMENITIES.filter((a) => {
      if (a === 'Lift') return totalFloors > 4 || chance(0.3);
      if (a === 'Swimming pool' || a === 'Clubhouse') return buildingType === 'Gated society' && chance(0.7);
      return chance(building.amenityOdds);
    });

    const tenantPreference = weighted([['Family', area.family], ['Bachelors', 0.25], ['Any', 1 - area.family]]);
    const availableFrom = new Date(today.getTime() + int(0, 75) * 86400000).toISOString().slice(0, 10);

    const listing = {
      id: `NF-${String(listings.length + 1).padStart(3, '0')}`,
      isDemo: true,
      locality: place.name,
      location: point,
      bhk,
      sqft: roundTo(between(...BHK[bhk].sqft), 10),
      rent,
      depositMonths,
      deposit: rent * depositMonths,
      maintenance: buildingType === 'Gated society' ? roundTo(between(2000, 5000), 100) : 0,
      furnishing,
      buildingType,
      floor: int(0, totalFloors),
      totalFloors,
      tenantPreference,
      petsAllowed: chance(buildingType === 'Independent house' ? 0.5 : 0.35),
      parking: weighted([['Car', bhk === 1 ? 2 : 5], ['Bike only', 3], ['None', 1]]),
      amenities,
      waterSource: weighted(WATER),
      noise: chance(0.25) ? pick(['low', 'medium', 'high']) : area.noise,
      availableFrom,
      nearestMetro: nearestMetro(point),
      techParks: techParks.map((t) => ({ name: t.name, km: km(haversineKm(point, t)) })),
    };
    listing.description = describe(listing);
    listings.push(listing);
  }
}

await writeFile(
  new URL('listings.json', dataDir),
  JSON.stringify({
    note: 'Demo data. Rents are generated from rough per-area assumptions. Distances are straight-line km, approximate.',
    seed: SEED,
    count: listings.length,
    listings,
  }, null, 1),
);

const rents = listings.map((l) => l.rent);
console.log(`Wrote ${listings.length} listings. Rent range: Rs ${Math.min(...rents)} - Rs ${Math.max(...rents)}`);
console.log('Sample:', JSON.stringify(listings[0], null, 1));
