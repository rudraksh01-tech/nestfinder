// Fetches real coordinates for Bengaluru localities and tech parks from
// OpenStreetMap Nominatim. Usage policy: max 1 request/second, identify with a User-Agent.
// Run: node scripts/geocode-places.js  (writes data/places.json and data/raw/nominatim.json)
import { writeFile } from 'node:fs/promises';

const USER_AGENT = 'NestFinder-demo/1.0 (portfolio project; github.com/rudraksh01-tech)';
const DELAY_MS = 1100;

// Rough box around Bengaluru urban area, used to reject wrong matches.
const BBOX = { minLat: 12.7, maxLat: 13.25, minLon: 77.35, maxLon: 77.85 };

const LOCALITIES = [
  'Koramangala', 'Indiranagar', 'HSR Layout', 'BTM Layout', 'Jayanagar',
  'JP Nagar', 'Whitefield', 'Marathahalli', 'Bellandur', 'Sarjapur Road',
  'Electronic City', 'Hebbal', 'Yelahanka', 'Malleshwaram', 'Rajajinagar',
  'Banashankari', 'Basavanagudi', 'Hennur', 'Kalyan Nagar', 'KR Puram',
  'Mahadevapura', 'Hulimavu', 'Thanisandra', 'Domlur', 'Vijayanagar',
];

// Localities whose plain name matches the wrong place get a more specific query.
const LOCALITY_QUERIES = {
  'Sarjapur Road': ['Kasavanahalli', 'Sarjapur Road Junction'],
};

// Each tech park has a few candidate queries; the first one inside the box wins.
const TECH_PARKS = [
  { name: 'Manyata Tech Park', queries: ['Manyata Tech Park', 'Manyata Embassy Business Park'] },
  { name: 'ITPL Whitefield', queries: ['International Tech Park Bangalore', 'ITPL Whitefield'] },
  { name: 'Electronic City', queries: ['Infosys Electronic City', 'Electronic City Phase 1'] },
  { name: 'Bagmane Tech Park', queries: ['Bagmane Tech Park', 'Bagmane Tech Park CV Raman Nagar'] },
  { name: 'Embassy Tech Village', queries: ['Embassy Tech Village', 'Embassy Techvillage Devarabeesanahalli'] },
  { name: 'Prestige Tech Park', queries: ['Prestige Tech Park', 'Prestige Tech Park Kadubeesanahalli'] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inBox = ({ lat, lon }) =>
  lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;

const raw = {};

async function search(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({
    q: `${query}, Bengaluru, Karnataka, India`,
    format: 'jsonv2',
    limit: '3',
    countrycodes: 'in',
  });
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  await sleep(DELAY_MS);
  if (!res.ok) throw new Error(`${query}: HTTP ${res.status}`);
  const results = await res.json();
  raw[query] = results;
  return results
    .map((r) => ({ lat: Number(Number(r.lat).toFixed(6)), lon: Number(Number(r.lon).toFixed(6)), osm: `${r.osm_type}/${r.osm_id}`, label: r.display_name }))
    .find(inBox);
}

async function geocode(name, queries) {
  for (const q of queries) {
    const hit = await search(q);
    if (hit) {
      console.log(`ok   ${name} -> ${hit.lat}, ${hit.lon}`);
      return { name, lat: hit.lat, lon: hit.lon, osm: hit.osm };
    }
  }
  console.log(`MISS ${name}`);
  return { name, lat: null, lon: null, osm: null };
}

const localities = [];
for (const name of LOCALITIES) localities.push(await geocode(name, LOCALITY_QUERIES[name] ?? [name]));

const techParks = [];
for (const { name, queries } of TECH_PARKS) techParks.push(await geocode(name, queries));

const dataDir = new URL('../data/', import.meta.url);
await writeFile(new URL('raw/nominatim.json', dataDir), JSON.stringify(raw, null, 1));
await writeFile(
  new URL('places.json', dataDir),
  JSON.stringify({ source: 'OpenStreetMap Nominatim', localities, techParks }, null, 1),
);

const misses = [...localities, ...techParks].filter((p) => p.lat === null).map((p) => p.name);
console.log(misses.length ? `\nMissing: ${misses.join(', ')}` : '\nAll places found.');
