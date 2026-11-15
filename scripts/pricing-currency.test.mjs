import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { SITE_LANGUAGES } from './site-languages.mjs';
import { LOCAL_CURRENCY, VISIBLE_CURRENCIES, defaultPricingCurrency } from './pricing-currencies.mjs';
import { ilsCents, displayedIlsCents } from '../js/pricing-math.js';

test('currency defaults and future mapping cover every published language', () => {
  assert.deepEqual(Object.keys(LOCAL_CURRENCY).sort(), SITE_LANGUAGES.map(({ code }) => code).sort());
  assert.deepEqual(VISIBLE_CURRENCIES, ['USD']);
  for (const { code } of SITE_LANGUAGES) assert.equal(defaultPricingCurrency(code), 'USD');
});

test('USD to ILS uses decimal half-up agorot and sums displayed units', () => {
  assert.equal(ilsCents(190, '3.199'), 608);
  assert.equal(ilsCents(100, '3.199'), 320);
  assert.equal(ilsCents(1, '1.5'), 2);
  assert.equal(ilsCents(1, '1.49'), 1);
  assert.equal(displayedIlsCents(2100, '3.199'), 10 * 608 + 2 * 320);
  assert.equal(displayedIlsCents(570, '3.199'), 3 * 608);
  assert.equal(displayedIlsCents(11400, '3.199'), 14 * 1919 + 6 * 1600);
  for (const rate of ['0', '-3', 'Infinity', '3.1x']) assert.throws(() => ilsCents(100, rate));
  assert.throws(() => ilsCents(-1, '3.199'));
});

test('both generated products show US dollar prices only, without a currency selector', async () => {
  for (const { code: locale } of SITE_LANGUAGES) for (const product of ['wifigate-host', 'wifigate-manager']) {
    const html = await fs.readFile(new URL(`../${locale === 'en' ? '' : `${locale.toLowerCase()}/`}${product}/index.html`, import.meta.url), 'utf8');
    const $ = cheerio.load(html);
    assert.equal($('section.wa-pricing').length, 1);
    assert.equal($('[data-pricing-currency], [data-pricing-status], .wa-pricing__currency-control').length, 0);
    assert.equal($('script[src*="pricing-currency.js"]').length, 0);
    assert.match($('section.wa-pricing .wa-plan__amount').first().text(), /^\$\d/);
    assert.doesNotMatch($('section.wa-pricing').text(), /₪/);
  }
});
