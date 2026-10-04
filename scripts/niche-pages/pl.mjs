// scripts/niche-pages/pl.mjs
// Polish content for the homepage "where" section + the niche/use-case pages.
// Translated from the approved Hebrew source (he.mjs), with en.mjs as reference.

export default {
  home: {
    seoTitle: "WIFIGATE | Inteligentny dostęp do bram, drzwi i parkingów",
    seoDescription:
      "WIFIGATE to inteligentny system kontroli dostępu: otwieraj bramy, drzwi, parkingi, rolety i garaże z telefonu. Bezpiecznie, lokalnie i wygodnie, bez abonamentu.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, inteligentna kontrola dostępu, otwieranie bramy telefonem, brama automatyczna, kontrola dostępu do parkingu, sterowanie bramą z telefonu, bez abonamentu",
  },
  where: {
    title: "Gdzie sprawdzi się WIFIGATE?",
    subtitle:
      "WIFIGATE sprawdza się w wielu różnych środowiskach i zapewnia inteligentne, bezpieczne i wygodne zarządzanie dostępem, od domów jednorodzinnych po obiekty komercyjne i firmowe.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotele, Airbnb i apartamenty na wynajem",
      title: "Inteligentny dostęp dla hoteli, Airbnb i apartamentów na wynajem",
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
        "WIFIGATE pozwala gościom otrzymać wygodny i bezpieczny cyfrowy dostęp prosto na telefon, bez fizycznych kluczy, bez kart i bez zbędnych ustaleń z recepcją czy właścicielem obiektu. Dzięki WIFIGATE API proces rezerwacji można połączyć z systemem dostępu, tak aby w chwili potwierdzenia rezerwacji gość automatycznie otrzymywał dostęp gościnny ograniczony w czasie. Dostęp zaczyna działać w momencie zameldowania, kończy się automatycznie przy wymeldowaniu i znacząco ogranicza potrzebę przekazywania kluczy, udostępniania kodów czy ręcznej obsługi każdego gościa.",
      bullets: [
        "Automatyczny dostęp dla gościa po potwierdzeniu rezerwacji",
        "Pełna automatyzacja dzięki WIFIGATE API",
        "Dostęp tymczasowy dopasowany do dat i godzin pobytu",
        "Mniej ręcznych zameldowań, kluczy, kart i kodów",
        "Zarządzanie uprawnieniami personelu, ekip sprzątających, serwisu i dostawców",
        "Płynniejszy i wygodniejszy przyjazd dla gości",
        "Automatyczne wygaśnięcie dostępu przy wymeldowaniu",
        "Historia dostępu dla przejrzystości i kontroli",
      ],
      seoTitle: "Kontrola dostępu dla hoteli, Airbnb i apartamentów | WIFIGATE API",
      seoDescription:
        "WIFIGATE zapewnia cyfrowy dostęp w hotelach, Airbnb i apartamentach na wynajem: automatyczne uprawnienia gości przez WIFIGATE API, dostęp na czas pobytu i mniej kluczy.",
      imageAlt: "Goście otwierający drzwi pokoju hotelowego telefonem w nowoczesnym korytarzu",
    },
    "roller-shutters": {
      label: "Rolety antywłamaniowe dla firm i sklepów",
      title: "Inteligentne i bezpieczniejsze sterowanie roletami w firmach i sklepach",
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
        "Rolety antywłamaniowe w firmach i sklepach często obsługuje się pilotami, kluczami, zewnętrzną skrzynką na klucz lub przełącznikami zamontowanymi na zewnątrz lokalu. Takie rozwiązania mogą się zgubić, zostać u byłych pracowników, zostać skopiowane albo zamienić się w odsłonięty punkt dostępu. Otwieranie i zamykanie kluczem oznacza też konieczność stania tuż przy punkcie obsługi, z kluczem w dłoni, czasem bez wygodnego widoku na strefę rolety. WIFIGATE przenosi sterowanie do aplikacji i pozwala umieścić kontrolę dostępu po lepiej chronionej, wewnętrznej stronie, dzięki temu otwierasz i zamykasz wygodniej, zarządzasz uprawnieniami pracowników i dostawców oraz ograniczasz zależność od kluczy, pilotów i odsłoniętych punktów dostępu.",
      bullets: [
        "Otwieranie i zamykanie z telefonu, bez polegania na pilotach",
        "Mniejsza zależność od kluczy, które można skopiować lub zgubić",
        "Mniej odsłoniętych punktów dostępu na zewnątrz lokalu",
        "Wygodniejsze sterowanie z lepszym widokiem na strefę rolety",
        "Zarządzanie uprawnieniami pracowników, kierowników i dostawców",
        "Możliwość dostępu tymczasowego według godzin lub potrzeb",
        "Sprawdza się w sklepach, magazynach, wejściach serwisowych i firmach",
        "Uporządkowane, lepiej chronione rozwiązanie do codziennej pracy",
      ],
      seoTitle: "Inteligentne sterowanie roletami dla firm i sklepów | WIFIGATE",
      seoDescription:
        "WIFIGATE daje firmom i sklepom sterowanie roletami z telefonu: zarządzanie uprawnieniami, mniejsza zależność od kluczy i pilotów, mniej odsłoniętych punktów dostępu.",
      imageAlt: "Właściciel firmy otwierający roletę sklepu telefonem",
    },
    "electric-gates": {
      label: "Bramy automatyczne i szlabany parkingowe",
      title: "Inteligentne otwieranie bram automatycznych i szlabanów parkingowych",
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
        "Z bram automatycznych i szlabanów parkingowych korzystają mieszkańcy, pracownicy, goście i dostawcy, ale zarządzanie pilotami, kodami i telefonami z prośbą o otwarcie szybko staje się uciążliwe. WIFIGATE pozwala otwierać bramę z telefonu, udostępniać dostęp stały lub tymczasowy, korzystać z automatycznego otwierania dla stałych użytkowników i ustawiać zaplanowane zdarzenia według potrzeb. System jest zaprojektowany do pracy lokalnej, bezpiecznej i dbającej o prywatność, bez miesięcznego abonamentu i opłat cyklicznych, a dotychczasowe piloty mogą dalej działać równolegle ze sterowaniem z aplikacji.",
      bullets: [
        "Otwieranie bramy automatycznej lub szlabanu z telefonu",
        "Bez miesięcznego abonamentu i opłat cyklicznych",
        "Udostępnianie dostępu tymczasowego gościom, dostawcom i pracownikom",
        "Auto Open dla stałych użytkowników przy codziennym wjeździe",
        "Zaplanowane zdarzenia otwierania według dni i godzin",
        "Sterowanie z aplikacji lub dotychczasowymi pilotami",
        "Mniej rozdawania fizycznych pilotów",
        "Historia otwarć dla kontroli i przejrzystości",
      ],
      seoTitle: "Bramy automatyczne i szlabany bez abonamentu | WIFIGATE",
      seoDescription:
        "WIFIGATE otwiera bramy automatyczne i szlabany parkingowe z telefonu: Auto Open, zaplanowane zdarzenia, obsługa dotychczasowych pilotów i zero abonamentu.",
      imageAlt: "Kierowca otwierający szlaban parkingowy i bramę automatyczną telefonem",
    },
    "garage-doors": {
      label: "Bramy garażowe i parkingi prywatne",
      title: "Inteligentne otwieranie bram garażowych i parkingów prywatnych",
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
        "Bramy garażowe i wjazdy na parkingi prywatne zwykle obsługuje się fizycznymi pilotami, które mogą się zgubić, zostać u osób niepotrzebujących już dostępu, a w pewnych sytuacjach zostać skopiowane. WIFIGATE przenosi sterowanie do cyfrowego dostępu z telefonu: możesz zarządzać uprawnieniami członków rodziny, pracowników i gości oraz udostępniać dostęp tymczasowy bez przekazywania pilota czy kodu. Efekt to wygodniejsze, bardziej prywatne i lepiej uporządkowane korzystanie na co dzień, z mniejszą zależnością od fizycznych urządzeń dostępowych.",
      bullets: [
        "Otwieranie bramy garażowej z telefonu",
        "Mniejsza zależność od fizycznych pilotów",
        "Mniejsze ryzyko związane ze zgubionymi, przekazanymi lub skopiowanymi pilotami",
        "Zarządzanie dostępem dla rodziny, pracowników i gości",
        "Dostęp tymczasowy bez przekazywania pilota czy kodu",
        "Idealne dla parkingów prywatnych, domów i mieszkań z ogródkiem",
        "Bardziej lokalny i prywatny sposób zarządzania dostępem",
        "Wygodniejsza i bezpieczniejsza codzienna obsługa",
      ],
      seoTitle: "Inteligentne otwieranie bram garażowych z telefonu | WIFIGATE",
      seoDescription:
        "WIFIGATE otwiera bramy garażowe i parkingi prywatne z telefonu, mniejsza zależność od fizycznych pilotów, uprawnienia tymczasowe i prywatne zarządzanie dostępem.",
      imageAlt: "Mężczyzna otwierający prywatną bramę garażową telefonem przy nowoczesnym domu",
    },
    "private-homes": {
      label: "Domy jednorodzinne",
      title: "Inteligentny i bezpieczny dostęp do domu jednorodzinnego",
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
        "W domach jednorodzinnych klawiatury kodowe, klucze i piloty mogą stać się słabym punktem. Z czasem na przyciskach klawiatury pojawiają się ślady zużycia, piloty giną albo przechodzą z rąk do rąk, a kod bywa przekazywany kurierom, serwisantom czy gościom i zostaje u nich długo po tym, gdy przestaje być potrzebny. WIFIGATE pozwala zarządzać wejściem z telefonu, udostępniać tymczasowy dostęp gościnny bez ujawniania stałego kodu i łatwo cofać uprawnienia bez wymiany zamków, kodów czy pilotów.",
      bullets: [
        "Mniejsza zależność od klawiatur kodowych, kluczy i pilotów",
        "Dostęp tymczasowy dla kurierów, gości i serwisantów",
        "Łatwe cofanie uprawnień z telefonu",
        "Mniejsze ryzyko związane z udostępnianymi kodami i przekazywanymi pilotami",
        "Sprawdza się przy bramach, drzwiach, parkingach i garażach domu",
        "Proste zarządzanie dla rodziny i stałych użytkowników",
        "Wygodniejsze codzienne wchodzenie i wjeżdżanie",
        "Lepsza prywatność i kontrola nad tym, kto może wejść",
      ],
      seoTitle: "Inteligentny dostęp do domu bez wspólnego kodu | WIFIGATE",
      seoDescription:
        "WIFIGATE pozwala zarządzać dostępem do domu z telefonu, udostępniać tymczasowe uprawnienia gościom i kurierom oraz mniej polegać na kodach, kluczach i pilotach.",
      imageAlt: "Kobieta otwierająca telefonem bramę wejściową domu jednorodzinnego zamiast wpisywać kod",
    },
    "residential-buildings": {
      label: "Budynki mieszkalne",
      title: "Inteligentne zarządzanie dostępem w budynkach mieszkalnych",
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
        "W budynkach mieszkalnych wspólny kod wejściowy szybko rozchodzi się między mieszkańców, gości, kurierów, dostawców i serwisantów. Z czasem trudno stwierdzić, kto naprawdę ma dostęp do budynku i kiedy pora zmienić kod albo zebrać piloty. WIFIGATE pozwala mieszkańcom i wspólnocie zarządzać dostępem w bardziej uporządkowany sposób, nadawać gościom tymczasowe uprawnienia, ograniczyć zależność od wspólnego kodu i zachować lepszą kontrolę nad wejściem do budynku, na klatkę, przez bramę czy na parking.",
      bullets: [
        "Wygodny dostęp dla mieszkańców przez telefon",
        "Tymczasowe zaproszenia dla gości bez ujawniania stałego kodu",
        "Zarządzanie uprawnieniami mieszkańców, dostawców i serwisantów",
        "Sprawdza się przy drzwiach wejściowych, bramach i wjazdach na parking",
        "Mniejsza zależność od klawiatur kodowych, kluczy i pilotów",
        "Większa przejrzystość dzięki historii dostępu",
        "Prostsze zarządzanie dla wspólnoty lub zarządcy budynku",
        "Wygodniejsze wejście dla mieszkańców i gości",
      ],
      seoTitle: "Kontrola dostępu w budynkach mieszkalnych | WIFIGATE",
      seoDescription:
        "WIFIGATE wprowadza inteligentne zarządzanie dostępem w budynkach mieszkalnych: otwieranie telefonem, tymczasowe uprawnienia dla gości i większa przejrzystość.",
      imageAlt: "Mieszkanka otwierająca telefonem wejście do budynku mieszkalnego",
    },
    "office-buildings": {
      label: "Biurowce",
      title: "Inteligentny dostęp do biurowców",
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
        "Biurowce muszą zapewniać wygodne wejście pracownikom, gościom, dostawcom i zespołom technicznym, bez obciążania recepcji i bez ręcznego zarządzania kluczami czy kartami. WIFIGATE pozwala nadawać stałe uprawnienia pracownikom i tymczasowe odwiedzającym, kontrolować dostęp z telefonu i zarządzać wejściami w sposób, który pasuje do nowoczesnego, czystego i uporządkowanego środowiska biznesowego.",
      bullets: [
        "Stałe uprawnienia dla pracowników i zespołów",
        "Dostęp tymczasowy dla odwiedzających, dostawców i kurierów",
        "Mniejsze obciążenie recepcji i zespołu obsługi",
        "Sprawdza się przy drzwiach wejściowych, piętrach, pomieszczeniach i parkingach",
        "Uporządkowane zarządzanie użytkownikami i uprawnieniami",
        "Mniejsza zależność od kluczy, kart dostępu i kodów",
        "Nowocześniejszy i wygodniejszy wizerunek budynku",
        "Historia dostępu dla kontroli i przejrzystości",
      ],
      seoTitle: "Kontrola dostępu do biurowców | WIFIGATE",
      seoDescription:
        "WIFIGATE pozwala biurowcom zarządzać wejściem pracowników, gości i dostawców z telefonu, z tymczasowymi i stałymi uprawnieniami oraz nowoczesnym zarządzaniem dostępem.",
      imageAlt: "Pracownica otwierająca telefonem szklane drzwi w nowoczesnym biurze",
    },
    "entry-doors-magnetic-locks": {
      label: "Drzwi wejściowe i zamki magnetyczne dla firm",
      title: "Inteligentne otwieranie drzwi wejściowych i zamków magnetycznych w firmach",
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
        "Małe firmy, gabinety, studia, magazyny i biura często polegają na klawiaturze kodowej, kluczu lub prostym zamku magnetycznym. Problem zaczyna się, gdy kod krąży między pracownikami, dostawcami i gośćmi albo gdy trzeba dać komuś dostęp tymczasowy bez osłabiania bezpieczeństwa. WIFIGATE pozwala zarządzać drzwiami wejściowymi z telefonu, udostępniać tymczasowe uprawnienia i ograniczyć potrzebę stałych kodów, fizycznych kluczy czy ręcznych ustaleń przy każdym wejściu.",
      bullets: [
        "Sprawdza się przy drzwiach z zamkiem elektrycznym lub magnetycznym",
        "Otwieranie z telefonu dla pracowników i kierowników",
        "Dostęp tymczasowy dla gości, dostawców i serwisantów",
        "Mniejsza potrzeba klawiatury kodowej i stałego kodu",
        "Idealne dla małych firm, gabinetów, studiów i biur",
        "Prostsze i bezpieczniejsze zarządzanie uprawnieniami",
        "Mniej fizycznych kluczy w obiegu",
        "Wygodna opcja dla firm, które chcą nowoczesnego wejścia bez skomplikowanego systemu",
      ],
      seoTitle: "Drzwi wejściowe i zamki magnetyczne dla firm | WIFIGATE",
      seoDescription:
        "WIFIGATE wprowadza inteligentne otwieranie drzwi wejściowych i zamków magnetycznych w firmach: uprawnienia z telefonu, dostęp tymczasowy, mniej kodów i kluczy.",
      imageAlt: "Klientka otwierająca telefonem drzwi wejściowe małej firmy",
    },
    "sports-facilities": {
      label: "Obiekty sportowe",
      title: "Inteligentna kontrola dostępu do obiektów sportowych",
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
        "Obiekty sportowe, korty do padla, korty tenisowe, siłownie i strefy treningowe muszą zarządzać dostępem członków, trenerów, zespołów i gości zgodnie z godzinami otwarcia, rezerwacjami i wydarzeniami. WIFIGATE pozwala nadawać tymczasowy lub stały dostęp z telefonu, ograniczyć zależność od wspólnego klucza czy kodu i poprawić komfort wejścia, zwłaszcza w obiektach, w których ruch zmienia się w ciągu dnia.",
      bullets: [
        "Sprawdza się na kortach do padla, kortach tenisowych, siłowniach i w strefach treningowych",
        "Dostęp według godzin otwarcia, rezerwacji lub uprawnień",
        "Zarządzanie członkami, trenerami, pracownikami i gośćmi",
        "Mniejsza zależność od wspólnych kluczy i kodów",
        "Szybkie i wygodne wejście z telefonu",
        "Idealne dla obiektów o zmiennych godzinach otwarcia",
        "Tymczasowe uprawnienia na wydarzenia, zajęcia i treningi",
        "Historia dostępu dla kontroli i sprawnej obsługi",
      ],
      seoTitle: "Kontrola dostępu do obiektów sportowych i kortów do padla | WIFIGATE",
      seoDescription:
        "WIFIGATE zapewnia inteligentną kontrolę dostępu do obiektów sportowych, kortów do padla, siłowni i stref treningowych, wejście z telefonu i elastyczne uprawnienia.",
      imageAlt: "Zawodniczka padla otwierająca telefonem wejście na oświetlony kort",
    },
  },
};
