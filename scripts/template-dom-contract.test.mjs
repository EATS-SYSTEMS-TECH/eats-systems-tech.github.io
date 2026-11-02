import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { load } from 'cheerio';

// Compare the entire actual parser tree. Only comments/indentation and
// attribute serialization are irrelevant; all text, values and order remain.
export function templateModelHash(html) {
  const $ = load(html);
  const visit = node => {
    if (node.type === 'comment' || (node.type === 'text' && /^\s*$/.test(node.data))) return null;
    if (node.type === 'text') return ['text', node.data];
    return [node.type, node.name ?? null,
      Object.entries(node.attribs ?? {}).sort(([left], [right]) => left.localeCompare(right)),
      (node.children ?? []).map(visit).filter(Boolean)];
  };
  return createHash('sha256').update(JSON.stringify(visit($.root()[0]))).digest('hex');
}

const baseline = JSON.parse(readFileSync(new URL('./template-dom-contract.json', import.meta.url), 'utf8'));
for (const [filename, expected] of Object.entries(baseline.files)) {
  test(`complete template parser model is unchanged: ${filename}`, () => {
    assert.equal(templateModelHash(readFileSync(new URL('../' + filename, import.meta.url), 'utf8')), expected);
  });
}
