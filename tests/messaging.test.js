import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRecipients, isEligible, validateMessage, matchesRule } from '../lib/messagingPolicy.js';

test('recipient lists preserve long IDs, remove duplicates and accept common separators', () => {
  assert.deepEqual(parseRecipients('12345678901234567890\n42,42; 73'), ['12345678901234567890', '42', '73']);
});
test('recipient lists reject usernames, URLs, empty and oversized lists', () => {
  for (const value of ['', '@user', 'https://instagram.com/user', '123\nname', Array.from({ length: 501 }, (_, i) => i + 1).join('\n')]) assert.throws(() => parseRecipients(value));
});
test('only a known incoming message strictly inside the 24-hour window is eligible', () => {
  const now = Date.UTC(2026, 8, 7);
  assert.equal(isEligible(new Date(now - 86399999), now), true);
  for (const value of [undefined, 'invalid', new Date(now - 86400000), new Date(now + 1)]) assert.equal(isEligible(value, now), false);
});
test('messages must be non-empty and bounded', () => {
  assert.equal(validateMessage(' hello '), 'hello');
  for (const value of [null, '  ', 'a'.repeat(1001)]) assert.throws(() => validateMessage(value));
});
test('rules match case-insensitively and never match when disabled', () => {
  assert.equal(matchesRule({ enabled: true, keyword: 'PRICE' }, 'What is the price?'), true);
  assert.equal(matchesRule({ enabled: false, keyword: '' }, 'hello'), false);
  assert.equal(matchesRule({ enabled: true, keyword: 'price' }, 'hello'), false);
});
