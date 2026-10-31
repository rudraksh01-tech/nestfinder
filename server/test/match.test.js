import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreListing } from '../src/lib/match.js';

const base = {
  rent: 25000,
  maintenance: 0,
  bhk: 2,
  tenantPreference: 'Any',
  petsAllowed: true,
  amenities: ['Gym'],
  noise: 'low',
  parking: 'Car',
  furnishing: 'Semi-furnished',
  depositMonths: 3,
  nearestMetro: { name: 'Indiranagar', km: 0.5 },
  techParks: [{ name: 'Manyata Tech Park', km: 2 }],
};
const flat = (overrides) => ({ ...base, ...overrides });

test('a flat that meets every preference scores 100', () => {
  const prefs = { budget: 30000, bhk: 2, techPark: 'Manyata Tech Park', tenant: 'Bachelors', pets: true, gym: true, quiet: true, car: true, metro: true };
  const { score, dealbreaker } = scoreListing(base, prefs);
  assert.equal(score, 100);
  assert.equal(dealbreaker, false);
});

test('rent over budget lowers the score, 20% over gives no budget points', () => {
  const prefs = { budget: 20000 };
  const within = scoreListing(flat({ rent: 20000 }), prefs).score;
  const tenOver = scoreListing(flat({ rent: 22000 }), prefs).score;
  const wayOver = scoreListing(flat({ rent: 24000 }), prefs).score;
  assert.ok(within > tenOver && tenOver > wayOver);
  assert.match(scoreListing(flat({ rent: 22000 }), prefs).reasons[0].text, /over your budget/);
});

test('being slightly over budget is a warning, never a plus', () => {
  const over = scoreListing(flat({ rent: 20500 }), { budget: 20000 }).reasons.find((r) => /over your budget/.test(r.text));
  assert.equal(over.tone, 'warn');
});

test('the wrong BHK ranks below the right BHK even when cheaper', () => {
  const prefs = { budget: 50000, bhk: 3 };
  const cheapTwo = scoreListing(flat({ bhk: 2, rent: 22000 }), prefs).score;
  const threeBhk = scoreListing(flat({ bhk: 3, rent: 45000 }), prefs).score;
  assert.ok(threeBhk > cheapTwo);
});

test('maintenance counts towards the budget', () => {
  const prefs = { budget: 25000 };
  assert.ok(scoreListing(flat({ maintenance: 4000 }), prefs).score < scoreListing(base, prefs).score);
});

test('pets not allowed is a dealbreaker that caps the score', () => {
  const { score, dealbreaker, reasons } = scoreListing(flat({ petsAllowed: false }), { pets: true, budget: 30000 });
  assert.equal(dealbreaker, true);
  assert.ok(score <= 40);
  assert.deepEqual(reasons[0], { tone: 'bad', text: 'No pets allowed' });
});

test('family-only flat is a dealbreaker for bachelors but fine for families', () => {
  const familyOnly = flat({ tenantPreference: 'Family' });
  assert.equal(scoreListing(familyOnly, { tenant: 'Bachelors' }).dealbreaker, true);
  assert.equal(scoreListing(familyOnly, { tenant: 'Family' }).dealbreaker, false);
});

test('preferences the person did not mention do not affect the score', () => {
  const noisyNoGym = flat({ noise: 'high', amenities: [] });
  assert.equal(scoreListing(noisyNoGym, { budget: 30000 }).score, scoreListing(base, { budget: 30000 }).score);
});

test('closer office means a higher score', () => {
  const prefs = { techPark: 'Manyata Tech Park' };
  const near = scoreListing(flat({ techParks: [{ name: 'Manyata Tech Park', km: 3 }] }), prefs).score;
  const far = scoreListing(flat({ techParks: [{ name: 'Manyata Tech Park', km: 15 }] }), prefs).score;
  assert.ok(near > far);
});

test('a high deposit adds a warning without changing the score', () => {
  const normal = scoreListing(base, { budget: 30000 });
  const high = scoreListing(flat({ depositMonths: 10 }), { budget: 30000 });
  assert.equal(high.score, normal.score);
  assert.ok(high.reasons.some((r) => r.tone === 'warn' && /deposit/.test(r.text)));
});
