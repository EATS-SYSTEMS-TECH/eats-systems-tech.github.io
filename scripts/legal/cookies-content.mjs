// Cookie Policy — the single source for /cookies/ in every locale.
// English is the governing text; Hebrew mirrors it block for block.

export const cookies = {
  en: {
    metaTitle: "Cookie Policy | WIFIGATE",
    metaDescription:
      "The cookies and browser storage used on wifigate.io and the WIFIGATE web portal, including optional Google Analytics after consent.",
    eyebrow: "Legal",
    title: "Cookie Policy",
    subtitle:
      "This Cookie Policy explains which cookies and similar technologies are used on wifigate.io and in the WIFIGATE web portal, why, and how you can control them.",
    updated: "Effective date: October 5, 2026",
    owner: "Operator: EATS SYSTEMS TECH",
    sections: [
      {
        id: "summary",
        title: "1. Summary",
        blocks: [
          "The website uses essential browser storage for your language, accessibility and cookie choices. With your permission, it also uses Google Analytics to understand site usage and improve the website. Analytics does not load until you allow it. We do not use advertising cookies or tracking pixels. The web portal also stores a sign-in session while you use it.",
        ],
      },
      {
        id: "what",
        title: "2. What cookies and similar technologies are",
        blocks: [
          "Cookies are small text files that a website places in your browser. Similar technologies include the browser's local storage, session storage and IndexedDB, which let a website keep information on your device. In this policy, \"cookies\" refers to all of them.",
        ],
      },
      {
        id: "used",
        title: "3. What we use",
        blocks: [
          {
            table: {
              head: ["Name", "Type", "Purpose", "Duration"],
              rows: [
                ["language", "Local storage (first party)", "Remembers the website language you chose.", "Until you clear it"],
                ["wifigate-accessibility-settings-v1", "Local storage (first party)", "Remembers your accessibility settings, such as larger text or high contrast.", "Until you clear it"],
                ["wifigate-cookie-consent-v1", "Local storage (first party)", "Remembers your analytics choice.", "Up to 180 days"],
                ["_ga and _ga_*", "Analytics cookies (Google, only with consent)", "Measure visits and site usage.", "Up to 180 days"],
                ["Firebase Authentication session", "Session storage (first party, web portal only)", "Keeps you signed in to the web portal while the browser tab is open.", "Until you sign out or close the tab"],
                ["Firebase SDK data", "IndexedDB (first party, web portal only)", "Technical data the Firebase sign-in library needs in order to operate.", "Until you clear site data"],
              ],
            },
          },
          "The public pages set analytics cookies only after you allow them. Session storage and IndexedDB are used only on the portal sign-in and dashboard pages.",
        ],
      },
      {
        id: "third-party",
        title: "4. Third-party services",
        blocks: [
          "Fonts. The website serves its fonts from wifigate.io itself, so no request goes to a third-party font service.",
          "Google Analytics. After you allow analytics, Google's tag measures website visits and may receive technical data such as your IP address, device and page views. We do not enable advertising features for this website tag.",
          "Google and Apple sign-in. When you sign in to the web portal, Google's or Apple's sign-in window may set its own cookies on its own domain, under Google's or Apple's privacy policy.",
          "Links to other services. Links to WhatsApp, social networks, app stores and navigation services take you to sites with their own cookie policies.",
        ],
      },
      {
        id: "app",
        title: "5. The mobile app",
        blocks: [
          "The WIFIGATE app does not use cookies. It stores data on your phone and uses Google Firebase Analytics without advertising identifiers, as described in our Privacy Policy.",
        ],
      },
      {
        id: "control",
        title: "6. How to control cookies",
        blocks: [
          "You can change or withdraw your analytics choice at any time using Cookie settings in the footer. Withdrawal stops further analytics and removes Google Analytics cookies on this site. You can also view, delete or block site data in your browser settings. Clearing storage resets your site preferences. Blocking storage for the portal prevents you from staying signed in; signing out ends its session.",
        ],
      },
      {
        id: "changes",
        title: "7. Changes to this policy",
        blocks: [
          "If we add other optional cookies, we will update this policy and ask for consent before loading them. The effective date at the top shows the current version.",
        ],
      },
      {
        id: "contact",
        title: "8. Contact",
        blocks: [
          "EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions. Email: support@wifigate.io",
          "This policy is published in English and Hebrew and may be shown in English on pages in other languages. If versions differ, the English version prevails.",
          { link: { href: "../privacy-policy/", text: "Read our Privacy Policy" } },
          { link: { href: "../terms-and-conditions/", text: "Read our Terms & Conditions" } },
        ],
      },
    ],
  },

  he: {
    metaTitle: "מדיניות עוגיות | WIFIGATE",
    metaDescription:
      "העוגיות והאחסון בדפדפן באתר wifigate.io ובפורטל WIFIGATE, כולל Google Analytics רק לאחר הסכמה.",
    eyebrow: "משפטי",
    title: "מדיניות עוגיות",
    subtitle:
      "מדיניות עוגיות זו מסבירה באילו עוגיות וטכנולוגיות דומות נעשה שימוש באתר wifigate.io ובפורטל האינטרנט של WIFIGATE, לשם מה, וכיצד תוכלו לשלוט בהן.",
    updated: "תאריך תחילה: 5 באוקטובר 2026",
    owner: "המפעילה: EATS SYSTEMS TECH",
    sections: [
      {
        id: "summary",
        title: "1. בקצרה",
        blocks: [
          "האתר משתמש באחסון הכרחי לשמירת בחירות השפה, הנגישות והעוגיות שלכם. אם תאשרו, נשתמש גם ב־Google Analytics כדי להבין את השימוש באתר ולשפר אותו. המדידה אינה נטענת לפני אישור. איננו משתמשים בעוגיות פרסום או בפיקסלי מעקב. הפורטל שומר גם סשן כניסה בזמן השימוש בו.",
        ],
      },
      {
        id: "what",
        title: "2. מהן עוגיות וטכנולוגיות דומות",
        blocks: [
          "עוגיות הן קובצי טקסט קטנים שאתר שומר בדפדפן. טכנולוגיות דומות כוללות את האחסון המקומי, אחסון הסשן ו‑IndexedDB של הדפדפן, המאפשרים לאתר לשמור מידע במכשיר שלכם. במדיניות זו, \"עוגיות\" מתייחס לכולן.",
        ],
      },
      {
        id: "used",
        title: "3. במה אנחנו משתמשים",
        blocks: [
          {
            table: {
              head: ["שם", "סוג", "מטרה", "משך"],
              rows: [
                ["language", "אחסון מקומי (צד ראשון)", "זוכר את שפת האתר שבחרתם.", "עד שתמחקו אותו"],
                ["wifigate-accessibility-settings-v1", "אחסון מקומי (צד ראשון)", "זוכר את הגדרות הנגישות שלכם, כגון טקסט מוגדל או ניגודיות גבוהה.", "עד שתמחקו אותו"],
                ["wifigate-cookie-consent-v1", "אחסון מקומי (צד ראשון)", "זוכר את בחירתכם לגבי מדידה.", "עד 180 ימים"],
                ["_ga ו־_ga_*", "עוגיות מדידה (Google, רק בהסכמה)", "מדידת ביקורים ושימוש באתר.", "עד 180 ימים"],
                ["סשן Firebase Authentication", "אחסון סשן (צד ראשון, בפורטל בלבד)", "שומר על החיבור שלכם לפורטל כל עוד לשונית הדפדפן פתוחה.", "עד ההתנתקות או סגירת הלשונית"],
                ["נתוני Firebase SDK", "IndexedDB (צד ראשון, בפורטל בלבד)", "נתונים טכניים שספריית הכניסה של Firebase צריכה כדי לפעול.", "עד שתמחקו את נתוני האתר"],
              ],
            },
          },
          "הדפים הציבוריים שומרים עוגיות מדידה רק לאחר אישורכם. אחסון סשן ו־IndexedDB משמשים רק בדפי הכניסה ולוח הבקרה של הפורטל.",
        ],
      },
      {
        id: "third-party",
        title: "4. שירותי צד שלישי",
        blocks: [
          "גופנים. האתר מגיש את הגופנים שלו מ‑wifigate.io עצמו, כך שאין פנייה לשירות גופנים של צד שלישי.",
          "Google Analytics. לאחר אישור המדידה, התג של Google מודד ביקורים באתר ועשוי לקבל נתונים טכניים כגון כתובת IP, סוג מכשיר וצפיות בדפים. איננו מפעילים תכונות פרסום בתג האתר.",
          "כניסה באמצעות Google ו‑Apple. כשאתם נכנסים לפורטל, חלון הכניסה של Google או של Apple עשוי לשמור עוגיות משלו בדומיין שלו, בכפוף למדיניות הפרטיות של Google או של Apple.",
          "קישורים לשירותים אחרים. קישורים ל‑WhatsApp, לרשתות חברתיות, לחנויות אפליקציות ולשירותי ניווט מובילים לאתרים שלהם מדיניות עוגיות משלהם.",
        ],
      },
      {
        id: "app",
        title: "5. האפליקציה",
        blocks: [
          "אפליקציית WIFIGATE אינה משתמשת בעוגיות. היא שומרת מידע בטלפון שלכם ומשתמשת ב‑Google Firebase Analytics ללא מזהי פרסום, כמתואר במדיניות הפרטיות.",
        ],
      },
      {
        id: "control",
        title: "6. איך לשלוט בעוגיות",
        blocks: [
          "תוכלו לשנות או לבטל את הסכמתכם למדידה בכל עת דרך ״הגדרות עוגיות״ בתחתית האתר. ביטול ההסכמה מפסיק מדידה נוספת ומוחק את עוגיות Google Analytics באתר. תוכלו גם לצפות בנתוני האתר, למחוק או לחסום אותם בהגדרות הדפדפן. מחיקת האחסון תאפס את העדפותיכם; חסימת אחסון הפורטל תמנע הישארות מחוברים אליו.",
        ],
      },
      {
        id: "changes",
        title: "7. שינויים במדיניות",
        blocks: [
          "אם נוסיף עוגיות אופציונליות אחרות, נעדכן מדיניות זו ונבקש הסכמה לפני טעינתן. תאריך התחילה בראש הדף מציין את הגרסה הנוכחית.",
        ],
      },
      {
        id: "contact",
        title: "8. יצירת קשר",
        blocks: [
          "EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions. דוא\"ל: support@wifigate.io",
          "מדיניות זו מתפרסמת באנגלית ובעברית, ובדפים בשפות אחרות היא עשויה להופיע באנגלית. במקרה של סתירה בין הנוסחים, הנוסח האנגלי גובר.",
          { link: { href: "../privacy-policy/", text: "למדיניות הפרטיות" } },
          { link: { href: "../terms-and-conditions/", text: "לתנאי השימוש" } },
        ],
      },
    ],
  },
};
