// Public Auto Open copy describes the arrival experience only. Every locale
// has its own copy; unsupported or incomplete locales never fall back.
export const AUTO_OPEN_PAGE_KEY = "auto-open";

// headline, then three benefit title/text pairs: hands free, arrival, permission.
const COPY = {
  en: ["Arrive. Enter. Carry on.", "Hands free", "Keep your phone in your pocket and your hands free.", "A smoother arrival", "Come in comfortably and get on with your day.", "For authorized users", "Automatic entry for people with permission to enter."],
  he: ["מגיעים. נכנסים. ממשיכים.", "הידיים נשארות פנויות", "הטלפון נשאר בכיס והידיים נשארות פנויות.", "הגעה נעימה יותר", "נכנסים בנוחות וממשיכים ביום.", "למשתמשים מורשים", "כניסה אוטומטית לאנשים שיש להם הרשאת כניסה."],
  es: ["Llega. Entra. Sigue con tu día.", "Manos libres", "Deja el teléfono en el bolsillo y mantén las manos libres.", "Una llegada más cómoda", "Entra con comodidad y sigue con tu día.", "Para usuarios autorizados", "Entrada automática para las personas que tienen permiso para entrar."],
  fr: ["Arrivez. Entrez. Poursuivez votre journée.", "Les mains libres", "Gardez votre téléphone dans votre poche et les mains libres.", "Une arrivée plus agréable", "Entrez en toute simplicité et poursuivez votre journée.", "Pour les utilisateurs autorisés", "Une entrée automatique pour les personnes autorisées à entrer."],
  de: ["Ankommen. Eintreten. Weiter geht’s.", "Die Hände bleiben frei", "Das Telefon bleibt in der Tasche und die Hände bleiben frei.", "Entspannter ankommen", "Bequem eintreten und den Tag fortsetzen.", "Für berechtigte Nutzer", "Automatischer Zutritt für Personen mit Zutrittsberechtigung."],
  nl: ["Aankomen. Binnenkomen. Verdergaan.", "Je handen vrij", "Houd je telefoon in je zak en je handen vrij.", "Prettiger aankomen", "Kom gemakkelijk binnen en ga verder met je dag.", "Voor bevoegde gebruikers", "Automatische toegang voor mensen die naar binnen mogen."],
  it: ["Arrivi. Entri. Prosegui la giornata.", "Mani libere", "Il telefono resta in tasca e le mani restano libere.", "Un arrivo più comodo", "Entra comodamente e prosegui la giornata.", "Per gli utenti autorizzati", "Ingresso automatico per le persone che hanno il permesso di entrare."],
  pt: ["Chegue. Entre. Continue o seu dia.", "Mãos livres", "Mantenha o telemóvel no bolso e as mãos livres.", "Uma chegada mais cómoda", "Entre com comodidade e continue o seu dia.", "Para utilizadores autorizados", "Entrada automática para pessoas com autorização para entrar."],
  pl: ["Przyjedź. Wejdź. Ruszaj dalej.", "Wolne ręce", "Telefon zostaje w kieszeni, a ręce pozostają wolne.", "Wygodniej od samego przyjazdu", "Wejdź wygodnie i zajmij się swoim dniem.", "Dla uprawnionych użytkowników", "Automatyczne wejście dla osób, które mają prawo wejść."],
  no: ["Kom frem. Gå inn. Fortsett dagen.", "Hendene fri", "La telefonen ligge i lommen og hold hendene fri.", "En behagelig ankomst", "Kom enkelt inn og fortsett med dagen din.", "For godkjente brukere", "Automatisk adgang for personer som har tillatelse til å gå inn."],
  cs: ["Přijďte. Vstupte. Pokračujte dál.", "Volné ruce", "Telefon zůstane v kapse a ruce zůstanou volné.", "Pohodlnější příchod", "Pohodlně vstupte a pokračujte ve svém dni.", "Pro oprávněné uživatele", "Automatický vstup pro osoby, které mají oprávnění vstoupit."],
  ru: ["Приходите. Входите. Продолжайте свой день.", "Свободные руки", "Телефон остаётся в кармане, а руки остаются свободными.", "Удобство с самого прихода", "Входите с комфортом и продолжайте заниматься своими делами.", "Для пользователей с правом входа", "Автоматический вход для тех, у кого есть разрешение на вход."],
  uk: ["Приходьте. Заходьте. Продовжуйте свій день.", "Вільні руки", "Телефон залишається в кишені, а руки залишаються вільними.", "Зручність із самого приходу", "Заходьте з комфортом і продовжуйте свої справи.", "Для користувачів із правом входу", "Автоматичний вхід для людей, які мають дозвіл на вхід."],
  tr: ["Gelin. Girin. Gününüze devam edin.", "Elleriniz serbest", "Telefonunuz cebinizde, elleriniz serbest kalsın.", "Daha rahat bir geliş", "Rahatça içeri girin ve gününüze devam edin.", "Yetkili kullanıcılar için", "Giriş izni olan kişiler için otomatik giriş."],
  ar: ["تصل. تدخل. تواصل يومك.", "يداك حرتان", "أبقِ هاتفك في جيبك ويديك حرتين.", "وصول أكثر راحة", "ادخل براحة وواصل يومك.", "للمستخدمين المصرّح لهم", "دخول تلقائي للأشخاص الذين لديهم إذن بالدخول."],
  hi: ["पहुँचें। अंदर आएँ। आगे बढ़ें।", "हाथ रहें खाली", "फ़ोन जेब में रहने दें और हाथ खाली रखें।", "पहुँचना हुआ और आसान", "आराम से अंदर आएँ और अपने दिन में आगे बढ़ें।", "अनुमति वाले उपयोगकर्ताओं के लिए", "अंदर आने की अनुमति रखने वाले लोगों के लिए अपने-आप प्रवेश।"],
  bn: ["পৌঁছান। প্রবেশ করুন। এগিয়ে চলুন।", "হাত থাকুক খালি", "ফোন পকেটেই রাখুন, হাত থাকুক খালি।", "পৌঁছেই স্বচ্ছন্দে প্রবেশ", "আরামে প্রবেশ করুন, তারপর নিজের কাজে এগিয়ে চলুন।", "অনুমোদিত ব্যবহারকারীদের জন্য", "প্রবেশের অনুমতি আছে এমন ব্যক্তিদের জন্য স্বয়ংক্রিয় প্রবেশ।"],
  mr: ["या. आत प्रवेश करा. पुढे चला.", "हात राहू द्या मोकळे", "फोन खिशातच राहू द्या आणि हात मोकळे ठेवा.", "आल्यावर सहज प्रवेश", "आरामात आत या आणि तुमचा दिवस पुढे सुरू ठेवा.", "परवानगी असलेल्या वापरकर्त्यांसाठी", "प्रवेशाची परवानगी असलेल्या व्यक्तींसाठी आपोआप प्रवेश."],
  te: ["చేరుకోండి. లోపలికి రండి. ముందుకు సాగండి.", "చేతులు ఖాళీగా ఉంచండి", "ఫోన్ జేబులోనే ఉంచి చేతులు ఖాళీగా ఉంచుకోండి.", "రాగానే సులభంగా ప్రవేశం", "సౌకర్యంగా లోపలికి వచ్చి మీ రోజువారీ పనులు కొనసాగించండి.", "అనుమతి ఉన్న వినియోగదారుల కోసం", "లోపలికి వచ్చే అనుమతి ఉన్నవారికి స్వయంచాలక ప్రవేశం."],
  "zh-Hans": ["到达。进入。继续一天的生活。", "双手自由", "手机留在口袋里，让双手保持自由。", "到达更从容", "轻松进入，继续一天的生活。", "面向授权用户", "为拥有进入权限的人员提供自动通行。"],
  "zh-Hant": ["抵達。進入。繼續一天的生活。", "雙手自由", "手機留在口袋裡，讓雙手保持自由。", "抵達更從容", "輕鬆進入，繼續一天的生活。", "供授權使用者使用", "為擁有進入權限的人員提供自動通行。"],
  ja: ["到着。そのまま入場。いつもの一日へ。", "両手は自由なまま", "スマートフォンはポケットに入れたまま、両手を自由に。", "到着からスムーズに", "気軽に入場して、そのまま一日を続けられます。", "入場を許可された方へ", "入場の許可を持つ方が自動で入場できます。"],
  ko: ["도착하고, 들어가고, 일상을 이어 가세요.", "두 손은 자유롭게", "휴대폰은 주머니에 두고 두 손은 자유롭게 쓰세요.", "더 편안한 도착", "편하게 들어와 일상을 이어 가세요.", "출입 권한이 있는 사용자에게", "출입을 허가받은 분들을 위한 자동 출입입니다."],
  da: ["Ankom. Gå ind. Fortsæt dagen.", "Hænderne fri", "Lad telefonen blive i lommen, og hold hænderne fri.", "En mere behagelig ankomst", "Kom nemt ind, og fortsæt med din dag.", "Til godkendte brugere", "Automatisk adgang for personer med tilladelse til at komme ind."],
  sv: ["Kom fram. Gå in. Fortsätt dagen.", "Händerna fria", "Låt telefonen ligga kvar i fickan och håll händerna fria.", "En behagligare ankomst", "Kom enkelt in och fortsätt med din dag.", "För behöriga användare", "Automatisk passage för personer som har tillåtelse att gå in."],
  hu: ["Megérkezik. Belép. Folytatja a napját.", "Szabadon marad a keze", "A telefon a zsebében, a keze pedig szabadon maradhat.", "Kényelmesebb érkezés", "Lépjen be kényelmesen, és folytassa a napját.", "Jogosult felhasználóknak", "Automatikus belépés a belépési jogosultsággal rendelkezőknek."],
  el: ["Φτάστε. Μπείτε. Συνεχίστε τη μέρα σας.", "Ελεύθερα χέρια", "Κρατήστε το τηλέφωνο στην τσέπη και τα χέρια σας ελεύθερα.", "Πιο άνετη άφιξη", "Μπείτε με άνεση και συνεχίστε τη μέρα σας.", "Για εξουσιοδοτημένους χρήστες", "Αυτόματη είσοδος για όσους έχουν άδεια εισόδου."],
  ro: ["Sosiți. Intrați. Continuați-vă ziua.", "Mâinile rămân libere", "Păstrați telefonul în buzunar și mâinile libere.", "O sosire mai comodă", "Intrați comod și continuați-vă ziua.", "Pentru utilizatorii autorizați", "Intrare automată pentru persoanele care au permisiunea de a intra."],
  hr: ["Dođite. Uđite. Nastavite sa svojim danom.", "Slobodne ruke", "Telefon ostaje u džepu, a ruke ostaju slobodne.", "Ugodniji dolazak", "Uđite udobno i nastavite sa svojim danom.", "Za ovlaštene korisnike", "Automatski ulazak za osobe koje imaju dopuštenje za ulazak."],
  fi: ["Saavu. Astu sisään. Jatka päivääsi.", "Kädet vapaina", "Pidä puhelin taskussa ja kädet vapaina.", "Mukavampi saapuminen", "Tule vaivattomasti sisään ja jatka päivääsi.", "Valtuutetuille käyttäjille", "Automaattinen sisäänpääsy henkilöille, joilla on lupa tulla sisään."],
  bg: ["Пристигнете. Влезте. Продължете деня си.", "Свободни ръце", "Телефонът остава в джоба, а ръцете ви остават свободни.", "По-приятно пристигане", "Влезте удобно и продължете деня си.", "За оторизирани потребители", "Автоматичен вход за хората, които имат разрешение да влизат."],
  sr: ["Дођите. Уђите. Наставите свој дан.", "Слободне руке", "Телефон остаје у џепу, а руке остају слободне.", "Пријатнији долазак", "Уђите удобно и наставите свој дан.", "За овлашћене кориснике", "Аутоматски улазак за особе које имају дозволу за улазак."],
  sk: ["Príďte. Vstúpte. Pokračujte ďalej.", "Voľné ruky", "Telefón zostane vo vrecku a ruky zostanú voľné.", "Pohodlnejší príchod", "Pohodlne vstúpte a pokračujte vo svojom dni.", "Pre oprávnených používateľov", "Automatický vstup pre ľudí, ktorí majú povolenie vstúpiť."],
  sl: ["Pridite. Vstopite. Nadaljujte svoj dan.", "Proste roke", "Telefon ostane v žepu, roke pa ostanejo proste.", "Prijetnejši prihod", "Udobno vstopite in nadaljujte svoj dan.", "Za pooblaščene uporabnike", "Samodejni vstop za osebe, ki imajo dovoljenje za vstop."],
  id: ["Tiba. Masuk. Lanjutkan hari Anda.", "Tangan tetap bebas", "Biarkan ponsel di saku dan tangan tetap bebas.", "Kedatangan lebih nyaman", "Masuk dengan nyaman dan lanjutkan kegiatan Anda.", "Untuk pengguna yang berwenang", "Masuk otomatis bagi orang yang memiliki izin masuk."],
  th: ["มาถึง เข้าได้ ใช้ชีวิตต่อ", "มือว่างได้เต็มที่", "เก็บโทรศัพท์ไว้ในกระเป๋า แล้วใช้มือได้อย่างอิสระ", "มาถึงอย่างสะดวกสบาย", "เข้าได้สะดวก แล้วไปทำสิ่งต่าง ๆ ต่อได้เลย", "สำหรับผู้ใช้ที่ได้รับอนุญาต", "เข้าอัตโนมัติสำหรับผู้ที่มีสิทธิ์เข้าใช้งาน"],
  vi: ["Đến nơi. Bước vào. Tiếp tục ngày của bạn.", "Đôi tay rảnh rang", "Giữ điện thoại trong túi và để đôi tay rảnh rang.", "Đến nơi thoải mái hơn", "Bước vào thuận tiện và tiếp tục ngày của bạn.", "Dành cho người được cấp quyền", "Tự động ra vào dành cho người có quyền vào bên trong."],
  ms: ["Tiba. Masuk. Teruskan hari anda.", "Tangan kekal bebas", "Biarkan telefon di dalam poket dan tangan anda bebas.", "Ketibaan lebih selesa", "Masuk dengan selesa dan teruskan hari anda.", "Untuk pengguna yang dibenarkan", "Kemasukan automatik untuk individu yang mempunyai kebenaran masuk."],
  fil: ["Dumating. Pumasok. Ituloy ang araw mo.", "Malaya ang mga kamay", "Iwan ang telepono sa bulsa at panatilihing malaya ang mga kamay.", "Mas maginhawang pagdating", "Pumasok nang maginhawa at ipagpatuloy ang araw mo.", "Para sa mga awtorisadong gumagamit", "Awtomatikong pagpasok para sa mga taong may pahintulot na pumasok."],
};

const ICONS = ["handsfree", "clock", "shield"];
const NONEMPTY = value => typeof value === "string" && value.trim().length > 0;
const BRAND_ONLY = /^(?:WIFIGATE|Auto Open|[\s·|.,:])+$/;
// These words describe implementation, rather than the user's arrival.
const TECHNICAL = /\b(?:BLE|Bluetooth|Wi[ -]?Fi|RF|RSSI|GPS|geofenc\w*|protocols?|algorithms?|sensors?|beacons?|firmware|encryption|encrypt\w*|triggers?|detection|detect\w*|radio|range|meters?|metres?|radius)\b|בלוטות|בלוטוס|פרוטוקול|הצפנ|זיהוי|חיישנ|טווח|תדר/iu;

export function getAutoOpenPageContent(locale, homepageCopy) {
  if (typeof locale !== "string" || !Object.hasOwn(COPY, locale)) throw new Error(`Missing Auto Open page locale: ${locale}`);
  const local = COPY[locale];
  const feature = homepageCopy?.platform?.features?.[4];
  if (!NONEMPTY(feature?.title) || !NONEMPTY(feature?.text)) throw new Error(`Missing localized homepage Auto Open feature: ${locale}`);
  return {
    label: feature.title,
    eyebrow: "WIFIGATE · Auto Open",
    title: local[0],
    heroLead: feature.text,
    highlights: ICONS.map((icon, index) => ({ icon, title: local[1 + index * 2], text: local[2 + index * 2] })),
    benefits: [],
    faq: [],
    seoTitle: `${feature.title} | WIFIGATE`,
    seoDescription: feature.text,
    imageAlt: feature.text,
  };
}

export function validateAutoOpenPageLocales(localeCodes, homepageCopies) {
  const problems = [];
  let english;
  try { english = getAutoOpenPageContent("en", homepageCopies?.en); }
  catch (error) { problems.push(error.message); }
  for (const locale of localeCodes) {
    let content;
    try { content = getAutoOpenPageContent(locale, homepageCopies?.[locale]); }
    catch (error) { problems.push(error.message); continue; }
    if (!Array.isArray(COPY[locale]) || COPY[locale].length !== 7 || !COPY[locale].every(NONEMPTY)) problems.push(`${locale}: Auto Open requires a headline and three complete benefits`);
    const inspect = (value, reference, at) => {
      if (typeof value === "string") {
        if (!NONEMPTY(value)) problems.push(`${locale}: Auto Open ${at} is empty`);
        if (at.endsWith(".icon")) return;
        if (TECHNICAL.test(value)) problems.push(`${locale}: Auto Open ${at} contains implementation details`);
        if (locale !== "en" && value === reference && !BRAND_ONLY.test(value)) problems.push(`${locale}: Auto Open ${at} is still the English text`);
      } else if (Array.isArray(value)) value.forEach((item, index) => inspect(item, reference?.[index], `${at}.${index}`));
      else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) inspect(item, reference?.[key], at ? `${at}.${key}` : key);
    };
    inspect(content, english, "");
  }
  return problems;
}
