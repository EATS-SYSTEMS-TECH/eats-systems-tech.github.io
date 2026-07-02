// /js/language-polish.js
// Final copy polish applied after generated locale bundles.
(function () {
  const deepMerge = (target, source) => {
    if (!target || typeof target !== "object" || !source || typeof source !== "object") {
      return target;
    }

    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (Array.isArray(value)) {
        target[key] = value.slice();
        return;
      }

      if (value && typeof value === "object") {
        if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
          target[key] = {};
        }
        deepMerge(target[key], value);
        return;
      }

      target[key] = value;
    });

    return target;
  };

  const textReplacements = [
    [/\bWiFiGate\b/g, "WIFIGATE"],
    [/PORTE WIFI/g, "WIFIGATE"],
    [/WIFIGAAT/g, "WIFIGATE"],
    [/वाईफ़ाईगेट/g, "WIFIGATE"],
    [/विफ़िगेट/g, "WIFIGATE"],
    [/వైఫైగేట్/g, "WIFIGATE"],
    [/উইফিগেট/g, "WIFIGATE"],
    [/ウィフィゲート/g, "WIFIGATE"],
    [/Nef d'Itay/g, "Itay Nave"],
    [/Itay schip/g, "Itay Nave"],
    [/Italia Navata/g, "Itay Nave"],
    [/Неф Ітай/g, "Itay Nave"],
    [/Ітай Неф/g, "Itay Nave"],
    [/İtalya Nefi/g, "Itay Nave"],
    [/伊泰中殿/g, "Itay Nave"],
    [/इतेय नवे/g, "Itay Nave"],
    [/इटय नवे/g, "Itay Nave"],
    [/ఇతయ్ నవే/g, "Itay Nave"],
  ];

  const polishString = (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return textReplacements.reduce((text, replacement) => text.replace(replacement[0], replacement[1]), value);
  };

  const polishStringsDeep = (value) => {
    if (typeof value === "string") {
      return polishString(value);
    }

    if (Array.isArray(value)) {
      return value.map(polishStringsDeep);
    }

    if (value && typeof value === "object") {
      Object.keys(value).forEach((key) => {
        value[key] = polishStringsDeep(value[key]);
      });
    }

    return value;
  };

  const translationOverrides = {
    en: {
      applications: {
        barrierGates: "Barrier Gates",
      },
      features: {
        items: {
          upTo10Events: {
            title: "Up to 10 Scheduled Events",
            text: "Create recurring access schedules and automated actions directly in the system to match how your site operates.",
          },
          rfRemoteLearning: {
            title: "Digital RF Remote Learning",
            text: "Teach and manage RF remotes digitally through the platform instead of relying on manual programming workflows.",
          },
        },
      },
    },
    he: {
      hero: {
        media: {
          replay: "נגן את הסרטון שוב",
          mute: "השתק את הסרטון",
          unmute: "הפעל קול בסרטון",
        },
      },
      features: {
        title: "היתרונות של WIFIGATE",
        subtitle: "כמה יכולות מעשיות שהופכות את WIFIGATE למערכת יציבה, מאובטחת וקלה לניהול בשימוש יום-יומי.",
        items: {
          noSimRouter: {
            title: "בלי SIM ובלי נתב חיצוני",
            text: "WIFIGATE פועלת בחיבור מקומי ישיר להתקן, בלי כרטיס SIM, בלי חבילת אינטרנט ובלי צורך בנתב Wi-Fi חיצוני.",
          },
          stability: {
            title: "יציבות",
            text: "ארכיטקטורה מקומית שומרת על פתיחה מהירה ואמינה, עם פחות תלות בגורמים חיצוניים ופחות נקודות כשל בתפעול השוטף.",
          },
          quickGuestInvite: {
            title: "הזמנת אורח מהירה",
            text: "שלחו הזמנה מאובטחת לאורחים בתוך שניות, כדי שמבקרים יוכלו להיכנס בלי שיחות, בלי שלטים משותפים ובלי תיאום ידני.",
          },
          history30Day: {
            title: "היסטוריית כניסות ל-90 יום",
            text: "צפו בפעילות הגישה של 90 הימים האחרונים וקבלו תמונה ברורה של השימוש בשער ושל אירועי כניסה אחרונים.",
          },
          autoOpen: {
            title: "פתיחה אוטומטית",
            text: "אפשרו למשתמשים מורשים לפתוח את השער אוטומטית כשהם מגיעים, לחוויית כניסה חלקה ונוחה יותר.",
          },
          upTo10Events: {
            title: "עד 10 אירועים מתוזמנים",
            text: "הגדירו אירועי גישה חוזרים ופעולות מתוזמנות ישירות במערכת, בהתאם לאופן שבו האתר או המבנה פועלים.",
          },
          rfRemoteLearning: {
            title: "למידה דיגיטלית של שלטי RF",
            text: "למידה דיגיטלית של שלטי RF באמצעות האפליקציה.",
          },
          securityPrivacy: {
            title: "אבטחה ופרטיות",
            text: "הגישה מנוהלת בצורה מאובטחת, עם אחסון מוצפן ושמירה על פרטיות המשתמשים.",
          },
          noSubscriptionFees: {
            title: "ללא דמי מנוי",
            text: "משלמים פעם אחת על ההתקן וההתקנה, בלי מנוי חודשי, בלי חידושים ובלי עמלת פלטפורמה מתמשכת.",
          },
        },
      },
      action: {
        subtitle: "WIFIGATE מתאימה למגוון רחב של סביבות ומספקת פתרון חכם, מאובטח ונוח לניהול גישה, מבתים פרטיים ועד סביבות מסחריות וארגוניות.",
      },
      applications: {
        barrierGates: "שערי מחסום",
        hotels: "מלונות, Airbnb ואתרי אירוח",
        rollerShutters: "חניונים מסחריים ותריסי גלילה",
      },
      contact: {
        name: "איתי נוה",
      },
    },
    es: {
      applications: {
        barrierGates: "Barreras vehiculares",
        officeBuildings: "Edificios de oficinas",
        industrialFacilities: "Instalaciones industriales",
        sportsFacilities: "Instalaciones deportivas",
        educationalInstitutions: "Instituciones educativas",
      },
      features: {
        items: {
          history30Day: { title: "Historial de 30 días" },
          upTo10Events: {
            title: "Hasta 10 eventos programados",
            text: "Configura accesos recurrentes y acciones programadas directamente en el sistema, según el funcionamiento de tu sitio.",
          },
          rfRemoteLearning: {
            title: "Aprendizaje digital de mandos RF",
            text: "Da de alta y gestiona mandos RF desde la plataforma, sin depender de procesos manuales desconectados.",
          },
        },
      },
    },
    fr: {
      applications: {
        barrierGates: "Barrières levantes",
        electricGates: "Portails électriques",
      },
      contact: {
        ctaTitle: "Intéressé par WIFIGATE ?",
        name: "Itay Nave",
      },
      footer: {
        copyright: "WIFIGATE. Tous droits réservés.",
        cookies: "Cookies",
      },
      hero: {
        systems: {
          barrier: { label: "Barrière levante" },
          maglock: { kicker: "Verrou", label: "Serrure magnétique" },
          power: { kicker: "Alimentation" },
        },
      },
      features: {
        items: {
          upTo10Events: {
            title: "Jusqu'à 10 événements programmés",
            text: "Configurez des accès récurrents et des actions planifiées directement dans le système, selon le fonctionnement de votre site.",
          },
          rfRemoteLearning: {
            title: "Apprentissage numérique des télécommandes RF",
            text: "Enregistrez et gérez les télécommandes RF depuis la plateforme, sans procédures manuelles isolées.",
          },
        },
      },
    },
    de: {
      nav: {
        home: "Startseite",
        contact: "Kontakt",
      },
      applications: {
        barrierGates: "Schranken",
      },
      footer: {
        tagline: "Smart. Sicher. Privat. Ohne Abonnement. Ohne Kompromisse.",
        cookies: "Cookies",
      },
      hero: {
        systems: {
          barrier: { label: "Schranke" },
          maglock: { kicker: "Schloss", label: "Magnetschloss" },
          power: { kicker: "Stromversorgung" },
        },
      },
      features: {
        items: {
          autoOpen: {
            text: "Autorisierte Nutzer können das Tor bei ihrer Ankunft automatisch öffnen, für einen reibungsloseren und bequemeren Ablauf.",
          },
          upTo10Events: {
            title: "Bis zu 10 Zeitpläne",
            text: "Richten Sie wiederkehrende Zutrittsereignisse und geplante Aktionen direkt im System ein, passend zu Ihrem Standort.",
          },
          rfRemoteLearning: {
            title: "Digitales Anlernen von RF-Fernbedienungen",
            text: "Lernen und verwalten Sie RF-Fernbedienungen digital über die Plattform, statt getrennte manuelle Programmierabläufe zu nutzen.",
          },
        },
      },
    },
    nl: {
      nav: {
        home: "Home",
        contact: "Contact",
      },
      applications: {
        barrierGates: "Slagbomen",
      },
      contact: {
        name: "Itay Nave",
      },
      footer: {
        copyright: "WIFIGATE. Alle rechten voorbehouden.",
        tagline: "Slim. Veilig. Privé. Geen abonnement. Geen compromissen.",
        cookies: "Cookies",
      },
      hero: {
        systems: {
          barrier: { label: "Slagboom" },
          maglock: { kicker: "Slot", label: "Magneetslot" },
          power: { kicker: "Voeding" },
        },
      },
      features: {
        items: {
          upTo10Events: {
            title: "Tot 10 planningen",
            text: "Stel terugkerende toegangen en geplande acties rechtstreeks in het systeem in, afgestemd op de werking van uw locatie.",
          },
          rfRemoteLearning: {
            title: "RF-afstandsbedieningen digitaal inleren",
            text: "Leer RF-afstandsbedieningen digitaal in en beheer ze via het platform, zonder losse handmatige programmeerstappen.",
          },
        },
      },
    },
    it: {
      applications: {
        barrierGates: "Barriere automatiche",
      },
      contact: {
        name: "Itay Nave",
      },
      footer: {
        cookies: "Cookie",
      },
      hero: {
        systems: {
          barrier: { label: "Barriera automatica" },
          maglock: { kicker: "Serratura", label: "Serratura magnetica" },
          power: { kicker: "Alimentazione" },
        },
      },
      features: {
        items: {
          upTo10Events: {
            title: "Fino a 10 eventi programmati",
            text: "Configura accessi ricorrenti e azioni programmate direttamente nel sistema, in base al funzionamento del tuo sito.",
          },
          rfRemoteLearning: {
            title: "Apprendimento digitale dei telecomandi RF",
            text: "Memorizza e gestisci i telecomandi RF dalla piattaforma, senza procedure manuali separate.",
          },
        },
      },
    },
    pt: {
      applications: {
        barrierGates: "Barreiras automáticas",
        residentialComplexes: "Edifícios residenciais",
        sportsFacilities: "Instalações desportivas",
      },
      hero: {
        systems: {
          barrier: { label: "Barreira automática" },
          maglock: { kicker: "Fechadura" },
          power: { kicker: "Alimentação" },
        },
      },
      features: {
        items: {
          upTo10Events: {
            title: "Até 10 eventos programados",
            text: "Configure acessos recorrentes e ações programadas diretamente no sistema, de acordo com a operação do seu espaço.",
          },
          rfRemoteLearning: {
            title: "Aprendizagem digital de comandos RF",
            text: "Registe e faça a gestão de comandos RF através da plataforma, sem depender de programação manual isolada.",
          },
        },
      },
    },
    pl: {
      applications: {
        barrierGates: "Szlabany",
        rollerShutters: "Garaże komercyjne i bramy rolowane",
      },
      features: {
        items: {
          upTo10Events: {
            title: "Do 10 harmonogramów",
            text: "Ustawiaj cykliczny dostęp i zaplanowane działania bezpośrednio w systemie, zgodnie ze sposobem działania obiektu.",
          },
          rfRemoteLearning: {
            title: "Cyfrowe uczenie pilotów RF",
            text: "Dodawaj i zarządzaj pilotami RF cyfrowo w platformie, bez odrębnych ręcznych procedur programowania.",
          },
        },
      },
    },
    no: {
      applications: {
        barrierGates: "Bomanlegg",
      },
      hero: {
        systems: {
          barrier: { label: "Bom" },
          power: { kicker: "Strøm inn" },
        },
      },
      features: {
        items: {
          upTo10Events: {
            title: "Opptil 10 tidsplaner",
            text: "Sett opp gjentakende adgang og planlagte handlinger direkte i systemet, tilpasset måten stedet brukes på.",
          },
          rfRemoteLearning: {
            title: "Digital innlæring av RF-fjernkontroller",
            text: "Lær inn og administrer RF-fjernkontroller digitalt i plattformen, uten separate manuelle programmeringsrutiner.",
          },
        },
      },
    },
    cs: {
      applications: {
        barrierGates: "Závory",
        residentialComplexes: "Bytové domy",
      },
      features: {
        items: {
          upTo10Events: {
            title: "Až 10 plánovaných událostí",
            text: "Nastavte opakovaný přístup a plánované akce přímo v systému podle provozu vašeho objektu.",
          },
          rfRemoteLearning: {
            title: "Digitální učení RF ovladačů",
            text: "Učte a spravujte RF ovladače digitálně v platformě, bez oddělených ručních programovacích postupů.",
          },
        },
      },
    },
    uk: {
      contact: {
        name: "Itay Nave",
      },
      footer: {
        cookies: "Файли cookie",
      },
      applications: {
        barrierGates: "Шлагбауми",
      },
    },
    tr: {
      contact: {
        name: "Itay Nave",
      },
      applications: {
        barrierGates: "Bariyer kapıları",
      },
    },
    hi: {
      contact: {
        name: "Itay Nave",
      },
      footer: {
        copyright: "WIFIGATE. सर्वाधिकार सुरक्षित.",
      },
      applications: {
        barrierGates: "बैरियर गेट",
      },
    },
    bn: {
      footer: {
        copyright: "WIFIGATE. সর্বস্বত্ব সংরক্ষিত।",
      },
      applications: {
        barrierGates: "ব্যারিয়ার গেট",
      },
    },
    mr: {
      contact: {
        name: "Itay Nave",
      },
      applications: {
        barrierGates: "बॅरियर गेट्स",
      },
    },
    te: {
      contact: {
        name: "Itay Nave",
      },
      footer: {
        copyright: "WIFIGATE. అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.",
        cookies: "Cookies",
      },
      applications: {
        barrierGates: "బారియర్ గేట్లు",
      },
      hero: {
        systems: {
          maglock: { kicker: "లాక్" },
        },
      },
    },
    "zh-Hans": {
      contact: {
        name: "Itay Nave",
      },
      footer: {
        tagline: "智能。安全。私密。无需订阅。绝不妥协。",
        cookies: "Cookie",
      },
      applications: {
        barrierGates: "道闸",
      },
      hero: {
        systems: {
          door: { kicker: "通行" },
          field: { kicker: "通行" },
          shutter: { label: "卷帘门" },
        },
      },
    },
    "zh-Hant": {
      contact: {
        name: "Itay Nave",
      },
      footer: {
        tagline: "智慧。安全。私密。無需訂閱。絕不妥協。",
        cookies: "Cookie",
      },
      applications: {
        barrierGates: "道閘",
      },
      hero: {
        systems: {
          door: { kicker: "通行" },
          field: { kicker: "通行" },
          shutter: { label: "捲簾門" },
        },
      },
    },
    ja: {
      contact: {
        name: "Itay Nave",
        whatsapp: "WhatsApp",
      },
      footer: {
        copyright: "WIFIGATE. All rights reserved.",
        tagline: "スマート。安全。プライベート。サブスク不要。妥協なし。",
        cookies: "Cookie",
      },
      applications: {
        barrierGates: "バーゲート",
      },
    },
    ko: {
      contact: {
        name: "Itay Nave",
        whatsapp: "WhatsApp",
      },
      footer: {
        tagline: "스마트하게. 안전하게. 비공개로. 구독 없이. 타협 없이.",
      },
      applications: {
        barrierGates: "차량 차단기",
      },
      hero: {
        systems: {
          field: { label: "스포츠 시설" },
          maglock: { label: "자기식 잠금장치" },
        },
      },
    },
    da: {
      nav: {
        about: "Vejledninger",
      },
      applications: {
        barrierGates: "Bomporte",
      },
      hero: {
        systems: {
          barrier: { kicker: "Udgang", label: "Bomport" },
          shutter: { kicker: "Udgang" },
          floodlight: { kicker: "Udgang" },
          power: { kicker: "Strøm ind" },
        },
      },
      features: {
        items: {
          autoOpen: {
            title: "Automatisk åbning",
          },
          upTo10Events: {
            title: "Op til 10 tidsplaner",
            text: "Opsæt tilbagevendende adgang og planlagte handlinger direkte i systemet, så de passer til den daglige drift.",
          },
          rfRemoteLearning: {
            title: "Digital indlæring af RF-fjernbetjeninger",
            text: "Indlær og administrer RF-fjernbetjeninger digitalt i platformen, uden separate manuelle programmeringsforløb.",
          },
        },
      },
    },
    hu: {
      nav: {
        home: "Kezdőlap",
        contact: "Kapcsolat",
      },
      applications: {
        barrierGates: "Sorompók",
      },
      contact: {
        ctaText: "Küldjön WhatsApp-üzenetet, és elküldjük az árajánlatot, a teljes rendszerinformációt és az igényeihez illő alkalmassági felmérést.",
      },
      footer: {
        tagline: "Okos. Biztonságos. Privát. Nincs előfizetés. Nincs kompromisszum.",
      },
      hero: {
        systems: {
          floodlight: { label: "Reflektor" },
          power: { kicker: "Tápellátás" },
        },
      },
      features: {
        items: {
          history30Day: {
            title: "30 napos előzmények",
          },
          autoOpen: {
            text: "Engedélyezze, hogy a jóváhagyott felhasználók érkezéskor automatikusan nyithassák a kaput, a gördülékenyebb belépés érdekében.",
          },
          upTo10Events: {
            title: "Akár 10 ütemezés",
            text: "Állítson be ismétlődő hozzáféréseket és ütemezett műveleteket közvetlenül a rendszerben, az objektum működéséhez igazítva.",
          },
          rfRemoteLearning: {
            title: "RF távirányítók digitális tanítása",
            text: "Tanítsa és kezelje az RF távirányítókat digitálisan a platformon keresztül, külön kézi programozási folyamatok nélkül.",
          },
        },
      },
    },
  };

  const storyUiOverrides = {
    es: {
      demo: "Mejor ángulo de demostración",
      videoLabel: "Vídeo de demostración",
      videoStatus: "Próximamente",
      badges: ["Operación local", "Acceso móvil", "Invitaciones para invitados", "Historial de acceso"],
    },
    pt: {
      summary: "Visão geral",
      demo: "Melhor ângulo de demonstração",
      videoLabel: "Vídeo de demonstração",
      videoStatus: "Em breve",
      badges: ["Operação local", "Acesso móvel", "Convites para convidados", "Histórico de acesso"],
    },
    pl: {
      summary: "Przegląd",
      solution: "Dlaczego WIFIGATE pasuje",
      demo: "Najlepszy kierunek prezentacji",
      videoStatus: "Wkrótce",
      badges: ["Praca lokalna", "Dostęp mobilny", "Zaproszenia gości", "Historia dostępu"],
    },
    cs: {
      summary: "Přehled",
      bulletsTitle: "Proč se toto nasazení hodí",
      problem: "Provozní potřeba",
      solution: "Proč se WIFIGATE hodí",
      buyer: "Ideální zákazníci",
      demo: "Nejlepší směr ukázky",
      winLabel: "Proč si to týmy vybírají",
      videoLabel: "Ukázkové video",
      videoStatus: "Již brzy",
      badges: ["Lokální provoz", "Mobilní přístup", "Pozvánky pro hosty", "Historie přístupu"],
    },
  };

  const cookieTitles = {
    fr: { title: "Cookies", subtitle: "Cette page explique comment le site WIFIGATE peut utiliser des cookies, le stockage local du navigateur et des technologies similaires." },
    de: { title: "Cookies", subtitle: "Diese Seite erklärt, wie die WIFIGATE-Website Cookies, lokalen Browserspeicher und ähnliche Technologien verwenden kann." },
    nl: { title: "Cookies", subtitle: "Deze pagina legt uit hoe de WIFIGATE-website cookies, lokale browseropslag en vergelijkbare technologieën kan gebruiken." },
    it: { title: "Cookie", subtitle: "Questa pagina spiega come il sito WIFIGATE può utilizzare cookie, archiviazione locale del browser e tecnologie simili." },
    uk: { title: "Файли cookie", subtitle: "На цій сторінці пояснюється, як сайт WIFIGATE може використовувати файли cookie, локальне сховище браузера та подібні технології." },
    te: { title: "Cookies", subtitle: "భాషా ప్రాధాన్యతలు, యాక్సెసిబిలిటీ సెట్టింగ్‌లు మరియు సంబంధిత వెబ్‌సైట్ ఫంక్షన్‌లకు మద్దతు ఇవ్వడానికి WIFIGATE వెబ్‌సైట్ Cookies, స్థానిక బ్రౌజర్ నిల్వ మరియు ఇలాంటి సాంకేతికతలను ఎలా ఉపయోగించవచ్చో ఈ పేజీ వివరిస్తుంది." },
    "zh-Hans": { title: "Cookie", subtitle: "本页说明 WIFIGATE 网站如何使用 Cookie、本地浏览器存储和类似技术。" },
    "zh-Hant": { title: "Cookie", subtitle: "本頁說明 WIFIGATE 網站如何使用 Cookie、本機瀏覽器儲存和類似技術。" },
    ja: { title: "Cookie", subtitle: "このページでは、WIFIGATE のウェブサイトが Cookie、ブラウザーのローカルストレージ、および類似技術をどのように使用する場合があるかを説明します。" },
  };

  const cookieTitleNeedles = [
    "cookie",
    "cookies",
    "biscuits",
    "kekse",
    "koekjes",
    "biscotti",
    "печиво",
    "饼干",
    "餅乾",
    "クッキー",
    "కుక్కీలు",
  ];

  const isCookieNotice = (legal) => {
    const title = `${legal?.metaTags?.title || ""} ${legal?.hero?.title || ""}`.toLowerCase();
    return cookieTitleNeedles.some((needle) => title.includes(needle));
  };

  const polishCookieNotice = (lang, bundle) => {
    if (!bundle?.legal || !isCookieNotice(bundle.legal)) {
      return;
    }

    const copy = cookieTitles[lang];
    if (!copy) {
      return;
    }

    deepMerge(bundle.legal, {
      metaTags: {
        title: `${copy.title} | WIFIGATE`,
      },
      hero: {
        title: copy.title,
        subtitle: copy.subtitle,
      },
    });
  };

  if (typeof translations !== "undefined") {
    Object.keys(translationOverrides).forEach((lang) => {
      if (!translations[lang]) {
        translations[lang] = {};
      }
      deepMerge(translations[lang], translationOverrides[lang]);
    });

    Object.keys(translations).forEach((lang) => {
      polishCookieNotice(lang, translations[lang]);
      polishStringsDeep(translations[lang]);
    });
  }

  if (typeof APPLICATION_STORY_UI !== "undefined") {
    Object.keys(storyUiOverrides).forEach((lang) => {
      if (!APPLICATION_STORY_UI[lang]) {
        APPLICATION_STORY_UI[lang] = {};
      }
      deepMerge(APPLICATION_STORY_UI[lang], storyUiOverrides[lang]);
    });
    polishStringsDeep(APPLICATION_STORY_UI);
  }

  if (typeof APPLICATION_STORIES !== "undefined") {
    polishStringsDeep(APPLICATION_STORIES);
  }
})();
