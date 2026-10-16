// scripts/landing-pages/index.mjs
// Stand-alone landing pages: one language each, in the use-case page design,
// reached from search only. No page of the site links to them, and they lead
// nowhere on the site except the legal pages that the footer, the cookie
// banner and the accessibility menu carry on every page. The build
// (buildLandingPages) writes them and scripts/verify-site.mjs checks both
// directions.
//
// Each entry: key (the URL slug, /<locale>/<key>/), locale, the hero image
// and the page copy:
//   { eyebrow, title, heroLead, highlights[3], bullets[8], seoTitle,
//     seoDescription, imageAlt, faq[] }

import { NICHE_DEFINITIONS } from "../niche-pages/index.mjs";
import shabbatClockElectricGate from "./shabbat-clock-electric-gate.he.mjs";

const nicheImage = (key) => NICHE_DEFINITIONS.find((niche) => niche.key === key).image;

export const LANDING_PAGES = [
  {
    key: "shabbat-clock-electric-gate",
    locale: "he",
    image: nicheImage("electric-gates"),
    content: shabbatClockElectricGate,
  },
];
