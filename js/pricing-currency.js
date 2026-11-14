/* Marketing display only: USD prices remain the canonical billing basis. */
import { displayedIlsCents, rateParts } from './pricing-math.js';
(() => {
  const section = document.querySelector('section.wa-pricing');
  const select = section?.querySelector('[data-pricing-currency]');
  if (!section || !select) return;
  const locale = document.documentElement.lang || 'en';
  const hebrew = locale === 'he';
  const status = section.querySelector('[data-pricing-status]');
  const note = section.querySelector('.wa-pricing__note');
  const nodes = [];
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('select, option, [data-pricing-status], .wa-pricing__note')) continue;
    if (/\$\s*\d/.test(node.nodeValue)) nodes.push([node, node.nodeValue]);
  }
  const originalNote = note?.textContent || '';
  const converted = (usd, rate) => {
    const cents = Math.round(Number(usd) * 100);
    return displayedIlsCents(cents, rate);
  };
  const format = cents => `₪${(cents / 100).toFixed(2)}`;
  const setStatus = (message, link) => {
    status.replaceChildren();
    status.append(document.createTextNode(message));
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.textContent = hebrew ? 'בנק ישראל' : 'Bank of Israel';
      anchor.rel = 'noopener noreferrer';
      status.append(' ', anchor);
    }
  };
  const showUsd = failed => {
    for (const [node, original] of nodes) node.nodeValue = original;
    if (note) note.textContent = originalNote;
    select.value = 'USD';
    section.dataset.currency = 'USD';
    setStatus(hebrew
      ? `המחירים בדולר ארה״ב (USD), לפני מע״מ.${failed ? ' שער השקל אינו זמין כרגע.' : ''}`
      : `Prices in US dollars (USD), before VAT/tax.${failed ? ' The ILS rate is unavailable.' : ''}`);
  };
  const showIls = record => {
    const rate = record.rate;
    for (const [node, original] of nodes) node.nodeValue = original.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, usd) => format(converted(usd, rate)));
    if (note) {
      // Retain the translated tax and product explanation while replacing its USD heading.
      const suffix = originalNote.replace(/^.*?[（(]USD[）)]/u, '');
      note.textContent = `${hebrew ? 'מחירים בשקלים חדשים (ILS)' : 'ILS (₪)'}${suffix}`.replace(/\$\s*(\d+(?:\.\d+)?)/g, (_, usd) => format(converted(usd, rate)));
    }
    select.value = 'ILS';
    section.dataset.currency = 'ILS';
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date(record.lastUpdate));
    setStatus(hebrew
      ? `המחירים בשקלים חדשים (ILS), לפני מע״מ. חישוב לפי שער יציג מ־${date}; השער אינדיקטיבי. בסיס החיוב בדולר. מקור: `
      : `Prices in Israeli shekels (ILS), before VAT/tax. Converted at the indicative reference rate dated ${date}; billing basis remains USD. Source: `, record.source);
  };
  const rateUrl = new URL('../../assets/data/usd-ils-rate.json', window.location.href);
  let ratePromise;
  const loadRate = () => ratePromise ||= fetch(rateUrl, { cache: 'no-store' }).then(response => {
    if (!response.ok) throw Error('Rate unavailable');
    return response.json();
  }).then(record => {
    const age = Date.now() - new Date(record.lastUpdate).getTime();
    if (record.base !== 'USD' || record.quote !== 'ILS' || record.unit !== 1 ||
        !Number.isFinite(Number(record.rate)) || Number(record.rate) < 1 || Number(record.rate) > 10 ||
        !Number.isFinite(age) || age < -60_000 || age > 7 * 86400_000 ||
        !record.source?.startsWith('https://www.boi.org.il/')) throw Error('Invalid or stale rate');
    rateParts(record.rate);
    return record;
  });
  select.addEventListener('change', async () => {
    if (select.value === 'USD') return showUsd(false);
    try { showIls(await loadRate()); } catch { showUsd(true); }
  });
  if (hebrew) select.dispatchEvent(new Event('change'));
  else showUsd(false);
})();
