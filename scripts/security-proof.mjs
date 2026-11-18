// "Did you know?" panel of the security and privacy page: the four layers that
// protect an opening from the app, and the hacking tools our experts tried
// against it. It describes manual opening from the app only; the starred note
// says so, because the learned remote and Auto Open are not covered by it.
// Only the locales listed here show the panel.
import { setLocalizedText } from "./localized-builder-document.mjs";

export const SECURITY_PROOF_PAGE_KEY = "security-privacy";
export const SECURITY_PROOF_STYLE_VERSION = "20261118sp2";

export const SECURITY_PROOF_COPY = Object.freeze({
  he: Object.freeze({
    eyebrow: "הידעת?",
    title: "נבנה לעמוד מול כלי פריצה מודרניים.",
    layersTitle: "4 שכבות הגנה",
    layersText: "כל פתיחה מהאפליקציה מוגנת בארבע שכבות, כך שאי אפשר לקרוא אותה, לזייף אותה או להעתיק אותה.",
    layers: Object.freeze([
      Object.freeze({ title: "זיהוי הבקר", text: "הטלפון מוודא שהוא מדבר עם הבקר שלכם." }),
      Object.freeze({ title: "הצפנה", text: "אף אחד מבחוץ לא יכול לקרוא את הפקודה." }),
      Object.freeze({ title: "זיהוי הטלפון", text: "הבקר מקבל פקודה רק מטלפון מורשה." }),
      Object.freeze({ title: "הגנה מהעתקה", text: "פקודה שהוקלטה לא תעבוד שוב." }),
    ]),
    testTitle: "המומחים שלנו ניסו לפרוץ.",
    testText: "הם ניסו להעתיק ולפרוץ את הפתיחה מהאפליקציה עם כלי הפריצה המוכרים היום:",
    tools: Object.freeze([
      Object.freeze({ name: "Flipper Zero", detail: "עם מודול הרחבה" }),
      Object.freeze({ name: "HackRF One", detail: "" }),
    ]),
    failed: "לא הצליח",
    outcome: "אף ניסיון לא הצליח.",
    note: "* המידע בחלק הזה מתייחס לפתיחה ידנית מהאפליקציה בלבד, ולא לשלט או לפתיחה אוטומטית.",
  }),
});

const NONEMPTY = value => typeof value === "string" && value.trim().length > 0;

export function securityProofCopy(pageKey, locale) {
  if (pageKey !== SECURITY_PROOF_PAGE_KEY || !Object.hasOwn(SECURITY_PROOF_COPY, locale)) return null;
  const copy = SECURITY_PROOF_COPY[locale];
  const texts = [copy.eyebrow, copy.title, copy.layersTitle, copy.layersText, copy.testTitle, copy.testText, copy.failed, copy.outcome, copy.note];
  if (!texts.every(NONEMPTY) || copy.layers.length !== 4 || !copy.layers.every(layer => NONEMPTY(layer.title) && NONEMPTY(layer.text))
    || !copy.tools.length || !copy.tools.every(tool => NONEMPTY(tool.name))) throw new Error(`Incomplete security proof copy: ${locale}`);
  return copy;
}

// Four rings around a lock, one ring for each layer, numbered from the outside in.
const LAYERS_ART = `<svg class="security-proof__art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
  <circle cx="120" cy="120" r="112" class="security-proof__ring"/>
  <circle cx="120" cy="120" r="88" class="security-proof__ring"/>
  <circle cx="120" cy="120" r="64" class="security-proof__ring"/>
  <circle cx="120" cy="120" r="40" class="security-proof__ring security-proof__ring--core"/>
  <g class="security-proof__badge"><circle cx="120" cy="8" r="11"/><text x="120" y="12.5">1</text></g>
  <g class="security-proof__badge"><circle cx="120" cy="32" r="11"/><text x="120" y="36.5">2</text></g>
  <g class="security-proof__badge"><circle cx="120" cy="56" r="11"/><text x="120" y="60.5">3</text></g>
  <g class="security-proof__badge"><circle cx="120" cy="80" r="11"/><text x="120" y="84.5">4</text></g>
  <rect x="104" y="116" width="32" height="25" rx="4" class="security-proof__lock"/>
  <path d="M111 116v-7a9 9 0 0 1 18 0v7" class="security-proof__shackle"/>
  <circle cx="120" cy="127" r="3" class="security-proof__keyhole"/>
</svg>`;

// A handheld hacking tool whose signal stops at a crossed-out mark before the lock.
const TOOLS_ART = `<svg class="security-proof__art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
  <rect x="22" y="82" width="64" height="104" rx="12" class="security-proof__device"/>
  <rect x="32" y="94" width="44" height="30" rx="3" class="security-proof__screen"/>
  <circle cx="54" cy="150" r="13" class="security-proof__device-ring"/>
  <circle cx="54" cy="150" r="4" class="security-proof__device-dot"/>
  <path d="M74 82V52" class="security-proof__antenna"/>
  <circle cx="74" cy="48" r="4" class="security-proof__device-dot"/>
  <path d="M96 112q10 16 0 32M108 102q16 26 0 52M120 92q22 36 0 72" class="security-proof__wave"/>
  <circle cx="150" cy="128" r="17" class="security-proof__stop"/>
  <path d="M142 120l16 16M158 120l-16 16" class="security-proof__stop-cross"/>
  <rect x="180" y="124" width="36" height="28" rx="4" class="security-proof__lock"/>
  <path d="M188 124v-8a10 10 0 0 1 20 0v8" class="security-proof__shackle"/>
  <circle cx="198" cy="137" r="3.5" class="security-proof__keyhole"/>
</svg>`;

/** Adds the panel right under the hero, above the page's three points, for the locales that have it. */
export function installSecurityProof($, { pageKey, locale, assetPrefix }) {
  const copy = securityProofCopy(pageKey, locale);
  if (!copy) return false;
  const anchor = $("#niche-highlights");
  if (anchor.length !== 1) throw new Error("The security proof panel requires the highlights");
  const text = (tag, className, value) => { const node = $(`<${tag}>`).addClass(className); setLocalizedText($, node, value, locale); return node; };

  const layers = $("<ol>").addClass("security-proof__layers");
  copy.layers.forEach((layer, index) => layers.append($("<li>").addClass("security-proof__layer").append(
    $("<span>").addClass("security-proof__number").attr("aria-hidden", "true").text(String(index + 1)),
    $("<span>").addClass("security-proof__layer-copy").append(text("strong", "security-proof__layer-title", layer.title), text("span", "security-proof__layer-text", layer.text)))));
  const layersCard = $("<div>").addClass("security-proof__card security-proof__card--layers").append(
    $("<div>").addClass("security-proof__art-wrap").append(LAYERS_ART),
    text("h3", "security-proof__card-title", copy.layersTitle), text("p", "security-proof__card-text", copy.layersText), layers);

  const tools = $("<ul>").addClass("security-proof__tools");
  for (const tool of copy.tools) {
    const name = $("<span>").addClass("security-proof__tool-name").append($("<bdi>").attr("dir", "ltr").text(tool.name));
    if (NONEMPTY(tool.detail)) name.append(text("span", "security-proof__tool-detail", tool.detail));
    tools.append($("<li>").addClass("security-proof__tool").append(name, $("<span>").addClass("security-proof__result").append(
      $("<span>").addClass("security-proof__cross").attr("aria-hidden", "true").text("✕"), text("span", "security-proof__result-text", copy.failed))));
  }
  const testCard = $("<div>").addClass("security-proof__card security-proof__card--test").append(
    $("<div>").addClass("security-proof__art-wrap").append(TOOLS_ART),
    text("h3", "security-proof__card-title", copy.testTitle), text("p", "security-proof__card-text", copy.testText), tools,
    text("p", "security-proof__outcome", copy.outcome));

  const section = $("<section>").attr({ id: "security-proof", class: "security-proof", "aria-labelledby": "security-proof-title" }).append(
    $("<div>").addClass("container").append(
      $("<div>").addClass("security-proof__panel").append(
        $("<header>").addClass("security-proof__header").append(text("p", "security-proof__eyebrow", copy.eyebrow), text("h2", "security-proof__title", copy.title).attr("id", "security-proof-title")),
        $("<div>").addClass("security-proof__grid").append(layersCard, testCard)),
      text("p", "security-proof__note", copy.note)));
  anchor.before(section);
  if (!$("link[href*='css/security-proof.css']").length) $("head").append(`<link rel="stylesheet" href="${assetPrefix}css/security-proof.css?v=${SECURITY_PROOF_STYLE_VERSION}">`);
  return true;
}
