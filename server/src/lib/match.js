// AI Match Score: a deterministic, explainable score for how well a flat fits a person.
// The LLM (later) only turns plain words into these preferences; the scoring itself is
// plain rules, so the same input always gives the same score and every point has a reason.

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// 1 at or below `full`, falling linearly to 0 at `zero`.
const falloff = (value, full, zero) => clamp01((zero - value) / (zero - full));

// A dealbreaker caps the score here, however good the rest is.
const DEALBREAKER_CAP = 40;

/**
 * prefs (all optional): { budget, bhk, techPark, tenant: 'Bachelors'|'Family', pets, gym, quiet, car, metro, furnishing }
 * returns { score: 0-100, reasons: [{ tone: 'good'|'warn'|'bad', text }], dealbreaker: boolean }
 */
export function scoreListing(listing, prefs) {
  const parts = []; // { weight, earned (0-1), tone, text }
  const add = (weight, earned, text, toneOverride) =>
    parts.push({ weight, earned, text, tone: toneOverride ?? (earned >= 0.75 ? 'good' : earned >= 0.4 ? 'warn' : 'bad') });
  let dealbreaker = false;

  if (prefs.budget) {
    const monthly = listing.rent + (listing.maintenance ?? 0);
    const over = (monthly - prefs.budget) / prefs.budget;
    // Full marks within budget, nothing once 20% over. Being over budget is never shown as a plus.
    const earned = falloff(over, 0, 0.2);
    if (over <= 0) add(25, earned, `${inr(prefs.budget - monthly)} under your budget`);
    else add(25, earned, `${inr(monthly - prefs.budget)} over your budget`, earned >= 0.4 ? 'warn' : 'bad');
  }

  if (prefs.techPark) {
    const park = listing.techParks.find((t) => t.name === prefs.techPark);
    if (park) add(25, falloff(park.km, 3, 18), `${park.km} km to ${prefs.techPark} (straight line)`);
  }

  if (prefs.metro) {
    const { km, name } = listing.nearestMetro;
    add(15, falloff(km, 0.8, 4), km <= 1.5 ? `${name} metro is ${km} km away` : `Nearest metro ${name} is ${km} km away`);
  } else {
    add(5, falloff(listing.nearestMetro.km, 1, 5), `${listing.nearestMetro.km} km to ${listing.nearestMetro.name} metro`);
  }

  if (prefs.bhk) {
    const diff = Math.abs(listing.bhk - prefs.bhk);
    add(15, diff === 0 ? 1 : diff === 1 ? 0.3 : 0, diff === 0 ? `${listing.bhk}BHK as you wanted` : `${listing.bhk}BHK, you asked for ${prefs.bhk}BHK`);
  }

  if (prefs.tenant) {
    const ok = listing.tenantPreference === 'Any' || listing.tenantPreference === prefs.tenant;
    if (!ok) dealbreaker = true;
    add(10, ok ? 1 : 0, ok ? (listing.tenantPreference === 'Any' ? 'Owner is open to anyone' : `Owner prefers ${prefs.tenant.toLowerCase()}`) : `Owner wants ${listing.tenantPreference.toLowerCase()} only`);
  }

  if (prefs.pets) {
    if (!listing.petsAllowed) dealbreaker = true;
    add(10, listing.petsAllowed ? 1 : 0, listing.petsAllowed ? 'Pets allowed' : 'No pets allowed');
  }

  if (prefs.gym) {
    const has = listing.amenities.includes('Gym');
    add(5, has ? 1 : 0, has ? 'Gym in the building' : 'No gym in the building', has ? 'good' : 'warn');
  }

  if (prefs.quiet) {
    const earned = { low: 1, medium: 0.5, high: 0 }[listing.noise] ?? 0.5;
    add(8, earned, { low: 'Quiet street', medium: 'Some traffic noise at peak hours', high: 'Busy, noisy area' }[listing.noise] ?? 'Noise level unknown');
  }

  if (prefs.car) {
    const has = listing.parking === 'Car';
    add(5, has ? 1 : 0, has ? 'Car parking available' : `Parking: ${listing.parking.toLowerCase()}`, has ? 'good' : 'warn');
  }

  if (prefs.furnishing) {
    const order = ['Unfurnished', 'Semi-furnished', 'Fully furnished'];
    const diff = Math.abs(order.indexOf(listing.furnishing) - order.indexOf(prefs.furnishing));
    add(5, diff === 0 ? 1 : diff === 1 ? 0.5 : 0, diff === 0 ? `${listing.furnishing} as you wanted` : `${listing.furnishing}, you asked for ${prefs.furnishing.toLowerCase()}`);
  }

  // Deposit is not a preference, but a very high one is worth a warning.
  if (listing.depositMonths >= 8) parts.push({ weight: 0, earned: 0, tone: 'warn', text: `High deposit: ${listing.depositMonths} months` });

  const possible = parts.reduce((s, p) => s + p.weight, 0);
  const earned = parts.reduce((s, p) => s + p.weight * p.earned, 0);
  let score = possible ? Math.round((earned / possible) * 100) : 0;
  if (dealbreaker) score = Math.min(score, DEALBREAKER_CAP);

  // Problems first, then the biggest strengths.
  const rank = { bad: 0, warn: 1, good: 2 };
  const reasons = parts
    .sort((a, b) => rank[a.tone] - rank[b.tone] || b.weight - a.weight)
    .map(({ tone, text }) => ({ tone, text }));

  return { score, reasons, dealbreaker };
}
