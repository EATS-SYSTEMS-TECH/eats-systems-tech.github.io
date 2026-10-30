import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const source = await readFile(new URL('../js/accessibility-copy.js', import.meta.url), 'utf8');
const frozen = JSON.parse(await readFile(new URL('../maintenance/ip-contracts/accessibility-copy.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function evaluate(context = { window: {} }) { vm.runInNewContext(source, context); return context; }
function leaves(value, prefix = []) {
  return Object.entries(value).flatMap(([key, child]) => typeof child === 'string' ? [[prefix.concat(key).join('.'), child]] : leaves(child, prefix.concat(key)));
}
test('complete dictionary values and nested insertion order match the frozen original', () => {
  const result = evaluate().window.accessibilityCopy;
  assert.equal(digest(result), frozen.serializationSha256);
  assert.deepEqual(Object.keys(result), frozen.localeOrder);
});
test('all39locale records retain their34field shape and exact localized facts', () => {
  const copy = evaluate().window.accessibilityCopy;
  assert.equal(Object.keys(copy).length, 39);
  for (const locale of frozen.localeOrder) {
    assert.deepEqual(leaves(copy[locale]).map(([key]) => key), frozen.fieldOrder);
    assert.equal(digest(copy[locale]), frozen.locales[locale]);
    assert.ok(leaves(copy[locale]).every(([, value]) => value.trim().length > 0));
    assert.ok(copy[locale].statusActive.includes('{count}'));
    assert.ok(copy[locale].textSize.level.includes('{percent}'));
  }
});
test('locale groups remain mutable and independent', () => {
  const copy = evaluate().window.accessibilityCopy, originalHebrew = digest(copy.he);
  copy.en.textSize.label = 'Changed only here'; copy.en.options.reducedMotion.label = 'Local change';
  assert.equal(digest(copy.he), originalHebrew);
  assert.notEqual(copy.en.textSize, copy.he.textSize);
  assert.notEqual(copy.en.options, copy.he.options);
});
test('script reload replaces stale fields and mutations without adding globals', () => {
  const context = { window: { retained: { marker: 9 }, accessibilityCopy: { stale: true } } };
  evaluate(context); const previous = context.window.accessibilityCopy;
  previous.en.skipLink = 'Mutated'; evaluate(context);
  assert.notEqual(context.window.accessibilityCopy, previous);
  assert.equal(digest(context.window.accessibilityCopy), frozen.serializationSha256);
  assert.equal(context.window.retained.marker, 9);
  assert.deepEqual(Object.keys(context), ['window']);
  assert.deepEqual(Object.keys(context.window), ['retained', 'accessibilityCopy']);
});
test('absence of the required browser window keeps the original ReferenceError', () => {
  assert.throws(() => evaluate({}), error => error.name === 'ReferenceError');
});
