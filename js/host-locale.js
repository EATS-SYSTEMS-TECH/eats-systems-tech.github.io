import { pageLanguage } from "./platform-model.js";
import { hostHebrew } from "./host-locale-he.js";
import { renderPlatformLanguage } from "./platform-language.js";

export const hostLanguage = pageLanguage();
export const hostLocale = hostLanguage === "he" ? "he-IL" : "en-US";
const hebrew = {
  "My profile": "הפרופיל שלי",
  Calendar: "לוח שנה",
  Staff: "איש צוות",
  Overview: "סקירה",
  "Jobs Calendar": "משימות",
  "Service health": "בריאות השירות",
  Support: "תמיכה",
  Settings: "הגדרות",
  Organizations: "ארגונים",
  "Team invitations": "הצטרפות לארגון",
  Organization: "ארגון",
  "Host navigation": "ניווט Host",
  "Dashboard sections": "מסכי הניהול",
  "Sign out": "יציאה",
  "Account and security": "חשבון ואבטחה",
  Name: "שם",
  Email: "אימייל",
  Role: "תפקיד",
  Access: "גישה",
  Authenticator: "מאמת",
  "Not enrolled": "לא נרשם מאמת",
  "Skip to workspace": "דילוג לסביבת העבודה",
  "Check again": "בדיקה חוזרת",
  Loading: "טוענים…",
  "Host admin": "אדמין Host",
  "Host user": "משתמש Host",
  owner: "בעלים",
  admin: "אדמין",
  staff: "איש צוות",
  viewer: "צופה",
  user: "משתמש",
  "Unknown role": "תפקיד לא ידוע",
  "Access needs review.": "נדרשת בדיקת הרשאה.",
  Owner: "בעלים",
  Admin: "מנהל",
  Viewer: "צופה",
  "Runs the WIFIGATE platform. Authenticator required.":
    "מנהל את פלטפורמת WIFIGATE. נדרשת אפליקציית אימות.",
  "Has a Host plan with My systems.": "יש לו מנוי Host עם המערכות שלי.",
  "You run the WIFIGATE platform. Authenticator required.":
    "אתם מנהלים את פלטפורמת WIFIGATE. נדרשת אפליקציית אימות.",
  "You have a Host plan with My systems.": "יש לכם מנוי Host עם המערכות שלי.",
  "Manages the organization, team, billing and connections, and everything else.":
    "מנהל את הארגון, הצוות, החיוב והחיבורים, ואת כל השאר.",
  "Manages systems, bookings, guest links, connections and activity.":
    "מנהל מערכות, הזמנות, קישורים לאורחים, חיבורים ופעילות.",
  "Manages bookings, guest links and daily activity.":
    "מנהל הזמנות, קישורים לאורחים ופעילות שוטפת.",
  "Views the calendar, bookings and systems without making changes.":
    "צופה בלוח השנה, בהזמנות ובמערכות, בלי לשנות דבר.",
  Active: "פעיל",
  Pending: "ממתין",
  Blocked: "חסום",
  Archived: "בארכיון",
  Unavailable: "לא זמין",
  active: "פעיל",
  "Calendar table": "טבלת לוח השנה",
  "Calendar range": "טווח לוח השנה",
  Previous: "הקודם",
  Today: "היום",
  Next: "הבא",
  Week: "שבוע",
  Month: "חודש",
  Search: "חיפוש",
  "Guest name": "שם האורח",
  "Create organization": "יצירת ארגון",
  "Organization name": "שם הארגון",
  "Organization settings": "הגדרות הארגון",
  "Save organization details": "שמירת פרטי הארגון",
  Team: "צוות",
  "Save changes": "שמירת שינויים",
  Remove: "הסרה",
  "Saving…": "שומרים…",
  Refresh: "רענון",
  Cancel: "ביטול",
  Close: "סגירה",
  "Load more": "טעינת עוד",
  "Search this directory": "חיפוש ברשימה",
  "Add admin": "הוספת אדמין",
  "Add user": "הוספת משתמש",
  Admins: "אדמינים",
  Users: "משתמשים",
  "Loading overview…": "טוענים סקירה…",
  "Manage Host access, people and organizations.":
    "ניהול הרשאות Host, אנשים וארגונים.",
  "Owner email": "אימייל הבעלים",
  "Time zone": "אזור זמן",
  "Invite member": "הזמנת חבר",
  "Person access": "הרשאות המשתמש",
  "Remove membership": "הסרת חברות",
  "Remove Host membership": "הסרת חברות ב־Host",
  "Confirm your identity with your authenticator…":
    "אמתו את זהותכם באמצעות המאמת…",
};

// Only explicitly marked interface copy is translated. User-entered names and
// API values remain unchanged; interpolation is assigned through textContent.
export function hostText(message, values = {}, language = hostLanguage) {
  const copy =
    language === "he"
      ? (hebrew[message] ?? hostHebrew[message] ?? message)
      : message;
  return copy.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

export function initializeHostLocale() {
  document.documentElement.lang = hostLanguage;
  document.documentElement.dir = hostLanguage === "he" ? "rtl" : "ltr";
  for (const element of document.querySelectorAll("[data-host-copy]"))
    element.textContent = hostText(element.dataset.hostCopy);
  for (const element of document.querySelectorAll("[data-host-label]"))
    element.setAttribute("aria-label", hostText(element.dataset.hostLabel));
  for (const link of document.querySelectorAll("a.brand")) {
    link.href =
      hostLanguage === "he" ? "/dashboard/host/?lang=he" : "/dashboard/host/";
    link.setAttribute(
      "aria-label",
      hostLanguage === "he"
        ? "דף הבית של WIFIGATE Host"
        : "WIFIGATE Host dashboard home",
    );
  }
  for (const link of document.querySelectorAll(".portal-legal a")) {
    if (hostLanguage === "he")
      link.setAttribute("href", "/he" + link.getAttribute("href"));
  }
}

// The shared flag menu keeps the current screen when switching language.
// The URL decides the language; nothing is stored.
export function installHostLanguageSelector() {
  renderPlatformLanguage(
    document.getElementById("host-language"),
    hostLanguage,
    hostText("Interface language"),
  );
}
