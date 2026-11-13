// The use-case pages under "Use Cases", in the order of the homepage list
// (templates/index.template.html, .where-list). Owner request, 13 Nov 2026.
export const USE_CASE_MENU = Object.freeze(["residential-buildings", "roller-shutters", "hotels-airbnb", "electric-gates", "garage-doors",
  "private-homes", "entry-doors-magnetic-locks", "office-buildings", "sports-facilities", "storage-lockers"]);

// Canonical homepage destinations, in the same order on every content page.
export const SITE_NAVIGATION = [
  { key: "platform", hash: "how-it-works" },
  // On hover or keyboard focus, "Use Cases" also opens its pages; in the
  // collapsed menu they are listed under it. A child without a label is named
  // by its page, in the page's language.
  { key: "solutions", hash: "use-cases", children: USE_CASE_MENU.map(pageKey => ({ pageKey })) },
  // "For Business" opens its two product pages the same way. Product names are
  // not translated. The owner asked for Manager first, then Host.
  { key: "automation", hash: "wifigate-for-business", children: [
    { label: "WIFIGATE Manager", pageKey: "wifigate-manager" },
    { label: "WIFIGATE Host", pageKey: "wifigate-host" },
  ] },
  { key: "productGuide", hash: "tutorial-videos" },
  { key: "shop", pageKey: "shop" },
  { key: "contact", hash: "get-in-touch" },
];

// The header link to the WIFIGATE Host portal sign-in, in every language.
export const SITE_LOGIN_LABELS = {
  en: "Log in", he: "התחברות", es: "Iniciar sesión", fr: "Connexion", de: "Anmelden", nl: "Inloggen",
  it: "Accedi", pt: "Iniciar sessão", pl: "Zaloguj się", no: "Logg inn", cs: "Přihlásit se", ru: "Войти",
  uk: "Увійти", tr: "Giriş yap", ar: "تسجيل الدخول", hi: "लॉग इन", bn: "লগ ইন", mr: "लॉग इन", te: "లాగిన్",
  "zh-Hans": "登录", "zh-Hant": "登入", ja: "ログイン", ko: "로그인", da: "Log ind", sv: "Logga in",
  hu: "Bejelentkezés", el: "Σύνδεση", ro: "Autentificare", hr: "Prijava", fi: "Kirjaudu", bg: "Вход",
  sr: "Пријава", sk: "Prihlásiť sa", sl: "Prijava", id: "Masuk", th: "เข้าสู่ระบบ", vi: "Đăng nhập",
  ms: "Log masuk", fil: "Mag-log in",
};
