import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

// Freeze behavior of actual function declarations before replacing the CLI.
// The planned modules retain these helpers; no generated site is imported here.
const sources = [];
for (const name of ['build-localized-site.mjs', 'localized-builder-document.mjs', 'localized-builder-content.mjs']) {
  sources.push(await readFile(new URL(name, import.meta.url), 'utf8').catch(error => {
    if (error.code === 'ENOENT' && name !== 'build-localized-site.mjs') return '';
    throw error;
  }));
}
function actual(name, dependencies = {}) {
  const pattern = new RegExp(`^(?:export )?(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, 'm');
  const declaration = sources.map(source => source.match(pattern)?.[0]).find(Boolean);
  assert.ok(declaration, `Actual ${name} declaration must remain testable`);
  return vm.runInNewContext(declaration.replace(/^export /, '') + `\n${name};`, dependencies);
}
const optional = new Set(['hero.statement', 'footer.taglineLines', 'platform.subscriptionNote', 'why.pointsNote', ...[0, 1, 2].map(i => `automation.points.${i}.icon`)]);
function shape() {
  const context = { OPTIONAL_COPY_KEYS: optional };
  context.validateCopyShape = actual('validateCopyShape', context);
  return context.validateCopyShape;
}

test('localized copy rejects missing/extra keys, array sizes, empty strings and wrong primitive types', () => {
  const check = shape(), reference = { title: 'Hello', list: [{ label: 'A' }], enabled: true };
  check(reference, { title: 'שלום', list: [{ label: 'ב' }], enabled: false });
  for (const candidate of [{ title: 'Hello', list: [], enabled: true }, { ...reference, extra: 1 }, { ...reference, title: ' ' }, { ...reference, enabled: 'true' }, { list: reference.list, enabled: true }]) {
    assert.throws(() => check(reference, candidate));
  }
});
test('optional copy keys are optional on both sides and supplied reference values remain validated', () => {
  const check = shape();
  check({ hero: { title: 'Title', statement: 'Text' } }, { hero: { title: 'כותרת' } });
  check({ hero: { title: 'Title' } }, { hero: { title: 'כותרת', statement: 'טקסט' } });
  assert.throws(() => check({ hero: { title: 'Title', statement: 'Text' } }, { hero: { title: 'כותרת', statement: 7 } }));
});
test('locale/page paths and asset depth preserve English home and nested keys', () => {
  const deps = { defaultLocale: 'en', normalizeLocalePath: value => value.toLowerCase() };
  deps.getOutputSegments = actual('getOutputSegments', deps);
  const page = actual('buildPagePath', deps), prefix = actual('buildAssetPrefix', deps);
  for (const [locale, key, expected, depth] of [['en', 'home', '/', ''], ['he', 'home', '/he/', '../'], ['zh-Hant', 'shop/device', '/zh-hant/shop/device/', '../../../'], ['en', 'shop/device', '/shop/device/', '../../']]) {
    assert.equal(page(locale, key), expected); assert.equal(prefix(locale, key), depth);
  }
});
test('static asset rewriting preserves external/fragment values and original prefix order', () => {
  const rewrite = actual('toStaticAssetPath');
  for (const unchanged of ['', undefined, '#main', '//cdn.test/a', 'https://test/a', 'data:image/png,x', 'mailto:a@test']) assert.equal(rewrite(unchanged, '../../'), unchanged);
  for (const source of ['assets/a.png', '/assets/a.png', '../../assets/a.png', './assets/a.png']) assert.equal(rewrite(source, '../'), '../assets/a.png');
  assert.equal(rewrite('./../assets/a.png', '../'), '../../assets/a.png');
});
test('RTL punctuation marks preserve existing marks and whitespace without changing LTR', () => {
  const format = actual('formatTextForLocaleDirection', { isRtl: locale => locale === 'he' });
  assert.equal(format('Hello!  ', 'he'), 'Hello!  \u200f');
  assert.equal(format('שלום\u200e', 'he'), 'שלום\u200e');
  assert.equal(format('שלום', 'he'), 'שלום');
  assert.equal(format('Hello!', 'en'), 'Hello!');
  assert.equal(format(null, 'he'), null);
});
test('benefit spans fill complete rows for zero, single and incomplete trailing rows', () => {
  const spans = actual('benefitSpans');
  const expected = [[], ['full'], ['lead', 'feature'], ['lead', 'feature', 'full'], ['lead', 'feature', 'half', 'half'], ['lead', 'feature', 'third', 'third', 'third'], ['lead', 'feature', 'third', 'third', 'third', 'full'], ['lead', 'feature', 'third', 'third', 'third', 'half', 'half']];
  expected.forEach((row, count) => assert.deepEqual(Array.from(spans(count)), row));
});
test('newline normalization preserves existing final newline', () => {
  const newline = actual('ensureTrailingNewline');
  assert.equal(newline('x'), 'x\n'); assert.equal(newline('x\n'), 'x\n');
});
function writer({ previous = '', failures = [] } = {}) {
  const calls = [], changedFiles = new Set();
  const fs = { mkdir: async (...args) => calls.push(['mkdir', ...args]), readFile: async () => { if (previous instanceof Error) throw previous; return previous; }, writeFile: async (...args) => { calls.push(['write', ...args]); const error = failures.shift(); if (error) throw error; } };
  return { calls, changedFiles, run: actual('writeOutputFile', { fs, path, changedFiles, setTimeout(callback, delay) { calls.push(['delay', delay]); callback(); } }) };
}
test('unchanged CRLF-equivalent output is never written or marked changed', async () => {
  const w = writer({ previous: 'a\r\nb\r\n' }); await w.run('/root/page/index.html', 'a\nb\n');
  assert.equal(w.changedFiles.size, 0); assert.equal(w.calls.filter(c => c[0] === 'write').length, 0);
});
test('transient output errors retry five writes with the four bounded exponential delays', async () => {
  const w = writer({ failures: ['EACCES', 'EBUSY', 'EPERM', 'UNKNOWN'].map(code => Object.assign(new Error(code), { code })) });
  await w.run('/root/page/index.html', 'new');
  assert.equal(w.calls.filter(c => c[0] === 'write').length, 5);
  assert.deepEqual(w.calls.filter(c => c[0] === 'delay').map(c => c[1]), [100, 200, 400, 800]);
  assert.ok(w.changedFiles.has(path.resolve('/root/page/index.html')));
});
test('final transient and immediate nonretryable failures propagate and retain changed-path evidence', async () => {
  for (const code of ['EBUSY', 'ENOSPC']) {
    const failure = Object.assign(new Error('Retained write failure'), { code });
    const w = writer({ failures: Array(5).fill(failure) });
    await assert.rejects(w.run('/root/page/index.html', 'new'), error => error === failure);
    assert.equal(w.calls.filter(c => c[0] === 'write').length, code === 'EBUSY' ? 5 : 1);
    assert.equal(w.changedFiles.size, 1);
  }
});
test('unreadable previous output follows the original new-file write policy', async () => {
  const w = writer({ previous: new Error('No existing output') }); await w.run('/root/page/index.html', 'new');
  assert.equal(w.calls.filter(c => c[0] === 'write').length, 1); assert.equal(w.changedFiles.size, 1);
});
