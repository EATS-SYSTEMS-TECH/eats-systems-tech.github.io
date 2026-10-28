const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

/** Static help for the app's existing first-export flow; performs no actions. */
export function createManagerSetupGuide(language = "en") {
  const t = (he, en) => (language === "he" ? he : en);
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
        "היכנסו לאפליקציית WIFIGATE עם החשבון שבו אתם משתמשים באתר. לייצוא נדרש חשבון WIFIGATE Manager user פעיל.",
        "Sign in to the WIFIGATE app with the account you use on this website. Export requires an active WIFIGATE Manager user account.",
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
    step.append(node("strong", title), node("p", description));
    steps.append(step);
  }
  guide.append(steps);
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
