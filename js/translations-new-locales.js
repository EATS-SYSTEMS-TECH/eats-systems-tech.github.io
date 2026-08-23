// Core UI translations for the additional portal locales.
// The remaining page copy intentionally inherits English until full locale
// translation bundles are added.
(function () {
  if (typeof translations === "undefined") {
    return;
  }

  function merge(base, override) {
    Object.keys(override).forEach((key) => {
      const value = override[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        base[key] = merge(base[key] || {}, value);
      } else {
        base[key] = value;
      }
    });
    return base;
  }

  const copies = {
    el: {
      nav: { home: "Αρχική", features: "Πλεονεκτήματα", about: "Οδηγοί", contact: "Επικοινωνία" },
      hero: { rotator: { phrases: ["Εύκολο στη χρήση", "Πλήρης ιδιωτικότητα", "Χωρίς συνδρομές"] }, subtitle: "Έξυπνος έλεγχος πρόσβασης για πύλες, κτίρια, εισόδους στάθμευσης και ιδιωτικές κατοικίες. Ασφαλής, ιδιωτικός, κρυπτογραφημένος και χωρίς μηνιαίες χρεώσεις." },
      action: { title: "Πού είναι κατάλληλο το WIFIGATE;" },
      tabs: { why: "Γιατί", where: "Πού" },
      contact: { title: "Επικοινωνήστε μαζί μας", ctaButton: "WhatsApp" },
      footer: { terms: "Όροι και προϋποθέσεις", privacy: "Πολιτική απορρήτου", cookies: "Cookies" },
    },
    ro: {
      nav: { home: "Acasă", features: "Avantaje", about: "Tutoriale", contact: "Contact" },
      hero: { rotator: { phrases: ["Ușor de utilizat", "Confidențialitate totală", "Fără abonamente"] }, subtitle: "Control inteligent al accesului pentru porți, clădiri, intrări de parcare și locuințe private. Sigur, privat, criptat și fără taxe lunare." },
      action: { title: "Unde este potrivit WIFIGATE?" },
      tabs: { why: "De ce", where: "Unde" },
      contact: { title: "Contactați-ne", ctaButton: "WhatsApp" },
      footer: { terms: "Termeni și condiții", privacy: "Politica de confidențialitate", cookies: "Cookie-uri" },
    },
    hr: {
      nav: { home: "Početna", features: "Prednosti", about: "Vodiči", contact: "Kontakt" },
      hero: { rotator: { phrases: ["Jednostavno za upotrebu", "Potpuna privatnost", "Bez pretplata"] }, subtitle: "Pametna kontrola pristupa za vrata, zgrade, parkirališta i privatne domove. Sigurna, privatna, šifrirana i bez mjesečnih naknada." },
      action: { title: "Gdje je WIFIGATE prikladan?" },
      tabs: { why: "Zašto", where: "Gdje" },
      contact: { title: "Kontaktirajte nas", ctaButton: "WhatsApp" },
      footer: { terms: "Uvjeti i odredbe", privacy: "Pravila privatnosti", cookies: "Kolačići" },
    },
    fi: {
      nav: { home: "Etusivu", features: "Edut", about: "Oppaat", contact: "Yhteystiedot" },
      hero: { rotator: { phrases: ["Helppo käyttää", "Täysi yksityisyys", "Ei tilauksia"] }, subtitle: "Älykäs kulunvalvonta porteille, rakennuksiin, pysäköintisisäänkäynneille ja koteihin. Turvallinen, yksityinen, salattu ja ilman kuukausimaksuja." },
      action: { title: "Missä WIFIGATE sopii käyttöön?" },
      tabs: { why: "Miksi", where: "Missä" },
      contact: { title: "Ota yhteyttä", ctaButton: "WhatsApp" },
      footer: { terms: "Käyttöehdot", privacy: "Tietosuojakäytäntö", cookies: "Evästeet" },
    },
    bg: {
      nav: { home: "Начало", features: "Предимства", about: "Ръководства", contact: "Контакти" },
      hero: { rotator: { phrases: ["Лесно използване", "Пълна поверителност", "Без абонаменти"] }, subtitle: "Интелигентен контрол на достъпа за портали, сгради, паркинги и частни домове. Сигурен, личен, криптиран и без месечни такси." },
      action: { title: "За какво е подходящ WIFIGATE?" },
      tabs: { why: "Защо", where: "Къде" },
      contact: { title: "Свържете се с нас", ctaButton: "WhatsApp" },
      footer: { terms: "Общи условия", privacy: "Политика за поверителност", cookies: "Бисквитки" },
    },
    sr: {
      nav: { home: "Početna", features: "Prednosti", about: "Vodiči", contact: "Kontakt" },
      hero: { rotator: { phrases: ["Jednostavno za korišćenje", "Potpuna privatnost", "Bez pretplate"] }, subtitle: "Pametna kontrola pristupa za kapije, zgrade, parkinge i privatne domove. Bezbedno, privatno, šifrovano i bez mesečnih naknada." },
      action: { title: "Gde je WIFIGATE pogodan?" },
      tabs: { why: "Zašto", where: "Gde" },
      contact: { title: "Kontaktirajte nas", ctaButton: "WhatsApp" },
      footer: { terms: "Uslovi korišćenja", privacy: "Politika privatnosti", cookies: "Kolačići" },
    },
    sk: {
      nav: { home: "Domov", features: "Výhody", about: "Návody", contact: "Kontakt" },
      hero: { rotator: { phrases: ["Jednoduché používanie", "Úplné súkromie", "Bez predplatného"] }, subtitle: "Inteligentné riadenie prístupu pre brány, budovy, parkoviská a súkromné domy. Bezpečné, súkromné, šifrované a bez mesačných poplatkov." },
      action: { title: "Kde je WIFIGATE vhodný?" },
      tabs: { why: "Prečo", where: "Kde" },
      contact: { title: "Kontaktujte nás", ctaButton: "WhatsApp" },
      footer: { terms: "Obchodné podmienky", privacy: "Zásady ochrany súkromia", cookies: "Cookies" },
    },
    sl: {
      nav: { home: "Domov", features: "Prednosti", about: "Vodiči", contact: "Stik" },
      hero: { rotator: { phrases: ["Enostavna uporaba", "Popolna zasebnost", "Brez naročnin"] }, subtitle: "Pametno upravljanje dostopa za vrata, stavbe, parkirišča in zasebne domove. Varno, zasebno, šifrirano in brez mesečnih stroškov." },
      action: { title: "Kje je WIFIGATE primeren?" },
      tabs: { why: "Zakaj", where: "Kje" },
      contact: { title: "Stopite v stik z nami", ctaButton: "WhatsApp" },
      footer: { terms: "Pogoji in določila", privacy: "Pravilnik o zasebnosti", cookies: "Piškotki" },
    },
    id: {
      nav: { home: "Beranda", features: "Keunggulan", about: "Tutorial", contact: "Kontak" },
      hero: { rotator: { phrases: ["Mudah digunakan", "Privasi penuh", "Tanpa langganan"] }, subtitle: "Kontrol akses cerdas untuk gerbang, gedung, pintu masuk parkir, dan rumah pribadi. Aman, privat, terenkripsi, dan tanpa biaya bulanan." },
      action: { title: "Di mana WIFIGATE cocok digunakan?" },
      tabs: { why: "Mengapa", where: "Di mana" },
      contact: { title: "Hubungi kami", ctaButton: "WhatsApp" },
      footer: { terms: "Syarat dan ketentuan", privacy: "Kebijakan privasi", cookies: "Cookie" },
    },
    th: {
      nav: { home: "หน้าแรก", features: "ข้อดี", about: "คู่มือ", contact: "ติดต่อเรา" },
      hero: { rotator: { phrases: ["ใช้งานง่าย", "ความเป็นส่วนตัวเต็มรูปแบบ", "ไม่มีค่าบริการรายเดือน"] }, subtitle: "ระบบควบคุมการเข้าออกอัจฉริยะสำหรับประตูรั้ว อาคาร ทางเข้าออกลานจอดรถ และบ้านส่วนตัว ปลอดภัย เป็นส่วนตัว เข้ารหัส และไม่มีค่าบริการรายเดือน" },
      action: { title: "WIFIGATE เหมาะกับการใช้งานที่ใด?" },
      tabs: { why: "ทำไม", where: "ที่ไหน" },
      contact: { title: "ติดต่อเรา", ctaButton: "WhatsApp" },
      footer: { terms: "ข้อกำหนดและเงื่อนไข", privacy: "นโยบายความเป็นส่วนตัว", cookies: "คุกกี้" },
    },
    vi: {
      nav: { home: "Trang chủ", features: "Ưu điểm", about: "Hướng dẫn", contact: "Liên hệ" },
      hero: { rotator: { phrases: ["Dễ sử dụng", "Riêng tư toàn diện", "Không thuê bao"] }, subtitle: "Kiểm soát ra vào thông minh cho cổng, tòa nhà, lối vào bãi đỗ xe và nhà riêng. An toàn, riêng tư, được mã hóa và không có phí hàng tháng." },
      action: { title: "WIFIGATE phù hợp ở đâu?" },
      tabs: { why: "Tại sao", where: "Ở đâu" },
      contact: { title: "Liên hệ với chúng tôi", ctaButton: "WhatsApp" },
      footer: { terms: "Điều khoản và điều kiện", privacy: "Chính sách bảo mật", cookies: "Cookie" },
    },
    ms: {
      nav: { home: "Laman utama", features: "Kelebihan", about: "Tutorial", contact: "Hubungi kami" },
      hero: { rotator: { phrases: ["Mudah digunakan", "Privasi penuh", "Tiada langganan"] }, subtitle: "Kawalan akses pintar untuk pintu pagar, bangunan, pintu masuk parkir dan rumah persendirian. Selamat, peribadi, disulitkan dan tanpa bayaran bulanan." },
      action: { title: "Di manakah WIFIGATE sesuai digunakan?" },
      tabs: { why: "Mengapa", where: "Di mana" },
      contact: { title: "Hubungi kami", ctaButton: "WhatsApp" },
      footer: { terms: "Terma dan syarat", privacy: "Dasar privasi", cookies: "Kuki" },
    },
    fil: {
      nav: { home: "Home", features: "Mga kalamangan", about: "Mga tutorial", contact: "Makipag-ugnayan" },
      hero: { rotator: { phrases: ["Madaling gamitin", "Ganap na pribado", "Walang subscription"] }, subtitle: "Matalinong kontrol sa access para sa mga gate, gusali, parking entrance, at pribadong bahay. Ligtas, pribado, naka-encrypt, at walang buwanang bayarin." },
      action: { title: "Saan angkop gamitin ang WIFIGATE?" },
      tabs: { why: "Bakit", where: "Saan" },
      contact: { title: "Makipag-ugnayan sa amin", ctaButton: "WhatsApp" },
      footer: { terms: "Mga tuntunin at kundisyon", privacy: "Patakaran sa privacy", cookies: "Cookies" },
    },
  };

  Object.entries(copies).forEach(([locale, copy]) => {
    const base = JSON.parse(JSON.stringify(translations.en));
    translations[locale] = merge(base, copy);
  });

  if (translations.he) {
    translations.he.nav.features = "למה לבחור בנו?";
    translations.he.tabs.where = "שימושים";
  }
})();
