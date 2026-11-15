import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { SITE_LANGUAGES } from './site-languages.mjs';
import { LEGAL_PAGES, legalBundles } from './legal/legal-pages.mjs';

test('numbered legal headings keep the number beside every translated title', async () => {
  for (const page of LEGAL_PAGES) {
    const bundles = legalBundles(page);
    for (const { code } of SITE_LANGUAGES) {
      const prefix = code === 'en' ? '' : `${code.toLowerCase()}/`;
      const html = await readFile(new URL(`../${prefix}${page}/index.html`, import.meta.url), 'utf8');
      const $ = cheerio.load(html);
      const sections = Object.entries(bundles[code].s);
      assert.equal($('.legal-section__title').length, sections.length, `${page}/${code}`);
      for (const [id, copy] of sections) {
        const heading = $(`#${id}-title`);
        const match = /^(\d+\.)\s+(.+)$/u.exec(copy.title);
        assert.ok(match, `${page}/${code}/${id}: numbered copy`);
        for (const element of [heading, $(`.legal-toc a[href="#${id}"]`)]) {
          const number = element.find('bdi.legal-section__number[dir="ltr"]');
          assert.equal(number.text(), match[1]);
          assert.deepEqual(number.children('span').map((_, span) => $(span).text()).get(), [match[1].slice(0, -1), '.']);
          const label = element.find('.legal-section__label');
          const rendered = label.contents().map((_, node) => node.name === 'br' ? ' ' : $(node).text()).get().join('').replace(/\s+/g, ' ').trim();
          assert.equal(rendered, match[2]);
        }
      }
    }
  }
});
