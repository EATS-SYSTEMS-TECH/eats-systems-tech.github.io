// scripts/niche-pages/sv.mjs
// Swedish content for the homepage "where" section + the niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | Smart åtkomstkontroll för grindar, dörrar och parkering",
    seoDescription:
      "WIFIGATE (WiFi Gate) är smart åtkomstkontroll för grindar, byggnader, parkeringsinfarter och privata hem. Säker, privat, krypterad och utan månadsavgifter.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, smart åtkomstkontroll, grindkontroll, öppna grind med mobilen, dörråtkomst, parkeringstillträde, inga månadsavgifter",
  },
  where: {
    title: "Var kan WIFIGATE användas?",
    subtitle:
      "WIFIGATE passar i många olika miljöer och erbjuder en smart, säker och smidig lösning för åtkomsthantering, från privata hem till kommersiella och organisatoriska miljöer.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotell, Airbnb och gästlägenheter",
      title: "Smart åtkomst för hotell, Airbnb och gästlägenheter",
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
        "WIFIGATE gör det möjligt för gäster att få bekväm och säker digital åtkomst direkt i mobilen, utan fysiska nycklar, utan kort och utan onödig koordinering med receptionen eller fastighetsägaren. Med WIFIGATE API kan bokningsflödet kopplas till åtkomstsystemet, så att gästen automatiskt får tidsbegränsad gäståtkomst så fort en bokning bekräftas. Åtkomsten startar vid incheckning, avslutas automatiskt vid utcheckning och minskar behovet av att lämna över nycklar, dela koder eller hantera varje gäst manuellt.",
      bullets: [
        "Automatisk gäståtkomst skapas när en bokning bekräftas",
        "Full automatisering med stöd för WIFIGATE API",
        "Tillfällig åtkomst anpassad till vistelsens datum och tider",
        "Mindre behov av manuell incheckning, nycklar, kort eller koder",
        "Behörighetshantering för personal, städning, underhåll och leverantörer",
        "En smidigare och mer bekväm ankomstupplevelse för gäster",
        "Åtkomsten avslutas automatiskt vid utcheckning",
        "Åtkomsthistorik för transparens och kontroll",
      ],
      seoTitle: "Åtkomstkontroll för hotell, Airbnb och gästlägenheter | WIFIGATE API",
      seoDescription:
        "WIFIGATE ger smart digital åtkomst till hotell, Airbnb och gästlägenheter, inklusive automatiserade gästbehörigheter via WIFIGATE API, bokningsbaserad tillfällig åtkomst, färre nycklar och mindre manuell incheckning.",
      imageAlt: "Gäster öppnar en hotellrumsdörr med mobilen i en modern korridor",
    },
    "roller-shutters": {
      label: "Rulljalusier för företag och butiker",
      title: "Smart och säkrare styrning av rulljalusier för företag och butiker",
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
        "Rulljalusier i butiker och företag styrs ofta med fjärrkontroller, nycklar, en extern nyckelbox eller strömbrytare placerade utanför verksamheten. Sådana lösningar kan tappas bort, bli kvar hos tidigare anställda, kopieras eller bli en exponerad åtkomstpunkt. WIFIGATE flyttar styrningen in i appen och placerar åtkomstkontrollen på den mer skyddade insidan, så att du kan öppna och stänga mer bekvämt, hantera behörigheter för anställda och leverantörer och minska beroendet av nycklar, fjärrkontroller och utsatta åtkomstpunkter.",
      bullets: [
        "Öppna och stäng från mobilen utan att vara beroende av fjärrkontroller",
        "Mindre beroende av nycklar som kan kopieras eller tappas bort",
        "Färre exponerade åtkomstpunkter utanför verksamheten",
        "Bekvämare styrning med bättre överblick över jalusiet",
        "Behörighetshantering för anställda, chefer och leverantörer",
        "Möjlighet till tillfällig åtkomst efter tid eller behov",
        "Lämplig för butiker, lager, serviceingångar och företag",
        "En mer skyddad och organiserad lösning för daglig drift",
      ],
      seoTitle: "Smart styrning av rulljalusier för företag och butiker | WIFIGATE",
      seoDescription:
        "WIFIGATE ger företag och butiker smart mobilstyrning av rulljalusier, med behörighetshantering, mindre beroende av nycklar och fjärrkontroller samt färre exponerade åtkomstpunkter.",
      imageAlt: "Butiksägare öppnar en butikslucka med mobilen",
    },
    "electric-gates": {
      label: "Elektriska grindar och parkeringsbommar",
      title: "Smart öppning för elektriska grindar och parkeringsbommar",
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
        "Elektriska grindar och parkeringsbommar används av boende, anställda, gäster och leverantörer, men hanteringen av fjärrkontroller, koder och telefonsamtal för öppning blir snabbt omständig. WIFIGATE gör det möjligt att öppna grinden från mobilen, dela permanent eller tillfällig åtkomst, använda Auto Open för återkommande användare och skapa schemalagda öppningar vid behov. Systemet är utformat för lokal, säker och privat drift utan månadsabonnemang, och befintliga fjärrkontroller kan fortsätta användas parallellt med appstyrning.",
      bullets: [
        "Öppna elektrisk grind eller parkeringsbom från mobilen",
        "Inget månadsabonnemang och inga återkommande avgifter",
        "Dela tillfällig åtkomst med gäster, leverantörer och medarbetare",
        "Auto Open för återkommande användare i den dagliga inpasseringen",
        "Schemalagda öppningar efter dagar och tider",
        "Styr via appen eller med befintliga fjärrkontroller",
        "Mindre behov av att dela ut fysiska fjärrkontroller",
        "Öppningshistorik för kontroll och transparens",
      ],
      seoTitle: "Åtkomstkontroll för elektriska grindar och parkeringsbommar utan abonnemang | WIFIGATE",
      seoDescription:
        "WIFIGATE öppnar elektriska grindar och parkeringsbommar från mobilen, med Auto Open, schemalagda öppningar, stöd för befintliga fjärrkontroller, behörighetshantering och inget månadsabonnemang.",
      imageAlt: "Förare öppnar en parkeringsbom och elektrisk grind med mobilen",
    },
    "garage-doors": {
      label: "Garageportar och privat parkering",
      title: "Smart öppning för garageportar och privat parkering",
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
        "Garageportar och privata parkeringsinfarter styrs vanligtvis med fysiska fjärrkontroller som kan tappas bort, bli kvar hos personer som inte längre behöver åtkomst eller i vissa fall kopieras. WIFIGATE flyttar styrningen till digital åtkomst från mobilen, gör det möjligt att hantera behörigheter för familjemedlemmar, anställda eller gäster och dela tillfällig åtkomst utan att lämna över en fjärrkontroll eller kod. Resultatet blir en mer bekväm, mer privat och bättre organiserad upplevelse, med mindre beroende av fysiska åtkomstverktyg.",
      bullets: [
        "Öppna garageporten från mobilen",
        "Mindre beroende av fysiska fjärrkontroller",
        "Minskad risk från borttappade, överlämnade eller kopierade fjärrkontroller",
        "Åtkomsthantering för familjemedlemmar, anställda och gäster",
        "Tillfällig åtkomst utan att lämna över en fjärrkontroll eller kod",
        "Lämplig för privat parkering, hus och marklägenheter",
        "Ett mer lokalt och privat sätt att hantera åtkomst",
        "Bekvämare och säkrare vardagsstyrning",
      ],
      seoTitle: "Smart åtkomst till garageportar och privat parkering | WIFIGATE",
      seoDescription:
        "WIFIGATE öppnar garageportar och privata parkeringsinfarter från mobilen, med mindre beroende av fysiska fjärrkontroller, tillfälliga behörigheter och bekvämare privat åtkomsthantering.",
      imageAlt: "Man öppnar en privat garageport med mobilen vid ett modernt hem",
    },
    "private-homes": {
      label: "Privata hem",
      title: "Smart och säker åtkomst för privata hem",
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
        "I privata hem kan knappsatser, nycklar och fjärrkontroller bli en svag punkt. Med tiden kan slitmärken uppstå på knappsatsens knappar, fjärrkontroller kan tappas bort eller lämnas vidare och koder kan delas med bud, servicepersonal eller gäster och därefter stanna hos dem längre än nödvändigt. WIFIGATE gör det möjligt att styra entrén från mobilen, dela tillfällig gäståtkomst utan att exponera en permanent kod och enkelt återkalla behörigheter utan att byta lås, koder eller fjärrkontroller.",
      bullets: [
        "Mindre beroende av knappsatser, nycklar och fjärrkontroller",
        "Tillfällig åtkomst för bud, gäster och servicepersonal",
        "Återkalla behörigheter enkelt från mobilen",
        "Minskad risk med delade koder eller vidarebefordrade fjärrkontroller",
        "Lämplig för grindar, dörrar, parkering och garage vid ett privat hem",
        "Enkel hantering för familjemedlemmar och återkommande användare",
        "En bekvämare vardaglig entréupplevelse",
        "Bättre integritet och kontroll över vem som kan gå in",
      ],
      seoTitle: "Smart åtkomst till privata hem utan delad kod | WIFIGATE",
      seoDescription:
        "WIFIGATE hjälper privata hem att hantera åtkomst från mobilen, dela tillfälliga behörigheter med gäster och bud och minska beroendet av knappsatser, nycklar och fjärrkontroller.",
      imageAlt: "Kvinna öppnar entrégrinden till ett privat hem med mobilen i stället för knappsatsen",
    },
    "residential-buildings": {
      label: "Bostadshus",
      title: "Smart åtkomsthantering för bostadshus",
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
        "I bostadshus sprids en gemensam entrékod snabbt mellan boende, gäster, bud, leverantörer och servicepersonal. Med tiden blir det svårt att veta vem som faktiskt har åtkomst till byggnaden och när det är dags att byta kod eller samla in fjärrkontroller. WIFIGATE gör det möjligt för boende och förvaltning att styra åtkomsten på ett mer organiserat sätt, ge tillfälliga gästbehörigheter, minska beroendet av en gemensam kod och få bättre kontroll över entrén till byggnad, lobby, grind eller parkering.",
      bullets: [
        "Bekväm åtkomst för boende via mobilen",
        "Tillfälliga gästinbjudningar utan att exponera en permanent kod",
        "Behörighetshantering för boende, leverantörer och servicepersonal",
        "Lämplig för entrédörrar, grindar och parkering",
        "Mindre beroende av knappsatser, nycklar och fjärrkontroller",
        "Bättre transparens med åtkomsthistorik",
        "Enklare hantering för styrelse eller fastighetsförvaltning",
        "En mer bekväm entréupplevelse för boende och gäster",
      ],
      seoTitle: "Åtkomstkontroll för bostadshus | WIFIGATE",
      seoDescription:
        "WIFIGATE ger smart åtkomsthantering för bostadshus med öppning från mobilen, tillfälliga gästbehörigheter, mindre beroende av knappsatser och bättre transparens.",
      imageAlt: "Boende öppnar ingången till ett bostadshus med mobilen",
    },
    "office-buildings": {
      label: "Kontorsbyggnader",
      title: "Smart åtkomst för kontorsbyggnader",
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
        "Kontorsbyggnader behöver ge bekväm åtkomst för anställda, besökare, leverantörer och driftteam utan att belasta receptionen och utan manuell hantering av nycklar eller kort. WIFIGATE låter dig ge permanenta behörigheter till anställda och tillfälliga behörigheter till besökare, styra åtkomsten från mobilen och hantera entréer på ett sätt som passar en modern, ren och organiserad arbetsmiljö.",
      bullets: [
        "Permanenta behörigheter för anställda och team",
        "Tillfällig åtkomst för besökare, leverantörer och bud",
        "Mindre belastning på reception och driftteam",
        "Lämplig för entrédörrar, våningar, rum och parkering",
        "Organiserad hantering av användare och behörigheter",
        "Mindre beroende av nycklar, passerkort och koder",
        "Ett mer modernt och bekvämt intryck av byggnaden",
        "Åtkomsthistorik för kontroll och transparens",
      ],
      seoTitle: "Åtkomstkontroll för kontorsbyggnader | WIFIGATE",
      seoDescription:
        "WIFIGATE hjälper kontorsbyggnader att hantera åtkomst för anställda, besökare och leverantörer via mobilen med tillfälliga och permanenta behörigheter.",
      imageAlt: "Medarbetare öppnar en glasdörr i ett modernt kontor med mobilen",
    },
    "entry-doors-magnetic-locks": {
      label: "Entrédörrar och magnetlås för företag",
      title: "Smart öppning för entrédörrar och magnetlås i företag",
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
        "Små företag, kliniker, studior, lager och kontor använder ofta en knappsats, en nyckel eller ett enkelt magnetlås. Problemet uppstår när koden sprids mellan anställda, leverantörer och gäster, eller när tillfällig åtkomst behövs utan att säkerheten försvagas. WIFIGATE gör det möjligt att styra entrédörren från mobilen, dela en tillfällig behörighet och minska behovet av permanenta koder, fysiska nycklar eller manuell samordning vid varje inpassering.",
      bullets: [
        "Lämplig för entrédörrar med elektriskt eller magnetiskt lås",
        "Öppning från mobilen för anställda och chefer",
        "Tillfällig åtkomst för gäster, leverantörer och servicepersonal",
        "Mindre behov av knappsats eller permanent kod",
        "Lämplig för småföretag, kliniker, studior och kontor",
        "Enklare och säkrare behörighetshantering",
        "Mindre behov av fysiska nycklar",
        "Ett bekvämt alternativ för företag som vill ha modern åtkomst utan ett komplext system",
      ],
      seoTitle: "Entrédörrar och magnetlås för företag | WIFIGATE",
      seoDescription:
        "WIFIGATE ger smart öppning av entrédörrar och magnetlås för företag med behörighetshantering från mobilen, tillfällig åtkomst och mindre beroende av knappsatser och nycklar.",
      imageAlt: "Kund öppnar entrédörren till ett litet företag med mobilen",
    },
    "sports-facilities": {
      label: "Idrottsanläggningar",
      title: "Smart åtkomstkontroll för idrottsanläggningar",
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
        "Idrottsanläggningar, padelbanor, tennisbanor, gym och träningsanläggningar behöver hantera åtkomst för medlemmar, tränare, lag och gäster utifrån öppettider, bokningar och evenemang. WIFIGATE gör det möjligt att ge tillfällig eller permanent åtkomst från mobilen, minska beroendet av gemensamma nycklar eller koder och förbättra entréupplevelsen för användare, särskilt i anläggningar där trafiken varierar under dagen.",
      bullets: [
        "Lämplig för padelbanor, tennisbanor, gym och träningsanläggningar",
        "Åtkomst efter öppettider, bokningar eller behörigheter",
        "Hantering för medlemmar, tränare, anställda och gäster",
        "Mindre beroende av gemensamma nycklar och koder",
        "Snabb och bekväm åtkomst från mobilen",
        "Lämplig för anläggningar med skiftande öppettider",
        "Tillfälliga behörigheter för evenemang, klasser eller träningspass",
        "Åtkomsthistorik för drift och kontroll",
      ],
      seoTitle: "Åtkomstkontroll för idrottsanläggningar och padelbanor | WIFIGATE",
      seoDescription:
        "WIFIGATE ger smart åtkomstkontroll till idrottsanläggningar, padelbanor, gym och träningsanläggningar med åtkomst från mobilen och tillfälliga eller permanenta behörigheter.",
      imageAlt: "Padelspelare öppnar entrén till en upplyst idrottsanläggning med mobilen",
    },
  },
};
