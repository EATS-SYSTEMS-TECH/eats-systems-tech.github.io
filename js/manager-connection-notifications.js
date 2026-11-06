export function createManagerConnectionNotifications({ language = "en" } = {}) {
  const t = (he, en) => language === "he" ? he : en;
  let baseTitle = document.title, appliedTitle, current, notice;
  const supported = () => typeof Notification === "function";
  function restoreTitle() {
    if (appliedTitle && document.title === appliedTitle) document.title = baseTitle;
    appliedTitle = undefined;
  }
  function closeNotice() {
    notice?.close();
    notice = undefined;
  }
  function setTitle(text) {
    appliedTitle = `${text} · WIFIGATE Manager`;
    document.title = appliedTitle;
  }
  function visibilityChanged() {
    if (!document.hidden) {
      restoreTitle();
      closeNotice();
    } else if (current?.pending) {
      setTitle(t("מתחברים למערכת…", "Connecting…"));
    }
  }
  document.addEventListener("visibilitychange", visibilityChanged);
  function cancel() {
    current = undefined;
    restoreTitle();
    closeNotice();
  }
  return {
    get canEnable() { return supported() && Notification.permission === "default"; },
    get enabled() { return supported() && Notification.permission === "granted"; },
    async enable() {
      if (!supported()) return false;
      try {
        return (Notification.permission === "default"
          ? await Notification.requestPermission() : Notification.permission) === "granted";
      } catch { return false; }
    },
    start(systemName) {
      cancel();
      baseTitle = document.title;
      current = { systemName, pending: true };
      visibilityChanged();
    },
    finish(success) {
      if (!current || current.success === success) return;
      current.pending = false;
      current.success = success;
      if (!document.hidden) { restoreTitle(); return; }
      const title = success ? t("החיבור מוכן", "Connection ready") : t("החיבור נכשל", "Connection failed");
      setTitle(`${success ? "✓" : "!"} ${title}`);
      closeNotice();
      if (!supported() || Notification.permission !== "granted") return;
      try {
        notice = new Notification(title, {
          body: `${current.systemName} · ${success
            ? t("אפשר לחזור לסביבת הניהול.", "Your management workspace is ready.")
            : t("חזרו לטאב לפרטי החיבור ולניסיון נוסף.", "Return to this tab for details and retry options.")}`,
          icon: "/assets/wifigate-logo.png",
          tag: "wifigate-manager-connection",
        });
        const sent = notice;
        sent.onclick = () => { window.focus(); sent.close(); };
      } catch { /* The tab title remains available when system notifications cannot be shown. */ }
    },
    cancel,
    destroy() {
      document.removeEventListener("visibilitychange", visibilityChanged);
      cancel();
    },
  };
}
