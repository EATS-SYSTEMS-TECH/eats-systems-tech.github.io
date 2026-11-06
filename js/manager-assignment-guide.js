import { managerUiIcon } from "./manager-ui-icons.js";
import { createManagerDialog } from "./manager-dialog.js";
import { attachManagerGuideNavigation } from "./manager-guide-navigation.js";
import { managerGuideImageContent } from "./manager-guide-image.js";

let guideId = 0;

/** Illustrated help only. Advancing a step never assigns a system. */
export function createManagerAssignmentGuide(language = "en") {
  const he = language === "he", t = (h, e) => he ? h : e;
  const node = (tag, text, cls) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (cls) element.className = cls;
    return element;
  };
  const images = createManagerDialog({ language });
  const guide = node("details", null, "dashboard-examples manager-setup-guide manager-assignment-guide");
  const summary = node("summary", t("איך משייכים מערכת לארגון?", "How do I assign a system to an organization?"));
  guide.append(summary, node("p", t("מתחילים מתוך המערכות שלי בחשבון של בעל המערכת. עברו בין השלבים כדי לראות איפה ללחוץ באתר.", "Start in the system owner's My systems. Follow the steps to see where to select each action on the website.")));
  const steps = node("ol", null, "manager-setup-steps");
  const items = [
    ["systems", "my-systems", t("בחרו את המערכת שלכם", "Choose your system"), t("פתחו את המערכות שלי עם החשבון שאליו המערכת יוצאה מהאפליקציה. בכרטיס המערכת לחצו על פתיחת סביבת ניהול.", "Open My systems using the account the system was exported to from the app. Select Open workspace on the system card.")],
    ["organizations", "system-actions", t("פתחו שיוך לארגון", "Open Assign organization"), t("בסביבת הניהול לחצו על תפריט שלוש הנקודות ליד סיום וחזרה. בחרו שיוך לארגון.", "In the workspace, open the three-dot menu beside End and return. Select Assign organization.")],
    ["account", "choose-organization", t("בחרו את הארגון", "Choose the organization"), t("בחרו את הארגון הרצוי מתוך הרשימה ולחצו שמירה. אם הארגון חסר או שהגישה חסומה, פנו לבעל הארגון לבדיקת החברות וההרשאות.", "Choose the organization from the list and select Save. If it is missing or access is denied, ask its owner to check your membership and permissions.")],
    ["admin", "confirm-assignment", t("קראו את ההודעה ואשרו", "Review and confirm"), t("בדקו שבחרתם את הארגון הנכון וקראו את הודעת האישור. שינוי שיוך מוחק את רשתות ה־Wi-Fi השמורות בשער בבדיקה הבאה ומנתק אותו מ־Manager. אשרו רק כשתהיו מוכנים להגדיר Wi-Fi מחדש באפליקציה ליד השער.", "Check that you chose the correct organization and read the confirmation. Changing assignment deletes the gate's saved Wi-Fi networks on its next check and disconnects it from Manager. Confirm when you are ready to set Wi-Fi again in the app near the gate.")],
    ["refresh", "organization-systems", t("ראו את המערכת בארגון", "Find the system in the organization"), t("בחרו את הארגון בסרגל הצד, פתחו מערכות הארגון ולחצו רענון. לחיבור מרחוק לאחר שינוי השיוך, הגדירו Wi-Fi מחדש באפליקציה ליד השער.", "Select the organization in the sidebar, open Organization systems and select Refresh. To reconnect remotely after reassignment, set Wi-Fi again in the app near the gate.")],
  ];
  const id = `manager-assignment-steps-${++guideId}`;
  steps.id = id;
  for (const [index, [icon, asset, title, description]] of items.entries()) {
    const step = node("li", null, "manager-setup-step-illustrated");
    step.dataset.step = String(index + 1);
    const copy = node("div", null, "manager-setup-step-copy");
    const symbol = node("span", null, "manager-setup-step-icon");
    symbol.append(managerUiIcon(icon));
    const stepHeading = node("div", null, "manager-assignment-step-heading");
    stepHeading.append(symbol, node("span", t(`שלב ${index + 1}`, `Step ${index + 1}`), "manager-assignment-step-number"));
    copy.append(stepHeading, node("strong", title), node("p", description));
    const gallery = node("div", null, "manager-setup-screenshots");
    const figure = node("figure", null, "manager-setup-screenshot manager-assignment-screenshot");
    const zoom = node("button", null, "manager-setup-screenshot-button");
    zoom.type = "button";
    zoom.setAttribute("aria-haspopup", "dialog");
    zoom.setAttribute("aria-label", t("הגדלת צילום המסך: ", "Enlarge screenshot: ") + title);
    const image = node("img");
    image.src = `/assets/img/manager/assignment/${asset}-${he ? "he" : "en"}.jpg?v=20261105assignment1`;
    image.alt = title;
    const compact = asset === "system-actions" || asset === "organization-systems";
    image.width = compact ? 1265 : 1280; image.height = compact ? 712 : 720;
    image.loading = "lazy"; image.decoding = "async";
    const hint = node("span", t("לחצו להגדלה", "Select to enlarge"), "manager-setup-screenshot-zoom");
    hint.prepend(managerUiIcon("search"));
    zoom.append(image, hint);
    zoom.addEventListener("click", () => {
      void images.info({ title, className: "manager-guide-image-dialog", content: managerGuideImageContent(image, language) });
    });
    figure.append(zoom, node("figcaption", title)); gallery.append(figure);
    step.append(copy, gallery); steps.append(step);
  }
  attachManagerGuideNavigation({ guide, steps, language,
    labels: [t("המערכת", "System"), t("התפריט", "Menu"), t("הארגון", "Organization"), t("אישור", "Confirm"), t("סיום", "Finish")],
    completionText: t(
      "עברתם את כל חמשת שלבי ההדרכה. לאחר ביצוע השיוך, בדקו שהמערכת מופיעה במערכות הארגון והגדירו Wi-Fi מחדש ליד השער.",
      "You've reached the end of all five guide steps. After assigning the system, check Organization systems and set Wi-Fi again near the gate.",
    ),
  });
  guide.append( node("p", t("צילומי מסך מתוך מסכי האתר, עם מערכת וארגון לדוגמה. מעבר בין השלבים אינו מבצע שיוך. לחצו על תמונה כדי להגדיל אותה.", "Screenshots of the website using an example system and organization. Moving between steps does not assign a system. Select an image to enlarge it."), "manager-setup-screenshot-note"), node("p", t("שימו לב: חברות בארגון בלבד אינה מעניקה בעלות על מערכת. השיוך כפוף להרשאות ולאישור הקיים באתר.", "Organization membership alone does not grant system ownership. Assignment remains subject to the existing permissions and confirmation."), "manager-assignment-note"));
  return guide;
}
