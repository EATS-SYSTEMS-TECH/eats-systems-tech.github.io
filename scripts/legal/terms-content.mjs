// Terms & Conditions — the single source for /terms-and-conditions/ in every locale.
// English is the governing text; Hebrew mirrors it block for block.

export const terms = {
  en: {
    metaTitle: "Terms & Conditions | WIFIGATE",
    metaDescription:
      "The terms that govern the WIFIGATE app, the WIFIGATE Gate and Dual Control controllers, the website and the web portal: what WIFIGATE is and is not, safe use, responsibilities, disclaimers and limitation of liability.",
    eyebrow: "Legal",
    title: "Terms & Conditions",
    subtitle:
      "These Terms & Conditions govern your use of WIFIGATE. They include important provisions on safety, on what WIFIGATE is responsible for and what it is not, and on the limitation of our liability. Please read them carefully.",
    updated: "Effective date: October 4, 2026",
    owner: "Provider: EATS SYSTEMS TECH (Itay Nave – Engineering and Technology Solutions)",
    sections: [
      {
        id: "agreement",
        title: "1. Agreement and acceptance",
        blocks: [
          "These Terms & Conditions (\"Terms\") are a binding agreement between you and EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions (\"WIFIGATE\", \"we\", \"us\") about the WIFIGATE mobile app, the WIFIGATE controllers and their firmware, the website at wifigate.io and the WIFIGATE web portal (together, the \"Service\").",
          "You accept these Terms, and our Privacy Policy, by creating an account, by ticking the acceptance box in the app, or by installing, configuring or using any part of the Service. If you use the Service on behalf of a business, a building committee or another organisation, you confirm that you are authorised to bind it, and \"you\" includes that organisation. If you do not accept these Terms, do not use the Service.",
          "You must be at least 18 years old, or the age of legal capacity where you live, to open an account, to administer a controller or to accept these Terms. A minor may use the Service only when enrolled by an adult administrator who is responsible for that use and for supervising it.",
        ],
      },
      {
        id: "definitions",
        title: "2. Definitions",
        blocks: [
          {
            list: [
              "\"Controller\": a WIFIGATE device and its firmware, including the WIFIGATE Gate (controlling one entrance) and the WIFIGATE Dual Control (controlling two entrances).",
              "\"Supported Equipment\": the third-party equipment that a Controller is connected to, such as electric gates, sliding and swing gates, barriers, garage doors, electric roller shutters, doors, electric strikes and magnetic locks, together with its motor, control unit, safety devices, power supply and wiring.",
              "\"Owner\": the owner of the property or of the Supported Equipment, or a person or body entitled to control it, such as a building committee or property manager.",
              "\"Administrator\": a person with administrator rights on a Controller. \"User\": a person enrolled on a Controller. \"Guest\": a person who uses a time-limited guest pass.",
              "\"Installer\": any person who installs, connects, configures or maintains a Controller or Supported Equipment, other than us.",
              "\"Invitation\": a link or card that lets a person enrol on a Controller. \"Guest pass\": a link that lets a guest open an entrance for a limited time.",
            ],
          },
        ],
      },
      {
        id: "what-wifigate-is",
        title: "3. What WIFIGATE is, and what it is not",
        blocks: [
          "WIFIGATE is a control interface. The Controller acts in the same way as a push button, key switch or remote control: when it receives an authorised command from the app, it sends a signal (a relay contact) to the control unit of the Supported Equipment. The opening, closing, locking and every other movement or action is performed by the Supported Equipment and its own control unit, not by WIFIGATE.",
          "WIFIGATE is not the manufacturer, seller, installer, maintainer or inspector of any Supported Equipment. We do not design, supply, install, inspect, certify or maintain gates, barriers, doors, shutters, locks, motors, control units, safety devices, power supplies or wiring, and we have no control over their condition, configuration or operation.",
          "Accordingly, the mechanical, electrical and functional safety and the physical security of the Supported Equipment, including its safety devices, obstacle detection, force limitation, manual release and emergency operation, its suitability for the site and its compliance with any law, standard, permit or building rule, are not the responsibility of WIFIGATE. They are the responsibility of the Owner, the manufacturer of the Supported Equipment and the Installer.",
        ],
      },
      {
        id: "safety-measures",
        title: "4. WIFIGATE's safety measures and their limits",
        blocks: [
          "We design the Service with software and hardware safety and security measures, including encrypted and authenticated commands, permission checks, limits on how long a signal is held, automatic release of a held signal, refusal of commands during configured events and override modes, and secure boot and encryption on production Controllers.",
          "These measures protect the integrity of the commands that WIFIGATE sends and who may send them. They do not make any Supported Equipment safe, they do not detect people, vehicles or objects, and they do not replace, and must never be used instead of, the safety devices that the Supported Equipment and the law require. No measure can guarantee that a command will always, or never, be carried out.",
        ],
      },
      {
        id: "installation",
        title: "5. Installation and connection",
        blocks: [
          "A Controller must be installed and connected only by a qualified Installer, in accordance with our instructions, the instructions of the manufacturer of the Supported Equipment, and all applicable electrical, fire, building, accessibility and safety laws and standards.",
          "Before a Controller is connected, the Owner and the Installer must make sure that the Supported Equipment is in good working order, is fitted with all the safety devices required for it (such as photocells, edge sensors, obstacle detection and force limitation) and that those devices work independently of WIFIGATE, that it has a working manual release and an independent means of operation, and that any required permit or consent has been obtained.",
          "Installers act on their own behalf or on behalf of the Owner. They are not our employees, agents or representatives, and we are not a party to, and are not responsible for, any agreement between an Owner and an Installer or a seller.",
        ],
      },
      {
        id: "safe-use",
        title: "6. Safe use: your obligations",
        blocks: [
          "Using a phone to operate moving equipment carries risks. You agree that you, and anyone using the Service through your account, invitation or guest pass, will:",
          {
            list: [
              "Not use the app while driving. Operate the Service from a vehicle only when the vehicle is stopped in a safe and lawful place, or let a passenger operate it. Always obey traffic laws; using a phone in breach of them is prohibited even if the app is open.",
              "Set up Auto Open, widgets and other settings only while stationary, and approach an entrance slowly and attentively when Auto Open is on.",
              "Operate an entrance only when you can see it and its entire path of movement, and only after making sure that no person, child, animal, vehicle or object is in that path.",
              "Never pass through, or let anyone pass through, an entrance while it is moving, and never let children operate the Service or play near an entrance.",
              "Stop using the Service and inform the Owner or Administrator immediately if the Supported Equipment behaves abnormally, does not stop or reverse at an obstacle, or a safety device is damaged.",
              "Comply with the rules of the property and the instructions of the Owner and Administrator.",
            ],
          },
          "You are solely responsible for any injury, damage or loss caused by operating the Service in breach of this section.",
        ],
      },
      {
        id: "automatic-features",
        title: "7. Auto Open and other automatic features",
        blocks: [
          "Auto Open, event schedules, override modes and home-screen widgets can open an entrance, or hold it open or closed, without a deliberate action at that moment. Auto Open depends on your phone's Bluetooth, battery and power-saving settings and on its operating system, which are outside our control. Automatic features may fail to act, act later than expected, or act when you are near an entrance without intending to pass.",
          "Whoever enables an automatic feature does so at their own discretion and is responsible for using it only where and when it is safe. Automatic features must not be used for an entrance that may not be left unattended, or where an unintended opening could endanger people or property. Every automatic feature can be turned off at any time.",
        ],
      },
      {
        id: "accounts",
        title: "8. Accounts, credentials and access keys",
        blocks: [
          "You sign in with Google or Apple. You must provide accurate information, including the phone number in your profile, and keep it up to date. You are responsible for all activity on your account and on your phone; keep your phone locked and protected.",
          "The first person to scan a Controller's QR label or administrator-panel QR code becomes an administrator, and anyone who scans it later also becomes an administrator. The QR label is therefore equivalent to a master key. The Owner and Administrators must keep it physically secured and must not photograph, copy or share it. We are not responsible for access obtained with a QR label, phone, invitation or guest pass that was lost, shared or not protected.",
          "If a phone is lost or stolen, or misuse is suspected, the Administrator must remove the affected access without delay.",
        ],
      },
      {
        id: "administrators",
        title: "9. Owners and Administrators",
        blocks: [
          "The Owner and the Administrators are solely responsible for deciding who has access, for removing access that is no longer needed, for the accuracy of the details they record, and for the configuration of each Controller, including automatic features, event schedules and override modes.",
          "They are responsible for the personal data they store on a Controller, including names, phone numbers, apartment and parking details and the access history. They must have a lawful basis for it, inform residents, Users and Guests as required by law, and handle their requests.",
          "They must have the right to control the entrance where the Controller is installed, including any consent required from owners, residents, tenants or a building committee, and must obtain any permit required for its installation and use.",
          "We recommend that Owners maintain appropriate property and third-party liability insurance for the property and the Supported Equipment. WIFIGATE is not an insurer.",
        ],
      },
      {
        id: "invitations",
        title: "10. Invitations and guest passes",
        blocks: [
          "An invitation or guest pass grants access to an entrance. Treat it like a key and send it only to the intended person. Whoever creates and sends it is responsible for its use.",
          "An invitation is valid for up to 7 days from its creation. Deleting a User from a Controller does not cancel an invitation that has not yet expired, so that invitation could be used again until it expires. A guest pass is valid only for the time window set when it was created, and a User can cancel all of their guest passes at any time.",
        ],
      },
      {
        id: "not-security",
        title: "11. Not a security, emergency or life-safety service",
        blocks: [
          "WIFIGATE is a convenience access-control product. It is not a burglar alarm, monitoring, surveillance, emergency, rescue or life-safety service. We do not monitor entrances, receive alerts or call emergency services, and the Service is not available or supported around the clock.",
          "Do not rely on WIFIGATE as the only means of securing a property or as the only means of entry or exit. An independent means of operation, such as a key, keypad or manual release, must always remain available, including for emergency services and in case of a power, phone, battery or Bluetooth failure. WIFIGATE must not be configured or used in a way that could prevent or delay emergency exit or the access of emergency services.",
        ],
      },
      {
        id: "availability",
        title: "12. Availability and compatibility",
        blocks: [
          "Operating an entrance requires a compatible phone with Bluetooth enabled, the required permissions granted, sufficient battery and the phone within range of the Controller. Signing in, firmware updates and the web portal require an internet connection. Range and responsiveness depend on the environment and the phone.",
          "We do not guarantee that the Service is compatible with every phone, operating-system version or Supported Equipment, or that it will remain compatible after changes made by third parties. Lists of supported equipment or applications are general information, not a warranty.",
          "We may change, suspend or discontinue features, the app, the portal or firmware updates. Where reasonably possible we will give notice of a material change. A Controller continues to operate locally regardless of the status of an account.",
        ],
      },
      {
        id: "acceptable-use",
        title: "13. Acceptable use",
        blocks: [
          "You must not:",
          {
            list: [
              "use the Service to enter, or let others enter, premises without authorisation;",
              "circumvent, attack or test the security of the Service, Controllers, credentials, invitations or guest passes, except under a written agreement with us;",
              "reverse engineer, decompile or modify the app or the firmware, or connect a Controller to equipment or circuits it is not designed for, except to the extent the law expressly allows despite this restriction;",
              "disable, bypass or interfere with any safety device of Supported Equipment, or interfere with other people's use of the Service;",
              "use the Service in breach of any law, including privacy, consumer, traffic and safety laws.",
            ],
          },
          "We may suspend or restrict access to the app, the portal or firmware updates if we reasonably believe that these Terms are being breached or that the Service is being used in a way that creates a security or safety risk.",
        ],
      },
      {
        id: "updates",
        title: "14. Updates",
        blocks: [
          "We release updates to the app and firmware to fix problems, improve security and add features. A firmware update is installed only after an Administrator confirms it, and a Controller that fails to start the new firmware returns to the previous version. Keeping the app and Controllers up to date may be necessary for security and for some features to work; we are not responsible for problems caused by not installing an update.",
        ],
      },
      {
        id: "fees",
        title: "15. Fees and purchases",
        blocks: [
          "The app and the features described in these Terms are currently provided without a subscription fee. Controllers and installation are sold separately under the quote, invoice or agreement of the seller or Installer, which governs price, delivery and the hardware warranty. If we introduce paid features, we will present their price and terms before you choose to buy them.",
        ],
      },
      {
        id: "ip",
        title: "16. Intellectual property and licence",
        blocks: [
          "The Service, including the app, firmware, website, designs and the WIFIGATE name and logo, is owned by us or our licensors and protected by law.",
          "Subject to these Terms, we grant you a personal, non-exclusive, non-transferable, revocable licence to use the app on devices you own or control, and to use the firmware only on the Controller it is provided with. Open-source components are licensed under their own terms, which prevail for those components. If you send us feedback or suggestions, we may use them without obligation to you.",
        ],
      },
      {
        id: "third-parties",
        title: "17. Third-party services and app stores",
        blocks: [
          "The Service relies on third-party services and products, such as Google and Apple sign-in, Google Firebase, the app stores, your phone and its operating system, and the Supported Equipment. They are provided by third parties under their own terms, and we are not responsible for them.",
          "If you downloaded the app from Apple's App Store: these Terms are between you and us, not Apple. Apple has no obligation to provide maintenance or support for the app. To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the app; if the app fails to conform to an applicable warranty, you may notify Apple and Apple will refund the purchase price, if any. We, not Apple, are responsible for addressing any claims relating to the app, including product liability claims, claims that the app fails to conform to a legal or regulatory requirement, consumer protection claims, and claims that the app infringes a third party's intellectual property. Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you. You confirm that you are not located in a country subject to a U.S. Government embargo or designated as \"terrorist supporting\", and that you are not on any U.S. Government list of prohibited or restricted parties.",
          "If you downloaded the app from Google Play, Google Play's terms also apply to the download and use of the app.",
        ],
      },
      {
        id: "warranty",
        title: "18. Disclaimer of warranties",
        blocks: [
          "To the maximum extent permitted by law, the app, firmware, website and portal are provided \"as is\" and \"as available\", with all faults, and we disclaim all warranties and conditions, express or implied, including merchantability, fitness for a particular purpose, accuracy, non-infringement and uninterrupted or error-free operation. We do not warrant that an entrance will open or close on every attempt, at any particular time, or only when intended.",
          "Any warranty for Controller hardware is provided by its seller under its sales documents. Nothing in these Terms excludes or limits rights you have as a consumer that cannot be excluded or limited by law, including under the Israeli Consumer Protection Law, 5741-1981.",
        ],
      },
      {
        id: "liability",
        title: "19. Limitation of liability",
        blocks: [
          "To the maximum extent permitted by law, WIFIGATE, its owners, employees and suppliers will not be liable for any damage, loss, injury, cost or claim arising out of or related to:",
          {
            list: [
              "the Supported Equipment, its design, condition, installation, maintenance, safety devices, power supply or wiring, or any movement or action it performs;",
              "the acts or omissions of an Owner, Administrator, User, Guest, Installer, seller or other third party;",
              "use of the Service in breach of these Terms, including while driving, without line of sight of the entrance, or with a safety device disabled;",
              "automatic features, event schedules and override modes, and any opening, closing or holding that results from them;",
              "access granted, shared, not revoked or obtained with a lost or unprotected QR label, phone, invitation or guest pass;",
              "unauthorised entry, burglary, theft, vandalism, damage to vehicles or property, being locked in or out, or loss of access;",
              "unavailability of the Service, the phone, Bluetooth, power, the internet or third-party services.",
            ],
          },
          "To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for loss of profits, revenue, business, data or goodwill.",
          "To the maximum extent permitted by law, our total aggregate liability for all claims arising out of or related to the Service will not exceed the greater of the amount you paid us for the product or service giving rise to the claim during the 12 months before the event that caused it, or 100 Israeli new shekels.",
          "Nothing in these Terms excludes or limits liability for death or personal injury caused by our gross negligence or wilful misconduct, for fraud, or any other liability that cannot be excluded or limited by law. Where the law does not allow a limitation in full, our liability is limited to the minimum extent the law allows.",
        ],
      },
      {
        id: "indemnity",
        title: "20. Indemnity",
        blocks: [
          "You will indemnify and hold harmless WIFIGATE, its owners and employees against any claim, demand, loss, damage, cost or expense, including reasonable legal fees, made by a third party or arising out of your breach of these Terms or of the law, your use of the Service, the configuration of a Controller by you, the access you grant or refuse, the personal data you store on a Controller, or the Supported Equipment you own, operate or install. We will notify you of such a claim and allow you to take part in its defence.",
        ],
      },
      {
        id: "force-majeure",
        title: "21. Events beyond our control",
        blocks: [
          "We are not responsible for any failure or delay caused by events beyond our reasonable control, including power or network failures, failures of third-party services, natural disasters, fire, flood, war, terrorism, epidemics, strikes, government actions and cyber-attacks.",
        ],
      },
      {
        id: "termination",
        title: "22. Suspension and termination",
        blocks: [
          "You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you breach these Terms or if we are required to do so by law.",
          "A Controller continues to operate locally after an account is deleted; its Owner and Administrators remain responsible for it and for the data stored on it. Sections that by their nature should survive termination, including sections 3, 4, 6, 11, 16 and 18 to 25, survive.",
        ],
      },
      {
        id: "law",
        title: "23. Governing law and disputes",
        blocks: [
          "These Terms are governed by the laws of the State of Israel, without regard to conflict-of-law rules. The competent courts in Tel Aviv-Yafo, Israel have exclusive jurisdiction over any dispute arising out of or related to these Terms or the Service.",
          "If you are a consumer, you keep the protection of the mandatory laws of your country of residence and may bring proceedings in the courts that those laws allow.",
        ],
      },
      {
        id: "changes",
        title: "24. Changes to these Terms",
        blocks: [
          "We may update these Terms from time to time. The effective date at the top shows the current version. If a change is material, we will notify you in the app or on the website before it takes effect. If you continue to use the Service after a change takes effect, you accept the updated Terms.",
        ],
      },
      {
        id: "general",
        title: "25. General",
        blocks: [
          "These Terms and our Privacy Policy are the entire agreement between you and us about the Service. A Controller's sales documents govern its sale and hardware warranty; in any other matter these Terms prevail.",
          "If a provision of these Terms is found unenforceable, it will be enforced to the maximum extent permitted and the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not transfer your rights under these Terms without our consent; we may transfer ours to a successor of our business. Nothing in these Terms creates a partnership, agency or employment relationship.",
          "We may send you notices in the app, by email or on the website. These Terms are published in English and Hebrew and may be shown in English on pages in other languages. If versions differ, the English version prevails.",
        ],
      },
      {
        id: "acknowledgement",
        title: "26. Your acknowledgement",
        blocks: [
          "By accepting these Terms you confirm that you have read and understood them, in particular sections 3 to 7 (what WIFIGATE is and safe use), 11 (not a security or life-safety service), 18 (disclaimer of warranties) and 19 (limitation of liability), and that you accept them.",
        ],
      },
      {
        id: "contact",
        title: "27. Contact",
        blocks: [
          "EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions",
          "Email: support@wifigate.io",
          { link: { href: "../privacy-policy/", text: "Read our Privacy Policy" } },
          { link: { href: "../cookies/", text: "Read our Cookie Policy" } },
          { link: { href: "../accessibility/", text: "Read our Accessibility Statement" } },
        ],
      },
    ],
  },

  he: {
    metaTitle: "תנאי שימוש | WIFIGATE",
    metaDescription:
      "התנאים החלים על אפליקציית WIFIGATE, על בקרי WIFIGATE Gate ו‑Dual Control, על האתר ועל פורטל האינטרנט: מה WIFIGATE הוא ומה איננו, שימוש בטוח, אחריות, הסתייגויות והגבלת אחריות.",
    eyebrow: "משפטי",
    title: "תנאי שימוש",
    subtitle:
      "תנאי שימוש אלה חלים על השימוש שלכם ב‑WIFIGATE. הם כוללים הוראות חשובות בנושא בטיחות, בנושא מה ש‑WIFIGATE אחראית לו ומה שאינה אחראית לו, ובנושא הגבלת האחריות שלנו. אנא קראו אותם בעיון.",
    updated: "תאריך תחילה: 4 באוקטובר 2026",
    owner: "נותנת השירות: EATS SYSTEMS TECH (Itay Nave – Engineering and Technology Solutions)",
    sections: [
      {
        id: "agreement",
        title: "1. ההסכם והסכמתכם",
        blocks: [
          "תנאי שימוש אלה (\"התנאים\") הם הסכם מחייב ביניכם לבין EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions (\"WIFIGATE\", \"אנחנו\") לגבי אפליקציית WIFIGATE, בקרי WIFIGATE והקושחה שלהם, האתר wifigate.io ופורטל האינטרנט של WIFIGATE (יחד: \"השירות\").",
          "אתם מקבלים את התנאים ואת מדיניות הפרטיות שלנו ביצירת חשבון, בסימון תיבת ההסכמה באפליקציה, או בהתקנה, בהגדרה או בשימוש בחלק כלשהו מהשירות. אם אתם משתמשים בשירות מטעם עסק, ועד בית או ארגון אחר, אתם מאשרים שאתם מוסמכים לחייב אותו, ו\"אתם\" כולל גם אותו. אם אינכם מקבלים את התנאים, אל תשתמשו בשירות.",
          "פתיחת חשבון, ניהול בקר וקבלת התנאים מותרים רק למי שמלאו לו 18 שנים, או גיל הכשרות המשפטית במקום מגוריו. קטין רשאי להשתמש בשירות רק כשהוא רשום על ידי מנהל בגיר האחראי לשימוש זה ולפיקוח עליו.",
        ],
      },
      {
        id: "definitions",
        title: "2. הגדרות",
        blocks: [
          {
            list: [
              "\"בקר\": התקן WIFIGATE והקושחה שלו, ובכלל זה WIFIGATE Gate (השולט בכניסה אחת) ו‑WIFIGATE Dual Control (השולט בשתי כניסות).",
              "\"ציוד נתמך\": ציוד של צד שלישי שהבקר מחובר אליו, כגון שערים חשמליים, שערים נגררים ושערי כנף, מחסומים, דלתות חניה, תריסים חשמליים, דלתות, מנעולים חשמליים ומנעולים מגנטיים, יחד עם המנוע, יחידת הבקרה, התקני הבטיחות, אספקת החשמל והחיווט שלו.",
              "\"בעלים\": הבעלים של הנכס או של הציוד הנתמך, או אדם או גוף הזכאי לשלוט בו, כגון ועד בית או חברת ניהול.",
              "\"מנהל\": אדם שיש לו הרשאת ניהול בבקר. \"משתמש\": אדם הרשום בבקר. \"אורח\": אדם המשתמש בכרטיס אורח מוגבל בזמן.",
              "\"מתקין\": כל אדם, למעט אנחנו, המתקין, מחבר, מגדיר או מתחזק בקר או ציוד נתמך.",
              "\"הזמנה\": קישור או כרטיס המאפשרים לאדם להירשם בבקר. \"כרטיס אורח\": קישור המאפשר לאורח לפתוח כניסה לזמן מוגבל.",
            ],
          },
        ],
      },
      {
        id: "what-wifigate-is",
        title: "3. מה WIFIGATE הוא, ומה איננו",
        blocks: [
          "WIFIGATE הוא ממשק שליטה. הבקר פועל באותו אופן כמו לחצן, מפסק מפתח או שלט רחוק: כשהוא מקבל פקודה מורשית מהאפליקציה, הוא שולח אות (מגע ממסר) ליחידת הבקרה של הציוד הנתמך. הפתיחה, הסגירה, הנעילה וכל תנועה או פעולה אחרת מבוצעות על ידי הציוד הנתמך ויחידת הבקרה שלו, ולא על ידי WIFIGATE.",
          "WIFIGATE אינה היצרנית, המוכרת, המתקינה, המתחזקת או הבודקת של ציוד נתמך כלשהו. איננו מתכננים, מספקים, מתקינים, בודקים, מאשרים או מתחזקים שערים, מחסומים, דלתות, תריסים, מנעולים, מנועים, יחידות בקרה, התקני בטיחות, אספקת חשמל או חיווט, ואין לנו שליטה על מצבם, על הגדרתם או על פעולתם.",
          "לפיכך, הבטיחות המכנית, החשמלית והתפקודית והאבטחה הפיזית של הציוד הנתמך, ובכלל זה התקני הבטיחות, זיהוי המכשולים, הגבלת הכוח, השחרור הידני והפעלת החירום שלו, התאמתו לאתר ועמידתו בכל דין, תקן, היתר או כלל בנייה, אינן באחריות WIFIGATE. הן באחריות הבעלים, יצרן הציוד הנתמך והמתקין.",
        ],
      },
      {
        id: "safety-measures",
        title: "4. אמצעי הבטיחות של WIFIGATE וגבולותיהם",
        blocks: [
          "אנו מתכננים את השירות עם אמצעי בטיחות ואבטחה תוכנתיים וחומרתיים, ובכלל זה פקודות מוצפנות ומאומתות, בדיקות הרשאה, הגבלת משך החזקת האות, שחרור אוטומטי של אות מוחזק, דחיית פקודות בזמן אירועים ומצבי עקיפה שהוגדרו, ואתחול מאובטח והצפנה בבקרי ייצור.",
          "אמצעים אלה מגינים על שלמות הפקודות ש‑WIFIGATE שולחת ועל זהות מי שרשאי לשלוח אותן. הם אינם הופכים ציוד נתמך כלשהו לבטוח, אינם מזהים אנשים, כלי רכב או חפצים, ואינם מחליפים, ואסור להשתמש בהם במקום, את התקני הבטיחות שהציוד הנתמך והדין מחייבים. אין אמצעי שיכול להבטיח שפקודה תבוצע תמיד, או שלעולם לא תבוצע.",
        ],
      },
      {
        id: "installation",
        title: "5. התקנה וחיבור",
        blocks: [
          "יש להתקין ולחבר בקר רק באמצעות מתקין מוסמך, בהתאם להוראותינו, להוראות יצרן הציוד הנתמך ולכל הדינים והתקנים החלים בתחומי החשמל, האש, הבנייה, הנגישות והבטיחות.",
          "לפני חיבור בקר, על הבעלים ועל המתקין לוודא שהציוד הנתמך תקין, שמותקנים בו כל התקני הבטיחות הנדרשים לו (כגון תאים פוטואלקטריים, חיישני קצה, זיהוי מכשולים והגבלת כוח) ושהתקנים אלה פועלים באופן עצמאי מ‑WIFIGATE, שיש לו שחרור ידני תקין ואמצעי הפעלה עצמאי, ושהתקבלו כל ההיתרים וההסכמות הנדרשים.",
          "המתקינים פועלים בשמם או בשם הבעלים. הם אינם עובדים, סוכנים או נציגים שלנו, ואיננו צד, ואיננו אחראים, להסכם כלשהו בין בעלים לבין מתקין או מוכר.",
        ],
      },
      {
        id: "safe-use",
        title: "6. שימוש בטוח: ההתחייבויות שלכם",
        blocks: [
          "הפעלת ציוד נע באמצעות טלפון כרוכה בסיכונים. אתם מתחייבים שאתם, וכל מי שמשתמש בשירות באמצעות החשבון, ההזמנה או כרטיס האורח שלכם:",
          {
            list: [
              "לא תשתמשו באפליקציה בזמן נהיגה. הפעלת השירות מתוך רכב מותרת רק כשהרכב עומד במקום בטוח ומותר, או באמצעות נוסע. צייתו תמיד לדיני התעבורה; שימוש בטלפון בניגוד להם אסור גם אם האפליקציה פתוחה.",
              "תגדירו פתיחה אוטומטית, ווידג'טים והגדרות אחרות רק כשאתם במצב עמידה, ותתקרבו לכניסה לאט ובתשומת לב כשהפתיחה האוטומטית פעילה.",
              "תפעילו כניסה רק כשאתם רואים אותה ואת כל מסלול תנועתה, ורק לאחר שווידאתם שאין במסלול אדם, ילד, בעל חיים, כלי רכב או חפץ.",
              "לעולם לא תעברו, ולא תאפשרו לאיש לעבור, דרך כניסה בזמן שהיא בתנועה, ולא תאפשרו לילדים להפעיל את השירות או לשחק ליד כניסה.",
              "תפסיקו להשתמש בשירות ותודיעו מיד לבעלים או למנהל אם הציוד הנתמך מתנהג באופן חריג, אינו נעצר או חוזר לאחור כשיש מכשול, או שהתקן בטיחות ניזוק.",
              "תפעלו לפי כללי הנכס והוראות הבעלים והמנהל.",
            ],
          },
          "אתם אחראים לבדכם לכל פגיעה, נזק או הפסד שייגרמו כתוצאה מהפעלת השירות בניגוד לסעיף זה.",
        ],
      },
      {
        id: "automatic-features",
        title: "7. פתיחה אוטומטית ותכונות אוטומטיות אחרות",
        blocks: [
          "פתיחה אוטומטית, לוחות זמנים לאירועים, מצבי עקיפה וווידג'טים במסך הבית עשויים לפתוח כניסה, או להחזיק אותה פתוחה או סגורה, ללא פעולה יזומה באותו רגע. הפתיחה האוטומטית תלויה ב‑Bluetooth של הטלפון, בהגדרות הסוללה וחיסכון החשמל שלו ובמערכת ההפעלה שלו, שאינם בשליטתנו. תכונות אוטומטיות עלולות שלא לפעול, לפעול מאוחר מהצפוי, או לפעול כשאתם קרובים לכניסה מבלי שהתכוונתם לעבור.",
          "מי שמפעיל תכונה אוטומטית עושה זאת לפי שיקול דעתו ואחראי להשתמש בה רק היכן ומתי שהדבר בטוח. אין להשתמש בתכונות אוטומטיות בכניסה שאסור להשאיר ללא השגחה, או במקום שבו פתיחה לא מכוונת עלולה לסכן אנשים או רכוש. ניתן לכבות כל תכונה אוטומטית בכל עת.",
        ],
      },
      {
        id: "accounts",
        title: "8. חשבונות, אישורים ומפתחות גישה",
        blocks: [
          "הכניסה נעשית באמצעות Google או Apple. עליכם למסור מידע מדויק, ובכלל זה את מספר הטלפון בפרופיל, ולעדכן אותו. אתם אחראים לכל פעילות בחשבון ובטלפון שלכם; שמרו על הטלפון נעול ומוגן.",
          "האדם הראשון שסורק את מדבקת ה‑QR של הבקר או את קוד ה‑QR של פאנל הניהול הופך למנהל, וכל מי שסורק אותו לאחר מכן הופך גם הוא למנהל. לכן מדבקת ה‑QR שקולה למפתח ראשי. על הבעלים ועל המנהלים לשמור עליה פיזית, ואסור לצלם, להעתיק או לשתף אותה. איננו אחראים לגישה שהושגה באמצעות מדבקת QR, טלפון, הזמנה או כרטיס אורח שאבדו, שותפו או לא נשמרו.",
          "אם טלפון אבד או נגנב, או שקיים חשד לשימוש לרעה, על המנהל להסיר ללא דיחוי את הגישה הנוגעת בדבר.",
        ],
      },
      {
        id: "administrators",
        title: "9. בעלים ומנהלים",
        blocks: [
          "הבעלים והמנהלים אחראים לבדם להחליט למי יש גישה, להסיר גישה שאינה נחוצה עוד, לדיוק הפרטים שהם רושמים, ולהגדרות של כל בקר, ובכלל זה תכונות אוטומטיות, לוחות זמנים לאירועים ומצבי עקיפה.",
          "הם אחראים למידע האישי שהם שומרים בבקר, ובכלל זה שמות, מספרי טלפון, פרטי דירה וחניה והיסטוריית הכניסות. עליהם לקיים בסיס חוקי לכך, ליידע דיירים, משתמשים ואורחים כנדרש לפי דין, ולטפל בבקשותיהם.",
          "עליהם להיות בעלי הזכות לשלוט בכניסה שבה מותקן הבקר, ובכלל זה כל הסכמה הנדרשת מבעלים, דיירים, שוכרים או ועד בית, ולקבל כל היתר הנדרש להתקנתו ולשימוש בו.",
          "אנו ממליצים לבעלים להחזיק ביטוח רכוש וביטוח אחריות כלפי צד שלישי המתאימים לנכס ולציוד הנתמך. WIFIGATE אינה מבטחת.",
        ],
      },
      {
        id: "invitations",
        title: "10. הזמנות וכרטיסי אורח",
        blocks: [
          "הזמנה או כרטיס אורח מעניקים גישה לכניסה. התייחסו אליהם כמו אל מפתח ושלחו אותם רק לאדם שאליו הם מיועדים. מי שיוצר ושולח אותם אחראי לשימוש בהם.",
          "הזמנה תקפה עד 7 ימים ממועד יצירתה. מחיקת משתמש מבקר אינה מבטלת הזמנה שטרם פגה, ולכן ניתן יהיה להשתמש בה שוב עד שתפוג. כרטיס אורח תקף רק בחלון הזמן שנקבע ביצירתו, ומשתמש יכול לבטל בכל עת את כל כרטיסי האורח שלו.",
        ],
      },
      {
        id: "not-security",
        title: "11. אינו שירות אבטחה, חירום או בטיחות חיים",
        blocks: [
          "WIFIGATE הוא מוצר נוחות לבקרת כניסה. הוא אינו מערכת אזעקה, שירות ניטור, מעקב, חירום, הצלה או בטיחות חיים. איננו מנטרים כניסות, איננו מקבלים התראות ואיננו מזעיקים כוחות חירום, והשירות אינו זמין ואינו נתמך מסביב לשעון.",
          "אל תסתמכו על WIFIGATE כאמצעי היחיד לאבטחת נכס או כאמצעי היחיד לכניסה או ליציאה. יש לשמור תמיד על אמצעי הפעלה עצמאי, כגון מפתח, מקלדת קוד או שחרור ידני, ובכלל זה עבור כוחות החירום ולמקרה של תקלה בחשמל, בטלפון, בסוללה או ב‑Bluetooth. אין להגדיר או להפעיל את WIFIGATE באופן העלול למנוע או לעכב יציאת חירום או את גישתם של כוחות החירום.",
        ],
      },
      {
        id: "availability",
        title: "12. זמינות ותאימות",
        blocks: [
          "הפעלת כניסה מחייבת טלפון תואם עם Bluetooth פעיל, ההרשאות הנדרשות, סוללה מספיקה, וטלפון בטווח הבקר. כניסה לחשבון, עדכוני קושחה ופורטל האינטרנט מחייבים חיבור לאינטרנט. הטווח ומהירות התגובה תלויים בסביבה ובטלפון.",
          "איננו מתחייבים שהשירות תואם לכל טלפון, גרסת מערכת הפעלה או ציוד נתמך, או שיישאר תואם לאחר שינויים שיבצעו צדדים שלישיים. רשימות של ציוד או שימושים נתמכים הן מידע כללי בלבד ואינן התחייבות.",
          "אנו רשאים לשנות, להשעות או להפסיק תכונות, את האפליקציה, את הפורטל או את עדכוני הקושחה. ככל שהדבר אפשרי באופן סביר, ניתן הודעה על שינוי מהותי. בקר ממשיך לפעול באופן מקומי בלי קשר למצב החשבון.",
        ],
      },
      {
        id: "acceptable-use",
        title: "13. שימוש מותר",
        blocks: [
          "אסור לכם:",
          {
            list: [
              "להשתמש בשירות כדי להיכנס, או לאפשר לאחרים להיכנס, למקום ללא הרשאה;",
              "לעקוף, לתקוף או לבדוק את אבטחת השירות, הבקרים, האישורים, ההזמנות או כרטיסי האורח, אלא לפי הסכם בכתב איתנו;",
              "לבצע הנדסה לאחור, הידור לאחור או שינוי של האפליקציה או הקושחה, או לחבר בקר לציוד או למעגל שאינו מיועד לו, אלא במידה שהדין מתיר זאת במפורש למרות מגבלה זו;",
              "לנטרל, לעקוף או לשבש התקן בטיחות של ציוד נתמך, או להפריע לשימוש של אחרים בשירות;",
              "להשתמש בשירות בניגוד לדין, ובכלל זה דיני הגנת הפרטיות, הגנת הצרכן, התעבורה והבטיחות.",
            ],
          },
          "אנו רשאים להשעות או להגביל את הגישה לאפליקציה, לפורטל או לעדכוני הקושחה אם יש לנו יסוד סביר להניח שהתנאים מופרים או שהשירות משמש באופן היוצר סיכון אבטחה או בטיחות.",
        ],
      },
      {
        id: "updates",
        title: "14. עדכונים",
        blocks: [
          "אנו משחררים עדכונים לאפליקציה ולקושחה כדי לתקן תקלות, לשפר את האבטחה ולהוסיף תכונות. עדכון קושחה מותקן רק לאחר שמנהל מאשר אותו, ובקר שאינו מצליח לעלות עם הקושחה החדשה חוזר לגרסה הקודמת. ייתכן שעדכון האפליקציה והבקרים יידרש לשם האבטחה ולפעולת חלק מהתכונות; איננו אחראים לבעיות שנגרמו מאי‑התקנת עדכון.",
        ],
      },
      {
        id: "fees",
        title: "15. תשלום ורכישות",
        blocks: [
          "האפליקציה והתכונות המתוארות בתנאים אלה ניתנות כיום ללא דמי מנוי. הבקרים וההתקנה נמכרים בנפרד לפי הצעת המחיר, החשבונית או ההסכם של המוכר או המתקין, החלים על המחיר, האספקה והאחריות לחומרה. אם נציע תכונות בתשלום, נציג את מחירן ואת תנאיהן לפני שתבחרו לרכוש אותן.",
        ],
      },
      {
        id: "ip",
        title: "16. קניין רוחני ורישיון",
        blocks: [
          "השירות, ובכלל זה האפליקציה, הקושחה, האתר, העיצובים והשם והלוגו WIFIGATE, שייך לנו או למעניקי הרישיון שלנו ומוגן בדין.",
          "בכפוף לתנאים, אנו מעניקים לכם רישיון אישי, לא בלעדי, שאינו ניתן להעברה וניתן לביטול, להשתמש באפליקציה במכשירים שבבעלותכם או בשליטתכם, ולהשתמש בקושחה רק בבקר שעמו היא סופקה. רכיבי קוד פתוח כפופים לרישיונות שלהם, הגוברים לגבי רכיבים אלה. אם תשלחו לנו משוב או הצעות, נוכל להשתמש בהם ללא כל התחייבות כלפיכם.",
        ],
      },
      {
        id: "third-parties",
        title: "17. שירותי צד שלישי וחנויות אפליקציות",
        blocks: [
          "השירות נשען על שירותים ומוצרים של צדדים שלישיים, כגון כניסה באמצעות Google ו‑Apple, Google Firebase, חנויות האפליקציות, הטלפון שלכם ומערכת ההפעלה שלו, והציוד הנתמך. הם מסופקים על ידי צדדים שלישיים לפי תנאיהם, ואיננו אחראים להם.",
          "אם הורדתם את האפליקציה מ‑App Store של Apple: תנאים אלה הם ביניכם לבינינו, ולא בינכם לבין Apple. ל‑Apple אין חובה לספק תחזוקה או תמיכה לאפליקציה. במידה המרבית המותרת בדין, אין ל‑Apple כל חובת אחריות אחרת ביחס לאפליקציה; אם האפליקציה אינה עומדת באחריות החלה, תוכלו להודיע ל‑Apple ו‑Apple תחזיר את מחיר הרכישה, אם שולם. אנחנו, ולא Apple, אחראים לטפל בכל טענה הנוגעת לאפליקציה, ובכלל זה טענות בדבר אחריות למוצר, טענות שהאפליקציה אינה עומדת בדרישה חוקית או רגולטורית, טענות לפי דיני הגנת הצרכן, וטענות שהאפליקציה מפרה קניין רוחני של צד שלישי. Apple וחברות הבת שלה הן צדדים שלישיים הנהנים מתנאים אלה ורשאיות לאכוף אותם כלפיכם. אתם מאשרים שאינכם נמצאים במדינה הנתונה לאמברגו של ממשלת ארה\"ב או שהוגדרה כ\"תומכת טרור\", ושאינכם מופיעים ברשימה כלשהי של ממשלת ארה\"ב של גורמים אסורים או מוגבלים.",
          "אם הורדתם את האפליקציה מ‑Google Play, גם תנאי Google Play חלים על הורדת האפליקציה והשימוש בה.",
        ],
      },
      {
        id: "warranty",
        title: "18. הסתייגות מאחריות",
        blocks: [
          "במידה המרבית המותרת בדין, האפליקציה, הקושחה, האתר והפורטל ניתנים \"כפי שהם\" (AS IS) ו\"כפי שהם זמינים\", על כל פגמיהם, ואנו מסתייגים מכל אחריות ותנאי, מפורשים או משתמעים, ובכלל זה סחירות, התאמה למטרה מסוימת, דיוק, אי‑הפרה ופעולה רציפה או נטולת תקלות. איננו מתחייבים שכניסה תיפתח או תיסגר בכל ניסיון, בזמן מסוים, או רק כשהדבר מכוון.",
          "אחריות כלשהי לחומרת הבקר ניתנת על ידי המוכר שלו לפי מסמכי המכירה. דבר בתנאים אלה אינו שולל או מגביל זכויות העומדות לכם כצרכנים ושלא ניתן לשלול או להגביל אותן לפי דין, ובכלל זה לפי חוק הגנת הצרכן, התשמ\"א‑1981.",
        ],
      },
      {
        id: "liability",
        title: "19. הגבלת אחריות",
        blocks: [
          "במידה המרבית המותרת בדין, WIFIGATE, בעליה, עובדיה וספקיה לא יישאו באחריות לכל נזק, הפסד, פגיעה, עלות או תביעה הנובעים מהדברים הבאים או קשורים אליהם:",
          {
            list: [
              "הציוד הנתמך, תכנונו, מצבו, התקנתו, תחזוקתו, התקני הבטיחות, אספקת החשמל או החיווט שלו, או כל תנועה או פעולה שהוא מבצע;",
              "מעשים או מחדלים של בעלים, מנהל, משתמש, אורח, מתקין, מוכר או צד שלישי אחר;",
              "שימוש בשירות בניגוד לתנאים, ובכלל זה בזמן נהיגה, ללא קשר עין עם הכניסה, או כשהתקן בטיחות מנוטרל;",
              "תכונות אוטומטיות, לוחות זמנים לאירועים ומצבי עקיפה, וכל פתיחה, סגירה או החזקה הנובעת מהם;",
              "גישה שהוענקה, שותפה, לא בוטלה או הושגה באמצעות מדבקת QR, טלפון, הזמנה או כרטיס אורח שאבדו או לא נשמרו;",
              "כניסה ללא הרשאה, פריצה, גניבה, השחתה, נזק לכלי רכב או לרכוש, היתקעות בפנים או בחוץ, או אובדן גישה;",
              "אי‑זמינות של השירות, הטלפון, ה‑Bluetooth, החשמל, האינטרנט או שירותי צד שלישי.",
            ],
          },
          "במידה המרבית המותרת בדין, לא נישא באחריות לכל נזק עקיף, אגבי, מיוחד, תוצאתי, לדוגמה או עונשי, או לאובדן רווחים, הכנסות, עסקים, מידע או מוניטין.",
          "במידה המרבית המותרת בדין, האחריות הכוללת והמצטברת שלנו לכל הטענות הנובעות מהשירות או הקשורות אליו לא תעלה על הגבוה מבין הסכום ששילמתם לנו עבור המוצר או השירות שבגינו הוגשה הטענה ב‑12 החודשים שקדמו לאירוע שגרם לה, לבין 100 שקלים חדשים.",
          "דבר בתנאים אלה אינו שולל או מגביל אחריות למוות או לנזק גוף שנגרמו ברשלנות רבתי או בזדון מצדנו, למרמה, או לכל אחריות אחרת שלא ניתן לשלול או להגביל לפי דין. כאשר הדין אינו מתיר הגבלה מלאה, האחריות שלנו מוגבלת במידה המזערית שהדין מתיר.",
        ],
      },
      {
        id: "indemnity",
        title: "20. שיפוי",
        blocks: [
          "תשפו ותפצו את WIFIGATE, את בעליה ואת עובדיה בגין כל תביעה, דרישה, הפסד, נזק, עלות או הוצאה, ובכלל זה שכר טרחת עורכי דין סביר, שיוגשו על ידי צד שלישי או שינבעו מהפרת התנאים או הדין על ידיכם, מהשימוש שלכם בשירות, מהגדרת בקר על ידיכם, מהגישה שהענקתם או שסירבתם להעניק, מהמידע האישי ששמרתם בבקר, או מהציוד הנתמך שבבעלותכם, בהפעלתכם או בהתקנתכם. נודיע לכם על תביעה כזו ונאפשר לכם להשתתף בהגנה מפניה.",
        ],
      },
      {
        id: "force-majeure",
        title: "21. אירועים שאינם בשליטתנו",
        blocks: [
          "איננו אחראים לכל כשל או עיכוב שנגרמו מאירועים שאינם בשליטתנו הסבירה, ובכלל זה תקלות חשמל או רשת, כשלים בשירותי צד שלישי, אסונות טבע, שריפה, הצפה, מלחמה, טרור, מגפות, שביתות, פעולות של רשויות ומתקפות סייבר.",
        ],
      },
      {
        id: "termination",
        title: "22. השעיה וסיום",
        blocks: [
          "תוכלו להפסיק להשתמש בשירות ולמחוק את החשבון בכל עת. אנו רשאים להשעות או לסיים את הגישה שלכם אם הפרתם את התנאים או אם הדין מחייב אותנו לעשות זאת.",
          "בקר ממשיך לפעול באופן מקומי לאחר מחיקת חשבון; הבעלים והמנהלים שלו נשארים אחראים לו ולמידע השמור בו. סעיפים שמטבעם נועדו לחול גם לאחר הסיום, ובכלל זה סעיפים 3, 4, 6, 11, 16 ו‑18 עד 25, ימשיכו לחול.",
        ],
      },
      {
        id: "law",
        title: "23. דין חל וסמכות שיפוט",
        blocks: [
          "על תנאים אלה יחולו דיני מדינת ישראל, בלי להחיל את כללי ברירת הדין. לבתי המשפט המוסמכים בתל אביב‑יפו, ישראל, תהיה סמכות שיפוט ייחודית בכל מחלוקת הנובעת מתנאים אלה או מהשירות או הקשורה אליהם.",
          "אם אתם צרכנים, אתם שומרים על ההגנה של הדינים הקוגנטיים של מדינת מגוריכם, ורשאים לפנות לבתי המשפט שדינים אלה מתירים.",
        ],
      },
      {
        id: "changes",
        title: "24. שינויים בתנאים",
        blocks: [
          "אנו רשאים לעדכן תנאים אלה מעת לעת. תאריך התחילה בראש הדף מציין את הגרסה הנוכחית. אם יחול שינוי מהותי, נודיע עליו באפליקציה או באתר לפני שייכנס לתוקף. המשך השימוש בשירות לאחר כניסת השינוי לתוקף מהווה הסכמה לתנאים המעודכנים.",
        ],
      },
      {
        id: "general",
        title: "25. כללי",
        blocks: [
          "תנאים אלה ומדיניות הפרטיות שלנו הם ההסכם המלא ביניכם לבינינו לגבי השירות. מסמכי המכירה של בקר חלים על מכירתו ועל האחריות לחומרה; בכל עניין אחר תנאים אלה גוברים.",
          "אם הוראה בתנאים אלה תימצא בלתי אכיפה, היא תיאכף במידה המרבית המותרת ויתר ההוראות יישארו בתוקף. אי‑אכיפת הוראה אינה מהווה ויתור. אינכם רשאים להעביר את זכויותיכם לפי התנאים ללא הסכמתנו; אנו רשאים להעביר את זכויותינו לחליף של העסק. דבר בתנאים אלה אינו יוצר יחסי שותפות, שליחות או עבודה.",
          "אנו רשאים לשלוח לכם הודעות באפליקציה, בדוא\"ל או באתר. תנאים אלה מתפרסמים באנגלית ובעברית, ובדפים בשפות אחרות הם עשויים להופיע באנגלית. במקרה של סתירה בין הנוסחים, הנוסח האנגלי גובר.",
        ],
      },
      {
        id: "acknowledgement",
        title: "26. הצהרתכם",
        blocks: [
          "בקבלת התנאים אתם מאשרים שקראתם והבנתם אותם, ובמיוחד את סעיפים 3 עד 7 (מה WIFIGATE הוא ושימוש בטוח), 11 (אינו שירות אבטחה או בטיחות חיים), 18 (הסתייגות מאחריות) ו‑19 (הגבלת אחריות), ושאתם מקבלים אותם.",
        ],
      },
      {
        id: "contact",
        title: "27. יצירת קשר",
        blocks: [
          "EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions",
          "דוא\"ל: support@wifigate.io",
          { link: { href: "../privacy-policy/", text: "למדיניות הפרטיות" } },
          { link: { href: "../cookies/", text: "למדיניות העוגיות" } },
          { link: { href: "../accessibility/", text: "להצהרת הנגישות" } },
        ],
      },
    ],
  },
};
