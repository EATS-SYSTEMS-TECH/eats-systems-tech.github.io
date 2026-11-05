import { managerUiIcon } from "./manager-ui-icons.js";

export function createManagerAssignmentGuide(language = "en") {
  const t = (he, en) => language === "he" ? he : en;
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  const guide = node("details", null, "dashboard-examples manager-assignment-guide");
  guide.append(node("summary", t("איך משייכים מערכת לארגון?", "How do I assign a system to an organization?")));
  guide.append(node("p", t("השיוך מתחיל אצל בעל המערכת, מתוך המערכות שלי. חברות בארגון בלבד אינה מעניקה בעלות על המערכת.", "Assignment starts in the system owner's My systems workspace. Organization membership alone does not grant ownership of a system.")));
  const steps = node("ol", null, "manager-assignment-steps");
  for (const [icon, title, text] of [
    ["systems", t("בחרו מערכת קיימת", "Choose an existing system"), t("בעל המערכת נכנס אל המערכות שלי עם החשבון שאליו המערכת יוצאה מהאפליקציה.", "The system owner opens My systems using the account the system was exported to from the app.")],
    ["organizations", t("פתחו שיוך לארגון", "Open Assign organization"), t("פתחו את סביבת הניהול של המערכת, ובתפריט פעולות מערכת בחרו שיוך לארגון.", "Open the system workspace, then choose Assign organization from System actions.")],
    ["account", t("בחרו ארגון ושמרו", "Choose an organization and save"), t("בחרו את הארגון הרצוי, לחצו שמירה וקראו את הודעת האישור. אם הארגון אינו מופיע או שהגישה חסומה, פנו לבעל הארגון לבדיקת החברות וההרשאות.", "Choose the organization, select Save and read the confirmation. If the organization is missing or access is denied, ask its owner to check membership and permissions.")],
    ["refresh", t("חזרו למערכות הארגון", "Return to Organization systems"), t("בחרו את הארגון בסרגל הצד, פתחו מערכות הארגון ולחצו רענון כדי לראות את המערכת ששויכה.", "Select the organization in the sidebar, open Organization systems and select Refresh to see the assigned system.")],
  ]) {
    const item = node("li");
    const artwork = node("span", null, "manager-assignment-icon");
    artwork.append(managerUiIcon(icon));
    item.append(artwork, node("strong", title), node("p", text));
    steps.append(item);
  }
  guide.append(steps, node("p", t("שימו לב: שינוי שיוך הארגון מוחק את רשתות ה־Wi-Fi השמורות בשער בבדיקה הבאה ומנתק אותו מ־Manager. לחיבור מחדש יש להגדיר Wi-Fi באפליקציה ליד השער. הפעולה כפופה להרשאות ולהודעת האישור הקיימת.", "Changing the organization deletes the gate's saved Wi-Fi networks on its next check and disconnects it from Manager. To reconnect, configure Wi-Fi in the app near the gate. Existing permissions and confirmation still apply."), "manager-assignment-note"));
  return guide;
}
