// scripts/landing-pages/index.mjs
// Landing pages: the use-case page design for one search topic, in every
// language, with the site's header, language menu and footer. The site never
// links to them (no menu entry, homepage card or related link); people arrive
// from search. scripts/verify-site.mjs checks that.
//
// One file per locale exporting { <key>: { label, eyebrow, title, heroLead,
// highlights[3], intro { title, text }, steps { title, items[], note },
// benefitsTitle, benefits[8] (bento cards, see scripts/benefit-cards.mjs),
// facts { title, rows[{ label, value }] },
// updatedLabel ("...{date}"), faqTitle, seoTitle, seoDescription, imageAlt,
// faq[] } }. he.mjs is the source: every other locale says what it says.
// URLs: English /<key>/, others /<locale>/<key>/.

import { NICHE_DEFINITIONS } from "../niche-pages/index.mjs";
import en from "./en.mjs";
import he from "./he.mjs";
import es from "./es.mjs";
import fr from "./fr.mjs";
import de from "./de.mjs";
import nl from "./nl.mjs";
import it from "./it.mjs";
import pt from "./pt.mjs";
import pl from "./pl.mjs";
import no from "./no.mjs";
import cs from "./cs.mjs";
import ru from "./ru.mjs";
import uk from "./uk.mjs";
import tr from "./tr.mjs";
import ar from "./ar.mjs";
import hi from "./hi.mjs";
import bn from "./bn.mjs";
import mr from "./mr.mjs";
import te from "./te.mjs";
import zhHans from "./zh-hans.mjs";
import zhHant from "./zh-hant.mjs";
import ja from "./ja.mjs";
import ko from "./ko.mjs";
import da from "./da.mjs";
import sv from "./sv.mjs";
import hu from "./hu.mjs";
import el from "./el.mjs";
import ro from "./ro.mjs";
import hr from "./hr.mjs";
import fi from "./fi.mjs";
import bg from "./bg.mjs";
import sr from "./sr.mjs";
import sk from "./sk.mjs";
import sl from "./sl.mjs";
import id from "./id.mjs";
import th from "./th.mjs";
import vi from "./vi.mjs";
import ms from "./ms.mjs";
import fil from "./fil.mjs";

export const LANDING_PAGE_LOCALES = {
  en, he, es, fr, de, nl, it, pt, pl, no, cs, ru, uk, tr, ar, hi, bn, mr, te,
  "zh-Hans": zhHans, "zh-Hant": zhHant, ja, ko, da, sv, hu, el, ro, hr, fi,
  bg, sr, sk, sl, id, th, vi, ms, fil,
};

const nicheImage = (key) => NICHE_DEFINITIONS.find((niche) => niche.key === key).image;

// published/modified date the page (JSON-LD, sitemap, the visible "updated"
// line): move `modified` only when the copy changes. `about` and `mentions`
// are the sameAs links of the page's subjects for search and AI engines; each
// locale names them (aboutName, mentionsName).
export const LANDING_PAGES = [
  {
    key: "shabbat-clock-electric-gate",
    image: nicheImage("electric-gates"),
    published: "2026-10-16",
    modified: "2026-10-16",
    about: ["https://www.wikidata.org/wiki/Q1998267", "https://he.wikipedia.org/wiki/שעון_שבת_(הלכה)"],
    mentions: ["https://www.wikidata.org/wiki/Q102477", "https://en.wikipedia.org/wiki/Shabbat", "https://he.wikipedia.org/wiki/שבת"],
  },
];

// Brand names are the only text that may stay as it is in English.
const BRAND_ONLY = /^(?:WIFIGATE|WhatsApp|SIM|[\d\s.,:%|+\-–·])+$/;
const numbersOf = (text) => (text.match(/\d+/g) || []).sort().join(",");

// Search results cut a title near 60 and a description near 160 characters;
// a CJK character takes the room of two.
const WIDE = /[ᄀ-ᅟ⺀-〾぀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });
export function displayLength(text) {
  let length = 0;
  for (const { segment } of graphemes.segment(text)) length += WIDE.test(segment) ? 2 : 1;
  return length;
}
const LIMITS = { seoTitle: 60, seoDescription: 160 };

// Locales written in another script carry no Latin word but these.
const NON_LATIN = new Set(["he", "ar", "ru", "uk", "bg", "sr", "el", "hi", "bn", "mr", "te", "th", "zh-Hans", "zh-Hant", "ja", "ko"]);
const LATIN_ALLOWED = new Set(["WIFIGATE", "WhatsApp", "SIM"]);

// Claims the product does not make (approval, automatic Shabbat times,
// power-loss resilience, remote control, Auto Open), checked in the Hebrew
// source and in English; the translations are reviewed against them. Hebrew
// words match whole, with a one-letter prefix, so כשרוצים passes.
const heWord = (stem, endings = "") => new RegExp(`(?:^|[\\s"״(])[ובהלמשכ]?${stem}(?:${endings})?(?=[\\s.,:;?!"״)]|$)`);
const FORBIDDEN = {
  he: [/פתיחה אוטומטית/, /אסטרונומי/, /לפי השקיעה/, heWord("כשר", "ה|ים|ות"), heWord("באישור"), heWord("מאושר", "ת|ים|ות"), heWord("מרחוק"), /מכל מקום/, /סוללת גיבוי/, /מעלית שבת/],
  en: [/Sabbath mode/i, /certified/i, /kosher/i, /\bapproved\b/i, /remotely/i, /remote control from/i, /from anywhere/i, /backup battery/i, /battery backup/i, /by sunset/i, /astronomical/i, /auto open/i, /automatic opening/i, /Shabbat elevator/i],
};

// Every locale carries every page in the shape of the Hebrew: the same fields,
// highlight icons, list lengths and numbers, no text left in English, a title
// and description that fit, and the {date} slot in the updated line.
export function validateLandingPageLocales(localeCodes) {
  const problems = [];
  for (const locale of localeCodes) {
    for (const { key } of LANDING_PAGES) {
      const source = LANDING_PAGE_LOCALES.he[key];
      const english = LANDING_PAGE_LOCALES.en[key];
      const content = LANDING_PAGE_LOCALES[locale]?.[key];
      if (!content) {
        problems.push(`${locale}: landing page "${key}" is missing`);
        continue;
      }
      const walk = (from, value, inEnglish, at) => {
        if (typeof from === "string") {
          if (typeof value !== "string" || !value.trim()) problems.push(`${locale}: ${at} is missing`);
          else if (at.endsWith(".icon") || at.endsWith(".type")) {
            if (value !== from) problems.push(`${locale}: ${at} must be "${from}"`);
          } else {
            if (numbersOf(value) !== numbersOf(from)) problems.push(`${locale}: ${at} numbers differ from Hebrew`);
            if (locale !== "en" && value === inEnglish && !BRAND_ONLY.test(value) && !at.endsWith(".mentionsName")) problems.push(`${locale}: ${at} is still the English text`);
            if (value.includes("—")) problems.push(`${locale}: ${at} has an em dash`);
            if (NON_LATIN.has(locale)) {
              const latin = (value.replace("{date}", "").match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g) || []).filter((word) => !LATIN_ALLOWED.has(word));
              if (latin.length) problems.push(`${locale}: ${at} has Latin words (${latin.join(", ")})`);
            }
            for (const pattern of FORBIDDEN[locale] || []) {
              if (pattern.test(value)) problems.push(`${locale}: ${at} says ${pattern}, a claim the product does not make`);
            }
          }
        } else if (Array.isArray(from)) {
          if (!Array.isArray(value) || value.length !== from.length) problems.push(`${locale}: ${at} needs ${from.length} items`);
          else from.forEach((item, i) => walk(item, value[i], inEnglish?.[i], `${at}[${i}]`));
        } else {
          for (const field of Object.keys(from)) walk(from[field], value?.[field], inEnglish?.[field], `${at}.${field}`);
        }
      };
      walk(source, content, english, key);
      for (const [field, limit] of Object.entries(LIMITS)) {
        const length = typeof content[field] === "string" ? displayLength(content[field]) : 0;
        if (length > limit) problems.push(`${locale}: ${key}.${field} is ${length} characters, at most ${limit}`);
      }
      if (!String(content.updatedLabel || "").includes("{date}")) problems.push(`${locale}: ${key}.updatedLabel needs the {date} slot`);
    }
  }
  return problems;
}
