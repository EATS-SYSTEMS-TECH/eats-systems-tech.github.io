import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { SITE_ORIGIN, hreflangCode } from './seo.mjs';
import { RTL_LANGUAGES } from './site-languages.mjs';
import { SITE_NAVIGATION, SITE_LOGIN_LABELS } from './site-navigation.mjs';
import { accessibilityLinkLabels } from './legal/footer-labels.mjs';
import { applyMediaWatermarks } from './media-watermark.mjs';
import { HOST_PAGE_KEY } from './host-marketing-page.mjs';
import { AUTO_OPEN_PAGE_KEY } from './auto-open-page.mjs';
import { serializeScriptData } from "./script-data.mjs";

// One invocation owns its input root, caches and unchanged product constants.
export const repoRoot = process.cwd();
export const defaultLocale = 'en';
export const siteOrigin = SITE_ORIGIN;
export const nowDate = new Date().toISOString().slice(0, 10);
export const COOKIE_CONSENT_VERSION = '20261016a';
export const changedFiles = new Set();
export const isRtl = locale => RTL_LANGUAGES.has(locale);
export const normalizeLocalePath = locale => locale.toLowerCase();
export const getBundle = (collection, locale) => collection[locale] || collection.en;
export const getNestedValue = (object, dotted) => dotted.split('.').reduce((value, key) =>
  value && typeof value === 'object' && key in value ? value[key] : undefined, object);

// Required copy shape excludes explicitly optional messages on both sides.
const OPTIONAL_COPY_KEYS = new Set(['hero.statement', 'footer.taglineLines', 'platform.subscriptionNote', 'why.pointsNote',
  ...[0, 1, 2].map(index => `automation.points.${index}.icon`)]);
export function validateCopyShape(reference, candidate, pathSegments = []) {
  const location = pathSegments.join('.') || 'homepage copy';
  if (Array.isArray(reference)) {
    if (!Array.isArray(candidate) || candidate.length !== reference.length) throw Error(`${location} must contain exactly ${reference.length} items`);
    reference.forEach((item, index) => validateCopyShape(item, candidate[index], [...pathSegments, String(index)]));
  } else if (reference && typeof reference === 'object') {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw Error(`${location} must be an object`);
    const optional = key => OPTIONAL_COPY_KEYS.has([...pathSegments, key].join('.'));
    const expected = Object.keys(reference).filter(key => !optional(key));
    const received = Object.keys(candidate).filter(key => !optional(key));
    if (expected.length !== received.length || expected.some(key => !received.includes(key))) throw Error(`${location} must have keys: ${expected.join(', ')}`);
    for (const key of expected) validateCopyShape(reference[key], candidate[key], [...pathSegments, key]);
    for (const key of Object.keys(candidate)) if (optional(key) && key in reference) validateCopyShape(reference[key], candidate[key], [...pathSegments, key]);
  } else if (typeof reference !== typeof candidate || typeof candidate === 'string' && !candidate.trim()) {
    throw Error(`${location} must be a non-empty ${typeof reference}`);
  }
}
export async function loadHomeCopy(options) {
  const copies = {};
  for (const { code } of options) copies[code] = (await import(pathToFileURL(path.join(repoRoot, 'scripts/homepage-copy', `${code}.mjs`)).href)).default;
  for (const { code } of options) {
    try { validateCopyShape(copies.en, copies[code]); }
    catch (error) { throw Error(`Invalid homepage copy for ${code}: ${error.message}`); }
  }
  // Account actions must be translated even when the destination uses English.
  for (const { code } of options) if (code !== 'en') {
    for (const [key, value] of Object.entries(copies[code].navigation.account)) {
      if (value.trim().toLowerCase() === copies.en.navigation.account[key].trim().toLowerCase()) throw Error(`Invalid homepage copy for ${code}: navigation.account.${key} is still English ("${value}")`);
    }
  }
  return copies;
}
export async function readWindowGlobal(file, property) {
  const context = { window: {} };
  vm.runInNewContext(await fs.readFile(path.join(repoRoot, 'js', file), 'utf8'), context);
  return context.window[property];
}

// Derive public paths and relative asset depth from the same literal segments.
export function getOutputSegments(locale, pageKey = 'home') {
  return [...(locale === defaultLocale ? [] : [normalizeLocalePath(locale)]), ...(pageKey === 'home' ? [] : pageKey.split('/'))];
}
export function buildPagePath(locale, pageKey = 'home') {
  const parts = getOutputSegments(locale, pageKey);
  return parts.length ? `/${parts.join('/')}/` : '/';
}
export const buildPageUrl = (locale, key = 'home') => siteOrigin + buildPagePath(locale, key);
export const buildOutputFilePath = (locale, key = 'home') => path.join(repoRoot, ...getOutputSegments(locale, key), 'index.html');
export function buildAssetPrefix(locale, pageKey = 'home') {
  return '../'.repeat(getOutputSegments(locale, pageKey).length);
}
export function toStaticAssetPath(assetPath, assetPrefix) {
  if (!assetPath || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(assetPath)) return assetPath;
  let relative = assetPath.replace(/^\/+/, '');
  while (relative.startsWith('../')) relative = relative.slice(3);
  if (relative.startsWith('./')) relative = relative.slice(2);
  return assetPrefix + relative;
}
export function rewriteStaticAssets($, locale, key) {
  const prefix = buildAssetPrefix(locale, key);
  for (const [selector, attribute] of [['script[src], img[src], source[src]', 'src'], ['video[poster]', 'poster'], ['link[href]', 'href']]) {
    $(selector).each((_, node) => {
      const element = $(node), value = element.attr(attribute);
      if (!value || attribute === 'href' && ['canonical', 'alternate', 'preconnect'].includes((element.attr('rel') || '').toLowerCase())) return;
      element.attr(attribute, toStaticAssetPath(value, prefix));
    });
  }
}
export function removeScripts($, fragments) {
  $('script[src]').each((_, node) => { if (fragments.some(fragment => ($(node).attr('src') || '').includes(fragment))) $(node).remove(); });
}
export function appendScripts($, files, anchorSelector, locale, key) {
  const anchor = $(anchorSelector).first();
  if (!anchor.length) return;
  for (const file of files) anchor.before(`\n  <script src="${toStaticAssetPath(file, buildAssetPrefix(locale, key))}" defer></script>`);
}
export function alternatesFor(options, key) {
  return options.length ? [{ hreflang: 'x-default', href: buildPageUrl('en', key) }, ...options.map(({ code }) => ({ hreflang: hreflangCode(code), href: buildPageUrl(code, key), locale: code }))] : [];
}

// Expand only the authoring protocol's complete placeholder lines; cache reads.
const partialCache = new Map();
const partialPaths = Object.fromEntries(['site-header', 'site-footer', 'accessibility-widget'].map(name => [name, path.join(repoRoot, 'templates/partials', `${name}.template.html`)]));
export async function readPartial(name) {
  if (partialCache.has(name)) return partialCache.get(name);
  if (!partialPaths[name]) throw Error(`Unknown template partial "${name}"`);
  const content = (await fs.readFile(partialPaths[name], 'utf8')).replace(/^\uFEFF/, '').replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();
  if (!content) throw Error(`Template partial "${name}" is empty`);
  partialCache.set(name, content);
  return content;
}
export async function injectPartials(source, filePath) {
  const marker = /^([ \t]*)<div data-partial="([a-z-]+)"><\/div>[ \t]*$/gm;
  const names = [...source.matchAll(marker)].map(match => match[2]);
  if (!names.length) return source;
  const loaded = new Map();
  for (const name of new Set(names)) loaded.set(name, await readPartial(name));
  return source.replace(marker, (_, indent, name) => {
    if (!loaded.get(name)) throw Error(`Missing partial "${name}" required by ${filePath}`);
    return loaded.get(name).split('\n').map(line => line.trim() ? indent + line : line).join('\n');
  });
}
export async function readHtmlTemplate(filename) {
  return injectPartials((await fs.readFile(filename, 'utf8')).replace(/^\uFEFF/, ''), filename);
}

// Localized text preserves the established direction-mark and line-break policy.
export function formatTextForLocaleDirection(text, locale) {
  if (typeof text !== 'string' || !isRtl(locale)) return text;
  const end = text.trimEnd();
  return end && !/[\u200e\u200f]$/.test(end) && /[?!:;.,]$/.test(end) ? text + '\u200f' : text;
}
export function setLocalizedText($, target, value, locale) {
  (typeof target === 'string' ? $(target) : target).attr('dir', isRtl(locale) ? 'rtl' : 'ltr').text(formatTextForLocaleDirection(value, locale));
}
export function setLocalizedLines($, selector, lines, locale) {
  const element = $(selector).attr('dir', isRtl(locale) ? 'rtl' : 'ltr').empty();
  lines.forEach((line, index) => { if (index) element.append('<br>'); element.append(formatTextForLocaleDirection(line, locale)); });
}
export function setBodyDirection($, locale) {
  $('html').attr({ lang: locale, dir: isRtl(locale) ? 'rtl' : 'ltr' });
  if (isRtl(locale)) $('body').addClass('rtl'); else $('body').removeClass('rtl');
}
export function applyDataI18nTranslations($, copy, locale) {
  $('[data-i18n]').each((_, node) => {
    const key = $(node).attr('data-i18n'), value = key ? getNestedValue(copy, key) : undefined;
    if (typeof value === 'string') setLocalizedText($, $(node), value, locale);
  });
}
export function updateFooterStaticUi($, locale, footer) {
  $('.site-footer, .contact-options, .contact-options__header').attr('dir', isRtl(locale) ? 'rtl' : 'ltr');
  const text = (target, value) => { if (typeof value === 'string') setLocalizedText($, target, value, locale); };
  if (Array.isArray(footer.taglineLines)) setLocalizedLines($, '.site-footer__brand-copy', footer.taglineLines, locale);
  else if (typeof footer.tagline === 'string' && footer.tagline.includes('\n')) setLocalizedLines($, '.site-footer__brand-copy', footer.tagline.split('\n'), locale);
  else text('.site-footer__brand-copy', footer.tagline);
  [footer.legalTitle, footer.appSupportTitle, footer.socialTitle].forEach((value, index) => { const heading = $('.site-footer__heading').eq(index); if (heading.length) text(heading, value); });
  [footer.terms, footer.privacy, footer.cookies].forEach((value, index) => text(`.site-footer__link:nth-child(${index + 1})`, value));
  text('.site-footer__copy', `© 2026 ${footer.copyright || 'WIFIGATE · EATS SYSTEMS TECH. All rights reserved.'}`);
}
export function rewriteFooterLegalLinks($, locale) {
  for (const key of ['terms-and-conditions', 'privacy-policy', 'cookies', 'accessibility']) $('.site-footer__link[href*=\'' + key + '/\']').attr('href', buildPagePath(locale, key));
  $('.site-footer__link[href*=\'accessibility/\']').text(accessibilityLinkLabels[locale] || accessibilityLinkLabels.en);
}
export function updateAccessibilityMarkup($, copy, locale) {
  const slots = { '.skip-link': copy.skipLink, '#a11y-eyebrow': copy.eyebrow, '#a11y-title': copy.title, '#a11y-description': copy.description, '#a11y-status': copy.statusDefault, '#a11y-reset': copy.reset, '#a11y-text-size-title': copy.textSize.label, '#a11y-text-size-description': copy.textSize.description, '#a11y-statement': copy.statementLink };
  for (const [selector, value] of Object.entries(slots)) $(selector).text(value);
  for (const [selector, value] of [['#a11y-fab', copy.openButton], ['#a11y-text-smaller', copy.textSize.decrease], ['#a11y-text-larger', copy.textSize.increase]]) $(selector).attr({ 'aria-label': value, title: value });
  $('#a11y-close').attr('aria-label', copy.closeButton);
  $('#a11y-statement').attr('href', buildPagePath(locale, 'accessibility'));
  $('.a11y-option').each((_, node) => {
    const key = $(node).attr('data-a11y-setting'), option = key ? copy.options[key] : null;
    if (!option) throw Error(`${locale}: no accessibility copy for ${key}`);
    $(node).find('.a11y-option__title').text(option.label);
    $(node).find('.a11y-option__description').text(option.description);
  });
}

// Construct real navigation nodes in canonical order with the current page URLs.
function setLanguageSelector($, options, locale, key) {
  const current = options.find(option => option.code === locale) || options[0], prefix = buildAssetPrefix(locale, key);
  $('#language-button').attr({ 'aria-controls': 'language-dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' });
  $('#selected-flag').html(`<img src="${toStaticAssetPath(`assets/img/flags/${current.flagSrc}`, prefix)}" alt="${current.flagAlt}" width="50" height="33" />`);
  $('.language-selector__selected').text(current.label);
  $('#language-dropdown').html(options.map(option => `<a class="language-selector__option${option.code === locale ? ' is-selected' : ''}" href="${buildPagePath(option.code, key)}" data-lang="${option.code}"${option.code === locale ? ' aria-current="true"' : ''}><span class="language-selector__flag"><img src="${toStaticAssetPath(`assets/img/flags/${option.flagSrc}`, prefix)}" alt="${option.flagAlt}" width="50" height="33" loading="lazy" decoding="async"></span><span class="language-selector__label" dir="${isRtl(option.code) ? 'rtl' : 'auto'}">${option.label}</span></a>`).join(''));
}
export function updateSharedHeader($, data, locale, key) {
  if (!$('.site-header').length) return;
  const copy = data.homepageCopies[locale].navigation, home = buildPagePath(locale), prefix = buildAssetPrefix(locale, key);
  const menu = $('.topbar-nav').empty();
  for (const item of SITE_NAVIGATION) {
    const link = $('<a>').addClass('nav-link nav__link').attr('href', item.pageKey ? buildPagePath(locale, item.pageKey) : home + '#' + item.hash);
    if (item.key === 'contact') link.addClass('nav__contact-link');
    setLocalizedText($, link, item.key === 'shop' ? locale === 'he' ? 'חנות' : 'Shop' : copy[item.key], locale);
    if (item.key === 'shop' && locale !== 'he') link.attr('lang', 'en');
    menu.append(link);
  }
  $('.nav').attr('aria-label', copy.ariaLabel);
  $('.nav__logo-link').attr({ href: home + '#home', 'aria-label': 'WIFIGATE' });
  $('.nav__toggle').attr('aria-label', copy.toggleLabel);
  const login = SITE_LOGIN_LABELS[locale];
  if (!login) throw Error(`No header login label for ${locale}`);
  setLocalizedText($, $('.site-login__label'), login, locale);
  $('.site-login__trigger').attr({ href: buildPagePath(locale, 'login'), 'aria-label': login });
  $('#language-button').attr('aria-label', copy.selectLanguageLabel);
  setLanguageSelector($, data.localeOptions, locale, key);
  // Existing account/cart copy and destinations are display facts, not new policy.
  const account = copy.account;
  $('#account-button').attr('aria-label', account.menu);
  $('.site-account__identity, .site-account__menu').attr('dir', isRtl(locale) ? 'rtl' : 'ltr');
  for (const [selector, value] of [['.site-account__label', account.signedInAs], ['[data-account-dashboard]', account.dashboard], ['[data-account-sign-out]', account.signOut]]) setLocalizedText($, $(selector), value, locale);
  $('[data-account-dashboard]').attr('href', locale === 'he' ? '/dashboard/?lang=he' : '/dashboard/');
  const hebrew = locale === 'he';
  const cart = hebrew ? ['סל קניות', 'סל הקניות', 'סגירת סל הקניות', 'סל הקניות ריק כרגע.', 'סכום ביניים משוער', 'התשלום יהיה זמין בקרוב', 'הקנייה באתר תהיה זמינה בקרוב.'] : ['Shopping cart', 'Your cart', 'Close cart', 'Your cart is empty.', 'Estimated subtotal', 'Checkout coming soon', 'Online shopping will be available soon.'];
  $('.site-cart__trigger').attr('aria-label', cart[0]);
  $('#site-cart-title').text(cart[1]); $('.site-cart__close').attr('aria-label', cart[2]);
  ['.site-cart__empty', '.site-cart__subtotal span', '.site-cart__checkout', '.site-cart__note'].forEach((selector, index) => $(selector).text(cart[index + 3]));
  $('.site-cart__drawer').attr('data-cart-copy', JSON.stringify({ trigger: cart[0], remove: hebrew ? 'הסרת פריט' : 'Remove item', decrease: hebrew ? 'הפחתת כמות' : 'Decrease quantity', increase: hebrew ? 'הגדלת כמות' : 'Increase quantity' }));
  if (!hebrew) $('.site-cart__drawer').attr('lang', 'en');
  $('head').append(`<link rel="stylesheet" href="${prefix}css/site-header.css?v=20261022a"><link rel="stylesheet" href="${prefix}css/site-cart.css?v=20261020b">`);
  $("script[src*='js/site-account.js']").remove();
  $("script[src*='js/navigation.js']").attr('src', prefix + 'js/navigation.js?v=20261022outside1').after(`\n  <script src="${prefix}js/site-account.js?v=20261022day1" defer></script>`);
  $('body').append(`<script src="${prefix}js/site-cart.js?v=20261016a" defer></script>`);
}

// Both executable and JSON-only data scripts use the identical safe boundary.
function inlineJson(value) {
  return serializeScriptData(value);
}
export function insertPageDataScript($, scriptId, data, anchorSelector) {
  $(`#${scriptId}`).remove();
  $(anchorSelector).before(`\n  <script id="${scriptId}" type="application/json">${serializeScriptData(data)}</script>`);
}
export function ensureTrailingNewline(source) {
  return source.endsWith('\n') ? source : source + '\n';
}
export function serialize($, data, locale, key = 'home') {
  updateSharedHeader($, data, locale, key);
  const prefix = buildAssetPrefix(locale, key);
  applyMediaWatermarks($, { assetPrefix: prefix });
  const label = data.cookieCopy[locale].reopen;
  $('.cookie-settings-trigger').text(label).attr({ 'aria-label': label, dir: isRtl(locale) ? 'rtl' : 'ltr' });
  $('head').append(`<link rel="stylesheet" href="${prefix}css/cookie-consent.css?v=${COOKIE_CONSENT_VERSION}">`);
  $('body').append(`<script>window.WIFIGATE_COOKIE_COPY = ${inlineJson({ [locale]: data.cookieCopy[locale] })};</script>`);
  $("script[src*='js/accessibility-copy.js']").replaceWith(`<script>window.accessibilityCopy = ${inlineJson({ [locale]: data.accessibilityCopy[locale] })};</script>`);
  const version = key === HOST_PAGE_KEY ? '20261018host1' : key === AUTO_OPEN_PAGE_KEY ? '20261018ao1' : COOKIE_CONSENT_VERSION;
  $('body').append(`<script src="${prefix}js/cookie-consent.js?v=${version}" defer></script>`);
  return ensureTrailingNewline($.html({ decodeEntities: false }).replace(/[ \t]+(?=\r?\n|$)/g, ''));
}
