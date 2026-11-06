import { managerUiIcon } from "./manager-ui-icons.js";
import { createManagerDialog } from "./manager-dialog.js";
import { attachManagerGuideNavigation } from "./manager-guide-navigation.js";
import { managerGuideImageContent } from "./manager-guide-image.js";
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

/** Static help for the app's existing first-export flow; performs no actions. */
export function createManagerSetupGuide(language = "en") {
  const t = (he, en) => (language === "he" ? he : en);
  const imageDialog = createManagerDialog({ language });
  const screenshots = [
    [
      ["app-home", t("פתחו את תמונת הפרופיל באפליקציה", "Open your profile picture in the app")],
      ["app-profile", t("בדקו שזה אותו חשבון שבו אתם משתמשים באתר", "Check that this is the account you use on the website")],
    ],
    [["app-business", t("ב־WIFIGATE For Business בחרו Manager", "In WIFIGATE For Business, choose Manager")]],
    [["app-export", t("זהו את כרטיס המערכת ואת גישת ה־Admin המקומית", "Find your system card and its local Admin access")]],
    [["app-export", t("כפתור Export נמצא בתחתית כרטיס המערכת", "Export is at the bottom of the system card")]],
    [["desktop-my-systems", t("המערכת שלכם מופיעה ב״המערכות שלי״ — צילום מסך מהמחשב עם נתוני דוגמה", "Your system appears in My systems — a desktop screenshot with example data")]],
  ];
  const guide = node(
    "details",
    undefined,
    "manager-setup-guide dashboard-examples",
  );
  guide.append(
    node("summary", t("איך מוסיפים מערכת?", "How do I add a system?")),
  );
  guide.append(
    node(
      "p",
      t(
        "מוסיפים את המערכת דרך אפליקציית WIFIGATE, ואז מנהלים אותה כאן באתר.",
        "Add your system through the WIFIGATE app, then manage it here on the website.",
      ),
    ),
  );
  const steps = node("ol", undefined, "manager-setup-steps");
  for (const [title, description] of [
    [
      t("התחברו לאותו חשבון", "Sign in with the same account"),
      t(
        "פתחו את תמונת הפרופיל באפליקציית WIFIGATE ובדקו שהתחברתם לחשבון שבו אתם משתמשים באתר. לייצוא נדרשת גישת משתמש פעילה ל־WIFIGATE Manager.",
        "Open your profile picture in the WIFIGATE app and check that you are signed in with the account you use on this website. Export requires an active User account.",
      ),
    ],
    [
      t("פתחו WIFIGATE Manager באפליקציה", "Open WIFIGATE Manager in the app"),
      t(
        "בפרופיל שלכם בחרו WIFIGATE For Business, ולאחר מכן WIFIGATE Manager.",
        "In your profile, choose WIFIGATE For Business, then WIFIGATE Manager.",
      ),
    ],
    [
      t("בחרו את המערכת שתרצו להוסיף", "Choose the system to add"),
      t(
        "ודאו שהמערכת שמורה באפליקציה ושיש לכם גישת מנהל מקומי פעילה. הפעילו Bluetooth והישארו ליד המערכת. בקבוצה יש לאמת כל שער שנכלל בה.",
        "Make sure the system is saved in the app and you have active local administrator access. Enable Bluetooth and stay near the system. For a group, each included gate must be verified.",
      ),
    ],
    [
      t(
        "לחצו Export והמתינו לאישור",
        "Select Export and wait for confirmation",
      ),
      t(
        "בכרטיס המערכת לחצו Export. הישארו במסך עד שתופיע הודעה שהמערכת יוצאה ל־WIFIGATE Manager בהצלחה.",
        "Select Export on the system card. Stay on the screen until the app confirms that the system was exported to WIFIGATE Manager successfully.",
      ),
    ],
    [
      t("חזרו אל המערכות שלי באתר", "Return to My systems on the website"),
      t(
        "פתחו את WIFIGATE Manager באתר עם אותו חשבון, בחרו ״המערכות שלי״ ולחצו ״רענון״. המערכת שיוצאה תופיע ברשימה.",
        "Open WIFIGATE Manager on this website with the same account, select My systems, then Refresh. Your exported system will appear in the list.",
      ),
    ],
  ]) {
    const step = node("li");
    const stepIndex = steps.children.length;
    step.dataset.step = String(stepIndex + 1);
    const copy = node("div", undefined, "manager-setup-step-copy");
    const icon = node("span", undefined, "manager-setup-step-icon");
    icon.append(managerUiIcon(["account", "app", "systems", "export", "refresh"][stepIndex]));
    copy.append(icon, node("strong", title), node("p", description));
    step.append(copy);
    if (screenshots[stepIndex].length) {
      step.classList.add("manager-setup-step-illustrated");
      const gallery = node("div", undefined, "manager-setup-screenshots");
      for (const [asset, caption] of screenshots[stepIndex]) {
        const figure = node("figure", undefined, "manager-setup-screenshot");
        const enlarge = node("button", undefined, "manager-setup-screenshot-button");
        enlarge.type = "button";
        enlarge.setAttribute("aria-label", t("הגדלת צילום המסך: ", "Enlarge screenshot: ") + caption);
        enlarge.setAttribute("aria-haspopup", "dialog");
        const image = node("img");
        const desktop = asset === "desktop-my-systems";
        image.src = desktop
          ? `/assets/img/manager/setup/${asset}-${language === "he" ? "he" : "en"}.jpg?v=20261106setup1`
          : `/assets/img/manager/setup/${asset}.webp?v=20261105generic1`;
        image.alt = caption;
        image.loading = "lazy";
        image.decoding = "async";
        image.width = desktop ? 1280 : asset === "app-export" ? 1312 : 852;
        image.height = desktop ? 720 : asset === "app-export" ? 1199 : 1846;
        if (asset === "app-export") figure.classList.add("manager-setup-screenshot-card");
        if (desktop) { figure.classList.add("manager-setup-screenshot-desktop"); step.classList.add("manager-setup-step-desktop"); }
        const zoom = node("span", t("לחצו להגדלה", "Select to enlarge"), "manager-setup-screenshot-zoom");
        zoom.prepend(managerUiIcon("search"));
        enlarge.append(image, zoom);
        enlarge.addEventListener("click", () => {
          void imageDialog.info({ title: caption, className: "manager-guide-image-dialog", content: managerGuideImageContent(image, language) });
        });
        figure.append(enlarge, node("figcaption", caption));
        gallery.append(figure);
      }
      step.append(gallery);
      if (stepIndex === 3) copy.append(node("p", t(
        "Export מופעל לאחר טעינת החשבון ואימות הגישה. אם הוא אפור, בדקו את החיבור ואת תוכנית Manager לפני הייצוא.",
        "Export becomes available after your account and access are checked. If it is grey, check your connection and Manager plan before exporting.",
      ), "manager-setup-export-note"));
    }
    steps.append(step);
  }
  attachManagerGuideNavigation({ guide, steps, language,
    labels: [t("החשבון", "Account"), "Manager", t("המערכת", "System"), "Export", t("האתר", "Website")],
    completionText: t(
      "עברתם את חמשת שלבי ההדרכה. כעת רעננו את ״המערכות שלי״ ובדקו שהמערכת שייצאתם מופיעה ברשימה.",
      "You've reached the end of the five-step guide. Now refresh My systems and check that your exported system appears in the list.",
    ),
  });
  guide.append(node("p", t(
    "צילומי המסך מהאפליקציה ומהאתר מציגים פרטי דוגמה להמחשה. צילומי האפליקציה הותאמו ללא דגלים. לחצו על תמונה כדי להגדיל אותה. השלמת המדריך אינה מבצעת ייצוא של מערכת.",
    "App and website screenshots use example details for illustration. App screenshots were adapted without flags. Select an image to enlarge it. Completing the guide does not export a system.",
  ), "manager-setup-screenshot-note"));
  const update = node("p", undefined, "manager-setup-update");
  update.append(
    node("strong", t("כבר ייצאתם את המערכת?", "Already exported your system?")),
    document.createTextNode(
      " " +
        t(
          "לעדכון שלה, חזרו למסך WIFIGATE Manager באפליקציה והשתמשו ב־Sync.",
          "To update it, return to WIFIGATE Manager in the app and use Sync.",
        ),
    ),
  );
  guide.append(update);
  return guide;
}
