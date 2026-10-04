// scripts/niche-pages/cs.mjs
// Czech content for the homepage "where" section + the niche/use-case pages.
// Translated from the approved Hebrew source (he.mjs), with en.mjs as reference.

export default {
  home: {
    seoTitle: "WIFIGATE | Chytrá kontrola vstupu – brány, dveře, parkování",
    seoDescription:
      "WIFIGATE je chytrý systém kontroly vstupu: brány, dveře, parkoviště, rolety i garáž otevřete z telefonu. Bezpečně, lokálně a pohodlně, bez měsíčních poplatků.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, chytrá kontrola vstupu, otevírání brány z telefonu, elektrická brána, ovládání garážových vrat, parkovací závora, řízení přístupu, bez měsíčních poplatků",
  },
  where: {
    title: "Kde všude se WIFIGATE hodí?",
    subtitle:
      "WIFIGATE se hodí do široké škály prostředí a nabízí chytré, bezpečné a pohodlné řešení správy přístupu – od rodinných domů až po komerční a firemní prostory.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotely, Airbnb a apartmány pro hosty",
      title: "Chytrý přístup pro hotely, Airbnb a apartmány pro hosty",
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
        "WIFIGATE umožňuje hostům získat pohodlný a bezpečný digitální přístup přímo do telefonu – bez fyzických klíčů, bez karet a bez zbytečného domlouvání s recepcí nebo majitelem. Díky WIFIGATE API lze rezervační proces propojit s přístupovým systémem, takže jakmile je rezervace potvrzena, host může automaticky obdržet časově omezený přístup. Přístup začíná v okamžiku check-inu, automaticky končí při check-outu a výrazně snižuje potřebu předávat klíče, sdílet kódy nebo řešit každého hosta ručně.",
      bullets: [
        "Automatické vytvoření přístupu pro hosta po potvrzení rezervace",
        "Plná automatizace díky WIFIGATE API",
        "Dočasný přístup podle termínu a času pobytu",
        "Méně ručního check-inu, klíčů, karet i kódů",
        "Správa oprávnění pro personál, úklid, údržbu i dodavatele",
        "Plynulejší a příjemnější příjezd pro hosty",
        "Přístup automaticky končí v čase check-outu",
        "Historie přístupů pro přehled a kontrolu",
      ],
      seoTitle: "Kontrola vstupu pro hotely, Airbnb a apartmány | WIFIGATE API",
      seoDescription:
        "WIFIGATE dává hotelům, Airbnb a apartmánům chytrý digitální přístup – automatická oprávnění hostů přes WIFIGATE API, dočasný přístup podle rezervace, méně klíčů a ručního check-inu.",
      imageAlt: "Hosté otevírají dveře hotelového pokoje telefonem na moderní chodbě",
    },
    "roller-shutters": {
      label: "Bezpečnostní rolety pro firmy a obchody",
      title: "Chytré a bezpečnější ovládání rolet pro firmy a obchody",
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
        "Bezpečnostní rolety firem a obchodů se často ovládají dálkovými ovladači, klíči, venkovní skříňkou na klíč nebo spínači umístěnými vně provozovny. Taková řešení se mohou ztratit, zůstat u bývalých zaměstnanců, nechat zkopírovat nebo se proměnit v nechráněný přístupový bod. Otevírání či zavírání klíčem navíc znamená stát přímo u ovládacího místa, držet klíč v ruce a někdy ztratit pohodlný výhled na prostor rolety. WIFIGATE přenáší ovládání do aplikace a umisťuje řízení přístupu na chráněnější vnitřní stranu – otevírat a zavírat tak můžete pohodlněji, spravovat oprávnění zaměstnanců a dodavatelů a snížit závislost na klíčích, ovladačích a nechráněných přístupových bodech.",
      bullets: [
        "Otevírání a zavírání z telefonu bez závislosti na ovladačích",
        "Menší závislost na klíčích, které se dají zkopírovat nebo ztratit",
        "Méně nechráněných přístupových bodů vně provozovny",
        "Pohodlnější ovládání s lepším výhledem na prostor rolety",
        "Správa oprávnění pro zaměstnance, vedoucí i dodavatele",
        "Možnost dočasného přístupu podle času nebo potřeby",
        "Vhodné pro obchody, sklady, servisní vchody i firmy",
        "Přehlednější a lépe chráněné řešení pro každodenní provoz",
      ],
      seoTitle: "Chytré ovládání bezpečnostních rolet pro firmy | WIFIGATE",
      seoDescription:
        "WIFIGATE umožňuje ovládat bezpečnostní rolety obchodu z telefonu – správa oprávnění, menší závislost na klíčích a ovladačích, méně přístupových bodů vně provozovny.",
      imageAlt: "Majitel obchodu otevírá bezpečnostní roletu telefonem",
    },
    "electric-gates": {
      label: "Elektrické brány a parkovací závory",
      title: "Chytré otevírání elektrických bran a parkovacích závor",
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
        "Elektrické brány a parkovací závory slouží obyvatelům, zaměstnancům, hostům i dodavatelům – jenže správa ovladačů, kódů a telefonátů s prosbou o otevření brány se rychle stává přítěží. WIFIGATE umožňuje otevírat bránu z telefonu, sdílet trvalý nebo dočasný přístup, využívat automatické otevírání pro stálé uživatele a podle potřeby nastavovat plánované události. Systém je navržen pro lokální, bezpečný a soukromý provoz bez měsíčního předplatného či pravidelných plateb a vedle ovládání z aplikace můžete dál používat i stávající ovladače.",
      bullets: [
        "Otevření elektrické brány nebo parkovací závory z telefonu",
        "Bez měsíčního předplatného a bez pravidelných plateb",
        "Sdílení dočasného přístupu s hosty, dodavateli a zaměstnanci",
        "Auto Open pro stálé uživatele při každodenním vjezdu",
        "Plánované události pro otevírání podle dnů a hodin",
        "Ovládání z aplikace i stávajícími ovladači",
        "Méně rozdávání fyzických ovladačů",
        "Historie otevření pro kontrolu a přehled",
      ],
      seoTitle: "Elektrické brány a parkovací závory bez předplatného | WIFIGATE",
      seoDescription:
        "WIFIGATE otevírá elektrické brány a parkovací závory z telefonu – s funkcí Auto Open, plánovanými událostmi, podporou stávajících ovladačů a bez předplatného.",
      imageAlt: "Řidič otevírá parkovací závoru a elektrickou bránu telefonem",
    },
    "garage-doors": {
      label: "Garážová vrata a soukromé parkování",
      title: "Chytré otevírání garážových vrat a soukromého parkování",
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
        "Garážová vrata a vjezdy na soukromé parkování se obvykle ovládají fyzickými ovladači, které se mohou ztratit, zůstat u lidí, kteří už přístup nepotřebují, nebo být v některých situacích zkopírovány. WIFIGATE přenáší ovládání do digitálního přístupu z telefonu: umožňuje spravovat oprávnění pro rodinu, zaměstnance nebo hosty a sdílet dočasný přístup, aniž byste předávali ovladač či kód. Výsledkem je pohodlnější, soukromější a přehlednější používání s menší závislostí na fyzických prostředcích.",
      bullets: [
        "Otevření garážových vrat z telefonu",
        "Menší závislost na fyzických ovladačích",
        "Nižší riziko ztracených, předaných nebo zkopírovaných ovladačů",
        "Správa přístupu pro rodinu, zaměstnance a hosty",
        "Dočasný přístup bez předávání ovladače nebo kódu",
        "Vhodné pro soukromá parkování, rodinné domy i byty s předzahrádkou",
        "Lokálnější a soukromější způsob správy přístupu",
        "Pohodlnější a bezpečnější každodenní ovládání",
      ],
      seoTitle: "Chytré otevírání garážových vrat z telefonu | WIFIGATE",
      seoDescription:
        "WIFIGATE otevírá garážová vrata a vjezdy na soukromé parkování z telefonu – s menší závislostí na ovladačích, dočasnými oprávněními a soukromější správou přístupu.",
      imageAlt: "Muž otevírá telefonem garážová vrata u moderního domu",
    },
    "private-homes": {
      label: "Rodinné domy",
      title: "Chytrý a bezpečný přístup pro rodinné domy",
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
        "V rodinných domech se kódové klávesnice, klíče a ovladače mohou stát slabým místem. Na tlačítkách klávesnice se časem objeví opotřebení nebo stopy, ovladače se ztrácejí či putují mezi lidmi a kód se občas prozradí kurýrům, řemeslníkům nebo hostům – a zůstane jim i dlouho poté, co už ho nepotřebují. WIFIGATE umožňuje spravovat vstup z telefonu, sdílet dočasný přístup pro hosty bez prozrazení trvalého kódu a snadno rušit oprávnění bez výměny zámků, kódů nebo ovladačů.",
      bullets: [
        "Menší závislost na kódové klávesnici, klíčích a ovladačích",
        "Dočasný přístup pro kurýry, hosty a řemeslníky",
        "Snadné zrušení oprávnění přímo z telefonu",
        "Nižší riziko sdílených kódů či předaných ovladačů",
        "Vhodné pro brány, dveře, parkování i garáže u domu",
        "Jednoduchá správa pro rodinu a stálé uživatele",
        "Pohodlnější každodenní vstup domů",
        "Lepší soukromí a přehled o tom, kdo může vstoupit",
      ],
      seoTitle: "Chytrý přístup pro rodinné domy bez sdíleného kódu | WIFIGATE",
      seoDescription:
        "WIFIGATE umožňuje v rodinných domech spravovat přístup z telefonu, sdílet dočasná oprávnění pro hosty a kurýry a omezit závislost na kódech, klíčích a ovladačích.",
      imageAlt: "Žena otevírá vstupní bránu rodinného domu telefonem místo zadávání kódu",
    },
    "residential-buildings": {
      label: "Bytové domy",
      title: "Chytrá správa přístupu pro bytové domy",
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
        "V bytových domech se sdílený vstupní kód rychle šíří mezi obyvateli, hosty, kurýry, dodavateli a servisními pracovníky. Časem je těžké zjistit, kdo má do domu skutečně přístup a kdy je čas kód změnit nebo vybrat ovladače zpět. WIFIGATE umožňuje obyvatelům a výboru SVJ spravovat přístup přehledněji, udělovat dočasná oprávnění hostům, omezit závislost na sdíleném kódu a udržet si lepší kontrolu nad vstupem do domu, vstupní haly, k bráně nebo na parkoviště.",
      bullets: [
        "Pohodlný přístup pro obyvatele přes telefon",
        "Dočasné pozvánky pro hosty bez prozrazení trvalého kódu",
        "Správa oprávnění pro obyvatele, dodavatele a servisní pracovníky",
        "Vhodné pro vchodové dveře, brány i vjezdy na parkoviště",
        "Menší závislost na klávesnicích, klíčích a ovladačích",
        "Lepší přehled díky historii přístupů",
        "Jednodušší správa pro výbor SVJ nebo správcovskou firmu",
        "Příjemnější vstup pro obyvatele i jejich hosty",
      ],
      seoTitle: "Kontrola vstupu pro bytové domy | WIFIGATE",
      seoDescription:
        "WIFIGATE přináší bytovým domům chytrou správu přístupu – vstup přes telefon, dočasná oprávnění pro hosty, menší závislost na sdílených kódech a lepší přehled.",
      imageAlt: "Obyvatelka otevírá vchod bytového domu telefonem",
    },
    "office-buildings": {
      label: "Kancelářské budovy",
      title: "Chytrý přístup pro kancelářské budovy",
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
        "Kancelářské budovy potřebují zajistit pohodlný vstup zaměstnancům, návštěvám, dodavatelům i provozním týmům – bez zatěžování recepce a bez ručního hlídání klíčů či karet. WIFIGATE umožňuje udělovat trvalá oprávnění zaměstnancům a dočasná oprávnění návštěvám, řídit přístup z telefonu a spravovat vstupy způsobem, který odpovídá modernímu, čistému a dobře organizovanému firemnímu prostředí.",
      bullets: [
        "Trvalá oprávnění pro zaměstnance a týmy",
        "Dočasný přístup pro návštěvy, dodavatele a kurýry",
        "Menší zátěž pro recepci a provozní tým",
        "Vhodné pro vstupní dveře, patra, místnosti i parkoviště",
        "Přehledná správa uživatelů a oprávnění",
        "Menší závislost na klíčích, přístupových kartách a kódech",
        "Modernější a příjemnější image budovy",
        "Historie přístupů pro kontrolu a přehled",
      ],
      seoTitle: "Kontrola vstupu pro kancelářské budovy | WIFIGATE",
      seoDescription:
        "WIFIGATE umožňuje kancelářským budovám řídit vstup zaměstnanců, návštěv a dodavatelů z telefonu – s trvalými i dočasnými oprávněními a moderní správou přístupu.",
      imageAlt: "Zaměstnankyně otevírá skleněné dveře v moderní kanceláři telefonem",
    },
    "entry-doors-magnetic-locks": {
      label: "Vchodové dveře a magnetické zámky pro firmy",
      title: "Chytré otevírání vchodových dveří a magnetických zámků pro firmy",
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
        "Malé firmy, kliniky, studia, sklady i kanceláře často spoléhají na kódovou klávesnici, klíč nebo jednoduchý magnetický zámek. Problém začíná, když se kód šíří mezi zaměstnanci, dodavateli a hosty, nebo když je potřeba udělit dočasný přístup, aniž by utrpěla bezpečnost. WIFIGATE umožňuje spravovat vstupní dveře z telefonu, sdílet dočasná oprávnění a omezit potřebu trvalých kódů, fyzických klíčů nebo ručního domlouvání při každém vstupu.",
      bullets: [
        "Vhodné pro vchodové dveře s elektrickým nebo magnetickým zámkem",
        "Otevírání z telefonu pro zaměstnance a vedení",
        "Dočasný přístup pro hosty, dodavatele a servisní pracovníky",
        "Méně kódových klávesnic a trvalých kódů",
        "Vhodné pro malé firmy, kliniky, studia i kanceláře",
        "Jednodušší a bezpečnější správa oprávnění",
        "Menší potřeba fyzických klíčů",
        "Pohodlná volba pro firmy, které chtějí moderní vstup bez složitého systému",
      ],
      seoTitle: "Vchodové dveře a magnetické zámky pro firmy | WIFIGATE",
      seoDescription:
        "WIFIGATE přináší chytré otevírání vchodových dveří a magnetických zámků ve firmách – správa oprávnění z telefonu, dočasný přístup a méně kódů i klíčů.",
      imageAlt: "Zákaznice otevírá telefonem vchodové dveře malé firmy",
    },
    "sports-facilities": {
      label: "Sportovní areály",
      title: "Chytrá kontrola vstupu pro sportovní areály",
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
        "Sportovní areály, padelové kurty, tenisové kurty, posilovny a tréninková centra potřebují řídit přístup členů, trenérů, týmů i hostů podle provozní doby, rezervací a akcí. WIFIGATE umožňuje udělovat dočasný nebo trvalý přístup z telefonu, omezit závislost na sdíleném klíči či kódu a zlepšit zážitek ze vstupu – zvlášť v areálech, kde se provoz během dne mění.",
      bullets: [
        "Vhodné pro padelové a tenisové kurty, posilovny i tréninková centra",
        "Přístup podle provozní doby, rezervací nebo oprávnění",
        "Správa členů, trenérů, zaměstnanců a hostů",
        "Menší závislost na sdílených klíčích a kódech",
        "Rychlý a pohodlný vstup z telefonu",
        "Vhodné pro areály s proměnlivou provozní dobou",
        "Dočasná oprávnění pro akce, lekce nebo tréninky",
        "Historie přístupů pro kontrolu a provoz",
      ],
      seoTitle: "Kontrola vstupu pro sportovní areály a padelové kurty | WIFIGATE",
      seoDescription:
        "WIFIGATE přináší chytrou kontrolu vstupu do sportovních areálů, na padelové kurty, do posiloven a tréninkových center – vstup z telefonu, dočasná i trvalá oprávnění.",
      imageAlt: "Hráčka padelu otevírá telefonem vstup na osvětlený sportovní kurt",
    },
  },
};
