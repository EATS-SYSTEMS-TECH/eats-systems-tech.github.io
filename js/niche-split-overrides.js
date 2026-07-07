// /js/niche-split-overrides.js
// Adds the garage-doors niche and separates it cleanly from roller-shutters.
(function () {
  if (
    typeof translations === "undefined" ||
    typeof APPLICATION_STORIES === "undefined" ||
    typeof APPLICATION_STORY_SLUGS === "undefined"
  ) {
    return;
  }

  const splitCopy = {
    en: {
      applications: {
        garageDoors: "Commercial Garage Doors",
        rollerShutters: "Commercial Roller Shutters",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate gives commercial garage doors and service-bay openings the same simple phone-based access flow used across the rest of the property.",
          problem:
            "Garage doors at loading bays, service garages, and indoor parking entries are often controlled by wall switches or shared remotes, which creates delay and weak access control.",
          solution:
            "Authorized staff can open the garage door from the phone, while owners or admins decide who gets access and when without circulating extra remotes.",
          value:
            "Fewer remotes, cleaner shift handoffs, faster vehicle and service access, and better access history.",
          buyer:
            "Warehouses, service bays, commercial garages, indoor parking areas, and installers.",
          demo:
            "Show a staff member opening the garage door from the phone and then sharing time-limited access with a delivery driver or technician.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate operates electric roller shutters for storefronts, warehouses, and service openings with the same simple phone-based access flow used across the rest of the property.",
          problem:
            "Roller shutters often rely on exposed wall switches or shared remotes at storefronts and service entries, which makes access harder to secure and manage.",
          solution:
            "Authorized users can raise or close the shutter from the phone, while admins can grant or revoke access without handing out remotes or shared codes.",
          value:
            "Less exposed hardware, fewer shared remotes, better access control, and smoother daily opening and closing.",
          buyer:
            "Retail shops, warehouses, service counters, commercial properties, and installers.",
          demo:
            "Show a manager opening the shutter from the phone and then giving temporary opening access to a staff member.",
        },
      },
    },
    he: {
      applications: {
        garageDoors: "דלתות גראז' לעסקים",
        rollerShutters: "תריסי גלילה לעסקים",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate מאפשרת להפעיל דלתות גראז' לעסקים ופתחים של מפרצי שירות מאותה זרימת גישה פשוטה מהטלפון שמשמשת את שאר האתר.",
          problem:
            "דלתות גראז' באזורי טעינה, במפרצי שירות ובכניסות לחניה מקורה נשלטות לא פעם ממתגי קיר או שלטים משותפים, מה שיוצר עיכובים ושליטה חלשה בגישה.",
          solution:
            "צוות מורשה יכול לפתוח את דלת הגראז' מהטלפון, ובעלי הנכס או האדמינים קובעים מי מקבל גישה ומתי בלי להפיץ שלטים נוספים.",
          value:
            "פחות שלטים, העברת משמרות מסודרת יותר, גישת רכב ושירות מהירה יותר והיסטוריית גישה ברורה יותר.",
          buyer:
            "מחסנים, מפרצי שירות, גראז'ים מסחריים, חניונים מקורים ומתקינים.",
          demo:
            "הראו איש צוות פותח את דלת הגראז' מהטלפון ואז משתף גישה מוגבלת בזמן לשליח או לטכנאי.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate מפעילה תריסי גלילה חשמליים לחנויות, למחסנים ולפתחים שירותיים מאותה זרימת גישה פשוטה מהטלפון שמשמשת את שאר האתר.",
          problem:
            "תריסי גלילה בחזית חנות, במחסן או בכניסת שירות נשענים לעיתים על מתגים חשופים או שלטים משותפים, מה שמקשה לאבטח ולנהל את הגישה.",
          solution:
            "משתמשים מורשים יכולים להרים או לסגור את התריס מהטלפון, והאדמינים יכולים להעניק או לבטל גישה בלי לחלק שלטים או קודים משותפים.",
          value:
            "פחות חומרה חשופה, פחות שלטים משותפים, שליטה טובה יותר בגישה ושגרת פתיחה וסגירה חלקה יותר.",
          buyer:
            "חנויות, מחסנים, עמדות שירות, נכסים מסחריים ומתקינים.",
          demo:
            "הראו מנהל פותח את התריס מהטלפון ואז מעניק לעובד גישת פתיחה זמנית.",
        },
      },
    },
    es: {
      applications: {
        garageDoors: "Puertas de garaje comerciales",
        rollerShutters: "Persianas enrollables comerciales",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate da a las puertas de garaje comerciales y a las aperturas de muelles de servicio el mismo flujo simple de acceso por teléfono que usa el resto del sitio.",
          problem:
            "Las puertas de garaje en zonas de carga, talleres de servicio y entradas de estacionamiento cubierto suelen controlarse con interruptores de pared o mandos compartidos, lo que provoca demoras y un control de acceso débil.",
          solution:
            "El personal autorizado puede abrir la puerta desde el teléfono, mientras que los propietarios o administradores deciden quién recibe acceso y cuándo, sin repartir más mandos.",
          value:
            "Menos mandos, cambios de turno más ordenados, acceso más rápido para vehículos y servicio, e historial de acceso más claro.",
          buyer:
            "Almacenes, muelles de servicio, garajes comerciales, estacionamientos cubiertos e instaladores.",
          demo:
            "Muestra a un miembro del personal abriendo la puerta desde el teléfono y luego compartiendo acceso temporal con un repartidor o técnico.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate opera persianas enrollables eléctricas para tiendas, almacenes y aperturas de servicio con el mismo flujo simple de acceso por teléfono que usa el resto del sitio.",
          problem:
            "Las persianas enrollables suelen depender de interruptores expuestos o mandos compartidos en tiendas y entradas de servicio, lo que dificulta asegurar y gestionar el acceso.",
          solution:
            "Los usuarios autorizados pueden subir o bajar la persiana desde el teléfono, mientras que los administradores pueden conceder o revocar acceso sin repartir mandos ni códigos compartidos.",
          value:
            "Menos hardware expuesto, menos mandos compartidos, mejor control de acceso y aperturas y cierres diarios más fluidos.",
          buyer:
            "Tiendas, almacenes, mostradores de servicio, propiedades comerciales e instaladores.",
          demo:
            "Muestra a un encargado abriendo la persiana desde el teléfono y luego dando acceso temporal de apertura a un empleado.",
        },
      },
    },
    pt: {
      applications: {
        garageDoors: "Portas de garagem comerciais",
        rollerShutters: "Persianas de enrolar comerciais",
      },
      stories: {
        garageDoors: {
          pitch:
            "O WiFiGate dá às portas de garagem comerciais e às aberturas de baías de serviço o mesmo fluxo simples de acesso por telefone usado no restante do local.",
          problem:
            "Portas de garagem em zonas de carga, oficinas de serviço e entradas de estacionamento coberto costumam ser controladas por interruptores de parede ou comandos partilhados, o que cria atrasos e um controlo de acesso fraco.",
          solution:
            "A equipa autorizada pode abrir a porta da garagem pelo telefone, enquanto proprietários ou administradores decidem quem recebe acesso e quando, sem distribuir mais comandos.",
          value:
            "Menos comandos, trocas de turno mais organizadas, acesso mais rápido para veículos e serviços, e histórico de acesso mais claro.",
          buyer:
            "Armazéns, baías de serviço, garagens comerciais, estacionamentos cobertos e instaladores.",
          demo:
            "Mostre um membro da equipa abrindo a porta da garagem pelo telefone e depois compartilhando acesso temporário com um entregador ou técnico.",
        },
        rollerShutters: {
          pitch:
            "O WiFiGate opera persianas de enrolar elétricas para lojas, armazéns e aberturas de serviço com o mesmo fluxo simples de acesso por telefone usado no restante do local.",
          problem:
            "Persianas de enrolar costumam depender de interruptores expostos ou comandos partilhados em lojas e entradas de serviço, o que dificulta proteger e gerir o acesso.",
          solution:
            "Utilizadores autorizados podem subir ou descer a persiana pelo telefone, enquanto administradores podem conceder ou revogar acesso sem distribuir comandos ou códigos partilhados.",
          value:
            "Menos hardware exposto, menos comandos partilhados, melhor controlo de acesso e aberturas e fechos diários mais suaves.",
          buyer:
            "Lojas, armazéns, balcões de serviço, propriedades comerciais e instaladores.",
          demo:
            "Mostre um gestor abrindo a persiana pelo telefone e depois dando acesso temporário de abertura a um colaborador.",
        },
      },
    },
    pl: {
      applications: {
        garageDoors: "Komercyjne bramy garażowe",
        rollerShutters: "Komercyjne rolety rolowane",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate daje komercyjnym bramom garażowym i wjazdom do zatok serwisowych ten sam prosty, telefoniczny model dostępu, który działa w całym obiekcie.",
          problem:
            "Bramy garażowe przy strefach załadunku, zatokach serwisowych i wjazdach do parkingów krytych są często sterowane przełącznikami ściennymi lub współdzielonymi pilotami, co powoduje opóźnienia i słabą kontrolę dostępu.",
          solution:
            "Uprawniony personel może otworzyć bramę z telefonu, a właściciele lub administratorzy decydują, kto i kiedy otrzyma dostęp, bez rozdawania kolejnych pilotów.",
          value:
            "Mniej pilotów, bardziej uporządkowane zmiany, szybszy dostęp dla pojazdów i serwisu oraz czytelniejsza historia dostępu.",
          buyer:
            "Magazyny, zatoki serwisowe, komercyjne garaże, parkingi kryte i instalatorzy.",
          demo:
            "Pokaż pracownika otwierającego bramę z telefonu, a następnie udostępniającego czasowy dostęp kurierowi lub technikowi.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate obsługuje elektryczne rolety rolowane w sklepach, magazynach i otwarciach serwisowych za pomocą tego samego prostego modelu dostępu z telefonu, który działa w całym obiekcie.",
          problem:
            "Rolety rolowane przy witrynach sklepowych i wejściach serwisowych często opierają się na odsłoniętych przełącznikach lub współdzielonych pilotach, co utrudnia zabezpieczenie i zarządzanie dostępem.",
          solution:
            "Uprawnieni użytkownicy mogą podnosić lub opuszczać roletę z telefonu, a administratorzy mogą nadawać lub odbierać dostęp bez rozdawania pilotów czy współdzielonych kodów.",
          value:
            "Mniej odsłoniętego osprzętu, mniej współdzielonych pilotów, lepsza kontrola dostępu i płynniejsze codzienne otwieranie oraz zamykanie.",
          buyer:
            "Sklepy, magazyny, punkty usługowe, nieruchomości komercyjne i instalatorzy.",
          demo:
            "Pokaż kierownika otwierającego roletę z telefonu, a potem nadającego pracownikowi tymczasowy dostęp do otwarcia.",
        },
      },
    },
    ru: {
      applications: {
        garageDoors: "Коммерческие гаражные ворота",
        rollerShutters: "Коммерческие рольставни",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate дает коммерческим гаражным воротам и проемам сервисных боксов тот же простой доступ с телефона, что и на остальной территории объекта.",
          problem:
            "Гаражные ворота у зон погрузки, сервисных боксов и въездов на крытые парковки часто управляются настенными выключателями или общими пультами, что создает задержки и слабый контроль доступа.",
          solution:
            "Авторизованный персонал может открывать ворота с телефона, а владельцы или администраторы решают, кто и когда получает доступ, без раздачи дополнительных пультов.",
          value:
            "Меньше пультов, более чистая передача смен, более быстрый доступ для транспорта и сервиса, а также более понятная история доступа.",
          buyer:
            "Склады, сервисные боксы, коммерческие гаражи, крытые парковки и монтажники.",
          demo:
            "Покажите сотрудника, который открывает ворота с телефона, а затем делится временным доступом с курьером или техником.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate управляет электрическими рольставнями для витрин, складов и сервисных проемов с тем же простым доступом по телефону, что и на остальной территории объекта.",
          problem:
            "Рольставни у магазинов и сервисных входов часто зависят от открытых выключателей или общих пультов, из-за чего доступ сложнее защищать и контролировать.",
          solution:
            "Авторизованные пользователи могут поднимать и опускать рольставни с телефона, а администраторы могут выдавать и отзывать доступ без раздачи пультов или общих кодов.",
          value:
            "Меньше открытого оборудования, меньше общих пультов, лучший контроль доступа и более плавное ежедневное открытие и закрытие.",
          buyer:
            "Магазины, склады, сервисные стойки, коммерческие объекты и монтажники.",
          demo:
            "Покажите, как менеджер открывает рольставни с телефона, а затем выдает сотруднику временный доступ на открытие.",
        },
      },
    },
    cs: {
      applications: {
        garageDoors: "Komerční garážová vrata",
        rollerShutters: "Komerční rolovací vrata",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate dává komerčním garážovým vratům a otvorům servisních stání stejný jednoduchý přístup z telefonu jako zbytek areálu.",
          problem:
            "Garážová vrata u nakládacích zón, servisních stání a vjezdů do krytého parkování bývají často ovládána nástěnnými spínači nebo sdílenými ovladači, což přináší zdržení a slabou kontrolu přístupu.",
          solution:
            "Oprávněný personál může vrata otevřít z telefonu, zatímco majitelé nebo administrátoři určují, kdo a kdy dostane přístup, bez rozdávání dalších ovladačů.",
          value:
            "Méně ovladačů, čistší předávání směn, rychlejší přístup pro vozidla a servis a přehlednější historie přístupů.",
          buyer:
            "Sklady, servisní stání, komerční garáže, krytá parkoviště a instalatéři.",
          demo:
            "Ukažte pracovníka, který otevírá vrata z telefonu, a potom sdílí časově omezený přístup s kurýrem nebo technikem.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate ovládá elektrická rolovací vrata pro prodejny, sklady a servisní otvory se stejným jednoduchým přístupem z telefonu jako ve zbytku areálu.",
          problem:
            "Rolovací vrata u výloh a servisních vstupů často závisejí na odkrytých spínačích nebo sdílených ovladačích, což ztěžuje zabezpečení a správu přístupu.",
          solution:
            "Oprávnění uživatelé mohou vrata z telefonu zvednout nebo zavřít a administrátoři mohou přístup udělit nebo odebrat bez rozdávání ovladačů či sdílených kódů.",
          value:
            "Méně odkrytého hardwaru, méně sdílených ovladačů, lepší kontrola přístupu a plynulejší každodenní otevírání i zavírání.",
          buyer:
            "Prodejny, sklady, servisní pulty, komerční objekty a instalatéři.",
          demo:
            "Ukažte manažera, který otevírá vrata z telefonu, a pak dává zaměstnanci dočasný přístup k otevření.",
        },
      },
    },
    ar: {
      applications: {
        garageDoors: "أبواب الجراجات التجارية",
        rollerShutters: "الستائر الدوارة التجارية",
      },
      stories: {
        garageDoors: {
          pitch:
            "يمنح WiFiGate أبواب الجراجات التجارية وفتحات مناطق الخدمة نفس تدفق الوصول البسيط عبر الهاتف المستخدم في بقية الموقع.",
          problem:
            "غالبًا ما يتم التحكم في أبواب الجراجات عند مناطق التحميل وفتحات الخدمة ومداخل المواقف المغطاة عبر مفاتيح جدارية أو أجهزة تحكم مشتركة، مما يسبب تأخيرًا وضعفًا في التحكم بالوصول.",
          solution:
            "يمكن للموظفين المخولين فتح باب الجراج من الهاتف، بينما يحدد المالكون أو المسؤولون من يحصل على الوصول ومتى، من دون توزيع أجهزة تحكم إضافية.",
          value:
            "أجهزة تحكم أقل، وتسليم ورديات أكثر تنظيمًا، ووصول أسرع للمركبات والخدمة، وسجل وصول أوضح.",
          buyer:
            "المستودعات، ومناطق الخدمة، والجراجات التجارية، والمواقف المغطاة، والمثبتون.",
          demo:
            "اعرض موظفًا يفتح باب الجراج من الهاتف ثم يشارك وصولًا مؤقتًا مع سائق توصيل أو فني.",
        },
        rollerShutters: {
          pitch:
            "يشغّل WiFiGate الستائر الدوارة الكهربائية للواجهات التجارية والمستودعات وفتحات الخدمة من خلال نفس تدفق الوصول البسيط عبر الهاتف المستخدم في بقية الموقع.",
          problem:
            "تعتمد الستائر الدوارة في واجهات المتاجر ومداخل الخدمة غالبًا على مفاتيح مكشوفة أو أجهزة تحكم مشتركة، مما يجعل تأمين الوصول وإدارته أكثر صعوبة.",
          solution:
            "يمكن للمستخدمين المخولين رفع الستارة أو إغلاقها من الهاتف، بينما يستطيع المسؤولون منح الوصول أو سحبه من دون توزيع أجهزة تحكم أو أكواد مشتركة.",
          value:
            "عتاد مكشوف أقل، وأجهزة تحكم مشتركة أقل، وتحكم أفضل بالوصول، وفتح وإغلاق يومي أكثر سلاسة.",
          buyer:
            "المتاجر، والمستودعات، ونقاط الخدمة، والعقارات التجارية، والمثبتون.",
          demo:
            "اعرض مديرًا يفتح الستارة من الهاتف ثم يمنح موظفًا وصولًا مؤقتًا للفتح.",
        },
      },
    },
    fr: {
      applications: {
        garageDoors: "Portes de garage commerciales",
        rollerShutters: "Volets roulants commerciaux",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate apporte aux portes de garage commerciales et aux ouvertures de baies de service le même flux d'accès simple par téléphone que sur le reste du site.",
          problem:
            "Les portes de garage des zones de chargement, des baies de service et des entrées de parking couvert sont souvent commandées par des interrupteurs muraux ou des télécommandes partagées, ce qui crée des retards et un contrôle d'accès faible.",
          solution:
            "Le personnel autorisé peut ouvrir la porte depuis le téléphone, tandis que les propriétaires ou administrateurs décident qui reçoit l'accès et quand, sans distribuer de télécommandes supplémentaires.",
          value:
            "Moins de télécommandes, des relais d'équipe plus propres, un accès plus rapide pour les véhicules et le service, et un historique d'accès plus clair.",
          buyer:
            "Entrepôts, baies de service, garages commerciaux, parkings couverts et installateurs.",
          demo:
            "Montrez un membre du personnel ouvrant la porte depuis le téléphone puis partageant un accès temporaire avec un livreur ou un technicien.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate pilote les volets roulants électriques pour les vitrines, les entrepôts et les ouvertures de service avec le même flux d'accès simple par téléphone que sur le reste du site.",
          problem:
            "Les volets roulants des vitrines et entrées de service dépendent souvent d'interrupteurs exposés ou de télécommandes partagées, ce qui complique la sécurisation et la gestion des accès.",
          solution:
            "Les utilisateurs autorisés peuvent lever ou fermer le volet depuis le téléphone, tandis que les administrateurs peuvent accorder ou retirer l'accès sans distribuer de télécommandes ni de codes partagés.",
          value:
            "Moins de matériel exposé, moins de télécommandes partagées, un meilleur contrôle d'accès et des ouvertures et fermetures quotidiennes plus fluides.",
          buyer:
            "Commerces, entrepôts, comptoirs de service, sites commerciaux et installateurs.",
          demo:
            "Montrez un responsable ouvrant le volet depuis le téléphone puis donnant à un employé un accès d'ouverture temporaire.",
        },
      },
    },
    de: {
      applications: {
        garageDoors: "Gewerbliche Garagentore",
        rollerShutters: "Gewerbliche Rollläden",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate gibt gewerblichen Garagentoren und Servicebucht-Öffnungen denselben einfachen telefonbasierten Zutrittsfluss wie dem restlichen Standort.",
          problem:
            "Garagentore an Ladezonen, Servicebuchten und Einfahrten zu Parkhäusern werden oft über Wandschalter oder gemeinsame Fernbedienungen gesteuert, was Verzögerungen und schwache Zutrittskontrolle verursacht.",
          solution:
            "Berechtigte Mitarbeiter können das Tor per Telefon öffnen, während Eigentümer oder Administratoren festlegen, wer wann Zugang erhält, ohne zusätzliche Fernbedienungen zu verteilen.",
          value:
            "Weniger Fernbedienungen, sauberere Schichtübergaben, schnellerer Fahrzeug- und Servicezugang und ein klarerer Zutrittsverlauf.",
          buyer:
            "Lagerhäuser, Servicebuchten, gewerbliche Garagen, Parkhäuser und Installateure.",
          demo:
            "Zeigen Sie einen Mitarbeiter, der das Garagentor per Telefon öffnet und dann einem Lieferfahrer oder Techniker zeitlich begrenzten Zugang gibt.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate steuert elektrische Rollläden für Ladenfronten, Lager und Serviceöffnungen mit demselben einfachen telefonbasierten Zutrittsfluss wie am restlichen Standort.",
          problem:
            "Rollläden an Ladenfronten und Serviceeingängen hängen oft von offen liegenden Schaltern oder gemeinsamen Fernbedienungen ab, was die Absicherung und Verwaltung des Zugangs erschwert.",
          solution:
            "Autorisierte Nutzer können den Rollladen per Telefon öffnen oder schließen, während Administratoren Zugang erteilen oder entziehen können, ohne Fernbedienungen oder gemeinsame Codes zu verteilen.",
          value:
            "Weniger freiliegende Hardware, weniger gemeinsame Fernbedienungen, bessere Zutrittskontrolle und reibungslosere tägliche Öffnungs- und Schließabläufe.",
          buyer:
            "Einzelhandelsgeschäfte, Lager, Serviceschalter, Gewerbeobjekte und Installateure.",
          demo:
            "Zeigen Sie einen Manager, der den Rollladen per Telefon öffnet und anschließend einem Mitarbeiter temporären Öffnungszugang gibt.",
        },
      },
    },
    nl: {
      applications: {
        garageDoors: "Commerciële garagedeuren",
        rollerShutters: "Commerciële rolluiken",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate geeft commerciële garagedeuren en openingen van servicevakken dezelfde eenvoudige toegangsflow via de telefoon als de rest van het terrein.",
          problem:
            "Garagedeuren bij laadzones, servicevakken en ingangen van overdekte parkings worden vaak bediend met wandschakelaars of gedeelde afstandsbedieningen, wat vertraging en zwakke toegangscontrole veroorzaakt.",
          solution:
            "Bevoegd personeel kan de garagedeur via de telefoon openen, terwijl eigenaren of beheerders bepalen wie toegang krijgt en wanneer, zonder extra afstandsbedieningen te verspreiden.",
          value:
            "Minder afstandsbedieningen, nettere ploegenwissels, snellere toegang voor voertuigen en service, en een duidelijkere toegangsgeschiedenis.",
          buyer:
            "Magazijnen, servicevakken, commerciële garages, overdekte parkings en installateurs.",
          demo:
            "Toon een medewerker die de garagedeur via de telefoon opent en daarna tijdelijke toegang deelt met een bezorger of technicus.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate bedient elektrische rolluiken voor winkelpuien, magazijnen en service-openingen met dezelfde eenvoudige toegangsflow via de telefoon als de rest van het terrein.",
          problem:
            "Rolluiken bij winkelpuien en service-ingangen vertrouwen vaak op blootliggende schakelaars of gedeelde afstandsbedieningen, waardoor toegang moeilijker te beveiligen en beheren is.",
          solution:
            "Geautoriseerde gebruikers kunnen het rolluik via de telefoon openen of sluiten, terwijl beheerders toegang kunnen geven of intrekken zonder afstandsbedieningen of gedeelde codes uit te delen.",
          value:
            "Minder blootliggende hardware, minder gedeelde afstandsbedieningen, betere toegangscontrole en soepelere dagelijkse openings- en sluitroutines.",
          buyer:
            "Winkels, magazijnen, servicebalies, commerciële panden en installateurs.",
          demo:
            "Toon een manager die het rolluik via de telefoon opent en daarna een medewerker tijdelijke openingsrechten geeft.",
        },
      },
    },
    it: {
      applications: {
        garageDoors: "Portoni da garage commerciali",
        rollerShutters: "Serrande avvolgibili commerciali",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate offre ai portoni da garage commerciali e alle aperture delle baie di servizio lo stesso semplice flusso di accesso via telefono usato nel resto del sito.",
          problem:
            "I portoni da garage nelle zone di carico, nelle baie di servizio e negli ingressi dei parcheggi coperti sono spesso controllati da interruttori a parete o telecomandi condivisi, creando ritardi e un controllo accessi debole.",
          solution:
            "Il personale autorizzato può aprire il portone dal telefono, mentre proprietari o amministratori decidono chi riceve l'accesso e quando, senza distribuire altri telecomandi.",
          value:
            "Meno telecomandi, passaggi di turno più ordinati, accesso più rapido per veicoli e servizio e cronologia accessi più chiara.",
          buyer:
            "Magazzini, baie di servizio, garage commerciali, parcheggi coperti e installatori.",
          demo:
            "Mostra un membro del personale che apre il portone dal telefono e poi condivide un accesso temporaneo con un corriere o un tecnico.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate gestisce serrande avvolgibili elettriche per vetrine, magazzini e aperture di servizio con lo stesso semplice flusso di accesso via telefono usato nel resto del sito.",
          problem:
            "Le serrande avvolgibili di vetrine e ingressi di servizio spesso dipendono da interruttori esposti o telecomandi condivisi, rendendo più difficile proteggere e gestire l'accesso.",
          solution:
            "Gli utenti autorizzati possono alzare o chiudere la serranda dal telefono, mentre gli amministratori possono concedere o revocare l'accesso senza distribuire telecomandi o codici condivisi.",
          value:
            "Meno hardware esposto, meno telecomandi condivisi, migliore controllo accessi e aperture e chiusure quotidiane più fluide.",
          buyer:
            "Negozi, magazzini, banchi di servizio, proprietà commerciali e installatori.",
          demo:
            "Mostra un responsabile che apre la serranda dal telefono e poi assegna a un dipendente un accesso temporaneo per l'apertura.",
        },
      },
    },
    no: {
      applications: {
        garageDoors: "Kommersielle garasjeporter",
        rollerShutters: "Kommersielle rulleskodder",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate gir kommersielle garasjeporter og åpninger til servicebåser den samme enkle telefonbaserte tilgangsflyten som resten av anlegget bruker.",
          problem:
            "Garasjeporter ved lastesoner, servicebåser og innganger til overbygd parkering styres ofte med veggbrytere eller delte fjernkontroller, noe som skaper forsinkelser og svak adgangskontroll.",
          solution:
            "Autorisert personale kan åpne garasjeporten fra telefonen, mens eiere eller administratorer bestemmer hvem som får tilgang og når, uten å dele ut flere fjernkontroller.",
          value:
            "Færre fjernkontroller, ryddigere vaktskifter, raskere tilgang for kjøretøy og service og tydeligere adgangshistorikk.",
          buyer:
            "Lagre, servicebåser, kommersielle garasjer, overbygde parkeringsområder og installatører.",
          demo:
            "Vis en medarbeider som åpner garasjeporten fra telefonen og deretter deler tidsbegrenset tilgang med en budsjåfør eller tekniker.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate styrer elektriske rulleskodder for butikkfronter, lagre og serviceåpninger med den samme enkle telefonbaserte tilgangsflyten som resten av anlegget bruker.",
          problem:
            "Rulleskodder ved butikkfronter og serviceinnganger er ofte avhengige av eksponerte brytere eller delte fjernkontroller, noe som gjør det vanskeligere å sikre og administrere tilgang.",
          solution:
            "Autoriserte brukere kan heve eller lukke rulleskodden fra telefonen, mens administratorer kan gi eller trekke tilbake tilgang uten å dele ut fjernkontroller eller delte koder.",
          value:
            "Mindre eksponert maskinvare, færre delte fjernkontroller, bedre adgangskontroll og smidigere daglig åpning og stenging.",
          buyer:
            "Butikker, lagre, serviceluker, næringseiendommer og installatører.",
          demo:
            "Vis en leder som åpner rulleskodden fra telefonen og deretter gir en ansatt midlertidig åpningstilgang.",
        },
      },
    },
    uk: {
      applications: {
        garageDoors: "Комерційні гаражні ворота",
        rollerShutters: "Комерційні рольставні",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate дає комерційним гаражним воротам і отворам сервісних боксів той самий простий доступ з телефона, що й на решті об’єкта.",
          problem:
            "Гаражні ворота біля зон завантаження, сервісних боксів і в’їздів до критих паркінгів часто керуються настінними вимикачами або спільними пультами, що створює затримки й слабкий контроль доступу.",
          solution:
            "Уповноважений персонал може відкривати ворота з телефона, а власники або адміністратори визначають, хто й коли отримує доступ, без роздачі додаткових пультів.",
          value:
            "Менше пультів, чистіша передача змін, швидший доступ для транспорту й сервісу та зрозуміліша історія доступу.",
          buyer:
            "Склади, сервісні бокси, комерційні гаражі, криті паркінги та інсталятори.",
          demo:
            "Покажіть працівника, який відкриває ворота з телефона, а потім ділиться тимчасовим доступом із кур’єром або техніком.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate керує електричними рольставнями для вітрин, складів і сервісних прорізів через той самий простий доступ з телефона, що й на решті об’єкта.",
          problem:
            "Рольставні біля магазинів і сервісних входів часто залежать від відкритих вимикачів або спільних пультів, через що доступ важче захищати й адмініструвати.",
          solution:
            "Авторизовані користувачі можуть піднімати або закривати рольставні з телефона, а адміністратори можуть надавати чи відкликати доступ без роздачі пультів або спільних кодів.",
          value:
            "Менше відкритого обладнання, менше спільних пультів, кращий контроль доступу та плавніше щоденне відкриття й закриття.",
          buyer:
            "Магазини, склади, сервісні стійки, комерційні об’єкти та інсталятори.",
          demo:
            "Покажіть менеджера, який відкриває рольставні з телефона, а потім надає працівнику тимчасовий доступ на відкриття.",
        },
      },
    },
    tr: {
      applications: {
        garageDoors: "Ticari garaj kapıları",
        rollerShutters: "Ticari kepenkler",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate, ticari garaj kapılarına ve servis bölmesi açıklıklarına, tesisin geri kalanında kullanılan aynı basit telefon tabanlı erişim akışını kazandırır.",
          problem:
            "Yükleme alanları, servis bölmeleri ve kapalı otopark girişlerindeki garaj kapıları çoğu zaman duvar anahtarları veya ortak kumandalarla kontrol edilir; bu da gecikmelere ve zayıf erişim kontrolüne yol açar.",
          solution:
            "Yetkili personel garaj kapısını telefondan açabilir; mülk sahipleri veya yöneticiler ise ek kumanda dağıtmadan kimin ne zaman erişim alacağını belirler.",
          value:
            "Daha az kumanda, daha düzenli vardiya teslimi, araç ve servis için daha hızlı erişim ve daha net erişim geçmişi.",
          buyer:
            "Depolar, servis bölmeleri, ticari garajlar, kapalı otoparklar ve kurulumcular.",
          demo:
            "Bir personelin garaj kapısını telefondan açtığını ve ardından bir kurye ya da teknisyene süreli erişim paylaştığını gösterin.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate, mağaza cepheleri, depolar ve servis açıklıkları için elektrikli kepenkleri, tesisin geri kalanında kullanılan aynı basit telefon tabanlı erişim akışıyla çalıştırır.",
          problem:
            "Mağaza cepheleri ve servis girişlerindeki kepenkler çoğu zaman açıkta kalan anahtarlara veya ortak kumandalara dayanır; bu da erişimi güvenceye almayı ve yönetmeyi zorlaştırır.",
          solution:
            "Yetkili kullanıcılar kepengi telefondan açıp kapatabilir; yöneticiler ise kumanda veya ortak kod dağıtmadan erişim verebilir ya da geri alabilir.",
          value:
            "Daha az açıkta donanım, daha az ortak kumanda, daha iyi erişim kontrolü ve daha akıcı günlük açma-kapama rutini.",
          buyer:
            "Mağazalar, depolar, servis tezgahları, ticari mülkler ve kurulumcular.",
          demo:
            "Bir yöneticinin kepengi telefondan açtığını ve ardından bir çalışana geçici açma erişimi verdiğini gösterin.",
        },
      },
    },
    hi: {
      applications: {
        garageDoors: "वाणिज्यिक गैरेज दरवाजे",
        rollerShutters: "वाणिज्यिक रोलर शटर",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate वाणिज्यिक गैरेज दरवाजों और सर्विस-बे खुलावों को वही सरल फोन-आधारित एक्सेस फ्लो देता है जो बाकी साइट पर उपयोग होता है।",
          problem:
            "लोडिंग ज़ोन, सर्विस-बे और कवर पार्किंग प्रवेशों पर गैरेज दरवाजे अक्सर दीवार स्विच या साझा रिमोट से नियंत्रित होते हैं, जिससे देरी होती है और एक्सेस कंट्रोल कमजोर पड़ता है।",
          solution:
            "अधिकृत स्टाफ फोन से गैरेज दरवाजा खोल सकता है, जबकि मालिक या एडमिन तय करते हैं कि किसे और कब एक्सेस मिले, बिना अतिरिक्त रिमोट बाँटे।",
          value:
            "कम रिमोट, अधिक व्यवस्थित शिफ्ट हैंडऑफ, वाहनों और सेवा के लिए तेज़ पहुंच, और अधिक स्पष्ट एक्सेस हिस्ट्री।",
          buyer:
            "वेयरहाउस, सर्विस-बे, वाणिज्यिक गैरेज, कवर पार्किंग क्षेत्र और इंस्टॉलर।",
          demo:
            "एक स्टाफ सदस्य को फोन से गैरेज दरवाजा खोलते हुए दिखाएं और फिर किसी डिलीवरी ड्राइवर या तकनीशियन को समय-सीमित एक्सेस साझा करते हुए दिखाएं।",
        },
        rollerShutters: {
          pitch:
            "WiFiGate दुकानों, वेयरहाउसों और सर्विस खुलावों के लिए इलेक्ट्रिक रोलर शटर को वही सरल फोन-आधारित एक्सेस फ्लो देकर चलाता है जो बाकी साइट पर उपयोग होता है।",
          problem:
            "दुकान के फ्रंट और सर्विस एंट्री पर रोलर शटर अक्सर खुले स्विच या साझा रिमोट पर निर्भर होते हैं, जिससे एक्सेस को सुरक्षित और प्रबंधित करना कठिन हो जाता है।",
          solution:
            "अधिकृत उपयोगकर्ता फोन से शटर ऊपर या नीचे कर सकते हैं, जबकि एडमिन रिमोट या साझा कोड बाँटे बिना एक्सेस दे या वापस ले सकते हैं।",
          value:
            "कम खुला हार्डवेयर, कम साझा रिमोट, बेहतर एक्सेस कंट्रोल, और अधिक सहज दैनिक खोलना-बंद करना।",
          buyer:
            "रिटेल दुकानें, वेयरहाउस, सर्विस काउंटर, वाणिज्यिक संपत्तियाँ और इंस्टॉलर।",
          demo:
            "एक मैनेजर को फोन से शटर खोलते हुए दिखाएं और फिर किसी कर्मचारी को अस्थायी ओपनिंग एक्सेस देते हुए दिखाएं।",
        },
      },
    },
    bn: {
      applications: {
        garageDoors: "বাণিজ্যিক গ্যারেজ দরজা",
        rollerShutters: "বাণিজ্যিক রোলার শাটার",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate বাণিজ্যিক গ্যারেজ দরজা এবং সার্ভিস-বের খোলাগুলিকে একই সহজ ফোনভিত্তিক প্রবেশপ্রবাহ দেয়, যা সাইটের বাকি অংশেও ব্যবহৃত হয়।",
          problem:
            "লোডিং জোন, সার্ভিস-বে এবং ঢাকা পার্কিং প্রবেশপথের গ্যারেজ দরজা প্রায়ই দেয়াল সুইচ বা শেয়ার করা রিমোট দিয়ে নিয়ন্ত্রিত হয়, ফলে দেরি হয় এবং প্রবেশ নিয়ন্ত্রণ দুর্বল থাকে।",
          solution:
            "অনুমোদিত কর্মীরা ফোন থেকে গ্যারেজ দরজা খুলতে পারে, আর মালিক বা অ্যাডমিন নির্ধারণ করতে পারেন কে কখন প্রবেশাধিকার পাবে, অতিরিক্ত রিমোট না দিয়েই।",
          value:
            "কম রিমোট, আরও গোছানো শিফট হস্তান্তর, যানবাহন ও সেবার জন্য দ্রুত প্রবেশ, এবং আরও পরিষ্কার প্রবেশ ইতিহাস।",
          buyer:
            "গুদাম, সার্ভিস-বে, বাণিজ্যিক গ্যারেজ, ঢাকা পার্কিং এলাকা এবং ইনস্টলাররা।",
          demo:
            "একজন কর্মীকে ফোন থেকে গ্যারেজ দরজা খুলতে দেখান, তারপর একজন ডেলিভারি ড্রাইভার বা টেকনিশিয়ানের সঙ্গে সময়সীমাবদ্ধ প্রবেশাধিকার শেয়ার করতে দেখান।",
        },
        rollerShutters: {
          pitch:
            "WiFiGate দোকান, গুদাম ও সার্ভিস খোলার জন্য বৈদ্যুতিক রোলার শাটারকে একই সহজ ফোনভিত্তিক প্রবেশপ্রবাহে চালায়, যা সাইটের বাকি অংশেও ব্যবহৃত হয়।",
          problem:
            "দোকানের সামনের দিক ও সার্ভিস প্রবেশপথের রোলার শাটার প্রায়ই খোলা সুইচ বা শেয়ার করা রিমোটের ওপর নির্ভর করে, ফলে প্রবেশ সুরক্ষিত ও পরিচালনা করা কঠিন হয়।",
          solution:
            "অনুমোদিত ব্যবহারকারীরা ফোন থেকে শাটার ওঠাতে বা নামাতে পারে, আর অ্যাডমিন রিমোট বা শেয়ার করা কোড না দিয়েই প্রবেশাধিকার দিতে বা বাতিল করতে পারে।",
          value:
            "কম উন্মুক্ত হার্ডওয়্যার, কম শেয়ার করা রিমোট, ভালো প্রবেশ নিয়ন্ত্রণ, এবং আরও মসৃণ দৈনিক খোলা-বন্ধ করা।",
          buyer:
            "দোকান, গুদাম, সার্ভিস কাউন্টার, বাণিজ্যিক সম্পত্তি এবং ইনস্টলাররা।",
          demo:
            "একজন ম্যানেজারকে ফোন থেকে শাটার খুলতে দেখান এবং তারপর একজন কর্মীকে অস্থায়ী খোলার প্রবেশাধিকার দিতে দেখান।",
        },
      },
    },
    mr: {
      applications: {
        garageDoors: "व्यावसायिक गॅरेज दारे",
        rollerShutters: "व्यावसायिक रोलर शटर",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate व्यावसायिक गॅरेज दारे आणि सर्व्हिस-बे उघड्यांना साइटच्या उर्वरित भागात वापरल्या जाणाऱ्या त्याच सोप्या फोन-आधारित प्रवेशप्रवाहाशी जोडते.",
          problem:
            "लोडिंग झोन, सर्व्हिस-बे आणि आच्छादित पार्किंग प्रवेशांवरील गॅरेज दारे बहुतेकदा भिंतीवरील स्विच किंवा सामायिक रिमोटने नियंत्रित केली जातात, त्यामुळे विलंब होतो आणि प्रवेश नियंत्रण कमकुवत राहते.",
          solution:
            "अधिकृत कर्मचारी फोनवरून गॅरेजचे दार उघडू शकतात, तर मालक किंवा अॅडमिन अतिरिक्त रिमोट न देता कोणाला आणि केव्हा प्रवेश द्यायचा ते ठरवू शकतात.",
          value:
            "कमी रिमोट, अधिक नीटनेटके शिफ्ट हँडऑफ, वाहन आणि सेवेसाठी जलद प्रवेश, आणि अधिक स्पष्ट प्रवेश इतिहास.",
          buyer:
            "वेअरहाउस, सर्व्हिस-बे, व्यावसायिक गॅरेज, आच्छादित पार्किंग क्षेत्रे आणि इंस्टॉलर.",
          demo:
            "एक कर्मचारी फोनवरून गॅरेजचे दार उघडताना दाखवा आणि नंतर डिलिव्हरी ड्रायव्हर किंवा तंत्रज्ञाशी वेळ-सीमित प्रवेश शेअर करताना दाखवा.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate दुकाने, वेअरहाउस आणि सर्व्हिस उघड्यांसाठी इलेक्ट्रिक रोलर शटरना साइटच्या उर्वरित भागात वापरल्या जाणाऱ्या त्याच सोप्या फोन-आधारित प्रवेशप्रवाहाने चालवते.",
          problem:
            "दुकानांच्या समोरील भागातील आणि सर्व्हिस प्रवेशांवरील रोलर शटर बहुतेकदा उघड्या स्विचांवर किंवा सामायिक रिमोटवर अवलंबून असतात, त्यामुळे प्रवेश सुरक्षित ठेवणे आणि व्यवस्थापित करणे कठीण होते.",
          solution:
            "अधिकृत वापरकर्ते फोनवरून शटर वर किंवा खाली करू शकतात, तर अॅडमिन रिमोट किंवा सामायिक कोड न देता प्रवेश देऊ किंवा काढू शकतात.",
          value:
            "कमी उघडे हार्डवेअर, कमी सामायिक रिमोट, अधिक चांगले प्रवेश नियंत्रण, आणि अधिक सुरळीत दैनंदिन उघडणे-बंद करणे.",
          buyer:
            "दुकाने, वेअरहाउस, सर्व्हिस काउंटर, व्यावसायिक मालमत्ता आणि इंस्टॉलर.",
          demo:
            "एक व्यवस्थापक फोनवरून शटर उघडताना दाखवा आणि नंतर एखाद्या कर्मचाऱ्याला तात्पुरता उघडण्याचा प्रवेश देताना दाखवा.",
        },
      },
    },
    te: {
      applications: {
        garageDoors: "వాణిజ్య గ్యారేజ్ తలుపులు",
        rollerShutters: "వాణిజ్య రోలర్ షట్టర్లు",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate వాణిజ్య గ్యారేజ్ తలుపులు మరియు సర్వీస్-బే ఓపెనింగ్‌లకు, సైట్ మిగతా భాగంలో ఉపయోగించే అదే సరళమైన ఫోన్-ఆధారిత యాక్సెస్ ప్రవాహాన్ని అందిస్తుంది.",
          problem:
            "లోడింగ్ జోన్లు, సర్వీస్-బేలు మరియు కవర్‌డ్ పార్కింగ్ ప్రవేశాల వద్ద ఉన్న గ్యారేజ్ తలుపులు తరచుగా గోడ స్విచ్‌లు లేదా పంచుకునే రిమోట్‌లతో నియంత్రించబడతాయి, దీని వల్ల ఆలస్యం మరియు బలహీనమైన యాక్సెస్ నియంత్రణ ఏర్పడుతుంది.",
          solution:
            "అధికారిక సిబ్బంది ఫోన్ నుంచి గ్యారేజ్ తలుపు తెరవగలరు, అయితే యజమానులు లేదా అడ్మిన్లు అదనపు రిమోట్‌లు పంచకుండా ఎవరికీ ఎప్పుడు యాక్సెస్ ఇవ్వాలో నిర్ణయిస్తారు.",
          value:
            "తక్కువ రిమోట్‌లు, మరింత క్రమబద్ధమైన షిఫ్ట్ హ్యాండాఫ్‌లు, వాహనాలు మరియు సేవలకు వేగవంతమైన ప్రవేశం, మరియు మరింత స్పష్టమైన యాక్సెస్ చరిత్ర.",
          buyer:
            "గిడ్డంగులు, సర్వీస్-బేలు, వాణిజ్య గ్యారేజీలు, కవర్‌డ్ పార్కింగ్ ప్రాంతాలు మరియు ఇన్‌స్టాలర్లు.",
          demo:
            "ఒక సిబ్బంది సభ్యుడు ఫోన్ నుంచి గ్యారేజ్ తలుపు తెరుస్తూ, తర్వాత డెలివరీ డ్రైవర్ లేదా టెక్నీషియన్‌తో సమయపరిమితి ఉన్న యాక్సెస్‌ను పంచుకుంటూ చూపించండి.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate దుకాణాలు, గిడ్డంగులు మరియు సర్వీస్ ఓపెనింగ్‌ల కోసం ఎలక్ట్రిక్ రోలర్ షట్టర్లను, సైట్ మిగతా భాగంలో ఉపయోగించే అదే సరళమైన ఫోన్-ఆధారిత యాక్సెస్ ప్రవాహంతో నడుపుతుంది.",
          problem:
            "దుకాణం ముందు భాగాలు మరియు సర్వీస్ ప్రవేశాల వద్ద రోలర్ షట్టర్లు తరచుగా బయట కనిపించే స్విచ్‌లు లేదా పంచుకునే రిమోట్‌లపై ఆధారపడతాయి, దీని వల్ల యాక్సెస్‌ను రక్షించడం మరియు నిర్వహించడం కష్టమవుతుంది.",
          solution:
            "అధికారిక వినియోగదారులు ఫోన్ నుంచి షట్టర్‌ను పైకెత్తగలరు లేదా మూసేయగలరు, ఇక అడ్మిన్లు రిమోట్‌లు లేదా పంచుకునే కోడ్‌లు పంపిణీ చేయకుండా యాక్సెస్ ఇవ్వగలరు లేదా తీసివేయగలరు.",
          value:
            "తక్కువ బయట కనిపించే హార్డ్‌వేర్, తక్కువ పంచుకునే రిమోట్‌లు, మెరుగైన యాక్సెస్ నియంత్రణ, మరియు మరింత సాఫీగా జరిగే రోజువారీ తెరవడం-మూసివేయడం.",
          buyer:
            "రిటైల్ దుకాణాలు, గిడ్డంగులు, సర్వీస్ కౌంటర్లు, వాణిజ్య ఆస్తులు మరియు ఇన్‌స్టాలర్లు.",
          demo:
            "ఒక మేనేజర్ ఫోన్ నుంచి షట్టర్‌ను తెరుస్తూ, తర్వాత ఉద్యోగికి తాత్కాలిక ఓపెనింగ్ యాక్సెస్ ఇస్తూ చూపించండి.",
        },
      },
    },
    "zh-Hans": {
      applications: {
        garageDoors: "商用车库门",
        rollerShutters: "商用卷帘门",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate 让商用车库门和服务车位开口拥有与场地其他区域相同的简洁手机访问流程。",
          problem:
            "装卸区、服务车位和室内停车入口的车库门通常依赖墙壁开关或共享遥控器，这会带来延迟并削弱访问控制。",
          solution:
            "授权员工可以通过手机打开车库门，而业主或管理员可以决定谁在什么时候获得访问权限，无需额外分发遥控器。",
          value:
            "更少遥控器、更清晰的交接班、更快的车辆与服务通行，以及更明确的访问记录。",
          buyer:
            "仓库、服务车位、商用车库、室内停车区和安装商。",
          demo:
            "展示一名员工通过手机打开车库门，然后向配送司机或技术人员分享限时访问权限。",
        },
        rollerShutters: {
          pitch:
            "WiFiGate 以与场地其他区域相同的简洁手机访问流程控制商铺、仓库和服务开口的电动卷帘门。",
          problem:
            "店面和服务入口的卷帘门通常依赖外露开关或共享遥控器，这会让访问更难保护和管理。",
          solution:
            "授权用户可以通过手机升起或关闭卷帘门，管理员则可以在不分发遥控器或共享代码的情况下授予或撤销访问权限。",
          value:
            "更少外露硬件、更少共享遥控器、更好的访问控制，以及更顺畅的日常开关流程。",
          buyer:
            "零售店、仓库、服务柜台、商业物业和安装商。",
          demo:
            "展示一名经理通过手机打开卷帘门，然后向员工提供临时开启权限。",
        },
      },
    },
    "zh-Hant": {
      applications: {
        garageDoors: "商用車庫門",
        rollerShutters: "商用捲簾門",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate 讓商用車庫門與服務車位開口，擁有和場地其他區域相同的簡潔手機存取流程。",
          problem:
            "裝卸區、服務車位與室內停車入口的車庫門通常依賴牆面開關或共用遙控器，這會造成延遲並削弱存取控制。",
          solution:
            "授權員工可透過手機開啟車庫門，而業主或管理員可決定誰在何時取得存取權，無須再分發更多遙控器。",
          value:
            "更少遙控器、更清楚的交班流程、更快的車輛與服務通行，以及更明確的存取紀錄。",
          buyer:
            "倉庫、服務車位、商用車庫、室內停車區與安裝商。",
          demo:
            "展示一名員工透過手機開啟車庫門，接著將限時存取權分享給外送司機或技術人員。",
        },
        rollerShutters: {
          pitch:
            "WiFiGate 以和場地其他區域相同的簡潔手機存取流程，控制商店、倉庫與服務開口的電動捲簾門。",
          problem:
            "店面與服務入口的捲簾門通常依賴外露開關或共用遙控器，使存取更難保護與管理。",
          solution:
            "授權使用者可透過手機升起或關閉捲簾門，管理員也能在不分發遙控器或共用代碼的情況下授予或撤銷存取權。",
          value:
            "更少外露硬體、更少共用遙控器、更好的存取控制，以及更順暢的日常開關流程。",
          buyer:
            "零售店、倉庫、服務櫃台、商業物業與安裝商。",
          demo:
            "展示一名經理透過手機開啟捲簾門，然後給員工臨時開啟權限。",
        },
      },
    },
    ja: {
      applications: {
        garageDoors: "業務用ガレージドア",
        rollerShutters: "業務用ローラーシャッター",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate は、業務用ガレージドアやサービスベイ開口部にも、施設の他エリアと同じシンプルな電話ベースのアクセスフローを提供します。",
          problem:
            "積み込みエリア、サービスベイ、屋内駐車場の入口にあるガレージドアは、壁スイッチや共有リモコンで操作されることが多く、遅延や弱いアクセス管理を招きます。",
          solution:
            "許可されたスタッフは電話からガレージドアを開けられ、所有者や管理者は追加のリモコンを配布せずに、誰にいつアクセスを与えるかを決められます。",
          value:
            "リモコンの削減、より整理された引き継ぎ、車両とサービスのより速い出入り、そしてより明確なアクセス履歴。",
          buyer:
            "倉庫、サービスベイ、業務用ガレージ、屋内駐車場、設置業者。",
          demo:
            "スタッフが電話からガレージドアを開け、その後で配達員や技術者に時間制限付きアクセスを共有する様子を見せます。",
        },
        rollerShutters: {
          pitch:
            "WiFiGate は、店舗、倉庫、サービス開口部向けの電動ローラーシャッターを、施設の他エリアと同じシンプルな電話ベースのアクセスフローで操作します。",
          problem:
            "店舗前面やサービス入口のローラーシャッターは、露出したスイッチや共有リモコンに依存していることが多く、アクセスの保護と管理が難しくなります。",
          solution:
            "許可されたユーザーは電話からシャッターを上げ下げでき、管理者はリモコンや共有コードを配布せずにアクセスを付与または取り消せます。",
          value:
            "露出した機器の削減、共有リモコンの削減、より良いアクセス管理、そして毎日の開閉をよりスムーズにします。",
          buyer:
            "小売店、倉庫、サービスカウンター、商業物件、設置業者。",
          demo:
            "管理者が電話からシャッターを開け、その後でスタッフに一時的な開放権限を与える流れを見せます。",
        },
      },
    },
    ko: {
      applications: {
        garageDoors: "상업용 차고문",
        rollerShutters: "상업용 롤러 셔터",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate는 상업용 차고문과 서비스 베이 출입구에도 현장의 다른 구역과 동일한 간단한 전화 기반 출입 흐름을 제공합니다.",
          problem:
            "적재 구역, 서비스 베이, 실내 주차장 입구의 차고문은 벽면 스위치나 공동 리모컨으로 제어되는 경우가 많아 지연이 발생하고 출입 통제가 약해집니다.",
          solution:
            "권한이 있는 직원은 휴대폰으로 차고문을 열 수 있고, 소유자나 관리자는 추가 리모컨을 배포하지 않고도 누구에게 언제 출입 권한을 줄지 결정할 수 있습니다.",
          value:
            "리모컨 감소, 더 정돈된 교대 인수인계, 차량 및 서비스의 더 빠른 출입, 그리고 더 명확한 출입 기록.",
          buyer:
            "창고, 서비스 베이, 상업용 차고, 실내 주차 구역, 설치업체.",
          demo:
            "직원이 휴대폰으로 차고문을 열고 이후 배달 기사나 기술자에게 시간 제한이 있는 접근 권한을 공유하는 모습을 보여줍니다.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate는 매장 전면, 창고, 서비스 개구부용 전동 롤러 셔터를 현장의 다른 구역과 동일한 간단한 전화 기반 출입 흐름으로 제어합니다.",
          problem:
            "매장 전면과 서비스 입구의 롤러 셔터는 노출된 스위치나 공동 리모컨에 의존하는 경우가 많아 출입을 안전하게 보호하고 관리하기가 더 어렵습니다.",
          solution:
            "권한이 있는 사용자는 휴대폰으로 셔터를 올리거나 내릴 수 있고, 관리자는 리모컨이나 공동 코드를 나눠주지 않고도 출입 권한을 부여하거나 회수할 수 있습니다.",
          value:
            "노출된 하드웨어 감소, 공동 리모컨 감소, 더 나은 출입 통제, 그리고 더 매끄러운 일일 개폐 흐름.",
          buyer:
            "소매점, 창고, 서비스 카운터, 상업용 부동산, 설치업체.",
          demo:
            "관리자가 휴대폰으로 셔터를 열고 이후 직원에게 임시 개방 권한을 주는 모습을 보여줍니다.",
        },
      },
    },
    da: {
      applications: {
        garageDoors: "Erhvervs-garageporte",
        rollerShutters: "Erhvervs-rulleskodder",
      },
      stories: {
        garageDoors: {
          pitch:
            "WiFiGate giver erhvervs-garageporte og åbninger til servicebåse det samme enkle telefonbaserede adgangsflow som resten af området bruger.",
          problem:
            "Garageporte ved lastezoner, servicebåse og indgange til overdækket parkering styres ofte med vægkontakter eller delte fjernbetjeninger, hvilket skaber forsinkelser og svag adgangskontrol.",
          solution:
            "Autoriseret personale kan åbne garageporten fra telefonen, mens ejere eller administratorer bestemmer, hvem der får adgang og hvornår, uden at dele flere fjernbetjeninger ud.",
          value:
            "Færre fjernbetjeninger, mere ryddelige vagtskifter, hurtigere adgang for køretøjer og service samt en tydeligere adgangshistorik.",
          buyer:
            "Lagere, servicebåse, erhvervsgarager, overdækkede parkeringsområder og installatører.",
          demo:
            "Vis en medarbejder, der åbner garageporten fra telefonen og derefter deler tidsbegrænset adgang med en budchauffør eller tekniker.",
        },
        rollerShutters: {
          pitch:
            "WiFiGate styrer elektriske rulleskodder til butikker, lagre og serviceåbninger med det samme enkle telefonbaserede adgangsflow som resten af området bruger.",
          problem:
            "Rulleskodder ved butikssider og serviceindgange er ofte afhængige af blotlagte kontakter eller delte fjernbetjeninger, hvilket gør det sværere at sikre og administrere adgang.",
          solution:
            "Autoriserede brugere kan hæve eller lukke rulleskodden fra telefonen, mens administratorer kan give eller fjerne adgang uden at uddele fjernbetjeninger eller delte koder.",
          value:
            "Mindre eksponeret hardware, færre delte fjernbetjeninger, bedre adgangskontrol og mere smidig daglig åbning og lukning.",
          buyer:
            "Butikker, lagre, servicediske, erhvervsejendomme og installatører.",
          demo:
            "Vis en leder, der åbner rulleskodden fra telefonen og derefter giver en medarbejder midlertidig åbningsadgang.",
        },
      },
    },
    hu: {
      applications: {
        garageDoors: "Kereskedelmi garázskapuk",
        rollerShutters: "Kereskedelmi redőnykapuk",
      },
      stories: {
        garageDoors: {
          pitch:
            "A WiFiGate ugyanazt az egyszerű, telefonalapú hozzáférési folyamatot adja a kereskedelmi garázskapuknak és a szervizöblök nyílásainak, mint amit a telephely többi része használ.",
          problem:
            "A rakodózónák, szervizöblök és fedett parkolók bejáratainál lévő garázskapukat gyakran fali kapcsolókkal vagy megosztott távirányítókkal vezérlik, ami késést és gyenge hozzáférés-ellenőrzést okoz.",
          solution:
            "A jogosult személyzet telefonról nyithatja a garázskaput, miközben a tulajdonosok vagy adminisztrátorok határozzák meg, hogy ki és mikor kap hozzáférést, további távirányítók kiosztása nélkül.",
          value:
            "Kevesebb távirányító, rendezettebb műszakváltás, gyorsabb jármű- és szervizbelépés, valamint tisztább hozzáférési előzmények.",
          buyer:
            "Raktárak, szervizöblök, kereskedelmi garázsok, fedett parkolók és telepítők.",
          demo:
            "Mutasson egy munkatársat, aki telefonról nyitja a garázskaput, majd időkorlátos hozzáférést oszt meg egy futárral vagy technikussal.",
        },
        rollerShutters: {
          pitch:
            "A WiFiGate elektromos redőnykapukat működtet üzletek, raktárak és szerviznyílások számára ugyanazzal az egyszerű, telefonalapú hozzáférési folyamattal, mint amit a telephely többi része használ.",
          problem:
            "Az üzletfrontoknál és szervizbejáratoknál lévő redőnykapuk gyakran kitett kapcsolókra vagy megosztott távirányítókra támaszkodnak, ami megnehezíti a hozzáférés védelmét és kezelését.",
          solution:
            "A jogosult felhasználók telefonról felhúzhatják vagy lezárhatják a redőnyt, miközben az adminisztrátorok távirányítók vagy megosztott kódok kiosztása nélkül adhatnak vagy vonhatnak vissza hozzáférést.",
          value:
            "Kevesebb kitett hardver, kevesebb megosztott távirányító, jobb hozzáférés-ellenőrzés és simább napi nyitás-zárás.",
          buyer:
            "Üzletek, raktárak, szervizpultok, kereskedelmi ingatlanok és telepítők.",
          demo:
            "Mutasson egy vezetőt, aki telefonról nyitja a redőnyt, majd ideiglenes nyitási hozzáférést ad egy alkalmazottnak.",
        },
      },
    },
  };

  APPLICATION_STORY_SLUGS.garageDoors = "garage-doors";

  Object.keys(splitCopy).forEach((lang) => {
    const copy = splitCopy[lang];

    if (translations[lang] && translations[lang].applications) {
      translations[lang].applications = Object.assign({}, translations[lang].applications, copy.applications);
    }

    if (!APPLICATION_STORIES[lang]) {
      APPLICATION_STORIES[lang] = {};
    }

    APPLICATION_STORIES[lang] = Object.assign({}, APPLICATION_STORIES[lang], copy.stories);
  });
})();
