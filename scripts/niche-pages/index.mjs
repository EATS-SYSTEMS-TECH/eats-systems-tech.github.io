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
import hu from "./hu.mjs";

// Homepage card order is the canonical order of this array.
export const NICHE_DEFINITIONS = [
  {
    key: "hotels-airbnb",
    legacyKeys: ["hotels", "where-story-hotels"],
    image: {
      hero: "assets/wifigate_niche_pages/hotels-airbnb-hero.webp",
      card: "assets/wifigate_niche_pages/hotels-airbnb-card.webp",
      og: "assets/wifigate_niche_pages/hotels-airbnb-og.jpg",
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
      hero: "assets/wifigate_niche_pages/roller-shutters-hero.webp",
      card: "assets/wifigate_niche_pages/roller-shutters-card.webp",
      og: "assets/wifigate_niche_pages/roller-shutters-og.jpg",
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
      hero: "assets/wifigate_niche_pages/electric-gates-hero.webp",
      card: "assets/wifigate_niche_pages/electric-gates-card.webp",
      og: "assets/wifigate_niche_pages/electric-gates-og.jpg",
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
      hero: "assets/wifigate_niche_pages/garage-doors-hero.webp",
      card: "assets/wifigate_niche_pages/garage-doors-card.webp",
      og: "assets/wifigate_niche_pages/garage-doors-og.jpg",
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
      hero: "assets/wifigate_niche_pages/private-homes-hero.webp",
      card: "assets/wifigate_niche_pages/private-homes-card.webp",
      og: "assets/wifigate_niche_pages/private-homes-og.jpg",
      heroWidth: 1280,
      heroHeight: 720,
      cardWidth: 640,
      cardHeight: 360,
    },
  },
  {
    key: "residential-buildings",
    legacyKeys: ["residential-complexes", "where-story-residential-complexes"],
    image: {
      hero: "assets/wifigate_niche_pages/residential-buildings-hero.webp",
      card: "assets/wifigate_niche_pages/residential-buildings-card.webp",
      og: "assets/wifigate_niche_pages/residential-buildings-og.jpg",
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
      hero: "assets/wifigate_niche_pages/office-buildings-hero.webp",
      card: "assets/wifigate_niche_pages/office-buildings-card.webp",
      og: "assets/wifigate_niche_pages/office-buildings-og.jpg",
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
      hero: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-hero.webp",
      card: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-card.webp",
      og: "assets/wifigate_niche_pages/entry-doors-magnetic-locks-og.jpg",
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
      hero: "assets/wifigate_niche_pages/sports-facilities-hero.webp",
      card: "assets/wifigate_niche_pages/sports-facilities-card.webp",
      og: "assets/wifigate_niche_pages/sports-facilities-og.jpg",
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
  hu,
};

const REQUIRED_NICHE_FIELDS = [
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
export function validateNichePageLocales(localeCodes) {
  const problems = [];
  const englishContent = JSON.stringify(NICHE_PAGE_LOCALES.en);

  for (const locale of localeCodes) {
    const content = NICHE_PAGE_LOCALES[locale];
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
        if (field === "bullets") {
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
