const copy = {
  navigation: {
    ariaLabel: "Huvudnavigation",
    toggleLabel: "Öppna eller stäng navigeringsmenyn",
    selectLanguageLabel: "Välj språk",
    platform: "Så fungerar det",
    solutions: "Användningsområden",
    automation: "WIFIGATE Host",
    productGuide: "Instruktionsvideor",
    contact: "Kontakta oss",
  },
  hero: {
    media: {"replay":"Spela videon igen","mute":"Stäng av ljudet","unmute":"Sätt på ljudet","pause":"Pausa videon","play":"Spela upp videon"},
    titleLines: ["En app.", "Alla dina ingångar."],
    subtitle: "Smart åtkomst och styrning för hem, byggnader, företag och boendeanläggningar. Allt på en plattform, enkelt och smidigt.",
    primaryCta: "Så fungerar det",
    secondaryCta: "Prata med vårt team",
    proofLabel: "Plattformens fördelar",
    proof: ["Fullständig integritet", "Enkel att använda", "Vägbeskrivning med ett tryck", "Tidsbegränsad gäståtkomst"],
  },
  platform: {
    eyebrow: "Vad är WIFIGATE?",
    title: "Åtkomst utan det vanliga krånglet.",
    subtitle: "WIFIGATE är ett krypterat passersystem som kombinerar WiFi och Bluetooth för att öppna grindar, dörrar, parkeringsbommar, garageportar och elektriska rulljalusier med mobilen. Det samlar daglig åtkomst och gäståtkomst på en säker plattform.",
    features: [
      {
        title: "Inget SIM-kort, ingen router",
        text: "WIFIGATE kommunicerar direkt med den installerade enheten. Vid ingången behövs därför inget SIM-kort, internetabonnemang eller någon extern WiFi-router.",
      },
      {
        title: "Stabilitet",
        text: "Den direkta anslutningen till enheten svarar direkt och lika snabbt varje gång, utan fördröjningar från en avlägsen server och oberoende av nätbelastning eller dålig täckning.",
      },
      {
        title: "Snabb gästinbjudan",
        text: "Skicka en säker inbjudan med vägbeskrivning till ett bud eller en gäst på några sekunder, så att besökare kommer in utan samtal, delade fjärrkontroller eller manuell samordning.",
      },
      {
        title: "Åtkomsthistorik för 90 dagar",
        text: "Se åtkomstaktiviteten för de senaste 90 dagarna och få en tydlig bild av hur grinden används och de senaste passagehändelserna.",
      },
      {
        title: "Automatisk öppning",
        text: "Låt behöriga användare öppna grinden automatiskt när de anländer, för en smidig och bekväm passage helt utan handgrepp.",
      },
      {
        title: "Upp till 50 schemalagda händelser",
        text: "Skapa återkommande scheman och automatiska åtgärder direkt i systemet, anpassade efter hur din anläggning drivs, inklusive stöd för sabbatsläge.",
      },
      {
        title: "Digital inlärning av RF-fjärrkontroller",
        text: "Lär in och hantera RF-fjärrkontroller digitalt via plattformen i stället för att förlita dig på krånglig manuell programmering.",
      },
      {
        title: "Säkerhet och integritet",
        text: "Kommunikationen med enheten och lagrade data är krypterade, så att åtkomsten till din fastighet och informationen om den förblir privat.",
      },
      {
        title: "Inga abonnemangsavgifter",
        text: "Du betalar en gång för WIFIGATE-enheten och installationen, utan månadsabonnemang, återkommande förnyelser eller löpande plattformsavgifter.",
      },
    ],
    subscriptionNote: "* Kommersiell användning av WIFIGATE Host kräver ett abonnemang.",
  },
  privateAccess: {
    imageAlt: "Ett bud följer en blå prickad rutt till entrén till ett flerbostadshus medan en boende håller upp WIFIGATE-appen som visar tidsbegränsad gäståtkomst.",
    eyebrow: "Privat åtkomst",
    title: "Byggnader och privata hem är inte offentliga rum.",
    description: "Sluta dela fasta porttelefonkoder. Skicka en tidsbegränsad behörighet med vägbeskrivning med ett enda tryck, och minska obehörigt tillträde och risken för stöld.",
  },
  solutions: {
    eyebrow: "Utformat för varje ingång",
    titleLines: ["Ett system.", "Alla vägar in."],
    subtitle: "Öppna med mobilen, ge åtkomst till den som behöver den och bestäm själv när den upphör.",
    imageAlt: "WIFIGATE-appen i en mobil med grinden hemma, arbetsplatsen och en tidsbegränsad gästbehörighet",
  },
  automation: {
    eyebrow: "Utformat för besöksnäringen",
    titleLines: ["WIFIGATE", "Host"],
    audienceLabel: "För",
    audiences: ["Hotell", "Airbnb", "Semesterlägenheter", "Boendeanläggningar"],
    promise: "Välkomna dina gäster. Låt åtkomsten sköta sig själv.",
    subtitle: "Från hotell till semesterlägenheter: koppla varje bokning till en säker behörighet för rätt grind, dörr eller garage. Gästerna kommer in med mobilen, och behörigheten börjar gälla vid incheckning och upphör automatiskt vid utcheckning.",
    cta: "Utforska WIFIGATE Host",
    imageAlt: "Gäster använder mobilen för att komma in i sitt boende",
    stayCaption: "Varje vistelse, från bokning till avresa",
    staySteps: ["Bokning mottagen", "Åtkomst vid incheckning", "Upphör vid utcheckning"],
    points: [
      {
        title: "Inga nycklar eller kort att lämna över",
        text: "Behörigheten kommer direkt till gästens mobil, utan nyckelhämtning, nyckelboxar eller koder att dela.",
      },
      {
        title: "Automatiskt tidsbegränsad",
        text: "Varje behörighet börjar gälla vid incheckning och upphör vid utcheckning, helt automatiskt.",
      },
      {
        icon: "team",
        title: "Sparar arbetstimmar",
        text: "Personalen kan fokusera på gästerna i stället för på logistiken kring nyckelkort och andra fysiska passermedel.",
      },
    ],
  },
  productGuide: {
    imageAlt: "Översikt över WIFIGATE-systemet: IP67-enheten, mobilappen och styrkortet med kopplingsplintar, USB Type-C och 12-24V-ingång, Wi-Fi 6, Bluetooth LE och en 433,92MHz-mottagare, tillsammans med plattformens funktioner – 500 användare, 20 administratörer, obegränsade gästinbjudningar, ett API för automatiserade gästinbjudningar, inget SIM-kort eller router, stabilitet, snabb gästinbjudan, 90 dagars historik, automatisk öppning, upp till 50 händelser, digital inlärning av RF-fjärrkontroller, säkerhet och integritet samt inga abonnemangsavgifter.",
    eyebrow: "Instruktionsvideor",
    title: "Enkelt från dag ett.",
    subtitle: "Tydlig vägledning för installation, daglig åtkomst och avancerad konfiguration.",
    items: [
      "Kom igång",
      "Anslut med en QR-kod",
      "Bjud in en gäst",
      "Öppna en ingång",
      "Lär in en RF-fjärrkontroll",
      "Konfigurera åtkomstlägen",
    ],
    status: "Kommer snart",
  },
  oneTapInvite: {
    imageAlt: "En blå prickad rutt leder från gatan till en platsmarkör vid entrén till ett flerbostadshus.",
    eyebrow: "Ett tryck. Allt gästerna behöver.",
    title: "Sluta upprepa vägbeskrivningen.\nSkicka en inbjudan med alla detaljer.",
    description: "Med WIFIGATE delar du vägbeskrivning, adress, våning,\nlägenhetsnummer, övriga detaljer och den tidsbegränsade behörigheten med ett tryck.",
  },
  faq: {
    eyebrow: "Allt om WiFi-grindar",
    title: "Åtkomst med WiFi-grind, utan frågetecken.",
    subtitle: "Tydliga svar om installation, anslutning, kostnader och gäståtkomst.",
    items: [
      {
        question: "Vad är ett WiFi-baserat passersystem för grindar?",
        answer: "Ett WiFi-baserat passersystem för grindar låter behöriga användare öppna grindar, dörrar, parkeringsbommar, garageportar och elektriska rulljalusier med mobilen. WIFIGATE samlar alla dessa ingångar på en säker plattform.",
      },
      {
        question: "Behöver WIFIGATE ett SIM-kort eller en extern WiFi-router?",
        answer: "Nej. WIFIGATE kommunicerar direkt med den installerade enheten, så det behövs inget SIM-kort, internetabonnemang eller någon extern WiFi-router vid ingången.",
      },
      {
        question: "Kräver WIFIGATE ett månadsabonnemang?",
        answer: "Nej. Du betalar en gång för WIFIGATE-enheten och installationen, utan månadsabonnemang, återkommande förnyelser eller löpande plattformsavgifter. WIFIGATE Host för kommersiell användning är det enda undantaget och kräver ett abonnemang.",
      },
      {
        question: "Kan WIFIGATE ge tillfällig gäståtkomst?",
        answer: "Ja. Du kan skicka en säker inbjudan som bara gäller under de datum och tider du väljer. Det passar hem, kontor, hotell, Airbnb-boenden och andra hanterade ingångar.",
      },
    ],
  },
  why: {
    eyebrow: "Varför WIFIGATE",
    title: "Global IoT-erfarenhet för varje ingång.",
    description: "Vårt team har gedigen erfarenhet av att utveckla och driftsätta IoT-system över hela världen. Den kompetensen använder vi för att göra WIFIGATE säkert, tillförlitligt och enkelt att installera, hantera och använda.",
    points: ["Dörr", "Grind", "Parkeringsbom", "Frihängande skjutgrind", "Elektromagnetiskt lås", "Elektrisk rulljalusi", "Belysning", "Pump"],
    pointsNote: "Och mer, beroende på vad du behöver styra.",
  },
  contact: {
    eyebrow: "Låt oss prata",
    title: "Gör varje ankomst enklare.",
    subtitle: "Berätta vad du vill öppna: en grind, en dörr, en elektrisk rulljalusi …\nVårt team hjälper dig att hitta rätt lösning.",
    distributorTitle: "Distributörsprogram",
    distributorText: "Du känner marknaden och kunderna. Vi står för produkten, utbildningen och supporten.",
    distributorButton: "Bli distributör",
    supportTitle: "Produktsupport",
    supportText: "Få praktisk hjälp från ett team som känner produkten och förstår din installation.",
    interestTitle: "Planera din åtkomstlösning tillsammans med oss",
    interestText: "Prata med oss om din fastighet, priser och den lösning som passar dina behov.",
    whatsappButton: "Chatta med oss på WhatsApp",
  },
  footer: {
    tagline: "Inga nycklar. Inga fjärrkontroller. Inga kort. Säker digital åtkomst utan att behöva vänta på att någon släpper in dig.",
    taglineLines: [
      "Inga nycklar. Inga fjärrkontroller. Inga kort.",
      "Säker digital åtkomst utan att behöva vänta på att någon släpper in dig.",
    ],
    legalTitle: "Juridisk information",
    terms: "Allmänna villkor",
    privacy: "Integritetspolicy",
    cookies: "Cookies",
    appSupportTitle: "App och support",
    socialTitle: "Följ oss",
    copyright: "WIFIGATE · EATS SYSTEMS TECH. Alla rättigheter förbehållna.",
  },
};

export default copy;
