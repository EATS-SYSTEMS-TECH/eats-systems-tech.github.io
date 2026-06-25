// /js/guest-invites-home.js
// Localized copy for the "Automated Guest Invites API" homepage promo section
// and the dedicated interactive generator page.
//
// This file is consumed at build time by scripts/build-localized-site.mjs
// (it runs after translations-extra.js, so it can safely attach a new
// `guestInvites` namespace onto every locale bundle). English values double as
// the in-template defaults, so any locale that is missing a string falls back
// to readable English rather than an empty node.
(function () {
  if (typeof translations === "undefined") {
    return;
  }

  const guestInvites = {
    en: {
      promo: {
        eyebrow: "New · Developer API",
        title: "Automated Guest Invites API",
        subtitle:
          "Issue secure, time-limited guest access straight from your own systems. Connect your booking flow, CRM, or front desk and let WIFIGATE create invitations automatically — no manual steps, no shared remotes.",
        point1Title: "Built for automation",
        point1Text:
          "Create guest invitations programmatically from any backend with a single authenticated request.",
        point2Title: "Time-boxed access",
        point2Text:
          "Set exact start and end dates and times so every invite opens and expires precisely when it should.",
        point3Title: "Private and secure",
        point3Text:
          "Your API key stays in your environment and every value is safely encoded, so your data stays under your control.",
        cta: "Open the invite generator",
        consoleCaption: "Live request preview",
      },
      generator: {
        metaTitle: "Automated Guest Invites API | WIFIGATE",
        metaDescription:
          "Build and preview a WIFIGATE guest invitation API request. Add the guest details, choose access dates and times, and copy the ready-to-use URL.",
        breadcrumb: "Automated Guest Invites API",
        backToHome: "Back to home",
        heading: "Automated Guest Invites API",
        subheading:
          "Fill in the details below to build a guest invitation request. The URL updates live as you type — then copy it into your own integration.",
        formTitle: "Invitation details",
        apiKeyLabel: "API key",
        apiKeyHint:
          "Placeholder only. Replace WIFIGATE_GUESTS_API_KEY with your real key inside your own secure environment — never share it publicly.",
        guestNameLabel: "Guest name",
        guestPhoneLabel: "Guest phone",
        guestEmailLabel: "Guest email",
        dateStartLabel: "Start date",
        dateEndLabel: "End date",
        timeStartLabel: "Start time",
        timeEndLabel: "End time",
        commentLabel: "Comment",
        optionalTag: "Optional",
        previewTitle: "Generated URL",
        previewHint:
          "All values are URL-encoded automatically, including spaces, symbols, and non-Latin characters.",
        copyButton: "Copy URL",
        copiedButton: "Copied!",
        copyError: "Copy failed — select the URL and copy it manually.",
        mappingTitle: "Parameter mapping",
        mappingIntro: "Each placeholder in the URL maps to one field:",
        securityTitle: "Security note",
        securityNote:
          "This tool never calls the API and never sends your data anywhere. It only assembles the URL in your browser so you can use it in your own integration.",
      },
    },

    es: {
      promo: {
        eyebrow: "Nuevo · API para desarrolladores",
        title: "API de invitaciones automáticas para invitados",
        subtitle:
          "Genera accesos de invitado seguros y con tiempo limitado directamente desde tus propios sistemas. Conecta tu flujo de reservas, tu CRM o tu recepción y deja que WIFIGATE cree las invitaciones automáticamente, sin pasos manuales ni mandos compartidos.",
        point1Title: "Pensada para la automatización",
        point1Text:
          "Crea invitaciones de invitado mediante programación desde cualquier backend con una sola solicitud autenticada.",
        point2Title: "Acceso por tiempo limitado",
        point2Text:
          "Define fechas y horas exactas de inicio y fin para que cada invitación se abra y caduque justo cuando debe.",
        point3Title: "Privada y segura",
        point3Text:
          "Tu clave de API permanece en tu entorno y cada valor se codifica de forma segura, así tus datos siguen bajo tu control.",
        cta: "Abrir el generador de invitaciones",
        consoleCaption: "Vista previa de la solicitud en vivo",
      },
      generator: {
        metaTitle: "API de invitaciones automáticas para invitados | WIFIGATE",
        metaDescription:
          "Crea y previsualiza una solicitud de la API de invitaciones de WIFIGATE. Añade los datos del invitado, elige las fechas y horas de acceso y copia la URL lista para usar.",
        breadcrumb: "API de invitaciones automáticas para invitados",
        backToHome: "Volver al inicio",
        heading: "API de invitaciones automáticas para invitados",
        subheading:
          "Completa los datos para crear una solicitud de invitación. La URL se actualiza en vivo mientras escribes; luego cópiala en tu propia integración.",
        formTitle: "Datos de la invitación",
        apiKeyLabel: "Clave de API",
        apiKeyHint:
          "Solo un marcador de posición. Sustituye WIFIGATE_GUESTS_API_KEY por tu clave real dentro de tu propio entorno seguro y nunca la compartas públicamente.",
        guestNameLabel: "Nombre del invitado",
        guestPhoneLabel: "Teléfono del invitado",
        guestEmailLabel: "Correo del invitado",
        dateStartLabel: "Fecha de inicio",
        dateEndLabel: "Fecha de fin",
        timeStartLabel: "Hora de inicio",
        timeEndLabel: "Hora de fin",
        commentLabel: "Comentario",
        optionalTag: "Opcional",
        previewTitle: "URL generada",
        previewHint:
          "Todos los valores se codifican automáticamente para la URL, incluidos espacios, símbolos y caracteres no latinos.",
        copyButton: "Copiar URL",
        copiedButton: "¡Copiada!",
        copyError: "No se pudo copiar: selecciona la URL y cópiala manualmente.",
        mappingTitle: "Correspondencia de parámetros",
        mappingIntro: "Cada marcador de la URL corresponde a un campo:",
        securityTitle: "Nota de seguridad",
        securityNote:
          "Esta herramienta nunca llama a la API ni envía tus datos a ningún sitio. Solo construye la URL en tu navegador para que la uses en tu propia integración.",
      },
    },

    fr: {
      promo: {
        eyebrow: "Nouveau · API pour développeurs",
        title: "API d'invitations automatiques pour invités",
        subtitle:
          "Émettez des accès invités sécurisés et limités dans le temps directement depuis vos propres systèmes. Connectez votre flux de réservation, votre CRM ou votre accueil et laissez WIFIGATE créer les invitations automatiquement, sans étape manuelle ni télécommande partagée.",
        point1Title: "Conçue pour l'automatisation",
        point1Text:
          "Créez des invitations par programmation depuis n'importe quel backend avec une seule requête authentifiée.",
        point2Title: "Accès limité dans le temps",
        point2Text:
          "Définissez des dates et heures de début et de fin précises pour que chaque invitation s'ouvre et expire exactement au bon moment.",
        point3Title: "Privée et sécurisée",
        point3Text:
          "Votre clé d'API reste dans votre environnement et chaque valeur est encodée en toute sécurité : vos données restent sous votre contrôle.",
        cta: "Ouvrir le générateur d'invitations",
        consoleCaption: "Aperçu de la requête en direct",
      },
      generator: {
        metaTitle: "API d'invitations automatiques pour invités | WIFIGATE",
        metaDescription:
          "Construisez et prévisualisez une requête de l'API d'invitations WIFIGATE. Ajoutez les informations de l'invité, choisissez les dates et heures d'accès, puis copiez l'URL prête à l'emploi.",
        breadcrumb: "API d'invitations automatiques pour invités",
        backToHome: "Retour à l'accueil",
        heading: "API d'invitations automatiques pour invités",
        subheading:
          "Renseignez les champs ci-dessous pour construire une requête d'invitation. L'URL se met à jour en direct pendant que vous tapez, puis copiez-la dans votre propre intégration.",
        formTitle: "Détails de l'invitation",
        apiKeyLabel: "Clé d'API",
        apiKeyHint:
          "Valeur d'exemple uniquement. Remplacez WIFIGATE_GUESTS_API_KEY par votre vraie clé dans votre propre environnement sécurisé et ne la partagez jamais publiquement.",
        guestNameLabel: "Nom de l'invité",
        guestPhoneLabel: "Téléphone de l'invité",
        guestEmailLabel: "E-mail de l'invité",
        dateStartLabel: "Date de début",
        dateEndLabel: "Date de fin",
        timeStartLabel: "Heure de début",
        timeEndLabel: "Heure de fin",
        commentLabel: "Commentaire",
        optionalTag: "Facultatif",
        previewTitle: "URL générée",
        previewHint:
          "Toutes les valeurs sont automatiquement encodées pour l'URL, y compris les espaces, les symboles et les caractères non latins.",
        copyButton: "Copier l'URL",
        copiedButton: "Copiée !",
        copyError: "Échec de la copie — sélectionnez l'URL et copiez-la manuellement.",
        mappingTitle: "Correspondance des paramètres",
        mappingIntro: "Chaque valeur d'exemple dans l'URL correspond à un champ :",
        securityTitle: "Note de sécurité",
        securityNote:
          "Cet outil n'appelle jamais l'API et n'envoie vos données nulle part. Il assemble uniquement l'URL dans votre navigateur pour que vous l'utilisiez dans votre propre intégration.",
      },
    },

    de: {
      promo: {
        eyebrow: "Neu · Entwickler-API",
        title: "API für automatische Gästeeinladungen",
        subtitle:
          "Vergeben Sie sichere, zeitlich begrenzte Gastzugänge direkt aus Ihren eigenen Systemen. Verbinden Sie Ihren Buchungsablauf, Ihr CRM oder Ihren Empfang und lassen Sie WIFIGATE Einladungen automatisch erstellen – ohne manuelle Schritte und ohne geteilte Fernbedienungen.",
        point1Title: "Für Automatisierung gemacht",
        point1Text:
          "Erstellen Sie Gästeeinladungen programmgesteuert aus jedem Backend mit einer einzigen authentifizierten Anfrage.",
        point2Title: "Zeitlich begrenzter Zugang",
        point2Text:
          "Legen Sie genaue Start- und Enddaten sowie -zeiten fest, damit jede Einladung genau dann öffnet und abläuft, wann sie soll.",
        point3Title: "Privat und sicher",
        point3Text:
          "Ihr API-Schlüssel bleibt in Ihrer Umgebung und jeder Wert wird sicher kodiert, sodass Ihre Daten unter Ihrer Kontrolle bleiben.",
        cta: "Einladungs-Generator öffnen",
        consoleCaption: "Live-Vorschau der Anfrage",
      },
      generator: {
        metaTitle: "API für automatische Gästeeinladungen | WIFIGATE",
        metaDescription:
          "Erstellen und prüfen Sie eine Anfrage der WIFIGATE-API für Gästeeinladungen. Geben Sie die Gastdaten ein, wählen Sie Zugangsdaten und -zeiten und kopieren Sie die fertige URL.",
        breadcrumb: "API für automatische Gästeeinladungen",
        backToHome: "Zurück zur Startseite",
        heading: "API für automatische Gästeeinladungen",
        subheading:
          "Füllen Sie die Felder aus, um eine Einladungsanfrage zu erstellen. Die URL wird live aktualisiert, während Sie tippen – kopieren Sie sie anschließend in Ihre eigene Integration.",
        formTitle: "Einladungsdetails",
        apiKeyLabel: "API-Schlüssel",
        apiKeyHint:
          "Nur ein Platzhalter. Ersetzen Sie WIFIGATE_GUESTS_API_KEY durch Ihren echten Schlüssel in Ihrer eigenen sicheren Umgebung – geben Sie ihn niemals öffentlich weiter.",
        guestNameLabel: "Name des Gastes",
        guestPhoneLabel: "Telefon des Gastes",
        guestEmailLabel: "E-Mail des Gastes",
        dateStartLabel: "Startdatum",
        dateEndLabel: "Enddatum",
        timeStartLabel: "Startzeit",
        timeEndLabel: "Endzeit",
        commentLabel: "Kommentar",
        optionalTag: "Optional",
        previewTitle: "Generierte URL",
        previewHint:
          "Alle Werte werden automatisch URL-kodiert, einschließlich Leerzeichen, Symbolen und nicht-lateinischen Zeichen.",
        copyButton: "URL kopieren",
        copiedButton: "Kopiert!",
        copyError: "Kopieren fehlgeschlagen – markieren Sie die URL und kopieren Sie sie manuell.",
        mappingTitle: "Parameterzuordnung",
        mappingIntro: "Jeder Platzhalter in der URL ist einem Feld zugeordnet:",
        securityTitle: "Sicherheitshinweis",
        securityNote:
          "Dieses Tool ruft die API niemals auf und sendet Ihre Daten nirgendwohin. Es stellt die URL nur in Ihrem Browser zusammen, damit Sie sie in Ihrer eigenen Integration verwenden können.",
      },
    },

    he: {
      promo: {
        eyebrow: "חדש · API למפתחים",
        title: "API להזמנות אורחים אוטומטיות",
        subtitle:
          "הנפיקו גישת אורחים מאובטחת ומוגבלת בזמן ישירות מהמערכות שלכם. חברו את תהליך ההזמנות, ה-CRM או הקבלה ותנו ל-WIFIGATE ליצור הזמנות באופן אוטומטי — בלי שלבים ידניים ובלי שלטים משותפים.",
        point1Title: "בנוי לאוטומציה",
        point1Text:
          "צרו הזמנות אורחים באופן תכנותי מכל שרת אחורי באמצעות בקשה מאומתת אחת.",
        point2Title: "גישה מוגבלת בזמן",
        point2Text:
          "הגדירו תאריכים ושעות מדויקים של התחלה וסיום כך שכל הזמנה תיפתח ותפוג בדיוק מתי שצריך.",
        point3Title: "פרטי ומאובטח",
        point3Text:
          "מפתח ה-API נשאר בסביבה שלכם וכל ערך מקודד בבטחה, כך שהנתונים שלכם נשארים בשליטתכם.",
        cta: "פתחו את מחולל ההזמנות",
        consoleCaption: "תצוגה מקדימה חיה של הבקשה",
      },
      generator: {
        metaTitle: "API להזמנות אורחים אוטומטיות | WIFIGATE",
        metaDescription:
          "בנו וצפו בתצוגה מקדימה של בקשת API להזמנת אורח ב-WIFIGATE. הוסיפו את פרטי האורח, בחרו תאריכים ושעות גישה והעתיקו את כתובת ה-URL המוכנה לשימוש.",
        breadcrumb: "API להזמנות אורחים אוטומטיות",
        backToHome: "חזרה לדף הבית",
        heading: "API להזמנות אורחים אוטומטיות",
        subheading:
          "מלאו את הפרטים כדי לבנות בקשת הזמנה. כתובת ה-URL מתעדכנת בזמן אמת תוך כדי הקלדה — לאחר מכן העתיקו אותה אל האינטגרציה שלכם.",
        formTitle: "פרטי ההזמנה",
        apiKeyLabel: "מפתח API",
        apiKeyHint:
          "מציין מקום בלבד. החליפו את WIFIGATE_GUESTS_API_KEY במפתח האמיתי שלכם בתוך הסביבה המאובטחת שלכם — לעולם אל תשתפו אותו בפומבי.",
        guestNameLabel: "שם האורח",
        guestPhoneLabel: "טלפון האורח",
        guestEmailLabel: 'דוא"ל האורח',
        dateStartLabel: "תאריך התחלה",
        dateEndLabel: "תאריך סיום",
        timeStartLabel: "שעת התחלה",
        timeEndLabel: "שעת סיום",
        commentLabel: "הערה",
        optionalTag: "אופציונלי",
        previewTitle: "כתובת URL שנוצרה",
        previewHint:
          "כל הערכים מקודדים אוטומטית עבור כתובת ה-URL, כולל רווחים, סמלים ותווים שאינם לטיניים.",
        copyButton: "העתק URL",
        copiedButton: "הועתק!",
        copyError: "ההעתקה נכשלה — סמנו את כתובת ה-URL והעתיקו ידנית.",
        mappingTitle: "מיפוי פרמטרים",
        mappingIntro: "כל מציין מקום בכתובת ה-URL ממופה לשדה אחד:",
        securityTitle: "הערת אבטחה",
        securityNote:
          "הכלי הזה לעולם אינו קורא ל-API ואינו שולח את הנתונים שלכם לשום מקום. הוא רק מרכיב את כתובת ה-URL בדפדפן שלכם כדי שתשתמשו בה באינטגרציה שלכם.",
      },
    },

    nl: {
      promo: {
        eyebrow: "Nieuw · Ontwikkelaars-API",
        title: "API voor automatische gastuitnodigingen",
        subtitle:
          "Geef veilige, in tijd beperkte gasttoegang rechtstreeks vanuit je eigen systemen. Koppel je boekingsflow, CRM of receptie en laat WIFIGATE automatisch uitnodigingen aanmaken — zonder handmatige stappen en zonder gedeelde afstandsbedieningen.",
        point1Title: "Gemaakt voor automatisering",
        point1Text:
          "Maak gastuitnodigingen programmatisch aan vanuit elke backend met één geverifieerd verzoek.",
        point2Title: "Toegang met tijdslimiet",
        point2Text:
          "Stel exacte begin- en einddatums en -tijden in zodat elke uitnodiging precies opent en verloopt wanneer dat moet.",
        point3Title: "Privé en veilig",
        point3Text:
          "Je API-sleutel blijft in je eigen omgeving en elke waarde wordt veilig gecodeerd, zodat je gegevens onder jouw controle blijven.",
        cta: "Open de uitnodigingsgenerator",
        consoleCaption: "Live voorbeeld van het verzoek",
      },
      generator: {
        metaTitle: "API voor automatische gastuitnodigingen | WIFIGATE",
        metaDescription:
          "Bouw en bekijk een WIFIGATE API-verzoek voor een gastuitnodiging. Voeg de gastgegevens toe, kies toegangsdatums en -tijden en kopieer de kant-en-klare URL.",
        breadcrumb: "API voor automatische gastuitnodigingen",
        backToHome: "Terug naar home",
        heading: "API voor automatische gastuitnodigingen",
        subheading:
          "Vul de gegevens hieronder in om een uitnodigingsverzoek te bouwen. De URL wordt live bijgewerkt terwijl je typt — kopieer hem daarna naar je eigen integratie.",
        formTitle: "Uitnodigingsgegevens",
        apiKeyLabel: "API-sleutel",
        apiKeyHint:
          "Alleen een tijdelijke aanduiding. Vervang WIFIGATE_GUESTS_API_KEY door je echte sleutel binnen je eigen beveiligde omgeving — deel hem nooit openbaar.",
        guestNameLabel: "Naam van de gast",
        guestPhoneLabel: "Telefoon van de gast",
        guestEmailLabel: "E-mail van de gast",
        dateStartLabel: "Begindatum",
        dateEndLabel: "Einddatum",
        timeStartLabel: "Begintijd",
        timeEndLabel: "Eindtijd",
        commentLabel: "Opmerking",
        optionalTag: "Optioneel",
        previewTitle: "Gegenereerde URL",
        previewHint:
          "Alle waarden worden automatisch URL-gecodeerd, inclusief spaties, symbolen en niet-Latijnse tekens.",
        copyButton: "URL kopiëren",
        copiedButton: "Gekopieerd!",
        copyError: "Kopiëren mislukt — selecteer de URL en kopieer deze handmatig.",
        mappingTitle: "Parametertoewijzing",
        mappingIntro: "Elke tijdelijke aanduiding in de URL hoort bij één veld:",
        securityTitle: "Beveiligingsnotitie",
        securityNote:
          "Deze tool roept de API nooit aan en verstuurt je gegevens nergens naartoe. Hij stelt de URL alleen in je browser samen, zodat je hem in je eigen integratie kunt gebruiken.",
      },
    },

    it: {
      promo: {
        eyebrow: "Novità · API per sviluppatori",
        title: "API per inviti ospiti automatici",
        subtitle:
          "Rilascia accessi ospite sicuri e a tempo limitato direttamente dai tuoi sistemi. Collega il flusso di prenotazione, il CRM o la reception e lascia che WIFIGATE crei gli inviti automaticamente, senza passaggi manuali né telecomandi condivisi.",
        point1Title: "Pensata per l'automazione",
        point1Text:
          "Crea inviti per gli ospiti in modo programmatico da qualsiasi backend con una singola richiesta autenticata.",
        point2Title: "Accesso a tempo",
        point2Text:
          "Imposta date e orari precisi di inizio e fine così ogni invito si apre e scade esattamente quando deve.",
        point3Title: "Privata e sicura",
        point3Text:
          "La tua chiave API resta nel tuo ambiente e ogni valore viene codificato in sicurezza, così i tuoi dati restano sotto il tuo controllo.",
        cta: "Apri il generatore di inviti",
        consoleCaption: "Anteprima della richiesta in tempo reale",
      },
      generator: {
        metaTitle: "API per inviti ospiti automatici | WIFIGATE",
        metaDescription:
          "Crea e visualizza l'anteprima di una richiesta API per inviti ospite WIFIGATE. Aggiungi i dati dell'ospite, scegli date e orari di accesso e copia l'URL pronto all'uso.",
        breadcrumb: "API per inviti ospiti automatici",
        backToHome: "Torna alla home",
        heading: "API per inviti ospiti automatici",
        subheading:
          "Compila i campi qui sotto per creare una richiesta di invito. L'URL si aggiorna in tempo reale mentre scrivi: poi copialo nella tua integrazione.",
        formTitle: "Dettagli dell'invito",
        apiKeyLabel: "Chiave API",
        apiKeyHint:
          "Solo segnaposto. Sostituisci WIFIGATE_GUESTS_API_KEY con la tua chiave reale nel tuo ambiente sicuro e non condividerla mai pubblicamente.",
        guestNameLabel: "Nome dell'ospite",
        guestPhoneLabel: "Telefono dell'ospite",
        guestEmailLabel: "Email dell'ospite",
        dateStartLabel: "Data di inizio",
        dateEndLabel: "Data di fine",
        timeStartLabel: "Ora di inizio",
        timeEndLabel: "Ora di fine",
        commentLabel: "Commento",
        optionalTag: "Facoltativo",
        previewTitle: "URL generato",
        previewHint:
          "Tutti i valori vengono codificati automaticamente per l'URL, inclusi spazi, simboli e caratteri non latini.",
        copyButton: "Copia URL",
        copiedButton: "Copiato!",
        copyError: "Copia non riuscita — seleziona l'URL e copialo manualmente.",
        mappingTitle: "Mappatura dei parametri",
        mappingIntro: "Ogni segnaposto nell'URL corrisponde a un campo:",
        securityTitle: "Nota sulla sicurezza",
        securityNote:
          "Questo strumento non chiama mai l'API e non invia i tuoi dati da nessuna parte. Assembla solo l'URL nel tuo browser così puoi usarlo nella tua integrazione.",
      },
    },

    pt: {
      promo: {
        eyebrow: "Novo · API para programadores",
        title: "API de convites de convidados automáticos",
        subtitle:
          "Emita acessos de convidado seguros e por tempo limitado diretamente a partir dos seus próprios sistemas. Ligue o seu fluxo de reservas, o CRM ou a receção e deixe a WIFIGATE criar convites automaticamente, sem passos manuais nem comandos partilhados.",
        point1Title: "Feita para automação",
        point1Text:
          "Crie convites de convidados de forma programática a partir de qualquer backend com um único pedido autenticado.",
        point2Title: "Acesso por tempo limitado",
        point2Text:
          "Defina datas e horas exatas de início e fim para que cada convite abra e expire exatamente quando deve.",
        point3Title: "Privada e segura",
        point3Text:
          "A sua chave de API permanece no seu ambiente e cada valor é codificado em segurança, por isso os seus dados ficam sob o seu controlo.",
        cta: "Abrir o gerador de convites",
        consoleCaption: "Pré-visualização do pedido em direto",
      },
      generator: {
        metaTitle: "API de convites de convidados automáticos | WIFIGATE",
        metaDescription:
          "Crie e pré-visualize um pedido da API de convites de convidados da WIFIGATE. Adicione os dados do convidado, escolha datas e horas de acesso e copie o URL pronto a usar.",
        breadcrumb: "API de convites de convidados automáticos",
        backToHome: "Voltar ao início",
        heading: "API de convites de convidados automáticos",
        subheading:
          "Preencha os dados abaixo para construir um pedido de convite. O URL é atualizado em direto à medida que escreve — depois copie-o para a sua própria integração.",
        formTitle: "Detalhes do convite",
        apiKeyLabel: "Chave de API",
        apiKeyHint:
          "Apenas um marcador. Substitua WIFIGATE_GUESTS_API_KEY pela sua chave real dentro do seu próprio ambiente seguro — nunca a partilhe publicamente.",
        guestNameLabel: "Nome do convidado",
        guestPhoneLabel: "Telefone do convidado",
        guestEmailLabel: "E-mail do convidado",
        dateStartLabel: "Data de início",
        dateEndLabel: "Data de fim",
        timeStartLabel: "Hora de início",
        timeEndLabel: "Hora de fim",
        commentLabel: "Comentário",
        optionalTag: "Opcional",
        previewTitle: "URL gerado",
        previewHint:
          "Todos os valores são codificados automaticamente para o URL, incluindo espaços, símbolos e caracteres não latinos.",
        copyButton: "Copiar URL",
        copiedButton: "Copiado!",
        copyError: "Falha ao copiar — selecione o URL e copie-o manualmente.",
        mappingTitle: "Mapeamento de parâmetros",
        mappingIntro: "Cada marcador no URL corresponde a um campo:",
        securityTitle: "Nota de segurança",
        securityNote:
          "Esta ferramenta nunca chama a API e nunca envia os seus dados para lado nenhum. Apenas monta o URL no seu navegador para que o utilize na sua própria integração.",
      },
    },

    pl: {
      promo: {
        eyebrow: "Nowość · API dla deweloperów",
        title: "API automatycznych zaproszeń dla gości",
        subtitle:
          "Wydawaj bezpieczny, ograniczony czasowo dostęp dla gości bezpośrednio z własnych systemów. Połącz proces rezerwacji, CRM lub recepcję i pozwól WIFIGATE tworzyć zaproszenia automatycznie — bez ręcznych kroków i bez współdzielonych pilotów.",
        point1Title: "Stworzone do automatyzacji",
        point1Text:
          "Twórz zaproszenia dla gości programowo z dowolnego backendu za pomocą jednego uwierzytelnionego żądania.",
        point2Title: "Dostęp ograniczony czasowo",
        point2Text:
          "Ustaw dokładne daty i godziny rozpoczęcia oraz zakończenia, aby każde zaproszenie otwierało się i wygasało dokładnie wtedy, kiedy powinno.",
        point3Title: "Prywatne i bezpieczne",
        point3Text:
          "Twój klucz API pozostaje w Twoim środowisku, a każda wartość jest bezpiecznie kodowana, więc Twoje dane pozostają pod Twoją kontrolą.",
        cta: "Otwórz generator zaproszeń",
        consoleCaption: "Podgląd żądania na żywo",
      },
      generator: {
        metaTitle: "API automatycznych zaproszeń dla gości | WIFIGATE",
        metaDescription:
          "Zbuduj i podejrzyj żądanie API zaproszeń dla gości WIFIGATE. Dodaj dane gościa, wybierz daty i godziny dostępu i skopiuj gotowy adres URL.",
        breadcrumb: "API automatycznych zaproszeń dla gości",
        backToHome: "Powrót do strony głównej",
        heading: "API automatycznych zaproszeń dla gości",
        subheading:
          "Wypełnij poniższe pola, aby zbudować żądanie zaproszenia. Adres URL aktualizuje się na żywo podczas pisania — następnie skopiuj go do własnej integracji.",
        formTitle: "Szczegóły zaproszenia",
        apiKeyLabel: "Klucz API",
        apiKeyHint:
          "Tylko symbol zastępczy. Zastąp WIFIGATE_GUESTS_API_KEY swoim prawdziwym kluczem we własnym bezpiecznym środowisku — nigdy nie udostępniaj go publicznie.",
        guestNameLabel: "Imię gościa",
        guestPhoneLabel: "Telefon gościa",
        guestEmailLabel: "E-mail gościa",
        dateStartLabel: "Data rozpoczęcia",
        dateEndLabel: "Data zakończenia",
        timeStartLabel: "Godzina rozpoczęcia",
        timeEndLabel: "Godzina zakończenia",
        commentLabel: "Komentarz",
        optionalTag: "Opcjonalnie",
        previewTitle: "Wygenerowany adres URL",
        previewHint:
          "Wszystkie wartości są automatycznie kodowane do adresu URL, w tym spacje, symbole i znaki spoza alfabetu łacińskiego.",
        copyButton: "Kopiuj URL",
        copiedButton: "Skopiowano!",
        copyError: "Nie udało się skopiować — zaznacz adres URL i skopiuj go ręcznie.",
        mappingTitle: "Mapowanie parametrów",
        mappingIntro: "Każdy symbol zastępczy w adresie URL odpowiada jednemu polu:",
        securityTitle: "Uwaga dotycząca bezpieczeństwa",
        securityNote:
          "To narzędzie nigdy nie wywołuje API i nigdzie nie wysyła Twoich danych. Składa jedynie adres URL w Twojej przeglądarce, abyś mógł go użyć we własnej integracji.",
      },
    },

    no: {
      promo: {
        eyebrow: "Nytt · Utvikler-API",
        title: "API for automatiske gjesteinvitasjoner",
        subtitle:
          "Gi sikker, tidsbegrenset gjestetilgang rett fra dine egne systemer. Koble til bestillingsflyten, CRM-en eller resepsjonen og la WIFIGATE opprette invitasjoner automatisk — uten manuelle steg og uten delte fjernkontroller.",
        point1Title: "Bygd for automatisering",
        point1Text:
          "Opprett gjesteinvitasjoner programmatisk fra hvilken som helst backend med én autentisert forespørsel.",
        point2Title: "Tidsbegrenset tilgang",
        point2Text:
          "Angi nøyaktige start- og sluttdatoer og -tider slik at hver invitasjon åpnes og utløper akkurat når den skal.",
        point3Title: "Privat og sikker",
        point3Text:
          "API-nøkkelen din forblir i ditt miljø og hver verdi kodes trygt, slik at dataene dine forblir under din kontroll.",
        cta: "Åpne invitasjonsgeneratoren",
        consoleCaption: "Sanntidsforhåndsvisning av forespørselen",
      },
      generator: {
        metaTitle: "API for automatiske gjesteinvitasjoner | WIFIGATE",
        metaDescription:
          "Bygg og forhåndsvis en WIFIGATE API-forespørsel for gjesteinvitasjon. Legg til gjestedetaljene, velg tilgangsdatoer og -tider og kopier den ferdige URL-en.",
        breadcrumb: "API for automatiske gjesteinvitasjoner",
        backToHome: "Tilbake til forsiden",
        heading: "API for automatiske gjesteinvitasjoner",
        subheading:
          "Fyll inn detaljene nedenfor for å bygge en invitasjonsforespørsel. URL-en oppdateres i sanntid mens du skriver — kopier den deretter inn i din egen integrasjon.",
        formTitle: "Invitasjonsdetaljer",
        apiKeyLabel: "API-nøkkel",
        apiKeyHint:
          "Bare en plassholder. Erstatt WIFIGATE_GUESTS_API_KEY med din ekte nøkkel i ditt eget sikre miljø — del den aldri offentlig.",
        guestNameLabel: "Gjestens navn",
        guestPhoneLabel: "Gjestens telefon",
        guestEmailLabel: "Gjestens e-post",
        dateStartLabel: "Startdato",
        dateEndLabel: "Sluttdato",
        timeStartLabel: "Starttid",
        timeEndLabel: "Sluttid",
        commentLabel: "Kommentar",
        optionalTag: "Valgfritt",
        previewTitle: "Generert URL",
        previewHint:
          "Alle verdier kodes automatisk for URL-en, inkludert mellomrom, symboler og ikke-latinske tegn.",
        copyButton: "Kopier URL",
        copiedButton: "Kopiert!",
        copyError: "Kopiering mislyktes — merk URL-en og kopier den manuelt.",
        mappingTitle: "Parametertilordning",
        mappingIntro: "Hver plassholder i URL-en tilsvarer ett felt:",
        securityTitle: "Sikkerhetsmerknad",
        securityNote:
          "Dette verktøyet kaller aldri API-et og sender aldri dataene dine noe sted. Det setter bare sammen URL-en i nettleseren din slik at du kan bruke den i din egen integrasjon.",
      },
    },

    cs: {
      promo: {
        eyebrow: "Novinka · API pro vývojáře",
        title: "API pro automatické pozvánky pro hosty",
        subtitle:
          "Vydávejte bezpečný, časově omezený přístup pro hosty přímo z vlastních systémů. Propojte rezervační tok, CRM nebo recepci a nechte WIFIGATE vytvářet pozvánky automaticky — bez ručních kroků a bez sdílených ovladačů.",
        point1Title: "Vytvořeno pro automatizaci",
        point1Text:
          "Vytvářejte pozvánky pro hosty programově z libovolného backendu jediným ověřeným požadavkem.",
        point2Title: "Časově omezený přístup",
        point2Text:
          "Nastavte přesná data a časy začátku a konce, aby se každá pozvánka otevřela a vypršela přesně tehdy, kdy má.",
        point3Title: "Soukromé a bezpečné",
        point3Text:
          "Váš klíč API zůstává ve vašem prostředí a každá hodnota je bezpečně zakódována, takže vaše data zůstávají pod vaší kontrolou.",
        cta: "Otevřít generátor pozvánek",
        consoleCaption: "Živý náhled požadavku",
      },
      generator: {
        metaTitle: "API pro automatické pozvánky pro hosty | WIFIGATE",
        metaDescription:
          "Sestavte a zobrazte náhled požadavku API pro pozvánku hosta WIFIGATE. Přidejte údaje hosta, zvolte data a časy přístupu a zkopírujte hotovou URL adresu.",
        breadcrumb: "API pro automatické pozvánky pro hosty",
        backToHome: "Zpět na domovskou stránku",
        heading: "API pro automatické pozvánky pro hosty",
        subheading:
          "Vyplňte níže uvedené údaje a sestavte požadavek na pozvánku. URL se aktualizuje živě během psaní — poté ji zkopírujte do vlastní integrace.",
        formTitle: "Údaje pozvánky",
        apiKeyLabel: "Klíč API",
        apiKeyHint:
          "Pouze zástupný symbol. Nahraďte WIFIGATE_GUESTS_API_KEY svým skutečným klíčem ve vlastním zabezpečeném prostředí — nikdy jej veřejně nesdílejte.",
        guestNameLabel: "Jméno hosta",
        guestPhoneLabel: "Telefon hosta",
        guestEmailLabel: "E-mail hosta",
        dateStartLabel: "Datum začátku",
        dateEndLabel: "Datum konce",
        timeStartLabel: "Čas začátku",
        timeEndLabel: "Čas konce",
        commentLabel: "Komentář",
        optionalTag: "Volitelné",
        previewTitle: "Vygenerovaná URL",
        previewHint:
          "Všechny hodnoty se automaticky kódují pro URL, včetně mezer, symbolů a nelatinkových znaků.",
        copyButton: "Kopírovat URL",
        copiedButton: "Zkopírováno!",
        copyError: "Kopírování selhalo — označte URL a zkopírujte ji ručně.",
        mappingTitle: "Mapování parametrů",
        mappingIntro: "Každý zástupný symbol v URL odpovídá jednomu poli:",
        securityTitle: "Bezpečnostní poznámka",
        securityNote:
          "Tento nástroj nikdy nevolá API a nikam neodesílá vaše data. Pouze sestaví URL ve vašem prohlížeči, abyste ji mohli použít ve vlastní integraci.",
      },
    },

    ru: {
      promo: {
        eyebrow: "Новинка · API для разработчиков",
        title: "API автоматических приглашений для гостей",
        subtitle:
          "Выдавайте безопасный гостевой доступ с ограничением по времени прямо из ваших систем. Подключите процесс бронирования, CRM или стойку регистрации и позвольте WIFIGATE создавать приглашения автоматически — без ручных действий и без общих пультов.",
        point1Title: "Создано для автоматизации",
        point1Text:
          "Создавайте гостевые приглашения программно из любого бэкенда одним аутентифицированным запросом.",
        point2Title: "Доступ с ограничением по времени",
        point2Text:
          "Задавайте точные даты и время начала и окончания, чтобы каждое приглашение открывалось и истекало именно тогда, когда нужно.",
        point3Title: "Конфиденциально и безопасно",
        point3Text:
          "Ваш ключ API остаётся в вашей среде, а каждое значение безопасно кодируется, поэтому ваши данные остаются под вашим контролем.",
        cta: "Открыть генератор приглашений",
        consoleCaption: "Предпросмотр запроса в реальном времени",
      },
      generator: {
        metaTitle: "API автоматических приглашений для гостей | WIFIGATE",
        metaDescription:
          "Создайте и просмотрите запрос API приглашения гостя WIFIGATE. Добавьте данные гостя, выберите даты и время доступа и скопируйте готовый URL.",
        breadcrumb: "API автоматических приглашений для гостей",
        backToHome: "Вернуться на главную",
        heading: "API автоматических приглашений для гостей",
        subheading:
          "Заполните поля ниже, чтобы создать запрос приглашения. URL обновляется в реальном времени по мере ввода — затем скопируйте его в свою интеграцию.",
        formTitle: "Данные приглашения",
        apiKeyLabel: "Ключ API",
        apiKeyHint:
          "Только заполнитель. Замените WIFIGATE_GUESTS_API_KEY на свой настоящий ключ в собственной защищённой среде — никогда не публикуйте его.",
        guestNameLabel: "Имя гостя",
        guestPhoneLabel: "Телефон гостя",
        guestEmailLabel: "Эл. почта гостя",
        dateStartLabel: "Дата начала",
        dateEndLabel: "Дата окончания",
        timeStartLabel: "Время начала",
        timeEndLabel: "Время окончания",
        commentLabel: "Комментарий",
        optionalTag: "Необязательно",
        previewTitle: "Сгенерированный URL",
        previewHint:
          "Все значения автоматически кодируются для URL, включая пробелы, символы и нелатинские символы.",
        copyButton: "Копировать URL",
        copiedButton: "Скопировано!",
        copyError: "Не удалось скопировать — выделите URL и скопируйте вручную.",
        mappingTitle: "Сопоставление параметров",
        mappingIntro: "Каждый заполнитель в URL соответствует одному полю:",
        securityTitle: "Примечание о безопасности",
        securityNote:
          "Этот инструмент никогда не вызывает API и никуда не отправляет ваши данные. Он лишь собирает URL в вашем браузере, чтобы вы могли использовать его в своей интеграции.",
      },
    },

    uk: {
      promo: {
        eyebrow: "Нове · API для розробників",
        title: "API автоматичних запрошень для гостей",
        subtitle:
          "Видавайте безпечний гостьовий доступ з обмеженням у часі прямо з ваших систем. Підключіть процес бронювання, CRM або стійку реєстрації та дозвольте WIFIGATE створювати запрошення автоматично — без ручних кроків і без спільних пультів.",
        point1Title: "Створено для автоматизації",
        point1Text:
          "Створюйте гостьові запрошення програмно з будь-якого бекенду одним автентифікованим запитом.",
        point2Title: "Доступ з обмеженням у часі",
        point2Text:
          "Задавайте точні дати й час початку та завершення, щоб кожне запрошення відкривалося та завершувалося саме тоді, коли потрібно.",
        point3Title: "Приватно й безпечно",
        point3Text:
          "Ваш ключ API залишається у вашому середовищі, а кожне значення безпечно кодується, тож ваші дані лишаються під вашим контролем.",
        cta: "Відкрити генератор запрошень",
        consoleCaption: "Перегляд запиту в реальному часі",
      },
      generator: {
        metaTitle: "API автоматичних запрошень для гостей | WIFIGATE",
        metaDescription:
          "Створіть і перегляньте запит API запрошення гостя WIFIGATE. Додайте дані гостя, оберіть дати й час доступу та скопіюйте готову URL-адресу.",
        breadcrumb: "API автоматичних запрошень для гостей",
        backToHome: "Назад на головну",
        heading: "API автоматичних запрошень для гостей",
        subheading:
          "Заповніть поля нижче, щоб створити запит на запрошення. URL-адреса оновлюється в реальному часі під час введення — потім скопіюйте її у власну інтеграцію.",
        formTitle: "Деталі запрошення",
        apiKeyLabel: "Ключ API",
        apiKeyHint:
          "Лише заповнювач. Замініть WIFIGATE_GUESTS_API_KEY на свій справжній ключ у власному захищеному середовищі — ніколи не діліться ним публічно.",
        guestNameLabel: "Ім'я гостя",
        guestPhoneLabel: "Телефон гостя",
        guestEmailLabel: "Ел. пошта гостя",
        dateStartLabel: "Дата початку",
        dateEndLabel: "Дата завершення",
        timeStartLabel: "Час початку",
        timeEndLabel: "Час завершення",
        commentLabel: "Коментар",
        optionalTag: "Необов'язково",
        previewTitle: "Згенерована URL-адреса",
        previewHint:
          "Усі значення автоматично кодуються для URL-адреси, включно з пробілами, символами та нелатинськими знаками.",
        copyButton: "Копіювати URL",
        copiedButton: "Скопійовано!",
        copyError: "Не вдалося скопіювати — виділіть URL-адресу та скопіюйте вручну.",
        mappingTitle: "Зіставлення параметрів",
        mappingIntro: "Кожен заповнювач в URL-адресі відповідає одному полю:",
        securityTitle: "Примітка щодо безпеки",
        securityNote:
          "Цей інструмент ніколи не викликає API та нікуди не надсилає ваші дані. Він лише збирає URL-адресу у вашому браузері, щоб ви могли використати її у власній інтеграції.",
      },
    },

    tr: {
      promo: {
        eyebrow: "Yeni · Geliştirici API'si",
        title: "Otomatik Misafir Davetleri API'si",
        subtitle:
          "Güvenli, süreyle sınırlı misafir erişimini doğrudan kendi sistemlerinizden verin. Rezervasyon akışınızı, CRM'inizi veya resepsiyonunuzu bağlayın ve WIFIGATE'in davetleri otomatik oluşturmasına izin verin — manuel adım yok, paylaşılan kumanda yok.",
        point1Title: "Otomasyon için tasarlandı",
        point1Text:
          "Tek bir kimlik doğrulamalı istekle herhangi bir arka uçtan programatik olarak misafir davetleri oluşturun.",
        point2Title: "Süreyle sınırlı erişim",
        point2Text:
          "Her davetin tam olması gereken anda açılıp sona ermesi için kesin başlangıç ve bitiş tarihleri ile saatleri ayarlayın.",
        point3Title: "Özel ve güvenli",
        point3Text:
          "API anahtarınız kendi ortamınızda kalır ve her değer güvenli şekilde kodlanır, böylece verileriniz sizin kontrolünüzde kalır.",
        cta: "Davet oluşturucuyu aç",
        consoleCaption: "Canlı istek önizlemesi",
      },
      generator: {
        metaTitle: "Otomatik Misafir Davetleri API'si | WIFIGATE",
        metaDescription:
          "Bir WIFIGATE misafir daveti API isteği oluşturun ve önizleyin. Misafir bilgilerini ekleyin, erişim tarih ve saatlerini seçin ve kullanıma hazır URL'yi kopyalayın.",
        breadcrumb: "Otomatik Misafir Davetleri API'si",
        backToHome: "Ana sayfaya dön",
        heading: "Otomatik Misafir Davetleri API'si",
        subheading:
          "Bir davet isteği oluşturmak için aşağıdaki bilgileri doldurun. URL siz yazdıkça canlı olarak güncellenir — ardından kendi entegrasyonunuza kopyalayın.",
        formTitle: "Davet bilgileri",
        apiKeyLabel: "API anahtarı",
        apiKeyHint:
          "Yalnızca yer tutucu. WIFIGATE_GUESTS_API_KEY değerini kendi güvenli ortamınızda gerçek anahtarınızla değiştirin — bunu asla herkese açık paylaşmayın.",
        guestNameLabel: "Misafir adı",
        guestPhoneLabel: "Misafir telefonu",
        guestEmailLabel: "Misafir e-postası",
        dateStartLabel: "Başlangıç tarihi",
        dateEndLabel: "Bitiş tarihi",
        timeStartLabel: "Başlangıç saati",
        timeEndLabel: "Bitiş saati",
        commentLabel: "Yorum",
        optionalTag: "İsteğe bağlı",
        previewTitle: "Oluşturulan URL",
        previewHint:
          "Boşluklar, semboller ve Latin olmayan karakterler dahil tüm değerler otomatik olarak URL için kodlanır.",
        copyButton: "URL'yi kopyala",
        copiedButton: "Kopyalandı!",
        copyError: "Kopyalama başarısız — URL'yi seçip elle kopyalayın.",
        mappingTitle: "Parametre eşlemesi",
        mappingIntro: "URL'deki her yer tutucu bir alana karşılık gelir:",
        securityTitle: "Güvenlik notu",
        securityNote:
          "Bu araç API'yi asla çağırmaz ve verilerinizi hiçbir yere göndermez. URL'yi yalnızca tarayıcınızda oluşturur, böylece kendi entegrasyonunuzda kullanabilirsiniz.",
      },
    },

    ar: {
      promo: {
        eyebrow: "جديد · واجهة برمجة للمطورين",
        title: "واجهة برمجة دعوات الضيوف التلقائية",
        subtitle:
          "امنح وصولاً آمناً ومحدوداً بوقت للضيوف مباشرةً من أنظمتك الخاصة. اربط مسار الحجز أو نظام إدارة العملاء أو مكتب الاستقبال، ودع WIFIGATE ينشئ الدعوات تلقائياً — دون خطوات يدوية ودون أجهزة تحكم مشتركة.",
        point1Title: "مصمَّمة للأتمتة",
        point1Text:
          "أنشئ دعوات الضيوف برمجياً من أي خادم خلفي بطلب واحد موثَّق.",
        point2Title: "وصول محدد بوقت",
        point2Text:
          "حدد تواريخ وأوقات بدء وانتهاء دقيقة بحيث تُفتح كل دعوة وتنتهي في الوقت المطلوب تماماً.",
        point3Title: "خاص وآمن",
        point3Text:
          "يبقى مفتاح الواجهة في بيئتك، ويُرمَّز كل قيمة بأمان، لتبقى بياناتك تحت سيطرتك.",
        cta: "افتح مولّد الدعوات",
        consoleCaption: "معاينة مباشرة للطلب",
      },
      generator: {
        metaTitle: "واجهة برمجة دعوات الضيوف التلقائية | WIFIGATE",
        metaDescription:
          "أنشئ وعاين طلب واجهة برمجة دعوة ضيف من WIFIGATE. أضف بيانات الضيف، واختر تواريخ وأوقات الوصول، وانسخ الرابط الجاهز للاستخدام.",
        breadcrumb: "واجهة برمجة دعوات الضيوف التلقائية",
        backToHome: "العودة إلى الصفحة الرئيسية",
        heading: "واجهة برمجة دعوات الضيوف التلقائية",
        subheading:
          "املأ التفاصيل أدناه لإنشاء طلب دعوة. يتحدث الرابط مباشرةً أثناء الكتابة — ثم انسخه إلى تكاملك الخاص.",
        formTitle: "تفاصيل الدعوة",
        apiKeyLabel: "مفتاح الواجهة",
        apiKeyHint:
          "عنصر نائب فقط. استبدل WIFIGATE_GUESTS_API_KEY بمفتاحك الحقيقي داخل بيئتك الآمنة — ولا تشاركه علناً أبداً.",
        guestNameLabel: "اسم الضيف",
        guestPhoneLabel: "هاتف الضيف",
        guestEmailLabel: "بريد الضيف الإلكتروني",
        dateStartLabel: "تاريخ البدء",
        dateEndLabel: "تاريخ الانتهاء",
        timeStartLabel: "وقت البدء",
        timeEndLabel: "وقت الانتهاء",
        commentLabel: "ملاحظة",
        optionalTag: "اختياري",
        previewTitle: "الرابط المُنشأ",
        previewHint:
          "تُرمَّز جميع القيم تلقائياً للرابط، بما في ذلك المسافات والرموز والأحرف غير اللاتينية.",
        copyButton: "نسخ الرابط",
        copiedButton: "تم النسخ!",
        copyError: "تعذّر النسخ — حدد الرابط وانسخه يدوياً.",
        mappingTitle: "تعيين المعاملات",
        mappingIntro: "كل عنصر نائب في الرابط يقابل حقلاً واحداً:",
        securityTitle: "ملاحظة أمنية",
        securityNote:
          "لا تستدعي هذه الأداة الواجهة أبداً ولا ترسل بياناتك إلى أي مكان. إنها تجمّع الرابط فقط في متصفحك لتستخدمه في تكاملك الخاص.",
      },
    },

    hi: {
      promo: {
        eyebrow: "नया · डेवलपर API",
        title: "स्वचालित अतिथि निमंत्रण API",
        subtitle:
          "अपने ही सिस्टम से सुरक्षित, समय-सीमित अतिथि पहुँच जारी करें। अपने बुकिंग फ़्लो, CRM या रिसेप्शन को जोड़ें और WIFIGATE को निमंत्रण अपने आप बनाने दें — कोई मैन्युअल चरण नहीं, कोई साझा रिमोट नहीं।",
        point1Title: "स्वचालन के लिए बना",
        point1Text:
          "एक ही प्रमाणित अनुरोध से किसी भी बैकएंड से प्रोग्रामेटिक रूप से अतिथि निमंत्रण बनाएँ।",
        point2Title: "समय-सीमित पहुँच",
        point2Text:
          "सटीक आरंभ और समाप्ति तिथियाँ तथा समय निर्धारित करें ताकि हर निमंत्रण ठीक उसी समय खुले और समाप्त हो जब उसे होना चाहिए।",
        point3Title: "निजी और सुरक्षित",
        point3Text:
          "आपकी API कुंजी आपके ही परिवेश में रहती है और हर मान सुरक्षित रूप से एनकोड किया जाता है, इसलिए आपका डेटा आपके नियंत्रण में रहता है।",
        cta: "निमंत्रण जनरेटर खोलें",
        consoleCaption: "लाइव अनुरोध पूर्वावलोकन",
      },
      generator: {
        metaTitle: "स्वचालित अतिथि निमंत्रण API | WIFIGATE",
        metaDescription:
          "WIFIGATE अतिथि निमंत्रण API अनुरोध बनाएँ और उसका पूर्वावलोकन करें। अतिथि का विवरण जोड़ें, पहुँच की तिथियाँ और समय चुनें और उपयोग के लिए तैयार URL कॉपी करें।",
        breadcrumb: "स्वचालित अतिथि निमंत्रण API",
        backToHome: "होम पर वापस जाएँ",
        heading: "स्वचालित अतिथि निमंत्रण API",
        subheading:
          "निमंत्रण अनुरोध बनाने के लिए नीचे विवरण भरें। टाइप करते ही URL लाइव अपडेट होता है — फिर इसे अपने एकीकरण में कॉपी करें।",
        formTitle: "निमंत्रण विवरण",
        apiKeyLabel: "API कुंजी",
        apiKeyHint:
          "केवल प्लेसहोल्डर। WIFIGATE_GUESTS_API_KEY को अपने सुरक्षित परिवेश में अपनी असली कुंजी से बदलें — इसे कभी सार्वजनिक रूप से साझा न करें।",
        guestNameLabel: "अतिथि का नाम",
        guestPhoneLabel: "अतिथि का फ़ोन",
        guestEmailLabel: "अतिथि का ईमेल",
        dateStartLabel: "आरंभ तिथि",
        dateEndLabel: "समाप्ति तिथि",
        timeStartLabel: "आरंभ समय",
        timeEndLabel: "समाप्ति समय",
        commentLabel: "टिप्पणी",
        optionalTag: "वैकल्पिक",
        previewTitle: "जनरेट किया गया URL",
        previewHint:
          "सभी मान URL के लिए स्वतः एनकोड किए जाते हैं, जिनमें स्पेस, चिह्न और गैर-लैटिन अक्षर शामिल हैं।",
        copyButton: "URL कॉपी करें",
        copiedButton: "कॉपी हो गया!",
        copyError: "कॉपी विफल — URL चुनें और इसे मैन्युअल रूप से कॉपी करें।",
        mappingTitle: "पैरामीटर मैपिंग",
        mappingIntro: "URL में हर प्लेसहोल्डर एक फ़ील्ड से मेल खाता है:",
        securityTitle: "सुरक्षा नोट",
        securityNote:
          "यह टूल कभी API को कॉल नहीं करता और आपका डेटा कहीं नहीं भेजता। यह केवल आपके ब्राउज़र में URL तैयार करता है ताकि आप इसे अपने एकीकरण में उपयोग कर सकें।",
      },
    },

    bn: {
      promo: {
        eyebrow: "নতুন · ডেভেলপার API",
        title: "স্বয়ংক্রিয় অতিথি আমন্ত্রণ API",
        subtitle:
          "আপনার নিজস্ব সিস্টেম থেকেই নিরাপদ, সময়-সীমিত অতিথি প্রবেশাধিকার দিন। আপনার বুকিং ফ্লো, CRM বা রিসেপশন যুক্ত করুন এবং WIFIGATE-কে স্বয়ংক্রিয়ভাবে আমন্ত্রণ তৈরি করতে দিন — কোনো ম্যানুয়াল ধাপ নেই, শেয়ার করা রিমোট নেই।",
        point1Title: "অটোমেশনের জন্য তৈরি",
        point1Text:
          "একটি মাত্র প্রমাণীকৃত অনুরোধে যেকোনো ব্যাকএন্ড থেকে প্রোগ্রাম্যাটিকভাবে অতিথি আমন্ত্রণ তৈরি করুন।",
        point2Title: "সময়-সীমিত প্রবেশাধিকার",
        point2Text:
          "সঠিক শুরু ও শেষের তারিখ এবং সময় নির্ধারণ করুন যাতে প্রতিটি আমন্ত্রণ ঠিক যখন প্রয়োজন তখনই খোলে ও মেয়াদ শেষ হয়।",
        point3Title: "ব্যক্তিগত ও নিরাপদ",
        point3Text:
          "আপনার API কী আপনার পরিবেশেই থাকে এবং প্রতিটি মান নিরাপদে এনকোড করা হয়, তাই আপনার ডেটা আপনার নিয়ন্ত্রণে থাকে।",
        cta: "আমন্ত্রণ জেনারেটর খুলুন",
        consoleCaption: "লাইভ অনুরোধ প্রিভিউ",
      },
      generator: {
        metaTitle: "স্বয়ংক্রিয় অতিথি আমন্ত্রণ API | WIFIGATE",
        metaDescription:
          "একটি WIFIGATE অতিথি আমন্ত্রণ API অনুরোধ তৈরি করুন ও প্রিভিউ দেখুন। অতিথির তথ্য যোগ করুন, প্রবেশের তারিখ ও সময় বেছে নিন এবং ব্যবহারের জন্য প্রস্তুত URL কপি করুন।",
        breadcrumb: "স্বয়ংক্রিয় অতিথি আমন্ত্রণ API",
        backToHome: "হোমে ফিরে যান",
        heading: "স্বয়ংক্রিয় অতিথি আমন্ত্রণ API",
        subheading:
          "একটি আমন্ত্রণ অনুরোধ তৈরি করতে নিচের তথ্য পূরণ করুন। আপনি টাইপ করার সাথে সাথে URL লাইভ আপডেট হয় — তারপর এটি আপনার নিজস্ব ইন্টিগ্রেশনে কপি করুন।",
        formTitle: "আমন্ত্রণের বিবরণ",
        apiKeyLabel: "API কী",
        apiKeyHint:
          "শুধুমাত্র প্লেসহোল্ডার। আপনার নিরাপদ পরিবেশে WIFIGATE_GUESTS_API_KEY-কে আপনার আসল কী দিয়ে প্রতিস্থাপন করুন — কখনও এটি প্রকাশ্যে শেয়ার করবেন না।",
        guestNameLabel: "অতিথির নাম",
        guestPhoneLabel: "অতিথির ফোন",
        guestEmailLabel: "অতিথির ইমেল",
        dateStartLabel: "শুরুর তারিখ",
        dateEndLabel: "শেষের তারিখ",
        timeStartLabel: "শুরুর সময়",
        timeEndLabel: "শেষের সময়",
        commentLabel: "মন্তব্য",
        optionalTag: "ঐচ্ছিক",
        previewTitle: "তৈরি করা URL",
        previewHint:
          "স্পেস, চিহ্ন এবং নন-ল্যাটিন অক্ষরসহ সব মান স্বয়ংক্রিয়ভাবে URL-এর জন্য এনকোড করা হয়।",
        copyButton: "URL কপি করুন",
        copiedButton: "কপি হয়েছে!",
        copyError: "কপি ব্যর্থ — URL নির্বাচন করে ম্যানুয়ালি কপি করুন।",
        mappingTitle: "প্যারামিটার ম্যাপিং",
        mappingIntro: "URL-এর প্রতিটি প্লেসহোল্ডার একটি ফিল্ডের সাথে মেলে:",
        securityTitle: "নিরাপত্তা নোট",
        securityNote:
          "এই টুলটি কখনও API কল করে না এবং আপনার ডেটা কোথাও পাঠায় না। এটি শুধু আপনার ব্রাউজারে URL তৈরি করে যাতে আপনি এটি আপনার নিজস্ব ইন্টিগ্রেশনে ব্যবহার করতে পারেন।",
      },
    },

    mr: {
      promo: {
        eyebrow: "नवीन · डेव्हलपर API",
        title: "स्वयंचलित अतिथी आमंत्रण API",
        subtitle:
          "तुमच्या स्वतःच्या प्रणालींमधूनच सुरक्षित, वेळ-मर्यादित अतिथी प्रवेश द्या. तुमचा बुकिंग फ्लो, CRM किंवा रिसेप्शन जोडा आणि WIFIGATE ला आमंत्रणे आपोआप तयार करू द्या — कोणतीही मॅन्युअल पायरी नाही, सामायिक रिमोट नाही.",
        point1Title: "ऑटोमेशनसाठी तयार",
        point1Text:
          "एकाच प्रमाणित विनंतीद्वारे कोणत्याही बॅकएंडवरून प्रोग्रामॅटिकरीत्या अतिथी आमंत्रणे तयार करा.",
        point2Title: "वेळ-मर्यादित प्रवेश",
        point2Text:
          "अचूक प्रारंभ व समाप्ती तारखा आणि वेळा सेट करा जेणेकरून प्रत्येक आमंत्रण नेमके हवे तेव्हाच उघडेल आणि संपेल.",
        point3Title: "खाजगी आणि सुरक्षित",
        point3Text:
          "तुमची API की तुमच्याच परिसरात राहते आणि प्रत्येक मूल्य सुरक्षितपणे एन्कोड केले जाते, त्यामुळे तुमचा डेटा तुमच्या नियंत्रणात राहतो.",
        cta: "आमंत्रण जनरेटर उघडा",
        consoleCaption: "थेट विनंती पूर्वावलोकन",
      },
      generator: {
        metaTitle: "स्वयंचलित अतिथी आमंत्रण API | WIFIGATE",
        metaDescription:
          "WIFIGATE अतिथी आमंत्रण API विनंती तयार करा आणि पूर्वावलोकन पाहा. अतिथीचे तपशील जोडा, प्रवेशाच्या तारखा व वेळा निवडा आणि वापरण्यासाठी तयार URL कॉपी करा.",
        breadcrumb: "स्वयंचलित अतिथी आमंत्रण API",
        backToHome: "मुख्यपृष्ठावर परत जा",
        heading: "स्वयंचलित अतिथी आमंत्रण API",
        subheading:
          "आमंत्रण विनंती तयार करण्यासाठी खालील तपशील भरा. तुम्ही टाइप करताच URL थेट अपडेट होते — नंतर ते तुमच्या स्वतःच्या एकत्रीकरणात कॉपी करा.",
        formTitle: "आमंत्रण तपशील",
        apiKeyLabel: "API की",
        apiKeyHint:
          "फक्त प्लेसहोल्डर. तुमच्या सुरक्षित परिसरात WIFIGATE_GUESTS_API_KEY ला तुमच्या खऱ्या कीने बदला — ते कधीही सार्वजनिकपणे शेअर करू नका.",
        guestNameLabel: "अतिथीचे नाव",
        guestPhoneLabel: "अतिथीचा फोन",
        guestEmailLabel: "अतिथीचा ईमेल",
        dateStartLabel: "प्रारंभ तारीख",
        dateEndLabel: "समाप्ती तारीख",
        timeStartLabel: "प्रारंभ वेळ",
        timeEndLabel: "समाप्ती वेळ",
        commentLabel: "टिप्पणी",
        optionalTag: "पर्यायी",
        previewTitle: "तयार केलेले URL",
        previewHint:
          "स्पेस, चिन्हे आणि बिगर-लॅटिन अक्षरांसह सर्व मूल्ये URL साठी आपोआप एन्कोड केली जातात.",
        copyButton: "URL कॉपी करा",
        copiedButton: "कॉपी झाले!",
        copyError: "कॉपी अयशस्वी — URL निवडा आणि ते मॅन्युअली कॉपी करा.",
        mappingTitle: "पॅरामीटर मॅपिंग",
        mappingIntro: "URL मधील प्रत्येक प्लेसहोल्डर एका फील्डशी जुळतो:",
        securityTitle: "सुरक्षा टीप",
        securityNote:
          "हे साधन कधीही API ला कॉल करत नाही आणि तुमचा डेटा कुठेही पाठवत नाही. ते फक्त तुमच्या ब्राउझरमध्ये URL तयार करते जेणेकरून तुम्ही ते तुमच्या स्वतःच्या एकत्रीकरणात वापरू शकता.",
      },
    },

    te: {
      promo: {
        eyebrow: "కొత్తది · డెవలపర్ API",
        title: "ఆటోమేటెడ్ గెస్ట్ ఇన్వైట్స్ API",
        subtitle:
          "మీ స్వంత సిస్టమ్‌ల నుండే సురక్షితమైన, కాల-పరిమిత అతిథి యాక్సెస్‌ను జారీ చేయండి. మీ బుకింగ్ ఫ్లో, CRM లేదా రిసెప్షన్‌ను అనుసంధానించి, WIFIGATE ఆహ్వానాలను స్వయంచాలకంగా రూపొందించనివ్వండి — మాన్యువల్ దశలు లేవు, షేర్డ్ రిమోట్‌లు లేవు.",
        point1Title: "ఆటోమేషన్ కోసం రూపొందించబడింది",
        point1Text:
          "ఒకే ప్రామాణీకృత అభ్యర్థనతో ఏ బ్యాకెండ్ నుండైనా ప్రోగ్రామాటిక్‌గా అతిథి ఆహ్వానాలను రూపొందించండి.",
        point2Title: "కాల-పరిమిత యాక్సెస్",
        point2Text:
          "ప్రతి ఆహ్వానం సరిగ్గా కావలసిన సమయంలోనే తెరుచుకుని ముగిసేలా ఖచ్చితమైన ప్రారంభ, ముగింపు తేదీలు మరియు సమయాలను సెట్ చేయండి.",
        point3Title: "ప్రైవేట్ మరియు సురక్షితం",
        point3Text:
          "మీ API కీ మీ పరిసరంలోనే ఉంటుంది మరియు ప్రతి విలువ సురక్షితంగా ఎన్‌కోడ్ అవుతుంది, కాబట్టి మీ డేటా మీ నియంత్రణలోనే ఉంటుంది.",
        cta: "ఇన్వైట్ జెనరేటర్‌ను తెరవండి",
        consoleCaption: "ప్రత్యక్ష అభ్యర్థన ప్రివ్యూ",
      },
      generator: {
        metaTitle: "ఆటోమేటెడ్ గెస్ట్ ఇన్వైట్స్ API | WIFIGATE",
        metaDescription:
          "WIFIGATE అతిథి ఆహ్వాన API అభ్యర్థనను రూపొందించి ప్రివ్యూ చూడండి. అతిథి వివరాలను జోడించి, యాక్సెస్ తేదీలు, సమయాలను ఎంచుకుని, వాడకానికి సిద్ధమైన URLని కాపీ చేయండి.",
        breadcrumb: "ఆటోమేటెడ్ గెస్ట్ ఇన్వైట్స్ API",
        backToHome: "హోమ్‌కు తిరిగి వెళ్లండి",
        heading: "ఆటోమేటెడ్ గెస్ట్ ఇన్వైట్స్ API",
        subheading:
          "ఆహ్వాన అభ్యర్థనను రూపొందించడానికి కింది వివరాలను నింపండి. మీరు టైప్ చేస్తుండగానే URL ప్రత్యక్షంగా అప్‌డేట్ అవుతుంది — తర్వాత దానిని మీ స్వంత ఇంటిగ్రేషన్‌లోకి కాపీ చేయండి.",
        formTitle: "ఆహ్వాన వివరాలు",
        apiKeyLabel: "API కీ",
        apiKeyHint:
          "ప్లేస్‌హోల్డర్ మాత్రమే. మీ సురక్షిత పరిసరంలో WIFIGATE_GUESTS_API_KEYని మీ నిజమైన కీతో భర్తీ చేయండి — దానిని ఎప్పుడూ బహిరంగంగా పంచుకోవద్దు.",
        guestNameLabel: "అతిథి పేరు",
        guestPhoneLabel: "అతిథి ఫోన్",
        guestEmailLabel: "అతిథి ఇమెయిల్",
        dateStartLabel: "ప్రారంభ తేదీ",
        dateEndLabel: "ముగింపు తేదీ",
        timeStartLabel: "ప్రారంభ సమయం",
        timeEndLabel: "ముగింపు సమయం",
        commentLabel: "వ్యాఖ్య",
        optionalTag: "ఐచ్ఛికం",
        previewTitle: "రూపొందించిన URL",
        previewHint:
          "ఖాళీలు, చిహ్నాలు మరియు లాటిన్ యేతర అక్షరాలతో సహా అన్ని విలువలు URL కోసం స్వయంచాలకంగా ఎన్‌కోడ్ చేయబడతాయి.",
        copyButton: "URLని కాపీ చేయండి",
        copiedButton: "కాపీ అయింది!",
        copyError: "కాపీ విఫలమైంది — URLని ఎంచుకుని మాన్యువల్‌గా కాపీ చేయండి.",
        mappingTitle: "పారామితి మ్యాపింగ్",
        mappingIntro: "URLలోని ప్రతి ప్లేస్‌హోల్డర్ ఒక ఫీల్డ్‌కు సరిపోతుంది:",
        securityTitle: "భద్రతా గమనిక",
        securityNote:
          "ఈ సాధనం ఎప్పుడూ APIని కాల్ చేయదు మరియు మీ డేటాను ఎక్కడికీ పంపదు. ఇది మీ బ్రౌజర్‌లో URLని మాత్రమే సమకూరుస్తుంది, తద్వారా మీరు దానిని మీ స్వంత ఇంటిగ్రేషన్‌లో వాడుకోవచ్చు.",
      },
    },

    "zh-Hans": {
      promo: {
        eyebrow: "全新 · 开发者 API",
        title: "自动访客邀请 API",
        subtitle:
          "直接从您自己的系统签发安全、限时的访客权限。接入您的预订流程、CRM 或前台，让 WIFIGATE 自动创建邀请——无需手动步骤，无需共享遥控器。",
        point1Title: "为自动化而生",
        point1Text: "通过一次经过身份验证的请求，从任意后端以编程方式创建访客邀请。",
        point2Title: "限时访问",
        point2Text: "设置精确的开始和结束日期与时间，让每个邀请都在该开启和过期的时刻准确生效。",
        point3Title: "私密且安全",
        point3Text: "您的 API 密钥保留在您的环境中，每个值都会被安全编码，您的数据始终由您掌控。",
        cta: "打开邀请生成器",
        consoleCaption: "请求实时预览",
      },
      generator: {
        metaTitle: "自动访客邀请 API | WIFIGATE",
        metaDescription:
          "构建并预览 WIFIGATE 访客邀请 API 请求。填写访客信息，选择访问日期和时间，然后复制即用型 URL。",
        breadcrumb: "自动访客邀请 API",
        backToHome: "返回首页",
        heading: "自动访客邀请 API",
        subheading:
          "填写下方信息以构建邀请请求。URL 会在您输入时实时更新——随后将其复制到您自己的集成中。",
        formTitle: "邀请详情",
        apiKeyLabel: "API 密钥",
        apiKeyHint:
          "仅为占位符。请在您自己的安全环境中将 WIFIGATE_GUESTS_API_KEY 替换为真实密钥——切勿公开分享。",
        guestNameLabel: "访客姓名",
        guestPhoneLabel: "访客电话",
        guestEmailLabel: "访客邮箱",
        dateStartLabel: "开始日期",
        dateEndLabel: "结束日期",
        timeStartLabel: "开始时间",
        timeEndLabel: "结束时间",
        commentLabel: "备注",
        optionalTag: "可选",
        previewTitle: "生成的 URL",
        previewHint: "所有值都会自动进行 URL 编码，包括空格、符号和非拉丁字符。",
        copyButton: "复制 URL",
        copiedButton: "已复制！",
        copyError: "复制失败——请选中 URL 并手动复制。",
        mappingTitle: "参数映射",
        mappingIntro: "URL 中的每个占位符对应一个字段：",
        securityTitle: "安全提示",
        securityNote:
          "此工具绝不会调用 API，也绝不会将您的数据发送到任何地方。它只在您的浏览器中组装 URL，供您在自己的集成中使用。",
      },
    },

    "zh-Hant": {
      promo: {
        eyebrow: "全新 · 開發者 API",
        title: "自動訪客邀請 API",
        subtitle:
          "直接從您自己的系統簽發安全、限時的訪客權限。接入您的預訂流程、CRM 或前台，讓 WIFIGATE 自動建立邀請——無需手動步驟，無需共用遙控器。",
        point1Title: "為自動化而生",
        point1Text: "透過一次經過身分驗證的請求，從任意後端以程式化方式建立訪客邀請。",
        point2Title: "限時存取",
        point2Text: "設定精確的開始與結束日期及時間，讓每個邀請都在該開啟和到期的時刻準確生效。",
        point3Title: "私密且安全",
        point3Text: "您的 API 金鑰保留在您的環境中，每個值都會被安全編碼，您的資料始終由您掌控。",
        cta: "開啟邀請產生器",
        consoleCaption: "請求即時預覽",
      },
      generator: {
        metaTitle: "自動訪客邀請 API | WIFIGATE",
        metaDescription:
          "建立並預覽 WIFIGATE 訪客邀請 API 請求。填寫訪客資訊，選擇存取日期和時間，然後複製即用型 URL。",
        breadcrumb: "自動訪客邀請 API",
        backToHome: "返回首頁",
        heading: "自動訪客邀請 API",
        subheading:
          "填寫下方資訊以建立邀請請求。URL 會在您輸入時即時更新——隨後將其複製到您自己的整合中。",
        formTitle: "邀請詳情",
        apiKeyLabel: "API 金鑰",
        apiKeyHint:
          "僅為佔位符。請在您自己的安全環境中將 WIFIGATE_GUESTS_API_KEY 替換為真實金鑰——切勿公開分享。",
        guestNameLabel: "訪客姓名",
        guestPhoneLabel: "訪客電話",
        guestEmailLabel: "訪客電子郵件",
        dateStartLabel: "開始日期",
        dateEndLabel: "結束日期",
        timeStartLabel: "開始時間",
        timeEndLabel: "結束時間",
        commentLabel: "備註",
        optionalTag: "選填",
        previewTitle: "產生的 URL",
        previewHint: "所有值都會自動進行 URL 編碼，包括空格、符號和非拉丁字元。",
        copyButton: "複製 URL",
        copiedButton: "已複製！",
        copyError: "複製失敗——請選取 URL 並手動複製。",
        mappingTitle: "參數對應",
        mappingIntro: "URL 中的每個佔位符對應一個欄位：",
        securityTitle: "安全提示",
        securityNote:
          "此工具絕不會呼叫 API，也絕不會將您的資料傳送到任何地方。它只在您的瀏覽器中組合 URL，供您在自己的整合中使用。",
      },
    },

    ja: {
      promo: {
        eyebrow: "新着 · 開発者向け API",
        title: "ゲスト招待自動化 API",
        subtitle:
          "安全で期限付きのゲストアクセスを、自社システムから直接発行できます。予約フローや CRM、フロントを連携すれば、WIFIGATE が招待を自動作成します。手作業も共有リモコンも不要です。",
        point1Title: "自動化のための設計",
        point1Text:
          "認証済みのリクエスト1回で、任意のバックエンドからプログラムでゲスト招待を作成できます。",
        point2Title: "期限付きアクセス",
        point2Text:
          "開始と終了の日時を正確に設定でき、各招待が必要なタイミングで開き、期限切れになります。",
        point3Title: "プライベートで安全",
        point3Text:
          "API キーはお客様の環境内に留まり、各値は安全にエンコードされるため、データは常にお客様の管理下にあります。",
        cta: "招待ジェネレーターを開く",
        consoleCaption: "リクエストのライブプレビュー",
      },
      generator: {
        metaTitle: "ゲスト招待自動化 API | WIFIGATE",
        metaDescription:
          "WIFIGATE のゲスト招待 API リクエストを作成してプレビューします。ゲスト情報を入力し、アクセスの日時を選び、そのまま使える URL をコピーできます。",
        breadcrumb: "ゲスト招待自動化 API",
        backToHome: "ホームに戻る",
        heading: "ゲスト招待自動化 API",
        subheading:
          "以下の項目を入力して招待リクエストを作成します。入力すると URL がリアルタイムで更新されるので、自社の連携にコピーしてください。",
        formTitle: "招待の詳細",
        apiKeyLabel: "API キー",
        apiKeyHint:
          "プレースホルダーのみです。WIFIGATE_GUESTS_API_KEY は、ご自身の安全な環境内で本物のキーに置き換えてください。公開して共有しないでください。",
        guestNameLabel: "ゲスト名",
        guestPhoneLabel: "ゲストの電話番号",
        guestEmailLabel: "ゲストのメール",
        dateStartLabel: "開始日",
        dateEndLabel: "終了日",
        timeStartLabel: "開始時刻",
        timeEndLabel: "終了時刻",
        commentLabel: "コメント",
        optionalTag: "任意",
        previewTitle: "生成された URL",
        previewHint:
          "スペース、記号、非ラテン文字を含むすべての値が、自動的に URL エンコードされます。",
        copyButton: "URL をコピー",
        copiedButton: "コピーしました！",
        copyError: "コピーに失敗しました。URL を選択して手動でコピーしてください。",
        mappingTitle: "パラメーター対応",
        mappingIntro: "URL 内の各プレースホルダーは 1 つの項目に対応します:",
        securityTitle: "セキュリティに関する注意",
        securityNote:
          "このツールは API を呼び出さず、データをどこにも送信しません。ブラウザー内で URL を組み立てるだけなので、ご自身の連携で利用できます。",
      },
    },

    ko: {
      promo: {
        eyebrow: "신규 · 개발자 API",
        title: "자동 게스트 초대 API",
        subtitle:
          "안전하고 기간이 한정된 게스트 접근 권한을 자체 시스템에서 바로 발급하세요. 예약 흐름, CRM 또는 프런트 데스크를 연결하면 WIFIGATE가 초대를 자동으로 생성합니다. 수동 작업도, 공유 리모컨도 필요 없습니다.",
        point1Title: "자동화를 위한 설계",
        point1Text:
          "인증된 단일 요청으로 어떤 백엔드에서든 프로그래밍 방식으로 게스트 초대를 생성하세요.",
        point2Title: "기간 한정 접근",
        point2Text:
          "정확한 시작 및 종료 날짜와 시간을 설정해 모든 초대가 필요한 시점에 정확히 열리고 만료되도록 하세요.",
        point3Title: "비공개이며 안전함",
        point3Text:
          "API 키는 사용자 환경에 그대로 남고 모든 값이 안전하게 인코딩되므로 데이터는 항상 사용자의 통제 아래 있습니다.",
        cta: "초대 생성기 열기",
        consoleCaption: "실시간 요청 미리보기",
      },
      generator: {
        metaTitle: "자동 게스트 초대 API | WIFIGATE",
        metaDescription:
          "WIFIGATE 게스트 초대 API 요청을 만들고 미리 봅니다. 게스트 정보를 추가하고 접근 날짜와 시간을 선택한 뒤 바로 사용할 수 있는 URL을 복사하세요.",
        breadcrumb: "자동 게스트 초대 API",
        backToHome: "홈으로 돌아가기",
        heading: "자동 게스트 초대 API",
        subheading:
          "아래 정보를 입력해 초대 요청을 만드세요. 입력하는 동안 URL이 실시간으로 업데이트되며, 이를 자체 연동에 복사해 사용할 수 있습니다.",
        formTitle: "초대 세부정보",
        apiKeyLabel: "API 키",
        apiKeyHint:
          "자리표시자일 뿐입니다. 자체 보안 환경에서 WIFIGATE_GUESTS_API_KEY를 실제 키로 교체하세요. 공개적으로 공유하지 마세요.",
        guestNameLabel: "게스트 이름",
        guestPhoneLabel: "게스트 전화",
        guestEmailLabel: "게스트 이메일",
        dateStartLabel: "시작 날짜",
        dateEndLabel: "종료 날짜",
        timeStartLabel: "시작 시간",
        timeEndLabel: "종료 시간",
        commentLabel: "메모",
        optionalTag: "선택 사항",
        previewTitle: "생성된 URL",
        previewHint:
          "공백, 기호, 비라틴 문자를 포함한 모든 값이 자동으로 URL 인코딩됩니다.",
        copyButton: "URL 복사",
        copiedButton: "복사됨!",
        copyError: "복사 실패 — URL을 선택해 수동으로 복사하세요.",
        mappingTitle: "매개변수 매핑",
        mappingIntro: "URL의 각 자리표시자는 하나의 필드에 대응합니다:",
        securityTitle: "보안 참고",
        securityNote:
          "이 도구는 API를 호출하지 않으며 데이터를 어디로도 전송하지 않습니다. 브라우저에서 URL만 조립하므로 자체 연동에서 사용할 수 있습니다.",
      },
    },

    da: {
      promo: {
        eyebrow: "Nyt · Udvikler-API",
        title: "API til automatiske gæsteinvitationer",
        subtitle:
          "Udsted sikker, tidsbegrænset gæsteadgang direkte fra dine egne systemer. Forbind dit bookingflow, dit CRM eller din reception, og lad WIFIGATE oprette invitationer automatisk — uden manuelle trin og uden delte fjernbetjeninger.",
        point1Title: "Bygget til automatisering",
        point1Text:
          "Opret gæsteinvitationer programmatisk fra enhver backend med en enkelt godkendt forespørgsel.",
        point2Title: "Tidsbegrænset adgang",
        point2Text:
          "Angiv præcise start- og slutdatoer og -tider, så hver invitation åbner og udløber præcis, når den skal.",
        point3Title: "Privat og sikker",
        point3Text:
          "Din API-nøgle bliver i dit miljø, og hver værdi kodes sikkert, så dine data forbliver under din kontrol.",
        cta: "Åbn invitationsgeneratoren",
        consoleCaption: "Live-forhåndsvisning af forespørgslen",
      },
      generator: {
        metaTitle: "API til automatiske gæsteinvitationer | WIFIGATE",
        metaDescription:
          "Byg og forhåndsvis en WIFIGATE API-forespørgsel til en gæsteinvitation. Tilføj gæstens oplysninger, vælg adgangsdatoer og -tider, og kopiér den færdige URL.",
        breadcrumb: "API til automatiske gæsteinvitationer",
        backToHome: "Tilbage til forsiden",
        heading: "API til automatiske gæsteinvitationer",
        subheading:
          "Udfyld oplysningerne nedenfor for at bygge en invitationsforespørgsel. URL'en opdateres live, mens du skriver — kopiér den derefter ind i din egen integration.",
        formTitle: "Invitationsoplysninger",
        apiKeyLabel: "API-nøgle",
        apiKeyHint:
          "Kun en pladsholder. Erstat WIFIGATE_GUESTS_API_KEY med din rigtige nøgle i dit eget sikre miljø — del den aldrig offentligt.",
        guestNameLabel: "Gæstens navn",
        guestPhoneLabel: "Gæstens telefon",
        guestEmailLabel: "Gæstens e-mail",
        dateStartLabel: "Startdato",
        dateEndLabel: "Slutdato",
        timeStartLabel: "Starttid",
        timeEndLabel: "Sluttid",
        commentLabel: "Kommentar",
        optionalTag: "Valgfri",
        previewTitle: "Genereret URL",
        previewHint:
          "Alle værdier URL-kodes automatisk, inklusive mellemrum, symboler og ikke-latinske tegn.",
        copyButton: "Kopiér URL",
        copiedButton: "Kopieret!",
        copyError: "Kopiering mislykkedes — markér URL'en, og kopiér den manuelt.",
        mappingTitle: "Parametertilknytning",
        mappingIntro: "Hver pladsholder i URL'en svarer til ét felt:",
        securityTitle: "Sikkerhedsnote",
        securityNote:
          "Dette værktøj kalder aldrig API'et og sender aldrig dine data nogen steder hen. Det samler kun URL'en i din browser, så du kan bruge den i din egen integration.",
      },
    },

    hu: {
      promo: {
        eyebrow: "Új · Fejlesztői API",
        title: "Automatikus vendégmeghívó API",
        subtitle:
          "Adjon ki biztonságos, időkorlátos vendéghozzáférést közvetlenül a saját rendszereiből. Kösse össze a foglalási folyamatot, a CRM-et vagy a recepciót, és hagyja, hogy a WIFIGATE automatikusan hozza létre a meghívókat — kézi lépések és megosztott távirányítók nélkül.",
        point1Title: "Automatizálásra tervezve",
        point1Text:
          "Hozzon létre vendégmeghívókat programozottan bármely háttérrendszerből egyetlen hitelesített kéréssel.",
        point2Title: "Időkorlátos hozzáférés",
        point2Text:
          "Állítson be pontos kezdő és záró dátumokat és időpontokat, hogy minden meghívó pontosan akkor nyíljon és járjon le, amikor kell.",
        point3Title: "Privát és biztonságos",
        point3Text:
          "Az API-kulcsa a saját környezetében marad, és minden érték biztonságosan kódolódik, így adatai az Ön irányítása alatt maradnak.",
        cta: "Meghívógenerátor megnyitása",
        consoleCaption: "Élő kérés-előnézet",
      },
      generator: {
        metaTitle: "Automatikus vendégmeghívó API | WIFIGATE",
        metaDescription:
          "Állítson össze és tekintsen meg egy WIFIGATE vendégmeghívó API-kérést. Adja meg a vendég adatait, válassza ki a hozzáférési dátumokat és időpontokat, majd másolja ki a kész URL-t.",
        breadcrumb: "Automatikus vendégmeghívó API",
        backToHome: "Vissza a főoldalra",
        heading: "Automatikus vendégmeghívó API",
        subheading:
          "Töltse ki az alábbi mezőket egy meghívókérés összeállításához. Az URL gépelés közben élőben frissül — utána másolja a saját integrációjába.",
        formTitle: "Meghívó adatai",
        apiKeyLabel: "API-kulcs",
        apiKeyHint:
          "Csak helykitöltő. Cserélje le a WIFIGATE_GUESTS_API_KEY értéket a valódi kulcsára a saját biztonságos környezetében — soha ne ossza meg nyilvánosan.",
        guestNameLabel: "Vendég neve",
        guestPhoneLabel: "Vendég telefonszáma",
        guestEmailLabel: "Vendég e-mail-címe",
        dateStartLabel: "Kezdő dátum",
        dateEndLabel: "Záró dátum",
        timeStartLabel: "Kezdő időpont",
        timeEndLabel: "Záró időpont",
        commentLabel: "Megjegyzés",
        optionalTag: "Nem kötelező",
        previewTitle: "Létrehozott URL",
        previewHint:
          "Minden érték automatikusan URL-kódolásra kerül, beleértve a szóközöket, szimbólumokat és a nem latin karaktereket is.",
        copyButton: "URL másolása",
        copiedButton: "Másolva!",
        copyError: "A másolás nem sikerült — jelölje ki az URL-t, és másolja ki kézzel.",
        mappingTitle: "Paraméter-hozzárendelés",
        mappingIntro: "Az URL minden helykitöltője egy mezőnek felel meg:",
        securityTitle: "Biztonsági megjegyzés",
        securityNote:
          "Ez az eszköz soha nem hívja meg az API-t, és sehová nem küldi az adatait. Csak a böngészőjében állítja össze az URL-t, hogy a saját integrációjában használhassa.",
      },
    },
  };

  Object.keys(guestInvites).forEach((lang) => {
    if (!translations[lang]) {
      translations[lang] = {};
    }

    translations[lang].guestInvites = guestInvites[lang];
  });
})();
