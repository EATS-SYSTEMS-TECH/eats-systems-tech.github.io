// Site-wide wording alignment for the homepage navigation and section titles.
(function () {
  if (typeof translations === "undefined") {
    return;
  }

  const copy = {
    en: ["Why Choose Us?", "Use Cases", "WIFIGATE: The Winning Approach", "For Home, Business, or Guests: Smart Access Everywhere"],
    he: ["למה לבחור בנו?", "שימושים", "WIFIGATE השיטה המנצחת", "לבית, לעסק או לאורחים: גישה חכמה בכל מקום"],
    es: ["¿Por qué elegirnos?", "Casos de uso", "WIFIGATE: el método ganador", "Para el hogar, el negocio o los invitados: acceso inteligente en cualquier lugar"],
    fr: ["Pourquoi nous choisir ?", "Cas d’usage", "WIFIGATE : la méthode gagnante", "Pour la maison, l’entreprise ou les invités : un accès intelligent partout"],
    de: ["Warum uns wählen?", "Anwendungsbereiche", "WIFIGATE: die überzeugende Lösung", "Für Zuhause, Unternehmen oder Gäste: intelligenter Zugang überall"],
    nl: ["Waarom voor ons kiezen?", "Toepassingen", "WIFIGATE: de winnende aanpak", "Voor thuis, bedrijven of gasten: slimme toegang overal"],
    it: ["Perché scegliere noi?", "Casi d’uso", "WIFIGATE: il metodo vincente", "Per casa, aziende o ospiti: accesso intelligente ovunque"],
    pt: ["Porquê escolher-nos?", "Casos de utilização", "WIFIGATE: a solução vencedora", "Para casa, empresas ou convidados: acesso inteligente em qualquer lugar"],
    pl: ["Dlaczego warto nas wybrać?", "Zastosowania", "WIFIGATE: zwycięska metoda", "Dla domu, firmy lub gości: inteligentny dostęp w każdym miejscu"],
    no: ["Hvorfor velge oss?", "Bruksområder", "WIFIGATE: den vinnende løsningen", "For hjem, bedrifter eller gjester: smart tilgang overalt"],
    cs: ["Proč si vybrat nás?", "Možnosti využití", "WIFIGATE: vítězný přístup", "Pro domácnost, firmu nebo hosty: chytrý přístup kdekoliv"],
    ru: ["Почему выбирают нас?", "Варианты использования", "WIFIGATE: выигрышный подход", "Для дома, бизнеса или гостей: умный доступ везде"],
    uk: ["Чому обирають нас?", "Варіанти використання", "WIFIGATE: переможний підхід", "Для дому, бізнесу чи гостей: розумний доступ будь-де"],
    tr: ["Neden bizi seçmelisiniz?", "Kullanım alanları", "WIFIGATE: kazandıran yöntem", "Ev, işletme veya misafirler için: her yerde akıllı erişim"],
    ar: ["لماذا تختارنا؟", "الاستخدامات", "WIFIGATE: الطريقة الرابحة", "للمنزل أو العمل أو الضيوف: وصول ذكي في كل مكان"],
    hi: ["हमें क्यों चुनें?", "उपयोग के क्षेत्र", "WIFIGATE: जीतने वाला तरीका", "घर, व्यवसाय या मेहमानों के लिए: हर जगह स्मार्ट एक्सेस"],
    bn: ["কেন আমাদের বেছে নেবেন?", "ব্যবহারের ক্ষেত্র", "WIFIGATE: সেরা পদ্ধতি", "বাড়ি, ব্যবসা বা অতিথিদের জন্য: সর্বত্র স্মার্ট অ্যাক্সেস"],
    mr: ["आम्हाला का निवडावे?", "वापराचे क्षेत्र", "WIFIGATE: विजयी पद्धत", "घर, व्यवसाय किंवा पाहुण्यांसाठी: सर्वत्र स्मार्ट प्रवेश"],
    te: ["మమ్మల్ని ఎందుకు ఎంచుకోవాలి?", "వినియోగాలు", "WIFIGATE: విజయవంతమైన విధానం", "ఇల్లు, వ్యాపారం లేదా అతిథుల కోసం: ప్రతిచోటా స్మార్ట్ యాక్సెస్"],
    "zh-Hans": ["为什么选择我们？", "应用场景", "WIFIGATE：制胜方案", "家庭、企业或访客：随处享受智能访问"],
    "zh-Hant": ["為什麼選擇我們？", "應用場景", "WIFIGATE：制勝方案", "家庭、企業或訪客：隨處享有智慧存取"],
    ja: ["なぜWIFIGATEを選ぶのか？", "利用シーン", "WIFIGATE：勝てる方法", "家庭、企業、ゲストのために：どこでもスマートアクセス"],
    ko: ["왜 WIFIGATE를 선택해야 할까요?", "활용 분야", "WIFIGATE: 승리하는 방법", "가정, 사업장 또는 게스트를 위해: 어디서나 스마트 액세스"],
    da: ["Hvorfor vælge os?", "Anvendelsesområder", "WIFIGATE: den vindende løsning", "Til hjem, virksomhed eller gæster: smart adgang overalt"],
    sv: ["Varför välja oss?", "Användningsområden", "WIFIGATE: den vinnande metoden", "För hem, företag eller gäster: smart åtkomst överallt"],
    hu: ["Miért válasszon minket?", "Felhasználási területek", "WIFIGATE: a győztes megoldás", "Otthonra, vállalkozásoknak vagy vendégeknek: intelligens hozzáférés mindenhol"],
    el: ["Γιατί να μας επιλέξετε;", "Περιπτώσεις χρήσης", "WIFIGATE: η νικηφόρα μέθοδος", "Για το σπίτι, την επιχείρηση ή τους επισκέπτες: έξυπνη πρόσβαση παντού"],
    ro: ["De ce să ne alegeți?", "Cazuri de utilizare", "WIFIGATE: metoda câștigătoare", "Pentru casă, afacere sau oaspeți: acces inteligent oriunde"],
    hr: ["Zašto odabrati nas?", "Primjene", "WIFIGATE: pobjednički pristup", "Za dom, posao ili goste: pametan pristup svugdje"],
    fi: ["Miksi valita meidät?", "Käyttökohteet", "WIFIGATE: voittava ratkaisu", "Kotiin, yritykseen tai vieraille: älykäs pääsy kaikkialla"],
    bg: ["Защо да изберете нас?", "Приложения", "WIFIGATE: печелившият подход", "За дома, бизнеса или гостите: интелигентен достъп навсякъде"],
    sr: ["Zašto izabrati nas?", "Primene", "WIFIGATE: pobednički pristup", "Za dom, posao ili goste: pametan pristup svuda"],
    sk: ["Prečo si vybrať nás?", "Možnosti využitia", "WIFIGATE: víťazný prístup", "Pre domácnosť, firmu alebo hostí: inteligentný prístup kdekoľvek"],
    sl: ["Zakaj izbrati nas?", "Primeri uporabe", "WIFIGATE: zmagovalni pristop", "Za dom, podjetje ali goste: pameten dostop povsod"],
    id: ["Mengapa memilih kami?", "Kasus penggunaan", "WIFIGATE: metode unggulan", "Untuk rumah, bisnis, atau tamu: akses cerdas di mana saja"],
    th: ["ทำไมต้องเลือกเรา?", "การใช้งาน", "WIFIGATE: วิธีการที่เหนือกว่า", "สำหรับบ้าน ธุรกิจ หรือแขก: การเข้าถึงอัจฉริยะทุกที่"],
    vi: ["Vì sao chọn chúng tôi?", "Các trường hợp sử dụng", "WIFIGATE: phương pháp chiến thắng", "Cho gia đình, doanh nghiệp hoặc khách: truy cập thông minh mọi nơi"],
    ms: ["Mengapa pilih kami?", "Kegunaan", "WIFIGATE: kaedah terbaik", "Untuk rumah, perniagaan atau tetamu: akses pintar di mana-mana"],
    fil: ["Bakit kami ang piliin?", "Mga gamit", "WIFIGATE: ang panalong paraan", "Para sa bahay, negosyo, o mga bisita: matalinong access kahit saan"],
  };

  Object.entries(copy).forEach(([locale, values]) => {
    const bundle = translations[locale];
    if (!bundle) return;
    bundle.nav.features = values[0];
    bundle.tabs.where = values[1];
    bundle.features.title = values[2];
    bundle.action.title = values[3];
  });
})();
