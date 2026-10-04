// scripts/niche-pages/it.mjs
// Italian content for the homepage "where" section + the niche/use-case pages,
// translated from the Hebrew (he.mjs) and English (en.mjs) source copy.

export default {
  home: {
    seoTitle: "WIFIGATE | Accessi smart per cancelli, porte e parcheggi",
    seoDescription:
      "WIFIGATE è il sistema di controllo accessi smart per aprire cancelli, porte, parcheggi, serrande e garage dal telefono. Sicuro, locale e senza canone mensile.",
    keywords:
      "WIFIGATE, WiFi Gate, wifi gate, controllo accessi smart, aprire il cancello dal telefono, cancello elettrico, apricancello con smartphone, controllo accessi condominio, apertura porte dal telefono, senza canone mensile",
  },
  where: {
    title: "Dove si può usare WIFIGATE?",
    subtitle:
      "WIFIGATE si adatta a un'ampia gamma di ambienti e offre una soluzione smart, sicura e comoda per la gestione degli accessi, dalle case private agli spazi commerciali e aziendali.",
  },
  niches: {
    "hotels-airbnb": {
      label: "Hotel, Airbnb e case vacanza",
      title: "Accesso smart per hotel, Airbnb e case vacanza",
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
        "WIFIGATE permette agli ospiti di ricevere un accesso digitale comodo e sicuro direttamente sul telefono, senza chiavi fisiche, senza tessere e senza inutili passaggi con la reception o il proprietario. Grazie a WIFIGATE API è possibile collegare il processo di prenotazione al sistema di accesso: appena una prenotazione viene confermata, l'ospite può ricevere automaticamente un accesso a tempo limitato. L'accesso si attiva al momento del check-in, termina automaticamente al check-out e riduce in modo significativo la necessità di consegnare chiavi, condividere codici o gestire manualmente ogni ospite.",
      bullets: [
        "Accesso ospite creato automaticamente alla conferma della prenotazione",
        "Automazione completa tramite WIFIGATE API",
        "Accesso temporaneo in base alle date e agli orari del soggiorno",
        "Meno check-in manuali, chiavi, tessere e codici",
        "Gestione dei permessi per staff, pulizie, manutenzione e fornitori",
        "Un'esperienza di arrivo più fluida e comoda per gli ospiti",
        "L'accesso termina automaticamente al check-out",
        "Cronologia degli accessi per trasparenza e controllo",
      ],
      seoTitle: "Controllo accessi per hotel, Airbnb e case vacanza | WIFIGATE API",
      seoDescription:
        "Accesso smart per hotel, Airbnb e case vacanza: permessi ospite automatici con WIFIGATE API, accessi temporanei per ogni prenotazione e meno check-in manuali.",
      imageAlt: "Ospiti che aprono la porta di una camera d'hotel con il telefono in un corridoio moderno",
    },
    "roller-shutters": {
      label: "Serrande per negozi e attività",
      title: "Controllo smart e più sicuro delle serrande per negozi e attività",
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
        "Le serrande di negozi e attività commerciali vengono spesso azionate con telecomandi, chiavi, una cassetta portachiavi esterna o interruttori montati fuori dal locale. Soluzioni di questo tipo possono andare perse, rimanere in mano a ex dipendenti, essere duplicate o trasformarsi in un punto di accesso esposto. Aprire o chiudere con la chiave, inoltre, obbliga a stare proprio accanto al punto di comando, con la chiave in mano e a volte senza una buona visuale sulla zona della serranda. WIFIGATE sposta il controllo nell'app e porta la gestione degli accessi sul lato interno, più protetto: puoi aprire e chiudere con più comodità, gestire i permessi di dipendenti e fornitori e ridurre la dipendenza da chiavi, telecomandi e punti di accesso esposti.",
      bullets: [
        "Apertura e chiusura dal telefono, senza dipendere dai telecomandi",
        "Meno dipendenza da chiavi che si possono duplicare o perdere",
        "Meno punti di accesso esposti all'esterno dell'attività",
        "Controllo più comodo, con una visuale migliore sulla zona della serranda",
        "Gestione dei permessi per dipendenti, responsabili e fornitori",
        "Possibilità di accessi temporanei in base a orari o necessità",
        "Ideale per negozi, magazzini, ingressi di servizio e attività commerciali",
        "Una soluzione interna, più ordinata e protetta per l'operatività quotidiana",
      ],
      seoTitle: "Controllo smart delle serrande per negozi e attività | WIFIGATE",
      seoDescription:
        "WIFIGATE dà a negozi e attività il controllo delle serrande dal telefono: gestione dei permessi, meno chiavi e telecomandi, meno punti di accesso esposti.",
      imageAlt: "Titolare di un'attività che apre la serranda del negozio con il telefono",
    },
    "electric-gates": {
      label: "Cancelli elettrici e sbarre per parcheggi",
      title: "Apertura smart per cancelli elettrici e sbarre per parcheggi",
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
        "Cancelli elettrici e sbarre per parcheggi servono ogni giorno residenti, dipendenti, ospiti e fornitori, ma gestire telecomandi, codici e telefonate per farsi aprire il cancello diventa presto complicato. Con WIFIGATE puoi aprire il cancello dal telefono, condividere accessi permanenti o temporanei, usare l'apertura automatica per gli utenti abituali e programmare eventi in base alle esigenze. Il sistema è progettato per funzionare in locale, in modo sicuro e riservato, senza abbonamento mensile né costi ricorrenti, e puoi continuare a usare i telecomandi esistenti insieme al controllo dall'app.",
      bullets: [
        "Apertura di cancelli elettrici e sbarre dal telefono",
        "Nessun abbonamento mensile e nessun costo ricorrente",
        "Condivisione di accessi temporanei con ospiti, fornitori e dipendenti",
        "Auto Open per gli utenti abituali nell'ingresso di ogni giorno",
        "Eventi programmati per aprire in giorni e orari stabiliti",
        "Controllo dall'app o con i telecomandi esistenti",
        "Meno telecomandi fisici da distribuire",
        "Cronologia delle aperture per controllo e trasparenza",
      ],
      seoTitle: "Apertura cancelli elettrici e sbarre senza canone | WIFIGATE",
      seoDescription:
        "WIFIGATE apre cancelli elettrici e sbarre per parcheggi dal telefono, con Auto Open, eventi programmati, supporto ai telecomandi esistenti e nessun canone mensile.",
      imageAlt: "Automobilista che apre una sbarra del parcheggio e un cancello elettrico con il telefono",
    },
    "garage-doors": {
      label: "Porte del garage e parcheggi privati",
      title: "Apertura smart per porte del garage e parcheggi privati",
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
        "Le porte del garage e gli ingressi dei parcheggi privati si azionano di solito con telecomandi fisici, che possono andare persi, rimanere a persone che non hanno più bisogno di accedere o, in certi casi, essere copiati. WIFIGATE sposta il controllo su un accesso digitale dal telefono: puoi gestire i permessi di familiari, dipendenti o ospiti e condividere un accesso temporaneo senza consegnare un telecomando o un codice. Il risultato è un'esperienza più comoda, più riservata e più ordinata, con meno dipendenza dai dispositivi di accesso fisici.",
      bullets: [
        "Apertura della porta del garage dal telefono",
        "Meno dipendenza dai telecomandi fisici",
        "Meno rischi legati a telecomandi persi, passati di mano o copiati",
        "Gestione degli accessi per familiari, dipendenti e ospiti",
        "Accesso temporaneo senza consegnare telecomandi o codici",
        "Ideale per parcheggi privati, case e appartamenti con giardino",
        "Un modo più locale e riservato di gestire gli accessi",
        "Un controllo quotidiano più comodo e sicuro",
      ],
      seoTitle: "Apertura smart per porte del garage e parcheggi privati | WIFIGATE",
      seoDescription:
        "WIFIGATE apre porte del garage e parcheggi privati dal telefono: meno telecomandi fisici, permessi temporanei e una gestione degli accessi più riservata.",
      imageAlt: "Uomo che apre la porta del garage di casa con il telefono in un'abitazione moderna",
    },
    "private-homes": {
      label: "Case private",
      title: "Accesso smart e sicuro per le case private",
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
        "Nelle case private, tastierini, chiavi e telecomandi possono diventare un punto debole. Col tempo i tasti del tastierino si consumano o si segnano, i telecomandi si perdono o passano di mano in mano, e il codice viene a volte comunicato a corrieri, tecnici o ospiti e resta con loro anche quando non serve più. WIFIGATE ti permette di gestire l'ingresso dal telefono, condividere un accesso ospite temporaneo senza rivelare un codice fisso e revocare i permessi con facilità, senza sostituire serrature, codici o telecomandi.",
      bullets: [
        "Meno dipendenza da tastierini, chiavi e telecomandi",
        "Accesso temporaneo per corrieri, ospiti e tecnici",
        "Revoca dei permessi in pochi tocchi dal telefono",
        "Meno rischi legati a codici condivisi o telecomandi passati di mano",
        "Ideale per cancelli, porte, parcheggi e garage di casa",
        "Gestione semplice per familiari e utenti abituali",
        "Un ingresso quotidiano più comodo",
        "Più privacy e più controllo su chi può entrare",
      ],
      seoTitle: "Accesso smart per la casa senza codici condivisi | WIFIGATE",
      seoDescription:
        "Con WIFIGATE gestisci l'accesso a casa dal telefono: permessi temporanei per ospiti e corrieri e meno dipendenza da tastierini, chiavi e telecomandi.",
      imageAlt: "Donna che apre il cancello d'ingresso di una casa privata con il telefono invece di usare il tastierino",
    },
    "residential-buildings": {
      label: "Condomini",
      title: "Gestione smart degli accessi per i condomini",
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
        "Nei condomini, il codice d'ingresso condiviso passa in fretta tra residenti, ospiti, corrieri, fornitori e tecnici. Col tempo diventa difficile sapere chi ha davvero accesso all'edificio e quando è il momento di cambiare il codice o ritirare i telecomandi. WIFIGATE permette a residenti e amministratore di gestire gli accessi in modo più ordinato, concedere permessi ospite temporanei, ridurre la dipendenza da un codice condiviso e mantenere un controllo migliore sugli ingressi di portone, androne, cancello e parcheggio.",
      bullets: [
        "Accesso comodo per i residenti direttamente dal telefono",
        "Inviti ospite temporanei senza rivelare un codice fisso",
        "Gestione dei permessi per residenti, fornitori e tecnici",
        "Ideale per portoni, cancelli e ingressi dei parcheggi",
        "Meno dipendenza da tastierini, chiavi e telecomandi",
        "Più trasparenza grazie alla cronologia degli accessi",
        "Gestione più semplice per l'amministratore o la società di gestione",
        "Un ingresso più comodo per residenti e ospiti",
      ],
      seoTitle: "Controllo accessi per condomini | WIFIGATE",
      seoDescription:
        "WIFIGATE porta la gestione smart degli accessi nei condomini: apertura dal telefono, permessi ospite temporanei, meno dipendenza dai tastierini e più trasparenza.",
      imageAlt: "Residente che apre l'ingresso di un condominio con il telefono",
    },
    "office-buildings": {
      label: "Edifici per uffici",
      title: "Accesso smart negli edifici per uffici",
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
        "Gli edifici per uffici devono garantire un ingresso comodo a dipendenti, visitatori, fornitori e squadre operative, senza sovraccaricare la reception e senza gestire a mano chiavi o tessere. WIFIGATE permette di assegnare permessi permanenti ai dipendenti e permessi temporanei ai visitatori, controllare gli accessi dal telefono e gestire gli ingressi in un modo adatto a un ambiente di lavoro moderno, pulito e ordinato.",
      bullets: [
        "Permessi permanenti per dipendenti e team",
        "Accesso temporaneo per visitatori, fornitori e corrieri",
        "Meno carico su reception e personale operativo",
        "Ideale per porte d'ingresso, piani, sale e parcheggi",
        "Gestione ordinata di utenti e permessi",
        "Meno dipendenza da chiavi, badge e codici",
        "Un'immagine più moderna e accogliente per l'edificio",
        "Cronologia degli accessi per controllo e trasparenza",
      ],
      seoTitle: "Controllo accessi per uffici e sedi aziendali | WIFIGATE",
      seoDescription:
        "WIFIGATE permette agli uffici di gestire dal telefono l'ingresso di dipendenti, visitatori e fornitori, con permessi temporanei o permanenti e più ordine.",
      imageAlt: "Impiegata che apre una porta a vetri in un ufficio moderno con il telefono",
    },
    "entry-doors-magnetic-locks": {
      label: "Porte d'ingresso e serrature magnetiche per aziende",
      title: "Apertura smart per porte d'ingresso e serrature magnetiche aziendali",
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
        "Piccole attività, ambulatori, studi, magazzini e uffici si affidano spesso a un tastierino, a una chiave o a una semplice serratura magnetica. Il problema nasce quando il codice passa tra dipendenti, fornitori e ospiti, o quando serve un accesso temporaneo senza indebolire la sicurezza. WIFIGATE permette di gestire la porta d'ingresso dal telefono, condividere permessi temporanei e ridurre la necessità di codici fissi, chiavi fisiche o coordinamento manuale a ogni ingresso.",
      bullets: [
        "Ideale per porte d'ingresso con elettroserratura o serratura magnetica",
        "Apertura dal telefono per dipendenti e responsabili",
        "Accesso temporaneo per ospiti, fornitori e tecnici",
        "Meno bisogno di tastierini o codici fissi",
        "Ideale per piccole attività, ambulatori, studi e uffici",
        "Gestione dei permessi più semplice e sicura",
        "Meno chiavi fisiche da gestire",
        "Una soluzione comoda per chi vuole un ingresso moderno senza sistemi complessi",
      ],
      seoTitle: "Porte d'ingresso e serrature magnetiche per aziende | WIFIGATE",
      seoDescription:
        "Apertura smart per porte d'ingresso e serrature magnetiche aziendali con WIFIGATE: permessi dal telefono, accessi temporanei, meno tastierini e chiavi.",
      imageAlt: "Cliente che apre la porta d'ingresso di una piccola attività con il telefono",
    },
    "sports-facilities": {
      label: "Impianti sportivi",
      title: "Controllo accessi smart per gli impianti sportivi",
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
        "Impianti sportivi, campi da padel, campi da tennis, palestre e centri di allenamento devono gestire l'accesso di soci, allenatori, squadre e ospiti in base a orari di apertura, prenotazioni ed eventi. WIFIGATE permette di concedere accessi temporanei o permanenti dal telefono, ridurre la dipendenza da una chiave o un codice condivisi e migliorare l'esperienza d'ingresso degli utenti, soprattutto nei centri dove il flusso di persone cambia durante la giornata.",
      bullets: [
        "Ideale per campi da padel, campi da tennis, palestre e centri di allenamento",
        "Accesso in base a orari di apertura, prenotazioni o permessi",
        "Gestione di soci, allenatori, dipendenti e ospiti",
        "Meno dipendenza da chiavi e codici condivisi",
        "Ingresso rapido e comodo dal telefono",
        "Ideale per strutture con orari di apertura variabili",
        "Permessi temporanei per eventi, corsi o allenamenti",
        "Cronologia degli accessi per controllo e gestione",
      ],
      seoTitle: "Controllo accessi per impianti sportivi e campi da padel | WIFIGATE",
      seoDescription:
        "WIFIGATE porta il controllo accessi smart in impianti sportivi, campi da padel e palestre, con ingresso dal telefono e permessi temporanei o permanenti.",
      imageAlt: "Giocatrice di padel che apre l'ingresso di un campo sportivo illuminato con il telefono",
    },
  },
};
