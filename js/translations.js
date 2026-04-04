// /js/translations.js
// Version: 1.2.1

var RTL_LANGS = new Set(["he", "ar"]);

var translations = {
  en: {
    nav: {
      home: "Home",
      features: "Features",
      about: "About",
      contact: "Contact Us"
    },
    hero: {
      rotator: {
        phrases: ["Easy to Use", "Complete Privacy", "No Subscriptions"]
      },
      subtitle: "A smart access-control system that is secure, simple, and free of monthly fees.",
      cta: {
        contact: "Contact Us",
        about: "About"
      },
      systems: {
        barrier: { kicker: "Output", label: "Barrier Gate" },
        shutter: { kicker: "Output", label: "Roller Shutter" },
        floodlight: { kicker: "Output", label: "Floodlight" },
        door: { kicker: "Access", label: "Door" },
        field: { kicker: "Access", label: "Sports Field" },
        maglock: { kicker: "Lock", label: "Magnetic Lock" },
        power: { kicker: "Power In" },
        input: { kicker: "Input" }
      }
    },
    features: {
      title: "Our Capabilities",
      subtitle: "These are some of the capabilities that make WIFIGATE an advanced, secure, and easy-to-manage access-control solution.",
      items: {
        noSubscription: {
          title: "No Subscription Fees",
          text: "Pay once for the device and installation. No monthly plans, no renewals, and no hidden fees, now or ever."
        },
        security: {
          title: "Advanced Security Architecture",
          text: "Built for uncompromising protection with Secure Boot (RSA-3072), encrypted flash storage (AES-128/256-XTS), a Trusted Execution Environment, HMAC encryption, and replay-attack protection."
        },
        noInternet: {
          title: "No Internet Exposure",
          text: "Your data never leaves your premises. User databases stay on the device, fully encrypted and isolated from the internet."
        },
        guestAccess: {
          title: "Inviting Users and Temporary Guests",
          text: "Inviting users and temporary guests has never been easier. With one click, without complicated systems and without unnecessary steps."
        },
        smartAccess: {
          title: "Smart Access",
          text: "Secure gate access from the iOS/Android app or an RF remote. Administrators can review entry history for clear visibility into gate activity."
        },
        userManagement: {
          title: "Simple User Management",
          text: "Easily manage users and permissions through the mobile app or by importing and exporting CSV files. Supports up to 4,000 users per gate and up to 100 administrators."
        }
      }
    },
    action: {
      title: "Why WIFIGATE?"
    },
    tabs: {
      why: "Why",
      where: "Where"
    },
    applications: {
      barrierGates: "Barrier Gates",
      parkingLots: "Parking Lots",
      residentialComplexes: "Residential Complexes",
      officeBuildings: "Office Buildings",
      industrialFacilities: "Industrial Facilities",
      sportsFacilities: "Sports Facilities",
      educationalInstitutions: "Educational Institutions",
      retailSpaces: "Retail Spaces"
    },
    about: {
      title: "About Us",
      text1: "WIFIGATE was founded to develop an affordable and secure solution for access-control systems.",
      text2: "We develop both the hardware and software in-house so they work together seamlessly while maintaining the highest level of security."
    },
    contact: {
      title: "Contact Us",
      subtitle: "We will be happy to demonstrate our capabilities and advise you about our system.",
      ctaTitle: "Interested in WIFIGATE?",
      ctaText: "Send us a WhatsApp message for pricing, full system details, and a fit assessment for your needs.",
      ctaButton: "Contact via WhatsApp",
      terms: "Terms & Conditions",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. All rights reserved.",
      tagline: "Smart. Secure. Private. No subscriptions. Ever.",
      terms: "Terms & Conditions"
    }
  },
  he: {
    nav: {
      home: "בית",
      features: "יכולות",
      about: "אודות",
      contact: "צור קשר"
    },
    hero: {
      rotator: {
        phrases: ["קל לשימוש", "פרטיות מלאה", "ללא מנוי"]
      },
      subtitle: "מערכת חכמה לבקרת גישה, מאובטחת, פשוטה וללא עלויות חודשיות.",
      cta: {
        contact: "צור קשר",
        about: "אודות"
      },
      systems: {
        barrier: { kicker: "יציאה", label: "שער מחסום" },
        shutter: { kicker: "יציאה", label: "תריס גלילה" },
        floodlight: { kicker: "יציאה", label: "זרקור" },
        door: { kicker: "גישה", label: "דלת" },
        field: { kicker: "גישה", label: "מגרש ספורט" },
        maglock: { kicker: "נעילה", label: "מנעול מגנטי" },
        power: { kicker: "כניסת מתח" },
        input: { kicker: "קלט" }
      }
    },
    features: {
      title: "היכולות שלנו",
      subtitle: "אלו חלק מהיכולות שהופכות את WIFIGATE לפתרון מתקדם, מאובטח ונוח לניהול בקרת גישה.",
      items: {
        noSubscription: {
          title: "ללא דמי מנוי",
          text: "תשלום חד-פעמי עבור המכשיר וההתקנה. ללא תשלום חודשי, ללא חידושים וללא עלויות נסתרות, עכשיו ולתמיד."
        },
        security: {
          title: "ארכיטקטורת אבטחה מתקדמת",
          text: "המערכת תוכננה להגנה חסרת פשרות עם Secure Boot (RSA-3072), אחסון פלאש מוצפן (AES-128/256-XTS), סביבת הרצה מאובטחת, הצפנת HMAC והגנה מפני מתקפות Replay."
        },
        noInternet: {
          title: "ללא חשיפה לאינטרנט",
          text: "המידע שלכם נשאר אצלכם. מאגרי המשתמשים נשמרים על גבי ההתקן, מוצפנים במלואם ומבודדים מהאינטרנט."
        },
        guestAccess: {
          title: "הזמנת משתמשים ואורחים זמניים",
          text: "הזמנת משתמשים ואורחים זמניים מעולם לא הייתה פשוטה יותר. בלחיצת כפתור אחת, בלי מערכות מסובכות ובלי תהליכים מיותרים."
        },
        smartAccess: {
          title: "גישה חכמה",
          text: "פתיחה מאובטחת של השער דרך אפליקציית iOS/Android או באמצעות שלט RF. מנהלים יכולים לצפות בהיסטוריית הכניסות ולקבל תמונה ברורה של פעילות השער."
        },
        userManagement: {
          title: "ניהול משתמשים פשוט",
          text: "ניהול קל של משתמשים והרשאות דרך האפליקציה בלחיצת כפתור או באמצעות ייבוא/ייצוא של קובץ CSV, עם תמיכה בעד 4,000 משתמשים ו-100 מנהלים לכל שער."
        }
      }
    },
    action: {
      title: "למה WIFIGATE?"
    },
    tabs: {
      why: "למה",
      where: "איפה"
    },
    applications: {
      barrierGates: "מחסומי כניסה",
      parkingLots: "חניונים",
      residentialComplexes: "מתחמי מגורים",
      officeBuildings: "בנייני משרדים",
      industrialFacilities: "מתקנים תעשייתיים",
      sportsFacilities: "מתקני ספורט",
      educationalInstitutions: "מוסדות חינוך",
      retailSpaces: "שטחי מסחר"
    },
    about: {
      title: "אודותינו",
      text1: "WIFIGATE הוקמה במטרה לפתח פתרון מאובטח ונגיש למערכות בקרת גישה.",
      text2: "אנו מפתחים את רכיבי החומרה והתוכנה בבית, כך שהם משתלבים זה בזה בצורה מושלמת ומספקים חוויית שימוש חלקה תוך שמירה על רמת האבטחה הגבוהה ביותר."
    },
    contact: {
      title: "צור קשר",
      subtitle: "נשמח להציג את היכולות שלנו ולייעץ לכם לגבי המערכת.",
      ctaTitle: "מעוניינים ב-WIFIGATE?",
      ctaText: "שלחו הודעה בוואטסאפ לקבלת הצעת מחיר, מידע מלא על המערכת ובדיקת התאמה לצרכים שלכם.",
      ctaButton: "צור קשר בוואטסאפ",
      terms: "תנאים והגבלות",
      name: "איתי נוה",
      whatsapp: "וואטסאפ"
    },
    footer: {
      copyright: "WIFIGATE. כל הזכויות שמורות.",
      tagline: "חכם. מאובטח. פרטי. ללא מנוי. לתמיד.",
      terms: "תנאים והגבלות"
    }
  },
  es: {
    nav: {
      home: "Inicio",
      features: "Características",
      about: "Acerca de",
      contact: "Contáctanos"
    },
    hero: {
      rotator: {
        phrases: ["Fácil de usar", "Privacidad total", "Sin suscripciones"]
      },
      subtitle: "Un sistema inteligente de control de acceso, seguro, simple y sin costos mensuales.",
      cta: {
        contact: "Contáctanos",
        about: "Acerca de"
      },
      systems: {
        barrier: { kicker: "Salida", label: "Barrera" },
        shutter: { kicker: "Salida", label: "Persiana enrollable" },
        floodlight: { kicker: "Salida", label: "Reflector" },
        door: { kicker: "Acceso", label: "Puerta" },
        field: { kicker: "Acceso", label: "Cancha deportiva" },
        maglock: { kicker: "Cierre", label: "Cerradura magnética" },
        power: { kicker: "Entrada de energía" },
        input: { kicker: "Entrada" }
      }
    },
    features: {
      title: "Nuestras capacidades",
      subtitle: "Estas son algunas de las capacidades que convierten a WIFIGATE en una solución avanzada, segura y fácil de gestionar para el control de acceso.",
      items: {
        noSubscription: {
          title: "Sin cuotas de suscripción",
          text: "Paga una sola vez por el dispositivo y la instalación. Sin planes mensuales, sin renovaciones y sin cargos ocultos, ahora ni nunca."
        },
        security: {
          title: "Arquitectura de seguridad avanzada",
          text: "Diseñado para una protección rigurosa con Secure Boot (RSA-3072), almacenamiento cifrado (AES-128/256-XTS), un entorno de ejecución confiable, cifrado HMAC y protección contra ataques de repetición."
        },
        noInternet: {
          title: "Sin exposición a internet",
          text: "Tus datos nunca salen de tus instalaciones. Las bases de datos de usuarios permanecen en el dispositivo, completamente cifradas y aisladas de internet."
        },
        guestAccess: {
          title: "Invitación de usuarios e invitados temporales",
          text: "Invitar a usuarios e invitados temporales nunca ha sido tan fácil. Con un solo clic, sin sistemas complicados y sin pasos innecesarios."
        },
        smartAccess: {
          title: "Acceso inteligente",
          text: "Accede al portón de forma segura desde la app de iOS/Android o con un control RF. Los administradores pueden revisar el historial de accesos para tener una visión clara de la actividad."
        },
        userManagement: {
          title: "Gestión simple de usuarios",
          text: "Gestiona usuarios y permisos fácilmente desde la app móvil o importando y exportando archivos CSV. Admite hasta 4.000 usuarios por portón y hasta 100 administradores."
        }
      }
    },
    action: {
      title: "¿Por qué WIFIGATE?"
    },
    tabs: {
      why: "Por qué",
      where: "Dónde"
    },
    applications: {
      barrierGates: "Barreras de Acceso",
      parkingLots: "Estacionamientos",
      residentialComplexes: "Complejos Residenciales",
      officeBuildings: "Edificios de Oficinas",
      industrialFacilities: "Instalaciones Industriales",
      sportsFacilities: "Instalaciones Deportivas",
      educationalInstitutions: "Instituciones Educativas",
      retailSpaces: "Espacios Comerciales"
    },
    about: {
      title: "Sobre nosotros",
      text1: "WIFIGATE nació con el objetivo de desarrollar una solución accesible y segura para sistemas de control de acceso.",
      text2: "Desarrollamos internamente tanto el hardware como el software para ofrecer una experiencia fluida mientras mantenemos el más alto nivel de seguridad."
    },
    contact: {
      title: "Contáctanos",
      subtitle: "Estaremos encantados de mostrarte nuestras capacidades y asesorarte sobre nuestro sistema.",
      ctaTitle: "¿Listo para saber más?",
      ctaText: "Ponte en contacto con nosotros por WhatsApp para una demo o cualquier pregunta sobre WIFIGATE.",
      ctaButton: "Contactar por WhatsApp",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. Todos los derechos reservados.",
      tagline: "Inteligente. Seguro. Privado. Sin suscripciones. Para siempre."
    }
  },
  pt: {
    nav: {
      home: "Início",
      features: "Funcionalidades",
      about: "Sobre nós",
      contact: "Contacte-nos"
    },
    hero: {
      rotator: {
        phrases: ["Fácil de utilizar", "Privacidade total", "Sem subscrições"]
      },
      subtitle: "Um sistema inteligente de controlo de acessos, seguro, simples e sem custos mensais.",
      cta: {
        contact: "Contacte-nos",
        about: "Sobre nós"
      },
      systems: {
        barrier: { kicker: "Saída", label: "Barreira" },
        shutter: { kicker: "Saída", label: "Porta de enrolar" },
        floodlight: { kicker: "Saída", label: "Projetor" },
        door: { kicker: "Acesso", label: "Porta" },
        field: { kicker: "Acesso", label: "Campo desportivo" },
        maglock: { kicker: "Fecho", label: "Fechadura magnética" },
        power: { kicker: "Entrada de alimentação" },
        input: { kicker: "Entrada" }
      }
    },
    features: {
      title: "As nossas capacidades",
      subtitle: "Estas são algumas das capacidades que fazem da WIFIGATE uma solução avançada, segura e fácil de gerir para o controlo de acessos.",
      items: {
        noSubscription: {
          title: "Sem taxas de subscrição",
          text: "Pague apenas uma vez pelo dispositivo e pela instalação. Sem planos mensais, sem renovações e sem custos ocultos, agora ou no futuro."
        },
        security: {
          title: "Arquitetura de segurança avançada",
          text: "Concebido para uma proteção rigorosa com Secure Boot (RSA-3072), armazenamento encriptado (AES-128/256-XTS), um ambiente de execução fidedigno, encriptação HMAC e proteção contra ataques de repetição."
        },
        noInternet: {
          title: "Sem exposição à internet",
          text: "Os seus dados nunca saem das suas instalações. As bases de dados de utilizadores permanecem no dispositivo, totalmente encriptadas e isoladas da internet."
        },
        guestAccess: {
          title: "Convite de utilizadores e convidados temporários",
          text: "Convidar utilizadores e convidados temporários nunca foi tão simples. Com um único clique, sem sistemas complicados e sem passos desnecessários."
        },
        smartAccess: {
          title: "Acesso inteligente",
          text: "Acesso seguro ao portão através da aplicação iOS/Android ou de um comando RF. Os administradores podem consultar o histórico de entradas para ter uma visão clara da atividade."
        },
        userManagement: {
          title: "Gestão simples de utilizadores",
          text: "Gira utilizadores e permissões facilmente através da aplicação móvel ou importando e exportando ficheiros CSV. Suporta até 4.000 utilizadores por portão e até 100 administradores."
        }
      }
    },
    action: {
      title: "Por que WIFIGATE?"
    },
    tabs: {
      why: "Por que",
      where: "Onde"
    },
    applications: {
      barrierGates: "Barreiras de Acesso",
      parkingLots: "Estacionamentos",
      residentialComplexes: "Complexos Residenciais",
      officeBuildings: "Edifícios de Escritórios",
      industrialFacilities: "Instalações Industriais",
      sportsFacilities: "Instalações Esportivas",
      educationalInstitutions: "Instituições Educativas",
      retailSpaces: "Espaços Comerciais"
    },
    about: {
      title: "Sobre nós",
      text1: "A WIFIGATE foi criada com o objetivo de desenvolver uma solução acessível e segura para sistemas de controlo de acessos.",
      text2: "Desenvolvemos internamente tanto o hardware como o software para proporcionar uma experiência fluida, mantendo o mais alto nível de segurança."
    },
    contact: {
      title: "Contacte-nos",
      subtitle: "Teremos todo o gosto em demonstrar as nossas capacidades e aconselhá-lo sobre o nosso sistema.",
      ctaTitle: "Pronto para saber mais?",
      ctaText: "Contacte-nos via WhatsApp para uma demonstração ou qualquer dúvida sobre o WIFIGATE.",
      ctaButton: "Contactar via WhatsApp",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. Todos os direitos reservados.",
      tagline: "Inteligente. Seguro. Privado. Sem subscrições. Para sempre."
    }
  },
  pl: {
    nav: {
      home: "Strona główna",
      features: "Funkcje",
      about: "O nas",
      contact: "Skontaktuj się"
    },
    hero: {
      rotator: {
        phrases: ["Łatwe w użyciu", "Pełna prywatność", "Bez abonamentu"]
      },
      subtitle: "Inteligentny system kontroli dostępu, bezpieczny, prosty i bez miesięcznych opłat.",
      cta: {
        contact: "Skontaktuj się",
        about: "O nas"
      },
      systems: {
        barrier: { kicker: "Wyjście", label: "Szlaban" },
        shutter: { kicker: "Wyjście", label: "Roleta" },
        floodlight: { kicker: "Wyjście", label: "Reflektor" },
        door: { kicker: "Dostęp", label: "Drzwi" },
        field: { kicker: "Dostęp", label: "Boisko sportowe" },
        maglock: { kicker: "Zamek", label: "Zamek magnetyczny" },
        power: { kicker: "Zasilanie" },
        input: { kicker: "Wejście" }
      }
    },
    features: {
      title: "Nasze możliwości",
      subtitle: "To niektóre z możliwości, które sprawiają, że WIFIGATE jest zaawansowanym, bezpiecznym i łatwym w zarządzaniu rozwiązaniem do kontroli dostępu.",
      items: {
        noSubscription: {
          title: "Bez opłat abonamentowych",
          text: "Płacisz tylko raz za urządzenie i instalację. Bez miesięcznych planów, bez odnowień i bez ukrytych opłat, teraz i w przyszłości."
        },
        security: {
          title: "Zaawansowana architektura bezpieczeństwa",
          text: "Zaprojektowany z myślą o bezkompromisowej ochronie dzięki Secure Boot (RSA-3072), szyfrowanej pamięci flash (AES-128/256-XTS), zaufanemu środowisku wykonawczemu, szyfrowaniu HMAC i ochronie przed atakami powtórzeniowymi."
        },
        noInternet: {
          title: "Brak ekspozycji na internet",
          text: "Twoje dane nigdy nie opuszczają obiektu. Bazy danych użytkowników pozostają na urządzeniu, są w pełni szyfrowane i odizolowane od internetu."
        },
        guestAccess: {
          title: "Zapraszanie użytkowników i gości tymczasowych",
          text: "Zapraszanie użytkowników i gości tymczasowych nigdy nie było prostsze. Jednym kliknięciem, bez skomplikowanych systemów i bez zbędnych kroków."
        },
        smartAccess: {
          title: "Inteligentny dostęp",
          text: "Bezpieczny dostęp do bramy z aplikacji iOS/Android lub pilota RF. Administratorzy mogą sprawdzać historię wejść, aby mieć pełny wgląd w aktywność."
        },
        userManagement: {
          title: "Proste zarządzanie użytkownikami",
          text: "Łatwo zarządzaj użytkownikami i uprawnieniami z poziomu aplikacji mobilnej lub importując i eksportując pliki CSV. Obsługuje do 4 000 użytkowników na bramę i do 100 administratorów."
        }
      }
    },
    action: {
      title: "Dlaczego WIFIGATE?"
    },
    tabs: {
      why: "Dlaczego",
      where: "Gdzie"
    },
    applications: {
      barrierGates: "Bramy Wjazdowe",
      parkingLots: "Parkingi",
      residentialComplexes: "Osiedla Mieszkaniowe",
      officeBuildings: "Biurowce",
      industrialFacilities: "Obiekty Przemysłowe",
      sportsFacilities: "Obiekty Sportowe",
      educationalInstitutions: "Instytucje Edukacyjne",
      retailSpaces: "Przestrzenie Handlowe"
    },
    about: {
      title: "O nas",
      text1: "WIFIGATE powstało z myślą o stworzeniu przystępnego cenowo i bezpiecznego rozwiązania dla systemów kontroli dostępu.",
      text2: "Tworzymy zarówno sprzęt, jak i oprogramowanie we własnym zakresie, aby zapewnić płynne działanie i najwyższy poziom bezpieczeństwa."
    },
    contact: {
      title: "Skontaktuj się",
      subtitle: "Chętnie pokażemy możliwości naszego rozwiązania i doradzimy w sprawie naszego systemu.",
      ctaTitle: "Gotowy, aby dowiedzieć się więcej?",
      ctaText: "Skontaktuj się z nami przez WhatsApp, aby umówić demo lub zadać pytania o WIFIGATE.",
      ctaButton: "Skontaktuj się przez WhatsApp",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. Wszelkie prawa zastrzeżone.",
      tagline: "Inteligentne. Bezpieczne. Prywatne. Bez abonamentu. Na zawsze."
    }
  },
  ru: {
    nav: {
      home: "Главная",
      features: "Возможности",
      about: "О нас",
      contact: "Связаться с нами"
    },
    hero: {
      rotator: {
        phrases: ["Просто в использовании", "Полная приватность", "Без подписок"]
      },
      subtitle: "Умная система контроля доступа: безопасная, простая и без ежемесячных платежей.",
      cta: {
        contact: "Связаться с нами",
        about: "О нас"
      },
      systems: {
        barrier: { kicker: "Выход", label: "Шлагбаум" },
        shutter: { kicker: "Выход", label: "Рольставни" },
        floodlight: { kicker: "Выход", label: "Прожектор" },
        door: { kicker: "Доступ", label: "Дверь" },
        field: { kicker: "Доступ", label: "Спортивная площадка" },
        maglock: { kicker: "Замок", label: "Магнитный замок" },
        power: { kicker: "Питание" },
        input: { kicker: "Вход" }
      }
    },
    features: {
      title: "Наши возможности",
      subtitle: "Это часть возможностей, которые делают WIFIGATE передовым, безопасным и удобным в управлении решением для контроля доступа.",
      items: {
        noSubscription: {
          title: "Без абонентской платы",
          text: "Оплата один раз за устройство и установку. Никаких ежемесячных тарифов, продлений или скрытых платежей, ни сейчас, ни в будущем."
        },
        security: {
          title: "Современная архитектура безопасности",
          text: "Разработано для бескомпромиссной защиты: Secure Boot (RSA-3072), зашифрованная flash-память (AES-128/256-XTS), доверенная среда выполнения, шифрование HMAC и защита от атак повторного воспроизведения."
        },
        noInternet: {
          title: "Без выхода в интернет",
          text: "Ваши данные никогда не покидают объект. Базы данных пользователей хранятся на устройстве, полностью зашифрованы и изолированы от интернета."
        },
        guestAccess: {
          title: "Приглашение пользователей и временных гостей",
          text: "Приглашать пользователей и временных гостей еще никогда не было так просто. В один клик, без сложных систем и без лишних шагов."
        },
        smartAccess: {
          title: "Умный доступ",
          text: "Безопасный доступ к воротам через приложение iOS/Android или RF-пульт. Администраторы могут просматривать историю входов и получать полную картину активности."
        },
        userManagement: {
          title: "Простое управление пользователями",
          text: "Легко управляйте пользователями и правами доступа через мобильное приложение или с помощью импорта и экспорта CSV-файлов. Поддерживается до 4 000 пользователей на одни ворота и до 100 администраторов."
        }
      }
    },
    action: {
      title: "Почему WIFIGATE?"
    },
    tabs: {
      why: "Почему",
      where: "Где"
    },
    applications: {
      barrierGates: "Шлагбаумы",
      parkingLots: "Парковки",
      residentialComplexes: "Жилые Комплексы",
      officeBuildings: "Офисные Здания",
      industrialFacilities: "Промышленные Объекты",
      sportsFacilities: "Спортивные Сооружения",
      educationalInstitutions: "Образовательные Учреждения",
      retailSpaces: "Торговые Площади"
    },
    about: {
      title: "О нас",
      text1: "WIFIGATE была создана с целью разработки доступного и безопасного решения для систем контроля доступа.",
      text2: "Мы разрабатываем и аппаратную часть, и программное обеспечение внутри компании, чтобы обеспечить удобный пользовательский опыт и максимальный уровень безопасности."
    },
    contact: {
      title: "Связаться с нами",
      subtitle: "Мы с удовольствием покажем возможности системы и проконсультируем вас по нашему решению.",
      ctaTitle: "Готовы узнать больше?",
      ctaText: "Свяжитесь с нами через WhatsApp для демонстрации или вопросов о WIFIGATE.",
      ctaButton: "Связаться через WhatsApp",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. Все права защищены.",
      tagline: "Умно. Безопасно. Конфиденциально. Без подписок. Навсегда."
    }
  },
  cs: {
    nav: {
      home: "Domů",
      features: "Funkce",
      about: "O nás",
      contact: "Kontaktujte nás"
    },
    hero: {
      rotator: {
        phrases: ["Snadné použití", "Naprosté soukromí", "Bez předplatného"]
      },
      subtitle: "Chytrý systém řízení přístupu, bezpečný, jednoduchý a bez měsíčních poplatků.",
      cta: {
        contact: "Kontaktujte nás",
        about: "O nás"
      },
      systems: {
        barrier: { kicker: "Výstup", label: "Závora" },
        shutter: { kicker: "Výstup", label: "Rolovací vrata" },
        floodlight: { kicker: "Výstup", label: "Reflektor" },
        door: { kicker: "Přístup", label: "Dveře" },
        field: { kicker: "Přístup", label: "Sportovní hřiště" },
        maglock: { kicker: "Zámek", label: "Magnetický zámek" },
        power: { kicker: "Napájení" },
        input: { kicker: "Vstup" }
      }
    },
    features: {
      title: "Naše možnosti",
      subtitle: "Toto jsou některé z možností, díky nimž je WIFIGATE pokročilým, bezpečným a snadno spravovatelným řešením pro kontrolu přístupu.",
      items: {
        noSubscription: {
          title: "Bez poplatků za předplatné",
          text: "Za zařízení a instalaci zaplatíte jen jednou. Žádné měsíční tarify, žádná prodloužení ani skryté poplatky, teď ani později."
        },
        security: {
          title: "Pokročilá bezpečnostní architektura",
          text: "Navrženo pro nekompromisní ochranu se Secure Boot (RSA-3072), šifrovaným úložištěm flash (AES-128/256-XTS), důvěryhodným běhovým prostředím, šifrováním HMAC a ochranou proti replay útokům."
        },
        noInternet: {
          title: "Bez vystavení internetu",
          text: "Vaše data nikdy neopustí váš objekt. Databáze uživatelů zůstávají v zařízení, plně šifrované a izolované od internetu."
        },
        guestAccess: {
          title: "Pozvání uživatelů a dočasných hostů",
          text: "Pozvat uživatele a dočasné hosty nikdy nebylo jednodušší. Jedním kliknutím, bez složitých systémů a bez zbytečných kroků."
        },
        smartAccess: {
          title: "Chytrý přístup",
          text: "Bezpečný přístup k bráně z aplikace pro iOS/Android nebo přes RF ovladač. Správci mohou kontrolovat historii vstupů a mít jasný přehled o aktivitě."
        },
        userManagement: {
          title: "Jednoduchá správa uživatelů",
          text: "Uživatele a oprávnění snadno spravujete v mobilní aplikaci nebo pomocí importu a exportu CSV souborů. Podporuje až 4 000 uživatelů na bránu a až 100 správců."
        }
      }
    },
    action: {
      title: "Proč WIFIGATE?"
    },
    tabs: {
      why: "Proč",
      where: "Kde"
    },
    applications: {
      barrierGates: "Závory",
      parkingLots: "Parkoviště",
      residentialComplexes: "Rezidenční Komplexy",
      officeBuildings: "Kancelářské Budovy",
      industrialFacilities: "Průmyslové Závody",
      sportsFacilities: "Sportovní Zařízení",
      educationalInstitutions: "Vzdělávací Instituce",
      retailSpaces: "Obchodní Prostory"
    },
    about: {
      title: "O nás",
      text1: "WIFIGATE vznikla s cílem vyvinout dostupné a bezpečné řešení pro systémy řízení přístupu.",
      text2: "Hardware i software vyvíjíme interně, aby spolu dokonale fungovaly, nabízely plynulý uživatelský zážitek a zároveň zajišťovaly nejvyšší úroveň zabezpečení."
    },
    contact: {
      title: "Kontaktujte nás",
      subtitle: "Rádi vám předvedeme možnosti našeho řešení a poradíme vám s naším systémem.",
      ctaTitle: "Připraveni se dozvědět víc?",
      ctaText: "Kontaktujte nás přes WhatsApp pro ukázku nebo otázky o WIFIGATE.",
      ctaButton: "Kontaktovat přes WhatsApp",
      name: "Itay Nave",
      whatsapp: "WhatsApp"
    },
    footer: {
      copyright: "WIFIGATE. Všechna práva vyhrazena.",
      tagline: "Chytré. Bezpečné. Soukromé. Bez předplatného. Navždy."
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      features: "الميزات",
      about: "من نحن",
      contact: "تواصل معنا"
    },
    hero: {
      rotator: {
        phrases: ["سهل الاستخدام", "خصوصية كاملة", "من دون اشتراكات"]
      },
      subtitle: "نظام ذكي للتحكم في الوصول، آمن وبسيط ومن دون تكاليف شهرية.",
      cta: {
        contact: "تواصل معنا",
        about: "من نحن"
      },
      systems: {
        barrier: { kicker: "مخرج", label: "بوابة حاجز" },
        shutter: { kicker: "مخرج", label: "مصراع دوار" },
        floodlight: { kicker: "مخرج", label: "كشاف" },
        door: { kicker: "دخول", label: "باب" },
        field: { kicker: "دخول", label: "ملعب رياضي" },
        maglock: { kicker: "قفل", label: "قفل مغناطيسي" },
        power: { kicker: "مدخل الطاقة" },
        input: { kicker: "إدخال" }
      }
    },
    features: {
      title: "قدراتنا",
      subtitle: "هذه بعض القدرات التي تجعل WIFIGATE حلاً متقدماً وآمناً وسهل الإدارة للتحكم في الوصول.",
      items: {
        noSubscription: {
          title: "من دون رسوم اشتراك",
          text: "ادفع مرة واحدة فقط مقابل الجهاز والتركيب. لا خطط شهرية ولا تجديدات ولا رسوم مخفية، الآن أو لاحقًا."
        },
        security: {
          title: "بنية أمنية متقدمة",
          text: "صُمم لحماية صارمة مع Secure Boot ‏(RSA-3072)، وتخزين مشفر ‏(AES-128/256-XTS)، وبيئة تنفيذ موثوقة، وتشفير HMAC، وحماية من هجمات إعادة الإرسال."
        },
        noInternet: {
          title: "من دون تعرض للإنترنت",
          text: "بياناتك لا تغادر موقعك أبدًا. تبقى قواعد بيانات المستخدمين داخل الجهاز، مشفرة بالكامل ومعزولة عن الإنترنت."
        },
        guestAccess: {
          title: "دعوة المستخدمين والضيوف المؤقتين",
          text: "لم يكن دعوة المستخدمين والضيوف المؤقتين أسهل من أي وقت مضى. بضغطة زر واحدة، من دون أنظمة معقدة ومن دون خطوات غير ضرورية."
        },
        smartAccess: {
          title: "دخول ذكي",
          text: "وصول آمن إلى البوابة من تطبيق iOS/Android أو من خلال جهاز تحكم RF. ويمكن للمشرفين الاطلاع على سجل الدخول للحصول على رؤية واضحة للنشاط."
        },
        userManagement: {
          title: "إدارة مستخدمين بسيطة",
          text: "إدارة سهلة للمستخدمين والصلاحيات من خلال التطبيق أو عبر استيراد ملفات CSV وتصديرها. يدعم حتى 4,000 مستخدم لكل بوابة وحتى 100 مسؤول."
        }
      }
    },
    action: {
      title: "لماذا WIFIGATE؟"
    },
    tabs: {
      why: "لماذا",
      where: "أين"
    },
    applications: {
      barrierGates: "حواجز الدخول",
      parkingLots: "مواقف السيارات",
      residentialComplexes: "المجمعات السكنية",
      officeBuildings: "المباني المكتبية",
      industrialFacilities: "المنشآت الصناعية",
      sportsFacilities: "المنشآت الرياضية",
      educationalInstitutions: "المؤسسات التعليمية",
      retailSpaces: "الأماكن التجارية"
    },
    about: {
      title: "من نحن",
      text1: "تأسست WIFIGATE بهدف تطوير حل آمن وميسور لأنظمة التحكم في الوصول.",
      text2: "نطوّر مكونات العتاد والبرمجيات داخليًا لتتكامل معًا بشكل مثالي وتقدم تجربة استخدام سلسة مع الحفاظ على أعلى مستوى من الأمان."
    },
    contact: {
      title: "تواصل معنا",
      subtitle: "يسعدنا أن نستعرض إمكانياتنا وأن نقدم لك المشورة حول نظامنا.",
      ctaTitle: "هل أنت جاهز لمعرفة المزيد؟",
      ctaText: "تواصل معنا عبر واتساب للحصول على عرض تجريبي أو لأي استفسارات حول WIFIGATE.",
      ctaButton: "التواصل عبر واتساب",
      name: "إيتاي نافيه",
      whatsapp: "واتساب"
    },
    footer: {
      copyright: "WIFIGATE. جميع الحقوق محفوظة.",
      tagline: "ذكي. آمن. خاص. من دون اشتراكات. إلى الأبد."
    }
  }
};
