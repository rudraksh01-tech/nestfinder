// Distance helpers shared by the listing generator and the broker API.
import { readFileSync } from 'node:fs';

const readJson = (file) => JSON.parse(readFileSync(new URL(`../../data/${file}`, import.meta.url), 'utf8'));

export const stations = readJson('metro-stations.json');
export const { localities, techParks } = readJson('places.json');

// Straight-line distance in km between two lat/lon points.
export function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
export const km = (n) => Math.round(n * 10) / 10;

export function nearestMetro(point) {
  let best = null;
  for (const s of stations) {
    const d = haversineKm(point, s);
    if (!best || d < best.d) best = { s, d };
  }
  return { name: best.s.name, lines: best.s.lines, km: km(best.d) };
}

export const techParkDistances = (point) => techParks.map((t) => ({ name: t.name, km: km(haversineKm(point, t)) }));
