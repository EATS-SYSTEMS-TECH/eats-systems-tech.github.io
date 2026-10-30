import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

const frozen = JSON.parse(await readFile(new URL('../maintenance/ip-contracts/shared-template-fragments.json', import.meta.url), 'utf8'));
const fragments = new Map();
for (const row of frozen.files) fragments.set(row.path, load(await readFile(new URL('../' + row.path, import.meta.url), 'utf8')));
test('footer keeps the serialized opening boundary consumed by existing verify-site', async () => {
  const source = await readFile(new URL('../templates/partials/site-footer.template.html', import.meta.url), 'utf8');
  assert.ok(source.includes('<footer class="site-footer"'), 'existing verify-site locates the shared footer by this literal prefix');
});
// HTML source indentation/comments are authoring details; every actual node,
// attribute, word, URL and decorative SVG fact remains part of this contract.
function model(node) {
  if (node.type === 'comment') return null;
  if (node.type === 'text') { const text = node.data.replace(/\s+/g, ' ').trim(); return text ? ['text', text] : null; }
  return [node.type, node.name ?? null, Object.entries(node.attribs ?? {}).sort(([a], [b]) => a.localeCompare(b)), (node.children ?? []).map(model).filter(Boolean)];
}
for (const row of frozen.files) test(`complete original fragment DOM contract: ${row.path}`, () => {
  const $ = fragments.get(row.path);
  const digest = createHash('sha256').update(JSON.stringify(model($.root()[0]))).digest('hex');
  assert.equal(digest, row.domSha256);
});
test('Host fragment supplies exactly the four ordered translated detail mounts', () => {
  const $ = fragments.get('templates/guest-invites-api.template.html');
  assert.deepEqual($('body > section').map((_, node) => $(node).attr('class')).get(), ['wa-audience', 'section wa-secure', 'section wa-pricing', 'section wa-cta']);
  for (const selector of ['.wa-audience__row', '.wa-secure__grid', '.wa-pricing__grid']) { assert.equal($(selector).length, 1); assert.equal($(selector).children().length, 0); }
  for (const id of ['wa-secure-title', 'wa-pricing-title', 'wa-cta-title']) assert.equal($(`[aria-labelledby='${id}']`).length, 1);
  assert.equal($('.wa-cta a').attr('href'), '../index.html#contact');
});
test('footer translation positions and cookie action stay stable', () => {
  const $ = fragments.get('templates/partials/site-footer.template.html');
  assert.equal($('footer.site-footer > .site-footer__inner').length, 1);
  assert.deepEqual($('.site-footer__heading').map((_, node) => $(node).attr('data-i18n')).get(), ['footer.legalTitle', 'footer.appSupportTitle', 'footer.socialTitle']);
  assert.deepEqual($('.site-footer__links > :nth-child(-n+3)').map((_, node) => $(node).attr('href')).get(), ['../terms-and-conditions/', '../privacy-policy/', '../cookies/']);
  assert.equal($('button[data-cookie-settings]').attr('type'), 'button');
  assert.equal($('.site-footer__logo').attr('width'), '384');
});
test('footer external destinations retain safe opener policy and native contact routes', () => {
  const $ = fragments.get('templates/partials/site-footer.template.html');
  assert.equal($('.site-footer__stores > a').length, 2);
  assert.equal($('a[href="mailto:support@wifigate.io"]').length, 1);
  assert.deepEqual($('.site-footer__social-link').map((_, node) => $(node).attr('aria-label')).get(), ['Facebook', 'YouTube', 'LinkedIn', 'Instagram', 'WhatsApp']);
  $('a[target="_blank"]').each((_, node) => { const rel = $(node).attr('rel').split(/\s+/); assert.ok(rel.includes('noopener')); assert.ok(rel.includes('noreferrer')); });
});
