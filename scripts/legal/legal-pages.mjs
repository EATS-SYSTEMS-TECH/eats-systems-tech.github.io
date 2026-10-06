// scripts/legal/legal-pages.mjs
//
// The legal documents (privacy-content.mjs, terms-content.mjs, cookies-content.mjs,
// accessibility-content.mjs) have one source each: English, which governs, and
// Hebrew, block for block. scripts/build-localized-site.mjs renders every legal
// page from them through this module:
//   - renderLegalMain(page): the page body (data-i18n keys, English text)
//   - legalBundles(page):    the localized strings for those keys, per locale
// Every locale other than English and Hebrew gets the English text, a note in
// its own language that the English version governs, and its localized CTAs.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accessibility } from "./accessibility-content.mjs";
import { company } from "./company.mjs";
import { cookies } from "./cookies-content.mjs";
import { languageNotices } from "./locale-notices.mjs";
import { privacy } from "./privacy-content.mjs";
import { terms } from "./terms-content.mjs";

const legalDir = path.dirname(fileURLToPath(import.meta.url));
const LOCALES = [
  "en", "es", "fr", "de", "he", "nl", "it", "pt", "pl", "no", "cs", "ru", "uk",
  "tr", "ar", "hi", "bn", "mr", "te", "zh-Hans", "zh-Hant", "ja", "ko", "da", "sv", "hu",
  "el", "ro", "hr", "fi", "bg", "sr", "sk", "sl", "id", "th", "vi", "ms", "fil",
];
const FULL_TEXT_LOCALES = new Set(["en", "he"]);

const DOCUMENTS = [
  { page: "privacy-policy", content: privacy, contentsLabel: { en: "Contents", he: "תוכן העניינים" } },
  { page: "terms-and-conditions", content: terms, contentsLabel: { en: "Contents", he: "תוכן העניינים" } },
  { page: "cookies", content: cookies, contentsLabel: { en: "Contents", he: "תוכן העניינים" } },
  { page: "accessibility", content: accessibility, contentsLabel: { en: "Contents", he: "תוכן העניינים" } },
];

const localeCta = JSON.parse(await fs.readFile(path.join(legalDir, "locale-cta.json"), "utf8"));
const DEFAULT_CTA = {
  eyebrow: { en: "Legal", he: "משפטי" },
  pricing: {
    en: { title: "Need pricing or installation guidance?", text: "Send us a WhatsApp message and we will help with product fit, installation and next steps.", button: "Open WhatsApp" },
    he: { title: "צריכים הצעת מחיר או ייעוץ להתקנה?", text: "שלחו לנו הודעת WhatsApp ונעזור בהתאמת המוצר, בהתקנה ובצעדים הבאים.", button: "פתיחת WhatsApp" },
  },
  back: {
    en: { title: "Back to the main site", text: "Return to the homepage to review features, applications, tutorials and contact details.", button: "Go to homepage" },
    he: { title: "חזרה לאתר הראשי", text: "חזרו לדף הבית כדי לעיין בתכונות, בשימושים, בהדרכות ובפרטי ההתקשרות.", button: "מעבר לדף הבית" },
  },
};

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The key path of every text block; the same walk builds the markup and the data.
function blockShape(block) {
  if (typeof block === "string") return "p";
  if (block.list) return `list:${block.list.length}`;
  if (block.table) return `table:${block.table.head.length}x${block.table.rows.length}`;
  if (block.link) return `link:${block.link.href}`;
  throw new Error(`unknown block ${JSON.stringify(block).slice(0, 60)}`);
}

function assertSameShape(page, en, he) {
  const shape = (doc) => doc.sections.map((s) => `${s.id}[${s.blocks.map(blockShape).join(",")}]`).join("|");
  if (shape(en) !== shape(he)) {
    throw new Error(`${page}: Hebrew does not mirror English block for block\nen: ${shape(en)}\nhe: ${shape(he)}`);
  }
}

function sectionData(doc) {
  const sections = {};
  for (const section of doc.sections) {
    const data = { title: section.title };
    section.blocks.forEach((block, b) => {
      if (typeof block === "string") data[`b${b}`] = block;
      else if (block.list) data[`b${b}`] = Object.fromEntries(block.list.map((item, i) => [`i${i}`, item]));
      else if (block.table) {
        const table = {};
        block.table.head.forEach((cell, c) => (table[`h${c}`] = cell));
        block.table.rows.forEach((row, r) => row.forEach((cell, c) => (table[`r${r}c${c}`] = cell)));
        data[`b${b}`] = table;
      } else if (block.link) data[`b${b}`] = block.link.text;
    });
    sections[section.id] = data;
  }
  return sections;
}

function legalBundle(doc, ctaFor, extra = {}) {
  return {
    metaTags: { title: doc.metaTitle, description: doc.metaDescription },
    hero: {
      eyebrow: extra.eyebrow || doc.eyebrow,
      title: doc.title,
      subtitle: doc.subtitle,
      updated: doc.updated,
      owner: doc.owner,
      languageNote: extra.languageNote || "",
    },
    contents: extra.contents,
    company: companyData(extra.companyLocale || "en"),
    contentLang: extra.contentLang,
    s: sectionData(doc),
    cta: ctaFor,
  };
}

function companyData(locale) {
  const box = company[locale] || company.en;
  const data = { title: box.title };
  box.rows.forEach(([label, value], r) => {
    data[`r${r}k`] = label;
    data[`r${r}v`] = value;
  });
  return data;
}

function renderCompany() {
  const rows = company.en.rows.map(([label, value, href], r) => {
    const external = href && /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    const shown = href
      ? `<dd><a href="${href}"${external} data-i18n="legal.company.r${r}v">${escapeHtml(value)}</a></dd>`
      : `<dd data-i18n="legal.company.r${r}v">${escapeHtml(value)}</dd>`;
    return `            <div class="legal-company__row"><dt data-i18n="legal.company.r${r}k">${escapeHtml(label)}</dt>${shown}</div>`;
  }).join("\n");
  return `        <section class="legal-company" aria-labelledby="company-title">
          <h2 class="legal-company__title" id="company-title" data-i18n="legal.company.title">${escapeHtml(company.en.title)}</h2>
          <dl class="legal-company__list">
${rows}
          </dl>
        </section>`;
}

function ctaFor(locale) {
  const local = localeCta[locale];
  const base = locale === "he" ? "he" : "en";
  const pick = (kind) => ({
    title: local?.[kind]?.title || DEFAULT_CTA[kind][base].title,
    text: local?.[kind]?.text || DEFAULT_CTA[kind][base].text,
    // The button names the action, never a handle.
    button: kind === "pricing"
      ? (local?.pricing?.button && !/@/.test(local.pricing.button) ? local.pricing.button : DEFAULT_CTA.pricing[base].button)
      : local?.back?.button || DEFAULT_CTA.back[base].button,
  });
  return { pricing: pick("pricing"), back: pick("back") };
}

function renderBlocks(section) {
  const key = (suffix) => `legal.s.${section.id}.${suffix}`;
  return section.blocks.map((block, b) => {
    if (typeof block === "string") {
      return `          <p data-i18n="${key(`b${b}`)}">${escapeHtml(block)}</p>`;
    }
    if (block.list) {
      const items = block.list.map((item, i) => `            <li data-i18n="${key(`b${b}.i${i}`)}">${escapeHtml(item)}</li>`);
      return [`          <ul class="legal-list">`, ...items, `          </ul>`].join("\n");
    }
    if (block.table) {
      const head = block.table.head.map((cell, c) => `<th scope="col" data-i18n="${key(`b${b}.h${c}`)}">${escapeHtml(cell)}</th>`).join("");
      const rows = block.table.rows.map((row, r) =>
        `                <tr>${row.map((cell, c) => `<td data-i18n="${key(`b${b}.r${r}c${c}`)}">${escapeHtml(cell)}</td>`).join("")}</tr>`);
      return [
        `          <div class="legal-table-wrap">`,
        `            <table class="legal-table">`,
        `              <thead><tr>${head}</tr></thead>`,
        `              <tbody>`,
        ...rows,
        `              </tbody>`,
        `            </table>`,
        `          </div>`,
      ].join("\n");
    }
    const external = /^https?:/.test(block.link.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `          <p><a href="${block.link.href}"${external} data-i18n="${key(`b${b}`)}">${escapeHtml(block.link.text)}</a></p>`;
  }).join("\n");
}

function renderMain(page, doc) {
  const toc = doc.sections.map((s) =>
    `            <li><a href="#${s.id}" data-i18n="legal.s.${s.id}.title">${escapeHtml(s.title)}</a></li>`).join("\n");
  const sections = doc.sections.map((s) => [
    `        <section class="legal-section" id="${s.id}" aria-labelledby="${s.id}-title">`,
    `          <h2 class="legal-section__title" id="${s.id}-title" data-i18n="legal.s.${s.id}.title">${escapeHtml(s.title)}</h2>`,
    renderBlocks(s),
    `        </section>`,
  ].join("\n")).join("\n\n");
  const cta = ctaFor("en");
  return `  <main class="legal-main" id="main-content">
    <div class="container">
      <section class="legal-hero" aria-labelledby="${page}-title">
        <p class="legal-eyebrow" data-i18n="legal.hero.eyebrow">${escapeHtml(doc.eyebrow)}</p>
        <h1 class="legal-title" id="${page}-title" data-i18n="legal.hero.title">${escapeHtml(doc.title)}</h1>
        <p class="legal-subtitle" data-i18n="legal.hero.subtitle">${escapeHtml(doc.subtitle)}</p>
        <div class="legal-meta">
          <span class="legal-meta__item" data-i18n="legal.hero.updated">${escapeHtml(doc.updated)}</span>
          <span class="legal-meta__item" data-i18n="legal.hero.owner">${escapeHtml(doc.owner)}</span>
        </div>
        <div class="legal-note legal-language-note" data-i18n="legal.hero.languageNote"></div>
      </section>

      <article class="legal-card">
${renderCompany()}

        <nav class="legal-toc" aria-labelledby="${page}-contents">
          <h2 class="legal-toc__title" id="${page}-contents" data-i18n="legal.contents">Contents</h2>
          <ol>
${toc}
          </ol>
        </nav>

${sections}

        <section class="legal-cta" aria-label="Next steps">
          <div class="legal-cta__card">
            <h2 data-i18n="legal.cta.pricing.title">${escapeHtml(cta.pricing.title)}</h2>
            <p data-i18n="legal.cta.pricing.text">${escapeHtml(cta.pricing.text)}</p>
            <a href="https://wa.me/message/NZWNMX6V2XVHJ1" class="btn btn--primary" target="_blank" rel="noopener noreferrer"
              data-i18n="legal.cta.pricing.button">${escapeHtml(cta.pricing.button)}</a>
          </div>

          <div class="legal-cta__card">
            <h2 data-i18n="legal.cta.back.title">${escapeHtml(cta.back.title)}</h2>
            <p data-i18n="legal.cta.back.text">${escapeHtml(cta.back.text)}</p>
            <a href="../index.html" class="btn btn--ghost" data-i18n="legal.cta.back.button">${escapeHtml(cta.back.button)}</a>
          </div>
        </section>
      </article>
    </div>
  </main>`;
}

export const LEGAL_PAGES = DOCUMENTS.map((document) => document.page);

for (const { page, content } of DOCUMENTS) assertSameShape(page, content.en, content.he);

function documentFor(page) {
  const document = DOCUMENTS.find((entry) => entry.page === page);
  if (!document) throw new Error(`Unknown legal page ${page}`);
  return document;
}

export function renderLegalMain(page) {
  return renderMain(page, documentFor(page).content.en);
}

// translations[locale].legal for every locale.
export function legalBundles(page) {
  const { content: doc, contentsLabel } = documentFor(page);
  const bundles = {};
  for (const locale of LOCALES) {
    if (FULL_TEXT_LOCALES.has(locale)) {
      bundles[locale] = legalBundle(doc[locale], ctaFor(locale), { contents: contentsLabel[locale], companyLocale: locale });
    } else {
      if (!languageNotices[locale]) throw new Error(`no language notice for ${locale}`);
      bundles[locale] = legalBundle(doc.en, ctaFor(locale), {
        eyebrow: localeCta[locale]?.eyebrow,
        contents: contentsLabel.en,
        contentLang: "en",
        languageNote: languageNotices[locale],
      });
    }
  }
  return bundles;
}
