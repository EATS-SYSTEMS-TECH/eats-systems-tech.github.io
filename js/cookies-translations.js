// /js/cookies-translations.js
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

  const cookiesTranslations = {
    en: {
      metaTags: {
        title: "WIFIGATE Cookies",
        description:
          "Cookies and similar technologies information for the WIFIGATE website, including browser storage, preferences, and third-party resources.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Cookies",
        subtitle:
          "This page explains how the WIFIGATE website may use cookies, local browser storage, and similar technologies to support language preferences, accessibility settings, and related website functions.",
        updated: "Effective date: [Effective Date]",
        owner: "Website owner: EATS SYSTEMS TECH",
        disclaimer:
          "This document is provided as a general cookies notice draft and should be reviewed by qualified legal counsel before publication.",
      },
      sections: {
        overview: {
          title: "1. Overview",
          body1:
            "This page explains how the WiFiGate website may use cookies and similar browser-side technologies.",
          body2:
            "In the current website implementation, WiFiGate mainly uses limited preference storage and related browser technologies to support website functions such as language and accessibility settings.",
        },
        currentUse: {
          title: "2. What the Current Website Uses",
          body1:
            "Based on the current website implementation, WiFiGate uses limited browser-side storage to remember visitor preferences such as selected language and accessibility choices.",
          body2:
            "This helps the website keep selected viewing preferences between visits and improves the user experience without requiring repeated manual changes.",
        },
        types: {
          title: "3. Types of Cookies and Similar Technologies",
          intro:
            "The website may rely on the following categories of browser-side technologies:",
          item1:
            "Essential technologies needed for basic website operation, security, and accessibility features.",
          item2:
            "Preference storage used to remember language selection and accessibility settings chosen by the visitor.",
          item3:
            "Technical requests or browser-side resources connected to third-party providers used by the website, such as font or content delivery services.",
        },
        localStorage: {
          title: "4. Preference Storage and Similar Technologies",
          body1:
            "The current website implementation uses local browser storage for selected language preferences and accessibility settings.",
          body2:
            "Local browser storage is not always the same as a traditional cookie, but it can serve a similar purpose by remembering settings on the visitor's device or browser.",
        },
        thirdParty: {
          title: "5. Third-Party Services and Technical Requests",
          body1:
            "The website may load third-party resources, such as font services, that receive standard technical request information when a page loads.",
          body2:
            "WiFiGate does not control the policies of those third-party providers. Their own terms, privacy notices, and technical practices may also apply.",
        },
        analytics: {
          title: "6. Current Position on Advertising and Analytics Cookies",
          body1:
            "Based on the current website implementation, WiFiGate does not intentionally deploy its own advertising or analytics cookies on this website.",
          body2:
            "If website practices change in the future, this page should be updated to describe any new analytics, measurement, advertising, or consent-related technologies used by the site.",
        },
        manage: {
          title: "7. Managing Your Browser Settings",
          body1:
            "You can usually control cookies, local storage, and similar technologies through your browser settings, browser privacy tools, or device settings.",
          body2:
            "Blocking or clearing some technologies may affect language preferences, accessibility settings, or parts of the website experience.",
        },
        related: {
          title: "8. Related Legal Pages",
          body1:
            "For more information about how WiFiGate may handle personal data and product information, please also review the Privacy Policy and Terms & Conditions pages.",
        },
        changes: {
          title: "9. Changes to This Cookies Notice",
          body1:
            "WiFiGate may update this cookies notice from time to time. The latest version will apply when published on this page.",
        },
        contact: {
          title: "10. Contact",
          body1:
            "Questions about this cookies notice or website browser-side technologies may be sent using the contact details below.",
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
        "This Cookies page is a general draft for the WiFiGate website. It should be reviewed and adapted for the actual website technologies, hosting setup, third-party services, and legal requirements before publication.",
    },
    he: {
      metaTags: {
        title: "עוגיות | WIFIGATE",
        description:
          "מידע על עוגיות וטכנולוגיות דומות עבור אתר WIFIGATE, כולל אחסון בדפדפן, העדפות ומשאבי צד שלישי.",
      },
      hero: {
        eyebrow: "משפטי",
        title: "עוגיות",
        subtitle:
          "עמוד זה מסביר כיצד אתר WIFIGATE עשוי להשתמש בעוגיות, באחסון מקומי בדפדפן ובטכנולוגיות דומות כדי לתמוך בהעדפות שפה, בהגדרות נגישות ובפונקציות אתר קשורות.",
        updated: "תאריך תחילה: [Effective Date]",
        owner: "בעל האתר: EATS SYSTEMS TECH",
        disclaimer:
          "מסמך זה מסופק כטיוטת הודעת עוגיות כללית ויש להעבירו לבדיקה של יועץ משפטי מוסמך לפני הפרסום.",
      },
      sections: {
        overview: {
          title: "1. מבוא",
          body1:
            "עמוד זה מסביר כיצד אתר WiFiGate עשוי להשתמש בעוגיות ובטכנולוגיות דומות בצד הדפדפן.",
          body2:
            "ביישום האתר הנוכחי, WiFiGate משתמשת בעיקר באחסון העדפות מוגבל ובטכנולוגיות דפדפן קשורות כדי לתמוך בפונקציות אתר כגון שפה ונגישות.",
        },
        currentUse: {
          title: "2. במה האתר הנוכחי משתמש",
          body1:
            "בהתבסס על יישום האתר הנוכחי, WiFiGate משתמשת באחסון מוגבל בצד הדפדפן כדי לזכור העדפות מבקר כמו שפה שנבחרה והגדרות נגישות.",
          body2:
            "דבר זה מסייע לאתר לשמור העדפות תצוגה נבחרות בין ביקורים ומשפר את חוויית המשתמש בלי לדרוש שינוי ידני חוזר.",
        },
        types: {
          title: "3. סוגי עוגיות וטכנולוגיות דומות",
          intro:
            "האתר עשוי להסתמך על הקטגוריות הבאות של טכנולוגיות בצד הדפדפן:",
          item1:
            "טכנולוגיות חיוניות הדרושות להפעלה בסיסית של האתר, לאבטחה ולתכונות נגישות.",
          item2:
            "אחסון העדפות המשמש לזכירת בחירת שפה והגדרות נגישות שנבחרו על ידי המבקר.",
          item3:
            "בקשות טכניות או משאבים בצד הדפדפן המחוברים לספקי צד שלישי המשמשים באתר, כגון שירותי גופנים או מסירת תוכן.",
        },
        localStorage: {
          title: "4. אחסון העדפות וטכנולוגיות דומות",
          body1:
            "יישום האתר הנוכחי משתמש באחסון מקומי בדפדפן עבור העדפות שפה נבחרות והגדרות נגישות.",
          body2:
            "אחסון מקומי בדפדפן אינו תמיד זהה לעוגייה מסורתית, אך הוא עשוי לשרת מטרה דומה על ידי זכירת הגדרות במכשיר או בדפדפן של המבקר.",
        },
        thirdParty: {
          title: "5. שירותי צד שלישי ובקשות טכניות",
          body1:
            "האתר עשוי לטעון משאבים של צדדים שלישיים, כגון שירותי גופנים, המקבלים מידע טכני סטנדרטי על הבקשה כאשר עמוד נטען.",
          body2:
            "WiFiGate אינה שולטת במדיניות של אותם ספקי צד שלישי. ייתכן שיחולו גם התנאים, הודעות הפרטיות והנהלים הטכניים שלהם.",
        },
        analytics: {
          title: "6. העמדה הנוכחית לגבי עוגיות פרסום וניתוח",
          body1:
            "בהתבסס על יישום האתר הנוכחי, WiFiGate אינה מפעילה במכוון באתר זה עוגיות פרסום או ניתוח משלה.",
          body2:
            "אם נוהלי האתר ישתנו בעתיד, עמוד זה צריך להתעדכן כדי לתאר כל טכנולוגיית ניתוח, מדידה, פרסום או הסכמה חדשה שתשמש באתר.",
        },
        manage: {
          title: "7. ניהול הגדרות הדפדפן שלכם",
          body1:
            "בדרך כלל ניתן לשלוט בעוגיות, באחסון מקומי ובטכנולוגיות דומות דרך הגדרות הדפדפן, כלי הפרטיות של הדפדפן או הגדרות המכשיר.",
          body2:
            "חסימה או ניקוי של טכנולוגיות מסוימות עשויים להשפיע על העדפות שפה, על הגדרות נגישות או על חלקים מחוויית האתר.",
        },
        related: {
          title: "8. עמודים משפטיים קשורים",
          body1:
            "למידע נוסף על האופן שבו WiFiGate עשויה לטפל במידע אישי ובמידע על המוצר, אנא עיינו גם בעמודי מדיניות הפרטיות והתנאים וההתניות.",
        },
        changes: {
          title: "9. שינויים בהודעת העוגיות הזו",
          body1:
            "WiFiGate עשויה לעדכן הודעת עוגיות זו מעת לעת. הגרסה העדכנית תחול כאשר תפורסם בעמוד זה.",
        },
        contact: {
          title: "10. יצירת קשר",
          body1:
            "שאלות על הודעת עוגיות זו או על טכנולוגיות אתר בצד הדפדפן ניתן לשלוח באמצעות פרטי הקשר שלהלן.",
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
        "עמוד העוגיות הזה הוא טיוטה כללית עבור אתר WiFiGate. יש לבדוק ולהתאים אותו לטכנולוגיות האתר בפועל, למבנה האירוח, לשירותי צד שלישי ולדרישות החוק לפני הפרסום.",
    },
    es: {
      metaTags: {
        title: "Cookies | WIFIGATE",
        description:
          "Información sobre cookies y tecnologías similares para el sitio web de WIFIGATE, incluido el almacenamiento del navegador, las preferencias y los recursos de terceros.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Cookies",
        subtitle:
          "Esta página explica cómo el sitio web de WIFIGATE puede usar cookies, almacenamiento local del navegador y tecnologías similares para respaldar las preferencias de idioma, los ajustes de accesibilidad y funciones relacionadas del sitio.",
        updated: "Fecha de entrada en vigor: [Effective Date]",
        owner: "Propietario del sitio web: EATS SYSTEMS TECH",
        disclaimer:
          "Este documento se proporciona como un borrador general de aviso de cookies y debe ser revisado por un asesor legal cualificado antes de su publicación.",
      },
      sections: {
        overview: {
          title: "1. Resumen",
          body1:
            "Esta página explica cómo el sitio web de WiFiGate puede utilizar cookies y tecnologías similares del lado del navegador.",
          body2:
            "En la implementación actual del sitio web, WiFiGate utiliza principalmente almacenamiento limitado de preferencias y tecnologías del navegador relacionadas para respaldar funciones del sitio como el idioma y la accesibilidad.",
        },
        currentUse: {
          title: "2. Qué Usa el Sitio Web Actual",
          body1:
            "Según la implementación actual del sitio web, WiFiGate utiliza almacenamiento limitado del lado del navegador para recordar preferencias del visitante, como el idioma seleccionado y las opciones de accesibilidad.",
          body2:
            "Esto ayuda al sitio a mantener las preferencias de visualización entre visitas y mejora la experiencia del usuario sin exigir cambios manuales repetidos.",
        },
        types: {
          title: "3. Tipos de Cookies y Tecnologías Similares",
          intro:
            "El sitio web puede basarse en las siguientes categorías de tecnologías del lado del navegador:",
          item1:
            "Tecnologías esenciales necesarias para el funcionamiento básico del sitio, la seguridad y las funciones de accesibilidad.",
          item2:
            "Almacenamiento de preferencias utilizado para recordar la selección de idioma y los ajustes de accesibilidad elegidos por el visitante.",
          item3:
            "Solicitudes técnicas o recursos del lado del navegador conectados a proveedores externos utilizados por el sitio web, como servicios de fuentes o entrega de contenido.",
        },
        localStorage: {
          title: "4. Almacenamiento de Preferencias y Tecnologías Similares",
          body1:
            "La implementación actual del sitio web utiliza almacenamiento local del navegador para las preferencias de idioma seleccionadas y los ajustes de accesibilidad.",
          body2:
            "El almacenamiento local del navegador no siempre es lo mismo que una cookie tradicional, pero puede cumplir un propósito similar al recordar ajustes en el dispositivo o el navegador del visitante.",
        },
        thirdParty: {
          title: "5. Servicios de Terceros y Solicitudes Técnicas",
          body1:
            "El sitio web puede cargar recursos de terceros, como servicios de fuentes, que reciben información técnica estándar de la solicitud cuando se carga una página.",
          body2:
            "WiFiGate no controla las políticas de esos proveedores externos. Sus propios términos, avisos de privacidad y prácticas técnicas también pueden aplicarse.",
        },
        analytics: {
          title: "6. Posición Actual sobre Cookies Publicitarias y Analíticas",
          body1:
            "Según la implementación actual del sitio web, WiFiGate no instala de forma intencionada sus propias cookies publicitarias o analíticas en este sitio web.",
          body2:
            "Si las prácticas del sitio web cambian en el futuro, esta página deberá actualizarse para describir cualquier nueva tecnología de analítica, medición, publicidad o consentimiento utilizada por el sitio.",
        },
        manage: {
          title: "7. Gestión de la Configuración del Navegador",
          body1:
            "Por lo general, puedes controlar las cookies, el almacenamiento local y tecnologías similares a través de la configuración del navegador, las herramientas de privacidad del navegador o la configuración del dispositivo.",
          body2:
            "Bloquear o borrar algunas tecnologías puede afectar las preferencias de idioma, los ajustes de accesibilidad o partes de la experiencia del sitio web.",
        },
        related: {
          title: "8. Páginas Legales Relacionadas",
          body1:
            "Para obtener más información sobre cómo WiFiGate puede manejar datos personales e información del producto, revisa también las páginas de Política de Privacidad y Términos y Condiciones.",
        },
        changes: {
          title: "9. Cambios en Este Aviso de Cookies",
          body1:
            "WiFiGate puede actualizar este aviso de cookies de vez en cuando. La versión más reciente se aplicará cuando se publique en esta página.",
        },
        contact: {
          title: "10. Contacto",
          body1:
            "Las preguntas sobre este aviso de cookies o sobre tecnologías del sitio del lado del navegador pueden enviarse utilizando los datos de contacto indicados a continuación.",
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
        "Esta página de Cookies es un borrador general para el sitio web de WiFiGate. Debe revisarse y adaptarse a las tecnologías reales del sitio, la configuración de alojamiento, los servicios de terceros y los requisitos legales antes de su publicación.",
    },
    pt: {
      metaTags: {
        title: "Cookies | WIFIGATE",
        description:
          "Informação sobre cookies e tecnologias semelhantes para o website WIFIGATE, incluindo armazenamento no navegador, preferências e recursos de terceiros.",
      },
      hero: {
        eyebrow: "Legal",
        title: "Cookies",
        subtitle:
          "Esta página explica como o website WIFIGATE pode utilizar cookies, armazenamento local do navegador e tecnologias semelhantes para suportar preferências de idioma, definições de acessibilidade e funções relacionadas do website.",
        updated: "Data de entrada em vigor: [Effective Date]",
        owner: "Proprietário do website: EATS SYSTEMS TECH",
        disclaimer:
          "Este documento é fornecido como um rascunho geral de aviso de cookies e deve ser revisto por aconselhamento jurídico qualificado antes da publicação.",
      },
      sections: {
        overview: {
          title: "1. Visão Geral",
          body1:
            "Esta página explica como o website WiFiGate pode utilizar cookies e tecnologias semelhantes do lado do navegador.",
          body2:
            "Na implementação atual do website, a WiFiGate utiliza principalmente armazenamento limitado de preferências e tecnologias de navegador relacionadas para suportar funções do website, como idioma e acessibilidade.",
        },
        currentUse: {
          title: "2. O Que o Website Atual Utiliza",
          body1:
            "Com base na implementação atual do website, a WiFiGate utiliza armazenamento limitado do lado do navegador para memorizar preferências dos visitantes, como o idioma selecionado e opções de acessibilidade.",
          body2:
            "Isto ajuda o website a manter preferências de visualização entre visitas e melhora a experiência do utilizador sem exigir alterações manuais repetidas.",
        },
        types: {
          title: "3. Tipos de Cookies e Tecnologias Semelhantes",
          intro:
            "O website pode basear-se nas seguintes categorias de tecnologias do lado do navegador:",
          item1:
            "Tecnologias essenciais necessárias para o funcionamento básico do website, segurança e funcionalidades de acessibilidade.",
          item2:
            "Armazenamento de preferências utilizado para memorizar a seleção de idioma e as definições de acessibilidade escolhidas pelo visitante.",
          item3:
            "Pedidos técnicos ou recursos do lado do navegador ligados a fornecedores terceiros utilizados pelo website, como serviços de fontes ou de entrega de conteúdo.",
        },
        localStorage: {
          title: "4. Armazenamento de Preferências e Tecnologias Semelhantes",
          body1:
            "A implementação atual do website utiliza armazenamento local do navegador para preferências de idioma selecionadas e definições de acessibilidade.",
          body2:
            "O armazenamento local do navegador nem sempre é o mesmo que um cookie tradicional, mas pode servir um propósito semelhante ao memorizar definições no dispositivo ou no navegador do visitante.",
        },
        thirdParty: {
          title: "5. Serviços de Terceiros e Pedidos Técnicos",
          body1:
            "O website pode carregar recursos de terceiros, como serviços de fontes, que recebem informações técnicas padrão do pedido quando uma página é carregada.",
          body2:
            "A WiFiGate não controla as políticas desses fornecedores terceiros. Os respetivos termos, avisos de privacidade e práticas técnicas também podem aplicar-se.",
        },
        analytics: {
          title: "6. Posição Atual sobre Cookies de Publicidade e Analytics",
          body1:
            "Com base na implementação atual do website, a WiFiGate não instala intencionalmente os seus próprios cookies de publicidade ou analytics neste website.",
          body2:
            "Se as práticas do website mudarem no futuro, esta página deverá ser atualizada para descrever quaisquer novas tecnologias de analytics, medição, publicidade ou consentimento utilizadas pelo site.",
        },
        manage: {
          title: "7. Gerir as Definições do Navegador",
          body1:
            "Normalmente, pode controlar cookies, armazenamento local e tecnologias semelhantes através das definições do navegador, das ferramentas de privacidade do navegador ou das definições do dispositivo.",
          body2:
            "Bloquear ou limpar algumas tecnologias pode afetar preferências de idioma, definições de acessibilidade ou partes da experiência do website.",
        },
        related: {
          title: "8. Páginas Legais Relacionadas",
          body1:
            "Para mais informações sobre como a WiFiGate pode tratar dados pessoais e informações do produto, consulte também as páginas de Política de Privacidade e Termos e Condições.",
        },
        changes: {
          title: "9. Alterações a Este Aviso de Cookies",
          body1:
            "A WiFiGate pode atualizar este aviso de cookies periodicamente. A versão mais recente aplicar-se-á quando for publicada nesta página.",
        },
        contact: {
          title: "10. Contacto",
          body1:
            "Questões sobre este aviso de cookies ou sobre tecnologias do website do lado do navegador podem ser enviadas utilizando os dados de contacto abaixo.",
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
        "Esta página de Cookies é um rascunho geral para o website WiFiGate. Deve ser revista e adaptada às tecnologias reais do website, ao modelo de alojamento, aos serviços de terceiros e aos requisitos legais antes da publicação.",
    },
    pl: {
      metaTags: {
        title: "Pliki Cookie | WIFIGATE",
        description:
          "Informacje o plikach cookie i podobnych technologiach dla strony WIFIGATE, w tym o pamięci przeglądarki, preferencjach i zasobach zewnętrznych.",
      },
      hero: {
        eyebrow: "Informacje prawne",
        title: "Pliki Cookie",
        subtitle:
          "Ta strona wyjaśnia, w jaki sposób witryna WIFIGATE może używać plików cookie, lokalnego przechowywania w przeglądarce i podobnych technologii do obsługi preferencji językowych, ustawień dostępności i powiązanych funkcji witryny.",
        updated: "Data wejścia w życie: [Effective Date]",
        owner: "Właściciel strony: EATS SYSTEMS TECH",
        disclaimer:
          "Niniejszy dokument stanowi ogólny projekt informacji o plikach cookie i powinien zostać sprawdzony przez wykwalifikowanego doradcę prawnego przed publikacją.",
      },
      sections: {
        overview: {
          title: "1. Informacje Ogólne",
          body1:
            "Ta strona wyjaśnia, w jaki sposób witryna WiFiGate może używać plików cookie i podobnych technologii po stronie przeglądarki.",
          body2:
            "W obecnej implementacji strony WiFiGate korzysta głównie z ograniczonego przechowywania preferencji i powiązanych technologii przeglądarki, aby obsługiwać funkcje strony, takie jak język i dostępność.",
        },
        currentUse: {
          title: "2. Z Czego Korzysta Obecna Strona",
          body1:
            "Na podstawie obecnej implementacji strony WiFiGate korzysta z ograniczonego przechowywania po stronie przeglądarki, aby zapamiętywać preferencje odwiedzających, takie jak wybrany język i opcje dostępności.",
          body2:
            "Pomaga to stronie zachowywać wybrane preferencje wyświetlania między wizytami i poprawia wygodę użytkownika bez konieczności ciągłego ręcznego ustawiania.",
        },
        types: {
          title: "3. Rodzaje Plików Cookie i Podobnych Technologii",
          intro:
            "Witryna może opierać się na następujących kategoriach technologii po stronie przeglądarki:",
          item1:
            "Technologie niezbędne do podstawowego działania strony, bezpieczeństwa i funkcji dostępności.",
          item2:
            "Przechowywanie preferencji służące do zapamiętywania wyboru języka i ustawień dostępności wybranych przez odwiedzającego.",
          item3:
            "Zapytania techniczne lub zasoby po stronie przeglądarki połączone z zewnętrznymi dostawcami używanymi przez stronę, takimi jak usługi czcionek lub dostarczania treści.",
        },
        localStorage: {
          title: "4. Przechowywanie Preferencji i Podobne Technologie",
          body1:
            "Obecna implementacja strony wykorzystuje lokalne przechowywanie w przeglądarce dla wybranych preferencji językowych i ustawień dostępności.",
          body2:
            "Lokalne przechowywanie w przeglądarce nie zawsze jest tym samym co tradycyjny plik cookie, ale może służyć podobnemu celowi, zapamiętując ustawienia na urządzeniu lub w przeglądarce odwiedzającego.",
        },
        thirdParty: {
          title: "5. Usługi Zewnętrzne i Zapytania Techniczne",
          body1:
            "Witryna może ładować zasoby stron trzecich, takie jak usługi czcionek, które otrzymują standardowe informacje techniczne o żądaniu przy ładowaniu strony.",
          body2:
            "WiFiGate nie kontroluje polityk tych zewnętrznych dostawców. Mogą mieć zastosowanie również ich własne warunki, polityki prywatności i praktyki techniczne.",
        },
        analytics: {
          title: "6. Obecne Podejście do Reklamowych i Analitycznych Cookies",
          body1:
            "Na podstawie obecnej implementacji strony WiFiGate nie wdraża celowo własnych reklamowych ani analitycznych plików cookie na tej stronie.",
          body2:
            "Jeśli praktyki strony zmienią się w przyszłości, ta strona powinna zostać zaktualizowana, aby opisać nowe technologie analityczne, pomiarowe, reklamowe lub związane ze zgodą wykorzystywane przez witrynę.",
        },
        manage: {
          title: "7. Zarządzanie Ustawieniami Przeglądarki",
          body1:
            "Zwykle możesz kontrolować pliki cookie, lokalne przechowywanie i podobne technologie poprzez ustawienia przeglądarki, narzędzia prywatności przeglądarki lub ustawienia urządzenia.",
          body2:
            "Blokowanie lub usuwanie niektórych technologii może wpływać na preferencje językowe, ustawienia dostępności lub niektóre elementy korzystania ze strony.",
        },
        related: {
          title: "8. Powiązane Strony Prawne",
          body1:
            "Aby uzyskać więcej informacji o tym, jak WiFiGate może przetwarzać dane osobowe i informacje o produkcie, zapoznaj się także ze stronami Polityki Prywatności oraz Warunków i Postanowień.",
        },
        changes: {
          title: "9. Zmiany w Niniejszej Informacji o Cookies",
          body1:
            "WiFiGate może od czasu do czasu aktualizować niniejszą informację o cookies. Najnowsza wersja będzie obowiązywać po opublikowaniu na tej stronie.",
        },
        contact: {
          title: "10. Kontakt",
          body1:
            "Pytania dotyczące niniejszej informacji o cookies lub technologii witryny po stronie przeglądarki można przesyłać, korzystając z poniższych danych kontaktowych.",
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
        "Ta strona Cookies jest ogólnym projektem dla witryny WiFiGate. Przed publikacją należy ją sprawdzić i dostosować do rzeczywistych technologii strony, modelu hostingu, usług zewnętrznych i wymogów prawnych.",
    },
    ru: {
      metaTags: {
        title: "Cookies | WIFIGATE",
        description:
          "Информация о cookies и похожих технологиях для сайта WIFIGATE, включая хранилище браузера, предпочтения и сторонние ресурсы.",
      },
      hero: {
        eyebrow: "Правовая информация",
        title: "Cookies",
        subtitle:
          "На этой странице объясняется, как сайт WIFIGATE может использовать cookies, локальное хранилище браузера и похожие технологии для поддержки языковых предпочтений, настроек доступности и связанных функций сайта.",
        updated: "Дата вступления в силу: [Effective Date]",
        owner: "Владелец сайта: EATS SYSTEMS TECH",
        disclaimer:
          "Этот документ предоставляется как общий проект уведомления о cookies и должен быть проверен квалифицированным юристом до публикации.",
      },
      sections: {
        overview: {
          title: "1. Обзор",
          body1:
            "На этой странице объясняется, как сайт WiFiGate может использовать cookies и похожие технологии на стороне браузера.",
          body2:
            "В текущей реализации сайта WiFiGate в основном использует ограниченное хранение предпочтений и связанные технологии браузера для поддержки таких функций сайта, как язык и доступность.",
        },
        currentUse: {
          title: "2. Что Использует Текущий Сайт",
          body1:
            "Согласно текущей реализации сайта WiFiGate использует ограниченное хранилище на стороне браузера, чтобы запоминать предпочтения посетителя, например выбранный язык и параметры доступности.",
          body2:
            "Это помогает сайту сохранять выбранные настройки просмотра между посещениями и улучшает пользовательский опыт без необходимости каждый раз выполнять ручные изменения.",
        },
        types: {
          title: "3. Виды Cookies и Похожих Технологий",
          intro:
            "Сайт может использовать следующие категории технологий на стороне браузера:",
          item1:
            "Необходимые технологии для базовой работы сайта, безопасности и функций доступности.",
          item2:
            "Хранение предпочтений для запоминания выбора языка и настроек доступности, выбранных посетителем.",
          item3:
            "Технические запросы или ресурсы на стороне браузера, связанные со сторонними поставщиками, используемыми сайтом, например сервисами шрифтов или доставки контента.",
        },
        localStorage: {
          title: "4. Хранение Предпочтений и Похожие Технологии",
          body1:
            "Текущая реализация сайта использует локальное хранилище браузера для выбранных языковых предпочтений и настроек доступности.",
          body2:
            "Локальное хранилище браузера не всегда является тем же самым, что и традиционный cookie, но может выполнять схожую функцию, запоминая настройки на устройстве или в браузере посетителя.",
        },
        thirdParty: {
          title: "5. Сторонние Сервисы и Технические Запросы",
          body1:
            "Сайт может загружать сторонние ресурсы, например сервисы шрифтов, которые получают стандартную техническую информацию о запросе при загрузке страницы.",
          body2:
            "WiFiGate не контролирует политики этих сторонних поставщиков. Их собственные условия, уведомления о конфиденциальности и технические практики также могут применяться.",
        },
        analytics: {
          title: "6. Текущая Позиция по Рекламным и Аналитическим Cookies",
          body1:
            "Согласно текущей реализации сайта WiFiGate намеренно не использует на этом сайте собственные рекламные или аналитические cookies.",
          body2:
            "Если практики сайта изменятся в будущем, эта страница должна быть обновлена и описывать любые новые аналитические, измерительные, рекламные или связанные с согласием технологии, используемые сайтом.",
        },
        manage: {
          title: "7. Управление Настройками Браузера",
          body1:
            "Обычно вы можете управлять cookies, локальным хранилищем и похожими технологиями через настройки браузера, инструменты конфиденциальности браузера или настройки устройства.",
          body2:
            "Блокировка или очистка некоторых технологий может повлиять на языковые предпочтения, настройки доступности или отдельные части работы сайта.",
        },
        related: {
          title: "8. Связанные Правовые Страницы",
          body1:
            "Чтобы узнать больше о том, как WiFiGate может обрабатывать персональные данные и информацию о продукте, ознакомьтесь также со страницами Политики конфиденциальности и Условий и положений.",
        },
        changes: {
          title: "9. Изменения в Этом Уведомлении о Cookies",
          body1:
            "WiFiGate может время от времени обновлять это уведомление о cookies. Последняя версия будет действовать после публикации на этой странице.",
        },
        contact: {
          title: "10. Контакты",
          body1:
            "Вопросы об этом уведомлении о cookies или о браузерных технологиях сайта можно направлять, используя приведенные ниже контактные данные.",
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
        "Эта страница Cookies является общим проектом для сайта WiFiGate. Перед публикацией ее следует проверить и адаптировать под фактические технологии сайта, модель хостинга, сторонние сервисы и правовые требования.",
    },
    cs: {
      metaTags: {
        title: "Cookies | WIFIGATE",
        description:
          "Informace o cookies a podobných technologiích pro web WIFIGATE, včetně úložiště prohlížeče, předvoleb a zdrojů třetích stran.",
      },
      hero: {
        eyebrow: "Právní informace",
        title: "Cookies",
        subtitle:
          "Tato stránka vysvětluje, jak může web WIFIGATE používat cookies, místní úložiště prohlížeče a podobné technologie k podpoře jazykových předvoleb, nastavení přístupnosti a souvisejících funkcí webu.",
        updated: "Datum účinnosti: [Effective Date]",
        owner: "Provozovatel webu: EATS SYSTEMS TECH",
        disclaimer:
          "Tento dokument je poskytován jako obecný návrh oznámení o cookies a před zveřejněním by měl být zkontrolován kvalifikovaným právním poradcem.",
      },
      sections: {
        overview: {
          title: "1. Přehled",
          body1:
            "Tato stránka vysvětluje, jak může web WiFiGate používat cookies a podobné technologie na straně prohlížeče.",
          body2:
            "V aktuální implementaci webu WiFiGate používá hlavně omezené ukládání předvoleb a související technologie prohlížeče k podpoře funkcí webu, jako je jazyk a přístupnost.",
        },
        currentUse: {
          title: "2. Co Aktuální Web Používá",
          body1:
            "Na základě aktuální implementace webu používá WiFiGate omezené úložiště na straně prohlížeče k zapamatování předvoleb návštěvníka, například zvoleného jazyka a nastavení přístupnosti.",
          body2:
            "To pomáhá webu zachovat vybrané předvolby zobrazení mezi návštěvami a zlepšuje uživatelský zážitek bez nutnosti opakovaných ručních změn.",
        },
        types: {
          title: "3. Typy Cookies a Podobných Technologií",
          intro:
            "Web může používat následující kategorie technologií na straně prohlížeče:",
          item1:
            "Nezbytné technologie potřebné pro základní provoz webu, zabezpečení a funkce přístupnosti.",
          item2:
            "Ukládání předvoleb používané k zapamatování výběru jazyka a nastavení přístupnosti zvoleného návštěvníkem.",
          item3:
            "Technické požadavky nebo zdroje na straně prohlížeče propojené s poskytovateli třetích stran používanými webem, například službami písem nebo doručování obsahu.",
        },
        localStorage: {
          title: "4. Ukládání Předvoleb a Podobné Technologie",
          body1:
            "Aktuální implementace webu používá místní úložiště prohlížeče pro zvolené jazykové preference a nastavení přístupnosti.",
          body2:
            "Místní úložiště prohlížeče není vždy totéž jako tradiční cookie, ale může sloužit podobnému účelu tím, že si pamatuje nastavení v zařízení nebo prohlížeči návštěvníka.",
        },
        thirdParty: {
          title: "5. Služby Třetích Stran a Technické Požadavky",
          body1:
            "Web může načítat zdroje třetích stran, například služby písem, které při načtení stránky přijímají standardní technické informace o požadavku.",
          body2:
            "WiFiGate nekontroluje zásady těchto poskytovatelů třetích stran. Mohou se uplatnit i jejich vlastní podmínky, zásady ochrany soukromí a technické postupy.",
        },
        analytics: {
          title: "6. Aktuální Postoj k Reklamním a Analytickým Cookies",
          body1:
            "Na základě aktuální implementace webu WiFiGate záměrně nenasazuje na tomto webu vlastní reklamní ani analytické cookies.",
          body2:
            "Pokud se postupy webu v budoucnu změní, měla by být tato stránka aktualizována a popsat nové analytické, měřicí, reklamní nebo souhlasové technologie používané webem.",
        },
        manage: {
          title: "7. Správa Nastavení Prohlížeče",
          body1:
            "Cookies, místní úložiště a podobné technologie můžete obvykle spravovat prostřednictvím nastavení prohlížeče, nástrojů ochrany soukromí v prohlížeči nebo nastavení zařízení.",
          body2:
            "Blokování nebo vymazání některých technologií může ovlivnit jazykové předvolby, nastavení přístupnosti nebo části používání webu.",
        },
        related: {
          title: "8. Související Právní Stránky",
          body1:
            "Další informace o tom, jak může WiFiGate nakládat s osobními údaji a informacemi o produktu, najdete také na stránkách Zásad ochrany soukromí a Podmínek používání.",
        },
        changes: {
          title: "9. Změny Tohoto Oznámení o Cookies",
          body1:
            "WiFiGate může toto oznámení o cookies čas od času aktualizovat. Nejnovější verze bude platit po zveřejnění na této stránce.",
        },
        contact: {
          title: "10. Kontakt",
          body1:
            "Dotazy k tomuto oznámení o cookies nebo k technologiím webu na straně prohlížeče můžete zaslat prostřednictvím níže uvedených kontaktních údajů.",
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
        "Tato stránka Cookies je obecným návrhem pro web WiFiGate. Před zveřejněním by měla být zkontrolována a upravena podle skutečných technologií webu, způsobu hostingu, služeb třetích stran a právních požadavků.",
    },
    ar: {
      metaTags: {
        title: "ملفات تعريف الارتباط | WIFIGATE",
        description:
          "معلومات عن ملفات تعريف الارتباط والتقنيات المشابهة لموقع WIFIGATE، بما في ذلك تخزين المتصفح والتفضيلات وموارد الجهات الخارجية.",
      },
      hero: {
        eyebrow: "قانوني",
        title: "ملفات تعريف الارتباط",
        subtitle:
          "توضح هذه الصفحة كيف يمكن لموقع WIFIGATE استخدام ملفات تعريف الارتباط والتخزين المحلي في المتصفح والتقنيات المشابهة لدعم تفضيلات اللغة وإعدادات إمكانية الوصول ووظائف الموقع ذات الصلة.",
        updated: "تاريخ السريان: [Effective Date]",
        owner: "مالك الموقع: EATS SYSTEMS TECH",
        disclaimer:
          "يتم تقديم هذا المستند كمسودة عامة لإشعار ملفات تعريف الارتباط، ويجب مراجعته من قبل مستشار قانوني مؤهل قبل النشر.",
      },
      sections: {
        overview: {
          title: "1. نظرة عامة",
          body1:
            "توضح هذه الصفحة كيف يمكن لموقع WiFiGate استخدام ملفات تعريف الارتباط والتقنيات المشابهة على جانب المتصفح.",
          body2:
            "في التطبيق الحالي للموقع، يستخدم WiFiGate بشكل أساسي تخزينًا محدودًا للتفضيلات وتقنيات متصفح ذات صلة لدعم وظائف الموقع مثل اللغة وإمكانية الوصول.",
        },
        currentUse: {
          title: "2. ما الذي يستخدمه الموقع الحالي",
          body1:
            "استنادًا إلى التطبيق الحالي للموقع، يستخدم WiFiGate تخزينًا محدودًا على جانب المتصفح لتذكر تفضيلات الزائر مثل اللغة المختارة وخيارات إمكانية الوصول.",
          body2:
            "يساعد ذلك الموقع على الاحتفاظ بتفضيلات العرض بين الزيارات ويحسن تجربة المستخدم من دون الحاجة إلى تغييرات يدوية متكررة.",
        },
        types: {
          title: "3. أنواع ملفات تعريف الارتباط والتقنيات المشابهة",
          intro:
            "قد يعتمد الموقع على الفئات التالية من التقنيات على جانب المتصفح:",
          item1:
            "تقنيات أساسية لازمة للتشغيل الأساسي للموقع والأمان وميزات إمكانية الوصول.",
          item2:
            "تخزين التفضيلات المستخدم لتذكر اختيار اللغة وإعدادات إمكانية الوصول التي يحددها الزائر.",
          item3:
            "طلبات تقنية أو موارد على جانب المتصفح مرتبطة بمزودي خدمات من أطراف ثالثة يستخدمهم الموقع، مثل خدمات الخطوط أو توصيل المحتوى.",
        },
        localStorage: {
          title: "4. تخزين التفضيلات والتقنيات المشابهة",
          body1:
            "يستخدم التطبيق الحالي للموقع التخزين المحلي في المتصفح لتفضيلات اللغة المختارة وإعدادات إمكانية الوصول.",
          body2:
            "لا يكون التخزين المحلي في المتصفح دائمًا هو نفسه ملف تعريف الارتباط التقليدي، لكنه قد يؤدي غرضًا مشابهًا من خلال تذكر الإعدادات على جهاز الزائر أو في متصفحه.",
        },
        thirdParty: {
          title: "5. خدمات الجهات الخارجية والطلبات التقنية",
          body1:
            "قد يقوم الموقع بتحميل موارد من أطراف ثالثة، مثل خدمات الخطوط، والتي تتلقى معلومات تقنية قياسية عن الطلب عند تحميل الصفحة.",
          body2:
            "لا يتحكم WiFiGate في سياسات مزودي الخدمات الخارجيين هؤلاء. وقد تنطبق أيضًا شروطهم الخاصة وإشعارات الخصوصية وممارساتهم التقنية.",
        },
        analytics: {
          title: "6. الموقف الحالي من ملفات تعريف الارتباط الإعلانية والتحليلية",
          body1:
            "استنادًا إلى التطبيق الحالي للموقع، لا يقوم WiFiGate عن قصد بنشر ملفات تعريف ارتباط إعلانية أو تحليلية خاصة به على هذا الموقع.",
          body2:
            "إذا تغيرت ممارسات الموقع في المستقبل، فيجب تحديث هذه الصفحة لوصف أي تقنيات جديدة للتحليلات أو القياس أو الإعلانات أو الموافقة يستخدمها الموقع.",
        },
        manage: {
          title: "7. إدارة إعدادات المتصفح",
          body1:
            "يمكنك عادةً التحكم في ملفات تعريف الارتباط والتخزين المحلي والتقنيات المشابهة من خلال إعدادات المتصفح أو أدوات الخصوصية في المتصفح أو إعدادات الجهاز.",
          body2:
            "قد يؤثر حظر بعض التقنيات أو مسحها على تفضيلات اللغة أو إعدادات إمكانية الوصول أو أجزاء من تجربة الموقع.",
        },
        related: {
          title: "8. الصفحات القانونية ذات الصلة",
          body1:
            "للحصول على مزيد من المعلومات حول كيفية تعامل WiFiGate مع البيانات الشخصية ومعلومات المنتج، يرجى أيضًا مراجعة صفحتي سياسة الخصوصية والشروط والأحكام.",
        },
        changes: {
          title: "9. التغييرات على إشعار ملفات تعريف الارتباط هذا",
          body1:
            "قد يقوم WiFiGate بتحديث إشعار ملفات تعريف الارتباط هذا من وقت إلى آخر. وستسري أحدث نسخة عند نشرها على هذه الصفحة.",
        },
        contact: {
          title: "10. التواصل",
          body1:
            "يمكن إرسال الأسئلة المتعلقة بإشعار ملفات تعريف الارتباط هذا أو بالتقنيات المستخدمة في الموقع على جانب المتصفح باستخدام بيانات التواصل أدناه.",
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
        "تُعد صفحة ملفات تعريف الارتباط هذه مسودة عامة لموقع WiFiGate. ويجب مراجعتها وتكييفها مع تقنيات الموقع الفعلية وترتيب الاستضافة وخدمات الجهات الخارجية والمتطلبات القانونية قبل النشر.",
    },
  }

  Object.keys(cookiesTranslations).forEach((lang) => {
    if (!translations[lang]) {
      translations[lang] = {}
    }

    translations[lang].legal = Object.assign(
      {},
      cookiesTranslations[lang],
      sharedLegal[lang]
    )
  })
})()
