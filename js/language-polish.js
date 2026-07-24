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
            text: "הגדירו אירועי גישה חוזרים ופעולות מתוזמנות ישירות במערכת, בהתאם לאופן שבו האתר או המבנה פועלים, כולל תמיכה בשעון שבת.",
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
        garageDoors: "דלתות גראז' לעסקים",
        rollerShutters: "תריסי גלילה לעסקים",
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
        garageDoors: "Komercyjne bramy garażowe",
        rollerShutters: "Komercyjne rolety rolowane",
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

  const WHATSAPP_HANDLE_LABEL = "WhatsApp @WIFIAGTE";

  const marketingCopyOverrides = {
    en: {
      heroSubtitle: "Smart access control for gates, buildings, parking entrances, and private homes. Secure, private, encrypted, and free of monthly fees.",
      noSimRouterText: "WiFiGate works directly with the device, with no SIM card, no internet plan, and no external Wi-Fi router required.",
      stabilityText: "A streamlined architecture keeps access responsive and dependable while supporting secure, private, encrypted operation.",
      securityText: "WiFiGate is designed around secure handling, encrypted storage, and private operation.",
      storyBadge: "Encrypted Access",
    },
    he: {
      noSimRouterText: "WIFIGATE פועלת ישירות מול ההתקן, בלי כרטיס SIM, בלי חבילת אינטרנט ובלי צורך בנתב Wi-Fi חיצוני.",
      stabilityText: "ארכיטקטורה יעילה שומרת על גישה מהירה ואמינה, תוך שמירה על אבטחה, פרטיות והצפנה.",
      securityText: "WIFIGATE מתוכננת סביב טיפול מאובטח, אחסון מוצפן ושמירה על פרטיות.",
      storyBadge: "גישה מוצפנת",
    },
    es: {
      noSimRouterText: "WIFIGATE funciona directamente con el dispositivo, sin tarjeta SIM, plan de Internet ni router Wi-Fi externo.",
      stabilityText: "Una arquitectura optimizada mantiene el acceso ágil y confiable, con una operación segura, privada y cifrada.",
      securityText: "WIFIGATE está diseñada en torno a una gestión segura, almacenamiento cifrado y operación privada.",
      storyBadge: "Acceso cifrado",
    },
    fr: {
      noSimRouterText: "WIFIGATE fonctionne directement avec l'appareil, sans carte SIM, sans forfait Internet et sans routeur Wi-Fi externe.",
      stabilityText: "Une architecture optimisée maintient un accès réactif et fiable, avec un fonctionnement sécurisé, privé et chiffré.",
      securityText: "WIFIGATE est conçue autour d'une gestion sécurisée, d'un stockage chiffré et d'un fonctionnement privé.",
      storyBadge: "Accès chiffré",
    },
    de: {
      noSimRouterText: "WIFIGATE arbeitet direkt mit dem Gerät, ohne SIM-Karte, ohne Internettarif und ohne externen WLAN-Router.",
      stabilityText: "Eine optimierte Architektur hält den Zugriff reaktionsschnell und zuverlässig und unterstützt einen sicheren, privaten und verschlüsselten Betrieb.",
      securityText: "WIFIGATE ist auf sichere Handhabung, verschlüsselte Speicherung und privaten Betrieb ausgelegt.",
      storyBadge: "Verschlüsselter Zugang",
    },
    nl: {
      noSimRouterText: "WIFIGATE werkt rechtstreeks met het apparaat, zonder simkaart, internetabonnement of externe Wi-Fi-router.",
      stabilityText: "Een gestroomlijnde architectuur houdt de toegang responsief en betrouwbaar en ondersteunt een veilige, private en versleutelde werking.",
      securityText: "WIFIGATE is ontworpen rond veilige verwerking, versleutelde opslag en private werking.",
      storyBadge: "Versleutelde toegang",
    },
    it: {
      noSimRouterText: "WIFIGATE funziona direttamente con il dispositivo, senza scheda SIM, senza piano Internet e senza router Wi-Fi esterno.",
      stabilityText: "Un'architettura ottimizzata mantiene l'accesso reattivo e affidabile, supportando un funzionamento sicuro, privato e crittografato.",
      securityText: "WIFIGATE è progettata attorno a una gestione sicura, archiviazione crittografata e funzionamento privato.",
      storyBadge: "Accesso crittografato",
    },
    pt: {
      noSimRouterText: "A WIFIGATE funciona diretamente com o dispositivo, sem cartão SIM, sem plano de internet e sem necessidade de roteador Wi-Fi externo.",
      stabilityText: "Uma arquitetura otimizada mantém o acesso ágil e confiável, com uma operação segura, privada e criptografada.",
      securityText: "A WIFIGATE foi concebida com foco em manuseio seguro, armazenamento criptografado e operação privada.",
      storyBadge: "Acesso criptografado",
    },
    pl: {
      noSimRouterText: "WIFIGATE działa bezpośrednio z urządzeniem, bez karty SIM, bez pakietu internetowego i bez zewnętrznego routera Wi-Fi.",
      stabilityText: "Usprawniona architektura utrzymuje szybki i niezawodny dostęp, wspierając bezpieczne, prywatne i szyfrowane działanie.",
      securityText: "WIFIGATE została zaprojektowana z myślą o bezpiecznej obsłudze, szyfrowanym przechowywaniu i prywatnym działaniu.",
      storyBadge: "Szyfrowany dostęp",
    },
    no: {
      noSimRouterText: "WIFIGATE fungerer direkte med enheten, uten SIM-kort, internettabonnement eller ekstern Wi-Fi-ruter.",
      stabilityText: "En strømlinjeformet arkitektur holder tilgangen rask og pålitelig og støtter sikker, privat og kryptert drift.",
      securityText: "WIFIGATE er utviklet rundt sikker håndtering, kryptert lagring og privat drift.",
      storyBadge: "Kryptert tilgang",
    },
    cs: {
      noSimRouterText: "WIFIGATE funguje přímo se zařízením, bez SIM karty, bez internetového tarifu a bez externího Wi-Fi routeru.",
      stabilityText: "Optimalizovaná architektura udržuje přístup rychlý a spolehlivý a podporuje bezpečný, soukromý a šifrovaný provoz.",
      securityText: "WIFIGATE je navržena s důrazem na bezpečné zpracování, šifrované ukládání a soukromý provoz.",
      storyBadge: "Šifrovaný přístup",
    },
    ru: {
      noSimRouterText: "WIFIGATE работает напрямую с устройством, без SIM-карты, без интернет-тарифа и без внешнего Wi-Fi роутера.",
      stabilityText: "Оптимизированная архитектура сохраняет быстрый и надежный доступ и поддерживает безопасную, приватную и зашифрованную работу.",
      securityText: "WIFIGATE разработана с упором на безопасную обработку, зашифрованное хранение и приватную работу.",
      storyBadge: "Зашифрованный доступ",
    },
    uk: {
      noSimRouterText: "WIFIGATE працює безпосередньо з пристроєм, без SIM-картки, без інтернет-тарифу та без зовнішнього Wi-Fi роутера.",
      stabilityText: "Оптимізована архітектура зберігає швидкий і надійний доступ та підтримує безпечну, приватну й зашифровану роботу.",
      securityText: "WIFIGATE розроблена з акцентом на безпечну обробку, зашифроване зберігання та приватну роботу.",
      storyBadge: "Зашифрований доступ",
    },
    tr: {
      noSimRouterText: "WIFIGATE, SIM kart, internet paketi veya harici Wi-Fi yönlendirici gerektirmeden doğrudan cihazla çalışır.",
      stabilityText: "Optimize edilmiş mimari, erişimi hızlı ve güvenilir tutarken güvenli, özel ve şifreli çalışmayı destekler.",
      securityText: "WIFIGATE; güvenli işleme, şifreli depolama ve özel çalışma odağında tasarlanmıştır.",
      storyBadge: "Şifreli erişim",
    },
    ar: {
      noSimRouterText: "يعمل WIFIGATE مباشرة مع الجهاز، من دون بطاقة SIM أو باقة إنترنت أو جهاز توجيه Wi-Fi خارجي.",
      stabilityText: "تحافظ البنية المحسّنة على وصول سريع وموثوق وتدعم تشغيلًا آمنًا وخاصًا ومشفّرًا.",
      securityText: "صُممت WIFIGATE حول المعالجة الآمنة والتخزين المشفّر والتشغيل الخاص.",
      storyBadge: "وصول مشفّر",
    },
    hi: {
      noSimRouterText: "WIFIGATE डिवाइस के साथ सीधे काम करता है, बिना SIM कार्ड, बिना इंटरनेट प्लान और बिना बाहरी Wi-Fi राउटर के।",
      stabilityText: "सुव्यवस्थित आर्किटेक्चर एक्सेस को तेज और भरोसेमंद रखता है और सुरक्षित, निजी और एन्क्रिप्टेड संचालन का समर्थन करता है।",
      securityText: "WIFIGATE को सुरक्षित प्रबंधन, एन्क्रिप्टेड स्टोरेज और निजी संचालन को ध्यान में रखकर बनाया गया है।",
      storyBadge: "एन्क्रिप्टेड एक्सेस",
    },
    bn: {
      noSimRouterText: "WIFIGATE ডিভাইসের সাথে সরাসরি কাজ করে, SIM কার্ড, ইন্টারনেট প্ল্যান বা বাহ্যিক Wi-Fi রাউটার ছাড়াই।",
      stabilityText: "একটি সুসংগঠিত আর্কিটেকচার অ্যাক্সেসকে দ্রুত ও নির্ভরযোগ্য রাখে এবং নিরাপদ, ব্যক্তিগত ও এনক্রিপ্টেড অপারেশনকে সমর্থন করে।",
      securityText: "WIFIGATE নিরাপদ ব্যবস্থাপনা, এনক্রিপ্টেড স্টোরেজ এবং ব্যক্তিগত অপারেশনকে কেন্দ্র করে তৈরি।",
      storyBadge: "এনক্রিপ্টেড অ্যাক্সেস",
    },
    mr: {
      noSimRouterText: "WIFIGATE हे उपकरणाशी थेट कार्य करते, SIM कार्ड, इंटरनेट प्लॅन किंवा बाह्य Wi-Fi राउटरशिवाय.",
      stabilityText: "सुलभ आर्किटेक्चरमुळे प्रवेश जलद आणि विश्वासार्ह राहतो आणि सुरक्षित, खाजगी व एन्क्रिप्टेड कार्यप्रणालीला आधार मिळतो.",
      securityText: "WIFIGATE सुरक्षित हाताळणी, एन्क्रिप्टेड स्टोरेज आणि खाजगी कार्यप्रणाली लक्षात घेऊन तयार केले आहे.",
      storyBadge: "एन्क्रिप्टेड प्रवेश",
    },
    te: {
      noSimRouterText: "WIFIGATE పరికరంతో నేరుగా పనిచేస్తుంది; SIM కార్డ్, ఇంటర్నెట్ ప్లాన్ లేదా బాహ్య Wi-Fi రౌటర్ అవసరం లేదు.",
      stabilityText: "సరళీకృత నిర్మాణం యాక్సెస్‌ను వేగంగా మరియు నమ్మదగినదిగా ఉంచి, సురక్షితమైన, ప్రైవేట్ మరియు ఎన్‌క్రిప్టెడ్ ఆపరేషన్‌కు మద్దతు ఇస్తుంది.",
      securityText: "WIFIGATE సురక్షిత నిర్వహణ, ఎన్‌క్రిప్టెడ్ నిల్వ మరియు ప్రైవేట్ ఆపరేషన్‌ను కేంద్రంగా చేసుకుని రూపొందించబడింది.",
      storyBadge: "ఎన్‌క్రిప్టెడ్ యాక్సెస్",
    },
    "zh-Hans": {
      noSimRouterText: "WIFIGATE 可直接与设备配合工作，无需 SIM 卡、互联网套餐或外部 Wi-Fi 路由器。",
      stabilityText: "精简的架构让访问保持快速可靠，并支持安全、私密、加密的运行方式。",
      securityText: "WIFIGATE 围绕安全处理、加密存储和私密运行而设计。",
      storyBadge: "加密访问",
    },
    "zh-Hant": {
      noSimRouterText: "WIFIGATE 可直接與設備配合運作，無需 SIM 卡、網路方案或外部 Wi-Fi 路由器。",
      stabilityText: "精簡的架構讓存取保持快速可靠，並支援安全、私密、加密的運作方式。",
      securityText: "WIFIGATE 圍繞安全處理、加密儲存與私密運作而設計。",
      storyBadge: "加密存取",
    },
    ja: {
      noSimRouterText: "WIFIGATE は端末と直接連携して動作し、SIM カード、インターネット契約、外部 Wi-Fi ルーターは不要です。",
      stabilityText: "最適化されたアーキテクチャにより、アクセスは素早く確実に保たれ、安全でプライベートかつ暗号化された運用を支えます。",
      securityText: "WIFIGATE は、安全な取り扱い、暗号化ストレージ、プライベートな運用を前提に設計されています。",
      storyBadge: "暗号化アクセス",
    },
    ko: {
      noSimRouterText: "WIFIGATE는 SIM 카드, 인터넷 요금제, 외부 Wi-Fi 라우터 없이 기기와 직접 작동합니다.",
      stabilityText: "최적화된 아키텍처는 접근을 빠르고 안정적으로 유지하면서 안전하고 비공개이며 암호화된 운영을 지원합니다.",
      securityText: "WIFIGATE는 안전한 처리, 암호화 저장소, 비공개 운영을 중심으로 설계되었습니다.",
      storyBadge: "암호화된 접근",
    },
    da: {
      noSimRouterText: "WIFIGATE fungerer direkte med enheden uden SIM-kort, internetabonnement eller ekstern Wi-Fi-router.",
      stabilityText: "En strømlinet arkitektur holder adgangen hurtig og pålidelig og understøtter sikker, privat og krypteret drift.",
      securityText: "WIFIGATE er udviklet med fokus på sikker håndtering, krypteret lagring og privat drift.",
      storyBadge: "Krypteret adgang",
    },
    hu: {
      noSimRouterText: "A WIFIGATE közvetlenül az eszközzel működik, SIM-kártya, internetcsomag és külső Wi-Fi router nélkül.",
      stabilityText: "Az optimalizált architektúra gyors és megbízható hozzáférést biztosít, miközben támogatja a biztonságos, privát és titkosított működést.",
      securityText: "A WIFIGATE biztonságos kezelésre, titkosított tárolásra és privát működésre épül.",
      storyBadge: "Titkosított hozzáférés",
    },
  };

  const applyMarketingCopyOverrides = (lang, bundle) => {
    if (!bundle || typeof bundle !== "object") {
      return;
    }

    const copy = marketingCopyOverrides[lang];
    if (!copy) {
      return;
    }

    if (copy.heroSubtitle && bundle.hero) {
      bundle.hero.subtitle = copy.heroSubtitle;
    }

    const items = bundle.features?.items;
    if (items?.noSimRouter && copy.noSimRouterText) {
      items.noSimRouter.text = copy.noSimRouterText;
    }
    if (items?.stability && copy.stabilityText) {
      items.stability.text = copy.stabilityText;
    }
    if (items?.history30Day) {
      if (typeof items.history30Day.title === "string") {
        items.history30Day.title = items.history30Day.title.replace(/30/g, "90");
      }
      if (typeof items.history30Day.text === "string") {
        items.history30Day.text = items.history30Day.text.replace(/30/g, "90");
      }
    }
    if (items?.securityPrivacy && copy.securityText) {
      items.securityPrivacy.text = copy.securityText;
    }

    if (bundle.contact?.ctaButton) {
      bundle.contact.ctaButton = WHATSAPP_HANDLE_LABEL;
    }

    if (bundle.legal?.cta?.pricing?.button) {
      bundle.legal.cta.pricing.button = WHATSAPP_HANDLE_LABEL;
    }

    if (bundle.cta?.pricing?.button) {
      bundle.cta.pricing.button = WHATSAPP_HANDLE_LABEL;
    }
  };

  const applyStoryBadgeOverrides = (lang, storyGroup) => {
    const badgeLabel = marketingCopyOverrides[lang]?.storyBadge;
    if (!badgeLabel || !storyGroup || typeof storyGroup !== "object") {
      return;
    }

    if (Array.isArray(storyGroup.badges) && storyGroup.badges.length) {
      storyGroup.badges[0] = badgeLabel;
    }

    Object.values(storyGroup).forEach((story) => {
      if (story && typeof story === "object" && Array.isArray(story.badges) && story.badges.length) {
        story.badges[0] = badgeLabel;
      }
    });
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
      applyMarketingCopyOverrides(lang, translations[lang]);
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
    Object.keys(APPLICATION_STORY_UI).forEach((lang) => {
      applyStoryBadgeOverrides(lang, APPLICATION_STORY_UI[lang]);
    });
    polishStringsDeep(APPLICATION_STORY_UI);
  }

  if (typeof APPLICATION_STORIES !== "undefined") {
    Object.keys(APPLICATION_STORIES).forEach((lang) => {
      applyStoryBadgeOverrides(lang, APPLICATION_STORIES[lang]);
    });
    polishStringsDeep(APPLICATION_STORIES);
  }
})();
