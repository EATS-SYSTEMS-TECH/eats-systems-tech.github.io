import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES } from './niche-pages/index.mjs';
import { NICHE_CHROME } from './niche-content.mjs';
import { benefitIconSvg } from './benefit-icons.mjs';
import { setNicheList } from './niche-text-list.mjs';
import { HIGHLIGHT_ART_SIZE, HIGHLIGHT_ART_DIR, HIGHLIGHT_WAVE, highlightArtPath } from './highlight-art.mjs';
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
// A starred note: its mark ("*", or the reference mark of the locale) and its sentence.
const NOTE_MARK = /^[*※]\s*/u;
// The copy keeps the whole claim, so the structured data and llms.txt stay complete;
// on the page the claim ends before its exception, which follows as small print.
function withoutNote(full, note, label) {
  const sentence = typeof note === 'string' && NOTE_MARK.test(note) ? note.replace(NOTE_MARK, '') : '';
  if (!sentence || !full.endsWith(sentence) || full.length === sentence.length) throw Error(`${label} must end with its starred note`);
  return full.slice(0, -sentence.length).trimEnd();
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
    ['#wifigate-for-business .guest-invites__eyebrow', copy.automation.eyebrow], ['#wifigate-for-business .guest-invites__subtitle', copy.automation.subtitle],
    ['#wifigate-for-business .automation-promise', copy.automation.promise], ['.business-plan--host .business-plan__text', copy.automation.text], ['#wifigate-for-business .guest-invites__cta span', copy.automation.cta],
    ['.business-plan--manager .business-plan__tagline', copy.automation.manager.tagline], ['.business-plan--manager .business-plan__text', copy.automation.manager.text], ['.business-plan--manager .business-plan__cta span', copy.automation.manager.cta],
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
  for (const [selector, value] of [['#where-product-image', copy.solutions.imageAlt], ["img[src*='private-access-arrival']", copy.privateAccess.imageAlt], ["img[src*='one-tap-invite-map']", copy.oneTapInvite.imageAlt], ['img.product-overview__image', copy.productGuide.imageAlt]]) $(selector).attr('alt', value);
  $('#how-it-works .feature-card').each((index, node) => { text($(node).find('.feature-card__title'), copy.platform.features[index].title); text($(node).find('.feature-card__text'), copy.platform.features[index].text); });
  // The no-SIM claim has one exception (the Manager plan needs Wi-Fi): small print under the card.
  const connectionNote = copy.platform.connectionNote, connectionCard = $('#how-it-works .feature-card--no-sim-router');
  if (connectionCard.length !== 1 || connectionCard.find('#connection-note').length !== 1) throw Error('The no-SIM card requires its connection note');
  text(connectionCard.find('.feature-card__text'), withoutNote(copy.platform.features[0].text, connectionNote, 'The no-SIM card'));
  $('#connection-note').removeAttr('hidden'); text('#connection-note', connectionNote);
  for (const [list, items] of [['.automation-audiences', copy.automation.audiences], ['.business-plan__audiences', copy.automation.manager.audiences]]) {
    $(`#wifigate-for-business ${list}`).attr('aria-label', copy.automation.audienceLabel).attr('dir', direction);
    $(`#wifigate-for-business ${list} li`).each((index, node) => $(node).text(items[index]));
  }
  $('#tutorial-videos .tutorial-card').each((index, node) => { text($(node).find('.tutorial-card__title'), copy.productGuide.items[index]); text($(node).find('.tutorial-card__status'), copy.productGuide.status); });
  $('#wifi-gate-faq .seo-faq__item').each((index, node) => { text($(node).find('summary'), copy.faq.items[index].question); text($(node).find('.seo-faq__answer p'), copy.faq.items[index].answer); });
  // The answer that repeats the no-SIM claim carries the same small print.
  const connectionAnswers = $('#wifi-gate-faq .seo-faq__item').toArray().filter((_, index) => copy.faq.items[index].answer.endsWith(connectionNote.replace(NOTE_MARK, '')));
  if (connectionAnswers.length !== 1) throw Error('One answer must end with the connection note');
  const connectionAnswer = $(connectionAnswers[0]).find('.seo-faq__answer'), connectionIndex = $('#wifi-gate-faq .seo-faq__item').index(connectionAnswers[0]);
  text(connectionAnswer.find('p'), withoutNote(copy.faq.items[connectionIndex].answer, connectionNote, 'The no-SIM answer'));
  connectionAnswer.append($('<p>').addClass('seo-faq__note'));
  text(connectionAnswer.find('.seo-faq__note'), connectionNote);
  $('#why-wifigate .entry-point__label').each((index, node) => { if (copy.why.points[index]) text($(node), copy.why.points[index]); });
}

// Version of the highlight drawings, their wave and css/niche-flow.css; change it with them.
export const HIGHLIGHT_ART_VERSION = '20261112b';
// Small print under the three highlights: the starred exception to what they claim.
export function installHighlightNote($, note, locale) {
  if (!note) return;
  const track = $('#niche-highlights .niche-flow__track');
  if (track.length !== 1) throw Error('A highlight note requires the highlights');
  const line = $('<p>').addClass('niche-flow__note'); setLocalizedText($, line, note, locale);
  track.after(line);
}
// A use-case hero offers the shop beside its replay action, as a quiet second button.
export function installUseCaseShopLink($, { locale, pageKey, label }) {
  const actions = $('.niche-hero__actions');
  if (actions.length !== 1 || typeof label !== 'string' || !label.trim()) throw Error(`The ${pageKey} hero requires its actions and a localized shop label: ${locale}`);
  actions.append($('<a>').attr({ id: 'niche-hero-shop', href: buildPagePath(locale, 'shop') }).addClass('btn btn--ghost niche-hero__btn-secondary').text(label));
}
// The three highlights speak the drawing language of the WIFIGATE Host and Manager
// pages (css/niche-flow.css): each highlight's drawing (scripts/highlight-art.mjs, by
// its kind) stands above one point of a shared wave and its copy below. The drawings
// are decorative; the title and text carry the meaning.
function setNicheHighlights($, supplied, assetPrefix = '') {
  const section = $('#niche-highlights'), list = $('#niche-highlights-list');
  if (!section.length || !list.length) return;
  const items = (Array.isArray(supplied) ? supplied : []).filter(item => item && item.title && item.text);
  list.empty();
  if (!items.length) { section.remove(); return; }
  section.removeAttr('hidden').addClass('niche-highlights--flow');
  // The page loads the highlight styles right after its own, once.
  if (!$("link[href*='css/niche-flow.css']").length) $("link[href*='css/niche.css']").after(`<link rel="stylesheet" href="${assetPrefix}css/niche-flow.css?v=${HIGHLIGHT_ART_VERSION}" />`);
  const picture = (file, className, { width, height }) => $('<img>').addClass(className).attr({ src: `${assetPrefix}${file}?v=${HIGHLIGHT_ART_VERSION}`, alt: '',
    width: String(width), height: String(height), loading: 'lazy', decoding: 'async' });
  list.removeClass('niche-highlights__grid').addClass('niche-flow__list');
  for (const item of items) {
    const copy = $('<div>').addClass('niche-flow__text').append(
      $('<h2>').addClass('niche-highlight__title').text(item.title), $('<p>').addClass('niche-highlight__text').text(item.text));
    if (item.ctaLabel && item.ctaHref) copy.append($('<a>').addClass('btn btn--ghost btn--small niche-highlight__cta').attr('href', item.ctaHref).text(item.ctaLabel));
    list.append($('<article>').addClass('niche-highlight niche-flow__step').append(picture(highlightArtPath(item.icon), 'niche-flow__art', HIGHLIGHT_ART_SIZE), copy));
  }
  list.wrap($('<div>').addClass('niche-flow__track'));
  list.before(picture(`${HIGHLIGHT_ART_DIR}/${HIGHLIGHT_WAVE.file}`, 'niche-flow__wave', HIGHLIGHT_WAVE));
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
  setNicheHighlights($, content.highlights, buildAssetPrefix(locale, pageKey));
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
