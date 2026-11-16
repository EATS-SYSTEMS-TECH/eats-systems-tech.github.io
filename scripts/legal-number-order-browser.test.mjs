import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

test('Hebrew legal numbers place the period after the digit in RTL reading order', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 3, isMobile: width === 390, hasTouch: width === 390 });
      for (const legalPage of ['accessibility', 'cookies', 'privacy-policy', 'terms-and-conditions']) {
        await page.goto(pathToFileURL(path.resolve('he', legalPage, 'index.html')).href);
        const positions = await page.locator('.legal-toc a .legal-section__number, .legal-section__title .legal-section__number').evaluateAll((numbers) =>
          numbers.map((number) => {
            const [digit, period] = number.querySelectorAll('span');
            return { digit: digit.getBoundingClientRect().x, period: period.getBoundingClientRect().x };
          }));
        assert.ok(positions.length > 0, `${legalPage}/${width}: numbered headings found`);
        for (const { digit, period } of positions) {
          assert.ok(period < digit, `${legalPage}/${width}: period should appear to the left of the digit in Hebrew`);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
