// scripts/niche-pages/ru.mjs
// Russian content for the homepage "where" section + the niche/use-case pages.
// Translated from the approved Hebrew source (he.mjs); en.mjs is the format reference.

export default {
  home: {
    seoTitle: "WIFIGATE | Умный контроль доступа: ворота, двери, паркинг",
    seoDescription:
      "WIFIGATE, умная система контроля доступа: ворота, двери, шлагбаумы, рольставни и гаражи открываются с телефона. Локально, безопасно и без ежемесячной подписки.",
    keywords:
      "WIFIGATE, WiFi Gate, умный контроль доступа, открыть ворота с телефона, автоматические ворота, управление шлагбаумом с телефона, открытие гаража со смартфона, контроль доступа для дома и бизнеса, без ежемесячной подписки",
  },
  where: {
    title: "Где можно использовать WIFIGATE?",
    subtitle:
      "WIFIGATE подходит для самых разных объектов, от частных домов до коммерческих и корпоративных пространств, и обеспечивает умное, безопасное и удобное управление доступом.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Отели, Airbnb и гостевые апартаменты",
      title: "Умный доступ для отелей, Airbnb и гостевых апартаментов",
      heroLead:
        "The guest receives a personal entry permission on their phone the moment the booking is confirmed. No key cards, no lockbox, no waiting at reception.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "calendar",
          title: "Opens at check-in, closes at check-out",
          text: "There is no moment when somebody has to remember to revoke access. The permission activates at the arrival time you set and expires at departure, even when nobody from the team is on site.",
        },
        {
          icon: "invite",
          title: "The booking creates the access",
          text: "Through the WIFIGATE API your reservation system connects straight to access, so every confirmed booking issues the entry permission itself, with no manual step in between.",
        },
        {
          icon: "keyless",
          title: "No cards to issue, no lockbox to share",
          text: "Nothing to program, nothing to hand over, no card left behind by a previous guest and no lockbox code passed along. The phone already in the guest's pocket is the only way in.",
        },
      ],
      paragraph:
        "WIFIGATE позволяет гостям получать удобный и безопасный цифровой доступ прямо на телефон, без физических ключей, карт и лишних согласований с ресепшен или владельцем жилья. Через WIFIGATE API систему доступа можно связать с процессом бронирования: как только бронь подтверждена, гость автоматически получает гостевой доступ, ограниченный по времени. Доступ открывается к моменту заезда, автоматически завершается при выезде и заметно сокращает необходимость передавать ключи, сообщать коды и вручную заниматься каждым гостем.",
      bullets: [
        "Гостевой доступ создаётся автоматически после подтверждения брони",
        "Полная автоматизация через WIFIGATE API",
        "Временный доступ по датам и времени проживания",
        "Меньше ручного заселения, ключей, карт и кодов",
        "Управление правами доступа для персонала, уборщиков, техников и подрядчиков",
        "Более простое и комфортное прибытие для гостей",
        "Доступ автоматически завершается при выезде",
        "История доступа для прозрачности и контроля",
      ],
      seoTitle: "Контроль доступа для отелей, Airbnb и апартаментов | WIFIGATE API",
      seoDescription:
        "WIFIGATE, умный цифровой доступ для отелей, Airbnb и апартаментов: гостевые права через WIFIGATE API, временный доступ по брони, меньше ключей и ручного заселения.",
      imageAlt: "Гости открывают дверь номера в отеле с телефона в современном коридоре",
    },
    "roller-shutters": {
      label: "Рольставни для бизнеса и магазинов",
      title: "Умное и безопасное управление рольставнями для бизнеса и магазинов",
      heroLead:
        "The shutter opens from a phone, and control moves to the protected inner side of the business. Fewer remotes, fewer keys and fewer exposed entry points outside.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "shutter",
          title: "Control moves inside, out of reach",
          text: "A switch or key box on an exterior wall is exposed to anyone walking past. When opening comes from a phone, the control point can sit on the inside of the shop.",
        },
        {
          icon: "users",
          title: "A separate permission for every employee",
          text: "A key or remote left with a former employee keeps working. A personal permission opens on the first day and closes on the last, with no lock to change and no hardware to collect.",
        },
        {
          icon: "phone",
          title: "Open without standing at the shutter",
          text: "A key forces you to stand right at the control point, hands full, with a poor view of the shutter. From a phone it happens at a safer distance.",
        },
      ],
      paragraph:
        "Рольставнями в магазинах и на коммерческих объектах часто управляют с помощью пультов, ключей, наружного ключ-бокса или выключателей, вынесенных на улицу. Такие решения теряются, остаются у бывших сотрудников, копируются или превращаются в открытую точку доступа. К тому же, чтобы открыть или закрыть рольставни ключом, приходится стоять вплотную к месту управления, держать ключ в руке и порой терять удобный обзор зоны рольставней. WIFIGATE переносит управление в приложение и размещает контроль доступа с внутренней, более защищённой стороны: открывать и закрывать становится удобнее, правами сотрудников и подрядчиков легко управлять, а зависимость от ключей, пультов и уязвимых наружных точек доступа снижается.",
      bullets: [
        "Открытие и закрытие с телефона, без привязки к пультам",
        "Меньше зависимости от ключей, которые можно потерять или скопировать",
        "Меньше открытых точек доступа снаружи объекта",
        "Удобное управление с хорошим обзором зоны рольставней",
        "Управление правами для сотрудников, руководителей и подрядчиков",
        "Возможность временного доступа по времени или необходимости",
        "Подходит для магазинов, складов, служебных входов и бизнеса",
        "Более аккуратное и защищённое решение для ежедневной работы",
      ],
      seoTitle: "Умное управление рольставнями для бизнеса и магазинов | WIFIGATE",
      seoDescription:
        "WIFIGATE позволяет управлять рольставнями бизнеса с телефона: права доступа, меньше зависимости от ключей и пультов и меньше открытых точек доступа снаружи.",
      imageAlt: "Владелец бизнеса открывает рольставни магазина с телефона",
    },
    "electric-gates": {
      label: "Автоматические ворота и шлагбаумы",
      title: "Умное открытие автоматических ворот и шлагбаумов",
      heroLead:
        "Open the gate or barrier from your phone, send a temporary permission to a guest or supplier, and let daily users through automatically. Existing remotes keep working alongside it.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "handsfree",
          title: "Automatic opening on the daily drive in",
          text: "Auto Open recognises that you have arrived and opens the gate for you. No hunting through the glovebox and no winding the window down in the rain.",
        },
        {
          icon: "clock",
          title: "Temporary access for a supplier or guest",
          text: "Instead of handing over a remote and hoping it comes back, send a permission valid only for the window in which it is actually needed, after which it closes itself.",
        },
        {
          icon: "gate",
          title: "Existing remotes do not go in the bin",
          text: "WIFIGATE joins what is already installed on the gate. Whoever prefers a remote keeps using it, and whoever prefers a phone simply opens from the app.",
        },
      ],
      paragraph:
        "Автоматическими воротами и шлагбаумами пользуются жильцы, сотрудники, гости и подрядчики, но управление пультами, кодами и звонками «откройте ворота» быстро становится обузой. WIFIGATE позволяет открывать ворота с телефона, делиться постоянным или временным доступом, использовать автоматическое открытие для постоянных пользователей и настраивать события по расписанию. Система работает локально, безопасно и приватно, без ежемесячной подписки и регулярных платежей, а привычные пульты можно использовать и дальше, параллельно с приложением.",
      bullets: [
        "Открытие ворот или шлагбаума с телефона",
        "Без ежемесячной подписки и регулярных платежей",
        "Временный доступ для гостей, подрядчиков и сотрудников",
        "Auto Open для постоянных пользователей при ежедневном въезде",
        "События по расписанию: открытие по дням и часам",
        "Управление из приложения или привычными пультами",
        "Меньше физических пультов, которые нужно раздавать",
        "История открытий для контроля и прозрачности",
      ],
      seoTitle: "Автоматические ворота и шлагбаумы без подписки | WIFIGATE",
      seoDescription:
        "WIFIGATE открывает автоматические ворота и шлагбаумы с телефона: Auto Open, события по расписанию, привычные пульты, права доступа, и без ежемесячной подписки.",
      imageAlt: "Водитель открывает шлагбаум и автоматические ворота с телефона",
    },
    "garage-doors": {
      label: "Гаражные ворота и частные парковки",
      title: "Умное открытие гаражных ворот и частных парковок",
      heroLead:
        "The garage door opens from your phone, and access moves from a remote to a list you control. No remote to lose, and none left with someone who no longer needs it.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "keyless",
          title: "A lost remote stops being a problem",
          text: "A remote that falls out of a pocket keeps opening the garage for whoever finds it, and there is no way to cancel it. A permission on a phone is removed in a moment, with no motor to replace and no remotes to re-code.",
        },
        {
          icon: "users",
          title: "Access for the household and for tradespeople",
          text: "Everyone at home gets their own permission, and a tradesperson coming once can be given access that closes at the end of the day. Nothing left under the mat.",
        },
        {
          icon: "phone",
          title: "Your phone is already with you",
          text: "No remote to move between cars and nothing to hunt for when somebody else is driving. What opens the door is the one thing you never leave without.",
        },
      ],
      paragraph:
        "Гаражными воротами и въездом на частную парковку обычно управляют с помощью физических пультов, которые теряются, остаются у людей, которым доступ уже не нужен, а в некоторых ситуациях могут быть скопированы. WIFIGATE переводит управление в цифровой доступ с телефона: правами членов семьи, сотрудников и гостей легко управлять, а временный доступ можно предоставить, не передавая пульт или код. В итоге пользоваться воротами удобнее, приватнее и аккуратнее, с меньшей зависимостью от физических средств доступа.",
      bullets: [
        "Открытие гаражных ворот с телефона",
        "Меньше зависимости от физических пультов",
        "Ниже риск из-за потерянных, переданных или скопированных пультов",
        "Управление доступом для членов семьи, сотрудников и гостей",
        "Временный доступ без передачи пульта или кода",
        "Подходит для частных парковок, домов и квартир с отдельным входом",
        "Более локальный и приватный способ управления доступом",
        "Удобное и более безопасное управление каждый день",
      ],
      seoTitle: "Умное открытие гаражных ворот с телефона | WIFIGATE",
      seoDescription:
        "WIFIGATE открывает гаражные ворота и въезд на частную парковку с телефона: меньше зависимости от пультов, временные права доступа и удобное, приватное управление.",
      imageAlt: "Мужчина открывает ворота частного гаража с телефона у современного дома",
    },
    "private-homes": {
      label: "Частные дома",
      title: "Умный и безопасный доступ для частного дома",
      heroLead:
        "A fixed keypad code wears down, gets passed around and stays with people who no longer need it. Give each person their own permission, and a temporary one to anyone visiting once.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "shield",
          title: "A keypad gives your code away",
          text: "After enough years, four worn keys say exactly which digits make up the code. A permission on a phone leaves no marks on the wall.",
        },
        {
          icon: "clock",
          title: "Access for the delivery, not forever",
          text: "A code given to a courier, a technician or a guest is still with them a year later. A temporary permission closes itself the moment the visit is over.",
        },
        {
          icon: "roster",
          title: "A list instead of guesswork",
          text: "A shared code has no list of holders. In its place comes a list where every permission has a name, so it is clear at any moment who can get into the house.",
        },
      ],
      paragraph:
        "В частных домах кодовые панели, ключи и пульты со временем становятся слабым местом. На кнопках кодовой панели появляются потёртости и следы, пульты теряются или переходят из рук в руки, а код нередко сообщают курьерам, мастерам или гостям, и он остаётся у них даже тогда, когда уже не нужен. WIFIGATE позволяет управлять входом с телефона, делиться временным гостевым доступом, не раскрывая постоянный код, и легко отзывать права, без замены замков, кодов и пультов.",
      bullets: [
        "Меньше зависимости от кодовых панелей, ключей и пультов",
        "Временный доступ для курьеров, гостей и мастеров",
        "Лёгкий отзыв прав доступа прямо с телефона",
        "Ниже риск из-за общих кодов и переданных пультов",
        "Подходит для ворот, дверей, парковки и гаража частного дома",
        "Простое управление для семьи и постоянных пользователей",
        "Более удобный вход в дом каждый день",
        "Больше приватности и контроля над тем, кто может войти",
      ],
      seoTitle: "Умный доступ в частный дом без общего кода | WIFIGATE",
      seoDescription:
        "WIFIGATE помогает управлять доступом в частный дом с телефона: временные права для гостей и курьеров и меньше зависимости от кодовых панелей, ключей и пультов.",
      imageAlt: "Женщина открывает въездные ворота частного дома с телефона вместо кодовой панели",
    },
    "residential-buildings": {
      label: "Многоквартирные дома",
      title: "Умное управление доступом в многоквартирных домах",
      heroLead:
        "A fixed code that travels between couriers, guests and service people can end up in the wrong hands. Give each person a personal, time-limited entry permission and cut unauthorised entries and the risk of theft.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "roster",
          title: "Know who holds access, at any moment",
          text: "A shared code has no list of holders. There is no way to tell who has it, who passed it on or when. In its place comes a current list where every permission has a name, so the picture of who can enter the building is clear at any point in time.",
        },
        {
          icon: "invite",
          title: "Arrival instructions in one tap",
          text: "Address, floor, apartment, gate code and lobby code. You dictate that same sequence again to every guest, every courier and every tradesperson. With WIFIGATE all of it collapses into a single tap, and the visitor finds their own way to the door.",
        },
        {
          icon: "handsfree",
          title: "Hands-free entry",
          text: "Auto Open recognises that you have arrived and opens the gate or door for you. No searching for a key and no taking out your phone, even when your hands are full of shopping, a pushchair or children.",
        },
      ],
      paragraph:
        "В многоквартирных домах общий код от подъезда быстро расходится между жильцами, гостями, курьерами, подрядчиками и сервисными службами. Со временем уже сложно понять, у кого на самом деле есть доступ в дом и когда пора менять код или собирать пульты. WIFIGATE позволяет жильцам, ТСЖ и управляющей компании навести порядок в доступе: выдавать временные гостевые права, меньше зависеть от общего кода и лучше контролировать вход в дом, подъезд, ворота и паркинг.",
      bullets: [
        "Удобный доступ для жильцов через телефон",
        "Временные приглашения для гостей без раскрытия постоянного кода",
        "Управление правами жильцов, подрядчиков и сервисных служб",
        "Подходит для дверей подъезда, ворот и въезда на паркинг",
        "Меньше зависимости от кодовых панелей, ключей и пультов",
        "Больше прозрачности благодаря истории доступа",
        "Проще для ТСЖ и управляющей компании",
        "Более удобный вход для жильцов и гостей",
      ],
      seoTitle: "Контроль доступа в многоквартирных домах | WIFIGATE",
      seoDescription:
        "WIFIGATE, умное управление доступом в жилом доме: вход с телефона, временные права для гостей, меньше зависимости от общего кода и больше прозрачности.",
      imageAlt: "Жительница открывает вход в многоквартирный дом с телефона",
    },
    "office-buildings": {
      label: "Офисные здания",
      title: "Умный доступ для офисных зданий",
      heroLead:
        "Standing permissions for staff, temporary ones for visitors and suppliers. No queue at reception, no badges to issue and no keys to collect when somebody leaves.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "users",
          title: "Somebody joins, somebody leaves",
          text: "Onboarding and offboarding are one action on a list, not a round of issuing a badge, collecting a badge and changing a lock. The permission opens and closes on the dates you set.",
        },
        {
          icon: "invite",
          title: "The visitor arrives already holding the entry",
          text: "Instead of waiting at reception for somebody to come down, the visitor arrives with a permission sent to their phone, valid only for the time of the meeting.",
        },
        {
          icon: "history",
          title: "A record of entries for operations",
          text: "Every opening carries a name and a time, so you can check afterwards who entered a floor, a store room or the car park without reconstructing it from memory.",
        },
      ],
      paragraph:
        "Офисным зданиям нужно обеспечивать удобный вход сотрудникам, посетителям, подрядчикам и службам эксплуатации, не перегружая ресепшен и не управляя ключами и картами вручную. WIFIGATE позволяет выдавать постоянные права сотрудникам и временные, посетителям, управлять доступом с телефона и организовать вход так, как это принято в современной, аккуратной деловой среде.",
      bullets: [
        "Постоянные права для сотрудников и команд",
        "Временный доступ для посетителей, подрядчиков и курьеров",
        "Меньше нагрузки на ресепшен и службу эксплуатации",
        "Подходит для входных дверей, этажей, помещений и паркинга",
        "Упорядоченное управление пользователями и правами",
        "Меньше зависимости от ключей, пропусков и кодов",
        "Более современный и удобный имидж здания",
        "История доступа для контроля и прозрачности",
      ],
      seoTitle: "Контроль доступа в офисных зданиях | WIFIGATE",
      seoDescription:
        "WIFIGATE помогает офисным зданиям управлять входом сотрудников и посетителей с телефона: постоянные и временные права, современное управление доступом.",
      imageAlt: "Сотрудница открывает стеклянную дверь современного офиса с телефона",
    },
    "entry-doors-magnetic-locks": {
      label: "Входные двери и магнитные замки для бизнеса",
      title: "Умное открытие входных дверей и магнитных замков для бизнеса",
      heroLead:
        "Your business entrance opens from a phone, and permissions change without changing a code. It works with the electric or magnetic lock already fitted to the door.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "keyless",
          title: "One code for everyone stops being a solution",
          text: "A code that travels between staff, suppliers and customers is no longer really closing the door. A personal permission for each person removes the need to change the code every time somebody moves on.",
        },
        {
          icon: "clock",
          title: "Temporary access for a supplier or technician",
          text: "For the cleaner who comes in the evening, the technician who comes once and the courier who needs five minutes: a permission valid for exactly that window, which then closes itself.",
        },
        {
          icon: "phone",
          title: "No complex access control system",
          text: "No control cabinet, no management software and no card reader to mount. The existing lock stays where it is, and everything is managed from the app.",
        },
      ],
      paragraph:
        "Небольшие компании, клиники, студии, склады и офисы часто обходятся кодовой панелью, ключом или простым магнитным замком. Проблемы начинаются, когда код расходится между сотрудниками, подрядчиками и гостями или когда нужен временный доступ без ущерба для безопасности. WIFIGATE позволяет управлять входной дверью с телефона, делиться временными правами и снижать потребность в постоянных кодах, физических ключах и ручных согласованиях при каждом входе.",
      bullets: [
        "Подходит для входных дверей с электрическим или магнитным замком",
        "Открытие с телефона для сотрудников и руководителей",
        "Временный доступ для гостей, подрядчиков и сервисных специалистов",
        "Меньше потребности в кодовой панели и постоянном коде",
        "Подходит для небольших компаний, клиник, студий и офисов",
        "Более простое и безопасное управление правами",
        "Меньше физических ключей",
        "Удобный вариант для бизнеса, которому нужен современный вход без сложной системы",
      ],
      seoTitle: "Входные двери и магнитные замки для бизнеса | WIFIGATE",
      seoDescription:
        "WIFIGATE, умное открытие входных дверей и магнитных замков для бизнеса: управление правами с телефона, временный доступ, меньше зависимости от кодов и ключей.",
      imageAlt: "Клиентка открывает входную дверь небольшого бизнеса с телефона",
    },
    "sports-facilities": {
      label: "Спортивные объекты",
      title: "Умный контроль доступа для спортивных объектов",
      heroLead:
        "Members, coaches and guests enter on their own permission and within opening hours. No shared key, and no code going around a WhatsApp group.",
      // Each highlight stands alone: the hero lead states the problem and the
      // benefits grid lists the specifics. Nothing is repeated between them.
      highlights: [
        {
          icon: "calendar",
          title: "Access opens with the booking",
          text: "Whoever booked a court for a given hour gets a permission that opens then and closes at the end of it. Nobody has to wait at the gate to let them in.",
        },
        {
          icon: "users",
          title: "A member, a coach and a guest are not the same",
          text: "Each type of user gets their own permission: a standing member, a coach who comes on set days and a one-off guest. All on one list, with no key changing hands.",
        },
        {
          icon: "history",
          title: "Know who was on site and when",
          text: "When traffic changes through the day, a record of entries helps operations, settles questions about incidents, and confirms the site was locked at the end of the day.",
        },
      ],
      paragraph:
        "Спортивным объектам, падел-кортам, теннисным кортам, фитнес-клубам и тренировочным комплексам, нужно управлять доступом клиентов, тренеров, команд и гостей с учётом часов работы, бронирований и мероприятий. WIFIGATE позволяет выдавать временный или постоянный доступ с телефона, меньше зависеть от общего ключа или кода и делать вход удобнее для посетителей, особенно там, где поток людей меняется в течение дня.",
      bullets: [
        "Подходит для падел-кортов, теннисных кортов, фитнес-клубов и тренировочных комплексов",
        "Доступ по часам работы, бронированиям или правам",
        "Управление правами для клиентов, тренеров, сотрудников и гостей",
        "Меньше зависимости от общих ключей и кодов",
        "Быстрый и удобный вход с телефона",
        "Подходит для площадок с плавающим графиком работы",
        "Временные права для мероприятий, занятий и тренировок",
        "История доступа для контроля и работы объекта",
      ],
      seoTitle: "Контроль доступа: спортивные объекты и падел-корты | WIFIGATE",
      seoDescription:
        "WIFIGATE, умный контроль доступа для спортивных объектов, падел-кортов, фитнес-клубов и тренировочных комплексов: вход с телефона, временные и постоянные права.",
      imageAlt: "Игрок в падел открывает вход на освещённый спортивный корт с телефона",
    },
  },
};
