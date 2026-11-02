import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as cheerio from 'cheerio';
import { repoRoot, defaultLocale, siteOrigin, nowDate, changedFiles, COOKIE_CONSENT_VERSION, getBundle, getNestedValue, loadHomeCopy, readWindowGlobal, readHtmlTemplate, buildPagePath, buildPageUrl, buildOutputFilePath, buildAssetPrefix, rewriteStaticAssets, removeScripts, appendScripts, alternatesFor, applyDataI18nTranslations, setBodyDirection, updateFooterStaticUi, rewriteFooterLegalLinks, updateAccessibilityMarkup, insertPageDataScript, serialize } from './localized-builder-document.mjs';
import { getNichePageContent, getNicheChrome, buildNicheContext, applyHomepageCopy, updateHomeStaticUi, updateHomeWhereLinks, fillUseCaseBody, fillLandingSections } from './localized-builder-content.mjs';
import { SITE_LANGUAGES } from './site-languages.mjs';
import { NICHE_DEFINITIONS, validateNichePageLocales } from './niche-pages/index.mjs';
import { LANDING_PAGES, LANDING_PAGE_LOCALES, validateLandingPageLocales } from './landing-pages/index.mjs';
import { AUTO_OPEN_PAGE_KEY, getAutoOpenPageContent, validateAutoOpenPageLocales } from './auto-open-page.mjs';
import { HOST_PAGE_KEY, getHostPageContent, installHomeHostPointShells, installHostDetailShells, appendHostMarketingDetails } from './host-marketing-page.mjs';
import { installHomeFeatureCards } from './homepage-feature-grid.mjs';
import { LEGAL_PAGES, legalBundles, renderLegalMain } from './legal/legal-pages.mjs';
import { wifigateLinkLocales } from './wifigate-link-locales.mjs';
import { SHOP_PAGE_KEYS, getShopPageContent } from './shop-pages.mjs';
import { BRAND_ID, ORGANIZATION_ID, SHARE_IMAGE, setPageMeta, webPageNode, breadcrumbNode, faqNode } from './seo.mjs';
import { readSceneManifest, applyHomeSceneMedia, applyNicheSceneMedia } from './scene-media.mjs';
import { rewriteNicheHomeAnchors } from "./niche-links.mjs";
import { circularNiches, setNichePager, installUseCasePagerShells } from "./niche-navigation.mjs";
import { publishNicheVariant } from "./niche-publication.mjs";
import { buildRedirectPage } from "./redirect-page.mjs";
import { previousSitemapDates, sitemapDocument } from "./sitemap.mjs";
import { buildLlmsTxt } from './llms-txt.mjs';
import { buildNotFoundPage } from './not-found-page.mjs';
import { buildLoginPages } from './login-pages.mjs';

// The CLI coordinates immutable content renderers; it never publishes a website.
const template = name => path.join(repoRoot, 'templates', `${name}.template.html`);
const nicheTemplatePath = template('niche');
const guestInvitesTemplatePath = template('guest-invites-api');
const guestInvitesPageKey = HOST_PAGE_KEY;
const nicheRuntimeScriptsToAdd = ['/js/language-selector.js?v=20261006a'];
const hostPageCopyCache = new Map();

// Metadata remains delegated to the existing canonical graph implementation.
function setHomeMeta($, locale, localeOptions, copy) {
  const home = getNichePageContent(locale).home, url = buildPageUrl(locale);
  const keywords = home.keywords || getNichePageContent('en').home.keywords;
  $("meta[name='keywords']").remove();
  if (keywords) $('head').append(`\n  <meta name="keywords" content="${keywords}" />`);
  setPageMeta($, { locale, url, title: home.seoTitle, description: home.seoDescription, alternates: alternatesFor(localeOptions, 'home'), image: SHARE_IMAGE,
    brand: { description: home.seoDescription, slogan: copy.footer.tagline },
    graph: [webPageNode({ url, title: home.seoTitle, description: home.seoDescription, locale, image: SHARE_IMAGE }), faqNode(url, locale, copy.faq.items)] });
}
function setLegalMeta($, locale, key, localeOptions, bundle) {
  const metadata = bundle.legal?.metaTags || {}, title = metadata.title || 'WIFIGATE', description = metadata.description || '', url = buildPageUrl(locale, key);
  setPageMeta($, { locale, url, title, description, robots: 'index, follow',
    alternates: ['en', 'he'].includes(locale) ? alternatesFor(localeOptions.filter(item => ['en', 'he'].includes(item.code)), key) : [],
    ogType: 'article', image: SHARE_IMAGE, graph: [webPageNode({ type: 'WebPage', url, title, description, locale })] });
}
function setUseCaseMeta($, { pageKey, content, chrome, image: pageImage, locale, localeOptions, published, modified, about, mentions, service }) {
  const url = buildPageUrl(locale, pageKey), image = { url: `${siteOrigin}/${pageImage.og}`, width: pageImage.ogWidth || 1200, height: pageImage.ogHeight || 630, alt: content.imageAlt };
  const breadcrumb = breadcrumbNode(url, [{ name: chrome.homeLabel, url: buildPageUrl(locale) }, { name: content.label, url }]);
  setPageMeta($, { locale, url, title: content.seoTitle, description: content.seoDescription, alternates: alternatesFor(localeOptions, pageKey), ogType: 'article', published, modified, image,
    graph: [webPageNode({ url, title: content.seoTitle, description: content.seoDescription, locale, image, breadcrumbId: breadcrumb['@id'], about, mentions, datePublished: published, dateModified: modified }), breadcrumb,
      ...(content.faq.length ? [faqNode(url, locale, content.faq)] : []), ...(service ? [service] : [])] });
}

// Preserve ordered link mutations and their failure boundaries for existing copy.
function rewriteLegalInternalLinks($, locale, pageKey) {
  const home = buildPagePath(locale, 'home');
  $("a[href='../index.html']").attr('href', home);
  rewriteNicheHomeAnchors($, home);
  rewriteFooterLegalLinks($, locale);
  for (const key of ['terms-and-conditions', 'privacy-policy', 'cookies']) $(`a[href='../${key}/']`).attr('href', buildPagePath(locale, key));
  $('.btn.btn--ghost').each((_, node) => { if ($(node).attr('href') === '../index.html') $(node).attr('href', buildPagePath(locale, 'home')); });
}
function rewriteNicheInternalLinks($, locale) {
  const home = buildPagePath(locale, 'home');
  rewriteNicheHomeAnchors($, home);
  rewriteFooterLegalLinks($, locale);
  $('a[href]').each((_, node) => { if ($(node).attr('href') === buildPagePath(locale, 'automation')) $(node).attr('href', buildPagePath(locale, HOST_PAGE_KEY)); });
}
function getCircularAdjacentNiches(currentKey) {
  return circularNiches(NICHE_DEFINITIONS, currentKey);
}
function setUseCaseNavigation($, { chrome, content }) {
  $('#niche-breadcrumb-home').text(chrome.homeLabel);
  $('#niche-breadcrumb-current').text(content.label);
}
function updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle) {
  const { chrome, content } = ctx;
  const localeNicheContent = getNichePageContent(locale), defaultNicheContent = getNichePageContent(defaultLocale);
  fillUseCaseBody($, { chrome, content, image: niche.image, locale, pageKey: niche.key, accessibilityBundle });
  setUseCaseNavigation($, { chrome, content });
  setNichePager($, getCircularAdjacentNiches(niche.key), { localeNicheContent, defaultNicheContent, locale, buildPagePath });
}
function prepareUseCaseShell($, locale, pageKey, bodyClass = '') {
  setBodyDirection($, locale);
  if (bodyClass) $('body').addClass(bodyClass);
  rewriteStaticAssets($, locale, pageKey);
  appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/accessibility.js']", locale, pageKey);
  installUseCasePagerShells($);
}

// Writes retain LF-equivalence, changed-path evidence and bounded Windows retries.
async function writeOutputFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const old = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (old !== null && old.replace(/\r\n/g, '\n') === content.replace(/\r\n/g, '\n')) return;
  changedFiles.add(path.resolve(filePath));
  for (let attempt = 0; attempt < 5; attempt++) {
    try { await fs.writeFile(filePath, content, 'utf8'); return; }
    catch (error) {
      if (attempt === 4 || !['EACCES', 'EBUSY', 'EPERM', 'UNKNOWN'].includes(error?.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
}
async function readPreviousLastmods() {
  const previous = await fs.readFile(path.join(repoRoot, 'sitemap.xml'), 'utf8').catch(() => '');
  return previousSitemapDates(previous);
}
function buildSitemap(urlEntries, previousLastmods) {
  return sitemapDocument(urlEntries, previousLastmods, { repoRoot, changedFiles, nowDate });
}

// Home translations run after their feature shells and before scene/SEO assembly.
async function buildHomePages(homeData) {
  const source = await readHtmlTemplate(template('index')), entries = [];
  for (const { code: locale } of homeData.localeOptions) {
    const $ = cheerio.load(source, { decodeEntities: false }), copy = homeData.homepageCopies[locale];
    installHomeFeatureCards($); installHomeHostPointShells($);
    setBodyDirection($, locale); rewriteStaticAssets($, locale, 'home');
    removeScripts($, ['js/language-selector.js']); appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/main.js']", locale, 'home');
    updateFooterStaticUi($, locale, copy.footer); updateHomeStaticUi($, copy, getBundle(homeData.accessibilityCopy, locale), locale);
    rewriteFooterLegalLinks($, locale); updateHomeWhereLinks($, locale); applyHomepageCopy($, copy, locale);
    const card = $('.feature-card--auto-open'), title = card.find('.feature-card__title');
    card.find('.feature-card__media').wrap($('<a>').attr({ href: buildPagePath(locale, AUTO_OPEN_PAGE_KEY), 'aria-label': title.text() }));
    title.wrapInner($('<a>').attr('href', buildPagePath(locale, AUTO_OPEN_PAGE_KEY)));
    applyHomeSceneMedia($, { scene: homeData.sceneMedia.get('homepage-montage'), hotelScene: homeData.sceneMedia.get('hotels-airbnb'), assetPrefix: buildAssetPrefix(locale, 'home'), copy: copy.hero.media });
    $('.guest-invites__cta').attr('href', buildPagePath(locale, guestInvitesPageKey));
    const main = $('#main-content');
    for (const id of ['home', 'advantages', 'private-access', 'where', 'guest-invites-api', 'tutorials', 'one-tap-invite', 'wifi-gate-faq', 'why-wifigate', 'system-overview', 'contact']) {
      const section = main.children('#' + id); if (section.length) main.append(section);
    }
    setHomeMeta($, locale, homeData.localeOptions, copy);
    insertPageDataScript($, 'hero-locale-data', { media: copy.hero.media }, "script[src*='js/main.js']");
    await writeOutputFile(buildOutputFilePath(locale), serialize($, homeData, locale));
    entries.push({ loc: buildPageUrl(locale), changefreq: 'monthly', priority: '1.0' });
  }
  return entries;
}

// Legal bodies retain the explicit English governing-language presentation.
function applyLegalContentLanguage($, bundle, locale) {
  const legal = bundle.legal || {}, note = $('[data-i18n="legal.hero.languageNote"]');
  if (!legal.hero?.languageNote) note.remove(); else note.attr('lang', locale).attr('role', 'note');
  if (legal.contentLang !== 'en') return;
  $('[data-i18n^="legal.s."], [data-i18n^="legal.company."], [data-i18n="legal.contents"], [data-i18n^="legal.hero."]').each((_, node) => {
    const key = $(node).attr('data-i18n');
    if (['legal.hero.languageNote', 'legal.hero.eyebrow'].includes(key)) return;
    const value = getNestedValue(bundle, key);
    if (typeof value === 'string') $(node).attr('lang', 'en').attr('dir', 'ltr').text(value);
  });
  $('.legal-card .legal-company, .legal-card .legal-toc, .legal-card .legal-section').attr('lang', 'en').attr('dir', 'ltr');
}
async function buildLegalPages(homeData, legalCollections) {
  const shell = await readHtmlTemplate(template('legal'));
  for (const key of LEGAL_PAGES) {
    const markup = shell.replace('  <main class="legal-main" id="main-content"></main>', renderLegalMain(key));
    for (const { code: locale } of homeData.localeOptions) {
      const $ = cheerio.load(markup, { decodeEntities: false }), bundle = legalCollections[key][locale];
      setBodyDirection($, locale); rewriteStaticAssets($, locale, key); appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/legal-page.js']", locale, key);
      applyDataI18nTranslations($, bundle, locale); applyLegalContentLanguage($, bundle, locale);
      updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); updateAccessibilityMarkup($, getBundle(homeData.accessibilityCopy, locale), locale);
      rewriteLegalInternalLinks($, locale, key); setLegalMeta($, locale, key, homeData.localeOptions, bundle);
      await writeOutputFile(buildOutputFilePath(locale, key), serialize($, homeData, locale, key));
    }
  }
  return LEGAL_PAGES.flatMap(key => homeData.localeOptions.map(({ code }) => ({ loc: buildPageUrl(code, key), changefreq: 'yearly', priority: '0.3' })));
}

// Utilities keep their existing copy JSON, metadata and exclusion from sitemap.
async function buildUtilityPages(homeData) {
  const source = await readHtmlTemplate(template('wifigate-link'));
  for (const { code: locale } of homeData.localeOptions) {
    const copy = wifigateLinkLocales[locale] || wifigateLinkLocales.en;
    for (const key of ['wifigate-link', 'wifigate-api']) {
      const $ = cheerio.load(source, { decodeEntities: false });
      setBodyDirection($, locale); rewriteStaticAssets($, locale, key);
      for (const [selector, value] of [['#page-title', copy.heading], ['#status', copy.statusOpening], ['#open-app', copy.openButton], ['#copy-link', copy.copyButton]]) $(selector).text(value);
      $('#wifigate-link-copy').text(JSON.stringify({ headingFallback: copy.headingFallback || copy.openButton, headingMissing: copy.headingMissing || copy.openButton, statusMissing: copy.statusMissing, statusFallback: copy.statusFallback, copyButton: copy.copyButton, copiedButton: copy.copiedButton, copyError: copy.copyError || wifigateLinkLocales.en.copyError }));
      const url = buildPageUrl(locale, key), title = copy.socialTitle || copy.pageTitle;
      setPageMeta($, { locale, url, title, description: copy.description, robots: 'noindex, follow', image: SHARE_IMAGE, graph: [webPageNode({ url, title, description: copy.description, locale })] });
      await writeOutputFile(buildOutputFilePath(locale, key), serialize($, homeData, locale, key));
    }
  }
  return [];
}

// Canonical niche publication awaits each alias before the next locale begins.
async function buildNichePages(homeData) {
  const source = await readHtmlTemplate(nicheTemplatePath), entries = [];
  for (const niche of NICHE_DEFINITIONS) for (const { code: locale } of homeData.localeOptions) {
    const ctx = buildNicheContext(homeData, niche, locale), accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const $ = cheerio.load(source, { decodeEntities: false });
    prepareUseCaseShell($, locale, niche.key); updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle);
    applyNicheSceneMedia($, { scene: homeData.sceneMedia.get(niche.key === 'electric-gates' ? 'electric-gates-barrier' : niche.key), assetPrefix: buildAssetPrefix(locale, niche.key), copy: homeData.homepageCopies[locale].hero.media });
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: niche.key, content: ctx.content, chrome: ctx.chrome, image: niche.image, locale, localeOptions: homeData.localeOptions });
    await publishNicheVariant({ locale, pageKey: niche.key, render: () => serialize($, homeData, locale, niche.key), legacyKeys: () => niche.legacyKeys || [] }, { buildOutputFilePath, writeOutputFile, buildPagePath, buildPageUrl, buildRedirectPage });
    entries.push({ loc: buildPageUrl(locale, niche.key), changefreq: 'monthly', priority: '0.8' });
  }
  return entries;
}

// Landing and Auto Open preserve their page-specific additions to the same shell.
async function buildLandingPages(homeData) {
  const source = await readHtmlTemplate(nicheTemplatePath), entries = [];
  for (const { key, image, published, modified, about, mentions } of LANDING_PAGES) for (const { code: locale } of homeData.localeOptions) {
    const chrome = getNicheChrome(locale), content = LANDING_PAGE_LOCALES[locale][key], $ = cheerio.load(source, { decodeEntities: false });
    prepareUseCaseShell($, locale, key);
    $("link[href*='css/niche.css']").after(`\n  <link rel="stylesheet" href="${buildAssetPrefix(locale, key)}css/landing.css?v=20261016a" />`);
    fillUseCaseBody($, { chrome, content, image, locale, pageKey: key, accessibilityBundle: getBundle(homeData.accessibilityCopy, locale) });
    fillLandingSections($, { content, locale, modified }); setUseCaseNavigation($, { chrome, content }); $('.niche-hero__pager').remove();
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: key, content, chrome, image, locale, localeOptions: homeData.localeOptions, published, modified,
      about: [{ '@type': 'Thing', name: content.aboutName, sameAs: about }], mentions: [{ '@type': 'Thing', name: content.mentionsName, sameAs: mentions }] });
    await writeOutputFile(buildOutputFilePath(locale, key), serialize($, homeData, locale, key));
    entries.push({ loc: buildPageUrl(locale, key), lastmod: modified, changefreq: 'monthly', priority: '0.8' });
  }
  return entries;
}
async function buildAutoOpenPages(homeData) {
  const source = await readHtmlTemplate(nicheTemplatePath), scene = homeData.sceneMedia.get('auto-open-futuristic'), entries = [];
  if (!scene) throw Error('Accepted Auto Open scene is required');
  const image = { hero: scene.poster.path, og: scene.poster.path, heroWidth: scene.width, heroHeight: scene.height, ogWidth: scene.width, ogHeight: scene.height };
  for (const { code: locale } of homeData.localeOptions) {
    const content = getAutoOpenPageContent(locale, homeData.homepageCopies[locale]), chrome = getNicheChrome(locale), $ = cheerio.load(source, { decodeEntities: false });
    prepareUseCaseShell($, locale, AUTO_OPEN_PAGE_KEY, 'auto-open-page');
    fillUseCaseBody($, { chrome, content, image, locale, pageKey: AUTO_OPEN_PAGE_KEY, accessibilityBundle: getBundle(homeData.accessibilityCopy, locale) });
    $('#niche-faq, #niche-prev-link, #niche-next-link').remove(); $("script[src*='js/faq.js'], link[href*='css/faq.css']").remove();
    setUseCaseNavigation($, { chrome, content });
    applyNicheSceneMedia($, { scene, assetPrefix: buildAssetPrefix(locale, AUTO_OPEN_PAGE_KEY), copy: homeData.homepageCopies[locale].hero.media });
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: AUTO_OPEN_PAGE_KEY, content, chrome, image, locale, localeOptions: homeData.localeOptions });
    await writeOutputFile(buildOutputFilePath(locale, AUTO_OPEN_PAGE_KEY), serialize($, homeData, locale, AUTO_OPEN_PAGE_KEY));
    entries.push({ loc: buildPageUrl(locale, AUTO_OPEN_PAGE_KEY), changefreq: 'monthly', priority: '0.8' });
  }
  return entries;
}

// Optional Host files are cached; missing locales retain the English fallback.
async function loadHostPageCopy(locale) {
  if (!hostPageCopyCache.has(locale)) {
    const filename = path.join(repoRoot, 'scripts/host-page-copy', locale + '.mjs');
    hostPageCopyCache.set(locale, await fs.access(filename).then(() => import(pathToFileURL(filename).href).then(module => module.default), () => null));
  }
  return hostPageCopyCache.get(locale) || loadHostPageCopy(defaultLocale);
}
async function buildGuestInvitesPages(homeData) {
  const source = await readHtmlTemplate(nicheTemplatePath), details = await readHtmlTemplate(guestInvitesTemplatePath);
  const scene = homeData.sceneMedia.get('hotels-airbnb');
  if (!scene) throw Error('Accepted hospitality media is required for WIFIGATE Host');
  const image = { hero: scene.poster.path, og: scene.poster.path, heroWidth: scene.width, heroHeight: scene.height, ogWidth: scene.width, ogHeight: scene.height }, entries = [];
  for (const { code: locale } of homeData.localeOptions) {
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale), hostCopy = await loadHostPageCopy(locale);
    const $ = cheerio.load(source, { decodeEntities: false }), legacy = cheerio.load(details, { decodeEntities: false });
    installHostDetailShells(legacy);
    const content = getHostPageContent(hostCopy, homeData.homepageCopies[locale]), chrome = getNicheChrome(locale);
    prepareUseCaseShell($, locale, guestInvitesPageKey, 'wifigate-host-page');
    fillUseCaseBody($, { chrome, content, image, locale, pageKey: guestInvitesPageKey, accessibilityBundle });
    $('#niche-faq, #niche-prev-link, #niche-next-link').remove(); $("script[src*='js/faq.js'], link[href*='css/faq.css']").remove();
    setUseCaseNavigation($, { chrome, content });
    applyNicheSceneMedia($, { scene, assetPrefix: buildAssetPrefix(locale, guestInvitesPageKey), copy: homeData.homepageCopies[locale].hero.media });
    rewriteStaticAssets(legacy, locale, guestInvitesPageKey);
    applyDataI18nTranslations(legacy, { nav: { home: chrome.homeLabel }, guestInvites: { marketing: hostCopy.marketing } }, locale);
    appendHostMarketingDetails($, { legacyTemplate: legacy });
    $("link[href*='css/niche.css']").after(`<link rel="stylesheet" href="${buildAssetPrefix(locale, guestInvitesPageKey)}css/automation.css?v=20261007c" />`);
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: guestInvitesPageKey, content, chrome, image, locale, localeOptions: homeData.localeOptions,
      service: { '@type': 'Service', '@id': `${siteOrigin}/${HOST_PAGE_KEY}/#service`, name: 'WIFIGATE Host', serviceType: 'Automated guest access for hospitality', provider: { '@id': ORGANIZATION_ID }, brand: { '@id': BRAND_ID }, url: buildPageUrl(defaultLocale, guestInvitesPageKey), description: hostCopy.metaDescription } });
    await publishNicheVariant({ locale, pageKey: guestInvitesPageKey, render: () => serialize($, homeData, locale, guestInvitesPageKey), legacyKeys: () => ['automation', 'Automated-Guest-Invites-API'] }, { buildOutputFilePath, writeOutputFile, buildPagePath, buildPageUrl, buildRedirectPage });
    entries.push({ loc: buildPageUrl(locale, guestInvitesPageKey), changefreq: 'monthly', priority: '0.9' });
  }
  return entries;
}

// Shop preview remains noindex and never contributes a sitemap entry.
async function buildShopPages(homeData) {
  const source = await readHtmlTemplate(template('shop'));
  for (const { code: locale } of homeData.localeOptions) for (const key of SHOP_PAGE_KEYS) {
    const $ = cheerio.load(source, { decodeEntities: false }), content = getShopPageContent(locale, key.startsWith('shop/') ? key.slice(5) : null);
    const direction = content.contentLang === 'he' ? 'rtl' : 'ltr';
    $('.shop-main__content').attr({ lang: content.contentLang, dir: direction }).html(content.main);
    $('.shop-main, .shop-product-detail').attr({ lang: content.contentLang, dir: direction });
    setBodyDirection($, locale); rewriteStaticAssets($, locale, key);
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer); updateAccessibilityMarkup($, getBundle(homeData.accessibilityCopy, locale), locale); rewriteFooterLegalLinks($, locale);
    const url = buildPageUrl(locale, key), crumbs = [{ name: locale === 'he' ? 'בית' : 'Home', url: buildPageUrl(locale) }, { name: locale === 'he' ? 'חנות' : 'Shop', url: buildPageUrl(locale, 'shop') }];
    if (content.product) crumbs.push({ name: content.product.name, url });
    const image = content.product?.image ? { url: siteOrigin + content.product.image, width: 1254, height: 1254, alt: content.product.name } : undefined;
    setPageMeta($, { url, title: content.title, description: content.description, locale, robots: 'noindex, follow', alternates: alternatesFor(homeData.localeOptions, key), image,
      graph: [webPageNode({ url, title: content.title, description: content.description, locale: content.contentLang, image, breadcrumbId: url + '#breadcrumb' }), breadcrumbNode(url, crumbs)] });
    await writeOutputFile(buildOutputFilePath(locale, key), serialize($, homeData, locale, key));
  }
}

// Validate the entire input collection before the first generated document write.
async function main() {
  const legalCollections = Object.fromEntries(LEGAL_PAGES.map(key => [key, Object.fromEntries(Object.entries(legalBundles(key)).map(([locale, legal]) => [locale, { legal }]))]));
  const homeData = { sceneMedia: await readSceneManifest(repoRoot), localeOptions: SITE_LANGUAGES,
    accessibilityCopy: await readWindowGlobal('accessibility-copy.js', 'accessibilityCopy'), homepageCopies: await loadHomeCopy(SITE_LANGUAGES), cookieCopy: await readWindowGlobal('cookie-consent-copy.js', 'WIFIGATE_COOKIE_COPY') };
  for (const { code } of homeData.localeOptions) if (!homeData.cookieCopy?.[code]?.reopen) throw Error(`Missing cookie settings translation for ${code}`);
  const codes = homeData.localeOptions.map(item => item.code), problems = [...validateNichePageLocales(codes), ...validateLandingPageLocales(codes), ...validateAutoOpenPageLocales(codes, homeData.homepageCopies)];
  if (problems.length) throw Error(`Niche page content validation failed (${problems.length} problems):\n  ${problems.join('\n  ')}`);
  const entries = await buildHomePages(homeData);
  if (process.argv.includes('--scene-media-only')) { await buildNichePages(homeData); return; }
  await buildShopPages(homeData);
  entries.push(...await buildLegalPages(homeData, legalCollections), ...await buildNichePages(homeData), ...await buildLandingPages(homeData), ...await buildAutoOpenPages(homeData));
  const englishNiches = () => NICHE_DEFINITIONS.map(niche => ({ key: niche.key, content: getNichePageContent(defaultLocale).niches[niche.key] }));
  const notFound = () => buildNotFoundPage({ niches: englishNiches(), pageUrl: buildPageUrl, cookieConsentVersion: COOKIE_CONSENT_VERSION });
  if (process.argv.includes('--consumer-consent-only')) { await writeOutputFile(path.join(repoRoot, '404.html'), notFound()); return; }
  entries.push(...await buildGuestInvitesPages(homeData), ...await buildUtilityPages(homeData));
  await buildLoginPages(writeOutputFile);
  entries.push({ loc: siteOrigin + '/contact-us/', lastmod: execFileSync('git', ['log', '-1', '--format=%cs', '--', 'contact-us/index.html'], { cwd: repoRoot, encoding: 'utf8' }).trim() || nowDate, changefreq: 'yearly', priority: '0.5' });
  await writeOutputFile(path.join(repoRoot, 'sitemap.xml'), buildSitemap(entries, await readPreviousLastmods()));
  await writeOutputFile(path.join(repoRoot, 'llms.txt'), buildLlmsTxt({ homeCopy: homeData.homepageCopies.en, homeSeo: getNichePageContent('en').home, niches: englishNiches(), pageUrl: buildPageUrl }));
  await writeOutputFile(path.join(repoRoot, '404.html'), notFound());
}
main().catch(error => { console.error(error); process.exitCode = 1; });
