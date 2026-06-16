// /js/accessibility.js
// Version: 1.0.0

const ACCESSIBILITY_STORAGE_KEY = "wifigate-accessibility-settings-v1"
const ACCESSIBILITY_DEFAULTS = {
  largeText: false,
  highContrast: false,
  underlineLinks: false,
  readableFont: false,
  reducedMotion: false,
}

const ACCESSIBILITY_ROOT_CLASSES = {
  largeText: "a11y-large-text",
  highContrast: "a11y-high-contrast",
  underlineLinks: "a11y-underlined-links",
  readableFont: "a11y-readable-font",
  reducedMotion: "a11y-reduced-motion",
}

const accessibilityCopy = {
  en: {
    skipLink: "Skip to main content",
    eyebrow: "Accessibility",
    openButton: "Open accessibility center",
    closeButton: "Close accessibility center",
    title: "Accessibility Center",
    description: "Adjust the site to suit your reading and navigation preferences.",
    reset: "Reset",
    statusDefault: "Standard site view",
    statusActive: "{count} accessibility adjustments active",
    options: {
      largeText: {
        label: "Larger text",
        description: "Increase font size across the site.",
      },
      highContrast: {
        label: "High contrast",
        description: "Strengthen contrast for text and interface.",
      },
      underlineLinks: {
        label: "Underline links",
        description: "Make links easier to identify.",
      },
      readableFont: {
        label: "Readable font",
        description: "Switch to a cleaner, more legible font.",
      },
      reducedMotion: {
        label: "Reduced motion",
        description: "Minimize animations and motion effects.",
      },
    },
    siteSupportTitle: "Built into this site",
    siteSupport: [
      "Keyboard-friendly navigation",
      "Clear focus indicators",
      "Multi-language and RTL support",
      "Responsive layout for mobile and desktop",
    ],
  },
  he: {
    skipLink: "דלג לתוכן הראשי",
    eyebrow: "נגישות",
    openButton: "פתח מרכז נגישות",
    closeButton: "סגור מרכז נגישות",
    title: "מרכז נגישות",
    description: "התאם את האתר להעדפות הקריאה והניווט שלך.",
    reset: "איפוס",
    statusDefault: "תצוגה רגילה של האתר",
    statusActive: "{count} התאמות נגישות פעילות",
    options: {
      largeText: {
        label: "טקסט גדול",
        description: "הגדלת הטקסט בכל האתר.",
      },
      highContrast: {
        label: "ניגודיות גבוהה",
        description: "חיזוק הניגודיות לטקסט ולממשק.",
      },
      underlineLinks: {
        label: "הדגשת קישורים",
        description: "הצגת קישורים עם קו תחתי לזיהוי מהיר יותר.",
      },
      readableFont: {
        label: "פונט קריא",
        description: "מעבר לגופן נקי וקריא יותר.",
      },
      reducedMotion: {
        label: "הפחתת תנועה",
        description: "מזעור אנימציות ואפקטים של תנועה.",
      },
    },
    siteSupportTitle: "קיים כבר באתר",
    siteSupport: [
      "ניווט נוח במקלדת",
      "סימון פוקוס ברור",
      "תמיכה בריבוי שפות וב-RTL",
      "תצוגה רספונסיבית לנייד ולמחשב",
    ],
  },
  es: {
    skipLink: "Saltar al contenido principal",
    eyebrow: "Accesibilidad",
    openButton: "Abrir centro de accesibilidad",
    closeButton: "Cerrar centro de accesibilidad",
    title: "Centro de accesibilidad",
    description: "Ajusta el sitio según tus preferencias de lectura y navegación.",
    reset: "Restablecer",
    statusDefault: "Vista estándar del sitio",
    statusActive: "{count} ajustes de accesibilidad activos",
    options: {
      largeText: {
        label: "Texto grande",
        description: "Aumenta el tamaño del texto en todo el sitio.",
      },
      highContrast: {
        label: "Alto contraste",
        description: "Refuerza el contraste del texto y la interfaz.",
      },
      underlineLinks: {
        label: "Subrayar enlaces",
        description: "Facilita la identificación de los enlaces.",
      },
      readableFont: {
        label: "Fuente legible",
        description: "Cambia a una fuente más limpia y legible.",
      },
      reducedMotion: {
        label: "Reducir movimiento",
        description: "Minimiza animaciones y efectos de movimiento.",
      },
    },
    siteSupportTitle: "Incluido en este sitio",
    siteSupport: [
      "Navegación apta para teclado",
      "Indicadores de foco claros",
      "Soporte multilingüe y RTL",
      "Diseño adaptable para móvil y escritorio",
    ],
  },
  pt: {
    skipLink: "Saltar para o conteúdo principal",
    eyebrow: "Acessibilidade",
    openButton: "Abrir centro de acessibilidade",
    closeButton: "Fechar centro de acessibilidade",
    title: "Centro de acessibilidade",
    description: "Ajuste o site às suas preferências de leitura e navegação.",
    reset: "Repor",
    statusDefault: "Vista padrão do site",
    statusActive: "{count} ajustes de acessibilidade ativos",
    options: {
      largeText: {
        label: "Texto maior",
        description: "Aumenta o tamanho do texto em todo o site.",
      },
      highContrast: {
        label: "Alto contraste",
        description: "Reforça o contraste do texto e da interface.",
      },
      underlineLinks: {
        label: "Sublinhar ligações",
        description: "Torna as ligações mais fáceis de identificar.",
      },
      readableFont: {
        label: "Tipo de letra legível",
        description: "Muda para uma fonte mais limpa e legível.",
      },
      reducedMotion: {
        label: "Reduzir movimento",
        description: "Minimiza animações e efeitos de movimento.",
      },
    },
    siteSupportTitle: "Já incluído no site",
    siteSupport: [
      "Navegação compatível com teclado",
      "Indicadores de foco claros",
      "Suporte multilingue e RTL",
      "Layout responsivo para telemóvel e computador",
    ],
  },
  pl: {
    skipLink: "Przejdź do głównej treści",
    eyebrow: "Dostępność",
    openButton: "Otwórz centrum dostępności",
    closeButton: "Zamknij centrum dostępności",
    title: "Centrum dostępności",
    description: "Dostosuj stronę do swoich preferencji czytania i nawigacji.",
    reset: "Resetuj",
    statusDefault: "Standardowy widok strony",
    statusActive: "{count} aktywnych ustawień dostępności",
    options: {
      largeText: {
        label: "Większy tekst",
        description: "Zwiększa rozmiar tekstu w całej witrynie.",
      },
      highContrast: {
        label: "Wysoki kontrast",
        description: "Wzmacnia kontrast tekstu i interfejsu.",
      },
      underlineLinks: {
        label: "Podkreśl linki",
        description: "Ułatwia rozpoznawanie linków.",
      },
      readableFont: {
        label: "Czytelna czcionka",
        description: "Przełącza na czystszą i bardziej czytelną czcionkę.",
      },
      reducedMotion: {
        label: "Mniej ruchu",
        description: "Ogranicza animacje i efekty ruchu.",
      },
    },
    siteSupportTitle: "Wbudowane w tę stronę",
    siteSupport: [
      "Nawigacja przyjazna dla klawiatury",
      "Wyraźne wskaźniki fokusu",
      "Obsługa wielu języków i RTL",
      "Responsywny układ na telefon i komputer",
    ],
  },
  ru: {
    skipLink: "Перейти к основному содержимому",
    eyebrow: "Доступность",
    openButton: "Открыть центр доступности",
    closeButton: "Закрыть центр доступности",
    title: "Центр доступности",
    description: "Настройте сайт под свои предпочтения чтения и навигации.",
    reset: "Сбросить",
    statusDefault: "Стандартный вид сайта",
    statusActive: "Активно настроек доступности: {count}",
    options: {
      largeText: {
        label: "Крупный текст",
        description: "Увеличивает размер текста на всём сайте.",
      },
      highContrast: {
        label: "Высокий контраст",
        description: "Усиливает контраст текста и интерфейса.",
      },
      underlineLinks: {
        label: "Подчеркнуть ссылки",
        description: "Помогает быстрее распознавать ссылки.",
      },
      readableFont: {
        label: "Читаемый шрифт",
        description: "Переключает сайт на более чистый и читаемый шрифт.",
      },
      reducedMotion: {
        label: "Меньше движения",
        description: "Снижает количество анимаций и эффектов движения.",
      },
    },
    siteSupportTitle: "Уже есть на сайте",
    siteSupport: [
      "Навигация, удобная для клавиатуры",
      "Чёткие индикаторы фокуса",
      "Поддержка нескольких языков и RTL",
      "Адаптивная вёрстка для телефона и компьютера",
    ],
  },
  cs: {
    skipLink: "Přeskočit na hlavní obsah",
    eyebrow: "Přístupnost",
    openButton: "Otevřít centrum přístupnosti",
    closeButton: "Zavřít centrum přístupnosti",
    title: "Centrum přístupnosti",
    description: "Přizpůsobte web svým preferencím pro čtení a navigaci.",
    reset: "Obnovit",
    statusDefault: "Standardní zobrazení webu",
    statusActive: "Aktivní úpravy přístupnosti: {count}",
    options: {
      largeText: {
        label: "Větší text",
        description: "Zvětší text na celém webu.",
      },
      highContrast: {
        label: "Vysoký kontrast",
        description: "Zvýrazní kontrast textu a rozhraní.",
      },
      underlineLinks: {
        label: "Podtrhnout odkazy",
        description: "Usnadní rozpoznání odkazů.",
      },
      readableFont: {
        label: "Čitelnější písmo",
        description: "Přepne na čistší a lépe čitelné písmo.",
      },
      reducedMotion: {
        label: "Omezit pohyb",
        description: "Omezí animace a pohybové efekty.",
      },
    },
    siteSupportTitle: "Součást tohoto webu",
    siteSupport: [
      "Navigace vhodná pro klávesnici",
      "Jasné indikátory fokusu",
      "Podpora více jazyků a RTL",
      "Responzivní rozložení pro mobil i desktop",
    ],
  },
  ar: {
    skipLink: "انتقل إلى المحتوى الرئيسي",
    eyebrow: "إمكانية الوصول",
    openButton: "افتح مركز إمكانية الوصول",
    closeButton: "أغلق مركز إمكانية الوصول",
    title: "مركز إمكانية الوصول",
    description: "اضبط الموقع بما يناسب تفضيلاتك في القراءة والتنقل.",
    reset: "إعادة ضبط",
    statusDefault: "العرض القياسي للموقع",
    statusActive: "تعديلات إمكانية الوصول النشطة: {count}",
    options: {
      largeText: {
        label: "نص أكبر",
        description: "يزيد حجم النص في جميع أجزاء الموقع.",
      },
      highContrast: {
        label: "تباين عالٍ",
        description: "يعزز تباين النص والواجهة.",
      },
      underlineLinks: {
        label: "تسطير الروابط",
        description: "يجعل الروابط أسهل في التمييز.",
      },
      readableFont: {
        label: "خط أكثر وضوحًا",
        description: "يبدل إلى خط أنظف وأسهل للقراءة.",
      },
      reducedMotion: {
        label: "تقليل الحركة",
        description: "يقلل الرسوم المتحركة وتأثيرات الحركة.",
      },
    },
    siteSupportTitle: "مضمن في هذا الموقع",
    siteSupport: [
      "تنقل مناسب للوحة المفاتيح",
      "مؤشرات تركيز واضحة",
      "دعم تعدد اللغات واتجاه RTL",
      "تصميم متجاوب للهاتف وسطح المكتب",
    ],
  },
}

const accessibilityCopyExtra = {
  "fr": {
    "skipLink": "Passer au contenu principal",
    "eyebrow": "Accessibilité",
    "openButton": "Centre d'accessibilité ouvert",
    "closeButton": "Fermer le centre d’accessibilité",
    "title": "Centre d'accessibilité",
    "description": "Adaptez le site à vos préférences de lecture et de navigation.",
    "reset": "Réinitialiser",
    "statusDefault": "Vue standard du site",
    "statusActive": "{count} ajustements d'accessibilité actifs",
    "options": {
      "largeText": {
        "label": "Texte plus grand",
        "description": "Augmentez la taille de la police sur tout le site."
      },
      "highContrast": {
        "label": "Contraste élevé",
        "description": "Renforcez le contraste du texte et de l'interface."
      },
      "underlineLinks": {
        "label": "Souligner les liens",
        "description": "Rendre les liens plus faciles à identifier."
      },
      "readableFont": {
        "label": "Police lisible",
        "description": "Passez à une police plus propre et plus lisible."
      },
      "reducedMotion": {
        "label": "Mouvement réduit",
        "description": "Réduisez les animations et les effets de mouvement."
      }
    },
    "siteSupportTitle": "Intégré à ce site",
    "siteSupport": [
      "Navigation conviviale au clavier",
      "Indicateurs de concentration clairs",
      "Prise en charge multilingue et RTL",
      "Mise en page réactive pour mobile et ordinateur de bureau"
    ]
  },
  "de": {
    "skipLink": "Zum Hauptinhalt springen",
    "eyebrow": "Barrierefreiheit",
    "openButton": "Offenes Barrierefreiheitszentrum",
    "closeButton": "Barrierefreiheitszentrum schließen",
    "title": "Barrierefreiheitszentrum",
    "description": "Passen Sie die Website an Ihre Lese- und Navigationspräferenzen an.",
    "reset": "Zurücksetzen",
    "statusDefault": "Standard-Site-Ansicht",
    "statusActive": "{count} Barrierefreiheitsanpassungen aktiv",
    "options": {
      "largeText": {
        "label": "Größerer Text",
        "description": "Erhöhen Sie die Schriftgröße auf der gesamten Website."
      },
      "highContrast": {
        "label": "Hoher Kontrast",
        "description": "Verstärken Sie den Kontrast für Text und Benutzeroberfläche."
      },
      "underlineLinks": {
        "label": "Unterstreichen Sie Links",
        "description": "Erleichtern Sie die Identifizierung von Links."
      },
      "readableFont": {
        "label": "Lesbare Schriftart",
        "description": "Wechseln Sie zu einer saubereren, besser lesbaren Schriftart."
      },
      "reducedMotion": {
        "label": "Reduzierte Bewegung",
        "description": "Minimieren Sie Animationen und Bewegungseffekte."
      }
    },
    "siteSupportTitle": "In diese Site integriert",
    "siteSupport": [
      "Tastaturfreundliche Navigation",
      "Klare Fokusindikatoren",
      "Mehrsprachigkeit und RTL-Unterstützung",
      "Responsives Layout für Mobilgeräte und Desktops"
    ]
  },
  "nl": {
    "skipLink": "Ga naar de hoofdinhoud",
    "eyebrow": "Toegankelijkheid",
    "openButton": "Open toegankelijkheidscentrum",
    "closeButton": "Bereikbaarheidscentrum sluiten",
    "title": "Toegankelijkheidscentrum",
    "description": "Pas de site aan uw lees- en navigatievoorkeuren aan.",
    "reset": "Opnieuw instellen",
    "statusDefault": "Standaard siteweergave",
    "statusActive": "{count} toegankelijkheidsaanpassingen actief",
    "options": {
      "largeText": {
        "label": "Grotere tekst",
        "description": "Vergroot de lettergrootte op de hele site."
      },
      "highContrast": {
        "label": "Hoog contrast",
        "description": "Versterk het contrast voor tekst en interface."
      },
      "underlineLinks": {
        "label": "Onderstreep koppelingen",
        "description": "Maak koppelingen gemakkelijker te identificeren."
      },
      "readableFont": {
        "label": "Leesbaar lettertype",
        "description": "Schakel over naar een schoner, beter leesbaar lettertype."
      },
      "reducedMotion": {
        "label": "Verminderde beweging",
        "description": "Minimaliseer animaties en bewegingseffecten."
      }
    },
    "siteSupportTitle": "Ingebouwd in deze site",
    "siteSupport": [
      "Toetsenbordvriendelijke navigatie",
      "Duidelijke focusindicatoren",
      "Meertalige en RTL-ondersteuning",
      "Responsieve lay-out voor mobiel en desktop"
    ]
  },
  "it": {
    "skipLink": "Passa al contenuto principale",
    "eyebrow": "Accessibilità",
    "openButton": "Centro aperto per l'accessibilità",
    "closeButton": "Chiudere il centro per l'accessibilità",
    "title": "Centro accessibilità",
    "description": "Adatta il sito alle tue preferenze di lettura e navigazione.",
    "reset": "Ripristina",
    "statusDefault": "Visualizzazione standard del sito",
    "statusActive": "{count} aggiustamenti di accessibilità attivi",
    "options": {
      "largeText": {
        "label": "Testo più grande",
        "description": "Aumenta la dimensione del carattere in tutto il sito."
      },
      "highContrast": {
        "label": "Contrasto elevato",
        "description": "Rafforzare il contrasto per testo e interfaccia."
      },
      "underlineLinks": {
        "label": "Sottolinea i collegamenti",
        "description": "Rendi i collegamenti più facili da identificare."
      },
      "readableFont": {
        "label": "Carattere leggibile",
        "description": "Passa a un carattere più pulito e leggibile."
      },
      "reducedMotion": {
        "label": "Movimento ridotto",
        "description": "Riduci al minimo le animazioni e gli effetti di movimento."
      }
    },
    "siteSupportTitle": "Integrato in questo sito",
    "siteSupport": [
      "Navigazione intuitiva tramite tastiera",
      "Indicatori di messa a fuoco chiari",
      "Supporto multilingue e RTL",
      "Layout responsivo per dispositivi mobili e desktop"
    ]
  },
  "no": {
    "skipLink": "Gå til hovedinnhold",
    "eyebrow": "Tilgjengelighet",
    "openButton": "Åpne tilgjengelighetssenter",
    "closeButton": "Lukk tilgjengelighetssenteret",
    "title": "Tilgjengelighetssenter",
    "description": "Juster nettstedet slik at det passer dine lese- og navigasjonspreferanser.",
    "reset": "Tilbakestill",
    "statusDefault": "Standard sidevisning",
    "statusActive": "{count} tilgjengelighetsjusteringer aktive",
    "options": {
      "largeText": {
        "label": "Større tekst",
        "description": "Øk skriftstørrelsen på hele nettstedet."
      },
      "highContrast": {
        "label": "Høy kontrast",
        "description": "Styrk kontrasten for tekst og grensesnitt."
      },
      "underlineLinks": {
        "label": "Understrek lenker",
        "description": "Gjør lenker lettere å identifisere."
      },
      "readableFont": {
        "label": "Lesbar skrift",
        "description": "Bytt til en renere, mer lesbar skrift."
      },
      "reducedMotion": {
        "label": "Redusert bevegelse",
        "description": "Minimer animasjoner og bevegelseseffekter."
      }
    },
    "siteSupportTitle": "Innebygd i denne siden",
    "siteSupport": [
      "Tastaturvennlig navigering",
      "Tydelige fokusindikatorer",
      "Støtte for flere språk og RTL",
      "Responsive layout for mobil og desktop"
    ]
  },
  "uk": {
    "skipLink": "Перейти до основного вмісту",
    "eyebrow": "Доступність",
    "openButton": "Відкритий центр доступності",
    "closeButton": "Закрити центр доступності",
    "title": "Центр доступності",
    "description": "Налаштуйте сайт відповідно до своїх уподобань читання та навігації.",
    "reset": "Скинути",
    "statusDefault": "Стандартний вигляд сайту",
    "statusActive": "{count} активних коригувань доступності",
    "options": {
      "largeText": {
        "label": "Більший текст",
        "description": "Збільште розмір шрифту на сайті."
      },
      "highContrast": {
        "label": "Високий контраст",
        "description": "Посилення контрасту для тексту та інтерфейсу."
      },
      "underlineLinks": {
        "label": "Підкресліть посилання",
        "description": "Полегшіть ідентифікацію посилань."
      },
      "readableFont": {
        "label": "Читабельний шрифт",
        "description": "Перейдіть на більш чистий і розбірливий шрифт."
      },
      "reducedMotion": {
        "label": "Зменшений рух",
        "description": "Мінімізуйте анімацію та ефекти руху."
      }
    },
    "siteSupportTitle": "Вбудований на цьому сайті",
    "siteSupport": [
      "Зручна навігація за допомогою клавіатури",
      "Чіткі індикатори фокусування",
      "Багатомовність і підтримка RTL",
      "Адаптивний макет для мобільних пристроїв і комп’ютерів"
    ]
  },
  "tr": {
    "skipLink": "Ana içeriğe atla",
    "eyebrow": "Erişilebilirlik",
    "openButton": "Erişilebilirlik merkezini aç",
    "closeButton": "Erişilebilirlik merkezini kapat",
    "title": "Erişilebilirlik Merkezi",
    "description": "Siteyi okuma ve gezinme tercihlerinize uyacak şekilde ayarlayın.",
    "reset": "Sıfırla",
    "statusDefault": "Standart site görünümü",
    "statusActive": "{count} erişilebilirlik düzenlemesi etkin",
    "options": {
      "largeText": {
        "label": "Daha büyük metin",
        "description": "Site genelinde yazı tipi boyutunu artırın."
      },
      "highContrast": {
        "label": "Yüksek kontrast",
        "description": "Metin ve arayüz için kontrastı güçlendirin."
      },
      "underlineLinks": {
        "label": "Bağlantıların altını çizin",
        "description": "Bağlantıların tanımlanmasını kolaylaştırın."
      },
      "readableFont": {
        "label": "Okunabilir yazı tipi",
        "description": "Daha temiz, daha okunaklı bir yazı tipine geçin."
      },
      "reducedMotion": {
        "label": "Azaltılmış hareket",
        "description": "Animasyonları ve hareket efektlerini en aza indirin."
      }
    },
    "siteSupportTitle": "Bu siteye yerleşik",
    "siteSupport": [
      "Klavye dostu navigasyon",
      "Net odak göstergeleri",
      "Çoklu dil ve RTL desteği",
      "Mobil ve masaüstü için duyarlı düzen"
    ]
  },
  "hi": {
    "skipLink": "मुख्य सामग्री पर जाएँ",
    "eyebrow": "अभिगम्यता",
    "openButton": "अभिगम्यता केंद्र खोलें",
    "closeButton": "पहुंच केंद्र बंद करें",
    "title": "अभिगम्यता केंद्र",
    "description": "अपनी पढ़ने और नेविगेशन प्राथमिकताओं के अनुरूप साइट को समायोजित करें।",
    "reset": "रीसेट करें",
    "statusDefault": "मानक साइट दृश्य",
    "statusActive": "{गिनती} पहुंच-योग्यता समायोजन सक्रिय",
    "options": {
      "largeText": {
        "label": "बड़ा पाठ",
        "description": "साइट पर फ़ॉन्ट आकार बढ़ाएँ।"
      },
      "highContrast": {
        "label": "उच्च कंट्रास्ट",
        "description": "टेक्स्ट और इंटरफ़ेस के लिए कंट्रास्ट को मजबूत करें।"
      },
      "underlineLinks": {
        "label": "लिंकों को रेखांकित करें",
        "description": "लिंक को पहचानना आसान बनाएं."
      },
      "readableFont": {
        "label": "पढ़ने योग्य फ़ॉन्ट",
        "description": "एक साफ़, अधिक सुपाठ्य फ़ॉन्ट पर स्विच करें।"
      },
      "reducedMotion": {
        "label": "गति कम होना",
        "description": "एनिमेशन और गति प्रभाव कम करें।"
      }
    },
    "siteSupportTitle": "इस साइट में निर्मित",
    "siteSupport": [
      "कीबोर्ड के अनुकूल नेविगेशन",
      "फोकस संकेतक साफ़ करें",
      "बहु-भाषा और आरटीएल समर्थन",
      "मोबाइल और डेस्कटॉप के लिए उत्तरदायी लेआउट"
    ]
  },
  "bn": {
    "skipLink": "প্রধান বিষয়বস্তু এড়িয়ে যান",
    "eyebrow": "অ্যাক্সেসযোগ্যতা",
    "openButton": "অ্যাক্সেসিবিলিটি সেন্টার খুলুন",
    "closeButton": "অ্যাক্সেসিবিলিটি কেন্দ্র বন্ধ করুন",
    "title": "অ্যাক্সেসিবিলিটি সেন্টার",
    "description": "আপনার পড়ার এবং নেভিগেশন পছন্দ অনুসারে সাইটটি সামঞ্জস্য করুন।",
    "reset": "রিসেট করুন",
    "statusDefault": "স্ট্যান্ডার্ড সাইট ভিউ",
    "statusActive": "{count} অ্যাক্সেসিবিলিটি অ্যাডজাস্টমেন্ট সক্রিয়",
    "options": {
      "largeText": {
        "label": "বৃহত্তর পাঠ্য",
        "description": "পুরো সাইট জুড়ে ফন্টের আকার বাড়ান।"
      },
      "highContrast": {
        "label": "উচ্চ বৈসাদৃশ্য",
        "description": "টেক্সট এবং ইন্টারফেসের জন্য বৈসাদৃশ্য শক্তিশালী করুন।"
      },
      "underlineLinks": {
        "label": "আন্ডারলাইন লিঙ্ক",
        "description": "লিঙ্কগুলি সনাক্ত করা সহজ করুন।"
      },
      "readableFont": {
        "label": "পাঠযোগ্য ফন্ট",
        "description": "একটি ক্লিনার, আরও সুস্পষ্ট ফন্টে স্যুইচ করুন।"
      },
      "reducedMotion": {
        "label": "গতি কমানো",
        "description": "অ্যানিমেশন এবং মোশন এফেক্ট মিনিমাইজ করুন।"
      }
    },
    "siteSupportTitle": "এই সাইটে নির্মিত",
    "siteSupport": [
      "কীবোর্ড-বান্ধব নেভিগেশন",
      "পরিষ্কার ফোকাস সূচক",
      "বহু-ভাষা এবং RTL সমর্থন",
      "মোবাইল এবং ডেস্কটপের জন্য প্রতিক্রিয়াশীল লেআউট"
    ]
  },
  "mr": {
    "skipLink": "मुख्य सामग्रीवर जा",
    "eyebrow": "प्रवेशयोग्यता",
    "openButton": "प्रवेशयोग्यता केंद्र उघडा",
    "closeButton": "प्रवेशयोग्यता केंद्र बंद करा",
    "title": "प्रवेशयोग्यता केंद्र",
    "description": "तुमच्या वाचन आणि नेव्हिगेशन प्राधान्यांनुसार साइट समायोजित करा.",
    "reset": "रीसेट करा",
    "statusDefault": "मानक साइट दृश्य",
    "statusActive": "{count} प्रवेशयोग्यता समायोजन सक्रिय",
    "options": {
      "largeText": {
        "label": "मोठा मजकूर",
        "description": "संपूर्ण साइटवर फॉन्ट आकार वाढवा."
      },
      "highContrast": {
        "label": "उच्च कॉन्ट्रास्ट",
        "description": "मजकूर आणि इंटरफेससाठी कॉन्ट्रास्ट मजबूत करा."
      },
      "underlineLinks": {
        "label": "दुवे अधोरेखित करा",
        "description": "दुवे ओळखणे सोपे करा."
      },
      "readableFont": {
        "label": "वाचनीय फॉन्ट",
        "description": "क्लिनर, अधिक सुवाच्य फॉन्टवर स्विच करा."
      },
      "reducedMotion": {
        "label": "कमी गती",
        "description": "ॲनिमेशन आणि गती प्रभाव कमी करा."
      }
    },
    "siteSupportTitle": "या साइटमध्ये अंगभूत",
    "siteSupport": [
      "कीबोर्ड-अनुकूल नेव्हिगेशन",
      "फोकस इंडिकेटर साफ करा",
      "बहु-भाषा आणि RTL समर्थन",
      "मोबाइल आणि डेस्कटॉपसाठी प्रतिसादात्मक लेआउट"
    ]
  },
  "te": {
    "skipLink": "ప్రధాన కంటెంట్‌కి దాటవేయండి",
    "eyebrow": "యాక్సెసిబిలిటీ",
    "openButton": "ప్రాప్యత కేంద్రాన్ని తెరవండి",
    "closeButton": "ప్రాప్యత కేంద్రాన్ని మూసివేయండి",
    "title": "యాక్సెసిబిలిటీ సెంటర్",
    "description": "మీ పఠనం మరియు నావిగేషన్ ప్రాధాన్యతలకు అనుగుణంగా సైట్‌ను సర్దుబాటు చేయండి.",
    "reset": "రీసెట్ చేయండి",
    "statusDefault": "ప్రామాణిక సైట్ వీక్షణ",
    "statusActive": "{count} యాక్సెసిబిలిటీ సర్దుబాట్లు సక్రియంగా ఉన్నాయి",
    "options": {
      "largeText": {
        "label": "పెద్ద వచనం",
        "description": "సైట్ అంతటా ఫాంట్ పరిమాణాన్ని పెంచండి."
      },
      "highContrast": {
        "label": "అధిక కాంట్రాస్ట్",
        "description": "టెక్స్ట్ మరియు ఇంటర్‌ఫేస్ కోసం కాంట్రాస్ట్‌ను బలోపేతం చేయండి."
      },
      "underlineLinks": {
        "label": "లింక్‌లను అండర్లైన్ చేయండి",
        "description": "లింక్‌లను సులభంగా గుర్తించేలా చేయండి."
      },
      "readableFont": {
        "label": "చదవగలిగే ఫాంట్",
        "description": "క్లీనర్, మరింత స్పష్టంగా కనిపించే ఫాంట్‌కి మారండి."
      },
      "reducedMotion": {
        "label": "తగ్గిన కదలిక",
        "description": "యానిమేషన్లు మరియు చలన ప్రభావాలను తగ్గించండి."
      }
    },
    "siteSupportTitle": "ఈ సైట్‌లో నిర్మించబడింది",
    "siteSupport": [
      "కీబోర్డ్ అనుకూలమైన నావిగేషన్",
      "దృష్టి సూచికలను క్లియర్ చేయండి",
      "బహుళ-భాష మరియు RTL మద్దతు",
      "మొబైల్ మరియు డెస్క్‌టాప్ కోసం ప్రతిస్పందించే లేఅవుట్"
    ]
  },
  "zh-Hans": {
    "skipLink": "跳至主要内容",
    "eyebrow": "无障碍",
    "openButton": "开放无障碍中心",
    "closeButton": "关闭无障碍中心",
    "title": "无障碍中心",
    "description": "调整网站以适合您的阅读和导航偏好。",
    "reset": "重置",
    "statusDefault": "标准站点视图",
    "statusActive": "{count} 个辅助功能调整处于活动状态",
    "options": {
      "largeText": {
        "label": "较大的文字",
        "description": "增加整个网站的字体大小。"
      },
      "highContrast": {
        "label": "高对比度",
        "description": "加强文本和界面的对比度。"
      },
      "underlineLinks": {
        "label": "下划线链接",
        "description": "使链接更容易识别。"
      },
      "readableFont": {
        "label": "可读字体",
        "description": "切换到更清晰、更易读的字体。"
      },
      "reducedMotion": {
        "label": "减少运动",
        "description": "最小化动画和运动效果。"
      }
    },
    "siteSupportTitle": "内置于该网站",
    "siteSupport": [
      "键盘友好的导航",
      "清晰的焦点指示器",
      "多语言和 RTL 支持",
      "适用于移动设备和桌面的响应式布局"
    ]
  },
  "zh-Hant": {
    "skipLink": "跳至主要內容",
    "eyebrow": "無障礙",
    "openButton": "開放無障礙中心",
    "closeButton": "關閉無障礙中心",
    "title": "無障礙中心",
    "description": "調整網站以適合您的閱讀和導航偏好。",
    "reset": "重置",
    "statusDefault": "標準網站視圖",
    "statusActive": "{count} 個輔助功能調整處於活動狀態",
    "options": {
      "largeText": {
        "label": "較大的文字",
        "description": "增加整個網站的字體大小。"
      },
      "highContrast": {
        "label": "高對比度",
        "description": "加強文本和介面的對比。"
      },
      "underlineLinks": {
        "label": "底線連結",
        "description": "使連結更容易識別。"
      },
      "readableFont": {
        "label": "可讀字體",
        "description": "切換到更清晰、更易讀的字體。"
      },
      "reducedMotion": {
        "label": "減少運動",
        "description": "最小化動畫和運動效果。"
      }
    },
    "siteSupportTitle": "內建於該網站",
    "siteSupport": [
      "鍵盤友善的導航",
      "清晰的焦點指示器",
      "多語言和 RTL 支持",
      "適用於行動裝置和桌面的響應式佈局"
    ]
  },
  "ja": {
    "skipLink": "メインコンテンツにスキップ",
    "eyebrow": "アクセシビリティ",
    "openButton": "アクセシビリティ センターを開く",
    "closeButton": "アクセシビリティ センターを閉じる",
    "title": "アクセシビリティ センター",
    "description": "読書やナビゲーションの好みに合わせてサイトを調整します。",
    "reset": "リセット",
    "statusDefault": "標準サイトビュー",
    "statusActive": "{count} 個のユーザー補助調整が有効です",
    "options": {
      "largeText": {
        "label": "大きな文字",
        "description": "サイト全体のフォント サイズを大きくします。"
      },
      "highContrast": {
        "label": "ハイコントラスト",
        "description": "テキストとインターフェイスのコントラストを強化します。"
      },
      "underlineLinks": {
        "label": "リンクに下線を引く",
        "description": "リンクを識別しやすくします。"
      },
      "readableFont": {
        "label": "読みやすいフォント",
        "description": "より鮮明で読みやすいフォントに切り替えます。"
      },
      "reducedMotion": {
        "label": "動きの減少",
        "description": "アニメーションとモーションエフェクトを最小限に抑えます。"
      }
    },
    "siteSupportTitle": "このサイトに組み込まれています",
    "siteSupport": [
      "キーボードフレンドリーなナビゲーション",
      "明確なフォーカスインジケーター",
      "多言語とRTLのサポート",
      "モバイルとデスクトップのレスポンシブ レイアウト"
    ]
  },
  "ko": {
    "skipLink": "주요 콘텐츠로 건너뛰기",
    "eyebrow": "접근성",
    "openButton": "개방형 접근성 센터",
    "closeButton": "접근성 센터 닫기",
    "title": "접근성 센터",
    "description": "읽기 및 탐색 기본 설정에 맞게 사이트를 조정하십시오.",
    "reset": "재설정",
    "statusDefault": "표준 사이트 보기",
    "statusActive": "{count}개의 접근성 조정이 활성화되었습니다.",
    "options": {
      "largeText": {
        "label": "더 큰 텍스트",
        "description": "사이트 전체에서 글꼴 크기를 늘립니다."
      },
      "highContrast": {
        "label": "고대비",
        "description": "텍스트와 인터페이스의 대비를 강화합니다."
      },
      "underlineLinks": {
        "label": "링크에 밑줄을 긋습니다",
        "description": "링크를 더 쉽게 식별할 수 있도록 만드세요."
      },
      "readableFont": {
        "label": "읽을 수 있는 글꼴",
        "description": "더 깨끗하고 읽기 쉬운 글꼴로 전환하세요."
      },
      "reducedMotion": {
        "label": "움직임 감소",
        "description": "애니메이션과 모션 효과를 최소화합니다."
      }
    },
    "siteSupportTitle": "이 사이트에 내장됨",
    "siteSupport": [
      "키보드 친화적인 탐색",
      "명확한 초점 표시",
      "다중 언어 및 RTL 지원",
      "모바일 및 데스크톱을 위한 반응형 레이아웃"
    ]
  },
  "da": {
    "skipLink": "Spring til hovedindhold",
    "eyebrow": "Tilgængelighed",
    "openButton": "Åbent tilgængelighedscenter",
    "closeButton": "Luk tilgængelighedscenter",
    "title": "Tilgængelighedscenter",
    "description": "Juster webstedet, så det passer til dine læse- og navigationspræferencer.",
    "reset": "Nulstil",
    "statusDefault": "Standard sidevisning",
    "statusActive": "{count} tilgængelighedsjusteringer aktive",
    "options": {
      "largeText": {
        "label": "Større tekst",
        "description": "Forøg skriftstørrelsen på tværs af webstedet."
      },
      "highContrast": {
        "label": "Høj kontrast",
        "description": "Styrk kontrasten til tekst og interface."
      },
      "underlineLinks": {
        "label": "Understreg links",
        "description": "Gør links nemmere at identificere."
      },
      "readableFont": {
        "label": "Læsbar skrifttype",
        "description": "Skift til en renere, mere læselig skrifttype."
      },
      "reducedMotion": {
        "label": "Reduceret bevægelse",
        "description": "Minimer animationer og bevægelseseffekter."
      }
    },
    "siteSupportTitle": "Indbygget i dette websted",
    "siteSupport": [
      "Tastaturvenlig navigation",
      "Tydelige fokusindikatorer",
      "Understøttelse af flere sprog og RTL",
      "Responsive layout til mobil og desktop"
    ]
  },
  "hu": {
    "skipLink": "Ugrás a fő tartalomhoz",
    "eyebrow": "Hozzáférhetőség",
    "openButton": "Nyissa meg a kisegítő lehetőségeket",
    "closeButton": "Az akadálymentesítési központ bezárása",
    "title": "Kisegítő lehetőségek központja",
    "description": "Állítsa be a webhelyet olvasási és navigációs preferenciáinak megfelelően.",
    "reset": "Reset",
    "statusDefault": "Normál oldalnézet",
    "statusActive": "{count} akadálymentesítési korrekció aktív",
    "options": {
      "largeText": {
        "label": "Nagyobb szöveg",
        "description": "Növelje a betűméretet a webhelyen."
      },
      "highContrast": {
        "label": "Magas kontraszt",
        "description": "A szöveg és a felület kontrasztjának erősítése."
      },
      "underlineLinks": {
        "label": "A hivatkozások aláhúzása",
        "description": "Tegye könnyebbé a linkek azonosítását."
      },
      "readableFont": {
        "label": "Olvasható betűtípus",
        "description": "Váltson tisztább, olvashatóbb betűtípusra."
      },
      "reducedMotion": {
        "label": "Csökkentett mozgás",
        "description": "Minimalizálja az animációkat és a mozgáseffektusokat."
      }
    },
    "siteSupportTitle": "Beépítve erre az oldalra",
    "siteSupport": [
      "Billentyűzetbarát navigáció",
      "Világos fókuszjelzők",
      "Többnyelvű és RTL támogatás",
      "Reszponzív elrendezés mobilhoz és asztali számítógéphez"
    ]
  }
}

Object.keys(accessibilityCopyExtra).forEach((lang) => {
  accessibilityCopy[lang] = accessibilityCopyExtra[lang]
})

window.accessibilityCopy = accessibilityCopy

let accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
let accessibilityRefs = null
let accessibilityPanelOpen = false

function getAccessibilityLanguage() {
  const fallback = document.documentElement.getAttribute("lang") || "en"

  if (typeof getResolvedLanguage === "function") {
    return getResolvedLanguage(typeof currentLang === "string" ? currentLang : fallback)
  }

  return accessibilityCopy[fallback] ? fallback : "en"
}

function getAccessibilityBundle() {
  const lang = getAccessibilityLanguage()
  return accessibilityCopy[lang] || accessibilityCopy.en
}

function loadAccessibilitySettings() {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    if (!raw) return { ...ACCESSIBILITY_DEFAULTS }

    const parsed = JSON.parse(raw)
    const nextState = { ...ACCESSIBILITY_DEFAULTS }

    Object.keys(ACCESSIBILITY_DEFAULTS).forEach((key) => {
      nextState[key] = Boolean(parsed?.[key])
    })

    return nextState
  } catch (error) {
    return { ...ACCESSIBILITY_DEFAULTS }
  }
}

function saveAccessibilitySettings() {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(accessibilityState))
  } catch (error) {
    // Ignore storage failures.
  }
}

function isReducedMotionRequested() {
  const root = document.documentElement

  if (root.classList.contains(ACCESSIBILITY_ROOT_CLASSES.reducedMotion)) {
    return true
  }

  try {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  } catch (error) {
    return false
  }
}

function dispatchAccessibilityChange() {
  document.dispatchEvent(
    new CustomEvent("site-accessibility-change", {
      detail: {
        settings: { ...accessibilityState },
      },
    })
  )
}

function updateAccessibilityToggleLabel() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()
  const label = accessibilityPanelOpen ? copy.closeButton : copy.openButton

  accessibilityRefs.fab.setAttribute("aria-label", label)
  accessibilityRefs.fab.setAttribute("title", label)
  accessibilityRefs.closeButton.setAttribute("aria-label", copy.closeButton)
}

function updateAccessibilityStatus() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()
  const activeCount = Object.values(accessibilityState).filter(Boolean).length

  accessibilityRefs.status.textContent = activeCount
    ? copy.statusActive.replace("{count}", activeCount)
    : copy.statusDefault
}

function updateAccessibilityOptionStates() {
  if (!accessibilityRefs) return

  accessibilityRefs.optionButtons.forEach((button) => {
    const key = button.dataset.a11ySetting
    const enabled = Boolean(accessibilityState[key])

    button.classList.toggle("is-active", enabled)
    button.setAttribute("aria-pressed", String(enabled))
  })
}

function applyAccessibilitySettings() {
  const root = document.documentElement

  Object.entries(ACCESSIBILITY_ROOT_CLASSES).forEach(([key, className]) => {
    root.classList.toggle(className, Boolean(accessibilityState[key]))
  })

  updateAccessibilityOptionStates()
  updateAccessibilityStatus()
  dispatchAccessibilityChange()
}

function updateAccessibilityCopy() {
  if (!accessibilityRefs) return

  const copy = getAccessibilityBundle()

  accessibilityRefs.skipLink.textContent = copy.skipLink
  accessibilityRefs.eyebrow.textContent = copy.eyebrow
  accessibilityRefs.title.textContent = copy.title
  accessibilityRefs.description.textContent = copy.description
  accessibilityRefs.resetButton.textContent = copy.reset
  if (accessibilityRefs.supportTitle) {
    accessibilityRefs.supportTitle.textContent = copy.siteSupportTitle
  }

  accessibilityRefs.optionButtons.forEach((button) => {
    const key = button.dataset.a11ySetting
    const optionCopy = copy.options[key]
    if (!optionCopy) return

    const titleEl = button.querySelector(".a11y-option__title")
    const descriptionEl = button.querySelector(".a11y-option__description")

    if (titleEl) titleEl.textContent = optionCopy.label
    if (descriptionEl) descriptionEl.textContent = optionCopy.description
  })

  accessibilityRefs.supportItems.forEach((item, index) => {
    item.textContent = copy.siteSupport[index] || accessibilityCopy.en.siteSupport[index] || ""
  })

  updateAccessibilityStatus()
  updateAccessibilityToggleLabel()
}

function openAccessibilityPanel() {
  if (!accessibilityRefs || accessibilityPanelOpen) return

  accessibilityPanelOpen = true

  accessibilityRefs.fab.setAttribute("aria-expanded", "true")
  accessibilityRefs.panel.setAttribute("aria-hidden", "false")
  accessibilityRefs.backdrop.classList.add("is-visible")
  accessibilityRefs.panel.classList.add("is-open")
  document.body.classList.add("a11y-panel-open")

  updateAccessibilityToggleLabel()

  requestAnimationFrame(() => {
    accessibilityRefs.closeButton.focus()
  })
}

function closeAccessibilityPanel(restoreFocus = true) {
  if (!accessibilityRefs || !accessibilityPanelOpen) return

  accessibilityPanelOpen = false

  accessibilityRefs.fab.setAttribute("aria-expanded", "false")
  accessibilityRefs.panel.setAttribute("aria-hidden", "true")
  accessibilityRefs.backdrop.classList.remove("is-visible")
  accessibilityRefs.panel.classList.remove("is-open")
  document.body.classList.remove("a11y-panel-open")

  updateAccessibilityToggleLabel()

  if (restoreFocus) {
    accessibilityRefs.fab.focus()
  }
}

function toggleAccessibilitySetting(key) {
  if (!(key in ACCESSIBILITY_DEFAULTS)) return

  accessibilityState[key] = !accessibilityState[key]
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function resetAccessibilitySettings() {
  accessibilityState = { ...ACCESSIBILITY_DEFAULTS }
  applyAccessibilitySettings()
  saveAccessibilitySettings()
}

function handleAccessibilityEscape(event) {
  if (event.key === "Escape") {
    closeAccessibilityPanel()
  }
}

function handleAccessibilityMotionPreferenceChange() {
  dispatchAccessibilityChange()
}

function setupAccessibilityWidget() {
  if (accessibilityRefs) return

  const fab = document.getElementById("a11y-fab")
  const panel = document.getElementById("a11y-panel")
  const backdrop = document.getElementById("a11y-backdrop")
  const closeButton = document.getElementById("a11y-close")
  const resetButton = document.getElementById("a11y-reset")
  const status = document.getElementById("a11y-status")
  const title = document.getElementById("a11y-title")
  const description = document.getElementById("a11y-description")
  const eyebrow = document.getElementById("a11y-eyebrow")
  const supportTitle = document.getElementById("a11y-support-title")
  const skipLink = document.querySelector(".skip-link")
  const optionButtons = Array.from(document.querySelectorAll(".a11y-option"))
  const supportItems = Array.from(document.querySelectorAll(".a11y-support__item"))

  if (!fab || !panel || !backdrop || !closeButton || !resetButton || !status || !title || !description || !eyebrow || !skipLink || !optionButtons.length) {
    return
  }

  accessibilityRefs = {
    fab,
    panel,
    backdrop,
    closeButton,
    resetButton,
    status,
    title,
    description,
    eyebrow,
    supportTitle,
    skipLink,
    optionButtons,
    supportItems,
  }

  accessibilityState = loadAccessibilitySettings()

  fab.addEventListener("click", () => {
    if (accessibilityPanelOpen) {
      closeAccessibilityPanel()
      return
    }

    openAccessibilityPanel()
  })

  closeButton.addEventListener("click", () => closeAccessibilityPanel())
  backdrop.addEventListener("click", () => closeAccessibilityPanel())
  resetButton.addEventListener("click", () => resetAccessibilitySettings())

  optionButtons.forEach((button) => {
    button.addEventListener("click", () => toggleAccessibilitySetting(button.dataset.a11ySetting))
  })

  document.addEventListener("keydown", handleAccessibilityEscape)
  document.addEventListener("site-language-change", updateAccessibilityCopy)

  if (window.matchMedia) {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleAccessibilityMotionPreferenceChange)
    } else if (motionQuery.addListener) {
      motionQuery.addListener(handleAccessibilityMotionPreferenceChange)
    }
  }

  updateAccessibilityCopy()
  applyAccessibilitySettings()
}
