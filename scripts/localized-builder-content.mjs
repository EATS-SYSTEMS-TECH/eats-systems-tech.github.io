import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES } from './niche-pages/index.mjs';
import { NICHE_CHROME } from './niche-content.mjs';
import { benefitIconSvg } from './benefit-icons.mjs';
import { setNicheList } from './niche-text-list.mjs';
import { setLocalizedText, setLocalizedLines, formatTextForLocaleDirection, isRtl, buildAssetPrefix, buildPagePath, nowDate, updateAccessibilityMarkup } from './localized-builder-document.mjs';

// Content lookup retains the canonical English fallback and explicit chrome errors.
export const getNichePageContent = locale => NICHE_PAGE_LOCALES[locale] || NICHE_PAGE_LOCALES.en;
export function getNicheChrome(locale) {
  if (!NICHE_CHROME[locale]) throw Error(`No use-case page labels (scripts/niche-content.mjs) for ${locale}`);
  return NICHE_CHROME[locale];
}
export const buildNicheContext = (_, niche, locale) => ({ chrome: getNicheChrome(locale), content: getNichePageContent(locale).niches[niche.key] });

// Subtitle splitting follows sentence, nearest comma and balanced-word precedence.
function splitHeroSubtitleLines(value) {
  const text = value.trim(), sentence = text.match(/^(.+?[.!?。！？।])(?:\s+|(?=\S))(.+)$/u);
  if (sentence) return [sentence[1].trim(), sentence[2].trim()];
  const commas = [...text.matchAll(/[,，]\s*/gu)];
  if (commas.length) {
    const closest = commas.reduce((best, entry) => Math.abs(entry.index - text.length / 2) < Math.abs(best.index - text.length / 2) ? entry : best);
    const at = closest.index + closest[0].length;
    return [text.slice(0, at).trim(), text.slice(at).trim()];
  }
  const words = text.split(/\s+/u), at = Math.ceil(words.length / 2);
  return [words.slice(0, at).join(' '), words.slice(at).join(' ')];
}
export function updateHomeStaticUi($, copy, accessibility, locale) {
  const media = copy.hero.media;
  for (const [selector, label] of [['#hero-mute-toggle', media.unmute], ['#hero-pause-toggle', media.pause], ['#hero-replay', media.replay]]) $(selector).attr({ 'aria-label': label, title: label });
  $('#hero-replay span').text(media.replay);
  updateAccessibilityMarkup($, accessibility, locale);
}
export function updateHomeWhereLinks($, locale) {
  for (const { key } of NICHE_DEFINITIONS) $(`.where-list__link[data-niche-key='${key}']`).attr('href', buildPagePath(locale, key)).text(getNichePageContent(locale).niches[key].label);
}
export function applyHomepageCopy($, copy, locale) {
  const direction = isRtl(locale) ? 'rtl' : 'ltr', text = (selector, value) => setLocalizedText($, selector, value, locale);
  // Statement locales and conventional hero locales keep their distinct DOM.
  if (copy.hero.statement) {
    $('.hero').addClass('hero--statement');
    const title = $('#hero-title').empty().attr('dir', direction);
    copy.hero.titleLines.forEach((line, index) => { if (index) title.append(' '); title.append($('<span>').addClass('hero__title-line').text(formatTextForLocaleDirection(line, locale))); });
    text('#hero-subtitle', copy.hero.statement); $('.hero__proof').remove();
  } else {
    const brand = $('<bdi>').text('WIFIGATE (WiFi Gate)'), category = $('<span>').text(getNichePageContent(locale).home.seoTitle.replace(/^WIFIGATE \| /, ''));
    const line = $('<span>');
    if (isRtl(locale)) line.append(category, ' · ', brand); else line.append(brand, ' · ', category);
    $('#hero-title .hero__eyebrow').empty().attr('dir', direction).append(line);
    setLocalizedLines($, '#hero-title .hero__title-lines', copy.hero.titleLines, locale);
    setLocalizedLines($, '#hero-subtitle', splitHeroSubtitleLines(copy.hero.subtitle), locale);
    $('.hero__proof').attr('aria-label', copy.hero.proofLabel).attr('dir', direction);
    $('.hero__proof li').each((index, node) => $(node).text(copy.hero.proof[index]));
  }
  // Declarative copy slots keep every existing public selector and translation.
  const slots = [
    ['.hero__btn-primary', copy.hero.primaryCta], ['.hero__btn-secondary', copy.hero.secondaryCta],
    ['#how-it-works .section__eyebrow', copy.platform.eyebrow], ['#features-title', copy.platform.title], ['#how-it-works .section__subtitle', copy.platform.subtitle],
    ['#private-access .security-statement__eyebrow', copy.privateAccess.eyebrow], ['#private-access-title', copy.privateAccess.title], ['#private-access .security-statement__copy p', copy.privateAccess.description],
    ['#use-cases .section__eyebrow', copy.solutions.eyebrow], ['#where-subtitle', copy.solutions.subtitle],
    ['#wifigate-automation .guest-invites__eyebrow', copy.automation.eyebrow], ['#wifigate-automation .automation-promise', copy.automation.promise], ['#wifigate-automation .guest-invites__subtitle', copy.automation.subtitle], ['#wifigate-automation .guest-invites__cta span', copy.automation.cta], ['#wifigate-automation .automation-stay__label', copy.automation.stayCaption],
    ['#tutorial-videos .section__eyebrow', copy.productGuide.eyebrow], ['#tutorials-title', copy.productGuide.title], ['#tutorial-videos .section__subtitle', copy.productGuide.subtitle],
    ['#one-tap-invite .security-statement__eyebrow', copy.oneTapInvite.eyebrow], ['#one-tap-invite-title', copy.oneTapInvite.title], ['#one-tap-invite .security-statement__copy p', copy.oneTapInvite.description],
    ['#wifi-gate-faq .section__eyebrow', copy.faq.eyebrow], ['#wifi-gate-faq-title', copy.faq.title], ['#wifi-gate-faq .section__subtitle', copy.faq.subtitle],
    ['#why-wifigate .security-statement__eyebrow', copy.why.eyebrow], ['#why-wifigate-title', copy.why.title], ['#why-wifigate .security-statement__copy p', copy.why.description],
    ['#get-in-touch .section__eyebrow', copy.contact.eyebrow], ['#contact-title', copy.contact.title], ['#contact-description', copy.contact.subtitle],
  ];
  for (const [selector, value] of slots) text(selector, value);
  for (const key of ['distributorTitle', 'distributorText', 'distributorButton', 'supportTitle', 'supportText', 'interestTitle', 'interestText', 'whatsappButton']) text(`[data-i18n='contact.${key}']`, copy.contact[key]);
  setLocalizedLines($, '#where-title', copy.solutions.titleLines, locale);
  setLocalizedLines($, '#guest-invites-title', copy.automation.titleLines, locale);
  // Optional notes retain their original visibility/removal boundary.
  for (const [selector, value] of [['#subscription-note', copy.platform.subscriptionNote], ['#entry-points-note', copy.why.pointsNote]]) {
    if (!$(selector).length) continue;
    if (value) { $(selector).removeAttr('hidden'); text(selector, value); } else $(selector).remove();
  }
  for (const [selector, value] of [['#where-product-image', copy.solutions.imageAlt], ["img[src*='private-access-arrival']", copy.privateAccess.imageAlt], ["img[src*='one-tap-invite-map']", copy.oneTapInvite.imageAlt], ['img.product-overview__image', copy.productGuide.imageAlt], ['#wifigate-automation .automation-stay img', copy.automation.imageAlt]]) $(selector).attr('alt', value);
  $('#how-it-works .feature-card').each((index, node) => { text($(node).find('.feature-card__title'), copy.platform.features[index].title); text($(node).find('.feature-card__text'), copy.platform.features[index].text); });
  $('#wifigate-automation .automation-audiences').attr('aria-label', copy.automation.audienceLabel).attr('dir', direction);
  $('#wifigate-automation .automation-audiences li').each((index, node) => $(node).text(copy.automation.audiences[index]));
  $('#wifigate-automation .automation-stay__steps li').each((index, node) => $(node).text(copy.automation.staySteps[index]));
  // The sole supported override is the existing team illustration geometry.
  $('#wifigate-automation .guest-invites__point').each((index, node) => {
    const point = copy.automation.points[index];
    text($(node).find('.guest-invites__point-title'), point.title); text($(node).find('.guest-invites__point-text'), point.text);
    if (point.icon) {
      if (point.icon !== 'team') throw Error(`${locale}: automation.points.${index}.icon references unknown icon "${point.icon}"`);
      $(node).find('.guest-invites__point-icon svg').html('<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"></path><circle cx="10" cy="8" r="3.5"></circle><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4"></path><path d="M15 5.1a3.5 3.5 0 0 1 0 5.8"></path>');
    }
  });
  $('#tutorial-videos .tutorial-card').each((index, node) => { text($(node).find('.tutorial-card__title'), copy.productGuide.items[index]); text($(node).find('.tutorial-card__status'), copy.productGuide.status); });
  $('#wifi-gate-faq .seo-faq__item').each((index, node) => { text($(node).find('summary'), copy.faq.items[index].question); text($(node).find('.seo-faq__answer p'), copy.faq.items[index].answer); });
  $('#why-wifigate .entry-point__label').each((index, node) => { if (copy.why.points[index]) text($(node), copy.why.points[index]); });
}

// These display-only geometric facts preserve all accepted highlight illustrations.
const highlightGeometry = {
  phone: '<rect x="6.5" y="2.5" width="9" height="19" rx="2"/><path d="M10.5 18.5h3"/><path d="M18 8.5a5 5 0 0 1 0 7"/><path d="M20.5 6a8.5 8.5 0 0 1 0 12"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  roster: '<circle cx="8" cy="8" r="3"/><path d="M2.8 19c0-3 2.3-5 5.2-5s5.2 2 5.2 5"/><path d="M16.5 8.5h4.7M16.5 12.5h4.7M16.5 16.5h4.7"/>',
  invite: '<path d="M21.5 3 2.5 10.5l7.5 3 3 7.5L21.5 3Z"/><path d="m10 13.5 4.5-4.5"/>',
  handsfree: '<path d="M5 20.5V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M2.5 20.5h14"/><circle cx="12.4" cy="12.3" r=".9"/><path d="M18.5 9.5a5 5 0 0 1 0 5"/><path d="M21.3 7.5a8.5 8.5 0 0 1 0 9"/>',
  keyless: '<circle cx="8" cy="8" r="3.5"/><path d="m10.5 10.5 8 8"/><path d="m15.5 15.5-2 2"/><path d="M3 21 21 3"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5V10H9"/><path d="M12 8v4.5l3 1.8"/>',
  shield: '<path d="M12 2.8 4.5 6v6c0 4.4 3.1 7.9 7.5 9.2 4.4-1.3 7.5-4.8 7.5-9.2V6L12 2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.2"/>',
  gate: '<path d="M3 20.5V6M21 20.5V6"/><path d="M2 20.5h20"/><path d="M6 20.5V9.5h12v11"/><path d="M12 9.5v11"/><path d="M6 14.5h12"/>',
  shutter: '<path d="M3 5.5h18"/><path d="M4.5 5.5v15M19.5 5.5v15"/><path d="M2.5 20.5h19"/><path d="M4.5 9.5h15M4.5 12.5h15M4.5 15.5h15"/>',
  barrier: '<path d="M5 21v-11"/><circle cx="5" cy="7.5" r="1.75"/><path d="M3 21h4"/><path d="M7 8.75 21 13"/><path d="M11.5 10.1l-.9 2.8M16 11.5l-.9 2.8"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M2.8 19.5c0-3.2 2.8-5.6 6.2-5.6s6.2 2.4 6.2 5.6"/><path d="M16.5 6.2a3.2 3.2 0 0 1 0 6.1"/><path d="M17.8 14.4c2.1.6 3.6 2.4 3.6 5.1"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 2.8v4M16 2.8v4"/><path d="M8.5 14h3"/>',
  bolt: '<path d="M13.5 2 4.5 13.5h6L10 22l9.5-11.5h-6L13.5 2Z"/>',
  default: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>',
};
function setNicheHighlights($, supplied) {
  const section = $('#niche-highlights'), list = $('#niche-highlights-list');
  if (!section.length || !list.length) return;
  const items = (Array.isArray(supplied) ? supplied : []).filter(item => item && item.title && item.text);
  list.empty();
  if (!items.length) { section.remove(); return; }
  section.removeAttr('hidden');
  for (const item of items) {
    const article = $('<article>').addClass('niche-highlight').append(
      $('<span>').addClass('niche-highlight__icon').attr('aria-hidden', 'true').html(`<svg viewBox="0 0 24 24">${highlightGeometry[item.icon] || highlightGeometry.default}</svg>`),
      $('<h2>').addClass('niche-highlight__title').text(item.title), $('<p>').addClass('niche-highlight__text').text(item.text));
    if (item.ctaLabel && item.ctaHref) article.append($('<a>').addClass('btn btn--ghost btn--small niche-highlight__cta').attr('href', item.ctaHref).text(item.ctaLabel));
    list.append(article);
  }
}

// Span assignment fills every row while preserving the leading asymmetric pair.
export function benefitSpans(count) {
  const values = [];
  for (let index = 0; index < count; index++) {
    if (count === 1) values.push('full');
    else if (index < 2) values.push(index === 0 ? 'lead' : 'feature');
    else {
      const remainder = (count - 2) % 3;
      values.push(remainder && index >= count - remainder ? remainder === 1 ? 'full' : 'half' : 'third');
    }
  }
  return values;
}
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const initial = value => segmenter.segment(value)[Symbol.iterator]().next().value?.segment || '';
function renderBenefitVisual($, visual, locale) {
  const text = (className, value) => { const node = $('<span>').addClass(className); setLocalizedText($, node, value, locale); return node; };
  const span = (className, value) => $('<span>').addClass(className).text(value);
  const row = (...children) => $('<li>').addClass('bento-visual__row').append(...children);
  const box = $('<div>').addClass(`bento-visual bento-visual--${visual.type}`).attr('aria-hidden', 'true');
  const bar = $('<div>').addClass('bento-visual__bar').append(text('bento-visual__heading', visual.heading));
  if (visual.status) bar.append(text('bento-visual__status', visual.status));
  box.append(bar);
  const rows = $('<ul>').addClass('bento-visual__rows');
  // Illustrations are noninteractive repetitions of the adjacent translated copy.
  if (visual.type === 'roster') {
    for (const item of visual.rows) rows.append(row(span('bento-visual__avatar', initial(item.name)), text('bento-visual__name', item.name), text('bento-visual__badge', item.badge)));
  } else if (visual.type === 'history') {
    for (const item of visual.rows) rows.append(row(span('bento-visual__time', item.time).attr('dir', 'ltr'), text('bento-visual__name', item.name), text('bento-visual__badge', item.event)));
  } else if (visual.type === 'invite') {
    rows.append(row(span('bento-visual__avatar', initial(visual.guest)), text('bento-visual__name', visual.guest)).addClass('bento-visual__row--guest'));
    for (const [icon, value] of [['clock', visual.when], ['map-pin', visual.note]]) rows.append(row($('<span>').addClass('bento-visual__glyph').html(benefitIconSvg(icon)), text('bento-visual__detail', value)));
  } else if (visual.type === 'schedule') {
    for (const item of visual.rows) {
      const [from, to] = item.range.match(/\d{1,2}:\d{2}/g).map(time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; });
      rows.append(row(text('bento-visual__day', item.day), $('<span>').addClass('bento-visual__track').append($('<span>').addClass('bento-visual__span').attr('style', `--from: ${(from / 1440) * 100}%; --to: ${(to / 1440) * 100}%;`)), span('bento-visual__time', item.range).attr('dir', 'ltr')));
    }
  } else throw Error(`Unknown benefit visual "${visual.type}"`);
  return box.append(rows);
}
function setNicheBenefits($, benefits, locale) {
  const list = $('#niche-benefits-list');
  if (!list.length) return;
  const spans = benefitSpans(benefits.length), total = String(benefits.length).padStart(2, '0');
  list.empty().attr('data-count', String(benefits.length));
  benefits.forEach((benefit, index) => {
    const card = $('<li>').addClass(`bento-card bento-card--${spans[index]}`);
    const top = $('<div>').addClass('bento-card__top').append($('<span>').addClass('bento-card__icon').attr('aria-hidden', 'true').html(benefitIconSvg(benefit.icon)), $('<span>').addClass('bento-card__count').attr({ 'aria-hidden': 'true', dir: 'ltr' }).text(`${String(index + 1).padStart(2, '0')} / ${total}`));
    const title = $('<h3>').addClass('bento-card__title'), paragraph = $('<p>').addClass('bento-card__text');
    setLocalizedText($, title, benefit.title, locale); setLocalizedText($, paragraph, benefit.text, locale);
    const body = $('<div>').addClass('bento-card__body').append(title, paragraph);
    if (benefit.tags?.length) {
      const tags = $('<ul>').addClass('bento-card__tags');
      for (const value of benefit.tags) { const tag = $('<li>').addClass('bento-tag'); setLocalizedText($, tag, value, locale); tags.append(tag); }
      body.append(tags);
    }
    card.append(top, body);
    if (benefit.visual) card.addClass('bento-card--with-visual').append(renderBenefitVisual($, benefit.visual, locale));
    list.append(card);
  });
}
export function fillUseCaseBody($, { chrome, content, image, locale, pageKey, accessibilityBundle }) {
  $('#niche-eyebrow').text(content.eyebrow || chrome.eyebrow); $('#niche-title').text(content.title);
  const lead = $('#niche-hero-lead');
  if (lead.length) { if (content.heroLead) lead.removeAttr('hidden').text(content.heroLead); else lead.remove(); }
  setNicheHighlights($, content.highlights);
  if (content.heroLead) $('#niche-hero-proof').remove();
  else setNicheList($, '#niche-hero-proof', (content.benefits || []).slice(0, 2).map(item => item.title), 'niche-hero__proof-item');
  $('#niche-hero-cta-label').text('WhatsApp @WIFIGATE'); $('#niche-hero-benefits').text(chrome.benefitsTitle);
  $('#niche-image').attr({ src: buildAssetPrefix(locale, pageKey) + image.hero, alt: content.imageAlt, width: String(image.heroWidth), height: String(image.heroHeight) });
  $('#niche-benefits-title').text(content.benefitsTitle || chrome.benefitsTitle); setNicheBenefits($, content.benefits, locale);
  $('#niche-faq-title').text(content.faqTitle || chrome.faqTitle);
  const questions = $('#niche-faq-list').empty();
  for (const item of content.faq) {
    const summary = $('<summary>'), answer = $('<p>');
    setLocalizedText($, summary, item.question, locale); setLocalizedText($, answer, item.answer, locale);
    questions.append($('<details>').addClass('seo-faq__item').append(summary, $('<div>').addClass('seo-faq__answer').append(answer)));
  }
  $('#js-year').text(nowDate.slice(0, 4)); updateAccessibilityMarkup($, accessibilityBundle, locale);
}

// Landing-specific sections augment the shared body without changing its order.
function landingSection($, id, title, background, locale) {
  const heading = $('<h2>').addClass('niche-section__title').attr('id', id + '-title'); setLocalizedText($, heading, title, locale);
  const container = $('<div>').addClass('container').append($('<div>').addClass('niche-section__header').append(heading));
  return { container, section: $('<section>').addClass(`niche-section landing-section landing-section--${background}`).attr({ id, 'aria-labelledby': id + '-title' }).append(container) };
}
export function fillLandingSections($, { content, locale, modified }) {
  const paragraph = (className, value) => { const node = $('<p>').addClass(className); setLocalizedText($, node, value, locale); return node; };
  const intro = landingSection($, 'landing-intro', content.intro.title, 'soft', locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn' }).format(new Date(`${modified}T00:00:00Z`));
  const [before, after] = content.updatedLabel.split('{date}'), surround = value => value ? $('<span>').text(value) : '';
  intro.container.append(paragraph('landing-intro__text', content.intro.text), $('<p>').addClass('landing-updated').append(surround(before), $('<time>').attr('datetime', modified).text(date), surround(after)));
  const steps = landingSection($, 'landing-steps', content.steps.title, 'light', locale), list = $('<ol>').addClass('landing-steps__list');
  for (const value of content.steps.items) { const item = $('<li>').addClass('landing-step'); setLocalizedText($, item, value, locale); list.append(item); }
  steps.container.append(list, paragraph('landing-steps__note', content.steps.note));
  const facts = landingSection($, 'landing-facts', content.facts.title, 'light', locale), body = $('<tbody>');
  for (const item of content.facts.rows) {
    const label = $('<th>').attr('scope', 'row'), value = $('<td>');
    setLocalizedText($, label, item.label, locale); setLocalizedText($, value, item.value, locale); body.append($('<tr>').append(label, value));
  }
  facts.container.append($('<table>').addClass('landing-facts__table').attr('aria-labelledby', 'landing-facts-title').append(body));
  $('#niche-highlights').after(intro.section, steps.section); $('#niche-benefits').after(facts.section);
  $('#niche-faq-list summary').each((index, node) => { const question = $(node); question.append($('<h3>').addClass('landing-faq__heading').append(question.contents())); question.closest('.seo-faq__item').attr('id', `faq-${index + 1}`); });
}
