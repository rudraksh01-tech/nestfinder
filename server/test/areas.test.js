import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveArea, resolveFurnishing, resolveTechPark, resolveTenant } from '../src/lib/areas.js';
import { languageOf } from '../src/lib/language.js';

test('areas resolve from exact names, spellings and neighbourhoods', () => {
  assert.equal(resolveArea('HSR Layout'), 'HSR Layout');
  assert.equal(resolveArea('hsr'), 'HSR Layout');
  assert.equal(resolveArea('J.P. Nagar'), 'JP Nagar');
  assert.equal(resolveArea('e-city'), 'Electronic City');
  assert.equal(resolveArea('Kasavanahalli'), 'Sarjapur Road');
  assert.equal(resolveArea('Brookefield'), 'Whitefield');
  assert.equal(resolveArea('a 2bhk in koramangala please'), 'Koramangala');
});

test('an area we do not cover is not guessed', () => {
  assert.equal(resolveArea('Mysuru'), null);
  assert.equal(resolveArea(''), null);
});

test('office areas map to the nearest tech park', () => {
  assert.equal(resolveTechPark('ITPL Whitefield'), 'ITPL Whitefield');
  assert.equal(resolveTechPark('Whitefield'), 'ITPL Whitefield');
  assert.equal(resolveTechPark('office in Hebbal'), 'Manyata Tech Park');
  assert.equal(resolveTechPark('Outer Ring Road'), 'Embassy Tech Village');
  assert.equal(resolveTechPark('Infosys'), 'Electronic City');
  assert.equal(resolveTechPark('Google office'), null);
});

test('tenant and furnishing accept everyday wording', () => {
  assert.equal(resolveTenant('family'), 'Family');
  assert.equal(resolveTenant('married couple'), 'Family');
  assert.equal(resolveTenant('bachelor'), 'Bachelors');
  assert.equal(resolveTenant('living alone'), 'Bachelors');
  assert.equal(resolveFurnishing('semi furnished'), 'Semi-furnished');
  assert.equal(resolveFurnishing('unfurnished'), 'Unfurnished');
  assert.equal(resolveFurnishing('not furnished'), 'Unfurnished');
  assert.equal(resolveFurnishing('fully furnished'), 'Fully furnished');
});

test('reply language follows the script and common Hinglish words', () => {
  assert.equal(languageOf('Show me flats near Manyata under 25k'), 'English');
  assert.equal(languageOf('Flats in Kalyan Nagar under 20k'), 'English');
  assert.equal(languageOf('Bagmane me job hai, 20k budget'), 'Hinglish');
  assert.equal(languageOf('मुझे 2BHK चाहिए'), 'Hindi');
});
