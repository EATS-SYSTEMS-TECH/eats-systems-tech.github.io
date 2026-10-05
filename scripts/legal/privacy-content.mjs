// Privacy Policy — the single source for /privacy-policy/ in every locale.
// English is the governing text; Hebrew mirrors it block for block.
// Generated into templates/legal/privacy-policy.template.html and
// js/legal/privacy-content.js by scripts/legal/build-legal-pages.mjs.

export const privacy = {
  en: {
    metaTitle: "Privacy Policy | WIFIGATE",
    metaDescription:
      "How EATS SYSTEMS TECH collects, uses, shares and protects personal data in the WIFIGATE app, gate controllers, website and web portal, and how to exercise your rights or delete your account.",
    eyebrow: "Legal",
    title: "Privacy Policy",
    subtitle:
      "This Privacy Policy explains what personal data WIFIGATE processes, why, with whom it is shared, how long it is kept, and the choices and rights you have.",
    updated: "Effective date: October 6, 2026",
    owner: "Operator: EATS SYSTEMS TECH",
    sections: [
      {
        id: "who-we-are",
        title: "1. Who we are and what this policy covers",
        blocks: [
          "WIFIGATE is a smart access-control product made up of the WIFIGATE mobile app for Android and iOS, the WIFIGATE gate controller that is installed at a gate, door or barrier, the website at wifigate.io, and the WIFIGATE web portal. The product is operated by EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions (\"WIFIGATE\", \"we\", \"us\"). You can contact us at support@wifigate.io.",
          "This policy applies to personal data processed through the app, the controller, the website and the portal. It does not apply to third-party websites or services that are linked from our product, which have their own policies.",
        ],
      },
      {
        id: "summary",
        title: "2. Summary",
        blocks: [
          {
            list: [
              "We do not sell personal data, we do not show advertising, and the app does not collect advertising identifiers.",
              "The gate controller works over Bluetooth Low Energy and has no internet connection. The residents, guests and access history stored on a controller stay on that controller and are not sent to us.",
              "Personal data you keep in the app is stored on your phone in encrypted form.",
              "Our servers receive only what is needed to run your account, the web portal and firmware updates, and usage statistics that contain no advertising identifiers.",
              "You can delete your account at any time in the app or by email, as described in section 11.",
            ],
          },
        ],
      },
      {
        id: "roles",
        title: "3. Our role and the role of gate administrators",
        blocks: [
          "For account data, app usage statistics, firmware-update requests, the website and the web portal, EATS SYSTEMS TECH is the controller of your personal data.",
          "A gate controller is managed by its administrator, such as a property owner, building committee, property manager or business. The administrator decides who is enrolled on the controller, what details are recorded about them and how long people keep access. For the data stored on a controller, the administrator is responsible for having a lawful basis, informing the people concerned and responding to their requests. We provide the technology, but we have no access to the data stored on a controller.",
        ],
      },
      {
        id: "collect",
        title: "4. Personal data we process",
        blocks: [
          "Account data. You sign in to the app and the portal with Google or Apple. We receive your account identifier, name, email address and profile photo address, and the sign-in provider you used. If you use Apple's \"Hide My Email\", we receive a relay address instead of your email. Your acceptance of the Terms & Conditions and this policy is recorded in the app.",
          "Profile details you enter. The phone number you enter in your profile is used to identify you on gates and in invitations. It is not verified by SMS.",
          "Data you enter in the app. Gate names, icons, groups, notes and an optional gate address, and the details you enter when you invite someone: name, phone number and, if you choose, floor, apartment, parking space, vehicle number and a comment.",
          "Contacts. If you choose a contact to invite, the app opens your phone's contact picker and reads the name, company and phone numbers of that one contact to fill in the invitation. We do not read, copy or upload your address book.",
          "Camera. The camera is used only to scan the QR code on a controller label or in the administrator panel. Images are processed on your phone and are not stored or transmitted.",
          "Bluetooth and location permission. The app communicates with controllers over Bluetooth Low Energy. Android requires a location permission for Bluetooth scanning, and iOS asks for Bluetooth and, where applicable, location permission for the same purpose. The app does not read your GPS position and does not track your location.",
          "Auto Open. If you turn on Auto Open, your phone broadcasts a Bluetooth identifier that the gate controller recognises, including while the app is in the background, so that the gate can open when you approach it. The identifier is linked to your record on that controller only. You can turn Auto Open off at any time.",
          "Data stored on a gate controller. When you are enrolled on a controller, it stores your name, phone number, email address if provided, floor, apartment and parking space if provided, your permission level and, if used, your Auto Open identifier. Controllers with history storage keep an access log of who opened or held the gate, when, how, and whether a request was refused. Names and phone numbers in the log are encrypted.",
          "Usage statistics. The app uses Google Firebase Analytics with automatically collected events only, such as app opens, sessions, app version, device model, operating system and approximate country or region derived from the IP address. We do not set a user identifier, we do not log custom events, and advertising identifiers, advertising storage and ad personalisation are disabled.",
          "App integrity and firmware updates. When the app checks for or downloads firmware for a controller, it sends an app-integrity token from Firebase App Check (Google Play Integrity or Apple App Attest) together with the update channel and hardware variant. Our cloud providers process the IP address and technical request data needed to deliver the file.",
          "Web portal. If you are approved to use the portal, we store your account identifier, name, email address, whether your email is verified, your sign-in providers, your access status and role, and timestamps. Security audit records store an identifier and a one-way hash of your email address rather than the email itself.",
          "Website. Browsing does not require an account. Our hosting provider processes technical data such as your IP address to deliver pages. The website stores your accessibility and cookie choices; it does not store a language choice. If you allow analytics, Google Analytics measures visits, page views and technical device information to help us improve the website. You can withdraw consent through Cookie settings in the footer. Details are in our Cookie Policy.",
          "Communications. If you contact us by email or WhatsApp, we process your message, your contact details and the information you choose to share.",
        ],
      },
      {
        id: "use",
        title: "5. Why we use personal data and our legal bases",
        blocks: [
          {
            list: [
              "To provide the service you ask for: your account, gate access, invitations, firmware updates and the portal (performance of a contract).",
              "To keep the product secure, verify genuine app installations, prevent misuse and protect controllers and accounts (our legitimate interests).",
              "To understand overall app usage and improve reliability, using statistics without advertising identifiers (our legitimate interests; where the law requires consent, we ask for it).",
              "To measure website usage and improve the website with Google Analytics, only after your consent.",
              "To answer your questions and provide support (performance of a contract and our legitimate interests).",
              "To comply with legal obligations and to establish, exercise or defend legal claims.",
            ],
          },
          "We do not use personal data for automated decisions that produce legal or similarly significant effects on you.",
        ],
      },
      {
        id: "sharing",
        title: "6. When personal data is shared",
        blocks: [
          "Service providers that process data on our behalf under contract: Google (Firebase Authentication, Firebase Analytics, Firebase App Check, Cloud Firestore, Cloud Storage and Cloud Run), Apple (Sign in with Apple and App Attest) and GitHub (website hosting).",
          "Gate administrators. If you are enrolled on a controller, its administrators can see your enrolment details and the controller's access history in the app.",
          "Invitation links you share. A private invitation link contains, in signed and encoded form, the phone number it is intended for, and a guest pass contains the guest's name. Anyone who holds a link can read what it contains, so share it only with the intended person. Links are shared through the app of your choice, such as WhatsApp or SMS, under that app's own terms.",
          "Navigation apps. If you tap a gate address, it is opened in the map or navigation app you choose, such as Google Maps or Waze.",
          "Legal reasons. We may disclose personal data where required by law, court order or a competent authority, or to protect the rights, property or safety of people, our users or us.",
          "Business transfers. If our business or assets are transferred, personal data may be transferred to the acquirer, subject to this policy.",
          "We do not sell personal data and we do not share it for cross-context behavioural advertising.",
        ],
      },
      {
        id: "transfers",
        title: "7. International transfers",
        blocks: [
          "Our service providers may process personal data in the United States and in other countries outside your country of residence and the European Economic Area. Where required, transfers rely on adequacy decisions or on appropriate safeguards such as the European Commission's standard contractual clauses.",
        ],
      },
      {
        id: "retention",
        title: "8. How long we keep personal data",
        blocks: [
          {
            list: [
              "Account data: until you delete your account.",
              "Data in the app: on your phone until you delete it, delete your account or uninstall the app.",
              "Usage statistics: for the retention period set in Google Analytics, which does not exceed 14 months.",
              "Data on a gate controller: until the administrator deletes it or the controller is reset to factory settings. The access log keeps about the most recent 90 days of activity and older records are deleted automatically, earlier if storage runs low. Deleting a person from a controller does not erase past log entries; they expire with the log.",
              "Portal data: while your portal access is active, and until you ask us to delete it.",
              "Support communications: as long as needed to handle your request and any follow-up.",
            ],
          },
          "We may keep data for longer where the law requires it or to establish, exercise or defend legal claims.",
        ],
      },
      {
        id: "security",
        title: "9. Security",
        blocks: [
          "We use technical and organisational measures appropriate to the risk. Personal data in the app is encrypted on the phone with AES-256-GCM, with keys kept in the iOS Keychain or Android Keystore. Communication between the app and a controller uses encrypted, authenticated sessions. Production controllers use secure boot and flash encryption, and the names and phone numbers in the access log are encrypted.",
          "No system is completely secure. Keep your phone locked, keep the app up to date, and keep the controller's QR label physically protected, because scanning it grants administrator access.",
        ],
      },
      {
        id: "rights",
        title: "10. Your rights",
        blocks: [
          "Depending on the law that applies to you, including the Israeli Privacy Protection Law and the EU General Data Protection Regulation, you may have the right to access your personal data, to correct it, to delete it, to restrict or object to its processing, to receive it in a portable format, and to withdraw consent at any time.",
          "To exercise a right, email support@wifigate.io from the email address linked to your account. We may need to verify your identity. We answer within 30 days. For data stored on a gate controller, please contact that gate's administrator, who controls it.",
          "You may also lodge a complaint with a data protection authority, such as the Israeli Privacy Protection Authority or the authority in your EU country of residence.",
        ],
      },
      {
        id: "delete-account",
        title: "11. Deleting your account",
        blocks: [
          "In the app: open your profile and tap Delete account. You will be asked to sign in again to confirm. Your account is deleted from our authentication service, your Apple sign-in authorisation is revoked if you used Apple, and your profile, credentials and app data are erased from that phone.",
          "Without the app: email support@wifigate.io from the email address of your account with the subject \"Delete my WIFIGATE account\". We will delete your account and any portal data within 30 days and confirm by email.",
          "Account deletion does not remove you from gate controllers, because that data is held on the controllers. Ask the gate's administrator to delete you. Usage statistics are kept only for the retention period described in section 8, and we keep data where the law requires it.",
        ],
      },
      {
        id: "children",
        title: "12. Children",
        blocks: [
          "WIFIGATE is not directed to children under 16, and we do not knowingly collect personal data from them through accounts. An administrator who enrols a minor on a controller, for example a family member, is responsible for obtaining any consent required by law. If you believe a child has given us personal data, contact us and we will delete it.",
        ],
      },
      {
        id: "changes",
        title: "13. Changes to this policy",
        blocks: [
          "We may update this policy from time to time. The effective date at the top shows the current version. If a change is material, we will tell you in the app or on the website before it takes effect.",
        ],
      },
      {
        id: "contact",
        title: "14. Contact",
        blocks: [
          "Controller: EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions",
          "Email: support@wifigate.io",
          "This policy is published in English and Hebrew and may be shown in English on pages in other languages. If versions differ, the English version prevails.",
          { link: { href: "../cookies/", text: "Read our Cookie Policy" } },
          { link: { href: "../terms-and-conditions/", text: "Read our Terms & Conditions" } },
        ],
      },
    ],
  },

  he: {
    metaTitle: "מדיניות פרטיות | WIFIGATE",
    metaDescription:
      "כיצד EATS SYSTEMS TECH אוספת, משתמשת, משתפת ומגינה על מידע אישי באפליקציית WIFIGATE, בבקרי השער, באתר ובפורטל, וכיצד לממש את זכויותיכם או למחוק את החשבון.",
    eyebrow: "משפטי",
    title: "מדיניות פרטיות",
    subtitle:
      "מדיניות פרטיות זו מסבירה איזה מידע אישי WIFIGATE מעבדת, לשם מה, עם מי הוא משותף, כמה זמן הוא נשמר, ואילו בחירות וזכויות עומדות לרשותכם.",
    updated: "תאריך תחילה: 6 באוקטובר 2026",
    owner: "המפעילה: EATS SYSTEMS TECH",
    sections: [
      {
        id: "who-we-are",
        title: "1. מי אנחנו ועל מה חלה מדיניות זו",
        blocks: [
          "WIFIGATE הוא מוצר חכם לבקרת כניסה, הכולל את אפליקציית WIFIGATE ל‑Android ול‑iOS, את בקר השער של WIFIGATE המותקן בשער, בדלת או במחסום, את האתר wifigate.io ואת פורטל האינטרנט של WIFIGATE. המוצר מופעל על ידי EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions (\"WIFIGATE\", \"אנחנו\"). ניתן לפנות אלינו בכתובת support@wifigate.io.",
          "מדיניות זו חלה על מידע אישי המעובד באמצעות האפליקציה, הבקר, האתר והפורטל. היא אינה חלה על אתרים או שירותים של צדדים שלישיים שיש אליהם קישור מהמוצר, ואשר להם מדיניות משלהם.",
        ],
      },
      {
        id: "summary",
        title: "2. בקצרה",
        blocks: [
          {
            list: [
              "איננו מוכרים מידע אישי, איננו מציגים פרסומות, והאפליקציה אינה אוספת מזהי פרסום.",
              "בקר השער פועל באמצעות Bluetooth Low Energy ואין לו חיבור לאינטרנט. הדיירים, האורחים והיסטוריית הכניסות השמורים בבקר נשארים בבקר ואינם נשלחים אלינו.",
              "מידע אישי שאתם שומרים באפליקציה נשמר בטלפון שלכם בצורה מוצפנת.",
              "השרתים שלנו מקבלים רק את מה שנדרש להפעלת החשבון, הפורטל ועדכוני הקושחה, וכן סטטיסטיקות שימוש שאינן כוללות מזהי פרסום.",
              "תוכלו למחוק את החשבון בכל עת באפליקציה או בדוא\"ל, כמתואר בסעיף 11.",
            ],
          },
        ],
      },
      {
        id: "roles",
        title: "3. התפקיד שלנו ותפקיד מנהלי השערים",
        blocks: [
          "לגבי נתוני חשבון, סטטיסטיקות שימוש באפליקציה, בקשות לעדכון קושחה, האתר והפורטל, EATS SYSTEMS TECH היא בעלת השליטה במידע האישי שלכם.",
          "בקר שער מנוהל על ידי המנהל שלו, כגון בעל הנכס, ועד הבית, חברת הניהול או העסק. המנהל מחליט מי רשום בבקר, אילו פרטים נשמרים עליו ולכמה זמן ניתנת לו גישה. לגבי המידע השמור בבקר, המנהל אחראי לקיומו של בסיס חוקי, ליידוע האנשים הנוגעים בדבר ולמענה לבקשותיהם. אנחנו מספקים את הטכנולוגיה, אך אין לנו גישה למידע השמור בבקר.",
        ],
      },
      {
        id: "collect",
        title: "4. המידע האישי שאנחנו מעבדים",
        blocks: [
          "נתוני חשבון. הכניסה לאפליקציה ולפורטל נעשית באמצעות Google או Apple. אנו מקבלים את מזהה החשבון, השם, כתובת הדוא\"ל וכתובת תמונת הפרופיל, וכן את ספק הכניסה שבו השתמשתם. אם בחרתם ב\"הסתר את הדוא\"ל שלי\" של Apple, נקבל כתובת ממסר במקום הדוא\"ל שלכם. הסכמתכם לתנאי השימוש ולמדיניות זו נרשמת באפליקציה.",
          "פרטי פרופיל שאתם מזינים. מספר הטלפון שאתם מזינים בפרופיל משמש לזיהויכם בשערים ובהזמנות. הוא אינו מאומת ב‑SMS.",
          "מידע שאתם מזינים באפליקציה. שמות שערים, סמלים, קבוצות, הערות וכתובת שער אופציונלית, וכן הפרטים שאתם מזינים בעת הזמנת אדם: שם, מספר טלפון, ולפי בחירתכם קומה, דירה, מקום חניה, מספר רכב והערה.",
          "אנשי קשר. אם תבחרו איש קשר להזמנה, האפליקציה תפתח את בורר אנשי הקשר של הטלפון ותקרא את השם, החברה ומספרי הטלפון של איש קשר זה בלבד, כדי למלא את ההזמנה. איננו קוראים, מעתיקים או מעלים את פנקס הכתובות שלכם.",
          "מצלמה. המצלמה משמשת רק לסריקת קוד ה‑QR שעל מדבקת הבקר או בפאנל הניהול. התמונות מעובדות בטלפון ואינן נשמרות או נשלחות.",
          "Bluetooth והרשאת מיקום. האפליקציה מתקשרת עם הבקרים באמצעות Bluetooth Low Energy. Android מחייבת הרשאת מיקום לסריקת Bluetooth, ו‑iOS מבקשת הרשאת Bluetooth, ובמקרים הרלוונטיים גם הרשאת מיקום, לאותה מטרה. האפליקציה אינה קוראת את מיקום ה‑GPS שלכם ואינה עוקבת אחר מיקומכם.",
          "פתיחה אוטומטית. אם תפעילו פתיחה אוטומטית, הטלפון ישדר מזהה Bluetooth שבקר השער מזהה, גם כשהאפליקציה ברקע, כדי שהשער ייפתח כשתתקרבו אליו. המזהה מקושר לרשומה שלכם באותו בקר בלבד. ניתן לכבות פתיחה אוטומטית בכל עת.",
          "מידע השמור בבקר שער. כשאתם רשומים בבקר, הוא שומר את שמכם, מספר הטלפון, כתובת הדוא\"ל אם נמסרה, קומה, דירה ומקום חניה אם נמסרו, רמת ההרשאה שלכם, ואם נעשה בה שימוש גם את מזהה הפתיחה האוטומטית. בקרים עם שמירת היסטוריה מנהלים יומן כניסות: מי פתח או החזיק את השער, מתי, באיזה אופן, והאם בקשה נדחתה. השמות ומספרי הטלפון ביומן מוצפנים.",
          "סטטיסטיקות שימוש. האפליקציה משתמשת ב‑Google Firebase Analytics עם אירועים הנאספים אוטומטית בלבד, כגון פתיחת האפליקציה, הפעלות, גרסת האפליקציה, דגם המכשיר, מערכת ההפעלה ומדינה או אזור משוערים הנגזרים מכתובת ה‑IP. איננו מגדירים מזהה משתמש, איננו רושמים אירועים מותאמים, ומזהי פרסום, אחסון לצורכי פרסום והתאמה אישית של מודעות כבויים.",
          "תקינות האפליקציה ועדכוני קושחה. כשהאפליקציה בודקת או מורידה קושחה לבקר, היא שולחת אסימון תקינות של Firebase App Check (Google Play Integrity או Apple App Attest), יחד עם ערוץ העדכון וסוג החומרה. ספקי הענן שלנו מעבדים את כתובת ה‑IP ואת נתוני הבקשה הטכניים הדרושים למסירת הקובץ.",
          "פורטל האינטרנט. אם אושרה לכם גישה לפורטל, אנו שומרים את מזהה החשבון, השם, כתובת הדוא\"ל, האם הדוא\"ל מאומת, ספקי הכניסה, סטטוס הגישה והתפקיד, וחותמות זמן. רשומות ביקורת אבטחה שומרות מזהה וגיבוב חד‑כיווני של כתובת הדוא\"ל, ולא את הדוא\"ל עצמו.",
          "האתר. גלישה באתר אינה מחייבת חשבון. ספק האחסון שלנו מעבד נתונים טכניים כגון כתובת ה־IP כדי להציג את הדפים. האתר שומר את בחירות הנגישות והעוגיות שלכם, ואינו שומר בחירת שפה. אם תאשרו מדידה, Google Analytics ימדוד ביקורים, צפיות בדפים ונתונים טכניים על המכשיר כדי לסייע לנו לשפר את האתר. תוכלו לבטל הסכמה דרך ״הגדרות עוגיות״ בתחתית האתר. הפרטים מופיעים במדיניות העוגיות.",
          "פניות. אם תפנו אלינו בדוא\"ל או ב‑WhatsApp, נעבד את ההודעה, את פרטי ההתקשרות ואת המידע שתבחרו למסור.",
        ],
      },
      {
        id: "use",
        title: "5. מטרות השימוש במידע והבסיס החוקי",
        blocks: [
          {
            list: [
              "כדי לספק את השירות שביקשתם: החשבון, הגישה לשערים, ההזמנות, עדכוני הקושחה והפורטל (ביצוע חוזה).",
              "כדי לשמור על אבטחת המוצר, לאמת התקנות מקוריות של האפליקציה, למנוע שימוש לרעה ולהגן על בקרים וחשבונות (האינטרס הלגיטימי שלנו).",
              "כדי להבין את השימוש הכללי באפליקציה ולשפר את אמינותה, באמצעות סטטיסטיקות ללא מזהי פרסום (האינטרס הלגיטימי שלנו; כאשר הדין מחייב הסכמה, נבקש אותה).",
              "כדי למדוד את השימוש באתר ולשפר אותו באמצעות Google Analytics, רק לאחר הסכמתכם.",
              "כדי להשיב לשאלות ולתת תמיכה (ביצוע חוזה והאינטרס הלגיטימי שלנו).",
              "כדי לעמוד בחובות חוקיות ולהגן על זכויות משפטיות.",
            ],
          },
          "איננו משתמשים במידע אישי לקבלת החלטות אוטומטיות שיש להן השפעה משפטית או השפעה משמעותית דומה עליכם.",
        ],
      },
      {
        id: "sharing",
        title: "6. מתי מידע אישי משותף",
        blocks: [
          "ספקי שירות המעבדים מידע מטעמנו לפי חוזה: Google (Firebase Authentication, Firebase Analytics, Firebase App Check, Cloud Firestore, Cloud Storage ו‑Cloud Run), Apple (Sign in with Apple ו‑App Attest) ו‑GitHub (אחסון האתר).",
          "מנהלי שערים. אם אתם רשומים בבקר, המנהלים שלו יכולים לראות באפליקציה את פרטי הרישום שלכם ואת היסטוריית הכניסות של הבקר.",
          "קישורי הזמנה שאתם משתפים. קישור הזמנה פרטי מכיל, בצורה חתומה ומקודדת, את מספר הטלפון שאליו הוא מיועד, וכרטיס אורח מכיל את שם האורח. כל מי שמחזיק בקישור יכול לקרוא את תוכנו, ולכן שתפו אותו רק עם האדם שאליו הוא מיועד. הקישורים נשלחים באפליקציה שתבחרו, כגון WhatsApp או SMS, בכפוף לתנאים שלה.",
          "אפליקציות ניווט. אם תקישו על כתובת שער, היא תיפתח באפליקציית המפות או הניווט שתבחרו, כגון Google Maps או Waze.",
          "דרישות הדין. אנו עשויים למסור מידע אישי כאשר הדבר נדרש לפי דין, צו שיפוטי או רשות מוסמכת, או כדי להגן על הזכויות, הרכוש או הבטיחות של אנשים, של משתמשינו או שלנו.",
          "העברת עסק. אם העסק או נכסיו יועברו, המידע האישי עשוי לעבור לרוכש, בכפוף למדיניות זו.",
          "איננו מוכרים מידע אישי ואיננו משתפים אותו לצורכי פרסום מבוסס התנהגות.",
        ],
      },
      {
        id: "transfers",
        title: "7. העברת מידע בין‑לאומית",
        blocks: [
          "ספקי השירות שלנו עשויים לעבד מידע אישי בארצות הברית ובמדינות אחרות מחוץ למדינת מגוריכם ולאזור הכלכלי האירופי. כאשר הדבר נדרש, ההעברות נשענות על החלטות הלימות או על אמצעי הגנה מתאימים, כגון הסעיפים החוזיים התקניים של הנציבות האירופית.",
        ],
      },
      {
        id: "retention",
        title: "8. כמה זמן נשמר המידע",
        blocks: [
          {
            list: [
              "נתוני חשבון: עד למחיקת החשבון.",
              "מידע באפליקציה: בטלפון שלכם עד שתמחקו אותו, תמחקו את החשבון או תסירו את האפליקציה.",
              "סטטיסטיקות שימוש: לתקופת השמירה המוגדרת ב‑Google Analytics, שאינה עולה על 14 חודשים.",
              "מידע בבקר שער: עד שהמנהל ימחק אותו או שהבקר יאופס להגדרות היצרן. יומן הכניסות שומר בערך את 90 הימים האחרונים של פעילות, ורשומות ישנות יותר נמחקות אוטומטית, ומוקדם יותר אם נפח האחסון אוזל. מחיקת אדם מבקר אינה מוחקת רשומות עבר ביומן; הן פגות יחד עם היומן.",
              "נתוני הפורטל: כל עוד הגישה שלכם לפורטל פעילה, ועד שתבקשו את מחיקתם.",
              "פניות תמיכה: כל עוד נדרש לטיפול בפנייה ובהמשכה.",
            ],
          },
          "אנו עשויים לשמור מידע לתקופה ארוכה יותר כאשר הדין מחייב זאת, או לשם הגנה על זכויות משפטיות.",
        ],
      },
      {
        id: "security",
        title: "9. אבטחת מידע",
        blocks: [
          "אנו נוקטים אמצעים טכניים וארגוניים המתאימים לרמת הסיכון. מידע אישי באפליקציה מוצפן בטלפון ב‑AES-256-GCM, והמפתחות נשמרים ב‑iOS Keychain או ב‑Android Keystore. התקשורת בין האפליקציה לבקר מתבצעת בערוצים מוצפנים ומאומתים. בקרי ייצור פועלים עם אתחול מאובטח והצפנת זיכרון, והשמות ומספרי הטלפון ביומן הכניסות מוצפנים.",
          "אין מערכת מאובטחת לחלוטין. שמרו על נעילת הטלפון, עדכנו את האפליקציה, ושמרו פיזית על מדבקת ה‑QR של הבקר, שכן סריקתה מעניקה הרשאת מנהל.",
        ],
      },
      {
        id: "rights",
        title: "10. הזכויות שלכם",
        blocks: [
          "בהתאם לדין החל עליכם, ובכלל זה חוק הגנת הפרטיות הישראלי והתקנה האירופית להגנה על מידע (GDPR), ייתכן שעומדות לכם הזכויות לעיין במידע האישי שלכם, לתקן אותו, למחוק אותו, להגביל את עיבודו או להתנגד לו, לקבל אותו בפורמט נייד, ולחזור בכם מהסכמה בכל עת.",
          "כדי לממש זכות, שלחו דוא\"ל אל support@wifigate.io מכתובת הדוא\"ל המקושרת לחשבונכם. ייתכן שנצטרך לאמת את זהותכם. נשיב בתוך 30 יום. לגבי מידע השמור בבקר שער, פנו למנהל אותו שער, השולט במידע.",
          "תוכלו גם להגיש תלונה לרשות להגנת מידע, כגון הרשות להגנת הפרטיות בישראל או הרשות במדינת מגוריכם באיחוד האירופי.",
        ],
      },
      {
        id: "delete-account",
        title: "11. מחיקת החשבון",
        blocks: [
          "באפליקציה: פתחו את הפרופיל והקישו על מחיקת חשבון. תתבקשו להיכנס שוב לאישור. החשבון יימחק משירות הזיהוי שלנו, הרשאת הכניסה של Apple תבוטל אם השתמשתם ב‑Apple, והפרופיל, האישורים ונתוני האפליקציה יימחקו מאותו טלפון.",
          "ללא האפליקציה: שלחו דוא\"ל אל support@wifigate.io מכתובת הדוא\"ל של החשבון, עם הנושא \"Delete my WIFIGATE account\". נמחק את החשבון ואת נתוני הפורטל בתוך 30 יום ונאשר זאת בדוא\"ל.",
          "מחיקת החשבון אינה מסירה אתכם מבקרי שערים, משום שמידע זה שמור בבקרים עצמם. בקשו ממנהל השער למחוק אתכם. סטטיסטיקות שימוש נשמרות רק לתקופה המתוארת בסעיף 8, ואנו שומרים מידע כאשר הדין מחייב זאת.",
        ],
      },
      {
        id: "children",
        title: "12. ילדים",
        blocks: [
          "WIFIGATE אינו מיועד לילדים מתחת לגיל 16, ואיננו אוספים ביודעין מידע אישי מהם באמצעות חשבונות. מנהל הרושם קטין בבקר, למשל בן משפחה, אחראי לקבלת כל הסכמה הנדרשת לפי דין. אם אתם סבורים שילד מסר לנו מידע אישי, פנו אלינו ונמחק אותו.",
        ],
      },
      {
        id: "changes",
        title: "13. שינויים במדיניות",
        blocks: [
          "אנו עשויים לעדכן מדיניות זו מעת לעת. תאריך התחילה בראש הדף מציין את הגרסה הנוכחית. אם יחול שינוי מהותי, נודיע עליו באפליקציה או באתר לפני שייכנס לתוקף.",
        ],
      },
      {
        id: "contact",
        title: "14. יצירת קשר",
        blocks: [
          "בעלת השליטה במידע: EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions",
          "דוא\"ל: support@wifigate.io",
          "מדיניות זו מתפרסמת באנגלית ובעברית, ובדפים בשפות אחרות היא עשויה להופיע באנגלית. במקרה של סתירה בין הנוסחים, הנוסח האנגלי גובר.",
          { link: { href: "../cookies/", text: "למדיניות העוגיות" } },
          { link: { href: "../terms-and-conditions/", text: "לתנאי השימוש" } },
        ],
      },
    ],
  },
};
