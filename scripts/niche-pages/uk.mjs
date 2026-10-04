// scripts/niche-pages/uk.mjs
// Ukrainian content for the homepage "where" section + the niche/use-case pages.
// Translated from the Hebrew source (he.mjs), with en.mjs as the format reference.

export default {
  home: {
    seoTitle: "WIFIGATE | Розумний доступ до воріт, дверей і паркінгу",
    seoDescription:
      "WIFIGATE, розумний контроль доступу: відчиняйте ворота, двері, ролети, гаражі та паркінг з телефона. Безпечно, локально та зручно, без щомісячної підписки.",
    keywords:
      "WIFIGATE, WiFi Gate, розумний контроль доступу, відкрити ворота з телефона, автоматичні ворота, контроль доступу для воріт, керування шлагбаумом, розумний доступ без абонплати",
  },
  where: {
    title: "Де можна використовувати WIFIGATE?",
    subtitle:
      "WIFIGATE підходить для найрізноманітніших середовищ, від приватних будинків до комерційних об'єктів і організацій, та забезпечує розумне, безпечне і зручне керування доступом.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Готелі, Airbnb та гостьові апартаменти",
      title: "Розумний доступ для готелів, Airbnb та гостьових апартаментів",
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
        "WIFIGATE дає гостям зручний і безпечний цифровий доступ просто на телефон, без фізичних ключів, карток і зайвих узгоджень із рецепцією чи власником помешкання. Завдяки WIFIGATE API процес бронювання можна під'єднати до системи доступу: щойно бронювання підтверджено, гість автоматично отримує гостьовий доступ, обмежений у часі. Доступ починається з моменту заїзду, автоматично завершується під час виїзду й суттєво зменшує потребу передавати ключі, повідомляти коди чи вручну опрацьовувати кожного гостя.",
      bullets: [
        "Автоматичне створення гостьового доступу після підтвердження бронювання",
        "Повна автоматизація через WIFIGATE API",
        "Тимчасовий доступ відповідно до дат і годин проживання",
        "Менше ручного заселення, ключів, карток і кодів",
        "Керування правами доступу для персоналу, прибиральників, техніків і підрядників",
        "Простіший і приємніший досвід прибуття для гостей",
        "Автоматичне завершення доступу в момент виїзду",
        "Історія доступу для прозорості та контролю",
      ],
      seoTitle: "Контроль доступу для готелів, Airbnb та апартаментів | WIFIGATE API",
      seoDescription:
        "WIFIGATE, розумний цифровий доступ для готелів, Airbnb та апартаментів: гостьові права через WIFIGATE API, тимчасовий доступ за бронюванням, менше ключів.",
      imageAlt: "Гості відчиняють двері готельного номера телефоном у сучасному коридорі",
    },
    "roller-shutters": {
      label: "Захисні ролети для бізнесу та магазинів",
      title: "Розумне та безпечніше керування ролетами для бізнесу й магазинів",
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
        "Захисними ролетами в магазинах і на комерційних об'єктах часто керують за допомогою пультів, ключів, зовнішнього ключового бокса чи вимикачів, розташованих зовні. Такі рішення губляться, залишаються в колишніх працівників, їх можуть скопіювати, і вони перетворюються на відкриту точку доступу. До того ж, щоб відчинити чи зачинити ролету ключем, доводиться стояти впритул до механізму, тримати ключ у руці й часом втрачати зручний огляд зони ролети. WIFIGATE переносить керування в застосунок і розміщує контроль доступу з внутрішнього, захищенішого боку: відчиняти й зачиняти стає зручніше, правами працівників і підрядників легко керувати, а залежність від ключів, пультів і відкритих точок доступу зменшується.",
      bullets: [
        "Відчиняйте й зачиняйте з телефона, без прив'язки до пультів",
        "Менше залежності від ключів, які можна скопіювати чи загубити",
        "Менше відкритих точок доступу зовні будівлі",
        "Зручніше керування з кращим оглядом зони ролети",
        "Керування правами для працівників, керівників і підрядників",
        "Тимчасовий доступ за часом чи потребою",
        "Підходить для магазинів, складів, службових входів і бізнесів",
        "Охайніше та захищеніше внутрішнє рішення для щоденної роботи",
      ],
      seoTitle: "Розумне керування ролетами для бізнесу й магазинів | WIFIGATE",
      seoDescription:
        "WIFIGATE дає бізнесу й магазинам керування захисними ролетами з телефона: права доступу, менше залежності від ключів і пультів, менше відкритих точок зовні.",
      imageAlt: "Власник бізнесу відчиняє захисну ролету магазину за допомогою телефона",
    },
    "electric-gates": {
      label: "Автоматичні ворота та шлагбауми",
      title: "Розумне відчинення автоматичних воріт і шлагбаумів",
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
        "Автоматичними воротами та шлагбаумами користуються мешканці, працівники, гості й підрядники, але керування пультами, кодами та дзвінками з проханням відчинити швидко перетворюється на клопіт. WIFIGATE дозволяє відчиняти ворота з телефона, ділитися постійним чи тимчасовим доступом, вмикати автоматичне відчинення для постійних користувачів і налаштовувати заплановані події за потреби. Система розрахована на локальну, безпечну та приватну роботу, без щомісячної підписки й регулярних платежів, а наявні пульти можна й далі використовувати поряд із керуванням із застосунку.",
      bullets: [
        "Відчинення автоматичних воріт чи шлагбаума з телефона",
        "Без щомісячної підписки та регулярних платежів",
        "Тимчасовий доступ для гостей, підрядників і працівників",
        "Auto Open для постійних користувачів під час щоденного в'їзду",
        "Заплановані події для відчинення за днями та годинами",
        "Керування із застосунку або наявними пультами",
        "Менше потреби роздавати фізичні пульти",
        "Історія відчинень для контролю та прозорості",
      ],
      seoTitle: "Доступ до автоматичних воріт і шлагбаумів без підписки | WIFIGATE",
      seoDescription:
        "WIFIGATE відчиняє автоматичні ворота та шлагбауми з телефона: Auto Open, заплановані події, підтримка наявних пультів, керування правами, без щомісячної підписки.",
      imageAlt: "Водій відчиняє шлагбаум та автоматичні ворота за допомогою телефона",
    },
    "garage-doors": {
      label: "Гаражні ворота та приватний паркінг",
      title: "Розумне відчинення гаражних воріт і приватного паркінгу",
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
        "Гаражними воротами та в'їздами на приватний паркінг зазвичай керують фізичними пультами, які можуть загубитися, залишитися в людей, котрим доступ уже не потрібен, або в певних ситуаціях бути скопійованими. WIFIGATE переводить керування в цифровий доступ із телефона: можна керувати правами для членів родини, працівників чи гостей і ділитися тимчасовим доступом, не передаючи пульт чи код. У результаті, зручніший, приватніший і впорядкованіший досвід із меншою залежністю від фізичних засобів доступу.",
      bullets: [
        "Відчинення гаражних воріт із телефона",
        "Менше залежності від фізичних пультів",
        "Менший ризик через загублені, передані чи скопійовані пульти",
        "Керування доступом для родини, працівників і гостей",
        "Тимчасовий доступ без передавання пульта чи коду",
        "Підходить для приватних паркінгів, будинків і квартир із власним подвір'ям",
        "Локальніший і приватніший спосіб керувати доступом",
        "Зручніший і безпечніший щоденний контроль",
      ],
      seoTitle: "Гаражні ворота та приватний паркінг із телефона | WIFIGATE",
      seoDescription:
        "WIFIGATE відчиняє гаражні ворота та в'їзди на приватний паркінг із телефона: менше залежності від фізичних пультів, тимчасові права доступу і зручніше керування.",
      imageAlt: "Чоловік відчиняє ворота приватного гаража телефоном біля сучасного будинку",
    },
    "private-homes": {
      label: "Приватні будинки",
      title: "Розумний і безпечний доступ для приватних будинків",
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
        "У приватних будинках кодові панелі, ключі та пульти можуть стати слабким місцем. Із часом на кнопках панелі з'являються потертості й сліди, пульти губляться чи переходять з рук у руки, а код нерідко повідомляють кур'єрам, майстрам або гостям, і він залишається в них ще довго після того, як потреба зникла. WIFIGATE дозволяє керувати входом із телефона, ділитися тимчасовим гостьовим доступом, не розкриваючи постійного коду, і легко скасовувати права без заміни замків, кодів чи пультів.",
      bullets: [
        "Менше залежності від кодової панелі, ключів і пультів",
        "Тимчасовий доступ для кур'єрів, гостей і майстрів",
        "Легке скасування прав доступу з телефона",
        "Менший ризик через передані коди чи пульти",
        "Підходить для воріт, дверей, паркінгу та гаражів приватного будинку",
        "Просте керування для родини та постійних користувачів",
        "Зручніший щоденний вхід",
        "Більше приватності й контролю над тим, хто може увійти",
      ],
      seoTitle: "Розумний доступ до приватного будинку без спільного коду | WIFIGATE",
      seoDescription:
        "WIFIGATE допомагає приватним будинкам керувати доступом із телефона: тимчасові права для гостей і кур'єрів, менше залежності від кодових панелей, ключів і пультів.",
      imageAlt: "Жінка відчиняє в'їзні ворота приватного будинку телефоном замість кодової панелі",
    },
    "residential-buildings": {
      label: "Житлові будинки",
      title: "Розумне керування доступом у житлових будинках",
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
        "У житлових будинках спільний код від входу швидко розходиться між мешканцями, гостями, кур'єрами, постачальниками та сервісними службами. Згодом стає важко зрозуміти, хто насправді має доступ до будинку й коли час змінювати код чи збирати пульти. WIFIGATE допомагає мешканцям та ОСББ керувати доступом упорядкованіше: надавати тимчасові гостьові права, зменшити залежність від спільного коду та краще контролювати вхід до будинку, вестибюля, воріт чи паркінгу.",
      bullets: [
        "Зручний доступ для мешканців через телефон",
        "Тимчасові запрошення для гостей без розкриття постійного коду",
        "Керування правами для мешканців, постачальників і сервісних служб",
        "Підходить для дверей вестибюля, воріт і в'їздів на паркінг",
        "Менше залежності від кодових панелей, ключів і пультів",
        "Більше прозорості завдяки історії доступу",
        "Простіше керування для ОСББ чи керуючої компанії",
        "Зручніший вхід для мешканців і гостей",
      ],
      seoTitle: "Контроль доступу для житлових будинків | WIFIGATE",
      seoDescription:
        "WIFIGATE, розумне керування доступом у житлових будинках: вхід із телефона, тимчасові гостьові права, менше залежності від спільних кодів і більше прозорості.",
      imageAlt: "Мешканка відчиняє вхід до житлового будинку за допомогою телефона",
    },
    "office-buildings": {
      label: "Офісні будівлі",
      title: "Розумний доступ для офісних будівель",
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
        "Офісні будівлі мають забезпечувати зручний вхід працівникам, відвідувачам, підрядникам і службам експлуатації, без перевантаження рецепції та без ручного обліку ключів чи карток. WIFIGATE дозволяє надавати постійні права працівникам і тимчасові, відвідувачам, керувати доступом із телефона й організовувати вхід так, як пасує сучасному, охайному та впорядкованому бізнес-середовищу.",
      bullets: [
        "Постійні права доступу для працівників і команд",
        "Тимчасовий доступ для відвідувачів, підрядників і кур'єрів",
        "Менше навантаження на рецепцію та службу експлуатації",
        "Підходить для вхідних дверей, поверхів, кімнат і паркінгу",
        "Упорядковане керування користувачами та правами",
        "Менше залежності від ключів, перепусток і кодів",
        "Сучасніший і зручніший імідж будівлі",
        "Історія доступу для контролю та прозорості",
      ],
      seoTitle: "Контроль доступу для офісних будівель | WIFIGATE",
      seoDescription:
        "WIFIGATE дозволяє офісним будівлям керувати входом працівників, відвідувачів і підрядників із телефона, тимчасові та постійні права й сучасне керування доступом.",
      imageAlt: "Працівниця відчиняє скляні двері в сучасному офісі за допомогою телефона",
    },
    "entry-doors-magnetic-locks": {
      label: "Вхідні двері та електромагнітні замки для бізнесу",
      title: "Розумне відчинення вхідних дверей та електромагнітних замків для бізнесу",
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
        "Малий бізнес, клініки, студії, склади й офіси часто покладаються на кодову панель, ключ або простий електромагнітний замок. Проблеми починаються, коли код розходиться між працівниками, підрядниками та гостями або коли потрібен тимчасовий доступ без послаблення безпеки. WIFIGATE дозволяє керувати вхідними дверима з телефона, ділитися тимчасовими правами й зменшити потребу в постійних кодах, фізичних ключах чи ручному узгодженні кожного входу.",
      bullets: [
        "Підходить для вхідних дверей з електричним чи електромагнітним замком",
        "Відчинення з телефона для працівників і керівників",
        "Тимчасовий доступ для гостей, підрядників і сервісних служб",
        "Менше потреби в кодовій панелі чи постійному коді",
        "Підходить для малого бізнесу, клінік, студій та офісів",
        "Простіше та безпечніше керування правами доступу",
        "Менше потреби у фізичних ключах",
        "Зручний варіант для бізнесу, якому потрібен сучасний вхід без складної системи",
      ],
      seoTitle: "Вхідні двері та електромагнітні замки для бізнесу | WIFIGATE",
      seoDescription:
        "WIFIGATE, відчинення вхідних дверей та електромагнітних замків для бізнесу з телефона: тимчасовий доступ, керування правами, менше кодів і ключів.",
      imageAlt: "Клієнтка відчиняє вхідні двері невеликого бізнесу за допомогою телефона",
    },
    "sports-facilities": {
      label: "Спортивні об'єкти",
      title: "Розумний контроль доступу для спортивних об'єктів",
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
        "Спортивні об'єкти, падел-корти, тенісні корти, спортзали й тренувальні комплекси, мають керувати доступом абонентів, тренерів, команд і гостей відповідно до годин роботи, бронювань та подій. WIFIGATE дозволяє надавати тимчасовий чи постійний доступ із телефона, зменшити залежність від спільного ключа чи коду й покращити досвід входу для користувачів, особливо на об'єктах, де потік людей змінюється протягом дня.",
      bullets: [
        "Підходить для падел-кортів, тенісних кортів, спортзалів і тренувальних комплексів",
        "Доступ за годинами роботи, бронюваннями чи правами",
        "Керування абонентами, тренерами, працівниками та гостями",
        "Менше залежності від спільних ключів і кодів",
        "Швидкий і зручний вхід із телефона",
        "Підходить для об'єктів зі змінним графіком роботи",
        "Тимчасові права для подій, занять чи тренувань",
        "Історія доступу для контролю та операційної роботи",
      ],
      seoTitle: "Контроль доступу для спортивних об'єктів і падел-кортів | WIFIGATE",
      seoDescription:
        "WIFIGATE, розумний контроль доступу для спортивних об'єктів, падел-кортів, спортзалів і тренувальних комплексів: вхід із телефона, тимчасові чи постійні права.",
      imageAlt: "Гравчиня в падел відчиняє вхід на освітлений корт за допомогою телефона",
    },
  },
};
