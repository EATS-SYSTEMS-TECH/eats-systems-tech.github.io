// scripts/llms-txt.mjs
// /llms.txt (llmstxt.org): a short Markdown map of wifigate.io for AI
// assistants and agents, built from the same English copy as the pages so it
// never drifts from the site.

import { BRAND_ALTERNATE_NAMES, SITE_ORIGIN, SOCIAL_PROFILES, SUPPORT_EMAIL, WHATSAPP_URL } from "./seo.mjs";

export function buildLlmsTxt({ homeCopy, homeSeo, niches, pageUrl }) {
  const lines = [
    "# WIFIGATE",
    "",
    `> ${homeSeo.seoDescription}`,
    "",
    `WIFIGATE is also written ${BRAND_ALTERNATE_NAMES.join(", ")}: all of them are this product and wifigate.io.`,
    "",
    `${homeCopy.platform.subtitle} It is made by EATS SYSTEMS TECH (Israel). ${homeCopy.platform.features.map((feature) => `${feature.title}: ${feature.text}`).join(" ")}`,
    "",
    `The website is published in 39 languages; every page has a language version at /<language>/ (for example ${pageUrl("he", "home")}).`,
    "",
    "## Product",
    "",
    `- [WIFIGATE home](${pageUrl("en", "home")}): what WIFIGATE is, how it works, use cases and FAQ.`,
    `- [WIFIGATE Host](${pageUrl("en", "automation")}): ${homeCopy.automation.subtitle}`,
    "",
    "## Use cases",
    "",
    ...niches.map((niche) => `- [${niche.content.label}](${pageUrl("en", niche.key)}): ${niche.content.seoDescription}`),
    "",
    "## FAQ",
    "",
    ...homeCopy.faq.items.flatMap((item) => [`### ${item.question}`, "", item.answer, ""]),
    "## Company and contact",
    "",
    `- Operator: EATS SYSTEMS TECH, Israel. Email: ${SUPPORT_EMAIL}. WhatsApp: ${WHATSAPP_URL}`,
    `- [Contact us](${SITE_ORIGIN}/contact-us/)`,
    ...SOCIAL_PROFILES.map((profile) => `- ${profile}`),
    "",
    "## Optional",
    "",
    `- [Privacy Policy](${pageUrl("en", "privacy-policy")})`,
    `- [Terms and Conditions](${pageUrl("en", "terms-and-conditions")})`,
    `- [Accessibility Statement](${pageUrl("en", "accessibility")})`,
    `- [Sitemap](${SITE_ORIGIN}/sitemap.xml)`,
    "",
  ];
  return lines.join("\n");
}
