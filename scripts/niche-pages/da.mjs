// scripts/niche-pages/da.mjs
// Danish content for the homepage "where" section + niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | Smart adgangskontrol til porte, døre og parkering",
    seoDescription:
      "WIFIGATE (WiFi Gate) er et smart adgangskontrolsystem til at åbne porte, døre, parkeringsindgange, rulleporte og garageporte fra telefonen. En sikker, lokal og praktisk løsning uden månedligt abonnement.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, smart adgangskontrol, åbne port med telefon, elektrisk port, døradgang, parkeringsadgang, ingen månedlige gebyrer",
  },
  where: {
    title: "Hvor kan WIFIGATE bruges?",
    subtitle:
      "WIFIGATE passer til mange forskellige miljøer og giver en smart, sikker og praktisk løsning til adgangsstyring, fra private hjem til kommercielle og organisatoriske omgivelser.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hoteller, Airbnb og gæstelejligheder",
      title: "Smart adgang til hoteller, Airbnb og gæstelejligheder",
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
        "WIFIGATE gør det muligt for gæster at få praktisk og sikker digital adgang direkte på telefonen uden fysiske nøgler, kort eller unødvendig koordinering med receptionen eller ejeren. Med WIFIGATE API kan bookingprocessen kobles til adgangssystemet, så gæsten automatisk kan få tidsbegrænset adgang, når en reservation er bekræftet. Adgangen starter ved check-in, slutter automatisk ved check-out og reducerer behovet for nøgler, koder og manuel håndtering.",
      bullets: [
        "Automatisk oprettelse af gæsteadgang efter bekræftet booking",
        "Understøtter fuld automatisering med WIFIGATE API",
        "Midlertidig adgang efter opholdets datoer og tider",
        "Mindre behov for manuel check-in, nøgler, kort eller koder",
        "Rettighedsstyring for personale, rengøring, vedligehold og leverandører",
        "En mere smidig ankomstoplevelse for gæster",
        "Automatisk afslutning af adgang ved check-out",
        "Adgangshistorik for gennemsigtighed og kontrol",
      ],
      seoTitle: "Adgangskontrol til hoteller, Airbnb og gæstelejligheder | WIFIGATE API",
      seoDescription:
        "WIFIGATE giver smart digital adgang til hoteller, Airbnb og gæstelejligheder med automatisering af gæsterettigheder via WIFIGATE API, midlertidig adgang efter booking og mindre manuel check-in.",
      imageAlt: "Gæster åbner døren til et hotelværelse med telefonen i en moderne gang",
    },
    "roller-shutters": {
      label: "Rulleporte til virksomheder og butikker",
      title: "Smart og sikker styring af rulleporte til virksomheder og butikker",
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
        "Rulleporte i butikker og virksomheder styres ofte med fjernbetjeninger, nøgler, en udvendig nøgleboks eller kontakter uden for virksomheden. Den slags løsninger kan blive væk, blive hos tidligere medarbejdere, kopieres eller blive et synligt adgangspunkt. WIFIGATE flytter styringen til appen og gør det muligt at placere adgangskontrollen på en mere beskyttet indvendig side, så åbning og lukning bliver mere praktisk, rettigheder kan styres for medarbejdere og leverandører, og afhængigheden af nøgler, fjernbetjeninger og udsatte adgangspunkter reduceres.",
      bullets: [
        "Åbn og luk fra telefonen uden afhængighed af fjernbetjeninger",
        "Mindre afhængighed af nøgler, der kan kopieres eller blive væk",
        "Færre udsatte adgangspunkter uden for virksomheden",
        "Mere praktisk styring med bedre udsyn til rulleporten",
        "Rettighedsstyring for medarbejdere, ledere og leverandører",
        "Mulighed for midlertidig adgang efter tid eller behov",
        "Velegnet til butikker, lagre, serviceindgange og virksomheder",
        "En mere intern, organiseret og sikker løsning til daglig drift",
      ],
      seoTitle: "Smart styring af rulleporte til virksomheder og butikker | WIFIGATE",
      seoDescription:
        "WIFIGATE gør det muligt at styre rulleporte i virksomheder og butikker fra telefonen med rettighedsstyring, mindre afhængighed af nøgler og fjernbetjeninger samt færre udsatte adgangspunkter.",
      imageAlt: "Butiksejer åbner en butiks rulleport med telefonen",
    },
    "electric-gates": {
      label: "Elektriske porte og parkeringsbomme",
      title: "Smart åbning af elektriske porte og parkeringsbomme",
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
        "Elektriske porte og parkeringsbomme bruges af beboere, medarbejdere, gæster og leverandører, men styring af fjernbetjeninger, koder og telefonopkald til åbning bliver hurtigt besværligt. WIFIGATE gør det muligt at åbne porten fra telefonen, dele fast eller midlertidig adgang, bruge Auto Open til faste brugere og oprette planlagte hændelser efter behov. Systemet er designet til lokal, sikker og privat drift uden månedligt abonnement, og eksisterende fjernbetjeninger kan fortsat bruges sammen med appen.",
      bullets: [
        "Åbn elektrisk port eller parkeringsbom fra telefonen",
        "Ingen månedligt abonnement og ingen løbende betalingsaftale",
        "Del midlertidig adgang med gæster, leverandører og medarbejdere",
        "Auto Open til faste brugere i daglig indkørsel",
        "Planlagte åbninger efter dage og tider",
        "Understøtter appstyring og eksisterende fjernbetjeninger",
        "Mindre behov for at uddele fysiske fjernbetjeninger",
        "Åbningshistorik for kontrol og gennemsigtighed",
      ],
      seoTitle: "Adgangskontrol til elektriske porte og parkeringsbomme uden abonnement | WIFIGATE",
      seoDescription:
        "WIFIGATE giver smart åbning af elektriske porte og parkeringsbomme fra telefonen med Auto Open, planlagte hændelser, eksisterende fjernbetjeninger, rettighedsstyring og uden månedligt abonnement.",
      imageAlt: "Chauffør åbner en parkeringsbom og elektrisk port med telefonen",
    },
    "garage-doors": {
      label: "Garageporte og privat parkering",
      title: "Smart åbning af garageporte og privat parkering",
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
        "Garageporte og private parkeringspladser styres typisk med fysiske fjernbetjeninger, som kan blive væk, blive hos personer der ikke længere skal have adgang, eller i visse situationer kopieres. WIFIGATE flytter styringen til digital adgang fra telefonen, så rettigheder kan administreres for familie, medarbejdere eller gæster, og midlertidig adgang kan deles uden at udlevere en fjernbetjening eller kode.",
      bullets: [
        "Åbn garageporten fra telefonen",
        "Mindre afhængighed af fysiske fjernbetjeninger",
        "Reducerer risikoen ved mistede, videregivne eller kopierede fjernbetjeninger",
        "Administrer adgang for familie, medarbejdere og gæster",
        "Midlertidig adgang uden at udlevere fjernbetjening eller kode",
        "Velegnet til privat parkering, huse og havelejligheder",
        "En mere lokal og privat løsning til adgangsstyring",
        "Mere praktisk og sikker styring i hverdagen",
      ],
      seoTitle: "Smart åbning af garageporte og privat parkering | WIFIGATE",
      seoDescription:
        "WIFIGATE gør det muligt at åbne garageporte og privat parkering fra telefonen med mindre afhængighed af fysiske fjernbetjeninger, midlertidige rettigheder og mere privat adgangsstyring.",
      imageAlt: "Mand åbner en privat garageport med telefonen ved et moderne hus",
    },
    "private-homes": {
      label: "Private hjem",
      title: "Smart og sikker adgang til private hjem",
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
        "I private hjem kan tastaturer, nøgler og fjernbetjeninger blive svage punkter. Med tiden kan der komme slid eller spor på tastaturets knapper, fjernbetjeninger kan blive væk eller overdrages, og faste koder kan blive delt med bude, servicefolk eller gæster og blive hos dem bagefter. WIFIGATE gør det muligt at styre indgangen fra telefonen, dele midlertidig gæsteadgang uden at afsløre en fast kode og nemt fjerne rettigheder uden at skifte låse, koder eller fjernbetjeninger.",
      bullets: [
        "Mindre afhængighed af tastatur, nøgler og fjernbetjeninger",
        "Midlertidig adgang til bude, gæster og servicefolk",
        "Nem tilbagekaldelse af rettigheder fra telefonen",
        "Reducerer risikoen ved delte koder eller overdragede fjernbetjeninger",
        "Velegnet til porte, døre, parkering og garager i private hjem",
        "Enkel styring for familie og faste brugere",
        "En mere praktisk løsning til daglig adgang",
        "Bedre privatliv og kontrol over, hvem der kan komme ind",
      ],
      seoTitle: "Smart adgang til private hjem uden delt tastaturkode | WIFIGATE",
      seoDescription:
        "WIFIGATE hjælper private hjem med at styre adgang fra telefonen, dele midlertidige rettigheder med gæster og bude og reducere afhængigheden af tastaturer, nøgler og fjernbetjeninger.",
      imageAlt: "Kvinde åbner indgangsporten til et privat hjem med telefonen i stedet for tastaturet",
    },
    "residential-buildings": {
      label: "Boligbygninger",
      title: "Smart adgangsstyring til boligbygninger",
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
        "I boligbygninger spredes en fælles indgangskode hurtigt mellem beboere, gæster, bude, leverandører og servicefolk. Med tiden bliver det svært at vide, hvem der reelt har adgang til bygningen, og hvornår koder skal ændres eller fjernbetjeninger indsamles. WIFIGATE gør det muligt for beboere og bestyrelse at styre adgang mere organiseret, give midlertidige gæsterettigheder, reducere afhængigheden af fælles koder og bevare bedre kontrol over indgangen til bygning, lobby, port eller parkering.",
      bullets: [
        "Praktisk adgang for beboere via telefonen",
        "Midlertidige gæsteinvitationer uden at afsløre fast kode",
        "Rettighedsstyring for beboere, leverandører og servicefolk",
        "Velegnet til lobbydøre, porte og parkering",
        "Mindre afhængighed af tastaturer, nøgler og fjernbetjeninger",
        "Bedre gennemsigtighed med adgangshistorik",
        "Enklere administration for bestyrelse eller ejendomsadministration",
        "Mere praktisk adgang for beboere og gæster",
      ],
      seoTitle: "Adgangskontrol til boligbygninger | WIFIGATE",
      seoDescription:
        "WIFIGATE giver smart adgangsstyring til boligbygninger med åbning fra telefonen, midlertidige gæsterettigheder, mindre afhængighed af tastaturkoder og bedre gennemsigtighed.",
      imageAlt: "Beboer åbner indgangen til en boligbygning med telefonen",
    },
    "office-buildings": {
      label: "Kontorbygninger",
      title: "Smart adgang til kontorbygninger",
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
        "Kontorbygninger skal give nem adgang for medarbejdere, besøgende, leverandører og driftsteams uden at skabe unødig belastning i receptionen og uden manuel styring af nøgler eller kort. WIFIGATE giver faste rettigheder til medarbejdere og midlertidige rettigheder til besøgende, adgangsstyring fra telefonen og en organiseret måde at styre indgange på i et moderne erhvervsmiljø.",
      bullets: [
        "Faste rettigheder til medarbejdere og teams",
        "Midlertidig adgang til besøgende, leverandører og bude",
        "Mindre belastning på reception og driftsteam",
        "Velegnet til indgangsdøre, etager, rum og parkering",
        "Organiseret styring af brugere og rettigheder",
        "Mindre afhængighed af nøgler, adgangskort og koder",
        "Et mere moderne og praktisk indtryk af bygningen",
        "Adgangshistorik for kontrol og gennemsigtighed",
      ],
      seoTitle: "Adgangskontrol til kontorbygninger | WIFIGATE",
      seoDescription:
        "WIFIGATE hjælper kontorbygninger med at styre adgang for medarbejdere, besøgende og leverandører via telefonen med midlertidige og faste rettigheder.",
      imageAlt: "Medarbejder åbner en glasdør i et moderne kontor med telefonen",
    },
    "entry-doors-magnetic-locks": {
      label: "Indgangsdøre og magnetlåse til virksomheder",
      title: "Smart åbning af indgangsdøre og magnetlåse til virksomheder",
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
        "Små virksomheder, klinikker, studier, lagre og kontorer bruger ofte tastatur, nøgle eller en enkel magnetlås. Problemet opstår, når koden deles mellem medarbejdere, leverandører og gæster, eller når der skal gives midlertidig adgang uden at svække kontrollen. WIFIGATE gør det muligt at styre indgangsdøren fra telefonen, dele en midlertidig rettighed og reducere behovet for faste koder, fysiske nøgler eller manuel koordinering ved hver adgang.",
      bullets: [
        "Velegnet til indgangsdøre med elektrisk lås eller magnetlås",
        "Åbning fra telefonen for medarbejdere og ledere",
        "Midlertidig adgang til gæster, leverandører og servicefolk",
        "Mindre behov for tastatur eller fast kode",
        "Velegnet til små virksomheder, klinikker, studier og kontorer",
        "Enklere og mere sikker rettighedsstyring",
        "Reducerer behovet for fysiske nøgler",
        "Praktisk løsning til virksomheder, der ønsker moderne adgang uden et komplekst system",
      ],
      seoTitle: "Indgangsdøre og magnetlåse til virksomheder | WIFIGATE",
      seoDescription:
        "WIFIGATE giver smart åbning af indgangsdøre og magnetlåse til virksomheder med rettighedsstyring fra telefonen, midlertidig adgang og mindre afhængighed af tastaturer og nøgler.",
      imageAlt: "Kunde åbner indgangsdøren til en lille virksomhed med telefonen",
    },
    "sports-facilities": {
      label: "Sportsfaciliteter",
      title: "Smart adgangskontrol til sportsfaciliteter",
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
        "Sportsfaciliteter, Padel-baner, tennisbaner, fitnesscentre og træningsområder skal styre adgang for medlemmer, trænere, personale og gæster efter åbningstider, bookinger og arrangementer. WIFIGATE gør det muligt at give midlertidig eller fast adgang fra telefonen, reducere afhængigheden af fælles nøgler eller koder og forbedre adgangsoplevelsen på steder med skiftende trafik gennem dagen.",
      bullets: [
        "Velegnet til Padel-baner, tennis, fitnesscentre og træningsområder",
        "Adgang efter åbningstider, bookinger eller rettigheder",
        "Styring af medlemmer, trænere, medarbejdere og gæster",
        "Mindre afhængighed af fælles nøgler og koder",
        "Hurtig og praktisk adgang fra telefonen",
        "Velegnet til steder med skiftende åbningstider",
        "Midlertidige rettigheder til events, hold eller træning",
        "Adgangshistorik til drift og kontrol",
      ],
      seoTitle: "Adgangskontrol til sportsfaciliteter og Padel-baner | WIFIGATE",
      seoDescription:
        "WIFIGATE giver smart adgangskontrol til sportsfaciliteter, Padel-baner, fitnesscentre og træningsområder med adgang fra telefonen og midlertidige eller faste rettigheder.",
      imageAlt: "Padel-spiller åbner indgangen til en oplyst sportsbane med telefonen",
    },
  },
};
