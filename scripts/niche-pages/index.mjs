// scripts/niche-pages/index.mjs
// Shared configuration + per-locale content for the niche/use-case pages and
// the homepage "where" section.
//
// Each locale lives in its own file (en.mjs, he.mjs, ...) exporting:
//   home:   { seoTitle, seoDescription, keywords? }   homepage SEO
//   where:  { title, subtitle }                       homepage section header
//   niches: { <key>: { label, title, paragraph, bullets[], seoTitle,
//                      seoDescription, imageAlt } }   one entry per niche
//
// Slugs stay in English across every locale. URLs:
//   English: /<key>/
//   Others : /<locale>/<key>/
//
// legacyKeys are old routes that must keep working; the build writes a
// redirect page for each of them in every locale.

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

// Homepage card order is the canonical order of this array.
export const NICHE_DEFINITIONS = [
  {
    key: "hotels-airbnb",
    legacyKeys: ["hotels", "where-story-hotels"],
    image: {
      hero: "assets/wifigate_niche_pages/hotels-airbnb-v2-app-hero.webp",
      card: "assets/wifigate_niche_pages/hotels-airbnb-v2-app-card.webp",
      og: "assets/wifigate_niche_pages/hotels-airbnb-v2-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "roller-shutters",
    legacyKeys: ["where-story-roller-shutters"],
    image: {
      hero: "assets/wifigate_niche_pages/roller-shutters-app-hero.webp",
      card: "assets/wifigate_niche_pages/roller-shutters-app-card.webp",
      og: "assets/wifigate_niche_pages/roller-shutters-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "electric-gates",
    legacyKeys: ["where-story-electric-gates"],
    image: {
      hero: "assets/wifigate_niche_pages/electric-gates-app-hero.webp",
      card: "assets/wifigate_niche_pages/electric-gates-app-card.webp",
      og: "assets/wifigate_niche_pages/electric-gates-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "garage-doors",
    legacyKeys: [],
    image: {
      hero: "assets/wifigate_niche_pages/garage-doors-app-hero.webp",
      card: "assets/wifigate_niche_pages/garage-doors-app-card.webp",
      og: "assets/wifigate_niche_pages/garage-doors-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "private-homes",
    legacyKeys: ["where-story-private-homes"],
    image: {
      hero: "assets/wifigate_niche_pages/private-homes-app-hero.webp",
      card: "assets/wifigate_niche_pages/private-homes-app-card.webp",
      og: "assets/wifigate_niche_pages/private-homes-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "residential-buildings",
    legacyKeys: ["residential-complexes", "where-story-residential-complexes"],
    // Deliberate design touch: leave the centre tile of the 3x3 benefits grid
    // empty. Only takes effect when the niche has exactly 8 bullets, so the
    // hole lands in the middle cell.
    image: {
      hero: "assets/wifigate_niche_pages/residential-buildings-app-hero.webp",
      card: "assets/wifigate_niche_pages/residential-buildings-app-card.webp",
      og: "assets/wifigate_niche_pages/residential-buildings-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "office-buildings",
    legacyKeys: ["where-story-office-buildings"],
    image: {
      hero: "assets/wifigate_niche_pages/office-buildings-app-hero.webp",
      card: "assets/wifigate_niche_pages/office-buildings-app-card.webp",
      og: "assets/wifigate_niche_pages/office-buildings-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "entry-doors-magnetic-locks",
    legacyKeys: ["magnetic-locks", "entrance-doors-and-magnetic-locks", "where-story-magnetic-locks"],
    image: {
      hero: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-app-hero.webp",
      card: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-app-card.webp",
      og: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 960,
      cardWidth: 640,
      cardHeight: 480,
    },
  },
  {
    key: "sports-facilities",
    legacyKeys: ["where-story-sports-facilities"],
    image: {
      hero: "assets/wifigate_niche_pages/sports-facilities-app-hero.webp",
      card: "assets/wifigate_niche_pages/sports-facilities-app-card.webp",
      og: "assets/wifigate_niche_pages/sports-facilities-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "storage-lockers",
    legacyKeys: [],
    image: {
      hero: "assets/wifigate_niche_pages/storage-lockers-app-hero.webp",
      card: "assets/wifigate_niche_pages/storage-lockers-app-card.webp",
      og: "assets/wifigate_niche_pages/storage-lockers-app-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
];

export const NICHE_KEYS = NICHE_DEFINITIONS.map((niche) => niche.key);

export const NICHE_PAGE_LOCALES = {
  en,
  he,
  es,
  fr,
  de,
  nl,
  it,
  pt,
  pl,
  no,
  cs,
  ru,
  uk,
  tr,
  ar,
  hi,
  bn,
  mr,
  te,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja,
  ko,
  da,
  sv,
  hu,
  el,
  ro,
  hr,
  fi,
  bg,
  sr,
  sk,
  sl,
  id,
  th,
  vi,
  ms,
  fil,
};

const REQUIRED_NICHE_FIELDS = [
  "faq",
  "label",
  "title",
  "paragraph",
  "bullets",
  "seoTitle",
  "seoDescription",
  "imageAlt",
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Returns a list of human-readable problems; empty when every requested locale
// fully covers the model. The build fails on any problem so a partially
// translated locale can never silently fall back to English text.
// A text left in English on a non-English page: anything but brand names.
const BRAND_ONLY = /^(?:WIFIGATE(?: Host| API)?|Airbnb|SIM|API|WhatsApp|[ds.,:%|+-])+$/;
function englishLeftovers(locale, content) {
  const leftovers = [];
  const walk = (value, english, at) => {
    if (typeof value === "string") {
      if (value === english && !BRAND_ONLY.test(value) && !/(?:^|.)icon$/.test(at)) leftovers.push(at);
    } else if (value && typeof value === "object") {
      for (const key of Object.keys(value)) walk(value[key], english?.[key], at ? `${at}.${key}` : key);
    }
  };
  walk(content.niches, NICHE_PAGE_LOCALES.en.niches, "niches");
  return leftovers.map((at) => `${locale}: ${at} is still the English text`);
}

export function validateNichePageLocales(localeCodes) {
  const problems = [];
  const englishContent = JSON.stringify(NICHE_PAGE_LOCALES.en);

  for (const locale of localeCodes) {
    const content = NICHE_PAGE_LOCALES[locale];
    if (content && locale !== "en") problems.push(...englishLeftovers(locale, content));
    if (!content) {
      problems.push(`${locale}: missing locale content file`);
      continue;
    }

    if (locale !== "en" && JSON.stringify(content) === englishContent) {
      problems.push(`${locale}: locale content is identical to English fallback`);
    }

    if (!isNonEmptyString(content.home?.seoTitle)) {
      problems.push(`${locale}: home.seoTitle is missing`);
    }
    if (!isNonEmptyString(content.home?.seoDescription)) {
      problems.push(`${locale}: home.seoDescription is missing`);
    }
    if (!isNonEmptyString(content.where?.title)) {
      problems.push(`${locale}: where.title is missing`);
    }
    if (!isNonEmptyString(content.where?.subtitle)) {
      problems.push(`${locale}: where.subtitle is missing`);
    }

    for (const key of NICHE_KEYS) {
      const niche = content.niches?.[key];
      if (!niche) {
        problems.push(`${locale}: niches["${key}"] is missing`);
        continue;
      }

      for (const field of REQUIRED_NICHE_FIELDS) {
        const value = niche[field];
        if (field === "faq") {
          if (!Array.isArray(value) || value.length < 3 || !value.every((item) => isNonEmptyString(item?.question) && isNonEmptyString(item?.answer))) {
            problems.push(`${locale}: niches["${key}"].faq needs at least 3 questions with answers`);
          }
        } else if (field === "bullets") {
          if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
            problems.push(`${locale}: niches["${key}"].bullets must be a non-empty list of strings`);
          }
        } else if (!isNonEmptyString(value)) {
          problems.push(`${locale}: niches["${key}"].${field} is missing`);
        }
      }
    }
  }

  return problems;
}
