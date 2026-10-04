// scripts/niche-pages/hu.mjs
// Hungarian content for the homepage "where" section + niche/use-case pages.

export default {
  home: {
    seoTitle: "WIFIGATE | Okos beléptetés kapukhoz, ajtókhoz és parkolókhoz",
    seoDescription:
      "A WIFIGATE (WiFi Gate) okos beléptetőrendszer, amellyel telefonról nyithatók kapuk, ajtók, parkolóbejáratok, redőnykapuk és garázsok. Biztonságos, helyi és kényelmes megoldás havi előfizetés nélkül.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, okos beléptetés, kapunyitás telefonnal, elektromos kapu, ajtó beléptetés, parkoló beléptetés, nincs havi díj",
  },
  where: {
    title: "Hol használható a WIFIGATE?",
    subtitle:
      "A WIFIGATE sokféle környezetben használható, és okos, biztonságos, kényelmes hozzáférés-kezelést kínál a magánotthonoktól az üzleti és szervezeti helyszínekig.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Szállodák, Airbnb és vendégapartmanok",
      title: "Okos hozzáférés szállodákhoz, Airbnb-hez és vendégapartmanokhoz",
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
        "A WIFIGATE lehetővé teszi, hogy a vendégek kényelmes és biztonságos digitális hozzáférést kapjanak közvetlenül a telefonjukra, fizikai kulcsok, kártyák és felesleges recepciós vagy tulajdonosi egyeztetés nélkül. A WIFIGATE API segítségével a foglalási folyamat összekapcsolható a beléptetéssel, így a foglalás jóváhagyása után a vendég automatikusan időkorlátos hozzáférést kaphat. A hozzáférés bejelentkezéskor indul, kijelentkezéskor automatikusan lejár, és csökkenti a kulcsok, kódok és kézi ügyintézés szükségességét.",
      bullets: [
        "Automatikus vendéghozzáférés létrehozása jóváhagyott foglalás után",
        "Teljes automatizálás támogatása WIFIGATE API-val",
        "Ideiglenes hozzáférés a tartózkodás dátumai és időpontjai szerint",
        "Kevesebb kézi check-in, kulcs, kártya vagy kód",
        "Jogosultságkezelés személyzetnek, takarítóknak, karbantartóknak és beszállítóknak",
        "Gördülékenyebb érkezési élmény a vendégeknek",
        "Automatikus hozzáféréslezárás kijelentkezéskor",
        "Hozzáférési előzmények az átláthatóság és ellenőrzés érdekében",
      ],
      seoTitle: "Beléptetés szállodákhoz, Airbnb-hez és vendégapartmanokhoz | WIFIGATE API",
      seoDescription:
        "A WIFIGATE okos digitális hozzáférést ad szállodákhoz, Airbnb-hez és vendégapartmanokhoz, WIFIGATE API alapú vendégjogosultság-automatizálással, foglaláshoz kötött ideiglenes hozzáféréssel és kevesebb kézi check-innel.",
      imageAlt: "Vendégek telefonnal nyitnak hotelszobaajtót egy modern folyosón",
    },
    "roller-shutters": {
      label: "Redőnykapuk üzletekhez és vállalkozásokhoz",
      title: "Okos és biztonságos redőnykapu-vezérlés üzleteknek és vállalkozásoknak",
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
        "Az üzletek és vállalkozások redőnykapuit gyakran távirányítóval, kulccsal, külső kulcsdobozzal vagy kültéri kapcsolóval vezérlik. Ezek elveszhetnek, volt munkatársaknál maradhatnak, lemásolhatók, vagy külső, kitett hozzáférési ponttá válhatnak. A WIFIGATE az irányítást az alkalmazásba helyezi, és lehetővé teszi a hozzáférés-kezelés védettebb, belső oldalra telepítését, így kényelmesebb a nyitás és zárás, kezelhetők a munkatársak és beszállítók jogosultságai, és csökken a kulcsoktól, távirányítóktól és kitett pontoktól való függés.",
      bullets: [
        "Nyitás és zárás telefonról, távirányítók nélkül",
        "Kevesebb függés elveszíthető vagy másolható kulcsoktól",
        "Kevesebb kitett hozzáférési pont az üzlet külső oldalán",
        "Kényelmesebb vezérlés jobb rálátással a redőnykapura",
        "Jogosultságkezelés munkatársaknak, vezetőknek és beszállítóknak",
        "Ideiglenes hozzáférés idő vagy igény alapján",
        "Alkalmas üzletekhez, raktárakhoz, szervizbejáratokhoz és vállalkozásokhoz",
        "Belsőbb, rendezettebb és biztonságosabb megoldás napi működéshez",
      ],
      seoTitle: "Okos redőnykapu-vezérlés üzleteknek és vállalkozásoknak | WIFIGATE",
      seoDescription:
        "A WIFIGATE telefonos vezérlést ad üzletek és vállalkozások redőnykapuihoz, jogosultságkezeléssel, kisebb kulcs- és távirányítófüggéssel, valamint kevesebb kitett hozzáférési ponttal.",
      imageAlt: "Üzlettulajdonos telefonnal nyitja egy bolt redőnykapuját",
    },
    "electric-gates": {
      label: "Elektromos kapuk és parkolósorompók",
      title: "Okos nyitás elektromos kapukhoz és parkolósorompókhoz",
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
        "Az elektromos kapukat és parkolósorompókat lakók, dolgozók, vendégek és beszállítók használják, de a távirányítók, kódok és telefonos kapunyitások kezelése gyorsan nehézkessé válik. A WIFIGATE lehetővé teszi a kapu telefonról történő nyitását, állandó vagy ideiglenes hozzáférés megosztását, Auto Open használatát rendszeres felhasználóknak, valamint ütemezett események beállítását. A rendszer helyi, biztonságos és adatvédelemre fókuszáló működésre készült, havi előfizetés nélkül, miközben a meglévő távirányítók is tovább használhatók.",
      bullets: [
        "Elektromos kapu vagy parkolósorompó nyitása telefonról",
        "Nincs havi előfizetés és nincs rendszeres beszedés",
        "Ideiglenes hozzáférés megosztása vendégekkel, beszállítókkal és munkatársakkal",
        "Auto Open a rendszeres napi belépéshez",
        "Ütemezett nyitási események napok és időpontok szerint",
        "Alkalmazásos vezérlés és meglévő távirányítók támogatása",
        "Kevesebb fizikai távirányító kiosztása",
        "Nyitási előzmények ellenőrzéshez és átláthatósághoz",
      ],
      seoTitle: "Beléptetés elektromos kapukhoz és parkolósorompókhoz előfizetés nélkül | WIFIGATE",
      seoDescription:
        "A WIFIGATE telefonról nyitható elektromos kapukat és parkolósorompókat kínál Auto Open funkcióval, ütemezett eseményekkel, meglévő távirányítók támogatásával, jogosultságkezeléssel és havi díj nélkül.",
      imageAlt: "Sofőr telefonnal nyit parkolósorompót és elektromos kaput",
    },
    "garage-doors": {
      label: "Garázskapuk és magánparkolók",
      title: "Okos nyitás garázskapukhoz és magánparkolókhoz",
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
        "A garázskapukat és magánparkolókat általában fizikai távirányítókkal vezérlik, amelyek elveszhetnek, olyan embereknél maradhatnak, akiknek már nincs szükségük hozzáférésre, vagy bizonyos helyzetekben másolhatók. A WIFIGATE digitális, telefonos hozzáférésre váltja a vezérlést, így kezelhetők a családtagok, munkatársak vagy vendégek jogosultságai, és ideiglenes hozzáférés is megosztható távirányító vagy kód átadása nélkül.",
      bullets: [
        "Garázskapu nyitása telefonról",
        "Kevesebb függés fizikai távirányítóktól",
        "A távirányító elvesztéséből, továbbadásából vagy másolásából eredő kockázat csökkentése",
        "Hozzáférés kezelése családtagoknak, munkatársaknak és vendégeknek",
        "Ideiglenes hozzáférés távirányító vagy kód átadása nélkül",
        "Alkalmas magánparkolókhoz, házakhoz és kertkapcsolatos lakásokhoz",
        "Helyibb és privátabb hozzáférés-kezelési megoldás",
        "Kényelmesebb és biztonságosabb mindennapi vezérlés",
      ],
      seoTitle: "Okos nyitás garázskapukhoz és magánparkolókhoz | WIFIGATE",
      seoDescription:
        "A WIFIGATE telefonról nyitható garázskapukat és magánparkolókat biztosít, kevesebb fizikai távirányító-függéssel, ideiglenes jogosultságokkal és kényelmesebb, privátabb hozzáférés-kezeléssel.",
      imageAlt: "Férfi telefonnal nyit magán garázskaput egy modern háznál",
    },
    "private-homes": {
      label: "Magánotthonok",
      title: "Okos és biztonságos hozzáférés magánotthonokhoz",
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
        "Magánotthonokban a kódbillentyűzetek, kulcsok és távirányítók gyenge pontokká válhatnak. Idővel kopás vagy nyomok jelenhetnek meg a billentyűkön, a távirányítók elveszhetnek vagy másokhoz kerülhetnek, és a kódot gyakran futároknak, szolgáltatóknak vagy vendégeknek adják meg, akiknél később is megmaradhat. A WIFIGATE telefonról kezelhető belépést ad, ideiglenes vendéghozzáférést oszt meg állandó kód felfedése nélkül, és egyszerűen visszavonható jogosultságokat kínál zárak, kódok vagy távirányítók cseréje nélkül.",
      bullets: [
        "Kevesebb függés kódbillentyűzettől, kulcsoktól és távirányítóktól",
        "Ideiglenes hozzáférés futároknak, vendégeknek és szolgáltatóknak",
        "Jogosultságok egyszerű visszavonása telefonról",
        "A kódmegosztásból vagy távirányító-átadásból eredő kockázat csökkentése",
        "Alkalmas kapukhoz, ajtókhoz, parkolókhoz és garázsokhoz magánotthonokban",
        "Egyszerű kezelés családtagoknak és rendszeres felhasználóknak",
        "Kényelmesebb mindennapi belépés",
        "Jobb adatvédelem és kontroll afelett, ki léphet be",
      ],
      seoTitle: "Okos hozzáférés magánotthonokhoz közös kód nélkül | WIFIGATE",
      seoDescription:
        "A WIFIGATE segít magánotthonokban telefonról kezelni a hozzáférést, ideiglenes jogosultságot adni vendégeknek és futároknak, és csökkenteni a kódok, kulcsok és távirányítók használatát.",
      imageAlt: "Nő telefonnal nyitja egy magánotthon bejárati kapuját kódbillentyűzet helyett",
    },
    "residential-buildings": {
      label: "Lakóépületek",
      title: "Okos hozzáférés-kezelés lakóépületekhez",
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
        "Lakóépületekben a közös belépőkód gyorsan terjed a lakók, vendégek, futárok, beszállítók és szolgáltatók között. Idővel nehéz tudni, kinek van valóban hozzáférése az épülethez, és mikor kell kódot cserélni vagy távirányítókat begyűjteni. A WIFIGATE rendezettebb hozzáférés-kezelést ad a lakóknak és a közös képviseletnek, ideiglenes vendégjogosultságokat biztosít, csökkenti a közös kódoktól való függést, és jobb kontrollt ad az épület, lobby, kapu vagy parkoló bejárata felett.",
      bullets: [
        "Kényelmes telefonos hozzáférés lakóknak",
        "Ideiglenes vendégmeghívók állandó kód felfedése nélkül",
        "Jogosultságkezelés lakóknak, beszállítóknak és szolgáltatóknak",
        "Alkalmas lobbyajtókhoz, kapukhoz és parkolókhoz",
        "Kevesebb függés kódbillentyűzetektől, kulcsoktól és távirányítóktól",
        "Jobb átláthatóság hozzáférési előzményekkel",
        "Egyszerűbb kezelés közös képviseletnek vagy üzemeltetőnek",
        "Kényelmesebb belépési élmény lakóknak és vendégeknek",
      ],
      seoTitle: "Beléptetés lakóépületekhez | WIFIGATE",
      seoDescription:
        "A WIFIGATE okos hozzáférés-kezelést ad lakóépületekhez telefonos nyitással, ideiglenes vendégjogosultságokkal, kevesebb kódhasználattal és jobb átláthatósággal.",
      imageAlt: "Lakó telefonnal nyitja egy lakóépület bejáratát",
    },
    "office-buildings": {
      label: "Irodaházak",
      title: "Okos hozzáférés irodaházakhoz",
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
        "Az irodaházaknak kényelmes belépést kell biztosítaniuk dolgozóknak, látogatóknak, beszállítóknak és üzemeltetési csapatoknak anélkül, hogy túlterhelnék a recepciót vagy kézzel kellene kulcsokat és kártyákat kezelni. A WIFIGATE állandó jogosultságot ad dolgozóknak, ideiglenes hozzáférést látogatóknak, telefonos hozzáférés-kezelést biztosít, és modern, rendezett beléptetést tesz lehetővé üzleti környezetben.",
      bullets: [
        "Állandó jogosultságok dolgozóknak és csapatoknak",
        "Ideiglenes hozzáférés látogatóknak, beszállítóknak és futároknak",
        "Kevesebb terhelés a recepción és az üzemeltetésen",
        "Alkalmas bejárati ajtókhoz, szintekhez, helyiségekhez és parkolókhoz",
        "Felhasználók és jogosultságok rendezett kezelése",
        "Kevesebb függés kulcsoktól, belépőkártyáktól és kódoktól",
        "Modernebb és kényelmesebb épületélmény",
        "Hozzáférési előzmények ellenőrzéshez és átláthatósághoz",
      ],
      seoTitle: "Beléptetés irodaházakhoz | WIFIGATE",
      seoDescription:
        "A WIFIGATE segít irodaházaknak telefonról kezelni a dolgozók, látogatók és beszállítók belépését, ideiglenes és állandó jogosultságokkal, modern hozzáférés-kezeléssel.",
      imageAlt: "Munkatárs telefonnal nyit üvegajtót egy modern irodában",
    },
    "entry-doors-magnetic-locks": {
      label: "Bejárati ajtók és mágneszárak vállalkozásoknak",
      title: "Okos nyitás bejárati ajtókhoz és mágneszárakhoz vállalkozásoknak",
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
        "Kisvállalkozások, rendelők, stúdiók, raktárak és irodák gyakran használnak kódbillentyűzetet, kulcsot vagy egyszerű mágneszárat. A probléma akkor kezdődik, amikor a kód munkatársak, beszállítók és vendégek között terjed, vagy amikor ideiglenes hozzáférést kell adni a kontroll csökkentése nélkül. A WIFIGATE telefonról kezelhető bejárati ajtót, ideiglenes jogosultság-megosztást és kevesebb állandó kódot, fizikai kulcsot vagy kézi egyeztetést biztosít.",
      bullets: [
        "Alkalmas elektromos zárral vagy mágneszárral működő bejárati ajtókhoz",
        "Telefonos nyitás munkatársaknak és vezetőknek",
        "Ideiglenes hozzáférés vendégeknek, beszállítóknak és szolgáltatóknak",
        "Kevesebb szükség kódbillentyűzetre vagy állandó kódra",
        "Alkalmas kisvállalkozásokhoz, rendelőkhöz, stúdiókhoz és irodákhoz",
        "Egyszerűbb és biztonságosabb jogosultságkezelés",
        "Kevesebb fizikai kulcs",
        "Kényelmes megoldás modern belépéshez bonyolult rendszer nélkül",
      ],
      seoTitle: "Bejárati ajtók és mágneszárak vállalkozásoknak | WIFIGATE",
      seoDescription:
        "A WIFIGATE okos nyitást ad vállalkozások bejárati ajtóihoz és mágneszáraihoz, telefonos jogosultságkezeléssel, ideiglenes hozzáféréssel és kevesebb kód- vagy kulcsfüggéssel.",
      imageAlt: "Ügyfél telefonnal nyitja egy kisvállalkozás bejárati ajtaját",
    },
    "sports-facilities": {
      label: "Sportlétesítmények",
      title: "Okos beléptetés sportlétesítményekhez",
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
        "Sportlétesítményeknek, Padel-pályáknak, teniszpályáknak, edzőtermeknek és edzőközpontoknak nyitvatartás, foglalások és események szerint kell kezelniük a tagok, edzők, személyzet és vendégek hozzáférését. A WIFIGATE telefonról ad ideiglenes vagy állandó hozzáférést, csökkenti a közös kulcsoktól és kódoktól való függést, és javítja a belépési élményt olyan helyszíneken, ahol a forgalom napközben változik.",
      bullets: [
        "Alkalmas Padel-pályákhoz, teniszhez, edzőtermekhez és edzőközpontokhoz",
        "Hozzáférés nyitvatartás, foglalás vagy jogosultság szerint",
        "Tagok, edzők, munkatársak és vendégek kezelése",
        "Kevesebb függés közös kulcsoktól és kódoktól",
        "Gyors és kényelmes belépés telefonról",
        "Alkalmas változó nyitvatartású helyszínekhez",
        "Ideiglenes jogosultságok eseményekhez, órákhoz vagy edzésekhez",
        "Hozzáférési előzmények üzemeltetéshez és kontrollhoz",
      ],
      seoTitle: "Beléptetés sportlétesítményekhez és Padel-pályákhoz | WIFIGATE",
      seoDescription:
        "A WIFIGATE okos beléptetést ad sportlétesítményekhez, Padel-pályákhoz, edzőtermekhez és edzőközpontokhoz telefonos belépéssel, ideiglenes vagy állandó jogosultságokkal.",
      imageAlt: "Padel játékos telefonnal nyitja egy kivilágított sportpálya bejáratát",
    },
  },
};
