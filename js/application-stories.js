// /js/application-stories.js
// Version: 1.1.0

var APPLICATION_STORY_DEFAULT_CARD_ID = "where-story-card";
var APPLICATION_STORY_PREFIX = "where-story-";

var APPLICATION_STORY_SLUGS = {
  electricGates: "electric-gates",
  entranceDoors: "entrance-doors",
  magneticLocks: "magnetic-locks",
  barrierGates: "barrier-gates",
  privateHomes: "private-homes",
  residentialComplexes: "residential-complexes",
  officeBuildings: "office-buildings",
  industrialFacilities: "industrial-facilities",
  sportsFacilities: "sports-facilities",
  educationalInstitutions: "educational-institutions",
  hotels: "hotels",
  vacationRentals: "vacation-rentals",
};

var APPLICATION_STORY_UI = {
  en: {
    eyebrow: "Application Story",
    problem: "Problem",
    solution: "WiFiGate Story",
    value: "Value",
    buyer: "Best Buyer",
    demo: "Demo Angle",
    close: "Close",
    closeAria: "Close story",
  },
  he: {
    eyebrow: "סיפור שימוש",
    problem: "הבעיה",
    solution: "סיפור WiFiGate",
    value: "הערך",
    buyer: "הקונה המתאים",
    demo: "כיוון הדגמה",
    close: "סגור",
    closeAria: "סגור סיפור",
  },
  es: {
    eyebrow: "Historia de uso",
    problem: "Problema",
    solution: "Historia de WiFiGate",
    value: "Valor",
    buyer: "Comprador ideal",
    demo: "Enfoque de demostracion",
    close: "Cerrar",
    closeAria: "Cerrar historia",
  },
  pt: {
    eyebrow: "Historia de uso",
    problem: "Problema",
    solution: "Historia da WiFiGate",
    value: "Valor",
    buyer: "Melhor comprador",
    demo: "Angulo de demonstracao",
    close: "Fechar",
    closeAria: "Fechar historia",
  },
  pl: {
    eyebrow: "Scenariusz zastosowania",
    problem: "Problem",
    solution: "Historia WiFiGate",
    value: "Wartosc",
    buyer: "Najlepszy klient",
    demo: "Kierunek demonstracji",
    close: "Zamknij",
    closeAria: "Zamknij opis",
  },
  ru: {
    eyebrow: "Сценарий применения",
    problem: "Проблема",
    solution: "История WiFiGate",
    value: "Ценность",
    buyer: "Лучший покупатель",
    demo: "Сценарий демонстрации",
    close: "Закрыть",
    closeAria: "Закрыть историю",
  },
  cs: {
    eyebrow: "Scenar pouziti",
    problem: "Problem",
    solution: "Pribeh WiFiGate",
    value: "Hodnota",
    buyer: "Idealni kupujici",
    demo: "Smer ukazky",
    close: "Zavrit",
    closeAria: "Zavrit pribeh",
  },
  ar: {
    eyebrow: "قصة الاستخدام",
    problem: "المشكلة",
    solution: "قصة WiFiGate",
    value: "القيمة",
    buyer: "المشتري الانسب",
    demo: "زاوية العرض",
    close: "اغلاق",
    closeAria: "اغلاق القصة",
  },
};

var APPLICATION_STORIES = {
  en: {
    electricGates: {
      pitch: "WiFiGate turns electric gates into a simple phone-based access experience for owners, residents, guests, and property teams.",
      problem: "Electric gates are often controlled by remotes, keypads, or calls, which creates friction, lost devices, copied access, and too much manual coordination.",
      solution: "Instead of depending on physical remotes, the gate can be opened from the phone. Owners and admins can share temporary or permanent access, and frequent users can get a smoother daily experience through widgets and auto-open.",
      value: "Less dependence on remotes, cleaner guest management, faster entry, and a more modern access experience.",
      buyer: "Homeowners, building managers, gated communities, and installers upgrading older gate setups.",
      demo: "Show one owner opening the gate, then sending temporary guest access to another phone.",
    },
    entranceDoors: {
      pitch: "WiFiGate gives entrance doors the same smart, shareable, and manageable access flow that people already expect from modern apps.",
      problem: "Front doors in shared properties create constant small frictions: letting in guests, cleaners, staff, residents, or delivery people without handing over keys or codes too broadly.",
      solution: "The admin or owner can manage who gets door access, for how long, and at what level. Residents get a clean daily flow, while guests or service providers can receive temporary access from the phone.",
      value: "Better control, fewer keys, less interruption for staff or residents, and a more professional arrival experience.",
      buyer: "Residential buildings, offices, clinics, hotels, and mixed-use properties.",
      demo: "Show a resident with permanent access and a guest with time-limited access to the same entrance.",
    },
    magneticLocks: {
      pitch: "WiFiGate makes magnetic-lock access easier to manage, especially where many short visits or controlled entries happen each day.",
      problem: "Magnetic locks are effective, but the management layer around them is often weak: too many shared codes, too much front-desk dependency, and limited flexibility for temporary access.",
      solution: "Instead of one static method for everyone, access can be role-based. Admins, users, and guests each get the right level of control, and temporary access can be shared and expire automatically.",
      value: "Tighter control, simpler administration, and a better balance between security and convenience.",
      buyer: "Offices, clinics, schools, internal facility doors, and amenity spaces.",
      demo: "Show an admin sharing short-term access with a service provider, then explain how it expires without manual follow-up.",
    },
    barrierGates: {
      pitch: "WiFiGate helps barrier gates work better for vehicle access, guest arrivals, and recurring users without manual gate coordination.",
      problem: "Barrier gates often create daily friction around parking, visitors, deliveries, and staff access. Someone always ends up needing to call, wait, or rely on a shared remote.",
      solution: "Drivers or authorized users can open the barrier from the phone. Property teams can share guest access for visitors and keep recurring users on a smoother flow with widgets and auto-open.",
      value: "Faster vehicle entry, fewer delays, better guest handling, and less operational noise around parking access.",
      buyer: "Residential parking sites, office parking, hotels, gated communities, and property managers.",
      demo: "Show a visitor arriving with temporary access and a resident using a faster repeat-access flow.",
    },
    privateHomes: {
      pitch: "WiFiGate gives homeowners a smarter and more flexible way to manage gate and entry access for family, guests, and service providers.",
      problem: "Private homes still rely heavily on keys, remotes, or ad hoc coordination, especially when guests, cleaners, babysitters, or delivery workers need access.",
      solution: "The homeowner can open from the phone, share temporary access when needed, and avoid handing over permanent devices for short visits. The home feels easier to manage without becoming less secure.",
      value: "More convenience, more control, fewer lost remotes, and less need for manual entry coordination.",
      buyer: "Homeowners with electric gates, villas, private compounds, and high-convenience households.",
      demo: "Show a homeowner sending a temporary access link to a cleaner or guest for a limited time window.",
    },
    residentialComplexes: {
      pitch: "WiFiGate brings structure, convenience, and controlled guest access to residential complexes with multiple residents and shared entry points.",
      problem: "Residential complexes have many moving parts: residents, visitors, parking, maintenance, and multiple gates or doors. Traditional access systems become messy fast.",
      solution: "Admins can manage different access levels, residents can use the app for daily entry, guests can receive temporary access, and several gates can be organized in one place.",
      value: "Cleaner operations, better resident experience, fewer physical devices, and more scalable access management.",
      buyer: "Building committees, residential operators, gated communities, and management companies.",
      demo: "Show multiple gates on one phone, then show a resident flow and a guest flow side by side.",
    },
    officeBuildings: {
      pitch: "WiFiGate helps office buildings modernize entry for employees, visitors, and operations teams without relying on clunky access handoffs.",
      problem: "Offices need controlled access for staff and visitors, but they also need speed and professionalism. Front desks and facilities teams often carry too much of the burden.",
      solution: "Employees can have recurring access, visitors can receive temporary entry permissions, and facility admins can manage access more cleanly from the phone.",
      value: "A smoother visitor experience, less manual coordination, better access hygiene, and a stronger modern image for the building.",
      buyer: "Office landlords, office operators, facility managers, and integrators serving commercial sites.",
      demo: "Show an employee using permanent access and a visitor getting a temporary invite before arrival.",
    },
    industrialFacilities: {
      pitch: "WiFiGate gives industrial facilities tighter control over entry while reducing the daily friction around staff, vendors, and vehicle access.",
      problem: "Industrial sites need controlled entry for safety and operations, but access often depends on too many physical devices, manual approvals, and workarounds for vendors or temporary staff.",
      solution: "Facility admins can manage who gets access, when they get it, and whether it is temporary or recurring. Vehicle barriers, gates, and controlled entries can be handled through the same logic.",
      value: "Better operational control, less confusion at the gate, easier vendor handling, and a stronger security posture without slowing everything down.",
      buyer: "Warehouse operators, factories, logistics sites, and industrial facility managers.",
      demo: "Show a recurring worker flow and a temporary vendor access flow with time-based permissions.",
    },
    sportsFacilities: {
      pitch: "WiFiGate helps sports facilities manage athlete, staff, and visitor access in a way that feels fast, controlled, and easy to operate.",
      problem: "Sports facilities deal with shifting schedules, large groups, trainers, service providers, and event traffic. Access can become chaotic when it depends on manual supervision.",
      solution: "Managers can give the right access to the right people for the right time window. Daily staff and members get smooth recurring access, while guests or event-related visitors get temporary permissions.",
      value: "Less front-desk pressure, faster arrival, better control on busy days, and a smoother member experience.",
      buyer: "Gyms, stadium support sites, country clubs, training centers, and community sports complexes.",
      demo: "Show a member or staff daily access flow and then a guest or event-day temporary access flow.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate helps educational institutions control access more cleanly for staff, students, parents, and service teams.",
      problem: "Schools and campuses need safe access, but they also deal with many user groups, changing schedules, and temporary access needs for visitors and vendors.",
      solution: "Access can be distributed by role and duration. Staff and approved recurring users get ongoing access, while parents, visitors, or contractors can receive temporary permissions when appropriate.",
      value: "Safer access management, less manual gate handling, cleaner visitor flow, and a more modern operational system.",
      buyer: "Private schools, campuses, training centers, and education-site operators.",
      demo: "Show a staff access flow and a time-limited visitor flow, focusing on control and simplicity.",
    },
    hotels: {
      pitch: "WiFiGate improves hotel arrival and on-site access by giving staff and guests a simpler, more coordinated entry experience.",
      problem: "Hotels manage guests, staff, parking, service providers, and shift changes every day. Entry and barrier coordination can create delays and unnecessary staff involvement.",
      solution: "Hotel teams can manage access to gates, barriers, and controlled entry points from the phone. Guests can receive temporary access where relevant, and staff can use recurring permissions for daily operations.",
      value: "A better guest arrival experience, less operational friction, cleaner parking access, and less dependence on manual intervention.",
      buyer: "Boutique hotels, resorts, serviced apartments, and hospitality operators with gated entry or parking.",
      demo: "Show a guest arrival flow for parking or entry, then show a staff recurring-access flow.",
    },
    vacationRentals: {
      pitch: "WiFiGate removes check-in friction for short-term rentals by giving hosts a secure and simple way to share gate access from the phone.",
      problem: "Hosts lose time on late arrivals, keys, remotes, copied codes, and guest confusion at the gate or parking entrance.",
      solution: "The host sends temporary guest access, optionally limited to a time window or a specific phone. The guest can receive clear arrival details like apartment, floor, parking, and comments, and access expires automatically.",
      value: "Smoother check-in, fewer support calls, less dependence on physical access devices, and more control for the host or operator.",
      buyer: "Airbnb hosts, short-term rental managers, vacation property operators, and serviced-apartment teams.",
      demo: "Show the full host-to-guest flow: create invite, set time window, send link, and open the gate on arrival.",
    },
  },
  he: {
    electricGates: {
      pitch: "WiFiGate הופך שערים חשמליים לחוויית גישה פשוטה מהטלפון עבור בעלי נכס, דיירים, אורחים וצוותי ניהול.",
      problem: "שערים חשמליים נשלטים לעיתים קרובות באמצעות שלטים, קודנים או שיחות טלפון, מה שיוצר חיכוך, אובדן התקנים, העתקת גישה ותיאום ידני מיותר.",
      solution: "במקום להסתמך על שלטים פיזיים, ניתן לפתוח את השער מהטלפון. בעלי נכס ומנהלים יכולים לשתף גישה זמנית או קבועה, ומשתמשים קבועים נהנים מווידג'טים ומפתיחה אוטומטית.",
      value: "פחות תלות בשלטים, ניהול אורחים מסודר יותר, כניסה מהירה יותר וחוויית גישה מודרנית.",
      buyer: "בעלי בתים, מנהלי בניינים, קהילות סגורות ומתקינים שמשדרגים מערכות שער ישנות.",
      demo: "הראו בעל נכס פותח את השער ואז שולח גישת אורח זמנית לטלפון אחר.",
    },
    entranceDoors: {
      pitch: "WiFiGate מעניק לדלתות כניסה את אותה חוויית גישה חכמה, ניתנת לשיתוף וקלה לניהול שאנשים מצפים לה מאפליקציות מודרניות.",
      problem: "דלתות כניסה בנכסים משותפים יוצרות חיכוכים קטנים אבל קבועים: הכנסת אורחים, מנקים, עובדים, דיירים או שליחים בלי למסור מפתחות או קודים בצורה רחבה מדי.",
      solution: "האדמין או בעל הנכס יכולים לקבוע למי יש גישה, לכמה זמן ובאיזו רמה. דיירים נהנים מזרימת שימוש יומיומית נקייה, ואורחים או ספקי שירות מקבלים גישה זמנית מהטלפון.",
      value: "שליטה טובה יותר, פחות מפתחות, פחות הפרעות לצוות או לדיירים וחוויית הגעה מקצועית יותר.",
      buyer: "בנייני מגורים, משרדים, מרפאות, בתי מלון ונכסים מעורבי שימוש.",
      demo: "הראו דייר עם גישה קבועה ואורח עם גישה מוגבלת בזמן לאותה כניסה.",
    },
    magneticLocks: {
      pitch: "WiFiGate הופך את ניהול הגישה למנעולים מגנטיים לפשוט יותר, במיוחד במקומות עם הרבה כניסות קצרות או מבוקרות בכל יום.",
      problem: "מנעולים מגנטיים יעילים, אבל שכבת הניהול סביבם לעיתים חלשה: יותר מדי קודים משותפים, תלות גדולה מדי בעמדת הקבלה וגמישות נמוכה בגישה זמנית.",
      solution: "במקום שיטת גישה אחת לכולם, ניתן לנהל גישה לפי תפקיד. מנהלים, משתמשים ואורחים מקבלים את רמת השליטה המתאימה, וגישה זמנית יכולה לפוג אוטומטית.",
      value: "שליטה הדוקה יותר, ניהול פשוט יותר ואיזון טוב יותר בין אבטחה לנוחות.",
      buyer: "משרדים, מרפאות, בתי ספר, דלתות פנימיות במתקנים וחללי שירות.",
      demo: "הראו אדמין משתף גישה קצרת טווח עם ספק שירות, ואז הסבירו איך היא פגה בלי מעקב ידני.",
    },
    barrierGates: {
      pitch: "WiFiGate משפר את העבודה עם מחסומי זרוע עבור כניסת רכבים, הגעת אורחים ומשתמשים קבועים, בלי תיאום ידני סביב השער.",
      problem: "מחסומי זרוע יוצרים חיכוך יומיומי סביב חניה, מבקרים, משלוחים וגישה לעובדים. כמעט תמיד מישהו צריך להתקשר, להמתין או להסתמך על שלט משותף.",
      solution: "נהגים ומשתמשים מורשים יכולים לפתוח את המחסום מהטלפון. צוותי ניהול יכולים לשתף גישת אורח למבקרים, ולתת למשתמשים קבועים זרימה חלקה יותר עם ווידג'טים ופתיחה אוטומטית.",
      value: "כניסת רכבים מהירה יותר, פחות עיכובים, טיפול טוב יותר באורחים ופחות רעש תפעולי סביב החניה.",
      buyer: "אתרי חניה למגורים, חניוני משרדים, בתי מלון, קהילות סגורות ומנהלי נכסים.",
      demo: "הראו מבקר שמגיע עם גישה זמנית ודייר שמשתמש בזרימת כניסה מהירה לשימוש חוזר.",
    },
    privateHomes: {
      pitch: "WiFiGate נותן לבעלי בתים דרך חכמה וגמישה יותר לנהל גישה לשער ולכניסה עבור משפחה, אורחים וספקי שירות.",
      problem: "בתים פרטיים עדיין נשענים מאוד על מפתחות, שלטים או תיאום מאולתר, במיוחד כשאורחים, מנקים, בייביסיטר או שליחים צריכים להיכנס.",
      solution: "בעל הבית יכול לפתוח מהטלפון, לשתף גישה זמנית כשצריך ולהימנע ממסירת התקנים קבועים לביקורים קצרים. הבית נהיה קל יותר לניהול בלי להיות פחות בטוח.",
      value: "יותר נוחות, יותר שליטה, פחות שלטים שאובדים ופחות צורך בתיאום ידני של כניסה.",
      buyer: "בעלי בתים עם שערים חשמליים, וילות, מתחמים פרטיים ובתים שמחפשים נוחות גבוהה.",
      demo: "הראו בעל בית שולח קישור גישה זמני למנקה או לאורח בחלון זמן מוגבל.",
    },
    residentialComplexes: {
      pitch: "WiFiGate מביא סדר, נוחות וגישת אורחים מבוקרת למתחמי מגורים עם כמה דיירים ונקודות כניסה משותפות.",
      problem: "למתחמי מגורים יש הרבה חלקים נעים: דיירים, מבקרים, חניה, תחזוקה וכמה שערים או דלתות. מערכות גישה מסורתיות נהיות מהר מאוד מבולגנות.",
      solution: "אדמינים יכולים לנהל רמות גישה שונות, דיירים משתמשים באפליקציה לכניסה יומיומית, אורחים מקבלים גישה זמנית, וכמה שערים יכולים להיות מאורגנים במקום אחד.",
      value: "תפעול מסודר יותר, חוויית דייר טובה יותר, פחות התקנים פיזיים וניהול גישה שקל יותר להרחיב.",
      buyer: "ועדי בתים, מפעילי מגורים, קהילות סגורות וחברות ניהול.",
      demo: "הראו כמה שערים בטלפון אחד, ואז הראו זה לצד זה זרימת דייר וזרימת אורח.",
    },
    officeBuildings: {
      pitch: "WiFiGate עוזר לבנייני משרדים לחדש את הכניסה עבור עובדים, מבקרים וצוותי תפעול בלי להסתמך על מסירות גישה מסורבלות.",
      problem: "משרדים צריכים גישה מבוקרת לעובדים ולמבקרים, אבל גם מהירות ומקצועיות. עמדות קבלה וצוותי תפעול נושאים לעיתים בנטל גדול מדי.",
      solution: "לעובדים יכולה להיות גישה קבועה, מבקרים יכולים לקבל הרשאות זמניות, ומנהלי המתקן יכולים לנהל את הגישה בצורה נקייה יותר מהטלפון.",
      value: "חוויית מבקר חלקה יותר, פחות תיאום ידני, היגיינת גישה טובה יותר ותדמית מודרנית יותר לבניין.",
      buyer: "בעלי מגדלי משרדים, מפעילי משרדים, מנהלי מתקנים ואינטגרטורים שמשרתים אתרי מסחר.",
      demo: "הראו עובד עם גישה קבועה ומבקר שמקבל הזמנה זמנית לפני ההגעה.",
    },
    industrialFacilities: {
      pitch: "WiFiGate נותן למתקנים תעשייתיים שליטה הדוקה יותר בכניסה תוך הפחתת החיכוך היומיומי סביב עובדים, ספקים וגישה לרכבים.",
      problem: "אתרים תעשייתיים צריכים שליטה בכניסה לצורכי בטיחות ותפעול, אבל הגישה מסתמכת לעיתים על יותר מדי התקנים פיזיים, אישורים ידניים ופתרונות עקיפה לספקים או לעובדים זמניים.",
      solution: "מנהלי המתקן יכולים לנהל מי מקבל גישה, מתי היא ניתנת והאם היא זמנית או קבועה. מחסומים, שערים וכניסות מבוקרות יכולים לפעול לפי אותה לוגיקה.",
      value: "שליטה תפעולית טובה יותר, פחות בלבול בשער, טיפול קל יותר בספקים ועמדת אבטחה חזקה יותר בלי להאט את הפעילות.",
      buyer: "מפעילי מחסנים, מפעלים, אתרי לוגיסטיקה ומנהלי מתקנים תעשייתיים.",
      demo: "הראו זרימת עובד קבוע וזרימת גישה זמנית לספק עם הרשאות מבוססות זמן.",
    },
    sportsFacilities: {
      pitch: "WiFiGate עוזר למתקני ספורט לנהל גישה לספורטאים, עובדים ומבקרים בצורה מהירה, מבוקרת וקלה לתפעול.",
      problem: "מתקני ספורט מתמודדים עם לוחות זמנים משתנים, קבוצות גדולות, מאמנים, ספקי שירות ותנועת אירועים. הגישה יכולה להפוך לכאוטית כשהיא נשענת על פיקוח ידני.",
      solution: "מנהלים יכולים לתת את הגישה הנכונה לאנשים הנכונים ולחלון הזמן הנכון. עובדים וחברים קבועים נהנים מגישה חלקה, ואורחים או מבקרי אירוע מקבלים הרשאות זמניות.",
      value: "פחות עומס על עמדת הקבלה, הגעה מהירה יותר, יותר שליטה בימים עמוסים וחוויית מנוי חלקה יותר.",
      buyer: "חדרי כושר, אתרי תמיכה לאצטדיונים, מועדוני קאנטרי, מרכזי אימון ומתחמי ספורט קהילתיים.",
      demo: "הראו זרימת גישה יומיומית של חבר או עובד, ואז זרימת גישה זמנית של אורח או יום אירוע.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate עוזר למוסדות חינוך לנהל גישה בצורה נקייה יותר עבור צוות, תלמידים, הורים וצוותי שירות.",
      problem: "בתי ספר וקמפוסים צריכים גישה בטוחה, אבל הם גם מתמודדים עם כמה קבוצות משתמשים, לוחות זמנים משתנים וצרכי גישה זמניים למבקרים ולספקים.",
      solution: "אפשר לחלק גישה לפי תפקיד ולפי משך זמן. צוות ומשתמשים מאושרים מקבלים גישה מתמשכת, ואילו הורים, מבקרים או קבלנים יכולים לקבל הרשאות זמניות לפי הצורך.",
      value: "ניהול גישה בטוח יותר, פחות טיפול ידני בשער, זרימת מבקרים מסודרת יותר ומערכת תפעולית מודרנית יותר.",
      buyer: "בתי ספר פרטיים, קמפוסים, מרכזי הכשרה ומפעילי אתרי חינוך.",
      demo: "הראו זרימת גישה של איש צוות וזרימת מבקר מוגבלת בזמן, תוך הדגשת השליטה והפשטות.",
    },
    hotels: {
      pitch: "WiFiGate משפר את ההגעה למלון ואת הגישה בשטח על ידי חוויית כניסה פשוטה ומתואמת יותר לאורחים ולעובדים.",
      problem: "בתי מלון מנהלים מדי יום אורחים, עובדים, חניה, ספקי שירות וחילופי משמרות. תיאום הכניסה והמחסומים עלול ליצור עיכובים ומעורבות צוות מיותרת.",
      solution: "צוותי המלון יכולים לנהל גישה לשערים, למחסומים ולנקודות כניסה מבוקרות מהטלפון. אורחים יכולים לקבל גישה זמנית כשצריך, ולעובדים יש הרשאות קבועות לתפעול היומיומי.",
      value: "חוויית הגעה טובה יותר לאורח, פחות חיכוך תפעולי, גישת חניה מסודרת יותר ופחות תלות בהתערבות ידנית.",
      buyer: "מלונות בוטיק, ריזורטים, דירות שירות ומפעילי אירוח עם כניסה מגודרת או חניה.",
      demo: "הראו זרימת הגעה של אורח לחניה או לכניסה, ואז זרימת גישה קבועה של עובד.",
    },
    vacationRentals: {
      pitch: "WiFiGate מוריד חיכוך מצ'ק-אין בדירות נופש על ידי דרך פשוטה ובטוחה לשתף גישת שער מהטלפון.",
      problem: "מארחים מאבדים זמן על הגעות מאוחרות, מפתחות, שלטים, קודים שהועתקו ובלבול של אורחים ליד השער או בכניסה לחניה.",
      solution: "המארח שולח גישת אורח זמנית, עם אפשרות להגבלה לחלון זמן או לטלפון מסוים. האורח יכול לקבל פרטי הגעה ברורים כמו דירה, קומה, חניה והערות, והגישה פגה אוטומטית.",
      value: "צ'ק-אין חלק יותר, פחות שיחות תמיכה, פחות תלות באמצעי גישה פיזיים ויותר שליטה למארח או למפעיל.",
      buyer: "מארחי Airbnb, מנהלי השכרות לטווח קצר, מפעילי נכסי נופש וצוותי דירות שירות.",
      demo: "הראו את כל הזרימה ממארח לאורח: יצירת הזמנה, הגדרת חלון זמן, שליחת קישור ופתיחת השער בעת ההגעה.",
    },
  },
  es: {
    electricGates: {
      pitch: "WiFiGate convierte los portones electricos en una experiencia de acceso simple desde el telefono para propietarios, residentes, invitados y equipos de gestion.",
      problem: "Los portones electricos suelen controlarse con controles remotos, teclados o llamadas, lo que genera friccion, dispositivos perdidos, accesos copiados y demasiada coordinacion manual.",
      solution: "En lugar de depender de controles fisicos, el porton puede abrirse desde el telefono. Los propietarios y administradores pueden compartir acceso temporal o permanente, y los usuarios frecuentes obtienen una experiencia diaria mas fluida con widgets y apertura automatica.",
      value: "Menos dependencia de controles remotos, mejor gestion de invitados, entrada mas rapida y una experiencia de acceso mas moderna.",
      buyer: "Propietarios de viviendas, administradores de edificios, comunidades cerradas e instaladores que modernizan sistemas antiguos.",
      demo: "Muestra a un propietario abriendo el porton y luego enviando acceso temporal a otro telefono.",
    },
    entranceDoors: {
      pitch: "WiFiGate da a las puertas de entrada el mismo flujo de acceso inteligente, compartible y facil de gestionar que la gente ya espera de las aplicaciones modernas.",
      problem: "Las puertas de entrada en propiedades compartidas generan pequenas fricciones constantes: dejar entrar a invitados, personal de limpieza, empleados, residentes o repartidores sin entregar llaves o codigos de forma demasiado amplia.",
      solution: "El administrador o propietario puede definir quien recibe acceso, por cuanto tiempo y con que nivel. Los residentes disfrutan de un flujo diario limpio, mientras que invitados o proveedores reciben acceso temporal desde el telefono.",
      value: "Mejor control, menos llaves, menos interrupciones para el personal o los residentes y una llegada mas profesional.",
      buyer: "Edificios residenciales, oficinas, clinicas, hoteles y propiedades de uso mixto.",
      demo: "Muestra a un residente con acceso permanente y a un invitado con acceso limitado en el tiempo para la misma entrada.",
    },
    magneticLocks: {
      pitch: "WiFiGate hace que el acceso con cerraduras magneticas sea mas facil de gestionar, especialmente donde hay muchas visitas cortas o entradas controladas cada dia.",
      problem: "Las cerraduras magneticas son eficaces, pero la capa de gestion a su alrededor suele ser debil: demasiados codigos compartidos, demasiada dependencia de recepcion y poca flexibilidad para el acceso temporal.",
      solution: "En lugar de un metodo estatico para todos, el acceso puede organizarse por rol. Administradores, usuarios e invitados reciben el nivel correcto de control, y el acceso temporal puede compartirse y expirar automaticamente.",
      value: "Control mas estricto, administracion mas simple y mejor equilibrio entre seguridad y comodidad.",
      buyer: "Oficinas, clinicas, escuelas, puertas internas de instalaciones y espacios de servicios.",
      demo: "Muestra a un administrador compartiendo acceso de corto plazo con un proveedor y luego explica como expira sin seguimiento manual.",
    },
    barrierGates: {
      pitch: "WiFiGate ayuda a que las barreras funcionen mejor para acceso vehicular, llegada de invitados y usuarios recurrentes sin coordinacion manual alrededor del porton.",
      problem: "Las barreras crean friccion diaria con estacionamiento, visitantes, entregas y acceso del personal. Siempre alguien termina llamando, esperando o dependiendo de un control remoto compartido.",
      solution: "Los conductores o usuarios autorizados pueden abrir la barrera desde el telefono. Los equipos de la propiedad pueden compartir acceso para visitantes y dar a los usuarios recurrentes una experiencia mas fluida con widgets y apertura automatica.",
      value: "Entrada vehicular mas rapida, menos demoras, mejor gestion de invitados y menos ruido operativo alrededor del estacionamiento.",
      buyer: "Estacionamientos residenciales, estacionamientos de oficinas, hoteles, comunidades cerradas y administradores de propiedades.",
      demo: "Muestra a un visitante llegando con acceso temporal y a un residente usando un flujo mas rapido para el acceso repetido.",
    },
    privateHomes: {
      pitch: "WiFiGate ofrece a los propietarios una forma mas inteligente y flexible de gestionar el acceso a portones y entradas para familia, invitados y proveedores de servicios.",
      problem: "Las viviendas privadas todavia dependen mucho de llaves, controles remotos o coordinacion improvisada, especialmente cuando invitados, personal de limpieza, nineras o repartidores necesitan entrar.",
      solution: "El propietario puede abrir desde el telefono, compartir acceso temporal cuando hace falta y evitar entregar dispositivos permanentes para visitas cortas. La casa es mas facil de gestionar sin ser menos segura.",
      value: "Mas comodidad, mas control, menos controles perdidos y menos necesidad de coordinar la entrada manualmente.",
      buyer: "Propietarios con portones electricos, villas, complejos privados y hogares que valoran mucho la comodidad.",
      demo: "Muestra a un propietario enviando un enlace de acceso temporal a una persona de limpieza o a un invitado para una franja horaria limitada.",
    },
    residentialComplexes: {
      pitch: "WiFiGate aporta estructura, comodidad y acceso controlado para invitados en complejos residenciales con varios residentes y puntos de entrada compartidos.",
      problem: "Los complejos residenciales tienen muchas piezas en movimiento: residentes, visitantes, estacionamiento, mantenimiento y varias puertas o portones. Los sistemas tradicionales de acceso se vuelven desordenados muy rapido.",
      solution: "Los administradores pueden gestionar distintos niveles de acceso, los residentes usan la app para entrar cada dia, los invitados reciben acceso temporal y varios portones pueden organizarse en un solo lugar.",
      value: "Operaciones mas limpias, mejor experiencia para residentes, menos dispositivos fisicos y una gestion de acceso mas escalable.",
      buyer: "Comites de edificios, operadores residenciales, comunidades cerradas y empresas de administracion.",
      demo: "Muestra varios portones en un solo telefono y luego compara un flujo de residente con un flujo de invitado.",
    },
    officeBuildings: {
      pitch: "WiFiGate ayuda a los edificios de oficinas a modernizar la entrada para empleados, visitantes y equipos operativos sin depender de traspasos de acceso torpes.",
      problem: "Las oficinas necesitan acceso controlado para personal y visitantes, pero tambien rapidez y profesionalismo. Las recepciones y los equipos de instalaciones suelen cargar con demasiada parte del trabajo.",
      solution: "Los empleados pueden tener acceso recurrente, los visitantes pueden recibir permisos temporales y los administradores de instalaciones pueden gestionar el acceso de forma mas limpia desde el telefono.",
      value: "Una experiencia de visita mas fluida, menos coordinacion manual, mejor higiene de acceso y una imagen mas moderna para el edificio.",
      buyer: "Propietarios de oficinas, operadores de oficinas, facility managers e integradores que atienden sitios comerciales.",
      demo: "Muestra a un empleado usando acceso permanente y a un visitante recibiendo una invitacion temporal antes de llegar.",
    },
    industrialFacilities: {
      pitch: "WiFiGate da a las instalaciones industriales un control mas estricto de la entrada mientras reduce la friccion diaria alrededor del personal, proveedores y acceso vehicular.",
      problem: "Los sitios industriales necesitan entrada controlada por seguridad y operacion, pero a menudo dependen de demasiados dispositivos fisicos, aprobaciones manuales y soluciones improvisadas para proveedores o personal temporal.",
      solution: "Los administradores de la instalacion pueden gestionar quien recibe acceso, cuando lo recibe y si es temporal o recurrente. Barreras vehiculares, portones y accesos controlados pueden manejarse con la misma logica.",
      value: "Mejor control operativo, menos confusion en la entrada, gestion mas sencilla de proveedores y una postura de seguridad mas fuerte sin ralentizar la operacion.",
      buyer: "Operadores de almacenes, fabricas, sitios logisticos y administradores de instalaciones industriales.",
      demo: "Muestra un flujo de trabajador recurrente y un flujo de acceso temporal para proveedores con permisos basados en tiempo.",
    },
    sportsFacilities: {
      pitch: "WiFiGate ayuda a las instalaciones deportivas a gestionar el acceso de atletas, personal y visitantes de una manera rapida, controlada y facil de operar.",
      problem: "Las instalaciones deportivas manejan horarios cambiantes, grupos grandes, entrenadores, proveedores y trafico de eventos. El acceso puede volverse caotico cuando depende de supervision manual.",
      solution: "Los administradores pueden dar el acceso correcto a las personas correctas en la ventana de tiempo adecuada. El personal y los miembros diarios obtienen acceso fluido, mientras que los invitados o visitantes de eventos reciben permisos temporales.",
      value: "Menos presion sobre la recepcion, llegada mas rapida, mejor control en dias ocupados y una experiencia mas fluida para los miembros.",
      buyer: "Gimnasios, sitios de apoyo para estadios, clubes campestres, centros de entrenamiento y complejos deportivos comunitarios.",
      demo: "Muestra un flujo diario para un miembro o empleado y luego un flujo temporal para un invitado o un dia de evento.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate ayuda a las instituciones educativas a controlar el acceso de forma mas limpia para personal, estudiantes, padres y equipos de servicio.",
      problem: "Las escuelas y campus necesitan acceso seguro, pero tambien lidian con muchos grupos de usuarios, horarios cambiantes y necesidades temporales de acceso para visitantes y proveedores.",
      solution: "El acceso puede distribuirse por rol y duracion. El personal y los usuarios recurrentes aprobados reciben acceso continuo, mientras que padres, visitantes o contratistas pueden recibir permisos temporales cuando corresponde.",
      value: "Gestion de acceso mas segura, menos manejo manual del porton, mejor flujo de visitantes y un sistema operativo mas moderno.",
      buyer: "Escuelas privadas, campus, centros de capacitacion y operadores de sitios educativos.",
      demo: "Muestra un flujo de acceso para personal y un flujo temporal para visitantes, destacando control y simplicidad.",
    },
    hotels: {
      pitch: "WiFiGate mejora la llegada al hotel y el acceso en el sitio al dar a personal y huespedes una experiencia de entrada mas simple y coordinada.",
      problem: "Los hoteles gestionan a diario huespedes, personal, estacionamiento, proveedores y cambios de turno. La coordinacion de entradas y barreras puede crear demoras e implicar demasiado al personal.",
      solution: "Los equipos del hotel pueden gestionar desde el telefono el acceso a portones, barreras y puntos de entrada controlados. Los huespedes pueden recibir acceso temporal cuando hace falta, y el personal puede usar permisos recurrentes para la operacion diaria.",
      value: "Mejor experiencia de llegada para el huesped, menos friccion operativa, acceso al estacionamiento mas ordenado y menos dependencia de intervencion manual.",
      buyer: "Hoteles boutique, resorts, apartamentos con servicios y operadores de hospitalidad con entrada cerrada o estacionamiento.",
      demo: "Muestra un flujo de llegada de huesped para estacionamiento o entrada y luego un flujo recurrente para personal.",
    },
    vacationRentals: {
      pitch: "WiFiGate elimina la friccion del check-in en alquileres de corta estancia al dar a los anfitriones una forma segura y simple de compartir acceso al porton desde el telefono.",
      problem: "Los anfitriones pierden tiempo con llegadas tardias, llaves, controles remotos, codigos copiados y confusion de los huespedes en el porton o la entrada del estacionamiento.",
      solution: "El anfitrion envia acceso temporal al huesped, opcionalmente limitado a una ventana de tiempo o a un telefono especifico. El huesped puede recibir detalles claros de llegada como apartamento, piso, estacionamiento y comentarios, y el acceso expira automaticamente.",
      value: "Check-in mas fluido, menos llamadas de soporte, menos dependencia de dispositivos fisicos de acceso y mas control para el anfitrion o el operador.",
      buyer: "Anfitriones de Airbnb, gestores de alquileres de corta estancia, operadores de propiedades vacacionales y equipos de apartamentos con servicios.",
      demo: "Muestra todo el flujo del anfitrion al huesped: crear la invitacion, definir la ventana de tiempo, enviar el enlace y abrir el porton a la llegada.",
    },
  },
  pt: {
    electricGates: {
      pitch: "WiFiGate transforma portoes eletricos em uma experiencia simples de acesso pelo telefone para proprietarios, moradores, visitantes e equipes de gestao.",
      problem: "Portoes eletricos costumam ser controlados por controles remotos, teclados ou chamadas, o que gera atrito, dispositivos perdidos, acessos copiados e coordenacao manual demais.",
      solution: "Em vez de depender de controles fisicos, o portao pode ser aberto pelo telefone. Proprietarios e administradores podem compartilhar acesso temporario ou permanente, e usuarios frequentes ganham uma experiencia diaria mais fluida com widgets e abertura automatica.",
      value: "Menos dependencia de controles remotos, melhor gestao de visitantes, entrada mais rapida e uma experiencia de acesso mais moderna.",
      buyer: "Proprietarios de casas, gestores de edificios, condominios fechados e instaladores que modernizam sistemas antigos.",
      demo: "Mostre um proprietario abrindo o portao e depois enviando acesso temporario para outro telefone.",
    },
    entranceDoors: {
      pitch: "WiFiGate leva para portas de entrada o mesmo fluxo de acesso inteligente, compartilhavel e facil de gerenciar que as pessoas ja esperam de apps modernos.",
      problem: "Portas de entrada em propriedades compartilhadas criam pequenos atritos constantes: deixar entrar visitantes, equipe de limpeza, funcionarios, moradores ou entregadores sem distribuir chaves ou codigos de forma ampla demais.",
      solution: "O administrador ou proprietario pode definir quem recebe acesso, por quanto tempo e com qual nivel. Moradores ganham um fluxo diario limpo, enquanto visitantes ou prestadores de servico recebem acesso temporario pelo telefone.",
      value: "Mais controle, menos chaves, menos interrupcoes para a equipe ou os moradores e uma chegada mais profissional.",
      buyer: "Edificios residenciais, escritorios, clinicas, hoteis e propriedades de uso misto.",
      demo: "Mostre um morador com acesso permanente e um visitante com acesso limitado no tempo para a mesma entrada.",
    },
    magneticLocks: {
      pitch: "WiFiGate facilita a gestao de acesso com fechaduras magneticas, especialmente onde acontecem muitas visitas curtas ou entradas controladas todos os dias.",
      problem: "Fechaduras magneticas sao eficazes, mas a camada de gestao ao redor delas costuma ser fraca: codigos compartilhados demais, dependencia excessiva da recepcao e pouca flexibilidade para acesso temporario.",
      solution: "Em vez de um metodo estatico para todos, o acesso pode ser organizado por funcao. Administradores, usuarios e visitantes recebem o nivel certo de controle, e o acesso temporario pode ser compartilhado e expirar automaticamente.",
      value: "Controle mais rigoroso, administracao mais simples e melhor equilibrio entre seguranca e conveniencia.",
      buyer: "Escritorios, clinicas, escolas, portas internas de instalacoes e espacos de apoio.",
      demo: "Mostre um administrador compartilhando acesso de curto prazo com um prestador de servico e depois explique como ele expira sem acompanhamento manual.",
    },
    barrierGates: {
      pitch: "WiFiGate faz barreiras funcionarem melhor para acesso de veiculos, chegada de visitantes e usuarios recorrentes sem coordenacao manual no portao.",
      problem: "Barreiras criam atrito diario em estacionamento, visitantes, entregas e acesso da equipe. Sempre alguem acaba precisando ligar, esperar ou depender de um controle remoto compartilhado.",
      solution: "Motoristas ou usuarios autorizados podem abrir a barreira pelo telefone. Equipes da propriedade podem compartilhar acesso para visitantes e dar aos usuarios recorrentes uma experiencia mais fluida com widgets e abertura automatica.",
      value: "Entrada de veiculos mais rapida, menos atrasos, melhor atendimento aos visitantes e menos ruido operacional em torno do estacionamento.",
      buyer: "Estacionamentos residenciais, estacionamentos de escritorios, hoteis, condominios fechados e administradores de propriedades.",
      demo: "Mostre um visitante chegando com acesso temporario e um morador usando um fluxo mais rapido para acesso repetido.",
    },
    privateHomes: {
      pitch: "WiFiGate oferece aos proprietarios uma forma mais inteligente e flexivel de gerenciar o acesso ao portao e a entrada para familia, visitantes e prestadores de servico.",
      problem: "Casas particulares ainda dependem muito de chaves, controles remotos ou coordenacao improvisada, especialmente quando visitantes, equipe de limpeza, babas ou entregadores precisam entrar.",
      solution: "O proprietario pode abrir pelo telefone, compartilhar acesso temporario quando necessario e evitar entregar dispositivos permanentes para visitas curtas. A casa fica mais facil de gerenciar sem ficar menos segura.",
      value: "Mais conveniencia, mais controle, menos controles perdidos e menos necessidade de coordenacao manual na entrada.",
      buyer: "Proprietarios com portoes eletricos, vilas, condominios privados e casas com alta demanda por conveniencia.",
      demo: "Mostre um proprietario enviando um link de acesso temporario para uma pessoa da limpeza ou um visitante dentro de uma janela de tempo limitada.",
    },
    residentialComplexes: {
      pitch: "WiFiGate traz estrutura, conveniencia e acesso controlado para visitantes em complexos residenciais com varios moradores e pontos de entrada compartilhados.",
      problem: "Complexos residenciais tem muitas partes em movimento: moradores, visitantes, estacionamento, manutencao e varios portoes ou portas. Sistemas tradicionais de acesso ficam baguncados rapidamente.",
      solution: "Administradores podem gerenciar diferentes niveis de acesso, moradores usam o app para a entrada diaria, visitantes recebem acesso temporario e varios portoes podem ser organizados em um so lugar.",
      value: "Operacao mais organizada, melhor experiencia para moradores, menos dispositivos fisicos e uma gestao de acesso mais escalavel.",
      buyer: "Conselhos de condominio, operadores residenciais, condominios fechados e empresas de administracao.",
      demo: "Mostre varios portoes em um so telefone e depois compare o fluxo de um morador com o de um visitante.",
    },
    officeBuildings: {
      pitch: "WiFiGate ajuda edificios comerciais a modernizar a entrada para funcionarios, visitantes e equipes operacionais sem depender de repasses de acesso desajeitados.",
      problem: "Escritorios precisam de acesso controlado para equipe e visitantes, mas tambem precisam de rapidez e profissionalismo. Recepcoes e equipes de facilities acabam carregando trabalho demais.",
      solution: "Funcionarios podem ter acesso recorrente, visitantes podem receber permissoes temporarias e administradores de facilities podem gerenciar o acesso de forma mais limpa pelo telefone.",
      value: "Experiencia de visita mais fluida, menos coordenacao manual, melhor higiene de acesso e uma imagem mais moderna para o edificio.",
      buyer: "Proprietarios de escritorios, operadores de escritorios, gestores de facilities e integradores que atendem sites comerciais.",
      demo: "Mostre um funcionario usando acesso permanente e um visitante recebendo um convite temporario antes de chegar.",
    },
    industrialFacilities: {
      pitch: "WiFiGate oferece a instalacoes industriais um controle mais rigoroso da entrada enquanto reduz o atrito diario em torno de equipe, fornecedores e acesso de veiculos.",
      problem: "Sites industriais precisam de entrada controlada por motivos de seguranca e operacao, mas muitas vezes dependem de dispositivos fisicos demais, aprovacoes manuais e improvisos para fornecedores ou equipe temporaria.",
      solution: "Administradores da instalacao podem gerenciar quem recebe acesso, quando recebe e se ele e temporario ou recorrente. Barreiras, portoes e entradas controladas podem seguir a mesma logica.",
      value: "Melhor controle operacional, menos confusao no portao, tratamento mais facil para fornecedores e uma postura de seguranca mais forte sem desacelerar a operacao.",
      buyer: "Operadores de armazens, fabricas, sites logisticos e gestores de instalacoes industriais.",
      demo: "Mostre um fluxo de trabalhador recorrente e um fluxo de acesso temporario para fornecedor com permissoes baseadas em tempo.",
    },
    sportsFacilities: {
      pitch: "WiFiGate ajuda instalacoes esportivas a gerenciar o acesso de atletas, equipe e visitantes de um jeito rapido, controlado e facil de operar.",
      problem: "Instalacoes esportivas lidam com horarios variaveis, grupos grandes, treinadores, prestadores de servico e movimento de eventos. O acesso pode virar caos quando depende de supervisao manual.",
      solution: "Gestores podem dar o acesso certo para as pessoas certas no periodo certo. Equipe e membros diarios recebem acesso fluido, enquanto visitantes ou pessoas ligadas a eventos recebem permissoes temporarias.",
      value: "Menos pressao na recepcao, chegada mais rapida, melhor controle em dias cheios e uma experiencia mais suave para membros.",
      buyer: "Academias, sites de apoio a estadios, clubes, centros de treinamento e complexos esportivos comunitarios.",
      demo: "Mostre um fluxo diario para um membro ou funcionario e depois um fluxo temporario para um visitante ou dia de evento.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate ajuda instituicoes educacionais a controlar o acesso de forma mais limpa para equipe, alunos, pais e equipes de servico.",
      problem: "Escolas e campi precisam de acesso seguro, mas tambem lidam com muitos grupos de usuarios, horarios variaveis e necessidades temporarias de acesso para visitantes e fornecedores.",
      solution: "O acesso pode ser distribuido por funcao e duracao. Equipe e usuarios recorrentes aprovados recebem acesso continuo, enquanto pais, visitantes ou contratados podem receber permissoes temporarias quando necessario.",
      value: "Gestao de acesso mais segura, menos tratamento manual do portao, fluxo de visitantes mais organizado e um sistema operacional mais moderno.",
      buyer: "Escolas particulares, campi, centros de treinamento e operadores de sites educacionais.",
      demo: "Mostre um fluxo de acesso da equipe e um fluxo temporario para visitantes, destacando controle e simplicidade.",
    },
    hotels: {
      pitch: "WiFiGate melhora a chegada ao hotel e o acesso no local ao dar a equipe e hospedes uma experiencia de entrada mais simples e coordenada.",
      problem: "Hoteis gerenciam diariamente hospedes, equipe, estacionamento, prestadores de servico e trocas de turno. A coordenacao de entradas e barreiras pode criar atrasos e envolver a equipe alem do necessario.",
      solution: "As equipes do hotel podem gerenciar pelo telefone o acesso a portoes, barreiras e pontos de entrada controlados. Hospedes podem receber acesso temporario quando fizer sentido, e a equipe pode usar permissoes recorrentes para a operacao diaria.",
      value: "Melhor experiencia de chegada para o hospede, menos atrito operacional, acesso ao estacionamento mais organizado e menos dependencia de intervencao manual.",
      buyer: "Hoteis boutique, resorts, apartamentos com servicos e operadores de hospitalidade com entrada fechada ou estacionamento.",
      demo: "Mostre um fluxo de chegada do hospede para estacionamento ou entrada e depois um fluxo recorrente da equipe.",
    },
    vacationRentals: {
      pitch: "WiFiGate remove o atrito do check-in em locacoes de curta temporada ao dar aos anfitrioes uma forma segura e simples de compartilhar o acesso ao portao pelo telefone.",
      problem: "Anfitrioes perdem tempo com chegadas tardias, chaves, controles remotos, codigos copiados e confusao do hospede no portao ou na entrada do estacionamento.",
      solution: "O anfitriao envia acesso temporario ao hospede, opcionalmente limitado a uma janela de tempo ou a um telefone especifico. O hospede pode receber detalhes claros de chegada como apartamento, andar, estacionamento e comentarios, e o acesso expira automaticamente.",
      value: "Check-in mais fluido, menos chamadas de suporte, menos dependencia de dispositivos fisicos de acesso e mais controle para o anfitriao ou operador.",
      buyer: "Anfitrioes de Airbnb, gestores de locacoes de curta temporada, operadores de propriedades de ferias e equipes de apartamentos com servicos.",
      demo: "Mostre todo o fluxo do anfitriao para o hospede: criar o convite, definir a janela de tempo, enviar o link e abrir o portao na chegada.",
    },
  },
  pl: {
    electricGates: {
      pitch: "WiFiGate zamienia bramy elektryczne w proste, telefoniczne doswiadczenie dostepu dla wlascicieli, mieszkancow, gosci i zespolow zarzadzajacych.",
      problem: "Bramy elektryczne sa czesto obslugiwane pilotami, klawiaturami lub telefonami, co powoduje tarcie, zagubione urzadzenia, kopiowanie dostepu i zbyt duzo recznej koordynacji.",
      solution: "Zamiast polegac na fizycznych pilotach, brame mozna otworzyc z telefonu. Wlasciciele i administratorzy moga udostepniac dostep tymczasowy lub staly, a czesti uzytkownicy dostaja plynniejsze codzienne doswiadczenie dzieki widgetom i automatycznemu otwieraniu.",
      value: "Mniejsza zaleznosc od pilotow, lepsza obsluga gosci, szybszy wjazd i bardziej nowoczesne doswiadczenie dostepu.",
      buyer: "Wlasciciele domow, zarzadcy budynkow, osiedla zamkniete i instalatorzy modernizujacy starsze systemy.",
      demo: "Pokaz wlasciciela otwierajacego brame, a potem wysylajacego tymczasowy dostep na inny telefon.",
    },
    entranceDoors: {
      pitch: "WiFiGate daje drzwiom wejsciowym ten sam inteligentny, wspoldzielony i latwy do zarzadzania przeplyw dostepu, jakiego ludzie oczekuja od nowoczesnych aplikacji.",
      problem: "Drzwi wejsciowe we wspoldzielonych nieruchomosciach powoduja stale drobne tarcia: wpuszczanie gosci, sprzatajacych, pracownikow, mieszkancow lub kurierow bez zbyt szerokiego rozdawania kluczy i kodow.",
      solution: "Administrator lub wlasciciel moze ustalic, kto dostaje dostep, na jak dlugo i na jakim poziomie. Mieszkancy maja czysty codzienny przeplyw, a goscie lub uslugodawcy dostaja dostep tymczasowy przez telefon.",
      value: "Lepsza kontrola, mniej kluczy, mniej przerw dla personelu lub mieszkancow i bardziej profesjonalne przyjazdy.",
      buyer: "Budynki mieszkalne, biura, kliniki, hotele i obiekty mieszane.",
      demo: "Pokaz mieszkanca ze stalym dostepem i goscia z dostepem ograniczonym czasowo do tego samego wejscia.",
    },
    magneticLocks: {
      pitch: "WiFiGate ulatwia zarzadzanie dostepem do zamkow magnetycznych, zwlaszcza tam, gdzie codziennie pojawia sie wiele krotkich wizyt lub kontrolowanych wejsc.",
      problem: "Zamki magnetyczne sa skuteczne, ale warstwa zarzadzania wokol nich bywa slaba: zbyt wiele wspolnych kodow, zbyt duza zaleznosc od recepcji i mala elastycznosc dla dostepu tymczasowego.",
      solution: "Zamiast jednej statycznej metody dla wszystkich, dostep moze byc oparty na rolach. Administratorzy, uzytkownicy i goscie dostaja odpowiedni poziom kontroli, a dostep tymczasowy moze wygasac automatycznie.",
      value: "Scislejsza kontrola, prostsza administracja i lepsza rownowaga miedzy bezpieczenstwem a wygoda.",
      buyer: "Biura, kliniki, szkoly, drzwi wewnetrzne w obiektach i strefy udogodnien.",
      demo: "Pokaz administratora udostepniajacego krotkoterminowy dostep uslugodawcy, a potem wyjasnij, jak wygasa on bez recznej obslugi.",
    },
    barrierGates: {
      pitch: "WiFiGate sprawia, ze szlabany lepiej obsluguja wjazd pojazdow, przyjazd gosci i uzytkownikow powracajacych bez recznej koordynacji przy bramie.",
      problem: "Szlabany tworza codzienne tarcia wokol parkingu, odwiedzajacych, dostaw i dostepu dla personelu. Zawsze ktos musi zadzwonic, czekac albo polegac na wspolnym pilocie.",
      solution: "Kierowcy lub upowaznieni uzytkownicy moga otworzyc szlaban z telefonu. Zespoly obiektu moga udostepniac dostep gosciom, a stali uzytkownicy dostaja plynniejszy przebieg dzieki widgetom i automatycznemu otwieraniu.",
      value: "Szybszy wjazd pojazdow, mniej opoznien, lepsza obsluga gosci i mniej operacyjnego zamieszania wokol parkingu.",
      buyer: "Parkingi osiedlowe, parkingi biurowe, hotele, osiedla zamkniete i zarzadcy nieruchomosci.",
      demo: "Pokaz goscia przyjezdzajacego z dostepem tymczasowym i mieszkanca korzystajacego z szybszego, powtarzalnego przeplywu wjazdu.",
    },
    privateHomes: {
      pitch: "WiFiGate daje wlascicielom domow sprytniejszy i bardziej elastyczny sposob zarzadzania dostepem do bramy i wejscia dla rodziny, gosci i uslugodawcow.",
      problem: "Domy prywatne nadal mocno polegaja na kluczach, pilotach lub improwizowanej koordynacji, zwlaszcza gdy dostepu potrzebuja goscie, sprzatajace, opiekunki lub kurierzy.",
      solution: "Wlasciciel domu moze otwierac z telefonu, udostepniac dostep tymczasowy, gdy jest potrzebny, i nie musi przekazywac stalych urzadzen na krotkie wizyty. Dom jest latwiejszy w obsludze bez utraty bezpieczenstwa.",
      value: "Wieksza wygoda, wieksza kontrola, mniej zagubionych pilotow i mniej recznej koordynacji przy wejsciu.",
      buyer: "Wlasciciele domow z bramami elektrycznymi, willi, prywatnych osiedli i gospodarstw nastawionych na wygode.",
      demo: "Pokaz wlasciciela wysylajacego tymczasowy link dostepu do osoby sprzatajacej albo goscia na ograniczone okno czasowe.",
    },
    residentialComplexes: {
      pitch: "WiFiGate wnosi porzadek, wygode i kontrolowany dostep dla gosci do kompleksow mieszkalnych z wieloma mieszkancami i wspolnymi punktami wejscia.",
      problem: "Kompleksy mieszkalne maja wiele ruchomych elementow: mieszkancow, odwiedzajacych, parking, utrzymanie i kilka bram lub drzwi. Tradycyjne systemy dostepu szybko robia sie chaotyczne.",
      solution: "Administratorzy moga zarzadzac roznymi poziomami dostepu, mieszkancy korzystaja z aplikacji przy codziennym wchodzeniu, goscie dostaja dostep tymczasowy, a wiele bram mozna uporzadkowac w jednym miejscu.",
      value: "Czystsze operacje, lepsze doswiadczenie mieszkancow, mniej fizycznych urzadzen i bardziej skalowalne zarzadzanie dostepem.",
      buyer: "Komitety budynkow, operatorzy mieszkaniowi, osiedla zamkniete i firmy zarzadzajace.",
      demo: "Pokaz kilka bram w jednym telefonie, a potem zestaw obok siebie przeplyw mieszkanca i przeplyw goscia.",
    },
    officeBuildings: {
      pitch: "WiFiGate pomaga biurowcom unowoczesnic wejscie dla pracownikow, odwiedzajacych i zespolow operacyjnych bez polegania na niewygodnym przekazywaniu dostepu.",
      problem: "Biura potrzebuja kontrolowanego dostepu dla personelu i gosci, ale rowniez szybkosci i profesjonalizmu. Recepcje i zespoly facility biora na siebie zbyt duzo pracy.",
      solution: "Pracownicy moga miec dostep powtarzalny, odwiedzajacy moga otrzymywac uprawnienia tymczasowe, a administratorzy obiektu moga czytelniej zarzadzac dostepem z telefonu.",
      value: "Plynniejsze wizyty, mniej recznej koordynacji, lepsza higiena dostepu i nowoczesniejszy wizerunek budynku.",
      buyer: "Wlasciciele biurowcow, operatorzy biur, facility managerowie i integratorzy obslugujacy obiekty komercyjne.",
      demo: "Pokaz pracownika korzystajacego ze stalego dostepu i goscia otrzymujacego tymczasowe zaproszenie przed przyjazdem.",
    },
    industrialFacilities: {
      pitch: "WiFiGate daje obiektom przemyslowym scislejsza kontrole wejscia, jednoczesnie ograniczajac codzienne tarcia wokol personelu, dostawcow i dostepu pojazdow.",
      problem: "Zaklady przemyslowe potrzebuja kontrolowanego wejscia dla bezpieczenstwa i operacji, ale dostep czesto opiera sie na zbyt wielu fizycznych urzadzeniach, recznych zgodach i obejsciach dla dostawcow lub personelu tymczasowego.",
      solution: "Administratorzy obiektu moga zarzadzac tym, kto dostaje dostep, kiedy go dostaje oraz czy jest on tymczasowy czy powtarzalny. Szlabany, bramy i kontrolowane wejscia moga dzialac wedlug tej samej logiki.",
      value: "Lepsza kontrola operacyjna, mniej zamieszania przy bramie, latwiejsza obsluga dostawcow i mocniejsza postawa bezpieczenstwa bez spowalniania pracy.",
      buyer: "Operatorzy magazynow, fabryk, obiektow logistycznych i zarzadcy obiektow przemyslowych.",
      demo: "Pokaz przeplyw stalego pracownika i przeplyw tymczasowego dostepu dla dostawcy z uprawnieniami opartymi na czasie.",
    },
    sportsFacilities: {
      pitch: "WiFiGate pomaga obiektom sportowym zarzadzac dostepem sportowcow, personelu i odwiedzajacych w sposob szybki, kontrolowany i latwy w obsludze.",
      problem: "Obiekty sportowe obsluguja zmienne harmonogramy, duze grupy, trenerow, uslugodawcow i ruch eventowy. Dostep moze stac sie chaotyczny, gdy zalezy od recznego nadzoru.",
      solution: "Zarzadzajacy moga dawac odpowiedni dostep odpowiednim osobom na odpowiednie okno czasowe. Personel i stali czlonkowie maja plynny dostep, a goscie lub osoby zwiazane z wydarzeniami otrzymuja uprawnienia tymczasowe.",
      value: "Mniejsza presja na recepcje, szybsze przyjazdy, lepsza kontrola w ruchliwe dni i plynniejsze doswiadczenie czlonkow.",
      buyer: "Silownie, zaplecze stadionowe, kluby, centra treningowe i osiedlowe kompleksy sportowe.",
      demo: "Pokaz codzienny przeplyw czlonka lub pracownika, a potem tymczasowy przeplyw goscia lub dnia wydarzenia.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate pomaga instytucjom edukacyjnym czytelniej kontrolowac dostep dla personelu, uczniow, rodzicow i zespolow serwisowych.",
      problem: "Szkoly i kampusy potrzebuja bezpiecznego dostepu, ale jednoczesnie obsluguja wiele grup uzytkownikow, zmienne harmonogramy i tymczasowe potrzeby dostepu dla gosci i dostawcow.",
      solution: "Dostep mozna przydzielac wedlug roli i czasu trwania. Personel i zatwierdzeni stali uzytkownicy otrzymuja dostep ciagly, a rodzice, goscie lub wykonawcy moga dostac uprawnienia tymczasowe, gdy jest to potrzebne.",
      value: "Bezpieczniejsze zarzadzanie dostepem, mniej recznej obslugi bramy, czystszy ruch odwiedzajacych i nowoczesniejszy system operacyjny.",
      buyer: "Szkoly prywatne, kampusy, centra szkoleniowe i operatorzy obiektow edukacyjnych.",
      demo: "Pokaz przeplyw dostepu dla pracownika i przeplyw czasowo ograniczony dla odwiedzajacego, podkreslajac kontrole i prostote.",
    },
    hotels: {
      pitch: "WiFiGate poprawia przyjazd do hotelu i dostep na miejscu, dajac personelowi i gosciom prostsze oraz lepiej skoordynowane doswiadczenie wejscia.",
      problem: "Hotele codziennie zarzadzaja goscmi, personelem, parkingiem, uslugodawcami i zmianami zmian. Koordynacja wejsc i szlabanow moze powodowac opoznienia i niepotrzebnie angazowac personel.",
      solution: "Zespoly hotelowe moga zarzadzac z telefonu dostepem do bram, szlabanow i kontrolowanych punktow wejscia. Goscie moga otrzymywac dostep tymczasowy, gdy ma to sens, a personel moze korzystac ze stalych uprawnien do codziennej pracy.",
      value: "Lepsze doswiadczenie przyjazdu dla goscia, mniej tarcia operacyjnego, bardziej uporzadkowany dostep do parkingu i mniejsza zaleznosc od recznej interwencji.",
      buyer: "Hotele butikowe, resorty, apartamenty serwisowane i operatorzy hotelarscy z ogrodzonym wjazdem lub parkingiem.",
      demo: "Pokaz przeplyw przyjazdu goscia na parking lub do wejscia, a potem powtarzalny przeplyw dostepu dla personelu.",
    },
    vacationRentals: {
      pitch: "WiFiGate usuwa tarcia przy check-inie w wynajmie krotkoterminowym, dajac gospodarzom bezpieczny i prosty sposob udostepniania dostepu do bramy z telefonu.",
      problem: "Gospodarze traca czas na pozne przyjazdy, klucze, piloty, skopiowane kody i dezorientacje gosci przy bramie lub wjezdzie na parking.",
      solution: "Gospodarz wysyla gosciowi dostep tymczasowy, opcjonalnie ograniczony do okna czasowego lub konkretnego telefonu. Gosc moze dostac jasne szczegoly przyjazdu, takie jak apartament, pietro, parking i komentarze, a dostep wygasa automatycznie.",
      value: "Plynniejszy check-in, mniej polaczen do wsparcia, mniejsza zaleznosc od fizycznych urzadzen dostepowych i wieksza kontrola dla gospodarza lub operatora.",
      buyer: "Gospodarze Airbnb, menedzerowie wynajmu krotkoterminowego, operatorzy nieruchomosci wakacyjnych i zespoly apartamentow serwisowanych.",
      demo: "Pokaz caly przeplyw od gospodarza do goscia: utworzenie zaproszenia, ustawienie okna czasowego, wyslanie linku i otwarcie bramy przy przyjezdzie.",
    },
  },
  ru: {
    electricGates: {
      pitch: "WiFiGate превращает электрические ворота в простой телефонный доступ для владельцев, жителей, гостей и управляющих команд.",
      problem: "Электрическими воротами часто управляют через пульты, клавиатуры или звонки, что создает лишнее трение, потерянные устройства, копирование доступа и слишком много ручной координации.",
      solution: "Вместо зависимости от физических пультов ворота можно открывать с телефона. Владельцы и администраторы могут делиться временным или постоянным доступом, а постоянные пользователи получают более плавный ежедневный опыт благодаря виджетам и автооткрытию.",
      value: "Меньше зависимости от пультов, более чистое управление гостями, более быстрый въезд и более современный опыт доступа.",
      buyer: "Владельцы домов, управляющие зданиями, закрытые сообщества и установщики, модернизирующие старые системы ворот.",
      demo: "Покажите, как владелец открывает ворота, а затем отправляет временный доступ на другой телефон.",
    },
    entranceDoors: {
      pitch: "WiFiGate дает входным дверям тот же умный, удобный для совместного использования и управляемый сценарий доступа, которого люди уже ждут от современных приложений.",
      problem: "Входные двери в общих объектах создают постоянные мелкие трения: как впустить гостей, уборку, сотрудников, жителей или курьеров, не раздавая ключи и коды слишком широко.",
      solution: "Администратор или владелец может определить, кто получает доступ, на какой срок и с каким уровнем прав. Жители получают чистый ежедневный поток, а гости или подрядчики могут получать временный доступ с телефона.",
      value: "Лучший контроль, меньше ключей, меньше отвлечений для персонала или жителей и более профессиональное впечатление при прибытии.",
      buyer: "Жилые здания, офисы, клиники, отели и объекты смешанного назначения.",
      demo: "Покажите жителя с постоянным доступом и гостя с доступом, ограниченным по времени, к одному и тому же входу.",
    },
    magneticLocks: {
      pitch: "WiFiGate упрощает управление доступом через магнитные замки, особенно там, где каждый день бывает много коротких визитов или контролируемых входов.",
      problem: "Магнитные замки эффективны, но слой управления вокруг них часто слабый: слишком много общих кодов, слишком сильная зависимость от ресепшн и малая гибкость для временного доступа.",
      solution: "Вместо одного статичного метода для всех доступ может распределяться по ролям. Администраторы, пользователи и гости получают подходящий уровень контроля, а временный доступ может выдаваться и автоматически истекать.",
      value: "Более жесткий контроль, более простое администрирование и лучший баланс между безопасностью и удобством.",
      buyer: "Офисы, клиники, школы, внутренние двери объектов и общие сервисные зоны.",
      demo: "Покажите, как администратор дает краткосрочный доступ подрядчику, а затем объясните, как он истекает без ручного сопровождения.",
    },
    barrierGates: {
      pitch: "WiFiGate помогает шлагбаумам лучше работать для въезда автомобилей, прибытия гостей и постоянных пользователей без ручной координации у ворот.",
      problem: "Шлагбаумы ежедневно создают трение вокруг парковки, посетителей, доставок и доступа сотрудников. Почти всегда кому-то приходится звонить, ждать или зависеть от общего пульта.",
      solution: "Водители или авторизованные пользователи могут открывать шлагбаум с телефона. Команды объекта могут делиться гостевым доступом с посетителями и давать постоянным пользователям более плавный сценарий через виджеты и автооткрытие.",
      value: "Более быстрый въезд, меньше задержек, лучшая работа с гостями и меньше операционного шума вокруг парковки.",
      buyer: "Жилые парковки, офисные парковки, отели, закрытые сообщества и управляющие недвижимостью.",
      demo: "Покажите посетителя с временным доступом и жителя, использующего более быстрый повторяющийся сценарий въезда.",
    },
    privateHomes: {
      pitch: "WiFiGate дает владельцам домов более умный и гибкий способ управлять доступом к воротам и входу для семьи, гостей и сервисных специалистов.",
      problem: "Частные дома все еще сильно зависят от ключей, пультов и импровизированной координации, особенно когда доступ нужен гостям, уборке, няням или курьерам.",
      solution: "Владелец дома может открывать с телефона, делиться временным доступом при необходимости и не передавать постоянные устройства для коротких визитов. Домом легче управлять, не снижая безопасность.",
      value: "Больше удобства, больше контроля, меньше потерянных пультов и меньше ручной координации на входе.",
      buyer: "Владельцы домов с электрическими воротами, вилл, частных комплексов и домов с высоким запросом на удобство.",
      demo: "Покажите, как владелец отправляет временную ссылку доступа уборщице или гостю на ограниченное окно времени.",
    },
    residentialComplexes: {
      pitch: "WiFiGate приносит порядок, удобство и контролируемый гостевой доступ в жилые комплексы с несколькими жителями и общими точками входа.",
      problem: "В жилых комплексах много движущихся частей: жители, посетители, парковка, обслуживание и несколько ворот или дверей. Традиционные системы доступа быстро становятся хаотичными.",
      solution: "Администраторы могут управлять разными уровнями доступа, жители используют приложение для ежедневного входа, гости получают временный доступ, а несколько ворот можно организовать в одном месте.",
      value: "Более чистые операции, лучший опыт жителей, меньше физических устройств и более масштабируемое управление доступом.",
      buyer: "Домовые комитеты, жилые операторы, закрытые сообщества и управляющие компании.",
      demo: "Покажите несколько ворот в одном телефоне, а затем рядом сравните сценарий жителя и сценарий гостя.",
    },
    officeBuildings: {
      pitch: "WiFiGate помогает офисным зданиям модернизировать вход для сотрудников, посетителей и операционных команд без неуклюжей передачи доступа.",
      problem: "Офисам нужен контролируемый доступ для сотрудников и посетителей, но им также нужны скорость и профессионализм. Ресепшн и команды facilities слишком часто берут на себя лишнюю нагрузку.",
      solution: "Сотрудники могут получать постоянный доступ, посетители - временные разрешения, а администраторы объекта могут чище управлять доступом с телефона.",
      value: "Более плавный опыт для посетителя, меньше ручной координации, более чистая гигиена доступа и более современный образ здания.",
      buyer: "Владельцы офисных объектов, офисные операторы, facility-менеджеры и интеграторы коммерческих объектов.",
      demo: "Покажите сотрудника с постоянным доступом и посетителя, получающего временное приглашение до прибытия.",
    },
    industrialFacilities: {
      pitch: "WiFiGate дает промышленным объектам более жесткий контроль входа, одновременно снижая ежедневное трение вокруг персонала, поставщиков и доступа транспорта.",
      problem: "Промышленные площадки нуждаются в контролируемом входе ради безопасности и операций, но доступ часто зависит от слишком большого числа физических устройств, ручных согласований и обходных решений для поставщиков или временного персонала.",
      solution: "Администраторы объекта могут управлять тем, кто получает доступ, когда он его получает и является ли он временным или постоянным. Шлагбаумы, ворота и контролируемые входы могут работать по одной логике.",
      value: "Лучший операционный контроль, меньше путаницы у ворот, более простая работа с поставщиками и более сильная позиция безопасности без замедления процессов.",
      buyer: "Операторы складов, заводов, логистических площадок и менеджеры промышленных объектов.",
      demo: "Покажите сценарий постоянного работника и сценарий временного доступа для поставщика с правами по времени.",
    },
    sportsFacilities: {
      pitch: "WiFiGate помогает спортивным объектам управлять доступом спортсменов, персонала и посетителей быстро, контролируемо и удобно в эксплуатации.",
      problem: "Спортивные объекты работают с меняющимися расписаниями, большими группами, тренерами, подрядчиками и потоком мероприятий. Доступ легко становится хаотичным, если он зависит от ручного надзора.",
      solution: "Управляющие могут давать нужный доступ нужным людям на нужное окно времени. Персонал и постоянные участники получают плавный ежедневный доступ, а гости или посетители событий получают временные разрешения.",
      value: "Меньше давления на ресепшн, более быстрое прибытие, лучший контроль в загруженные дни и более гладкий опыт для участников.",
      buyer: "Фитнес-клубы, стадионные вспомогательные площадки, клубы, тренировочные центры и общественные спортивные комплексы.",
      demo: "Покажите ежедневный сценарий для участника или сотрудника, а затем временный сценарий для гостя или дня мероприятия.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate помогает образовательным учреждениям чище контролировать доступ для сотрудников, студентов, родителей и сервисных команд.",
      problem: "Школам и кампусам нужен безопасный доступ, но они также работают со множеством групп пользователей, меняющимися расписаниями и временными потребностями доступа для посетителей и поставщиков.",
      solution: "Доступ можно распределять по роли и длительности. Сотрудники и одобренные постоянные пользователи получают непрерывный доступ, а родители, посетители или подрядчики могут получать временные разрешения по необходимости.",
      value: "Более безопасное управление доступом, меньше ручной работы у ворот, более чистый поток посетителей и более современная операционная система.",
      buyer: "Частные школы, кампусы, учебные центры и операторы образовательных площадок.",
      demo: "Покажите сценарий доступа сотрудника и ограниченный по времени сценарий посетителя, подчеркивая контроль и простоту.",
    },
    hotels: {
      pitch: "WiFiGate улучшает прибытие в отель и доступ на территории, давая сотрудникам и гостям более простой и согласованный опыт входа.",
      problem: "Отели ежедневно управляют гостями, персоналом, парковкой, подрядчиками и сменами. Координация въезда и шлагбаумов может создавать задержки и лишнее вовлечение персонала.",
      solution: "Команды отеля могут управлять доступом к воротам, шлагбаумам и контролируемым точкам входа с телефона. Гости могут получать временный доступ там, где это актуально, а сотрудники могут использовать постоянные разрешения для ежедневной работы.",
      value: "Лучший опыт прибытия для гостя, меньше операционного трения, более чистый доступ к парковке и меньшая зависимость от ручного вмешательства.",
      buyer: "Бутик-отели, курорты, сервисные апартаменты и гостиничные операторы с закрытым въездом или парковкой.",
      demo: "Покажите сценарий прибытия гостя на парковку или ко входу, а затем постоянный сценарий доступа сотрудника.",
    },
    vacationRentals: {
      pitch: "WiFiGate убирает трение при заселении в краткосрочную аренду, давая хозяевам безопасный и простой способ делиться доступом к воротам с телефона.",
      problem: "Хозяева теряют время на поздние прибытия, ключи, пульты, скопированные коды и путаницу гостей у ворот или на въезде на парковку.",
      solution: "Хозяин отправляет гостю временный доступ, при желании ограниченный временным окном или конкретным телефоном. Гость может получить понятные детали прибытия: апартамент, этаж, парковку и комментарии, а доступ истекает автоматически.",
      value: "Более плавное заселение, меньше звонков в поддержку, меньше зависимости от физических устройств доступа и больше контроля для хозяина или оператора.",
      buyer: "Хозяева Airbnb, менеджеры краткосрочной аренды, операторы курортной недвижимости и команды сервисных апартаментов.",
      demo: "Покажите полный сценарий от хозяина к гостю: создать приглашение, задать окно времени, отправить ссылку и открыть ворота при прибытии.",
    },
  },
  cs: {
    electricGates: {
      pitch: "WiFiGate meni elektricke brany na jednoduche telefonni ovladani pristupu pro majitele, obyvatele, hosty a spravce objektu.",
      problem: "Elektricke brany se casto ovladaji dalkovymi ovladaci, klavesnicemi nebo telefonaty, coz vytvari zbytecne treni, ztracena zarizeni, kopirovany pristup a prilis mnoho rucni koordinace.",
      solution: "Misto zavislosti na fyzickych ovladacich lze branu otevrit z telefonu. Majitele a administratori mohou sdilet docasny nebo trvaly pristup a cesti uzivatele ziskaji plynulejsi kazdodenni zkusenost diky widgetum a automatickemu otevreni.",
      value: "Mensi zavislost na ovladacich, lepsi sprava hostu, rychlejsi vjezd a modernejsi zazitek z pristupu.",
      buyer: "Majitele domu, spravci budov, uzavrene komunity a instalatori modernizujici starsi branove systemy.",
      demo: "Ukazte majitele, ktery otevre branu, a pak posle docasny pristup na jiny telefon.",
    },
    entranceDoors: {
      pitch: "WiFiGate dava vstupnim dverim stejny chytry, sdilitelny a snadno spravovatelny tok pristupu, jaky lide ocekavaji od modernich aplikaci.",
      problem: "Vstupni dvere ve sdilenych objektech vytvareji stale male treni: jak pustit hosty, uklid, zamestnance, obyvatele nebo kuryrni sluzby, aniz by se prilis siroce rozdavaly klice nebo kody.",
      solution: "Administrator nebo majitel muze urcit, kdo dostane pristup, na jak dlouho a s jakou urovni. Obyvatele ziskaji cisty denni tok, zatimco hoste nebo dodavatele sluzeb mohou dostat docasny pristup z telefonu.",
      value: "Lepsi kontrola, mene klicu, mene preruseni pro personal nebo obyvatele a profesionalnejsi prichod.",
      buyer: "Bytove budovy, kancelare, kliniky, hotely a objekty se smisenym vyuzitim.",
      demo: "Ukazte obyvatele s trvalym pristupem a hosta s casove omezenym pristupem ke stejnemu vstupu.",
    },
    magneticLocks: {
      pitch: "WiFiGate zjednodusuje spravu pristupu u magnetickych zamku, zejmena tam, kde je kazdy den mnoho kratkych navstev nebo kontrolovanych vstupu.",
      problem: "Magneticke zamky jsou ucinne, ale vrstva spravy kolem nich byva slaba: prilis mnoho sdilenych kodu, prilis velika zavislost na recepci a mala flexibilita pro docasny pristup.",
      solution: "Misto jednoho statickeho zpusobu pro vsechny muze byt pristup rizen podle role. Administratori, uzivatele a hoste dostanou spravnou uroven kontroly a docasny pristup lze sdilet i automaticky ukoncit.",
      value: "Prisnejsi kontrola, jednodussi sprava a lepsi rovnovaha mezi bezpecnosti a pohodlim.",
      buyer: "Kancelare, kliniky, skoly, vnitrni dvere v arealech a sdilene servisni prostory.",
      demo: "Ukazte administratora, ktery sdili kratkodoby pristup se servisnim dodavatelem, a pak vysvetlete, jak automaticky vyprsi bez rucniho dohledu.",
    },
    barrierGates: {
      pitch: "WiFiGate pomaha zavoram lepe fungovat pro vjezd vozidel, prichod hostu a opakovane uzivatele bez rucni koordinace u vjezdu.",
      problem: "Zavory kazdy den vytvareji treni kolem parkovani, navstev, dodavek a pristupu personalu. Vzdy nekdo musi volat, cekat nebo se spolehat na sdileny ovladac.",
      solution: "Ridici nebo opravneni uzivatele mohou zavoru otevrit z telefonu. Tymy objektu mohou sdilet pristup pro navstevy a dat stalym uzivatelum plynulejsi zazitek diky widgetum a automatickemu otevreni.",
      value: "Rychlejsi vjezd vozidel, mene zdrzeni, lepsi obsluha hostu a mene operacniho sumu kolem parkovani.",
      buyer: "Rezidencni parkoviste, kancelarska parkoviste, hotely, uzavrene komunity a spravci nemovitosti.",
      demo: "Ukazte navstevnika prijizdejiciho s docasnym pristupem a obyvatele pouzivajiciho rychlejsi opakovany prujezd.",
    },
    privateHomes: {
      pitch: "WiFiGate dava majitelum domu chytrejsi a flexibilnejsi zpusob, jak ridit pristup k brane a vstupu pro rodinu, hosty a dodavatele sluzeb.",
      problem: "Soukrome domy se stale silne spoléhaji na klice, dalkove ovladace nebo improvizovanou koordinaci, zejmena kdyz pristup potrebuji hoste, uklid, hlidani deti nebo kuryri.",
      solution: "Majitel domu muze otevirat z telefonu, sdilet docasny pristup podle potreby a vyhnout se predavani trvalych zarizeni pro kratke navstevy. Dum se spravuje snadneji bez ztraty bezpecnosti.",
      value: "Vice pohodli, vice kontroly, mene ztracenych ovladacu a mene rucni koordinace vstupu.",
      buyer: "Majitele domu s elektrickymi branami, vil, soukromych arealu a domacnosti s durazem na pohodli.",
      demo: "Ukazte majitele, ktery posila docasny pristupovy odkaz uklidove sluzbe nebo hostovi na omezeny casovy usek.",
    },
    residentialComplexes: {
      pitch: "WiFiGate prinasi poradek, pohodli a kontrolovany hostovsky pristup do rezidencnich komplexu s vice obyvateli a sdilenymi vstupnimi body.",
      problem: "Rezidencni komplexy maji mnoho pohyblivych casti: obyvatele, navstevy, parkovani, udrzbu a vice bran nebo dveri. Tradicni systemy pristupu se rychle stavaji neprehlednymi.",
      solution: "Administratori mohou ridit ruzne urovne pristupu, obyvatele pouzivaji aplikaci pro kazdodenni vstup, hoste dostavaji docasny pristup a vice bran lze usporadat na jednom miste.",
      value: "Cistsi provoz, lepsi zazitek obyvatel, mene fyzickych zarizeni a lepe skálovatelna sprava pristupu.",
      buyer: "Domovni vybory, rezidencni operatori, uzavrene komunity a spravcovske firmy.",
      demo: "Ukazte vice bran v jednom telefonu a potom vedle sebe porovnejte tok obyvatele a tok hosta.",
    },
    officeBuildings: {
      pitch: "WiFiGate pomaha kancelarskym budovam modernizovat vstup pro zamestnance, navstevy a provozni tymy bez neohrabaneho predavani pristupu.",
      problem: "Kancelare potrebuji kontrolovany pristup pro personal i navstevy, ale take rychlost a profesionalitu. Recepcni a facility tymy casto nesou prilis velkou cast zateze.",
      solution: "Zamestnanci mohou mit opakovany pristup, navstevy mohou dostavat docasna opravneni a spravci objektu mohou ridit pristup cisteji z telefonu.",
      value: "Plynulejsi navstevnicka zkusenost, mene rucni koordinace, lepsi hygiena pristupu a modernejsi obraz budovy.",
      buyer: "Majitele kancelarskych objektu, operatori kancelari, facility manageri a integratori pro komercni arealy.",
      demo: "Ukazte zamestnance s trvalym pristupem a navstevnika, ktery dostane docasnou pozvanku jeste pred prichodem.",
    },
    industrialFacilities: {
      pitch: "WiFiGate dava prumyslovym objektum prisnejsi kontrolu vstupu a zaroven omezuje kazdodenni treni kolem personalu, dodavatelu a pristupu vozidel.",
      problem: "Prumyslove arealy potrebuji kontrolovany vstup kvuli bezpecnosti a provozu, ale pristup casto zavisi na prilis mnoha fyzickych zarizenich, rucnich schvalenich a obchazkach pro dodavatele nebo docasny personal.",
      solution: "Spravci objektu mohou ridit, kdo dostane pristup, kdy ho dostane a zda je docasny nebo opakovany. Zavory, brany i kontrolovane vstupy mohou fungovat podle stejne logiky.",
      value: "Lepsi provozni kontrola, mene zmatku u brany, snazsi obsluha dodavatelu a silnejsi bezpecnostni postoj bez zpomaleni provozu.",
      buyer: "Provozovatele skladu, tovaren, logistickych arealu a spravci prumyslovych objektu.",
      demo: "Ukazte tok stalého pracovnika a tok docasneho pristupu pro dodavatele s opravnenim podle casu.",
    },
    sportsFacilities: {
      pitch: "WiFiGate pomaha sportovnim zarizenim ridit pristup sportovcu, personalu a navstevniku zpusobem, ktery je rychly, kontrolovany a snadno provozovatelny.",
      problem: "Sportovni arealy pracuji s menicimi se rozvrhy, velkymi skupinami, trenery, dodavateli sluzeb a provozem udalosti. Pristup se snadno stane chaotickym, pokud zavisi na rucnim dohledu.",
      solution: "Spravci mohou dat spravny pristup spravnym lidem ve spravnem casovem okne. Kazdodenni personal a clenove dostanou plynuly opakovany pristup, zatimco hoste nebo navstevnici akci dostanou docasna opravneni.",
      value: "Mensi tlak na recepci, rychlejsi prichod, lepsi kontrola ve vytizenych dnech a plynulejsi zkusenost pro cleny.",
      buyer: "Fitness centra, stadionove podpurne arealy, kluby, treninkova centra a komunitni sportovni komplexy.",
      demo: "Ukazte kazdodenni tok clena nebo zamestnance a potom docasny tok hosta nebo dne udalosti.",
    },
    educationalInstitutions: {
      pitch: "WiFiGate pomaha vzdelavacim institucim cisteji ridit pristup pro personal, studenty, rodice a servisni tymy.",
      problem: "Skoly a kampusy potrebuji bezpecny pristup, ale soucasne pracuji s mnoha skupinami uzivatelu, menicimi se rozvrhy a docasnymi potrebami pristupu pro navstevy a dodavatele.",
      solution: "Pristup lze rozdelovat podle role a delky. Personal a schvaleni opakovani uzivatele dostavaji prubezny pristup, zatimco rodice, navstevy nebo dodavatele mohou dostat docasna opravneni podle potreby.",
      value: "Bezpecnejsi sprava pristupu, mene rucni obsluhy u brany, cistsi tok navstevniku a modernejsi provozni system.",
      buyer: "Soukrome skoly, kampusy, skolici centra a provozovatele vzdelavacich arealu.",
      demo: "Ukazte tok pristupu pro clena personalu a casove omezeny tok navstevnika se zamerenim na kontrolu a jednoduchost.",
    },
    hotels: {
      pitch: "WiFiGate zlepsuje prichod do hotelu i pristup na miste tim, ze dava personalu a hostum jednodussi a lepe koordinovany vstup.",
      problem: "Hotely kazdy den spravuji hosty, personal, parkovani, dodavatele sluzeb i stridani smen. Koordinace vstupu a zavor muze vytvaret zdrzeni a zbytecne zatahovat personal.",
      solution: "Hotelove tymy mohou z telefonu ridit pristup k branam, zavoram a kontrolovanym vstupnim bodum. Hoste mohou dostat docasny pristup tam, kde to dava smysl, a personal muze pouzivat opakovane opravneni pro kazdodenni provoz.",
      value: "Lepsi zazitek hosta pri prichodu, mene provozniho treni, cistsi pristup k parkovani a mensi zavislost na rucnim zasahu.",
      buyer: "Boutique hotely, resorty, servisovane apartmany a hotelovi operatori s uzavrenym vjezdem nebo parkovanim.",
      demo: "Ukazte tok prichodu hosta na parkovani nebo ke vstupu a potom opakovany tok pristupu pro personal.",
    },
    vacationRentals: {
      pitch: "WiFiGate odstraňuje treni pri check-inu u kratkodobych pronajmu tim, ze hostitelum dava bezpecny a jednoduchy zpusob, jak sdilet pristup k brane z telefonu.",
      problem: "Hostitele ztraceji cas kvuli pozdnimu prijezdu, klicum, dalkovym ovladacum, zkopirovanym kodum a zmatku hostu u brany nebo vjezdu na parkoviste.",
      solution: "Hostitel posila hostovi docasny pristup, volitelne omezeny casovym oknem nebo konkretnim telefonem. Host muze dostat jasne informace o prijezdu, jako je apartman, patro, parkovani a poznamky, a pristup automaticky vyprsi.",
      value: "Plynulejsi check-in, mene podpornych hovoru, mensi zavislost na fyzickych pristupovych zarizenich a vice kontroly pro hostitele nebo operatora.",
      buyer: "Hostitele Airbnb, spravci kratkodobych pronajmu, operatori rekreacnich nemovitosti a tymy servisovanych apartmanu.",
      demo: "Ukazte cely tok od hostitele k hostovi: vytvoreni pozvanky, nastaveni casoveho okna, poslani odkazu a otevreni brany pri prijezdu.",
    },
  },
  ar: {
    electricGates: {
      pitch: "يحول WiFiGate البوابات الكهربائية الى تجربة وصول بسيطة عبر الهاتف للمالكين والسكان والضيوف وفرق الادارة.",
      problem: "غالبا ما تتم ادارة البوابات الكهربائية عبر الريموتات او لوحات الارقام او الاتصالات، وهذا يسبب احتكاكا يوميا واجهزة مفقودة ووصولا منسوخا وكثيرا من التنسيق اليدوي.",
      solution: "بدلا من الاعتماد على ريموتات مادية يمكن فتح البوابة من الهاتف. يستطيع المالك او المدير مشاركة وصول مؤقت او دائم، ويحصل المستخدمون المتكررون على تجربة يومية اسهل عبر الويدجت والفتح التلقائي.",
      value: "اعتماد اقل على الريموتات، ادارة انظف للضيوف، دخول اسرع وتجربة وصول اكثر حداثة.",
      buyer: "اصحاب المنازل، ومديرو المباني، والمجمعات المغلقة، والمثبتون الذين يطورون الانظمة القديمة.",
      demo: "اعرض مالكا يفتح البوابة ثم يرسل وصولا مؤقتا الى هاتف اخر.",
    },
    entranceDoors: {
      pitch: "يمنح WiFiGate ابواب الدخول نفس تدفق الوصول الذكي والقابل للمشاركة وسهل الادارة الذي يتوقعه الناس من التطبيقات الحديثة.",
      problem: "ابواب الدخول في العقارات المشتركة تخلق احتكاكات صغيرة ولكن مستمرة: ادخال الضيوف او عمال النظافة او الموظفين او السكان او عمال التوصيل من دون توزيع المفاتيح او الاكواد بشكل واسع جدا.",
      solution: "يمكن للمشرف او المالك تحديد من يحصل على الوصول ولمدة كم وباي مستوى. يحصل السكان على تدفق يومي نظيف، بينما يمكن للضيوف او مزودي الخدمة الحصول على وصول مؤقت من الهاتف.",
      value: "تحكم افضل، مفاتيح اقل، مقاطعات اقل للموظفين او السكان وتجربة وصول اكثر احترافية.",
      buyer: "المباني السكنية، والمكاتب، والعيادات، والفنادق، والعقارات متعددة الاستخدام.",
      demo: "اعرض مقيما لديه وصول دائم وضيفا لديه وصول محدد بزمن الى نفس المدخل.",
    },
    magneticLocks: {
      pitch: "يجعل WiFiGate ادارة الوصول عبر الاقفال المغناطيسية اسهل، خاصة في الاماكن التي تشهد زيارات قصيرة او دخولات مضبوطة كل يوم.",
      problem: "الاقفال المغناطيسية فعالة، لكن طبقة الادارة حولها تكون غالبا ضعيفة: اكواد مشتركة كثيرة، اعتماد كبير على الاستقبال ومرونة محدودة للوصول المؤقت.",
      solution: "بدلا من طريقة ثابتة واحدة للجميع يمكن توزيع الوصول حسب الدور. يحصل المدراء والمستخدمون والضيوف على مستوى التحكم المناسب، ويمكن مشاركة الوصول المؤقت وجعله ينتهي تلقائيا.",
      value: "تحكم اشد، ادارة ابسط وتوازن افضل بين الامان والراحة.",
      buyer: "المكاتب، والعيادات، والمدارس، والابواب الداخلية للمرافق، والمساحات الخدمية.",
      demo: "اعرض مديرا يشارك وصولا قصير المدى مع مزود خدمة، ثم اشرح كيف ينتهي من دون متابعة يدوية.",
    },
    barrierGates: {
      pitch: "يساعد WiFiGate الحواجز على العمل بشكل افضل لوصول المركبات ووصول الضيوف والمستخدمين المتكررين من دون تنسيق يدوي عند البوابة.",
      problem: "تخلق الحواجز احتكاكا يوميا حول المواقف والزوار والتوصيل ووصول الموظفين. دائما ينتهي الامر بشخص يحتاج الى الاتصال او الانتظار او الاعتماد على ريموت مشترك.",
      solution: "يمكن للسائقين او المستخدمين المصرح لهم فتح الحاجز من الهاتف. كما تستطيع فرق العقار مشاركة وصول للزوار ومنح المستخدمين المتكررين تجربة اكثر سلاسة عبر الويدجت والفتح التلقائي.",
      value: "دخول اسرع للمركبات، تاخيرات اقل، تعامل افضل مع الضيوف وضوضاء تشغيلية اقل حول المواقف.",
      buyer: "مواقف المجمعات السكنية، ومواقف المكاتب، والفنادق، والمجتمعات المغلقة، ومديرو العقارات.",
      demo: "اعرض زائرا يصل بوصول مؤقت ومقيما يستخدم تدفقا اسرع للوصول المتكرر.",
    },
    privateHomes: {
      pitch: "يمنح WiFiGate اصحاب المنازل طريقة اذكى واكثر مرونة لادارة الوصول الى البوابة والمدخل للعائلة والضيوف ومزودي الخدمة.",
      problem: "لا تزال المنازل الخاصة تعتمد كثيرا على المفاتيح او الريموتات او التنسيق المرتجل، خاصة عندما يحتاج الضيوف او عمال النظافة او المربيات او عمال التوصيل الى الدخول.",
      solution: "يمكن لصاحب المنزل الفتح من الهاتف ومشاركة وصول مؤقت عند الحاجة وتجنب تسليم اجهزة دائمة للزيارات القصيرة. يصبح المنزل اسهل في الادارة من دون ان يكون اقل امانا.",
      value: "راحة اكبر، تحكم اكبر، ريموتات مفقودة اقل وحاجة اقل للتنسيق اليدوي عند الدخول.",
      buyer: "اصحاب المنازل ذات البوابات الكهربائية، والفيلات، والمجمعات الخاصة، والمنازل التي تقدر الراحة العالية.",
      demo: "اعرض مالكا يرسل رابط وصول مؤقتا الى عاملة تنظيف او ضيف ضمن نافذة زمنية محددة.",
    },
    residentialComplexes: {
      pitch: "يجلب WiFiGate النظام والراحة ووصول الضيوف المنضبط الى المجمعات السكنية التي تضم عدة سكان ونقاط دخول مشتركة.",
      problem: "تحتوي المجمعات السكنية على اجزاء كثيرة متحركة: سكان، وزوار، ومواقف، وصيانة، وعدة بوابات او ابواب. انظمة الوصول التقليدية تصبح فوضوية بسرعة.",
      solution: "يمكن للمدراء ادارة مستويات وصول مختلفة، ويستخدم السكان التطبيق للدخول اليومي، ويحصل الضيوف على وصول مؤقت، ويمكن تنظيم عدة بوابات في مكان واحد.",
      value: "تشغيل انظف، تجربة افضل للسكان، اجهزة مادية اقل وادارة وصول اسهل في التوسع.",
      buyer: "لجان المباني، ومشغلو المجمعات السكنية، والمجتمعات المغلقة، وشركات الادارة.",
      demo: "اعرض عدة بوابات على هاتف واحد ثم اعرض تدفق المقيم وتدفق الضيف جنبا الى جنب.",
    },
    officeBuildings: {
      pitch: "يساعد WiFiGate مباني المكاتب على تحديث الدخول للموظفين والزوار وفرق التشغيل من دون الاعتماد على تسليمات وصول معقدة.",
      problem: "تحتاج المكاتب الى وصول مضبوط للموظفين والزوار، لكنها تحتاج ايضا الى السرعة والاحترافية. غالبا ما تتحمل الاستقبالات وفرق المرافق عبئا اكبر من اللازم.",
      solution: "يمكن للموظفين الحصول على وصول متكرر، ويمكن للزوار الحصول على صلاحيات مؤقتة، ويمكن لمديري المرافق ادارة الوصول بشكل انظف من الهاتف.",
      value: "تجربة زيارة اكثر سلاسة، تنسيق يدوي اقل، نظافة افضل للوصول وصورة اكثر حداثة للمبنى.",
      buyer: "مالكو المباني المكتبية، ومشغلو المكاتب، ومديرو المرافق، والمكاملون الذين يخدمون المواقع التجارية.",
      demo: "اعرض موظفا يستخدم وصولا دائما وزائرا يحصل على دعوة مؤقتة قبل الوصول.",
    },
    industrialFacilities: {
      pitch: "يمنح WiFiGate المرافق الصناعية تحكما اشد في الدخول مع تقليل الاحتكاك اليومي حول الموظفين والموردين ووصول المركبات.",
      problem: "تحتاج المواقع الصناعية الى دخول مضبوط من اجل السلامة والتشغيل، لكن الوصول يعتمد غالبا على اجهزة مادية كثيرة جدا وموافقات يدوية وحلول التفافية للموردين او العمال المؤقتين.",
      solution: "يمكن لمديري المرفق ادارة من يحصل على الوصول ومتى يحصل عليه وما اذا كان مؤقتا او متكررا. يمكن تشغيل الحواجز والبوابات ونقاط الدخول المضبوطة بالمنطق نفسه.",
      value: "تحكم تشغيلي افضل، ارتباك اقل عند البوابة، تعامل اسهل مع الموردين ووضع امني اقوى من دون ابطاء العمل.",
      buyer: "مشغلو المستودعات، والمصانع، والمواقع اللوجستية، ومديرو المرافق الصناعية.",
      demo: "اعرض تدفق عامل متكرر وتدفق وصول مؤقت لمورد مع صلاحيات مبنية على الوقت.",
    },
    sportsFacilities: {
      pitch: "يساعد WiFiGate المرافق الرياضية على ادارة وصول الرياضيين والموظفين والزوار بطريقة سريعة ومنضبطة وسهلة التشغيل.",
      problem: "تتعامل المرافق الرياضية مع جداول متغيرة ومجموعات كبيرة ومدربين ومزودي خدمة وحركة فعاليات. يمكن ان يصبح الوصول فوضويا عندما يعتمد على الاشراف اليدوي.",
      solution: "يستطيع المديرون منح الوصول المناسب للاشخاص المناسبين في النافذة الزمنية المناسبة. يحصل الموظفون والاعضاء الدائمون على وصول سلس، بينما يحصل الضيوف او زوار الفعاليات على صلاحيات مؤقتة.",
      value: "ضغط اقل على الاستقبال، وصول اسرع، تحكم افضل في الايام المزدحمة وتجربة اكثر سلاسة للاعضاء.",
      buyer: "النوادي الرياضية، ومرافق دعم الملاعب، والاندية، ومراكز التدريب، والمجمعات الرياضية المجتمعية.",
      demo: "اعرض تدفق وصول يومي لعضو او موظف، ثم تدفق وصول مؤقت لضيف او ليوم فعالية.",
    },
    educationalInstitutions: {
      pitch: "يساعد WiFiGate المؤسسات التعليمية على ضبط الوصول بشكل انظف للموظفين والطلاب والاهالي وفرق الخدمة.",
      problem: "تحتاج المدارس والحرم التعليمية الى وصول امن، لكنها تتعامل ايضا مع مجموعات مستخدمين كثيرة وجداول متغيرة واحتياجات وصول مؤقتة للزوار والموردين.",
      solution: "يمكن توزيع الوصول حسب الدور والمدة. يحصل الموظفون والمستخدمون المعتمدون المتكررون على وصول مستمر، بينما يمكن للوالدين او الزوار او المتعهدين الحصول على صلاحيات مؤقتة عند الحاجة.",
      value: "ادارة وصول اكثر امانا، تعامل يدوي اقل عند البوابة، تدفق زوار انظف ونظام تشغيلي اكثر حداثة.",
      buyer: "المدارس الخاصة، والحرم التعليمية، ومراكز التدريب، ومشغلو المواقع التعليمية.",
      demo: "اعرض تدفق وصول لموظف وتدفق زائر محدود بزمن مع التركيز على التحكم والبساطة.",
    },
    hotels: {
      pitch: "يحسن WiFiGate وصول الضيوف الى الفندق والوصول داخل الموقع عبر منح الموظفين والضيوف تجربة دخول ابسط واكثر تنسيقا.",
      problem: "تدير الفنادق يوميا الضيوف والموظفين والمواقف ومزودي الخدمة وتبديلات الورديات. يمكن ان يسبب تنسيق الدخول والحواجز تاخيرات وتدخلا زائدا من الموظفين.",
      solution: "يمكن لفرق الفندق ادارة الوصول الى البوابات والحواجز ونقاط الدخول المضبوطة من الهاتف. يمكن للضيوف الحصول على وصول مؤقت عند الحاجة، ويمكن للموظفين استخدام صلاحيات متكررة للتشغيل اليومي.",
      value: "تجربة وصول افضل للضيف، احتكاك تشغيلي اقل، وصول انظف للمواقف واعتماد اقل على التدخل اليدوي.",
      buyer: "الفنادق البوتيكية، والمنتجعات، والشقق المخدومة، ومشغلو الضيافة الذين لديهم دخول مغلق او مواقف.",
      demo: "اعرض تدفق وصول ضيف الى الموقف او المدخل، ثم اعرض تدفق وصول متكرر للموظف.",
    },
    vacationRentals: {
      pitch: "يزيل WiFiGate الاحتكاك من تسجيل الدخول في الايجارات القصيرة عبر منح المضيفين طريقة امنة وبسيطة لمشاركة الوصول الى البوابة من الهاتف.",
      problem: "يهدر المضيفون وقتا على الوصول المتاخر والمفاتيح والريموتات والاكواد المنسوخة وارتباك الضيوف عند البوابة او مدخل المواقف.",
      solution: "يرسل المضيف وصولا مؤقتا للضيف ويمكن تقييده بنافذة زمنية او بهاتف محدد. ويمكن للضيف استلام تفاصيل واضحة مثل الشقة والطابق والموقف والملاحظات، وينتهي الوصول تلقائيا.",
      value: "تسجيل دخول اكثر سلاسة، مكالمات دعم اقل، اعتماد اقل على ادوات الوصول المادية وتحكم اكبر للمضيف او المشغل.",
      buyer: "مضيفو Airbnb، ومديرو الايجارات القصيرة، ومشغلو العقارات السياحية، وفرق الشقق المخدومة.",
      demo: "اعرض التدفق الكامل من المضيف الى الضيف: انشاء الدعوة، تحديد نافذة الوقت، ارسال الرابط وفتح البوابة عند الوصول.",
    },
  },
};

var whereStoryState = {
  activeKey: null,
  initialized: false,
};

function getApplicationStoryTitle(storyKey, lang) {
  const bundle = typeof getTranslationBundle === "function" ? getTranslationBundle(lang) : null;
  const englishBundle =
    typeof translations !== "undefined" && translations.en ? translations.en : null;

  return (
    getNestedTranslation(bundle, `applications.${storyKey}`) ||
    getNestedTranslation(englishBundle, `applications.${storyKey}`) ||
    storyKey
  );
}

function getApplicationStoryUi(lang) {
  const resolvedLang =
    typeof getResolvedLanguage === "function" ? getResolvedLanguage(lang) : lang || "en";

  return APPLICATION_STORY_UI[resolvedLang] || APPLICATION_STORY_UI.en;
}

function getApplicationStoryContent(storyKey, lang) {
  const resolvedLang =
    typeof getResolvedLanguage === "function" ? getResolvedLanguage(lang) : lang || "en";
  const localStories = APPLICATION_STORIES[resolvedLang];

  return (localStories && localStories[storyKey]) || APPLICATION_STORIES.en[storyKey] || null;
}

function getApplicationStoryAnchorId(storyKey) {
  return `${APPLICATION_STORY_PREFIX}${APPLICATION_STORY_SLUGS[storyKey] || storyKey}`;
}

function getApplicationStoryKeyFromHash(hashValue) {
  const hash = (hashValue || "").replace(/^#/, "");
  if (!hash || !hash.startsWith(APPLICATION_STORY_PREFIX)) {
    return null;
  }

  return (
    Object.keys(APPLICATION_STORY_SLUGS).find(
      (storyKey) => getApplicationStoryAnchorId(storyKey) === hash
    ) || null
  );
}

function getApplicationStoryLink(storyKey) {
  if (!whereStoryState.links || !whereStoryState.links.length) {
    return null;
  }

  return whereStoryState.links.find((link) => link.dataset.storyKey === storyKey) || null;
}

function updateApplicationStoryLinkState(activeKey) {
  if (!whereStoryState.links || !whereStoryState.links.length) {
    return;
  }

  whereStoryState.links.forEach((link) => {
    const isActive = link.dataset.storyKey === activeKey;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-expanded", isActive ? "true" : "false");
  });
}

function updateApplicationStoryHash(nextHash) {
  try {
    if (history.pushState) {
      history.pushState(null, "", nextHash);
    } else {
      window.location.hash = nextHash;
    }
  } catch (error) {
    // Ignore history update failures.
  }
}

function hideApplicationStory(options = {}) {
  if (!whereStoryState.initialized || !whereStoryState.activeKey) {
    return;
  }

  const { focusTrigger = false, updateHash = false } = options;
  const activeLink = getApplicationStoryLink(whereStoryState.activeKey);

  whereStoryState.panel.hidden = true;
  whereStoryState.panel.removeAttribute("data-story-key");
  whereStoryState.card.id = APPLICATION_STORY_DEFAULT_CARD_ID;
  whereStoryState.card.removeAttribute("data-story-key");
  whereStoryState.activeKey = null;

  updateApplicationStoryLinkState(null);

  if (updateHash && getApplicationStoryKeyFromHash(window.location.hash)) {
    updateApplicationStoryHash("#where");
  }

  if (focusTrigger && activeLink) {
    try {
      activeLink.focus({ preventScroll: true });
    } catch (error) {
      activeLink.focus();
    }
  }
}

function renderApplicationStory(storyKey) {
  if (!whereStoryState.initialized || !storyKey) {
    return;
  }

  const lang = window.currentLanguage || document.documentElement.lang || "en";
  const ui = getApplicationStoryUi(lang);
  const story = getApplicationStoryContent(storyKey, lang);

  if (!story) {
    return;
  }

  whereStoryState.panel.hidden = false;
  whereStoryState.panel.setAttribute("data-story-key", storyKey);
  whereStoryState.card.id = getApplicationStoryAnchorId(storyKey);
  whereStoryState.card.setAttribute("data-story-key", storyKey);
  whereStoryState.eyebrow.textContent = ui.eyebrow;
  whereStoryState.title.textContent = getApplicationStoryTitle(storyKey, lang);
  whereStoryState.closeText.textContent = ui.close;
  whereStoryState.closeButton.setAttribute("aria-label", ui.closeAria);
  whereStoryState.pitch.textContent = story.pitch;
  whereStoryState.labels.problem.textContent = ui.problem;
  whereStoryState.labels.solution.textContent = ui.solution;
  whereStoryState.labels.value.textContent = ui.value;
  whereStoryState.labels.buyer.textContent = ui.buyer;
  whereStoryState.labels.demo.textContent = ui.demo;
  whereStoryState.fields.problem.textContent = story.problem;
  whereStoryState.fields.solution.textContent = story.solution;
  whereStoryState.fields.value.textContent = story.value;
  whereStoryState.fields.buyer.textContent = story.buyer;
  whereStoryState.fields.demo.textContent = story.demo;
  whereStoryState.activeKey = storyKey;

  updateApplicationStoryLinkState(storyKey);
}

function syncApplicationStoryFromHash() {
  const storyKey = getApplicationStoryKeyFromHash(window.location.hash);
  if (!storyKey) {
    if (whereStoryState.activeKey) {
      hideApplicationStory({ updateHash: false });
    }
    return;
  }

  renderApplicationStory(storyKey);
}

function setupApplicationStories() {
  if (whereStoryState.initialized) {
    return;
  }

  const root = document.getElementById("where");
  if (!root) {
    return;
  }

  const links = $$(".where-list__link[data-story-key]", root);
  const panel = $("#where-story-panel", root);
  const card = $("#where-story-card", root);
  const closeButton = $("#where-story-close", root);
  const closeText = $("#where-story-close-text", root);

  if (!links.length || !panel || !card || !closeButton || !closeText) {
    return;
  }

  whereStoryState.root = root;
  whereStoryState.links = links;
  whereStoryState.panel = panel;
  whereStoryState.card = card;
  whereStoryState.closeButton = closeButton;
  whereStoryState.closeText = closeText;
  whereStoryState.eyebrow = $("#where-story-eyebrow", root);
  whereStoryState.title = $("#where-story-title", root);
  whereStoryState.pitch = $("#where-story-pitch", root);
  whereStoryState.labels = {
    problem: $("#where-story-label-problem", root),
    solution: $("#where-story-label-solution", root),
    value: $("#where-story-label-value", root),
    buyer: $("#where-story-label-buyer", root),
    demo: $("#where-story-label-demo", root),
  };
  whereStoryState.fields = {
    problem: $("#where-story-problem", root),
    solution: $("#where-story-solution", root),
    value: $("#where-story-value", root),
    buyer: $("#where-story-buyer", root),
    demo: $("#where-story-demo", root),
  };
  whereStoryState.initialized = true;

  links.forEach((link) => {
    const storyKey = link.dataset.storyKey;
    if (!storyKey) {
      return;
    }

    link.setAttribute("href", `#${getApplicationStoryAnchorId(storyKey)}`);
    link.addEventListener("click", (event) => {
      if (whereStoryState.activeKey === storyKey && !whereStoryState.panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        hideApplicationStory({ updateHash: true });
        return;
      }

      renderApplicationStory(storyKey);
    });
  });

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    hideApplicationStory({ focusTrigger: true, updateHash: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && whereStoryState.activeKey) {
      hideApplicationStory({ focusTrigger: true, updateHash: true });
    }
  });

  document.addEventListener("site-language-change", () => {
    if (whereStoryState.activeKey) {
      renderApplicationStory(whereStoryState.activeKey);
    }
  });

  window.addEventListener("hashchange", syncApplicationStoryFromHash);
  window.addEventListener("popstate", syncApplicationStoryFromHash);

  syncApplicationStoryFromHash();
}

document.addEventListener("DOMContentLoaded", setupApplicationStories);
