import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskPhones } from '../src/lib/tracing.js';

test('masks Indian mobile numbers in any format', () => {
  const text = 'Call 9876543210, +91 98765 43210, 91-9876543210 or 98765-43210';
  assert.equal(maskPhones(text), 'Call [phone], [phone], [phone] or [phone]');
});

test('masks inside nested objects and arrays', () => {
  const input = { messages: [{ role: 'user', content: 'my number is 9123456789' }], prefs: { budget: 25000 } };
  assert.deepEqual(maskPhones(input), { messages: [{ role: 'user', content: 'my number is [phone]' }], prefs: { budget: 25000 } });
});

test('leaves rents, deposits and other numbers alone', () => {
  const text = 'Rent 48000, deposit 480000, sqft 1050, pin 560102, 2BHK, 12345678901';
  assert.equal(maskPhones(text), text);
});
