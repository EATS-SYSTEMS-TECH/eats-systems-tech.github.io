// Fixed UI wording in locale, eyebrow, benefits, home and FAQ column order.
// Keep these compatibility facts identical to the complete frozen label model.
const labelRows = [
  ["en", "WIFIGATE use case", "Key benefits", "Home", "Frequently asked questions"],
  ["he", "תרחיש שימוש של WIFIGATE", "יתרונות עיקריים", "דף הבית", "שאלות נפוצות"],
  ["es", "Caso de uso de WIFIGATE", "Beneficios clave", "Inicio", "Preguntas frecuentes"],
  ["fr", "Cas d'usage WIFIGATE", "Avantages clés", "Accueil", "Questions fréquentes"],
  ["de", "WIFIGATE-Anwendungsfall", "Wichtigste Vorteile", "Startseite", "Häufige Fragen"],
  ["nl", "WIFIGATE-toepassing", "Belangrijkste voordelen", "Home", "Veelgestelde vragen"],
  ["it", "Caso d'uso WIFIGATE", "Vantaggi principali", "Home", "Domande frequenti"],
  ["pt", "Caso de utilização da WIFIGATE", "Principais benefícios", "Início", "Perguntas frequentes"],
  ["pl", "Zastosowanie WIFIGATE", "Najważniejsze korzyści", "Strona główna", "Najczęściej zadawane pytania"],
  ["no", "WIFIGATE-bruksområde", "Viktigste fordeler", "Forside", "Ofte stilte spørsmål"],
  ["cs", "Využití WIFIGATE", "Hlavní výhody", "Domů", "Časté dotazy"],
  ["ru", "Сценарий применения WIFIGATE", "Ключевые преимущества", "Главная", "Частые вопросы"],
  ["uk", "Сценарій застосування WIFIGATE", "Ключові переваги", "Головна", "Поширені запитання"],
  ["tr", "WIFIGATE kullanım senaryosu", "Temel avantajlar", "Ana sayfa", "Sık sorulan sorular"],
  ["ar", "حالة استخدام WIFIGATE", "أهم المزايا", "الرئيسية", "الأسئلة الشائعة"],
  ["hi", "WIFIGATE के इस्तेमाल का उदाहरण", "मुख्य लाभ", "होम", "अक्सर पूछे जाने वाले प्रश्न"],
  ["bn", "WIFIGATE ব্যবহারের ক্ষেত্র", "মূল সুবিধা", "হোম", "সচরাচর জিজ্ঞাসা"],
  ["mr", "WIFIGATE चा वापर", "मुख्य फायदे", "मुख्यपृष्ठ", "वारंवार विचारले जाणारे प्रश्न"],
  ["te", "WIFIGATE వినియోగ సందర్భం", "ముఖ్య ప్రయోజనాలు", "హోమ్", "తరచుగా అడిగే ప్రశ్నలు"],
  ["zh-Hans", "WIFIGATE 应用场景", "核心优势", "首页", "常见问题"],
  ["zh-Hant", "WIFIGATE 應用情境", "核心優勢", "首頁", "常見問題"],
  ["ja", "WIFIGATE の活用シーン", "主なメリット", "ホーム", "よくある質問"],
  ["ko", "WIFIGATE 활용 사례", "주요 장점", "홈", "자주 묻는 질문"],
  ["da", "WIFIGATE-anvendelse", "Vigtigste fordele", "Forside", "Ofte stillede spørgsmål"],
  ["sv", "WIFIGATE-användningsområde", "Viktigaste fördelarna", "Startsida", "Vanliga frågor"],
  ["hu", "WIFIGATE felhasználási terület", "Fő előnyök", "Kezdőlap", "Gyakori kérdések"],
  ["el", "Περίπτωση χρήσης WIFIGATE", "Βασικά πλεονεκτήματα", "Αρχική", "Συχνές ερωτήσεις"],
  ["ro", "Caz de utilizare WIFIGATE", "Avantaje principale", "Acasă", "Întrebări frecvente"],
  ["hr", "Primjena sustava WIFIGATE", "Ključne prednosti", "Početna", "Česta pitanja"],
  ["fi", "WIFIGATE-käyttökohde", "Tärkeimmät edut", "Etusivu", "Usein kysytyt kysymykset"],
  ["bg", "Сценарий за употреба на WIFIGATE", "Основни предимства", "Начало", "Често задавани въпроси"],
  ["sr", "Примена система WIFIGATE", "Кључне предности", "Почетна", "Честа питања"],
  ["sk", "Využitie WIFIGATE", "Hlavné výhody", "Domov", "Často kladené otázky"],
  ["sl", "Primer uporabe WIFIGATE", "Ključne prednosti", "Domov", "Pogosta vprašanja"],
  ["id", "Contoh penggunaan WIFIGATE", "Manfaat utama", "Beranda", "Pertanyaan umum"],
  ["th", "ตัวอย่างการใช้งาน WIFIGATE", "ประโยชน์หลัก", "หน้าแรก", "คำถามที่พบบ่อย"],
  ["vi", "Tình huống sử dụng WIFIGATE", "Lợi ích chính", "Trang chủ", "Câu hỏi thường gặp"],
  ["ms", "Kegunaan WIFIGATE", "Manfaat utama", "Laman utama", "Soalan lazim"],
  ["fil", "Gamit ng WIFIGATE", "Pangunahing benepisyo", "Home", "Mga madalas itanong"],
];

// Assemble the public ordinary records without fallback, mutation or I/O.
// Explicit fields preserve the existing exported shape and insertion order.
export const NICHE_CHROME = Object.fromEntries(labelRows.map(
  ([locale, eyebrow, benefitsTitle, homeLabel, faqTitle]) =>
    [locale, { eyebrow, benefitsTitle, homeLabel, faqTitle }]
));
