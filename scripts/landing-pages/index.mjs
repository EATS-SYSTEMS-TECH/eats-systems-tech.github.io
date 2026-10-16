// scripts/landing-pages/index.mjs
// Landing pages: the use-case page design for one search topic, in every
// language, with the site's header, language menu and footer. The site never
// links to them (no menu entry, homepage card or related link); people arrive
// from search. scripts/verify-site.mjs checks that.
//
// One file per locale exporting { <key>: { label, eyebrow, title, heroLead,
// highlights[3], bullets[8], seoTitle, seoDescription, imageAlt, faq[] } }.
// he.mjs is the source: every other locale says what it says.
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

export const LANDING_PAGES = [
  { key: "shabbat-clock-electric-gate", image: nicheImage("electric-gates") },
];

// Brand names are the only text that may stay as it is in English.
const BRAND_ONLY = /^(?:WIFIGATE|WhatsApp|[\d\s.,:%|+-])+$/;
const numbersOf = (text) => (text.match(/\d+/g) || []).sort().join(",");

// Every locale carries every page in the shape of the Hebrew: the same fields,
// highlight icons, list lengths and numbers, and no text left in English.
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
          else if (!at.endsWith(".icon") && numbersOf(value) !== numbersOf(from)) problems.push(`${locale}: ${at} numbers differ from Hebrew`);
          else if (at.endsWith(".icon") && value !== from) problems.push(`${locale}: ${at} must be "${from}"`);
          else if (locale !== "en" && value === inEnglish && !BRAND_ONLY.test(value) && !at.endsWith(".icon")) problems.push(`${locale}: ${at} is still the English text`);
        } else if (Array.isArray(from)) {
          if (!Array.isArray(value) || value.length !== from.length) problems.push(`${locale}: ${at} needs ${from.length} items`);
          else from.forEach((item, i) => walk(item, value[i], inEnglish?.[i], `${at}[${i}]`));
        } else {
          for (const field of Object.keys(from)) walk(from[field], value?.[field], inEnglish?.[field], `${at}.${field}`);
        }
      };
      walk(source, content, english, key);
    }
  }
  return problems;
}
