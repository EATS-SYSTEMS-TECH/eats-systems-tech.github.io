// /js/main.js
// Version: 1.1.0

// Utility: select helpers
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const RTL_LANGS = new Set(["he", "ar"]);

// ================= TRANSLATIONS =================
const translations = {
  en: {
    nav: {
      home: "Home",
      features: "Features",
      about: "About",
      contact: "Contact Us"
    },
    hero: {
      rotator: {
        phrases: ["User Intuitive", "Full Privacy", "No Subscriptions"]
      },
      subtitle: "Smart gate access with no subscriptions, no monthly fees, and full control.",
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
      title: "Our features",
      subtitle: "These are only part of the capabilities we offer to our clients as part of the product we developed",
      items: {
        noSubscription: {
          title: "No Subscription Fees",
          text: "Pay once for the device and installation. No monthly plans, no renewals, no hidden fees - now or ever."
        },
        security: {
          title: "Advanced Security Architecture",
          text: "Engineered for uncompromising protection with Secure Boot (RSA-3072), encrypted flash storage (AES-128/256-XTS), a Trusted Execution Environment, HMAC encryption, and anti replay attack."
        },
        noInternet: {
          title: "No Internet Exposure",
          text: "Your data never leaves your premises. User databases stay on-device, fully encrypted and isolated from the internet."
        },
        guestAccess: {
          title: "Guest Access Pass",
          text: "Let guests in without the interruptions. Share a temporary access pass from the app so visitors can open the gate on their own, no more calls asking you to open the gate."
        },
        smartAccess: {
          title: "Smart Access",
          text: "Secure gate access from the iOS/Android app or an RF remote. Admins can access entry history for clear visibility of gate activity."
        },
        userManagement: {
          title: "Simple User Management",
          text: "Easily manage users and permissions through the mobile app or by importing a CSV file. Support up to 4,000 users per gate and assign up to 100 administrators."
        }
      }
    },
    action: {
      title: "See it in action"
    },
    about: {
      title: "About us",
      text1: "WIFIGATE was established with the aim of developing an affordable and secure solution for access control systems.",
      text2: "We develop both hardware and software components in-house, that complement each other perfectly to provide a seamless user experience while ensuring the highest level of security."
    },
    contact: {
      title: "Contact us",
      subtitle: "We will be happy to demonstrate our capabilities and advise you about our system.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. All rights reserved.",
      tagline: "Smart. Secure. Private — with no subscriptions, ever."
    }
  },
  he: {
    nav: {
      home: "בית",
      features: "יכולות",
      about: "מי אנחנו",
      contact: "צור קשר"
    },
    hero: {
      rotator: {
        phrases: ["ידידותי למשתמש", "פרטיות מלאה", "ללא דמי מנוי"]
      },
      subtitle: "מערכת גישה חכמה לשערים ללא דמי מנוי וללא תשלום חודשי",
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
      title: "יכולות",
      subtitle: "אלה הם חלק מהיכולות שאנו מציעים ללקוחות שלנו כחלק מהמוצר שאנו פיתחנו",
      items: {
        noSubscription: {
          title: "ללא דמי מנוי",
          text: "משלמים פעם אחת על המכשיר וההתקנה. בלי תשלום חודשי, בלי חידושים ובלי עלויות נסתרות, עכשיו ולתמיד"
        },
        security: {
          title: "ארכיטקטורת אבטחה מתקדמת",
          text: "הונדס להגנה מחמירה באמצעות Secure Boot (RSA-3072), אחסון מוצפן (AES-128/256-XTS), סביבת הרצה מאובטחת (TEE), הצפנת HMAC והגנה מפני מתקפות Replay."
        },
        noInternet: {
          title: "ללא חשיפה לאינטרנט",
          text: "המידע שלכם נשאר אצלך ללא חשיפה לענן, שרתים חיצוניים או לאינטרנט."
        },
        guestAccess: {
          title: "קישור אורח",
          text: "מכניסים אורחים בלי הפרעות. שולחים קישור גישה זמני מהאפליקציה והאורחים פותחים את השער בעצמם בלי טלפונים ובלי בקשות לפתוח שער"
        },
        smartAccess: {
          title: "בקרת גישה חכמה",
          text: "פותחים את השער בדרך שנוחה לכם דרך האפליקציה או עם שלט ויכולים לצפות בהיסטוריית כניסה ברורה, כך שתמיד יודעים מי נכנס ומתי, בלי שום מאמץ."
        },
        userManagement: {
          title: "ניהול משתמשים פשוט",
          text: "ניהול קל של משתמשים והרשאות דרך האפליקציה, או באמצעות ייבוא קובץ CSV, יכולת תמיכה עד 4000 משתמשים ו100 מנהלים לכל שער"
        }
      }
    },
    action: {
      title: "ראו אותנו בפעולה"
    },
    about: {
      title: "עלינו",
      text1: "WIFIGATE נוצרה במטרה לפתח פתרון בקרת גישה מאובטח, איכותי ונגיש לכל אחד.",
      text2: "אנחנו מפתחים את רכיבי החומרה והתוכנה באופן עצמאי, כך שהם משלימים זה את זה ליצירת חוויית שימוש חלקה, תוך שמירה על רמת האבטחה הגבוהה ביותר."
    },
    contact: {
      title: "יצירת קשר",
      subtitle: "נשמח להדגים את יכולותינו ולייעץ לכם בנוגע למערכת שלנו.",
      name: "איתי נוה",
      whatsapp: "וואטסאפ",
      linkedin: "לינקדאין"
    },
    footer: {
      copyright: "WIFIGATE. כל הזכויות שמורות.",
      tagline: "חכם. מאובטח. פרטי וללא דמי מנוי לעולם."
    }
  },
  es: {
    nav: {
      home: "Inicio",
      features: "Funciones",
      about: "Acerca de",
      contact: "Contáctanos"
    },
    hero: {
      rotator: {
        phrases: ["Fácil de usar", "Privacidad total", "Sin suscripciones"]
      },
      subtitle: "Acceso inteligente para portones sin suscripciones, sin pagos mensuales y con control total.",
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
      title: "Nuestras funciones",
      subtitle: "Estas son solo algunas de las capacidades que ofrecemos a nuestros clientes como parte del producto que desarrollamos",
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
          text: "Tus datos nunca salen de tus instalaciones. Las bases de datos de usuarios permanecen en el dispositivo, cifradas y aisladas de internet."
        },
        guestAccess: {
          title: "Acceso temporal para invitados",
          text: "Deja entrar a tus invitados sin interrupciones. Comparte un acceso temporal desde la app para que puedan abrir el portón por su cuenta, sin llamadas para pedirte que lo abras."
        },
        smartAccess: {
          title: "Acceso inteligente",
          text: "Accede al portón de forma segura desde la app de iOS/Android o con un control RF. Los administradores pueden revisar el historial de accesos para tener visibilidad clara de la actividad."
        },
        userManagement: {
          title: "Gestión simple de usuarios",
          text: "Administra fácilmente usuarios y permisos desde la app móvil o importando un archivo CSV. Admite hasta 4.000 usuarios por portón y hasta 100 administradores."
        }
      }
    },
    action: {
      title: "Míralo en acción"
    },
    about: {
      title: "Sobre nosotros",
      text1: "WIFIGATE fue creada con el objetivo de desarrollar una solución accesible y segura para sistemas de control de acceso.",
      text2: "Desarrollamos internamente tanto el hardware como el software para ofrecer una experiencia fluida mientras mantenemos el nivel más alto de seguridad."
    },
    contact: {
      title: "Contáctanos",
      subtitle: "Estaremos encantados de mostrarte nuestras capacidades y asesorarte sobre nuestro sistema.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. Todos los derechos reservados.",
      tagline: "Inteligente. Seguro. Privado y sin suscripciones, nunca."
    }
  },
  pt: {
    nav: {
      home: "Início",
      features: "Funcionalidades",
      about: "Sobre",
      contact: "Contacte-nos"
    },
    hero: {
      rotator: {
        phrases: ["Fácil de usar", "Privacidade total", "Sem subscrições"]
      },
      subtitle: "Acesso inteligente ao portão sem subscrições, sem mensalidades e com controlo total.",
      cta: {
        contact: "Contacte-nos",
        about: "Sobre"
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
      title: "As nossas funcionalidades",
      subtitle: "Estas são apenas algumas das capacidades que oferecemos aos nossos clientes como parte do produto que desenvolvemos",
      items: {
        noSubscription: {
          title: "Sem taxas de subscrição",
          text: "Pague apenas uma vez pelo dispositivo e pela instalação. Sem planos mensais, sem renovações e sem custos ocultos, agora ou no futuro."
        },
        security: {
          title: "Arquitetura de segurança avançada",
          text: "Concebido para uma proteção rigorosa com Secure Boot (RSA-3072), armazenamento encriptado (AES-128/256-XTS), um Ambiente de Execução Fidedigno, encriptação HMAC e proteção contra ataques de repetição."
        },
        noInternet: {
          title: "Sem exposição à internet",
          text: "Os seus dados nunca saem das suas instalações. As bases de dados de utilizadores permanecem no dispositivo, totalmente encriptadas e isoladas da internet."
        },
        guestAccess: {
          title: "Acesso temporário para convidados",
          text: "Deixe os convidados entrar sem interrupções. Partilhe um acesso temporário na aplicação para que os visitantes possam abrir o portão sozinhos, sem chamadas a pedir que o abra."
        },
        smartAccess: {
          title: "Acesso inteligente",
          text: "Acesso seguro ao portão através da aplicação iOS/Android ou de um comando RF. Os administradores podem consultar o histórico de entradas para ter visibilidade clara da atividade."
        },
        userManagement: {
          title: "Gestão simples de utilizadores",
          text: "Gira utilizadores e permissões facilmente através da aplicação móvel ou importando um ficheiro CSV. Suporta até 4.000 utilizadores por portão e até 100 administradores."
        }
      }
    },
    action: {
      title: "Veja-o em ação"
    },
    about: {
      title: "Sobre nós",
      text1: "A WIFIGATE foi criada com o objetivo de desenvolver uma solução acessível e segura para sistemas de controlo de acessos.",
      text2: "Desenvolvemos internamente tanto o hardware como o software para proporcionar uma experiência fluida, mantendo o mais alto nível de segurança."
    },
    contact: {
      title: "Contacte-nos",
      subtitle: "Teremos todo o gosto em demonstrar as nossas capacidades e aconselhá-lo sobre o nosso sistema.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. Todos os direitos reservados.",
      tagline: "Inteligente. Seguro. Privado e sem subscrições, para sempre."
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
      subtitle: "Inteligentny dostęp do bramy bez abonamentu, bez miesięcznych opłat i z pełną kontrolą.",
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
      title: "Nasze funkcje",
      subtitle: "To tylko część możliwości, które oferujemy naszym klientom w ramach opracowanego przez nas produktu",
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
          title: "Tymczasowy dostęp dla gości",
          text: "Wpuszczaj gości bez zbędnych przerw. Udostępnij tymczasowy dostęp w aplikacji, aby odwiedzający mogli samodzielnie otworzyć bramę, bez telefonów z prośbą o wpuszczenie."
        },
        smartAccess: {
          title: "Inteligentny dostęp",
          text: "Bezpieczny dostęp do bramy z aplikacji iOS/Android lub pilota RF. Administratorzy mogą sprawdzać historię wejść, aby mieć pełny wgląd w aktywność."
        },
        userManagement: {
          title: "Proste zarządzanie użytkownikami",
          text: "Łatwo zarządzaj użytkownikami i uprawnieniami z poziomu aplikacji mobilnej lub importując plik CSV. Obsługa do 4 000 użytkowników na bramę i do 100 administratorów."
        }
      }
    },
    action: {
      title: "Zobacz w działaniu"
    },
    about: {
      title: "O nas",
      text1: "WIFIGATE powstało z myślą o stworzeniu przystępnego cenowo i bezpiecznego rozwiązania dla systemów kontroli dostępu.",
      text2: "Tworzymy zarówno sprzęt, jak i oprogramowanie we własnym zakresie, aby zapewnić płynne działanie i najwyższy poziom bezpieczeństwa."
    },
    contact: {
      title: "Skontaktuj się",
      subtitle: "Chętnie pokażemy możliwości naszego rozwiązania i doradzimy w sprawie naszego systemu.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. Wszelkie prawa zastrzeżone.",
      tagline: "Inteligentne. Bezpieczne. Prywatne i bez abonamentu, na zawsze."
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
        phrases: ["Просто и удобно", "Полная приватность", "Без подписок"]
      },
      subtitle: "Умный доступ к воротам без подписок, ежемесячных платежей и с полным контролем.",
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
      subtitle: "Это лишь часть возможностей, которые мы предлагаем нашим клиентам в составе разработанного нами продукта",
      items: {
        noSubscription: {
          title: "Без абонентской платы",
          text: "Оплата один раз за устройство и установку. Никаких ежемесячных планов, продлений или скрытых платежей, ни сейчас, ни потом."
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
          title: "Временный доступ для гостей",
          text: "Пускайте гостей без лишних отвлечений. Поделитесь временным доступом в приложении, чтобы посетители могли открыть ворота сами, без звонков с просьбой открыть."
        },
        smartAccess: {
          title: "Умный доступ",
          text: "Безопасный доступ к воротам через приложение iOS/Android или RF-пульт. Администраторы могут просматривать историю входов и видеть активность по воротам."
        },
        userManagement: {
          title: "Простое управление пользователями",
          text: "Управляйте пользователями и правами доступа через мобильное приложение или импорт CSV. Поддерживается до 4 000 пользователей на одни ворота и до 100 администраторов."
        }
      }
    },
    action: {
      title: "Посмотрите в действии"
    },
    about: {
      title: "О нас",
      text1: "WIFIGATE была создана с целью разработки доступного и безопасного решения для систем контроля доступа.",
      text2: "Мы разрабатываем и аппаратную часть, и программное обеспечение внутри компании, чтобы обеспечить удобный пользовательский опыт и максимальный уровень безопасности."
    },
    contact: {
      title: "Связаться с нами",
      subtitle: "Мы с удовольствием покажем возможности системы и проконсультируем вас по нашему решению.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. Все права защищены.",
      tagline: "Умно. Безопасно. Конфиденциально и без подписок, навсегда."
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
      subtitle: "Chytré ovládání brány bez předplatného, bez měsíčních poplatků a s plnou kontrolou.",
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
      title: "Naše funkce",
      subtitle: "Tohle je jen část možností, které našim zákazníkům nabízíme jako součást produktu, který jsme vyvinuli",
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
          title: "Dočasný přístup pro hosty",
          text: "Pusťte hosty dovnitř bez vyrušování. Sdílejte z aplikace dočasný přístup, aby si návštěvníci mohli bránu otevřít sami, bez telefonátů s prosbou o otevření."
        },
        smartAccess: {
          title: "Chytrý přístup",
          text: "Bezpečný přístup k bráně z aplikace pro iOS/Android nebo přes RF ovladač. Správci mohou kontrolovat historii vstupů a mít jasný přehled o aktivitě."
        },
        userManagement: {
          title: "Jednoduchá správa uživatelů",
          text: "Uživatele a oprávnění snadno spravujete v mobilní aplikaci nebo importem CSV souboru. Podporuje až 4 000 uživatelů na bránu a až 100 správců."
        }
      }
    },
    action: {
      title: "Podívejte se v akci"
    },
    about: {
      title: "O nás",
      text1: "WIFIGATE vznikla s cílem vyvinout dostupné a bezpečné řešení pro systémy řízení přístupu.",
      text2: "Hardware i software vyvíjíme interně, aby spolu dokonale fungovaly, nabízely plynulý uživatelský zážitek a zároveň zajišťovaly nejvyšší úroveň zabezpečení."
    },
    contact: {
      title: "Kontaktujte nás",
      subtitle: "Rádi vám předvedeme možnosti našeho řešení a poradíme vám s naším systémem.",
      name: "Itay Nave",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn"
    },
    footer: {
      copyright: "WIFIGATE. Všechna práva vyhrazena.",
      tagline: "Chytré. Bezpečné. Soukromé a bez předplatného, navždy."
    }
  },
  ar: {
    nav: {
      home: "الرئيسية",
      features: "المزايا",
      about: "من نحن",
      contact: "تواصل معنا"
    },
    hero: {
      rotator: {
        phrases: ["سهل الاستخدام", "خصوصية كاملة", "من دون اشتراكات"]
      },
      subtitle: "نظام ذكي للتحكم بالبوابات من دون اشتراكات أو رسوم شهرية ومع تحكم كامل.",
      cta: {
        contact: "تواصل معنا",
        about: "من نحن"
      },
      systems: {
        barrier: { kicker: "مخرج", label: "بوابة حاجز" },
        shutter: { kicker: "مخرج", label: "مصراع دوار" },
        floodlight: { kicker: "مخرج", label: "كشاف" },
        door: { kicker: "وصول", label: "باب" },
        field: { kicker: "وصول", label: "ملعب رياضي" },
        maglock: { kicker: "قفل", label: "قفل مغناطيسي" },
        power: { kicker: "دخل الطاقة" },
        input: { kicker: "إدخال" }
      }
    },
    features: {
      title: "مزاياتنا",
      subtitle: "هذه بعض القدرات التي نقدمها لعملائنا كجزء من المنتج الذي قمنا بتطويره",
      items: {
        noSubscription: {
          title: "من دون رسوم اشتراك",
          text: "ادفع مرة واحدة فقط مقابل الجهاز والتركيب. لا خطط شهرية ولا تجديدات ولا رسوم مخفية، الآن أو لاحقًا."
        },
        security: {
          title: "بنية أمنية متقدمة",
          text: "مصمم لحماية صارمة مع Secure Boot ‏(RSA-3072)، وتخزين مشفر ‏(AES-128/256-XTS)، وبيئة تنفيذ موثوقة، وتشفير HMAC، وحماية من هجمات إعادة الإرسال."
        },
        noInternet: {
          title: "من دون تعرض للإنترنت",
          text: "بياناتك لا تغادر موقعك أبدًا. تبقى قواعد بيانات المستخدمين داخل الجهاز، مشفرة بالكامل ومعزولة عن الإنترنت."
        },
        guestAccess: {
          title: "وصول مؤقت للضيوف",
          text: "اسمح للضيوف بالدخول من دون مقاطعات. شارك رابط وصول مؤقت من التطبيق ليتمكن الزوار من فتح البوابة بأنفسهم، من دون اتصالات لطلب الفتح."
        },
        smartAccess: {
          title: "وصول ذكي",
          text: "وصول آمن إلى البوابة من تطبيق iOS/Android أو من خلال جهاز تحكم RF. ويمكن للمشرفين الاطلاع على سجل الدخول للحصول على رؤية واضحة لنشاط البوابة."
        },
        userManagement: {
          title: "إدارة مستخدمين بسيطة",
          text: "أدر المستخدمين والصلاحيات بسهولة من خلال التطبيق أو عبر استيراد ملف CSV. يدعم حتى 4000 مستخدم لكل بوابة وحتى 100 مسؤول."
        }
      }
    },
    action: {
      title: "شاهده أثناء العمل"
    },
    about: {
      title: "من نحن",
      text1: "تأسست WIFIGATE بهدف تطوير حل آمن وميسور لأنظمة التحكم في الوصول.",
      text2: "نطوّر مكونات العتاد والبرمجيات داخليًا لتتكامل معًا بشكل مثالي وتقدم تجربة استخدام سلسة مع الحفاظ على أعلى مستوى من الأمان."
    },
    contact: {
      title: "تواصل معنا",
      subtitle: "يسعدنا أن نستعرض إمكانياتنا وأن نقدم لك المشورة حول نظامنا.",
      name: "إيتاي نافيه",
      whatsapp: "واتساب",
      linkedin: "لينكدإن"
    },
    footer: {
      copyright: "WIFIGATE. جميع الحقوق محفوظة.",
      tagline: "ذكي. آمن. خاص ومن دون اشتراكات، إلى الأبد."
    }
  }
};

// Current language state
let currentLang = 'en';

function getResolvedLanguage(lang = currentLang) {
  return translations[lang] ? lang : "en";
}

function getTranslationBundle(lang = currentLang) {
  return translations[getResolvedLanguage(lang)];
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupScrollSpy();
  setupRevealOnScroll();
  setupCenteredScroll();
  setupContactForm();
  setupHeroRotator();
  setupHeroDeviceRotation();
  setupVideoAutoplay();
  setupLanguageSelector();
  setYear();
  
  // Initialize language from localStorage or default to English
  const savedLang = localStorage.getItem('language') || 'en';
  if (savedLang !== 'en') {
    changeLanguage(savedLang);
  }
});

/**
 * Mobile navigation toggle
 */
function setupNav() {
  const toggle = $(".nav__toggle");
  const navWrapper = $(".nav__links-wrapper");
  if (!toggle || !navWrapper) return;

  toggle.addEventListener("click", () => {
    const isOpen = navWrapper.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close menu when a link is clicked (mobile)
  $$(".nav__link", navWrapper).forEach((link) => {
    link.addEventListener("click", () => {
      if (navWrapper.classList.contains("is-open")) {
        navWrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/**
 * Scroll spy: highlight nav link for current section
 */
function setupScrollSpy() {
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        if (!id) return;

        navLinks.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (href === `#${id}`) {
            link.classList.add("nav__link--active");
          } else {
            link.classList.remove("nav__link--active");
          }
        });
      });
    },
    {
      threshold: 0.4,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Reveal-on-scroll animation using IntersectionObserver
 */
function setupRevealOnScroll() {
  const revealEls = $$(".js-reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // animate once
        }
      });
    },
    {
      threshold: 0.22,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/**
 * Simple contact form success message
 */
function setupContactForm() {
  const form = $(".contact-form");
  if (!form) return;

  const statusEl = $(".contact-form__status", form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // basic front-end validation
    const name = $("#name", form);
    const email = $("#email", form);
    const message = $("#message", form);

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      updateStatus("Please fill out all fields before sending.", "error", statusEl);
      return;
    }

    // Here you could integrate with a backend or email service.
    form.reset();
    updateStatus("Thank you! Your message has been sent.", "success", statusEl);
  });
}

/**
 * Update contact form status text
 */
function updateStatus(text, type, el) {
  if (!el) return;
  el.textContent = text;
  el.style.color = type === "success" ? "#15803d" : "#b91c1c";
}

/**
 * Set current year in footer
 */
function setYear() {
  const yearEl = $("#js-year");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

/**
 * Interactive 3D rotation for the hero device
 */
function setupHeroDeviceRotation() {
  const device = $(".hero-device");
  if (!device || window.matchMedia("(max-width: 768px)").matches) return;
  const visual = $(".hero__visual");
  if (!visual) return;
  const systems = $$(".hero-system");
  if (!systems.length) return;

  let pointerId = null;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  const initialRotateY = -24;
  let baseRotateX = 10;
  let baseRotateY = initialRotateY;
  let rotateX = baseRotateX;
  let rotateY = baseRotateY;
  let activeIndex = 0;
  let lastSlotIndex = -1;

  const slots = [
    { x: 20, y: 24 },
    { x: 77, y: 24 },
    { x: 18, y: 72 },
    { x: 79, y: 68 }
  ];

  const intersectsWithMargin = (rectA, rectB, margin = 28) => {
    return !(
      rectA.right + margin < rectB.left ||
      rectA.left - margin > rectB.right ||
      rectA.bottom + margin < rectB.top ||
      rectA.top - margin > rectB.bottom
    );
  };

  const placeActiveSystem = () => {
    const activeSystem = systems[activeIndex];
    if (!activeSystem) return;

    const candidateIndexes = slots.map((_, index) => index);
    for (let index = candidateIndexes.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [candidateIndexes[index], candidateIndexes[randomIndex]] = [candidateIndexes[randomIndex], candidateIndexes[index]];
    }

    if (candidateIndexes.length > 1 && candidateIndexes[0] === lastSlotIndex) {
      [candidateIndexes[0], candidateIndexes[1]] = [candidateIndexes[1], candidateIndexes[0]];
    }

    const boxRect = device.getBoundingClientRect();
    let chosenIndex = candidateIndexes[0];

    for (const slotIndex of candidateIndexes) {
      const slot = slots[slotIndex];
      activeSystem.style.left = `${slot.x}%`;
      activeSystem.style.top = `${slot.y}%`;

      const card = $(".hero-system__card", activeSystem);
      if (!card) continue;

      const cardRect = card.getBoundingClientRect();
      if (!intersectsWithMargin(cardRect, boxRect)) {
        chosenIndex = slotIndex;
        break;
      }
    }

    const chosenSlot = slots[chosenIndex];
    activeSystem.style.left = `${chosenSlot.x}%`;
    activeSystem.style.top = `${chosenSlot.y}%`;
    lastSlotIndex = chosenIndex;
  };

  const updateActiveConnector = () => {
    const activeSystem = systems[activeIndex];
    if (!activeSystem) return;

    const line = $(".hero-system__line", activeSystem);
    const dot = $(".hero-system__dot", activeSystem);
    const card = $(".hero-system__card", activeSystem);
    if (!line || !dot || !card) return;

    const visualRect = visual.getBoundingClientRect();
    const boxRect = device.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    const boxCenterX = boxRect.left + boxRect.width / 2;
    const boxCenterY = boxRect.top + boxRect.height / 2;
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const dx = cardCenterX - boxCenterX;
    const dy = cardCenterY - boxCenterY;

    let startX;
    let startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      startX = dx > 0 ? boxRect.right - 3 : boxRect.left + 3;
      startY = Math.max(boxRect.top + 12, Math.min(boxRect.bottom - 12, cardCenterY));
    } else {
      startX = Math.max(boxRect.left + 12, Math.min(boxRect.right - 12, cardCenterX));
      startY = dy > 0 ? boxRect.bottom - 3 : boxRect.top + 3;
    }

    let endX;
    let endY;
    if (Math.abs(dx) > Math.abs(dy)) {
      endX = dx > 0 ? cardRect.left : cardRect.right;
      endY = Math.max(cardRect.top + 16, Math.min(cardRect.bottom - 16, boxCenterY));
    } else {
      endX = Math.max(cardRect.left + 16, Math.min(cardRect.right - 16, boxCenterX));
      endY = dy > 0 ? cardRect.top : cardRect.bottom;
    }

    const localStartX = startX - visualRect.left;
    const localStartY = startY - visualRect.top;
    const localEndX = endX - visualRect.left;
    const localEndY = endY - visualRect.top;
    const lineDx = localEndX - localStartX;
    const lineDy = localEndY - localStartY;
    const lineLength = Math.max(Math.hypot(lineDx, lineDy), 12);
    const lineAngle = Math.atan2(lineDy, lineDx) * (180 / Math.PI);

    const systemLeft = activeSystem.offsetLeft;
    const systemTop = activeSystem.offsetTop;

    line.style.setProperty("--line-x", `${localStartX - systemLeft}px`);
    line.style.setProperty("--line-y", `${localStartY - systemTop}px`);
    line.style.setProperty("--line-len", `${lineLength}px`);
    line.style.setProperty("--line-angle", `${lineAngle}deg`);

    dot.style.setProperty("--dot-x", `${localEndX - systemLeft}px`);
    dot.style.setProperty("--dot-y", `${localEndY - systemTop}px`);
  };

  const setActiveSystem = () => {
    const normalizedY = (((rotateY - initialRotateY) % 360) + 360) % 360;
    const index = Math.floor(normalizedY / (360 / systems.length)) % systems.length;
    const changed = index !== activeIndex;
    activeIndex = index;

    systems.forEach((system, systemIndex) => {
      system.classList.toggle("is-active", systemIndex === index);
    });

    if (changed) {
      placeActiveSystem();
    }
  };

  const applyRotation = () => {
    device.style.setProperty("--device-rotate-x", `${rotateX}deg`);
    device.style.setProperty("--device-rotate-y", `${rotateY}deg`);
    setActiveSystem();
    updateActiveConnector();
  };

  const stopDragging = () => {
    if (!isDragging) return;
    isDragging = false;
    pointerId = null;
    baseRotateX = rotateX;
    baseRotateY = rotateY;
    device.classList.remove("is-dragging");
  };

  device.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    device.classList.add("is-dragging");
    device.setPointerCapture(pointerId);
  });

  device.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    rotateY = baseRotateY + deltaX * 0.55;
    rotateX = baseRotateX - deltaY * 0.45;

    applyRotation();
  });

  device.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    device.releasePointerCapture(pointerId);
    stopDragging();
  });

  device.addEventListener("pointercancel", stopDragging);
  device.addEventListener("lostpointercapture", stopDragging);
  window.addEventListener("blur", stopDragging);
  window.addEventListener("resize", updateActiveConnector);

  placeActiveSystem();
  applyRotation();
}

/**
 * Centered scroll behavior for in-page anchors
 * - Intercepts clicks on `a[href^="#"]` and smoothly centers the target element
 * - Handles initial page load with a hash and focuses the target for accessibility
 */
function centerScrollToElement(el, smooth = true) {
  if (!el) return;
  
  // Special handling for features section - scroll to start
  if (el.id === 'features') {
    try {
      if ('scrollBehavior' in document.documentElement.style) {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start', inline: 'nearest' });
        return;
      }
    } catch (e) {
      // fall through to manual calculation
    }
    
    const rect = el.getBoundingClientRect();
    const elTop = rect.top + window.scrollY;
    try {
      window.scrollTo({ top: elTop, behavior: smooth ? 'smooth' : 'auto' });
    } catch (err) {
      window.scrollTo(0, elTop);
    }
    return;
  }
  
  // Default center behavior for other sections
  // Prefer scrollIntoView with block:center when available
  try {
    if ('scrollBehavior' in document.documentElement.style) {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'nearest' });
      return;
    }
  } catch (e) {
    // fall through to manual calculation
  }

  const rect = el.getBoundingClientRect();
  const elTop = rect.top + window.scrollY;
  const targetScroll = Math.round(elTop - (window.innerHeight / 2) + (rect.height / 2));
  try {
    window.scrollTo({ top: targetScroll, behavior: smooth ? 'smooth' : 'auto' });
  } catch (err) {
    window.scrollTo(0, targetScroll);
  }
}

function setupCenteredScroll() {
  // Delegate clicks on same-page anchors
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    // ignore lone '#' anchors
    if (href === '#') return;

    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return; // allow normal behavior if target not found

    ev.preventDefault();

    // Close mobile nav if open to avoid layout shift
    const navWrapper = document.querySelector('.nav__links-wrapper');
    const toggle = document.querySelector('.nav__toggle');
    if (navWrapper && navWrapper.classList.contains('is-open')) {
      navWrapper.classList.remove('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    centerScrollToElement(target, true);

    // Update history without triggering another jump
    try {
      if (history.pushState) {
        history.pushState(null, '', '#' + id);
      } else {
        location.hash = '#' + id;
      }
    } catch (e) {
      // ignore
    }

    // Move focus to the target for keyboard users without scrolling again
    try {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.removeAttribute('tabindex');
    } catch (err) {
      // ignore focus errors
    }
  });

  // If page loaded with a hash, center it (defer slightly to allow default jump)
  if (location.hash) {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        centerScrollToElement(target, false);
        try {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.removeAttribute('tabindex');
        } catch (err) {}
      }, 60);
    }
  }
}

/**
 * Hero title rotator: cycles between phrases every 2 seconds
 */
function setupHeroRotator() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  let idx = 0;

  // Ensure initial phrase is set
  updateHeroRotatorPhrase();

  const interval = 3000; // change every 3s
  const fadeClass = 'is-fading';

  // helper to perform a single fade swap
  function swapNext() {
    const phrases = getTranslationBundle().hero.rotator.phrases;
    const nextIdx = (idx + 1) % phrases.length;

    // Prefer Web Animations API for reliable fades; fall back to CSS class if unavailable
    const animMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rotator-duration')) || 420;

    if (el.animate) {
      // fade out
      const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: animMs, easing: 'ease', fill: 'forwards' });
      out.onfinish = () => {
        el.textContent = phrases[nextIdx];
        // fade in
        const _in = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: animMs, easing: 'ease', fill: 'forwards' });
        _in.onfinish = () => {
          idx = nextIdx;
        };
      };
    } else {
      // fallback: use CSS class toggle + timeout (existing approach)
      const onTransitionEnd = (ev) => {
        if (ev && ev.propertyName && ev.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onTransitionEnd);
        el.textContent = phrases[nextIdx];
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove(fadeClass)));
        idx = nextIdx;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
      };
      el.addEventListener('transitionend', onTransitionEnd);
      el.classList.add(fadeClass);
      const fallbackTimer = setTimeout(() => onTransitionEnd({ propertyName: 'opacity' }), animMs + 80);
    }
  }

  // Kick off the interval
  setInterval(swapNext, interval);
}

/**
 * Update hero rotator with current language phrase
 */
function updateHeroRotatorPhrase() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;
  const phrases = getTranslationBundle().hero.rotator.phrases;
  el.textContent = phrases[0];
}

/**
 * Video autoplay on scroll into view
 */
function setupVideoAutoplay() {
  const video = document.getElementById('action-video');
  if (!video) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(err => console.log('Video autoplay failed:', err));
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });

  observer.observe(video);
}

/**
 * Custom language selector dropdown
 */
function setupLanguageSelector() {
  const selector = document.querySelector('.language-selector');
  const button = document.getElementById('language-button');
  const dropdown = document.getElementById('language-dropdown');
  const options = document.querySelectorAll('.language-selector__option');
  const selectedText = button.querySelector('.language-selector__selected');
  const selectedFlag = document.getElementById('selected-flag');
  
  if (!selector || !button || !dropdown) return;

  // Toggle dropdown
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    selector.classList.toggle('is-open');
  });

  // Handle keyboard
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selector.classList.toggle('is-open');
    }
  });

  // Select option
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = option.dataset.lang;
      const flagHTML = option.querySelector('.language-selector__flag').innerHTML;
      const text = option.querySelector('span:not(.language-selector__flag)').textContent;
      
      // Update selected text and flag
      selectedText.textContent = text;
      if (selectedFlag) {
        selectedFlag.innerHTML = flagHTML;
      }
      
      // Update selected state
      options.forEach(opt => opt.classList.remove('is-selected'));
      option.classList.add('is-selected');
      
      // Close dropdown
      selector.classList.remove('is-open');
      
      // Change language
      changeLanguage(lang);
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!selector.contains(e.target)) {
      selector.classList.remove('is-open');
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      selector.classList.remove('is-open');
    }
  });

  // Set initial selected state
  const savedLang = localStorage.getItem('language') || 'en';
  const selectedOption = dropdown.querySelector(`[data-lang="${savedLang}"]`);
  if (selectedOption) {
    selectedOption.classList.add('is-selected');
    const text = selectedOption.querySelector('span:not(.language-selector__flag)').textContent;
    const flagHTML = selectedOption.querySelector('.language-selector__flag').innerHTML;
    selectedText.textContent = text;
    if (selectedFlag) {
      selectedFlag.innerHTML = flagHTML;
    }
  }
}

/**
 * Change website language
 */
function changeLanguage(lang) {
  const resolvedLang = getResolvedLanguage(lang);

  if (!translations[resolvedLang]) {
    console.error('Language not found:', lang);
    return;
  }
  
  currentLang = lang;
  localStorage.setItem('language', lang);
  
  // Update HTML lang attribute
  document.documentElement.setAttribute('lang', resolvedLang);
  
  // Update dir attribute for RTL languages
  if (RTL_LANGS.has(lang)) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.classList.add('rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.body.classList.remove('rtl');
  }
  
  // Update all elements with data-i18n attributes
  updateTranslations();
  
  // Update hero rotator
  updateHeroRotatorPhrase();
}

/**
 * Update all translatable elements
 */
function updateTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  const activeTranslations = getTranslationBundle();
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getNestedTranslation(activeTranslations, key);
    
    if (translation) {
      element.textContent = translation;
    }
  });
}

/**
 * Get nested translation by dot notation key
 * e.g., 'nav.home' => translations[lang].nav.home
 */
function getNestedTranslation(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
