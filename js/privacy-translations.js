// /js/privacy-translations.js
// Version: 1.0.0

(function () {
  const sharedLegal = {
    en: {
      cta: {
        pricing: {
          title: "Need pricing or installation guidance?",
          text: "Send us a WhatsApp message and we will help with product fit, installation considerations, and next steps.",
          button: "Open WhatsApp",
        },
        back: {
          title: "Back to the main site",
          text: "Return to the homepage to review features, applications, tutorials, and contact details.",
          button: "Go to homepage",
        },
      },
      footer: {
        tagline: "Smart access control for gates, doors, and secured properties.",
      },
    },
    he: {
      cta: {
        pricing: {
          title: "זקוקים למחיר או להכוונה לגבי התקנה?",
          text: "שלחו לנו הודעת WhatsApp ונשמח לסייע בהתאמת המוצר, בשיקולי ההתקנה ובשלבים הבאים.",
          button: "פתחו WhatsApp",
        },
        back: {
          title: "חזרה לאתר הראשי",
          text: "חזרו לעמוד הבית כדי לעיין בתכונות, ביישומים, בהדרכות ובפרטי הקשר.",
          button: "לעמוד הבית",
        },
      },
      footer: {
        tagline: "בקרת גישה חכמה לשערים, דלתות ונכסים מאובטחים.",
      },
    },
    es: {
      cta: {
        pricing: {
          title: "¿Necesitas precios u orientación de instalación?",
          text: "Envíanos un mensaje por WhatsApp y te ayudaremos con la adecuación del producto, las consideraciones de instalación y los siguientes pasos.",
          button: "Abrir WhatsApp",
        },
        back: {
          title: "Volver al sitio principal",
          text: "Vuelve a la página principal para revisar funciones, aplicaciones, tutoriales y datos de contacto.",
          button: "Ir a la página principal",
        },
      },
      footer: {
        tagline: "Control de acceso inteligente para portones, puertas y propiedades protegidas.",
      },
    },
    pt: {
      cta: {
        pricing: {
          title: "Precisa de preços ou orientação de instalação?",
          text: "Envie-nos uma mensagem por WhatsApp e ajudaremos com a adequação do produto, as considerações de instalação e os próximos passos.",
          button: "Abrir WhatsApp",
        },
        back: {
          title: "Voltar ao site principal",
          text: "Regresse à página inicial para consultar funcionalidades, aplicações, tutoriais e dados de contacto.",
          button: "Ir para a página inicial",
        },
      },
      footer: {
        tagline: "Controlo de acesso inteligente para portões, portas e propriedades protegidas.",
      },
    },
    pl: {
      cta: {
        pricing: {
          title: "Potrzebujesz wyceny lub wskazówek instalacyjnych?",
          text: "Wyślij nam wiadomość przez WhatsApp, a pomożemy w dopasowaniu produktu, kwestiach instalacyjnych i kolejnych krokach.",
          button: "Otwórz WhatsApp",
        },
        back: {
          title: "Powrót do strony głównej",
          text: "Wróć do strony głównej, aby sprawdzić funkcje, zastosowania, poradniki i dane kontaktowe.",
          button: "Przejdź do strony głównej",
        },
      },
      footer: {
        tagline: "Inteligentna kontrola dostępu do bram, drzwi i zabezpieczonych obiektów.",
      },
    },
    ru: {
      cta: {
        pricing: {
          title: "Нужна цена или помощь по установке?",
          text: "Напишите нам в WhatsApp, и мы поможем с подбором продукта, вопросами установки и следующими шагами.",
          button: "Открыть WhatsApp",
        },
        back: {
          title: "Вернуться на основной сайт",
          text: "Вернитесь на главную страницу, чтобы посмотреть функции, сценарии применения, инструкции и контактные данные.",
          button: "Перейти на главную",
        },
      },
      footer: {
        tagline: "Умный контроль доступа для ворот, дверей и защищенных объектов.",
      },
    },
    cs: {
      cta: {
        pricing: {
          title: "Potřebujete cenu nebo radu k instalaci?",
          text: "Pošlete nám zprávu přes WhatsApp a pomůžeme vám s vhodností produktu, požadavky na instalaci a dalšími kroky.",
          button: "Otevřít WhatsApp",
        },
        back: {
          title: "Zpět na hlavní web",
          text: "Vraťte se na domovskou stránku a projděte si funkce, použití, návody a kontaktní údaje.",
          button: "Přejít na domovskou stránku",
        },
      },
      footer: {
        tagline: "Chytré řízení přístupu pro brány, dveře a zabezpečené objekty.",
      },
    },
    ar: {
      cta: {
        pricing: {
          title: "هل تحتاج إلى سعر أو إرشاد بخصوص التركيب؟",
          text: "أرسل لنا رسالة عبر WhatsApp وسنساعدك في ملاءمة المنتج واعتبارات التركيب والخطوات التالية.",
          button: "فتح WhatsApp",
        },
        back: {
          title: "العودة إلى الموقع الرئيسي",
          text: "ارجع إلى الصفحة الرئيسية لمراجعة الميزات والاستخدامات والشروحات وبيانات التواصل.",
          button: "الانتقال إلى الصفحة الرئيسية",
        },
      },
      footer: {
        tagline: "تحكم ذكي في الدخول للبوابات والأبواب والعقارات المؤمنة.",
      },
    },
  }

  const privacyTranslations = {
    en: {
      metaTags: {
        title: "WIFIGATE Privacy Policy",
        description:
          "Privacy Policy for the WIFIGATE website, mobile app, WiFiGate device, access events, invitations, diagnostics, local storage, and related access-control features.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Privacy Policy",
        subtitle:
          "This Privacy Policy explains how WIFIGATE may collect, use, store, display, and share information relating to the website, mobile app, WiFiGate device, controller, invitations, access events, and related access-control features.",
        updated: "Effective date: [Effective Date]",
        owner: "Website owner: EATS SYSTEMS TECH",
        disclaimer:
          "This document is provided as a general privacy policy draft and should be reviewed by qualified legal counsel before publication.",
      },
      sections: {
        overview: {
          title: "1. Overview",
          body1:
            "This Privacy Policy applies to the WIFIGATE website, mobile app, WiFiGate device, controller, and related access-control features used by customers, property owners, administrators, installers, users, and guests.",
          body2:
            "It explains in general terms what information may be handled by the product and how that information may be used, stored, displayed, and shared.",
        },
        scope: {
          title: "2. What This Policy Covers",
          body1:
            "This policy covers information related to website visits, product inquiries, support communications, mobile app use, access management, invitations, access events, device status, technical diagnostics, and related product operations.",
          body2:
            "This policy does not replace customer-specific agreements, property notices, installer notices, or third-party policies that may also apply in a particular installation or jurisdiction.",
        },
        collect: {
          title: "3. Information WiFiGate May Collect",
          intro:
            "Depending on the product features used, WiFiGate may handle the following categories of information:",
          item1:
            "Contact details and inquiry information submitted through the website, WhatsApp, email, phone, or other support channels.",
          item2:
            "User profile details such as name, phone number, app language, and access-related role information.",
          item3:
            "Access-management information such as admins, users, guests, invitations, invitation timing, access permissions, and related property or group details.",
          item4:
            "Access events, access history, device status, technical diagnostics, update-related information, and product logs.",
          item5:
            "Device and app information needed for product operation, such as local connection status, permissions, phone compatibility, and configuration details.",
          item6:
            "Website preference information and similar browser-side settings, including selected language and accessibility preferences.",
        },
        use: {
          title: "4. How WiFiGate May Use Information",
          intro: "WiFiGate may use information for the following purposes:",
          item1:
            "To provide, operate, configure, maintain, and support the website, app, device, and related access-control features.",
          item2:
            "To manage users, admins, guests, invitations, access permissions, and product settings.",
          item3:
            "To display access events, system activity, device status, and related product information to authorized users.",
          item4:
            "To troubleshoot technical issues, improve product reliability, and review safety, configuration, or support issues.",
          item5:
            "To respond to inquiries, provide customer support, communicate about installations, and send product or service information relevant to a request or account.",
        },
        sharing: {
          title: "5. When Information May Be Shared",
          body1:
            "WiFiGate may display or make information available to authorized property owners, administrators, installers, or users where that access is part of the product's intended operation.",
          body2:
            "Information may also be shared where reasonably necessary to provide support, address technical or safety issues, comply with legal obligations, enforce applicable terms, or protect rights, property, and safety.",
          body3:
            "This policy draft does not describe any public sale of personal information. Any future changes in product data sharing practices should be reflected in an updated privacy notice.",
        },
        storage: {
          title: "6. Local Storage and Product-Specific Storage",
          body1:
            "Depending on the implementation, information may be stored locally on the mobile device, on the WiFiGate device, or using another product-specific storage method used by the product.",
          body2:
            "Different installations may use different product settings or storage arrangements. Customers, property owners, and administrators should review their own installation and access practices to understand how data is handled in their environment.",
        },
        websiteStorage: {
          title: "7. Website Preferences, Cookies, and Similar Technologies",
          body1:
            "The WiFiGate website may use limited browser-side technologies, including preference storage, to remember selected language and accessibility settings and to improve site usability.",
          body2:
            "Please also review the WiFiGate Cookies page for more detail about website cookies and similar technologies.",
        },
        retention: {
          title: "8. Data Retention",
          body1:
            "WiFiGate may retain information for as long as reasonably necessary for product operation, support, troubleshooting, legal compliance, dispute resolution, recordkeeping, or other legitimate product or business purposes.",
          body2:
            "Retention periods may vary depending on the type of information, the installation, the feature used, applicable legal obligations, and whether the information remains needed for product administration or security review.",
        },
        security: {
          title: "9. Security",
          body1:
            "WiFiGate uses reasonable measures intended to protect information and product access, but no website, app, device, phone, wireless connection, or access-control system can be guaranteed completely secure.",
          body2:
            "Customers, administrators, installers, and users also play an important role in security by protecting devices, permissions, invitations, access methods, and installation settings.",
        },
        rights: {
          title: "10. Your Choices and Rights",
          body1:
            "Depending on the product setup and applicable law, you may be able to request access to, correction of, deletion of, restriction of, or information about certain personal data handled by WiFiGate.",
          body2:
            "Some requests may need to be handled by the relevant property owner, system administrator, installer, or account contact, depending on who controls the installation and the related information.",
        },
        children: {
          title: "11. Children",
          body1:
            "WiFiGate is not designed as a children's product. If personal information relating to a child is believed to have been provided inappropriately, contact WiFiGate so the matter can be reviewed.",
        },
        changes: {
          title: "12. Changes to This Privacy Policy",
          body1:
            "WiFiGate may update this Privacy Policy from time to time. The latest version will apply when published on this page or otherwise made available with the product.",
        },
        contact: {
          title: "13. Contact",
          body1:
            "Questions about this Privacy Policy or privacy-related requests may be sent using the contact details below.",
          item1Label: "Website owner / operating name:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Company legal name:",
          item2Value: "[Company Legal Name]",
          item3Label: "Company address:",
          item3Value: "[Company Address]",
          item4Label: "Support email:",
          item4Value: "[Support Email]",
          item5Label: "Effective date:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "This Privacy Policy is a general draft for the WiFiGate product and website. It should be reviewed and adapted for the actual operating company, installation model, data flows, and legal requirements before publication.",
    },
    he: {
      metaTags: {
        title: "מדיניות פרטיות | WIFIGATE",
        description:
          "מדיניות פרטיות עבור אתר WIFIGATE, האפליקציה לנייד, מכשיר WiFiGate, אירועי גישה, הזמנות, אבחון, אחסון מקומי ותכונות בקרת גישה קשורות.",
      },
      hero: {
        eyebrow: "משפטי",
        title: "מדיניות פרטיות",
        subtitle:
          "מדיניות פרטיות זו מסבירה כיצד WIFIGATE עשויה לאסוף, להשתמש, לשמור, להציג ולשתף מידע הקשור לאתר, לאפליקציה לנייד, למכשיר WiFiGate, לבקר, להזמנות, לאירועי גישה ולתכונות בקרת גישה קשורות.",
        updated: "תאריך תחילה: [Effective Date]",
        owner: "בעל האתר: EATS SYSTEMS TECH",
        disclaimer:
          "מסמך זה מסופק כטיוטת מדיניות פרטיות כללית ויש להעבירו לבדיקה של יועץ משפטי מוסמך לפני הפרסום.",
      },
      sections: {
        overview: {
          title: "1. מבוא",
          body1:
            "מדיניות פרטיות זו חלה על אתר WIFIGATE, האפליקציה לנייד, מכשיר WiFiGate, הבקר ותכונות בקרת הגישה הקשורות, המשמשים לקוחות, בעלי נכסים, מנהלים, מתקינים, משתמשים ואורחים.",
          body2:
            "היא מסבירה באופן כללי איזה מידע עשוי להיות מטופל על ידי המוצר וכיצד מידע זה עשוי לשמש, להישמר, להיות מוצג ולהיות משותף.",
        },
        scope: {
          title: "2. על מה המדיניות חלה",
          body1:
            "מדיניות זו חלה על מידע הקשור לביקורים באתר, לפניות לגבי המוצר, לתקשורת תמיכה, לשימוש באפליקציה לנייד, לניהול גישה, להזמנות, לאירועי גישה, למצב המכשיר, לאבחון טכני ולפעולות מוצר קשורות.",
          body2:
            "מדיניות זו אינה מחליפה הסכמים ייעודיים ללקוח, הודעות נכס, הודעות מתקין או מדיניות של צדדים שלישיים שעשויות לחול גם בהתקנה או בתחום שיפוט מסוים.",
        },
        collect: {
          title: "3. איזה מידע WiFiGate עשויה לאסוף",
          intro:
            "בהתאם לתכונות המוצר שבהן נעשה שימוש, WiFiGate עשויה לטפל בקטגוריות המידע הבאות:",
          item1:
            "פרטי קשר ומידע מפניות שנשלחו דרך האתר, WhatsApp, דוא\"ל, טלפון או ערוצי תמיכה אחרים.",
          item2:
            "פרטי פרופיל משתמש כגון שם, מספר טלפון, שפת האפליקציה ופרטי תפקיד הקשורים לגישה.",
          item3:
            "מידע לניהול גישה כגון מנהלים, משתמשים, אורחים, הזמנות, זמני הזמנה, הרשאות גישה ופרטי נכס או קבוצה קשורים.",
          item4:
            "אירועי גישה, היסטוריית גישה, מצב מכשיר, אבחון טכני, מידע הקשור לעדכונים ויומני מוצר.",
          item5:
            "מידע על המכשיר והאפליקציה הדרוש להפעלת המוצר, כגון מצב חיבור מקומי, הרשאות, תאימות הטלפון ופרטי תצורה.",
          item6:
            "מידע על העדפות אתר והגדרות דפדפן דומות, כולל שפה שנבחרה והעדפות נגישות.",
        },
        use: {
          title: "4. כיצד WiFiGate עשויה להשתמש במידע",
          intro: "WiFiGate עשויה להשתמש במידע למטרות הבאות:",
          item1:
            "כדי לספק, להפעיל, להגדיר, לתחזק ולתמוך באתר, באפליקציה, במכשיר ובתכונות בקרת הגישה הקשורות.",
          item2:
            "כדי לנהל משתמשים, מנהלים, אורחים, הזמנות, הרשאות גישה והגדרות מוצר.",
          item3:
            "כדי להציג אירועי גישה, פעילות מערכת, מצב מכשיר ומידע מוצר קשור למשתמשים מורשים.",
          item4:
            "כדי לפתור בעיות טכניות, לשפר את אמינות המוצר ולבחון סוגיות בטיחות, תצורה או תמיכה.",
          item5:
            "כדי להשיב לפניות, לספק תמיכת לקוחות, לתקשר לגבי התקנות ולשלוח מידע על מוצר או שירות הרלוונטי לפנייה או לחשבון.",
        },
        sharing: {
          title: "5. מתי מידע עשוי להיות משותף",
          body1:
            "WiFiGate עשויה להציג או לאפשר גישה למידע לבעלי נכסים, מנהלים, מתקינים או משתמשים מורשים כאשר גישה זו היא חלק מהפעולה המיועדת של המוצר.",
          body2:
            "מידע עשוי להיות משותף גם כאשר הדבר נחוץ באופן סביר לצורך תמיכה, טיפול בבעיות טכניות או בטיחותיות, עמידה בחובות חוקיות, אכיפת תנאים רלוונטיים או הגנה על זכויות, רכוש ובטיחות.",
          body3:
            "טיוטת מדיניות זו אינה מתארת מכירה פומבית של מידע אישי. כל שינוי עתידי בנוהלי שיתוף הנתונים של המוצר צריך להשתקף בהודעת פרטיות מעודכנת.",
        },
        storage: {
          title: "6. אחסון מקומי ואחסון ייעודי למוצר",
          body1:
            "בהתאם לאופן היישום, מידע עשוי להישמר מקומית על המכשיר הנייד, על גבי מכשיר WiFiGate או באמצעות שיטת אחסון אחרת הייעודית למוצר.",
          body2:
            "התקנות שונות עשויות להשתמש בהגדרות מוצר או בסידורי אחסון שונים. לקוחות, בעלי נכסים ומנהלים צריכים לבחון את ההתקנה ואת נוהלי הגישה שלהם כדי להבין כיצד המידע מטופל בסביבה שלהם.",
        },
        websiteStorage: {
          title: "7. העדפות אתר, עוגיות וטכנולוגיות דומות",
          body1:
            "אתר WiFiGate עשוי להשתמש בטכנולוגיות מוגבלות בצד הדפדפן, כולל אחסון העדפות, כדי לזכור שפה שנבחרה והגדרות נגישות ולשפר את השימושיות של האתר.",
          body2:
            "אנא עיינו גם בעמוד העוגיות של WiFiGate לקבלת פירוט נוסף על עוגיות האתר וטכנולוגיות דומות.",
        },
        retention: {
          title: "8. שמירת מידע",
          body1:
            "WiFiGate עשויה לשמור מידע כל עוד הדבר נחוץ באופן סביר להפעלת המוצר, לתמיכה, לפתרון תקלות, לעמידה בדרישות חוק, ליישוב מחלוקות, לניהול רשומות או למטרות מוצר או עסק לגיטימיות אחרות.",
          body2:
            "תקופות השמירה עשויות להשתנות בהתאם לסוג המידע, להתקנה, לתכונה שבה נעשה שימוש, לחובות חוקיות רלוונטיות ולשאלה האם המידע עדיין נדרש לניהול המוצר או לבדיקת אבטחה.",
        },
        security: {
          title: "9. אבטחה",
          body1:
            "WiFiGate משתמשת באמצעים סבירים שנועדו להגן על מידע ועל הגישה למוצר, אך לא ניתן להבטיח שמלוא האבטחה יתקיים בכל אתר, אפליקציה, מכשיר, טלפון, חיבור אלחוטי או מערכת בקרת גישה.",
          body2:
            "גם ללקוחות, למנהלים, למתקינים ולמשתמשים יש תפקיד חשוב באבטחה באמצעות הגנה על מכשירים, הרשאות, הזמנות, שיטות גישה והגדרות התקנה.",
        },
        rights: {
          title: "10. הבחירות והזכויות שלכם",
          body1:
            "בהתאם לאופן הגדרת המוצר ולדין החל, ייתכן שתוכלו לבקש גישה למידע אישי מסוים שמטופל על ידי WiFiGate, לתקנו, למחוק אותו, להגביל את השימוש בו או לקבל מידע עליו.",
          body2:
            "ייתכן שחלק מהבקשות יצטרכו להיות מטופלות על ידי בעל הנכס הרלוונטי, מנהל המערכת, המתקין או איש הקשר של החשבון, בהתאם לגורם השולט בהתקנה ובמידע הקשור אליה.",
        },
        children: {
          title: "11. ילדים",
          body1:
            "WiFiGate לא תוכננה כמוצר לילדים. אם סבורים שמידע אישי הקשור לילד נמסר באופן לא מתאים, יש לפנות ל-WiFiGate כדי שניתן יהיה לבדוק את הנושא.",
        },
        changes: {
          title: "12. שינויים במדיניות פרטיות זו",
          body1:
            "WiFiGate עשויה לעדכן מדיניות פרטיות זו מעת לעת. הגרסה העדכנית תחול כאשר תפורסם בעמוד זה או תהיה זמינה בדרך אחרת עם המוצר.",
        },
        contact: {
          title: "13. יצירת קשר",
          body1:
            "שאלות לגבי מדיניות פרטיות זו או בקשות הקשורות לפרטיות ניתן לשלוח באמצעות פרטי הקשר שלהלן.",
          item1Label: "בעל האתר / השם המפעיל:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "השם המשפטי של החברה:",
          item2Value: "[Company Legal Name]",
          item3Label: "כתובת החברה:",
          item3Value: "[Company Address]",
          item4Label: "דוא\"ל תמיכה:",
          item4Value: "[Support Email]",
          item5Label: "תאריך תחילה:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "מדיניות פרטיות זו היא טיוטה כללית עבור מוצר ואתר WiFiGate. יש לבדוק ולהתאים אותה לחברה המפעילה בפועל, למודל ההתקנה, לזרימות הנתונים ולדרישות החוק לפני הפרסום.",
    },
    es: {
      metaTags: {
        title: "Política de Privacidad | WIFIGATE",
        description:
          "Política de Privacidad para el sitio web de WIFIGATE, la app móvil, el dispositivo WiFiGate, eventos de acceso, invitaciones, diagnósticos, almacenamiento local y funciones relacionadas de control de acceso.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Política de Privacidad",
        subtitle:
          "Esta Política de Privacidad explica cómo WIFIGATE puede recopilar, usar, almacenar, mostrar y compartir información relacionada con el sitio web, la app móvil, el dispositivo WiFiGate, el controlador, las invitaciones, los eventos de acceso y las funciones relacionadas de control de acceso.",
        updated: "Fecha de entrada en vigor: [Effective Date]",
        owner: "Propietario del sitio web: EATS SYSTEMS TECH",
        disclaimer:
          "Este documento se proporciona como un borrador general de política de privacidad y debe ser revisado por un asesor legal cualificado antes de su publicación.",
      },
      sections: {
        overview: {
          title: "1. Resumen",
          body1:
            "Esta Política de Privacidad se aplica al sitio web de WIFIGATE, la app móvil, el dispositivo WiFiGate, el controlador y las funciones relacionadas de control de acceso utilizadas por clientes, propietarios, administradores, instaladores, usuarios e invitados.",
          body2:
            "Explica en términos generales qué información puede manejar el producto y cómo dicha información puede usarse, almacenarse, mostrarse y compartirse.",
        },
        scope: {
          title: "2. Qué Cubre Esta Política",
          body1:
            "Esta política cubre información relacionada con visitas al sitio web, consultas sobre el producto, comunicaciones de soporte, uso de la app móvil, gestión de accesos, invitaciones, eventos de acceso, estado del dispositivo, diagnósticos técnicos y operaciones relacionadas del producto.",
          body2:
            "Esta política no sustituye acuerdos específicos con clientes, avisos de propiedad, avisos de instaladores o políticas de terceros que también puedan aplicarse en una instalación o jurisdicción determinada.",
        },
        collect: {
          title: "3. Información que WiFiGate Puede Recopilar",
          intro:
            "Según las funciones del producto utilizadas, WiFiGate puede manejar las siguientes categorías de información:",
          item1:
            "Datos de contacto e información de consultas enviadas por el sitio web, WhatsApp, correo electrónico, teléfono u otros canales de soporte.",
          item2:
            "Datos del perfil del usuario, como nombre, número de teléfono, idioma de la app e información del rol relacionada con el acceso.",
          item3:
            "Información de gestión de accesos, como administradores, usuarios, invitados, invitaciones, horarios de invitación, permisos de acceso y datos relacionados de la propiedad o del grupo.",
          item4:
            "Eventos de acceso, historial de accesos, estado del dispositivo, diagnósticos técnicos, información relacionada con actualizaciones y registros del producto.",
          item5:
            "Información del dispositivo y de la app necesaria para el funcionamiento del producto, como estado de la conexión local, permisos, compatibilidad del teléfono y detalles de configuración.",
          item6:
            "Información de preferencias del sitio web y ajustes similares del navegador, incluida la selección de idioma y las preferencias de accesibilidad.",
        },
        use: {
          title: "4. Cómo WiFiGate Puede Usar la Información",
          intro: "WiFiGate puede usar la información para los siguientes fines:",
          item1:
            "Proporcionar, operar, configurar, mantener y dar soporte al sitio web, la app, el dispositivo y las funciones relacionadas de control de acceso.",
          item2:
            "Gestionar usuarios, administradores, invitados, invitaciones, permisos de acceso y ajustes del producto.",
          item3:
            "Mostrar eventos de acceso, actividad del sistema, estado del dispositivo e información relacionada del producto a usuarios autorizados.",
          item4:
            "Resolver problemas técnicos, mejorar la fiabilidad del producto y revisar cuestiones de seguridad, configuración o soporte.",
          item5:
            "Responder a consultas, proporcionar atención al cliente, comunicarse sobre instalaciones y enviar información de producto o servicio relevante para una solicitud o cuenta.",
        },
        sharing: {
          title: "5. Cuándo Puede Compartirse la Información",
          body1:
            "WiFiGate puede mostrar o poner información a disposición de propietarios, administradores, instaladores o usuarios autorizados cuando ese acceso forme parte del funcionamiento previsto del producto.",
          body2:
            "La información también puede compartirse cuando sea razonablemente necesario para prestar soporte, resolver problemas técnicos o de seguridad, cumplir obligaciones legales, hacer valer términos aplicables o proteger derechos, bienes y seguridad.",
          body3:
            "Este borrador de política no describe ninguna venta pública de información personal. Cualquier cambio futuro en las prácticas de intercambio de datos del producto deberá reflejarse en un aviso de privacidad actualizado.",
        },
        storage: {
          title: "6. Almacenamiento Local y Almacenamiento Específico del Producto",
          body1:
            "Según la implementación, la información puede almacenarse localmente en el dispositivo móvil, en el dispositivo WiFiGate o mediante otro método de almacenamiento específico del producto.",
          body2:
            "Diferentes instalaciones pueden utilizar distintos ajustes del producto o formas de almacenamiento. Los clientes, propietarios y administradores deben revisar su propia instalación y prácticas de acceso para comprender cómo se maneja la información en su entorno.",
        },
        websiteStorage: {
          title: "7. Preferencias del Sitio Web, Cookies y Tecnologías Similares",
          body1:
            "El sitio web de WiFiGate puede usar tecnologías limitadas del lado del navegador, incluido el almacenamiento de preferencias, para recordar el idioma seleccionado y los ajustes de accesibilidad y mejorar la usabilidad del sitio.",
          body2:
            "Consulta también la página de Cookies de WiFiGate para obtener más información sobre las cookies del sitio web y tecnologías similares.",
        },
        retention: {
          title: "8. Conservación de Datos",
          body1:
            "WiFiGate puede conservar información durante el tiempo razonablemente necesario para la operación del producto, soporte, resolución de problemas, cumplimiento legal, resolución de disputas, mantenimiento de registros u otros fines legítimos del producto o del negocio.",
          body2:
            "Los periodos de conservación pueden variar según el tipo de información, la instalación, la función utilizada, las obligaciones legales aplicables y si la información sigue siendo necesaria para la administración del producto o la revisión de seguridad.",
        },
        security: {
          title: "9. Seguridad",
          body1:
            "WiFiGate utiliza medidas razonables destinadas a proteger la información y el acceso al producto, pero no puede garantizarse que un sitio web, app, dispositivo, teléfono, conexión inalámbrica o sistema de control de acceso sea completamente seguro.",
          body2:
            "Los clientes, administradores, instaladores y usuarios también desempeñan un papel importante en la seguridad al proteger dispositivos, permisos, invitaciones, métodos de acceso y ajustes de instalación.",
        },
        rights: {
          title: "10. Tus Opciones y Derechos",
          body1:
            "Según la configuración del producto y la ley aplicable, podrías poder solicitar acceso a determinados datos personales gestionados por WiFiGate, su corrección, eliminación, restricción o información sobre ellos.",
          body2:
            "Algunas solicitudes pueden tener que ser atendidas por el propietario de la propiedad, el administrador del sistema, el instalador o el contacto de la cuenta correspondiente, dependiendo de quién controle la instalación y la información relacionada.",
        },
        children: {
          title: "11. Menores",
          body1:
            "WiFiGate no está diseñada como un producto para menores. Si se considera que se ha proporcionado indebidamente información personal relacionada con un menor, contacta con WiFiGate para que se revise la situación.",
        },
        changes: {
          title: "12. Cambios en Esta Política de Privacidad",
          body1:
            "WiFiGate puede actualizar esta Política de Privacidad de vez en cuando. La versión más reciente se aplicará cuando se publique en esta página o se ponga a disposición junto con el producto por otro medio.",
        },
        contact: {
          title: "13. Contacto",
          body1:
            "Las preguntas sobre esta Política de Privacidad o las solicitudes relacionadas con la privacidad pueden enviarse utilizando los datos de contacto indicados a continuación.",
          item1Label: "Propietario del sitio / nombre operativo:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Nombre legal de la empresa:",
          item2Value: "[Company Legal Name]",
          item3Label: "Dirección de la empresa:",
          item3Value: "[Company Address]",
          item4Label: "Correo de soporte:",
          item4Value: "[Support Email]",
          item5Label: "Fecha de entrada en vigor:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "Esta Política de Privacidad es un borrador general para el producto y el sitio web de WiFiGate. Debe revisarse y adaptarse a la empresa operadora real, al modelo de instalación, a los flujos de datos y a los requisitos legales antes de su publicación.",
    },
    pt: {
      metaTags: {
        title: "Política de Privacidade | WIFIGATE",
        description:
          "Política de Privacidade do website WIFIGATE, da aplicação móvel, do dispositivo WiFiGate, eventos de acesso, convites, diagnósticos, armazenamento local e funcionalidades relacionadas de controlo de acesso.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Política de Privacidade",
        subtitle:
          "Esta Política de Privacidade explica como a WIFIGATE pode recolher, usar, armazenar, apresentar e partilhar informações relacionadas com o website, a aplicação móvel, o dispositivo WiFiGate, o controlador, os convites, os eventos de acesso e as funcionalidades relacionadas de controlo de acesso.",
        updated: "Data de entrada em vigor: [Effective Date]",
        owner: "Proprietário do website: EATS SYSTEMS TECH",
        disclaimer:
          "Este documento é fornecido como um rascunho geral de política de privacidade e deve ser revisto por aconselhamento jurídico qualificado antes da publicação.",
      },
      sections: {
        overview: {
          title: "1. Visão Geral",
          body1:
            "Esta Política de Privacidade aplica-se ao website WIFIGATE, à aplicação móvel, ao dispositivo WiFiGate, ao controlador e às funcionalidades relacionadas de controlo de acesso utilizadas por clientes, proprietários, administradores, instaladores, utilizadores e convidados.",
          body2:
            "Explica, em termos gerais, que informações podem ser tratadas pelo produto e como essas informações podem ser utilizadas, armazenadas, apresentadas e partilhadas.",
        },
        scope: {
          title: "2. O Que Esta Política Abrange",
          body1:
            "Esta política abrange informações relacionadas com visitas ao website, pedidos de informação sobre o produto, comunicações de suporte, utilização da aplicação móvel, gestão de acessos, convites, eventos de acesso, estado do dispositivo, diagnósticos técnicos e operações relacionadas do produto.",
          body2:
            "Esta política não substitui acordos específicos de cliente, avisos da propriedade, avisos do instalador ou políticas de terceiros que também possam aplicar-se numa determinada instalação ou jurisdição.",
        },
        collect: {
          title: "3. Informações que a WiFiGate Pode Recolher",
          intro:
            "Dependendo das funcionalidades do produto utilizadas, a WiFiGate pode tratar as seguintes categorias de informação:",
          item1:
            "Dados de contacto e informações de pedido enviadas através do website, WhatsApp, e-mail, telefone ou outros canais de suporte.",
          item2:
            "Detalhes de perfil do utilizador, como nome, número de telefone, idioma da aplicação e informações do papel relacionadas com o acesso.",
          item3:
            "Informações de gestão de acessos, como administradores, utilizadores, convidados, convites, horário dos convites, permissões de acesso e detalhes relacionados da propriedade ou do grupo.",
          item4:
            "Eventos de acesso, histórico de acessos, estado do dispositivo, diagnósticos técnicos, informações relacionadas com atualizações e registos do produto.",
          item5:
            "Informações do dispositivo e da aplicação necessárias para o funcionamento do produto, como estado da ligação local, permissões, compatibilidade do telefone e detalhes de configuração.",
          item6:
            "Informações de preferências do website e definições semelhantes no navegador, incluindo o idioma selecionado e as preferências de acessibilidade.",
        },
        use: {
          title: "4. Como a WiFiGate Pode Usar as Informações",
          intro: "A WiFiGate pode usar informações para os seguintes fins:",
          item1:
            "Fornecer, operar, configurar, manter e dar suporte ao website, à aplicação, ao dispositivo e às funcionalidades relacionadas de controlo de acesso.",
          item2:
            "Gerir utilizadores, administradores, convidados, convites, permissões de acesso e definições do produto.",
          item3:
            "Apresentar eventos de acesso, atividade do sistema, estado do dispositivo e informações relacionadas do produto a utilizadores autorizados.",
          item4:
            "Resolver problemas técnicos, melhorar a fiabilidade do produto e rever questões de segurança, configuração ou suporte.",
          item5:
            "Responder a pedidos, prestar apoio ao cliente, comunicar sobre instalações e enviar informações sobre produtos ou serviços relevantes para um pedido ou conta.",
        },
        sharing: {
          title: "5. Quando as Informações Podem Ser Partilhadas",
          body1:
            "A WiFiGate pode apresentar ou disponibilizar informações a proprietários, administradores, instaladores ou utilizadores autorizados quando esse acesso faça parte do funcionamento previsto do produto.",
          body2:
            "As informações também podem ser partilhadas quando isso for razoavelmente necessário para prestar suporte, resolver questões técnicas ou de segurança, cumprir obrigações legais, fazer cumprir termos aplicáveis ou proteger direitos, bens e segurança.",
          body3:
            "Este rascunho de política não descreve qualquer venda pública de informação pessoal. Quaisquer alterações futuras nas práticas de partilha de dados do produto devem ser refletidas num aviso de privacidade atualizado.",
        },
        storage: {
          title: "6. Armazenamento Local e Armazenamento Específico do Produto",
          body1:
            "Dependendo da implementação, as informações podem ser armazenadas localmente no dispositivo móvel, no dispositivo WiFiGate ou através de outro método de armazenamento específico do produto.",
          body2:
            "Instalações diferentes podem utilizar definições do produto ou formas de armazenamento diferentes. Clientes, proprietários e administradores devem rever a sua instalação e as suas práticas de acesso para compreender como os dados são tratados no seu ambiente.",
        },
        websiteStorage: {
          title: "7. Preferências do Website, Cookies e Tecnologias Semelhantes",
          body1:
            "O website WiFiGate pode usar tecnologias limitadas do lado do navegador, incluindo armazenamento de preferências, para memorizar o idioma selecionado e as definições de acessibilidade e melhorar a usabilidade do site.",
          body2:
            "Consulte também a página de Cookies da WiFiGate para mais detalhes sobre cookies do website e tecnologias semelhantes.",
        },
        retention: {
          title: "8. Conservação de Dados",
          body1:
            "A WiFiGate pode conservar informações durante o tempo razoavelmente necessário para a operação do produto, suporte, resolução de problemas, conformidade legal, resolução de litígios, manutenção de registos ou outros fins legítimos do produto ou do negócio.",
          body2:
            "Os períodos de conservação podem variar conforme o tipo de informação, a instalação, a funcionalidade utilizada, as obrigações legais aplicáveis e se a informação continua a ser necessária para a administração do produto ou revisão de segurança.",
        },
        security: {
          title: "9. Segurança",
          body1:
            "A WiFiGate utiliza medidas razoáveis destinadas a proteger as informações e o acesso ao produto, mas nenhum website, aplicação, dispositivo, telefone, ligação sem fios ou sistema de controlo de acesso pode ser garantido como totalmente seguro.",
          body2:
            "Clientes, administradores, instaladores e utilizadores também têm um papel importante na segurança ao proteger dispositivos, permissões, convites, métodos de acesso e definições de instalação.",
        },
        rights: {
          title: "10. As Suas Escolhas e Direitos",
          body1:
            "Dependendo da configuração do produto e da legislação aplicável, poderá ter o direito de solicitar acesso a certos dados pessoais tratados pela WiFiGate, a sua correção, eliminação, restrição ou informações sobre esses dados.",
          body2:
            "Alguns pedidos podem ter de ser tratados pelo proprietário relevante, administrador do sistema, instalador ou contacto da conta, dependendo de quem controla a instalação e as informações associadas.",
        },
        children: {
          title: "11. Crianças",
          body1:
            "A WiFiGate não foi concebida como um produto para crianças. Se se considerar que informações pessoais relativas a uma criança foram fornecidas de forma inadequada, contacte a WiFiGate para que a situação possa ser analisada.",
        },
        changes: {
          title: "12. Alterações a Esta Política de Privacidade",
          body1:
            "A WiFiGate pode atualizar esta Política de Privacidade periodicamente. A versão mais recente aplicar-se-á quando for publicada nesta página ou disponibilizada de outra forma com o produto.",
        },
        contact: {
          title: "13. Contacto",
          body1:
            "Questões sobre esta Política de Privacidade ou pedidos relacionados com privacidade podem ser enviados utilizando os dados de contacto abaixo.",
          item1Label: "Proprietário do website / nome operacional:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Nome legal da empresa:",
          item2Value: "[Company Legal Name]",
          item3Label: "Morada da empresa:",
          item3Value: "[Company Address]",
          item4Label: "E-mail de suporte:",
          item4Value: "[Support Email]",
          item5Label: "Data de entrada em vigor:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "Esta Política de Privacidade é um rascunho geral para o produto e website WiFiGate. Deve ser revista e adaptada à empresa operadora real, ao modelo de instalação, aos fluxos de dados e aos requisitos legais antes da publicação.",
    },
    pl: {
      metaTags: {
        title: "Polityka Prywatności | WIFIGATE",
        description:
          "Polityka Prywatności dla strony WIFIGATE, aplikacji mobilnej, urządzenia WiFiGate, zdarzeń dostępu, zaproszeń, diagnostyki, lokalnego przechowywania i powiązanych funkcji kontroli dostępu.",
      },
      hero: {
        eyebrow: "Informacje prawne",
        title: "Polityka Prywatności",
        subtitle:
          "Niniejsza Polityka Prywatności wyjaśnia, w jaki sposób WIFIGATE może zbierać, wykorzystywać, przechowywać, wyświetlać i udostępniać informacje związane ze stroną internetową, aplikacją mobilną, urządzeniem WiFiGate, kontrolerem, zaproszeniami, zdarzeniami dostępu i powiązanymi funkcjami kontroli dostępu.",
        updated: "Data wejścia w życie: [Effective Date]",
        owner: "Właściciel strony: EATS SYSTEMS TECH",
        disclaimer:
          "Niniejszy dokument stanowi ogólny projekt polityki prywatności i powinien zostać sprawdzony przez wykwalifikowanego doradcę prawnego przed publikacją.",
      },
      sections: {
        overview: {
          title: "1. Informacje Ogólne",
          body1:
            "Niniejsza Polityka Prywatności dotyczy strony internetowej WIFIGATE, aplikacji mobilnej, urządzenia WiFiGate, kontrolera i powiązanych funkcji kontroli dostępu używanych przez klientów, właścicieli nieruchomości, administratorów, instalatorów, użytkowników i gości.",
          body2:
            "Wyjaśnia ona ogólnie, jakie informacje mogą być przetwarzane przez produkt oraz w jaki sposób mogą być używane, przechowywane, wyświetlane i udostępniane.",
        },
        scope: {
          title: "2. Czego Dotyczy Ta Polityka",
          body1:
            "Polityka obejmuje informacje związane z wizytami na stronie internetowej, zapytaniami o produkt, komunikacją wsparcia, korzystaniem z aplikacji mobilnej, zarządzaniem dostępem, zaproszeniami, zdarzeniami dostępu, stanem urządzenia, diagnostyką techniczną i powiązanymi operacjami produktu.",
          body2:
            "Polityka ta nie zastępuje indywidualnych umów z klientem, informacji dla nieruchomości, informacji od instalatora ani polityk stron trzecich, które mogą mieć zastosowanie w danej instalacji lub jurysdykcji.",
        },
        collect: {
          title: "3. Jakie Informacje WiFiGate Może Gromadzić",
          intro:
            "W zależności od używanych funkcji produktu WiFiGate może przetwarzać następujące kategorie informacji:",
          item1:
            "Dane kontaktowe i informacje z zapytań przesłanych przez stronę internetową, WhatsApp, e-mail, telefon lub inne kanały wsparcia.",
          item2:
            "Dane profilu użytkownika, takie jak imię i nazwisko, numer telefonu, język aplikacji oraz informacje o roli związanej z dostępem.",
          item3:
            "Informacje dotyczące zarządzania dostępem, takie jak administratorzy, użytkownicy, goście, zaproszenia, terminy zaproszeń, uprawnienia dostępu oraz powiązane dane nieruchomości lub grupy.",
          item4:
            "Zdarzenia dostępu, historia dostępu, stan urządzenia, diagnostyka techniczna, informacje związane z aktualizacjami oraz logi produktu.",
          item5:
            "Informacje o urządzeniu i aplikacji potrzebne do działania produktu, takie jak stan połączenia lokalnego, uprawnienia, zgodność telefonu i szczegóły konfiguracji.",
          item6:
            "Informacje o preferencjach strony internetowej i podobnych ustawieniach po stronie przeglądarki, w tym wybrany język i preferencje dostępności.",
        },
        use: {
          title: "4. Jak WiFiGate Może Wykorzystywać Informacje",
          intro: "WiFiGate może wykorzystywać informacje w następujących celach:",
          item1:
            "Aby dostarczać, obsługiwać, konfigurować, utrzymywać i wspierać stronę internetową, aplikację, urządzenie i powiązane funkcje kontroli dostępu.",
          item2:
            "Aby zarządzać użytkownikami, administratorami, gośćmi, zaproszeniami, uprawnieniami dostępu i ustawieniami produktu.",
          item3:
            "Aby wyświetlać zdarzenia dostępu, aktywność systemu, stan urządzenia i powiązane informacje o produkcie uprawnionym użytkownikom.",
          item4:
            "Aby rozwiązywać problemy techniczne, poprawiać niezawodność produktu oraz analizować kwestie bezpieczeństwa, konfiguracji lub wsparcia.",
          item5:
            "Aby odpowiadać na zapytania, zapewniać wsparcie klienta, komunikować się w sprawie instalacji i przekazywać informacje o produkcie lub usłudze istotne dla danego zapytania lub konta.",
        },
        sharing: {
          title: "5. Kiedy Informacje Mogą Być Udostępniane",
          body1:
            "WiFiGate może wyświetlać lub udostępniać informacje upoważnionym właścicielom nieruchomości, administratorom, instalatorom lub użytkownikom, gdy taki dostęp stanowi część zamierzonego działania produktu.",
          body2:
            "Informacje mogą być również udostępniane, gdy jest to rozsądnie konieczne do zapewnienia wsparcia, rozwiązania problemów technicznych lub bezpieczeństwa, spełnienia obowiązków prawnych, egzekwowania odpowiednich warunków lub ochrony praw, mienia i bezpieczeństwa.",
          body3:
            "Ten projekt polityki nie opisuje publicznej sprzedaży danych osobowych. Wszelkie przyszłe zmiany w praktykach udostępniania danych przez produkt powinny zostać odzwierciedlone w zaktualizowanej informacji o prywatności.",
        },
        storage: {
          title: "6. Przechowywanie Lokalne i Przechowywanie Specyficzne dla Produktu",
          body1:
            "W zależności od wdrożenia informacje mogą być przechowywane lokalnie na urządzeniu mobilnym, na urządzeniu WiFiGate lub przy użyciu innej metody przechowywania specyficznej dla produktu.",
          body2:
            "Różne instalacje mogą korzystać z różnych ustawień produktu lub sposobów przechowywania. Klienci, właściciele nieruchomości i administratorzy powinni przeanalizować własną instalację i praktyki dostępu, aby zrozumieć, jak dane są przetwarzane w ich środowisku.",
        },
        websiteStorage: {
          title: "7. Preferencje Strony, Cookies i Podobne Technologie",
          body1:
            "Strona internetowa WiFiGate może korzystać z ograniczonych technologii po stronie przeglądarki, w tym z przechowywania preferencji, aby zapamiętać wybrany język i ustawienia dostępności oraz poprawić użyteczność strony.",
          body2:
            "Zapoznaj się również ze stroną Cookies WiFiGate, aby uzyskać więcej informacji o plikach cookies strony i podobnych technologiach.",
        },
        retention: {
          title: "8. Okres Przechowywania Danych",
          body1:
            "WiFiGate może przechowywać informacje tak długo, jak jest to rozsądnie konieczne do działania produktu, wsparcia, rozwiązywania problemów, zgodności z prawem, rozstrzygania sporów, prowadzenia dokumentacji lub innych uzasadnionych celów produktu lub działalności.",
          body2:
            "Okresy przechowywania mogą się różnić w zależności od rodzaju informacji, instalacji, używanej funkcji, obowiązujących wymogów prawnych oraz tego, czy informacje są nadal potrzebne do administrowania produktem lub przeglądu bezpieczeństwa.",
        },
        security: {
          title: "9. Bezpieczeństwo",
          body1:
            "WiFiGate stosuje rozsądne środki mające na celu ochronę informacji i dostępu do produktu, ale żadna strona internetowa, aplikacja, urządzenie, telefon, połączenie bezprzewodowe ani system kontroli dostępu nie mogą być w pełni bezpieczne.",
          body2:
            "Klienci, administratorzy, instalatorzy i użytkownicy również odgrywają ważną rolę w bezpieczeństwie, chroniąc urządzenia, uprawnienia, zaproszenia, metody dostępu i ustawienia instalacji.",
        },
        rights: {
          title: "10. Twoje Wybory i Prawa",
          body1:
            "W zależności od konfiguracji produktu i obowiązującego prawa możesz mieć możliwość żądania dostępu do niektórych danych osobowych przetwarzanych przez WiFiGate, ich sprostowania, usunięcia, ograniczenia lub uzyskania informacji o nich.",
          body2:
            "Niektóre żądania mogą wymagać obsługi przez odpowiedniego właściciela nieruchomości, administratora systemu, instalatora lub kontakt do konta, w zależności od tego, kto kontroluje instalację i związane z nią informacje.",
        },
        children: {
          title: "11. Dzieci",
          body1:
            "WiFiGate nie jest projektowany jako produkt dla dzieci. Jeśli istnieje podejrzenie, że dane osobowe dotyczące dziecka zostały przekazane niewłaściwie, skontaktuj się z WiFiGate, aby można było to sprawdzić.",
        },
        changes: {
          title: "12. Zmiany w Niniejszej Polityce Prywatności",
          body1:
            "WiFiGate może od czasu do czasu aktualizować niniejszą Politykę Prywatności. Najnowsza wersja będzie obowiązywać po opublikowaniu na tej stronie lub udostępnieniu wraz z produktem w inny sposób.",
        },
        contact: {
          title: "13. Kontakt",
          body1:
            "Pytania dotyczące niniejszej Polityki Prywatności lub żądania związane z prywatnością można przesyłać, korzystając z poniższych danych kontaktowych.",
          item1Label: "Właściciel strony / nazwa operacyjna:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Prawna nazwa firmy:",
          item2Value: "[Company Legal Name]",
          item3Label: "Adres firmy:",
          item3Value: "[Company Address]",
          item4Label: "Adres e-mail wsparcia:",
          item4Value: "[Support Email]",
          item5Label: "Data wejścia w życie:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "Niniejsza Polityka Prywatności jest ogólnym projektem dla produktu i strony WiFiGate. Przed publikacją należy ją sprawdzić i dostosować do rzeczywistej firmy operacyjnej, modelu instalacji, przepływów danych i wymogów prawnych.",
    },
    ru: {
      metaTags: {
        title: "Политика конфиденциальности | WIFIGATE",
        description:
          "Политика конфиденциальности для сайта WIFIGATE, мобильного приложения, устройства WiFiGate, событий доступа, приглашений, диагностики, локального хранения и связанных функций контроля доступа.",
      },
      hero: {
        eyebrow: "Правовая информация",
        title: "Политика конфиденциальности",
        subtitle:
          "Настоящая Политика конфиденциальности объясняет, как WIFIGATE может собирать, использовать, хранить, отображать и передавать информацию, связанную с сайтом, мобильным приложением, устройством WiFiGate, контроллером, приглашениями, событиями доступа и связанными функциями контроля доступа.",
        updated: "Дата вступления в силу: [Effective Date]",
        owner: "Владелец сайта: EATS SYSTEMS TECH",
        disclaimer:
          "Этот документ предоставляется как общий проект политики конфиденциальности и должен быть проверен квалифицированным юристом до публикации.",
      },
      sections: {
        overview: {
          title: "1. Обзор",
          body1:
            "Настоящая Политика конфиденциальности распространяется на сайт WIFIGATE, мобильное приложение, устройство WiFiGate, контроллер и связанные функции контроля доступа, используемые клиентами, владельцами объектов, администраторами, установщиками, пользователями и гостями.",
          body2:
            "Она в общих чертах объясняет, какая информация может обрабатываться продуктом и как такая информация может использоваться, храниться, отображаться и передаваться.",
        },
        scope: {
          title: "2. Что Охватывает Эта Политика",
          body1:
            "Настоящая политика охватывает информацию, связанную с посещением сайта, запросами о продукте, коммуникацией со службой поддержки, использованием мобильного приложения, управлением доступом, приглашениями, событиями доступа, состоянием устройства, технической диагностикой и связанными операциями продукта.",
          body2:
            "Эта политика не заменяет индивидуальные соглашения с клиентами, уведомления для объектов, уведомления от установщиков или политики третьих лиц, которые также могут применяться в конкретной установке или юрисдикции.",
        },
        collect: {
          title: "3. Какую Информацию WiFiGate Может Собирать",
          intro:
            "В зависимости от используемых функций продукта WiFiGate может обрабатывать следующие категории информации:",
          item1:
            "Контактные данные и информация из запросов, отправленных через сайт, WhatsApp, электронную почту, телефон или другие каналы поддержки.",
          item2:
            "Данные профиля пользователя, такие как имя, номер телефона, язык приложения и сведения о роли, связанной с доступом.",
          item3:
            "Информация об управлении доступом, такая как администраторы, пользователи, гости, приглашения, время приглашений, права доступа и связанные сведения об объекте или группе.",
          item4:
            "События доступа, история доступа, состояние устройства, техническая диагностика, информация, связанная с обновлениями, и журналы продукта.",
          item5:
            "Информация об устройстве и приложении, необходимая для работы продукта, например состояние локального соединения, разрешения, совместимость телефона и сведения о конфигурации.",
          item6:
            "Информация о предпочтениях сайта и аналогичных настройках браузера, включая выбранный язык и настройки доступности.",
        },
        use: {
          title: "4. Как WiFiGate Может Использовать Информацию",
          intro: "WiFiGate может использовать информацию в следующих целях:",
          item1:
            "Для предоставления, работы, настройки, обслуживания и поддержки сайта, приложения, устройства и связанных функций контроля доступа.",
          item2:
            "Для управления пользователями, администраторами, гостями, приглашениями, правами доступа и настройками продукта.",
          item3:
            "Для отображения событий доступа, активности системы, состояния устройства и связанной информации о продукте уполномоченным пользователям.",
          item4:
            "Для устранения технических проблем, повышения надежности продукта и анализа вопросов безопасности, конфигурации или поддержки.",
          item5:
            "Для ответа на запросы, предоставления клиентской поддержки, общения по вопросам установки и отправки информации о продукте или услуге, относящейся к запросу или учетной записи.",
        },
        sharing: {
          title: "5. Когда Информация Может Передаваться",
          body1:
            "WiFiGate может отображать или предоставлять информацию уполномоченным владельцам объектов, администраторам, установщикам или пользователям, если такой доступ является частью предполагаемой работы продукта.",
          body2:
            "Информация также может передаваться, когда это разумно необходимо для поддержки, решения технических или связанных с безопасностью вопросов, соблюдения юридических обязательств, обеспечения соблюдения применимых условий или защиты прав, имущества и безопасности.",
          body3:
            "Этот проект политики не описывает какую-либо публичную продажу персональных данных. Любые будущие изменения в практике обмена данными продукта должны быть отражены в обновленном уведомлении о конфиденциальности.",
        },
        storage: {
          title: "6. Локальное Хранение и Хранение, Связанное с Продуктом",
          body1:
            "В зависимости от реализации информация может храниться локально на мобильном устройстве, на устройстве WiFiGate или с использованием другого метода хранения, применяемого продуктом.",
          body2:
            "Разные установки могут использовать разные настройки продукта или способы хранения. Клиентам, владельцам объектов и администраторам следует изучить свою установку и практики доступа, чтобы понять, как данные обрабатываются в их среде.",
        },
        websiteStorage: {
          title: "7. Настройки Сайта, Cookies и Похожие Технологии",
          body1:
            "Сайт WiFiGate может использовать ограниченные технологии на стороне браузера, включая хранение предпочтений, чтобы запоминать выбранный язык и настройки доступности и повышать удобство использования сайта.",
          body2:
            "Также ознакомьтесь со страницей Cookies WiFiGate, чтобы получить больше информации о cookies сайта и похожих технологиях.",
        },
        retention: {
          title: "8. Хранение Данных",
          body1:
            "WiFiGate может хранить информацию столько, сколько это разумно необходимо для работы продукта, поддержки, устранения неполадок, соблюдения закона, разрешения споров, ведения учета или других законных целей продукта или бизнеса.",
          body2:
            "Сроки хранения могут различаться в зависимости от типа информации, установки, используемой функции, применимых юридических требований и того, нужна ли информация для администрирования продукта или проверки безопасности.",
        },
        security: {
          title: "9. Безопасность",
          body1:
            "WiFiGate использует разумные меры для защиты информации и доступа к продукту, однако ни один сайт, приложение, устройство, телефон, беспроводное соединение или система контроля доступа не могут быть гарантированно полностью безопасными.",
          body2:
            "Клиенты, администраторы, установщики и пользователи также играют важную роль в обеспечении безопасности, защищая устройства, разрешения, приглашения, способы доступа и настройки установки.",
        },
        rights: {
          title: "10. Ваши Выборы и Права",
          body1:
            "В зависимости от конфигурации продукта и применимого законодательства у вас может быть возможность запросить доступ к определенным персональным данным, которые обрабатывает WiFiGate, их исправление, удаление, ограничение обработки или информацию о них.",
          body2:
            "Некоторые запросы могут потребовать обработки соответствующим владельцем объекта, системным администратором, установщиком или контактным лицом учетной записи в зависимости от того, кто контролирует установку и связанную с ней информацию.",
        },
        children: {
          title: "11. Дети",
          body1:
            "WiFiGate не предназначен как продукт для детей. Если есть основания полагать, что персональные данные ребенка были предоставлены ненадлежащим образом, свяжитесь с WiFiGate, чтобы этот вопрос можно было рассмотреть.",
        },
        changes: {
          title: "12. Изменения в Настоящей Политике Конфиденциальности",
          body1:
            "WiFiGate может время от времени обновлять настоящую Политику конфиденциальности. Последняя версия будет применяться после публикации на этой странице или иного предоставления вместе с продуктом.",
        },
        contact: {
          title: "13. Контакты",
          body1:
            "Вопросы по настоящей Политике конфиденциальности или запросы, связанные с конфиденциальностью, можно направлять, используя приведенные ниже контактные данные.",
          item1Label: "Владелец сайта / рабочее наименование:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Юридическое название компании:",
          item2Value: "[Company Legal Name]",
          item3Label: "Адрес компании:",
          item3Value: "[Company Address]",
          item4Label: "Электронная почта поддержки:",
          item4Value: "[Support Email]",
          item5Label: "Дата вступления в силу:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "Настоящая Политика конфиденциальности является общим проектом для продукта и сайта WiFiGate. Перед публикацией ее следует проверить и адаптировать под фактическую операционную компанию, модель установки, потоки данных и правовые требования.",
    },
    cs: {
      metaTags: {
        title: "Zásady ochrany soukromí | WIFIGATE",
        description:
          "Zásady ochrany soukromí pro web WIFIGATE, mobilní aplikaci, zařízení WiFiGate, události přístupu, pozvánky, diagnostiku, místní ukládání a související funkce řízení přístupu.",
      },
      hero: {
        eyebrow: "Právní informace",
        title: "Zásady ochrany soukromí",
        subtitle:
          "Tyto Zásady ochrany soukromí vysvětlují, jak může WIFIGATE shromažďovat, používat, ukládat, zobrazovat a sdílet informace související s webem, mobilní aplikací, zařízením WiFiGate, řídicí jednotkou, pozvánkami, událostmi přístupu a souvisejícími funkcemi řízení přístupu.",
        updated: "Datum účinnosti: [Effective Date]",
        owner: "Provozovatel webu: EATS SYSTEMS TECH",
        disclaimer:
          "Tento dokument je poskytován jako obecný návrh zásad ochrany soukromí a před zveřejněním by měl být zkontrolován kvalifikovaným právním poradcem.",
      },
      sections: {
        overview: {
          title: "1. Přehled",
          body1:
            "Tyto Zásady ochrany soukromí se vztahují na web WIFIGATE, mobilní aplikaci, zařízení WiFiGate, řídicí jednotku a související funkce řízení přístupu používané zákazníky, vlastníky nemovitostí, správci, instalatéry, uživateli a hosty.",
          body2:
            "Obecně vysvětlují, jaké informace může produkt zpracovávat a jak mohou být tyto informace používány, ukládány, zobrazovány a sdíleny.",
        },
        scope: {
          title: "2. Co Tyto Zásady Pokrývají",
          body1:
            "Tyto zásady pokrývají informace související s návštěvami webu, dotazy na produkt, komunikací se podporou, používáním mobilní aplikace, správou přístupu, pozvánkami, událostmi přístupu, stavem zařízení, technickou diagnostikou a souvisejícím provozem produktu.",
          body2:
            "Tyto zásady nenahrazují individuální dohody se zákazníkem, oznámení pro nemovitost, oznámení od instalatéra ani zásady třetích stran, které se mohou vztahovat na konkrétní instalaci nebo jurisdikci.",
        },
        collect: {
          title: "3. Jaké Informace Může WiFiGate Shromažďovat",
          intro:
            "V závislosti na používaných funkcích produktu může WiFiGate zpracovávat následující kategorie informací:",
          item1:
            "Kontaktní údaje a informace z dotazů zaslaných přes web, WhatsApp, e-mail, telefon nebo jiné kanály podpory.",
          item2:
            "Údaje o uživatelském profilu, jako je jméno, telefonní číslo, jazyk aplikace a informace o roli související s přístupem.",
          item3:
            "Informace o správě přístupu, jako jsou správci, uživatelé, hosté, pozvánky, časy pozvánek, přístupová oprávnění a související údaje o nemovitosti nebo skupině.",
          item4:
            "Události přístupu, historie přístupu, stav zařízení, technická diagnostika, informace související s aktualizacemi a produktové záznamy.",
          item5:
            "Informace o zařízení a aplikaci potřebné pro provoz produktu, například stav místního připojení, oprávnění, kompatibilita telefonu a údaje o konfiguraci.",
          item6:
            "Informace o preferencích webu a podobných nastaveních v prohlížeči, včetně zvoleného jazyka a nastavení přístupnosti.",
        },
        use: {
          title: "4. Jak Může WiFiGate Informace Používat",
          intro: "WiFiGate může informace používat k následujícím účelům:",
          item1:
            "K poskytování, provozu, konfiguraci, údržbě a podpoře webu, aplikace, zařízení a souvisejících funkcí řízení přístupu.",
          item2:
            "Ke správě uživatelů, správců, hostů, pozvánek, přístupových oprávnění a nastavení produktu.",
          item3:
            "K zobrazování událostí přístupu, aktivity systému, stavu zařízení a souvisejících informací o produktu oprávněným uživatelům.",
          item4:
            "K řešení technických problémů, zlepšování spolehlivosti produktu a posuzování otázek bezpečnosti, konfigurace nebo podpory.",
          item5:
            "K odpovídání na dotazy, poskytování zákaznické podpory, komunikaci ohledně instalací a zasílání informací o produktu nebo službě relevantních pro daný požadavek nebo účet.",
        },
        sharing: {
          title: "5. Kdy Mohou Být Informace Sdíleny",
          body1:
            "WiFiGate může zobrazovat nebo zpřístupňovat informace oprávněným vlastníkům nemovitostí, správcům, instalatérům nebo uživatelům, pokud je takový přístup součástí zamýšleného provozu produktu.",
          body2:
            "Informace mohou být také sdíleny, pokud je to rozumně nutné k poskytování podpory, řešení technických nebo bezpečnostních problémů, plnění právních povinností, vymáhání platných podmínek nebo ochraně práv, majetku a bezpečnosti.",
          body3:
            "Tento návrh zásad nepopisuje žádný veřejný prodej osobních údajů. Jakékoli budoucí změny ve způsobech sdílení dat produktem by měly být uvedeny v aktualizovaném oznámení o ochraně soukromí.",
        },
        storage: {
          title: "6. Místní Ukládání a Ukládání Specifické pro Produkt",
          body1:
            "V závislosti na implementaci mohou být informace ukládány lokálně v mobilním zařízení, v zařízení WiFiGate nebo pomocí jiné metody ukládání specifické pro produkt.",
          body2:
            "Různé instalace mohou používat různá nastavení produktu nebo způsoby ukládání. Zákazníci, vlastníci nemovitostí a správci by měli zkontrolovat vlastní instalaci a přístupové postupy, aby pochopili, jak jsou data v jejich prostředí zpracovávána.",
        },
        websiteStorage: {
          title: "7. Předvolby Webu, Cookies a Podobné Technologie",
          body1:
            "Web WiFiGate může používat omezené technologie na straně prohlížeče, včetně ukládání předvoleb, aby si pamatoval zvolený jazyk a nastavení přístupnosti a zlepšoval použitelnost webu.",
          body2:
            "Podívejte se také na stránku Cookies WiFiGate, kde najdete více informací o cookies webu a podobných technologiích.",
        },
        retention: {
          title: "8. Uchovávání Dat",
          body1:
            "WiFiGate může uchovávat informace po dobu, která je rozumně nezbytná pro provoz produktu, podporu, řešení problémů, dodržování právních předpisů, řešení sporů, vedení záznamů nebo jiné oprávněné účely produktu či podnikání.",
          body2:
            "Doba uchovávání se může lišit podle typu informací, instalace, používané funkce, platných právních povinností a toho, zda jsou informace stále potřebné pro správu produktu nebo bezpečnostní kontrolu.",
        },
        security: {
          title: "9. Zabezpečení",
          body1:
            "WiFiGate používá přiměřená opatření určená k ochraně informací a přístupu k produktu, ale žádný web, aplikace, zařízení, telefon, bezdrátové připojení ani systém řízení přístupu nelze zaručit jako zcela bezpečný.",
          body2:
            "Zákazníci, správci, instalatéři a uživatelé také hrají důležitou roli v zabezpečení tím, že chrání zařízení, oprávnění, pozvánky, přístupové metody a nastavení instalace.",
        },
        rights: {
          title: "10. Vaše Volby a Práva",
          body1:
            "V závislosti na nastavení produktu a platných právních předpisech můžete mít právo požadovat přístup k určitým osobním údajům zpracovávaným společností WiFiGate, jejich opravu, výmaz, omezení nebo informace o nich.",
          body2:
            "Některé žádosti může být nutné řešit prostřednictvím příslušného vlastníka nemovitosti, správce systému, instalatéra nebo kontaktní osoby účtu, podle toho, kdo kontroluje instalaci a související informace.",
        },
        children: {
          title: "11. Děti",
          body1:
            "WiFiGate není navržena jako produkt pro děti. Pokud se domníváte, že byly nevhodně poskytnuty osobní údaje týkající se dítěte, kontaktujte WiFiGate, aby mohla být situace prověřena.",
        },
        changes: {
          title: "12. Změny Těchto Zásad Ochrany Soukromí",
          body1:
            "WiFiGate může tyto Zásady ochrany soukromí čas od času aktualizovat. Nejnovější verze bude platit po zveřejnění na této stránce nebo jiném zpřístupnění s produktem.",
        },
        contact: {
          title: "13. Kontakt",
          body1:
            "Dotazy týkající se těchto Zásad ochrany soukromí nebo požadavky související s ochranou soukromí můžete zaslat prostřednictvím níže uvedených kontaktních údajů.",
          item1Label: "Provozovatel webu / obchodní název:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "Právní název společnosti:",
          item2Value: "[Company Legal Name]",
          item3Label: "Adresa společnosti:",
          item3Value: "[Company Address]",
          item4Label: "E-mail podpory:",
          item4Value: "[Support Email]",
          item5Label: "Datum účinnosti:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "Tyto Zásady ochrany soukromí jsou obecným návrhem pro produkt a web WiFiGate. Před zveřejněním by měly být zkontrolovány a upraveny podle skutečné provozní společnosti, modelu instalace, toků dat a právních požadavků.",
    },
    ar: {
      metaTags: {
        title: "سياسة الخصوصية | WIFIGATE",
        description:
          "سياسة الخصوصية الخاصة بموقع WIFIGATE وتطبيق الهاتف وجهاز WiFiGate وأحداث الدخول والدعوات والتشخيص والتخزين المحلي وميزات التحكم في الدخول ذات الصلة.",
      },
      hero: {
        eyebrow: "قانوني",
        title: "سياسة الخصوصية",
        subtitle:
          "توضح سياسة الخصوصية هذه كيف يمكن لـ WIFIGATE جمع المعلومات المتعلقة بالموقع الإلكتروني وتطبيق الهاتف وجهاز WiFiGate ووحدة التحكم والدعوات وأحداث الدخول وميزات التحكم في الدخول ذات الصلة واستخدامها وتخزينها وعرضها ومشاركتها.",
        updated: "تاريخ السريان: [Effective Date]",
        owner: "مالك الموقع: EATS SYSTEMS TECH",
        disclaimer:
          "يتم تقديم هذا المستند كمسودة عامة لسياسة الخصوصية، ويجب مراجعته من قبل مستشار قانوني مؤهل قبل النشر.",
      },
      sections: {
        overview: {
          title: "1. نظرة عامة",
          body1:
            "تنطبق سياسة الخصوصية هذه على موقع WIFIGATE الإلكتروني وتطبيق الهاتف وجهاز WiFiGate ووحدة التحكم وميزات التحكم في الدخول ذات الصلة المستخدمة من قبل العملاء ومالكي العقارات والمسؤولين والفنيين والمستخدمين والضيوف.",
          body2:
            "وهي تشرح بشكل عام ما أنواع المعلومات التي قد يتعامل معها المنتج وكيف يمكن استخدام تلك المعلومات وتخزينها وعرضها ومشاركتها.",
        },
        scope: {
          title: "2. ما الذي تغطيه هذه السياسة",
          body1:
            "تغطي هذه السياسة المعلومات المتعلقة بزيارات الموقع والاستفسارات عن المنتج واتصالات الدعم واستخدام تطبيق الهاتف وإدارة الدخول والدعوات وأحداث الدخول وحالة الجهاز والمعلومات التشخيصية الفنية وعمليات المنتج ذات الصلة.",
          body2:
            "لا تحل هذه السياسة محل الاتفاقيات الخاصة بالعملاء أو إشعارات العقارات أو إشعارات التركيب أو سياسات الأطراف الثالثة التي قد تنطبق أيضًا في تركيب أو ولاية قضائية معينة.",
        },
        collect: {
          title: "3. المعلومات التي قد يجمعها WiFiGate",
          intro:
            "بحسب ميزات المنتج المستخدمة، قد يتعامل WiFiGate مع الفئات التالية من المعلومات:",
          item1:
            "بيانات الاتصال ومعلومات الاستفسار المرسلة عبر الموقع أو WhatsApp أو البريد الإلكتروني أو الهاتف أو قنوات الدعم الأخرى.",
          item2:
            "تفاصيل ملف المستخدم مثل الاسم ورقم الهاتف ولغة التطبيق ومعلومات الدور المرتبطة بالدخول.",
          item3:
            "معلومات إدارة الدخول مثل المسؤولين والمستخدمين والضيوف والدعوات وتوقيت الدعوات وصلاحيات الدخول والتفاصيل المرتبطة بالعقار أو المجموعة.",
          item4:
            "أحداث الدخول وسجل الدخول وحالة الجهاز والمعلومات التشخيصية الفنية والمعلومات المرتبطة بالتحديثات وسجلات المنتج.",
          item5:
            "معلومات الجهاز والتطبيق اللازمة لتشغيل المنتج، مثل حالة الاتصال المحلي والأذونات وتوافق الهاتف وتفاصيل الإعداد.",
          item6:
            "معلومات تفضيلات الموقع والإعدادات المشابهة في المتصفح، بما في ذلك اللغة المختارة وتفضيلات إمكانية الوصول.",
        },
        use: {
          title: "4. كيف يمكن لـ WiFiGate استخدام المعلومات",
          intro: "قد يستخدم WiFiGate المعلومات للأغراض التالية:",
          item1:
            "لتقديم الموقع والتطبيق والجهاز وميزات التحكم في الدخول ذات الصلة وتشغيلها وإعدادها وصيانتها ودعمها.",
          item2:
            "لإدارة المستخدمين والمسؤولين والضيوف والدعوات وصلاحيات الدخول وإعدادات المنتج.",
          item3:
            "لعرض أحداث الدخول ونشاط النظام وحالة الجهاز والمعلومات المرتبطة بالمنتج للمستخدمين المصرح لهم.",
          item4:
            "لاستكشاف المشكلات الفنية وتحسين موثوقية المنتج ومراجعة مسائل السلامة أو الإعداد أو الدعم.",
          item5:
            "للرد على الاستفسارات وتقديم دعم العملاء والتواصل بشأن التركيبات وإرسال معلومات عن المنتج أو الخدمة ذات الصلة بطلب أو حساب معين.",
        },
        sharing: {
          title: "5. متى قد تتم مشاركة المعلومات",
          body1:
            "قد يعرض WiFiGate المعلومات أو يتيحها لمالكي العقارات أو المسؤولين أو الفنيين أو المستخدمين المصرح لهم عندما يكون هذا الوصول جزءًا من التشغيل المقصود للمنتج.",
          body2:
            "وقد تتم مشاركة المعلومات أيضًا عندما يكون ذلك ضروريًا بشكل معقول لتقديم الدعم أو معالجة المسائل الفنية أو مسائل السلامة أو الامتثال للالتزامات القانونية أو تنفيذ الشروط المطبقة أو حماية الحقوق والممتلكات والسلامة.",
          body3:
            "لا تصف مسودة هذه السياسة أي بيع علني للمعلومات الشخصية. ويجب أن تنعكس أي تغييرات مستقبلية في ممارسات مشاركة البيانات الخاصة بالمنتج في إشعار خصوصية محدث.",
        },
        storage: {
          title: "6. التخزين المحلي والتخزين الخاص بالمنتج",
          body1:
            "بحسب طريقة التنفيذ، قد يتم تخزين المعلومات محليًا على الجهاز المحمول أو على جهاز WiFiGate أو باستخدام طريقة تخزين أخرى خاصة بالمنتج.",
          body2:
            "قد تستخدم التركيبات المختلفة إعدادات منتج أو ترتيبات تخزين مختلفة. وينبغي على العملاء ومالكي العقارات والمسؤولين مراجعة تركيبهم وممارسات الدخول الخاصة بهم لفهم كيفية التعامل مع البيانات في بيئتهم.",
        },
        websiteStorage: {
          title: "7. تفضيلات الموقع وملفات تعريف الارتباط والتقنيات المشابهة",
          body1:
            "قد يستخدم موقع WiFiGate تقنيات محدودة على جانب المتصفح، بما في ذلك تخزين التفضيلات، لتذكر اللغة المختارة وإعدادات إمكانية الوصول وتحسين سهولة استخدام الموقع.",
          body2:
            "يرجى أيضًا مراجعة صفحة ملفات تعريف الارتباط الخاصة بـ WiFiGate للحصول على مزيد من التفاصيل حول ملفات تعريف الارتباط والتقنيات المشابهة في الموقع.",
        },
        retention: {
          title: "8. الاحتفاظ بالبيانات",
          body1:
            "قد يحتفظ WiFiGate بالمعلومات طالما كان ذلك ضروريًا بشكل معقول لتشغيل المنتج أو الدعم أو معالجة المشكلات أو الامتثال القانوني أو تسوية النزاعات أو حفظ السجلات أو غير ذلك من الأغراض المشروعة المتعلقة بالمنتج أو الأعمال.",
          body2:
            "قد تختلف فترات الاحتفاظ حسب نوع المعلومات والتركيب والميزة المستخدمة والالتزامات القانونية السارية وما إذا كانت المعلومات لا تزال مطلوبة لإدارة المنتج أو مراجعة الأمان.",
        },
        security: {
          title: "9. الأمان",
          body1:
            "يستخدم WiFiGate تدابير معقولة تهدف إلى حماية المعلومات والوصول إلى المنتج، ولكن لا يمكن ضمان أن يكون أي موقع أو تطبيق أو جهاز أو هاتف أو اتصال لاسلكي أو نظام تحكم في الدخول آمنًا بالكامل.",
          body2:
            "ويلعب العملاء والمسؤولون والفنيون والمستخدمون أيضًا دورًا مهمًا في الأمان من خلال حماية الأجهزة والصلاحيات والدعوات ووسائل الدخول وإعدادات التركيب.",
        },
        rights: {
          title: "10. خياراتك وحقوقك",
          body1:
            "بحسب إعداد المنتج والقانون المعمول به، قد تتمكن من طلب الوصول إلى بعض البيانات الشخصية التي يتعامل معها WiFiGate أو تصحيحها أو حذفها أو تقييدها أو الحصول على معلومات عنها.",
          body2:
            "قد يلزم التعامل مع بعض الطلبات من خلال مالك العقار المعني أو مسؤول النظام أو الفني أو جهة الاتصال الخاصة بالحساب، بحسب من يتحكم في التركيب والمعلومات المرتبطة به.",
        },
        children: {
          title: "11. الأطفال",
          body1:
            "لم يتم تصميم WiFiGate كمنتج مخصص للأطفال. وإذا كان هناك اعتقاد بأنه تم تقديم معلومات شخصية تتعلق بطفل بشكل غير مناسب، فيرجى التواصل مع WiFiGate حتى يمكن مراجعة الأمر.",
        },
        changes: {
          title: "12. التغييرات على سياسة الخصوصية هذه",
          body1:
            "قد يقوم WiFiGate بتحديث سياسة الخصوصية هذه من وقت إلى آخر. وستسري أحدث نسخة عند نشرها على هذه الصفحة أو إتاحتها مع المنتج بطريقة أخرى.",
        },
        contact: {
          title: "13. التواصل",
          body1:
            "يمكن إرسال الأسئلة المتعلقة بسياسة الخصوصية هذه أو الطلبات المرتبطة بالخصوصية باستخدام بيانات التواصل أدناه.",
          item1Label: "مالك الموقع / الاسم التشغيلي:",
          item1Value: "EATS SYSTEMS TECH",
          item2Label: "الاسم القانوني للشركة:",
          item2Value: "[Company Legal Name]",
          item3Label: "عنوان الشركة:",
          item3Value: "[Company Address]",
          item4Label: "بريد الدعم الإلكتروني:",
          item4Value: "[Support Email]",
          item5Label: "تاريخ السريان:",
          item5Value: "[Effective Date]",
        },
      },
      note:
        "تُعد سياسة الخصوصية هذه مسودة عامة لمنتج وموقع WiFiGate. ويجب مراجعتها وتكييفها مع الشركة المشغلة الفعلية ونموذج التركيب وتدفقات البيانات والمتطلبات القانونية قبل النشر.",
    },
  }

  Object.keys(privacyTranslations).forEach((lang) => {
    if (!translations[lang]) {
      translations[lang] = {}
    }

    translations[lang].legal = Object.assign(
      {},
      privacyTranslations[lang],
      sharedLegal[lang]
    )
  })
})()
