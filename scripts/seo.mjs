// scripts/seo.mjs
// One source for every page's <head> metadata and structured data: title,
// description, robots, canonical, hreflang, Open Graph, Twitter and a single
// JSON-LD @graph. Every page carries the same Organization, WebSite and Brand
// nodes (fixed @ids), so search engines and AI answer engines see one entity
// behind all 39 languages and every page type.

export const SITE_ORIGIN = "https://wifigate.io";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const BRAND_ID = `${SITE_ORIGIN}/#brand`;
export const LOGO_URL = `${SITE_ORIGIN}/logo-1024.png`;
// Every way people write the brand; search and answer engines match them all
// to the same WIFIGATE entity.
export const BRAND_ALTERNATE_NAMES = ["WiFi Gate", "Wi-Fi Gate", "Wifigate", "WiFiGate"];

// The profiles the footer links to; they identify the company (sameAs).
export const SOCIAL_PROFILES = [
  "https://www.facebook.com/WIFIGATE.io",
  "https://www.youtube.com/@WIFIGATE",
  "https://www.linkedin.com/company/wifigate/",
  "https://www.instagram.com/wifigate.io/",
];
export const SUPPORT_EMAIL = "support@wifigate.io";
export const WHATSAPP_URL = "https://wa.me/message/NZWNMX6V2XVHJ1";

// Open Graph wants language_TERRITORY.
const OG_LOCALES = {
  en: "en_US", he: "he_IL", es: "es_ES", fr: "fr_FR", de: "de_DE", nl: "nl_NL",
  it: "it_IT", pt: "pt_PT", pl: "pl_PL", no: "nb_NO", cs: "cs_CZ", ru: "ru_RU",
  uk: "uk_UA", tr: "tr_TR", ar: "ar_AR", hi: "hi_IN", bn: "bn_IN", mr: "mr_IN",
  te: "te_IN", "zh-Hans": "zh_CN", "zh-Hant": "zh_TW", ja: "ja_JP", ko: "ko_KR",
  da: "da_DK", sv: "sv_SE", hu: "hu_HU", el: "el_GR", ro: "ro_RO", hr: "hr_HR",
  fi: "fi_FI", bg: "bg_BG", sr: "sr_RS", sk: "sk_SK", sl: "sl_SI", id: "id_ID",
  th: "th_TH", vi: "vi_VN", ms: "ms_MY", fil: "fil_PH",
};

export function ogLocale(locale) {
  const value = OG_LOCALES[locale];
  if (!value) throw new Error(`No Open Graph locale for ${locale}`);
  return value;
}

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "EATS SYSTEMS TECH",
    legalName: "Itay Nave – Engineering and Technology Solutions",
    url: SITE_ORIGIN,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 1024, height: 1024 },
    email: SUPPORT_EMAIL,
    duns: "626518977",
    address: { "@type": "PostalAddress", addressCountry: "IL" },
    sameAs: SOCIAL_PROFILES,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        url: WHATSAPP_URL,
        availableLanguage: ["English", "Hebrew"],
      },
    ],
    brand: { "@id": BRAND_ID },
  };
}

export function brandNode({ description, slogan }) {
  return {
    "@type": "Brand",
    "@id": BRAND_ID,
    name: "WIFIGATE",
    alternateName: BRAND_ALTERNATE_NAMES,
    url: SITE_ORIGIN,
    logo: LOGO_URL,
    ...(description ? { description } : {}),
    ...(slogan ? { slogan } : {}),
  };
}

export function websiteNode(locale) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "WIFIGATE",
    alternateName: BRAND_ALTERNATE_NAMES,
    url: `${SITE_ORIGIN}/`,
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

// A WebPage node tied to the site, the publisher and the brand it is about.
export function webPageNode({ type = "WebPage", url, title, description, locale, image, breadcrumbId }) {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    about: { "@id": BRAND_ID },
    ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image.url } } : {}),
    ...(breadcrumbId ? { breadcrumb: { "@id": breadcrumbId } } : {}),
  };
}

export function breadcrumbNode(url, items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqNode(url, locale, items) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    inLanguage: locale,
    isPartOf: { "@id": `${url}#webpage` },
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function setMeta($, attribute, key, content) {
  $(`meta[${attribute}='${key}']`).remove();
  if (content === undefined || content === null || content === "") return;
  $("head").append(`\n  <meta ${attribute}="${key}" content="" />`);
  $(`meta[${attribute}='${key}']`).last().attr("content", content);
}

// Writes the whole head metadata of a page.
//   alternates: [{ hreflang, href }] (empty for pages outside a language cluster)
//   image:      { url, width?, height?, alt? }
//   graph:      page-specific JSON-LD nodes; Organization, WebSite and Brand
//               are always added.
export function setPageMeta($, {
  locale,
  url,
  title,
  description,
  robots = "index, follow",
  alternates = [],
  ogType = "website",
  image,
  brand = {},
  graph = [],
}) {
  $("title").text(title);
  setMeta($, "name", "description", description);
  setMeta($, "name", "robots", robots);
  setMeta($, "name", "googlebot", robots);

  $("link[rel='canonical']").remove();
  $("link[rel='alternate'][hreflang]").remove();
  const links = [
    `<link rel="canonical" href="${url}" />`,
    ...alternates.map((alternate) => `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`),
  ];
  $("head").append(`\n  ${links.join("\n  ")}`);

  // Open Graph / Twitter: one set, rebuilt from scratch on every page.
  $("meta[property^='og:'], meta[name^='og:'], meta[property^='twitter:'], meta[name^='twitter:']").remove();
  setMeta($, "property", "og:type", ogType);
  setMeta($, "property", "og:site_name", "WIFIGATE");
  setMeta($, "property", "og:locale", ogLocale(locale));
  for (const alternate of alternates) {
    if (alternate.hreflang === "x-default" || alternate.hreflang === locale) continue;
    $("head").append(`\n  <meta property="og:locale:alternate" content="${ogLocale(alternate.hreflang)}" />`);
  }
  setMeta($, "property", "og:url", url);
  setMeta($, "property", "og:title", title);
  setMeta($, "property", "og:description", description);
  if (image) {
    setMeta($, "property", "og:image", image.url);
    setMeta($, "property", "og:image:width", image.width);
    setMeta($, "property", "og:image:height", image.height);
    setMeta($, "property", "og:image:alt", image.alt);
  }
  setMeta($, "name", "twitter:card", "summary_large_image");
  setMeta($, "name", "twitter:title", title);
  setMeta($, "name", "twitter:description", description);
  if (image) setMeta($, "name", "twitter:image", image.url);

  $("script[type='application/ld+json']").remove();
  const data = {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), brandNode(brand), websiteNode(locale), ...graph],
  };
  $("head").append(`\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`);
}
