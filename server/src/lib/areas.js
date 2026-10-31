// Turns the names people actually use ("Whitefield office", "Kasavanahalli", "hsr", "e-city")
// into the exact area and tech-park names the data uses. Done in code, not by the model, so it is
// deterministic and testable; the assistant's tools accept free text and resolve it here.
import { localities, techParks } from './geo.js';

export const AREAS = localities.map((l) => l.name);
export const PARKS = techParks.map((t) => t.name);

// Lower-case, no punctuation, single spaces: "J.P. Nagar" -> "j p nagar", "E-City" -> "e city".
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, ' ').trim();
const squash = (s) => norm(s).replace(/ /g, '');

// Neighbourhoods and spellings mapped to the 25 areas in the data.
const AREA_ALIASES = {
  'HSR Layout': ['hsr'],
  'BTM Layout': ['btm'],
  'JP Nagar': ['jayaprakash nagar', 'jp nagar'],
  Indiranagar: ['indira nagar'],
  Koramangala: ['koramangla', 'kormangala'],
  'Electronic City': ['ecity', 'e city', 'electronics city'],
  'KR Puram': ['krishnarajapuram', 'k r puram'],
  Malleshwaram: ['malleswaram'],
  Rajajinagar: ['rajaji nagar'],
  Basavanagudi: ['basavangudi'],
  Vijayanagar: ['vijaynagar', 'vijayanagara'],
  Mahadevapura: ['mahadevpura'],
  'Sarjapur Road': ['sarjapur', 'kasavanahalli', 'haralur', 'dommasandra'],
  Bellandur: ['kadubeesanahalli', 'panathur'],
  Whitefield: ['brookefield', 'hoodi', 'itpl'],
  'Kalyan Nagar': ['hrbr', 'kammanahalli'],
  Hulimavu: ['bommanahalli', 'begur'],
  Hebbal: ['nagawara', 'sahakar nagar'],
};

// Work areas mapped to the six tech parks the distances are measured to.
const PARK_ALIASES = {
  'Manyata Tech Park': ['manyata', 'nagawara', 'hebbal', 'thanisandra'],
  'ITPL Whitefield': ['itpl', 'international tech park', 'whitefield', 'brookefield', 'hoodi'],
  'Electronic City': ['electronic city', 'electronics city', 'ecity', 'e city', 'infosys', 'wipro'],
  'Bagmane Tech Park': ['bagmane', 'cv raman nagar', 'c v raman nagar', 'old airport road'],
  'Embassy Tech Village': ['embassy tech village', 'etv', 'outer ring road', 'orr', 'bellandur', 'ecospace', 'devarabeesanahalli'],
  'Prestige Tech Park': ['prestige', 'kadubeesanahalli', 'marathahalli'],
};

function resolve(input, names, aliases) {
  const text = norm(input);
  if (!text) return null;
  const exact = names.find((n) => squash(n) === squash(text));
  if (exact) return exact;
  // Whole-word match of an alias anywhere in the text ("office in whitefield" -> Whitefield).
  const padded = ` ${text} `;
  for (const [name, words] of Object.entries(aliases)) {
    if (words.some((w) => padded.includes(` ${norm(w)} `))) return name;
  }
  // The text contains a full area name ("2bhk in hsr layout please").
  return names.find((n) => padded.includes(` ${norm(n)} `)) ?? null;
}

export const resolveArea = (input) => resolve(input, AREAS, AREA_ALIASES);
export const resolveTechPark = (input) => resolve(input, PARKS, PARK_ALIASES);

export function resolveTenant(input) {
  const text = norm(input);
  if (/famil|couple|married|wife|husband|kids|parents/.test(text)) return 'Family';
  if (/bachelor|single|alone|student|friends|sharing/.test(text)) return 'Bachelors';
  return null;
}

export function resolveFurnishing(input) {
  const text = norm(input);
  if (/semi/.test(text)) return 'Semi-furnished';
  if (/^(un|not|no)\b|unfurnish|bare/.test(text)) return 'Unfurnished';
  if (/full|furnish/.test(text)) return 'Fully furnished';
  return null;
}
