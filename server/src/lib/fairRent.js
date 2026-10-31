// Fair Rent Check: compares an asked rent and deposit with similar sample flats.
// Pure rules (no LLM), so the verdict is repeatable and testable.
import { haversineKm } from './geo.js';

const MIN_COMPARABLES = 4;
// When one area has too few flats, widen step by step to areas whose centres are this close.
const WIDEN_STEPS = [
  { km: 4, label: 'in and around' },
  { km: 8, label: 'within about 8 km of' },
];
export const TYPICAL_MAX_DEPOSIT_MONTHS = 6;

const roundTo = (n, step) => Math.round(n / step) * step;

// Percentile with linear interpolation; `sorted` must be ascending.
export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function verdictFor(diff) {
  if (diff <= -0.1) return { level: 'low', label: 'Below the usual range' };
  if (diff <= 0.1) return { level: 'fair', label: 'Fair' };
  if (diff <= 0.25) return { level: 'slightly_high', label: 'Slightly high' };
  return { level: 'high', label: 'High' };
}

/**
 * ask: { locality, bhk, rent, depositMonths?, furnishing? }
 * listings: all sample listings; localities: [{ name, lat, lon }]
 */
export function checkRent(ask, listings, localities) {
  const centre = localities.find((l) => l.name === ask.locality);

  let pool = listings.filter((l) => l.locality === ask.locality && l.bhk === ask.bhk);
  let scope = `${ask.bhk}BHK flats in ${ask.locality}`;
  for (const step of WIDEN_STEPS) {
    if (pool.length >= MIN_COMPARABLES) break;
    const names = localities.filter((l) => haversineKm(centre, l) <= step.km).map((l) => l.name);
    pool = listings.filter((l) => names.includes(l.locality) && l.bhk === ask.bhk);
    scope = `${ask.bhk}BHK flats ${step.label} ${ask.locality}`;
  }
  // Furnishing moves rent a lot, so compare like with like when there are enough such flats.
  if (ask.furnishing) {
    const same = pool.filter((l) => l.furnishing === ask.furnishing);
    if (same.length >= MIN_COMPARABLES) {
      pool = same;
      scope = `${ask.furnishing.toLowerCase()} ${scope}`;
    }
  }
  if (pool.length < 2) return { enough: false, scope, count: pool.length };

  const rents = pool.map((l) => l.rent).sort((a, b) => a - b);
  const months = pool.map((l) => l.depositMonths).sort((a, b) => a - b);
  const median = Math.round(percentile(rents, 0.5));
  const diff = (ask.rent - median) / median;
  const typicalMonths = Math.round(percentile(months, 0.5) * 2) / 2;

  const deposit = ask.depositMonths
    ? {
        months: ask.depositMonths,
        amount: Math.round(ask.rent * ask.depositMonths),
        typicalMonths,
        high: ask.depositMonths > TYPICAL_MAX_DEPOSIT_MONTHS,
        aboveTypical: ask.depositMonths > typicalMonths,
      }
    : null;

  // A reasonable counter-offer: the median rent (never above what was asked), and a deposit
  // no higher than what is typical here, capped at the usual Bengaluru maximum.
  const target = {
    rent: Math.min(ask.rent, roundTo(median, 500)),
    depositMonths: deposit ? Math.min(deposit.months, Math.min(typicalMonths, TYPICAL_MAX_DEPOSIT_MONTHS)) : null,
  };

  const comparables = [...pool]
    .sort((a, b) => Math.abs(a.rent - ask.rent) - Math.abs(b.rent - ask.rent))
    .slice(0, 5)
    .map((l) => ({ code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, depositMonths: l.depositMonths, furnishing: l.furnishing, sqft: l.sqft }));

  return {
    enough: true,
    scope,
    count: pool.length,
    rent: {
      asked: ask.rent,
      median,
      low: Math.round(percentile(rents, 0.25)),
      high: Math.round(percentile(rents, 0.75)),
      min: rents[0],
      max: rents.at(-1),
      diffPercent: Math.round(diff * 100),
      verdict: verdictFor(diff),
    },
    deposit,
    target,
    comparables,
  };
}
