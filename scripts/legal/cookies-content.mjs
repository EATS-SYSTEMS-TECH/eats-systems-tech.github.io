// Cookie Policy — the single source for /cookies/ in every locale.
// English is the governing text; Hebrew mirrors it block for block.

export const cookies = {
  en: {
    metaTitle: "Cookie Policy | WIFIGATE",
    metaDescription:
      "The cookies and browser storage used on wifigate.io and the WIFIGATE web portal: no advertising or analytics cookies, only language and accessibility preferences and a sign-in session.",
    eyebrow: "Legal",
    title: "Cookie Policy",
    subtitle:
      "This Cookie Policy explains which cookies and similar technologies are used on wifigate.io and in the WIFIGATE web portal, why, and how you can control them.",
    updated: "Effective date: October 4, 2026",
    owner: "Operator: EATS SYSTEMS TECH (Itay Nave – Engineering and Technology Solutions)",
    sections: [
      {
        id: "summary",
        title: "1. Summary",
        blocks: [
          "We do not use advertising cookies, tracking pixels or analytics cookies on our website. The website stores only the preferences you choose, such as language and accessibility settings, and the web portal stores a sign-in session while you use it. Because this storage is strictly necessary or is what you ask for, we do not show a cookie consent banner.",
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
                ["Firebase Authentication session", "Session storage (first party, web portal only)", "Keeps you signed in to the web portal while the browser tab is open.", "Until you sign out or close the tab"],
                ["Firebase SDK data", "IndexedDB (first party, web portal only)", "Technical data the Firebase sign-in library needs in order to operate.", "Until you clear site data"],
              ],
            },
          },
          "The public pages of the website set no cookies. Session storage and IndexedDB are used only on the portal sign-in and dashboard pages.",
        ],
      },
      {
        id: "third-party",
        title: "4. Third-party services",
        blocks: [
          "Fonts. The website serves its fonts from wifigate.io itself, so no request goes to a third-party font service.",
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
          "You can view and delete cookies and site data in your browser settings, and block them for wifigate.io. If you clear the website's storage, your language and accessibility preferences are reset. If you block storage for the portal, you will not be able to stay signed in. Signing out of the portal ends the sign-in session.",
        ],
      },
      {
        id: "changes",
        title: "7. Changes to this policy",
        blocks: [
          "If we start using other cookies, we will update this policy before doing so and, where the law requires it, ask for your consent first. The effective date at the top shows the current version.",
        ],
      },
      {
        id: "contact",
        title: "8. Contact",
        blocks: [
          "EATS SYSTEMS TECH, the trade name of Itay Nave – Engineering and Technology Solutions (D-U-N-S 626518977). Email: support@wifigate.io",
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
      "העוגיות והאחסון בדפדפן שבהם נעשה שימוש באתר wifigate.io ובפורטל האינטרנט של WIFIGATE: ללא עוגיות פרסום או ניתוח, רק העדפות שפה ונגישות וסשן כניסה.",
    eyebrow: "משפטי",
    title: "מדיניות עוגיות",
    subtitle:
      "מדיניות עוגיות זו מסבירה באילו עוגיות וטכנולוגיות דומות נעשה שימוש באתר wifigate.io ובפורטל האינטרנט של WIFIGATE, לשם מה, וכיצד תוכלו לשלוט בהן.",
    updated: "תאריך תחילה: 4 באוקטובר 2026",
    owner: "המפעילה: EATS SYSTEMS TECH (Itay Nave – Engineering and Technology Solutions)",
    sections: [
      {
        id: "summary",
        title: "1. בקצרה",
        blocks: [
          "איננו משתמשים באתר בעוגיות פרסום, בפיקסלי מעקב או בעוגיות ניתוח. האתר שומר רק את ההעדפות שבחרתם, כגון שפה והגדרות נגישות, ופורטל האינטרנט שומר סשן כניסה בזמן השימוש בו. מאחר שאחסון זה הכרחי או נעשה לבקשתכם, איננו מציגים באנר הסכמה לעוגיות.",
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
                ["סשן Firebase Authentication", "אחסון סשן (צד ראשון, בפורטל בלבד)", "שומר על החיבור שלכם לפורטל כל עוד לשונית הדפדפן פתוחה.", "עד ההתנתקות או סגירת הלשונית"],
                ["נתוני Firebase SDK", "IndexedDB (צד ראשון, בפורטל בלבד)", "נתונים טכניים שספריית הכניסה של Firebase צריכה כדי לפעול.", "עד שתמחקו את נתוני האתר"],
              ],
            },
          },
          "הדפים הציבוריים של האתר אינם שומרים עוגיות. אחסון סשן ו‑IndexedDB משמשים רק בדפי הכניסה ולוח הבקרה של הפורטל.",
        ],
      },
      {
        id: "third-party",
        title: "4. שירותי צד שלישי",
        blocks: [
          "גופנים. האתר מגיש את הגופנים שלו מ‑wifigate.io עצמו, כך שאין פנייה לשירות גופנים של צד שלישי.",
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
          "תוכלו לצפות בעוגיות ובנתוני האתר ולמחוק אותם בהגדרות הדפדפן, ולחסום אותם עבור wifigate.io. אם תמחקו את האחסון של האתר, העדפות השפה והנגישות שלכם יאופסו. אם תחסמו אחסון עבור הפורטל, לא תוכלו להישאר מחוברים. התנתקות מהפורטל מסיימת את סשן הכניסה.",
        ],
      },
      {
        id: "changes",
        title: "7. שינויים במדיניות",
        blocks: [
          "אם נתחיל להשתמש בעוגיות אחרות, נעדכן מדיניות זו לפני כן, וכאשר הדין מחייב זאת נבקש קודם את הסכמתכם. תאריך התחילה בראש הדף מציין את הגרסה הנוכחית.",
        ],
      },
      {
        id: "contact",
        title: "8. יצירת קשר",
        blocks: [
          "EATS SYSTEMS TECH, השם המסחרי של Itay Nave – Engineering and Technology Solutions (D-U-N-S 626518977). דוא\"ל: support@wifigate.io",
          "מדיניות זו מתפרסמת באנגלית ובעברית, ובדפים בשפות אחרות היא עשויה להופיע באנגלית. במקרה של סתירה בין הנוסחים, הנוסח האנגלי גובר.",
          { link: { href: "../privacy-policy/", text: "למדיניות הפרטיות" } },
          { link: { href: "../terms-and-conditions/", text: "לתנאי השימוש" } },
        ],
      },
    ],
  },
};
