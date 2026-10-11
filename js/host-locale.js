import { pageLanguage } from "./platform-model.js";
import { hostHebrew } from "./host-locale-he.js";

export const hostLanguage = pageLanguage();
export const hostLocale = hostLanguage === "he" ? "he-IL" : "en-US";
const hebrew = {
  Calendar: "לוח שנה",
  Properties: "נכסים",
  Reservations: "הזמנות",
  Guests: "אורחים",
  Staff: "צוות",
  Overview: "סקירה",
  "Access Keys": "מפתחות גישה",
  Automation: "אוטומציה",
  "Jobs Calendar": "משימות",
  Invoices: "חיוב",
  "Service health": "בריאות השירות",
  "API integrations": "אינטגרציות API",
  "System Import": "ייבוא מערכות",
  Support: "תמיכה",
  Settings: "הגדרות",
  Organizations: "ארגונים",
  Management: "ניהול",
  Billing: "חיוב",
  "Team invitations": "הזמנות לצוות",
  Organization: "ארגון",
  "No organization selected": "לא נבחר ארגון",
  "Choose an authorized organization first":
    "בחרו תחילה ארגון שיש לכם גישה אליו",
  "Unavailable for your current role": "הפעולה אינה זמינה לתפקידכם",
  "Account settings": "הגדרות החשבון",
  "Host navigation": "ניווט Host",
  "Dashboard sections": "מסכי הניהול",
  "Sign out": "יציאה",
  "Account and security": "חשבון ואבטחה",
  Name: "שם",
  Email: "אימייל",
  Role: "תפקיד",
  Access: "גישה",
  Authenticator: "מאמת",
  "MFA policy": "מדיניות אימות",
  "Not enrolled": "לא נרשם מאמת",
  "Enrolled - session verified": "מאמת רשום — הכניסה אומתה",
  "Enrolled - verification needed": "מאמת רשום — נדרש אימות",
  Required: "נדרש",
  Optional: "לבחירה",
  "Set up an authenticator (optional)": "הגדרת מאמת (לבחירה)",
  "Checking portal access": "בודקים את הרשאות הגישה",
  "Skip to workspace": "דילוג לסביבת העבודה",
  "Verifying your account...": "מאמתים את החשבון…",
  "Check again": "בדיקה חוזרת",
  Loading: "טוענים…",
  "Host admin": "אדמין Host",
  "Host user": "משתמש Host",
  owner: "בעלים",
  admin: "אדמין",
  staff: "צוות",
  viewer: "צופה",
  user: "משתמש",
  "Unknown role": "תפקיד לא ידוע",
  "Access needs review.": "נדרשת בדיקת הרשאה.",
  "Manages Host access and the administrator overview. Authenticator required.":
    "מנהל את הגישה ל־Host ואת מסך הסקירה. נדרש מאמת.",
  "Accesses only their organizations, according to their role in each one.":
    "נכנס רק לארגונים שבהם הוא חבר, בהתאם לתפקידו בכל ארגון.",
  "Manages organization settings, members, billing and API keys, plus all operations.":
    "מנהל את הגדרות הארגון, החברים, החיוב ומפתחות ה־API, וכל פעולות התפעול.",
  "Manages properties, rooms, gates, reservations, invitations and operations.":
    "מנהל נכסים, חדרים, שערים, הזמנות ותפעול.",
  "Manages reservations, guest invitations and day-to-day operations.":
    "מנהל הזמנות, הזמנות לאורחים ותפעול שוטף.",
  "Views the calendar, reservations and gates without making changes.":
    "צופה בלוח השנה, בהזמנות ובשערים, ללא אפשרות שינוי.",
  Active: "פעיל",
  Pending: "ממתין",
  Blocked: "חסום",
  Archived: "בארכיון",
  Unavailable: "לא זמין",
  active: "פעיל",
  pending: "ממתין",
  blocked: "חסום",
  archived: "בארכיון",
  "Reservation calendar": "לוח ההזמנות",
  "Calendar table": "טבלת לוח השנה",
  "Calendar range": "טווח לוח השנה",
  "Add Reservation": "הוספת הזמנה",
  "New reservation": "הזמנה חדשה",
  "Update calendar": "עדכון לוח השנה",
  Previous: "הקודם",
  Today: "היום",
  Next: "הבא",
  "1 Week": "שבוע",
  "2 Weeks": "שבועיים",
  "3 Weeks": "שלושה שבועות",
  "1 Month": "חודש",
  Week: "שבוע",
  "Two weeks": "שבועיים",
  "Three weeks": "שלושה שבועות",
  Month: "חודש",
  "Calendar view": "תצוגת לוח שנה",
  "Start date": "תאריך התחלה",
  "Search guest or reference": "חיפוש אורח או מספר הזמנה",
  "Reservation status": "מצב ההזמנה",
  "All states": "כל המצבים",
  "All properties": "כל הנכסים",
  "All rooms": "כל החדרים",
  Property: "נכס",
  Room: "חדר",
  "Property / Room": "נכס / חדר",
  Search: "חיפוש",
  "Edit reservation": "עריכת הזמנה",
  "Create reservation": "יצירת הזמנה",
  "Reservation details": "פרטי ההזמנה",
  "Guest name": "שם האורח",
  "Guest phone (E.164)": "טלפון אורח (כולל קידומת מדינה)",
  "Guest email (optional)": "אימייל האורח (לבחירה)",
  "Guest floor (optional)": "קומה (לבחירה)",
  "Guest apartment (optional)": "דירה (לבחירה)",
  "Guest parking (optional)": "חניה (לבחירה)",
  "Guest car number (optional)": "מספר רכב (לבחירה)",
  "Guest comment (optional)": "הערה לאורח (לבחירה)",
  "Reservation room": "חדר ההזמנה",
  "Access systems": "מערכות גישה",
  "Arrival ({zone})": "הגעה ({zone})",
  "Departure ({zone})": "עזיבה ({zone})",
  "Clock change occurrence": "שעה שחוזרת במעבר שעון",
  "Ask me if the time occurs twice": "בקשו ממני לבחור כשהשעה חוזרת",
  "Earlier occurrence": "המופע המוקדם",
  "Later occurrence": "המופע המאוחר",
  "Booking state": "מצב ההזמנה",
  "External reference (optional)": "מספר הזמנה חיצוני (לבחירה)",
  "Reservation note (optional)": "הערה להזמנה (לבחירה)",
  "Save reservation": "שמירת הזמנה",
  "Close reservation": "סגירת ההזמנה",
  "Saving reservation…": "שומרים את ההזמנה…",
  draft: "טיוטה",
  confirmed: "מאושרת",
  changed: "עודכנה",
  cancelled: "בוטלה",
  completed: "הסתיימה",
  "No reservations": "אין הזמנות",
  "Archived property": "נכס בארכיון",
  "Load more reservations": "טעינת הזמנות נוספות",
  "Loading reservations…": "טוענים הזמנות…",
  "Loading calendar…": "טוענים את לוח השנה…",
  "Loading guests…": "טוענים אורחים…",
  "This room is already reserved during that window.":
    "החדר כבר הוזמן בטווח השעות שנבחר.",
  "This reservation changed. Close this form and reload it before saving.":
    "ההזמנה השתנתה. סגרו את הטופס ופתחו אותה מחדש לפני שמירה.",
  "This state change is not allowed. Completed and cancelled reservations are final.":
    "לא ניתן לבצע את השינוי. הזמנה שהסתיימה או בוטלה היא סופית.",
  "That local time does not exist because of a clock change. Choose another time.":
    "השעה המקומית אינה קיימת עקב מעבר שעון. בחרו שעה אחרת.",
  "That local time occurs twice. Choose the earlier or later occurrence.":
    "השעה המקומית חוזרת פעמיים. בחרו את המופע המוקדם או המאוחר.",
  "Choose active access systems mapped to this room or property.":
    "בחרו מערכות גישה פעילות המשויכות לחדר או לנכס.",
  "Your organization access has changed. Refresh your account.":
    "הגישה לארגון השתנתה. רעננו את החשבון.",
  "Check the guest phone, time window and selected systems.":
    "בדקו את טלפון האורח, טווח השעות והמערכות שנבחרו.",
  "Too many requests. Wait a moment and retry with the same form.":
    "נשלחו יותר מדי בקשות. המתינו מעט ונסו שוב באותו טופס.",
  "The reservation could not be saved. You can retry safely.":
    "לא ניתן לשמור את ההזמנה. אפשר לנסות שוב בבטחה.",
  "The calendar could not be loaded. Update it to retry.":
    "לא ניתן לטעון את לוח השנה. לחצו על עדכון כדי לנסות שוב.",
  "Choose a specific property before creating a reservation.":
    "בחרו נכס מסוים לפני יצירת הזמנה.",
  "Add a room to this property before creating a reservation.":
    "הוסיפו חדר לנכס לפני יצירת הזמנה.",
  "No properties configured": "עדיין לא הוגדרו נכסים",
  "No organization access": "אין גישה לארגון",
  "Join an organization to create reservations":
    "הצטרפו לארגון כדי ליצור הזמנות",
  "Add a property and room first": "הוסיפו תחילה נכס וחדר",
  "Start with your organization": "מתחילים עם הארגון שלכם",
  "Your calendar is ready": "לוח השנה שלכם מוכן",
  "Add your first property": "הוספת הנכס הראשון",
  "No active organization memberships. An owner can add your verified email.":
    "אין חברות פעילה בארגון. בעלים יכול להזמין את כתובת האימייל המאומתת שלכם.",
  "Connect a property and its rooms to start managing real reservations.":
    "הוסיפו נכס ואת החדרים שלו כדי להתחיל לנהל הזמנות.",
  "View invitations": "צפייה בהזמנות לצוות",
  "Manage properties": "ניהול נכסים",
  "Create organization": "יצירת ארגון",
  "Organization name": "שם הארגון",
  "IANA timezone": "אזור זמן",
  "Organization settings": "הגדרות הארגון",
  "Save organization details": "שמירת פרטי הארגון",
  "Changes saved.": "השינויים נשמרו.",
  "Changes saved. Refresh the screen to load the updated data.":
    "השינויים נשמרו. רעננו את המסך כדי לטעון את הנתונים המעודכנים.",
  "Loading your organizations…": "טוענים את הארגונים שלכם…",
  "Verified email": "אימייל מאומת",
  Rooms: "חדרים",
  Team: "צוות",
  "Address (optional)": "כתובת (לבחירה)",
  Capacity: "תפוסה",
  "Add property": "הוספת נכס",
  "Add room": "הוספת חדר",
  "Add member": "הוספת חבר",
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
  "{count} reservations": "{count} הזמנות",
  "Refreshed {time}": "רוענן ב־{time}",
  "More results available; count is partial":
    "קיימות תוצאות נוספות; הספירה חלקית",
  "Showing {count} loaded reservations for the selected calendar range.":
    "מוצגות {count} הזמנות שנטענו בטווח שנבחר.",
  "More results are available in Calendar.": "תוצאות נוספות זמינות בלוח השנה.",
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
  for (const link of document.querySelectorAll(
    '.brand[href="/"], .portal-legal a',
  )) {
    if (hostLanguage === "he")
      link.setAttribute("href", "/he" + link.getAttribute("href"));
  }
}

export function installHostLanguageSelector() {
  const menu = document.querySelector(".account-menu");
  if (!menu || document.getElementById("host-language")) return;
  const label = document.createElement("label"),
    select = document.createElement("select");
  label.className = "host-language-select";
  label.append(document.createTextNode(hostText("Interface language")));
  select.id = "host-language";
  select.setAttribute("aria-label", hostText("Interface language"));
  for (const [language, title] of [
    ["en", "English"],
    ["he", "עברית"],
  ]) {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = title;
    select.append(option);
  }
  select.value = hostLanguage;
  select.addEventListener("change", () => {
    const url = new URL(location.href);
    if (select.value === "he") url.searchParams.set("lang", "he");
    else url.searchParams.delete("lang");
    location.assign(url.href);
  });
  label.append(select);
  menu.prepend(label);
}
