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

const NICHE_MARKETING_OVERRIDES = {
  en: {
    electricGatesSentence: {
      from: "The system is designed for local, secure, and private operation, with no monthly subscription or recurring payment, and you can keep using existing remotes alongside app control.",
      to: "The system is designed for secure, private, encrypted operation, with no monthly subscription or recurring payment, and you can keep using existing remotes alongside app control.",
    },
    electricGatesPrivacyBullet: "Privacy, security, and encrypted access management",
    garageDoorsPrivacyBullet: "A more private and secure way to manage access",
  },
  bn: {
    electricGatesSentence: {
      from: "সিস্টেমটি লোকাল, নিরাপদ ও প্রাইভেসি-সচেতনভাবে কাজ করার জন্য তৈরি — কোনো মাসিক সাবস্ক্রিপশন বা নিয়মিত পেমেন্ট নেই, আর অ্যাপের পাশাপাশি আগের রিমোটগুলোও ব্যবহার চালিয়ে যাওয়া যায়।",
      to: "সিস্টেমটি নিরাপদ, প্রাইভেট ও এনক্রিপ্টেডভাবে কাজ করার জন্য তৈরি — কোনো মাসিক সাবস্ক্রিপশন বা নিয়মিত পেমেন্ট নেই, আর অ্যাপের পাশাপাশি আগের রিমোটগুলোও ব্যবহার চালিয়ে যাওয়া যায়।",
    },
    electricGatesPrivacyBullet: "প্রাইভেসি, নিরাপত্তা ও এনক্রিপ্টেড অ্যাক্সেস ব্যবস্থাপনা",
    garageDoorsPrivacyBullet: "অ্যাক্সেস ব্যবস্থাপনার আরও প্রাইভেট ও নিরাপদ উপায়",
  },
  cs: {
    electricGatesSentence: {
      from: "Systém je navržen pro lokální, bezpečný a soukromý provoz bez měsíčního předplatného či pravidelných plateb a vedle ovládání z aplikace můžete dál používat i stávající ovladače.",
      to: "Systém je navržen pro bezpečný, soukromý a šifrovaný provoz bez měsíčního předplatného či pravidelných plateb a vedle ovládání z aplikace můžete dál používat i stávající ovladače.",
    },
    electricGatesPrivacyBullet: "Soukromí, bezpečnost a šifrovaná správa přístupu",
  },
  da: {
    electricGatesSentence: {
      from: "Systemet er designet til lokal, sikker og privat drift uden månedligt abonnement, og eksisterende fjernbetjeninger kan fortsat bruges sammen med appen.",
      to: "Systemet er designet til sikker, privat og krypteret drift uden månedligt abonnement, og eksisterende fjernbetjeninger kan fortsat bruges sammen med appen.",
    },
    garageDoorsPrivacyBullet: "En mere privat og sikker løsning til adgangsstyring",
  },
  de: {
    electricGatesSentence: {
      from: "Das System ist auf lokalen, sicheren und privaten Betrieb ausgelegt – ohne monatliches Abo und ohne laufende Gebühren – und vorhandene Handsender lassen sich parallel zur App weiterverwenden.",
      to: "Das System ist auf sicheren, privaten und verschlüsselten Betrieb ausgelegt – ohne monatliches Abo und ohne laufende Gebühren – und vorhandene Handsender lassen sich parallel zur App weiterverwenden.",
    },
    electricGatesPrivacyBullet: "Privatsphäre, Sicherheit und verschlüsselte Zugangsverwaltung",
    garageDoorsPrivacyBullet: "Eine privatere und sicherere Art, den Zutritt zu verwalten",
  },
  es: {
    electricGatesSentence: {
      from: "El sistema está diseñado para funcionar de forma local, segura y privada, sin suscripción mensual ni pagos recurrentes, y se pueden seguir usando los controles remotos existentes junto con el control desde la aplicación.",
      to: "El sistema está diseñado para funcionar de forma segura, privada y cifrada, sin suscripción mensual ni pagos recurrentes, y se pueden seguir usando los controles remotos existentes junto con el control desde la aplicación.",
    },
    electricGatesPrivacyBullet: "Privacidad, seguridad y gestión de acceso cifrada",
    garageDoorsPrivacyBullet: "Una forma más privada y segura de gestionar los accesos",
  },
  fr: {
    electricGatesSentence: {
      from: "Le système est conçu pour un fonctionnement local, sécurisé et respectueux de la vie privée, sans abonnement mensuel ni prélèvement récurrent, et vous pouvez continuer à utiliser vos télécommandes existantes en parallèle de l'application.",
      to: "Le système est conçu pour un fonctionnement sécurisé, privé et chiffré, sans abonnement mensuel ni prélèvement récurrent, et vous pouvez continuer à utiliser vos télécommandes existantes en parallèle de l'application.",
    },
    electricGatesPrivacyBullet: "Confidentialité, sécurité et gestion d'accès chiffrée",
    garageDoorsPrivacyBullet: "Une gestion des accès plus privée et plus sécurisée",
  },
  hi: {
    electricGatesPrivacyBullet: "गोपनीयता, सुरक्षा और एन्क्रिप्टेड एक्सेस प्रबंधन",
  },
  it: {
    electricGatesSentence: {
      from: "Il sistema è progettato per funzionare in locale, in modo sicuro e riservato, senza abbonamento mensile né costi ricorrenti, e puoi continuare a usare i telecomandi esistenti insieme al controllo dall'app.",
      to: "Il sistema è progettato per funzionare in modo sicuro, privato e crittografato, senza abbonamento mensile né costi ricorrenti, e puoi continuare a usare i telecomandi esistenti insieme al controllo dall'app.",
    },
    electricGatesPrivacyBullet: "Privacy, sicurezza e gestione degli accessi crittografata",
    garageDoorsPrivacyBullet: "Un modo più privato e sicuro di gestire gli accessi",
  },
  ja: {
    electricGatesPrivacyBullet: "プライバシー・セキュリティ・暗号化されたアクセス管理",
  },
  ko: {
    electricGatesPrivacyBullet: "개인정보 보호, 보안 및 암호화된 출입 관리",
  },
  mr: {
    electricGatesPrivacyBullet: "गोपनीयता, सुरक्षा आणि एन्क्रिप्टेड प्रवेश व्यवस्थापन",
  },
  nl: {
    electricGatesPrivacyBullet: "Privacy, veiligheid en versleuteld toegangsbeheer",
    garageDoorsPrivacyBullet: "Een meer private en veilige manier om toegang te beheren",
  },
  no: {
    electricGatesSentence: {
      from: "Systemet er laget for lokal, sikker og privat drift, uten månedsabonnement eller faste trekk, og eksisterende fjernkontroller kan brukes videre ved siden av appen.",
      to: "Systemet er laget for sikker, privat og kryptert drift, uten månedsabonnement eller faste trekk, og eksisterende fjernkontroller kan brukes videre ved siden av appen.",
    },
    electricGatesPrivacyBullet: "Personvern, sikkerhet og kryptert adgangsstyring",
    garageDoorsPrivacyBullet: "En mer privat og sikker måte å styre adgang på",
  },
  pl: {
    electricGatesSentence: {
      from: "System jest zaprojektowany do pracy lokalnej, bezpiecznej i dbającej o prywatność, bez miesięcznego abonamentu i opłat cyklicznych, a dotychczasowe piloty mogą dalej działać równolegle ze sterowaniem z aplikacji.",
      to: "System jest zaprojektowany do bezpiecznej, prywatnej i szyfrowanej pracy, bez miesięcznego abonamentu i opłat cyklicznych, a dotychczasowe piloty mogą dalej działać równolegle ze sterowaniem z aplikacji.",
    },
    electricGatesPrivacyBullet: "Prywatność, bezpieczeństwo i szyfrowane zarządzanie dostępem",
    garageDoorsPrivacyBullet: "Bardziej prywatny i bezpieczny sposób zarządzania dostępem",
  },
  pt: {
    electricGatesSentence: {
      from: "O sistema foi concebido para funcionar de forma local, segura e privada, sem mensalidades nem débitos diretos, e é possível continuar a usar os comandos existentes em paralelo com o controlo pela aplicação.",
      to: "O sistema foi concebido para funcionar de forma segura, privada e criptografada, sem mensalidades nem débitos diretos, e é possível continuar a usar os comandos existentes em paralelo com o controlo pela aplicação.",
    },
    electricGatesPrivacyBullet: "Privacidade, segurança e gestão de acessos criptografada",
    garageDoorsPrivacyBullet: "Uma forma mais privada e segura de gerir acessos",
  },
  "zh-Hans": {
    electricGatesSentence: {
      from: "系统面向本地、安全、注重隐私的运行方式，无需月费，也可继续配合现有遥控器使用。",
      to: "系统以安全、私密、加密的方式运行，无需月费，也可继续配合现有遥控器使用。",
    },
    electricGatesPrivacyBullet: "隐私、安全与加密访问管理",
    garageDoorsPrivacyBullet: "更私密、更安全的访问管理方式",
  },
  "zh-Hant": {
    electricGatesPrivacyBullet: "隱私、安全與加密存取管理",
  },
};

function applyNicheMarketingOverrides(locale, content) {
  const override = NICHE_MARKETING_OVERRIDES[locale];
  if (!override || !content?.niches) {
    return;
  }

  const electricGates = content.niches["electric-gates"];
  if (electricGates?.paragraph && override.electricGatesSentence) {
    electricGates.paragraph = electricGates.paragraph.replace(
      override.electricGatesSentence.from,
      override.electricGatesSentence.to
    );
  }
  if (
    electricGates?.bullets &&
    Array.isArray(electricGates.bullets) &&
    typeof override.electricGatesPrivacyBullet === "string" &&
    electricGates.bullets.length > 9
  ) {
    electricGates.bullets[9] = override.electricGatesPrivacyBullet;
  }

  const garageDoors = content.niches["garage-doors"];
  if (
    garageDoors?.bullets &&
    Array.isArray(garageDoors.bullets) &&
    typeof override.garageDoorsPrivacyBullet === "string" &&
    garageDoors.bullets.length > 6
  ) {
    garageDoors.bullets[6] = override.garageDoorsPrivacyBullet;
  }
}

Object.entries(NICHE_PAGE_LOCALES).forEach(([locale, content]) => {
  applyNicheMarketingOverrides(locale, content);
});

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
