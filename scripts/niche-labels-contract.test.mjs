import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { NICHE_CHROME } from './niche-content.mjs';
import { SITE_LANGUAGES } from './site-languages.mjs';

const frozen = JSON.parse(readFileSync(new URL('./niche-labels-contract.json', import.meta.url), 'utf8'));

test('every actual use-case locale label and its record ordering matches the complete baseline', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(NICHE_CHROME)).digest('hex'), frozen.sha256);
  assert.deepEqual(Object.keys(NICHE_CHROME), frozen.locales);
  assert.deepEqual(Object.keys(NICHE_CHROME).sort(), SITE_LANGUAGES.map(locale => locale.code).sort());
  for (const [locale, labels] of Object.entries(NICHE_CHROME)) {
    assert.deepEqual(Object.keys(labels), frozen.fields, locale);
    assert.equal(Object.getPrototypeOf(labels), Object.prototype);
    for (const value of Object.values(labels)) assert.ok(typeof value === 'string' && value.length > 0, locale);
  }
  assert.equal(Object.getPrototypeOf(NICHE_CHROME), Object.prototype);
  assert.equal(Object.isFrozen(NICHE_CHROME), false);
});
