import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRent, percentile } from '../src/lib/fairRent.js';

const localities = [
  { name: 'HSR Layout', lat: 12.9116, lon: 77.6389 },
  { name: 'BTM Layout', lat: 12.914, lon: 77.6103 }, // ~3 km from HSR
  { name: 'Yelahanka', lat: 13.1007, lon: 77.5963 }, // far away
];
let n = 0;
const flat = (locality, bhk, rent, extra = {}) => ({
  code: `NF-${++n}`, locality, bhk, rent, depositMonths: 3, furnishing: 'Semi-furnished', sqft: 1000, ...extra,
});
const listings = [
  flat('HSR Layout', 2, 30000), flat('HSR Layout', 2, 32000), flat('HSR Layout', 2, 34000),
  flat('HSR Layout', 2, 36000), flat('HSR Layout', 2, 38000, { depositMonths: 10 }),
  flat('HSR Layout', 1, 20000),
  flat('BTM Layout', 1, 15000), flat('BTM Layout', 1, 16000), flat('BTM Layout', 1, 17000),
  flat('Yelahanka', 1, 9000), flat('Yelahanka', 1, 9500),
];

test('percentile interpolates between values', () => {
  assert.equal(percentile([10, 20, 30, 40], 0.5), 25);
  assert.equal(percentile([10, 20, 30], 0.25), 15);
});

test('rent at the median is fair', () => {
  const r = checkRent({ locality: 'HSR Layout', bhk: 2, rent: 34000 }, listings, localities);
  assert.equal(r.rent.median, 34000);
  assert.equal(r.rent.verdict.level, 'fair');
  assert.equal(r.count, 5);
});

test('rent well above similar flats is high, and the target is the median', () => {
  const r = checkRent({ locality: 'HSR Layout', bhk: 2, rent: 45000 }, listings, localities);
  assert.equal(r.rent.verdict.level, 'high');
  assert.equal(r.rent.diffPercent, 32);
  assert.equal(r.target.rent, 34000);
});

test('a 10-month deposit is flagged and the target deposit is the local typical', () => {
  const r = checkRent({ locality: 'HSR Layout', bhk: 2, rent: 34000, depositMonths: 10 }, listings, localities);
  assert.equal(r.deposit.high, true);
  assert.equal(r.deposit.typicalMonths, 3);
  assert.equal(r.target.depositMonths, 3);
});

test('target never asks for more than the asked rent', () => {
  const r = checkRent({ locality: 'HSR Layout', bhk: 2, rent: 28000 }, listings, localities);
  assert.equal(r.target.rent, 28000);
  assert.equal(r.rent.verdict.level, 'low');
});

test('too few flats in one area widens to nearby areas only', () => {
  const r = checkRent({ locality: 'HSR Layout', bhk: 1, rent: 18000 }, listings, localities);
  assert.match(r.scope, /in and around HSR Layout/);
  assert.equal(r.count, 4); // 1 in HSR + 3 in BTM, none from far-away Yelahanka
});

test('widens to about 8 km when 4 km is still too few', () => {
  const locs = [...localities, { name: 'Far HSR', lat: 12.9116, lon: 77.7 }]; // ~6.7 km east of HSR
  const extra = [flat('Far HSR', 3, 50000), flat('Far HSR', 3, 52000), flat('HSR Layout', 3, 48000), flat('HSR Layout', 3, 51000)];
  const r = checkRent({ locality: 'HSR Layout', bhk: 3, rent: 50000 }, [...listings, ...extra], locs);
  assert.match(r.scope, /within about 8 km of HSR Layout/);
  assert.equal(r.count, 4);
});

test('not enough comparable flats is reported, not guessed', () => {
  const r = checkRent({ locality: 'Yelahanka', bhk: 3, rent: 30000 }, listings, localities);
  assert.equal(r.enough, false);
});
