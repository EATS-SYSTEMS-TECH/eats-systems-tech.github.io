// scripts/site-languages.mjs
// The published website languages, in language-menu order: code (URL and
// hreflang), native name and flag. One list for the build, the checks and
// the language menu.

export const SITE_LANGUAGES = [
  {
    "code": "en",
    "label": "English",
    "flagSrc": "flag-us.webp",
    "flagAlt": "US"
  },
  {
    "code": "es",
    "label": "Español",
    "flagSrc": "flag-es.webp",
    "flagAlt": "ES"
  },
  {
    "code": "fr",
    "label": "Français",
    "flagSrc": "flag-fr.svg",
    "flagAlt": "FR"
  },
  {
    "code": "de",
    "label": "Deutsch",
    "flagSrc": "flag-de.svg",
    "flagAlt": "DE"
  },
  {
    "code": "he",
    "label": "עברית",
    "flagSrc": "flag-il.svg",
    "flagAlt": "IL"
  },
  {
    "code": "nl",
    "label": "Nederlands",
    "flagSrc": "flag-nl.svg",
    "flagAlt": "NL"
  },
  {
    "code": "it",
    "label": "Italiano",
    "flagSrc": "flag-it.svg",
    "flagAlt": "IT"
  },
  {
    "code": "pt",
    "label": "Português",
    "flagSrc": "flag-pt.svg",
    "flagAlt": "PT"
  },
  {
    "code": "pl",
    "label": "Polski",
    "flagSrc": "flag-pl.svg",
    "flagAlt": "PL"
  },
  {
    "code": "no",
    "label": "Norsk",
    "flagSrc": "flag-no.svg",
    "flagAlt": "NO"
  },
  {
    "code": "cs",
    "label": "Čeština",
    "flagSrc": "flag-cz.svg",
    "flagAlt": "CZ"
  },
  {
    "code": "ru",
    "label": "Русский",
    "flagSrc": "flag-ru.svg",
    "flagAlt": "RU"
  },
  {
    "code": "uk",
    "label": "Українська",
    "flagSrc": "flag-ua.svg",
    "flagAlt": "UA"
  },
  {
    "code": "tr",
    "label": "Türkçe",
    "flagSrc": "flag-tr.svg",
    "flagAlt": "TR"
  },
  {
    "code": "ar",
    "label": "العربية",
    "flagSrc": "flag-ae.svg",
    "flagAlt": "AE"
  },
  {
    "code": "hi",
    "label": "हिन्दी",
    "flagSrc": "flag-in.svg",
    "flagAlt": "IN"
  },
  {
    "code": "bn",
    "label": "বাংলা",
    "flagSrc": "flag-in.svg",
    "flagAlt": "IN"
  },
  {
    "code": "mr",
    "label": "मराठी",
    "flagSrc": "flag-in.svg",
    "flagAlt": "IN"
  },
  {
    "code": "te",
    "label": "తెలుగు",
    "flagSrc": "flag-in.svg",
    "flagAlt": "IN"
  },
  {
    "code": "zh-Hans",
    "label": "简体中文",
    "flagSrc": "flag-cn.svg",
    "flagAlt": "CN"
  },
  {
    "code": "zh-Hant",
    "label": "繁體中文",
    "flagSrc": "flag-tw.svg",
    "flagAlt": "TW"
  },
  {
    "code": "ja",
    "label": "日本語",
    "flagSrc": "flag-jp.svg",
    "flagAlt": "JP"
  },
  {
    "code": "ko",
    "label": "한국어",
    "flagSrc": "flag-kr.svg",
    "flagAlt": "KR"
  },
  {
    "code": "da",
    "label": "Dansk",
    "flagSrc": "flag-dk.svg",
    "flagAlt": "DK"
  },
  {
    "code": "sv",
    "label": "Svenska",
    "flagSrc": "flag-se.svg",
    "flagAlt": "SE"
  },
  {
    "code": "el",
    "label": "Ελληνικά",
    "flagSrc": "flag-gr.svg",
    "flagAlt": "GR"
  },
  {
    "code": "ro",
    "label": "Română",
    "flagSrc": "flag-ro.svg",
    "flagAlt": "RO"
  },
  {
    "code": "hr",
    "label": "Hrvatski",
    "flagSrc": "flag-hr.svg",
    "flagAlt": "HR"
  },
  {
    "code": "fi",
    "label": "Suomi",
    "flagSrc": "flag-fi.svg",
    "flagAlt": "FI"
  },
  {
    "code": "bg",
    "label": "Български",
    "flagSrc": "flag-bg.svg",
    "flagAlt": "BG"
  },
  {
    "code": "sr",
    "label": "Српски",
    "flagSrc": "flag-rs.svg",
    "flagAlt": "RS"
  },
  {
    "code": "sk",
    "label": "Slovenčina",
    "flagSrc": "flag-sk.svg",
    "flagAlt": "SK"
  },
  {
    "code": "sl",
    "label": "Slovenščina",
    "flagSrc": "flag-si.svg",
    "flagAlt": "SI"
  },
  {
    "code": "id",
    "label": "Bahasa Indonesia",
    "flagSrc": "flag-id.svg",
    "flagAlt": "ID"
  },
  {
    "code": "th",
    "label": "ไทย",
    "flagSrc": "flag-th.svg",
    "flagAlt": "TH"
  },
  {
    "code": "vi",
    "label": "Tiếng Việt",
    "flagSrc": "flag-vn.svg",
    "flagAlt": "VN"
  },
  {
    "code": "ms",
    "label": "Bahasa Melayu",
    "flagSrc": "flag-my.svg",
    "flagAlt": "MY"
  },
  {
    "code": "fil",
    "label": "Filipino",
    "flagSrc": "flag-ph.svg",
    "flagAlt": "PH"
  },
  {
    "code": "hu",
    "label": "Magyar",
    "flagSrc": "flag-hu.svg",
    "flagAlt": "HU"
  }
];

export const RTL_LANGUAGES = new Set(["he", "ar"]);
