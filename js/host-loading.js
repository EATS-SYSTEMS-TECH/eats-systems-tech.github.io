// Run before styles and the dashboard module: never expose a half-built shell.
// A port of js/manager-loading.js for WIFIGATE Host (same steps and copy style).
(() => {
  const html = document.documentElement;
  if (!html.hasAttribute("data-host-loading")) return;
  const he = new URLSearchParams(location.search).get("lang") === "he";
  html.lang = he ? "he" : "en";
  html.dir = he ? "rtl" : "ltr";
  const labels = he
    ? ["טוענים את WIFIGATE Host", "בודקים את החשבון וההרשאות", "מכינים את סביבת העבודה", "משלימים את התצוגה"]
    : ["Loading WIFIGATE Host", "Checking your account and access", "Preparing your workspace", "Finishing your workspace"];
  let revision = 0, step = 0, fatal = false, delayed = false, timer;
  const find = id => document.getElementById(id);
  function paint() {
    const progress = find("host-loading-progress"), label = find("host-loading-label");
    if (!progress || !label) return;
    progress.value = step;
    progress.setAttribute("aria-label", he ? "התקדמות טעינת סביבת העבודה" : "Workspace loading progress");
    label.textContent = fatal
      ? he ? "לא ניתן להשלים את טעינת התצוגה. נסו לטעון מחדש." : "The workspace could not finish loading. Please reload."
      : delayed
        ? he ? "הטעינה מתארכת. ממשיכים להמתין, ואפשר לנסות לטעון מחדש." : "Loading is taking longer than usual. Still waiting; you can also reload."
        : labels[Math.min(step, labels.length - 1)];
  }
  function begin() {
    const ticket = ++revision;
    clearTimeout(timer);
    step = 1;
    delayed = false;
    html.setAttribute("data-host-loading", "");
    const shell = document.querySelector(".platform-shell");
    if (shell) { shell.inert = true; shell.setAttribute("aria-busy", "true"); }
    if (find("host-loading")) find("host-loading").hidden = false;
    timer = setTimeout(() => { delayed = true; paint(); }, 45000);
    paint();
    return ticket;
  }
  function fail() {
    fatal = true;
    clearTimeout(timer);
    paint();
  }
  window.addEventListener("error", event => {
    if (!html.hasAttribute("data-host-loading")) return;
    const target = event.target;
    if ((target instanceof HTMLLinkElement && target.rel === "stylesheet") ||
        (target instanceof HTMLScriptElement && target.src.includes("host-dashboard.bundle.js"))) fail();
  }, true);
  // Non-blocking styles let the small inline loading surface paint immediately.
  document.addEventListener("load", event => {
    const target = event.target;
    if (target instanceof HTMLLinkElement && target.hasAttribute("data-host-style")) {
      target.dataset.hostStyleReady = "true";
      target.media = "all";
    }
  }, true);
  document.addEventListener("DOMContentLoaded", paint, { once: true });
  async function whenStyled(surface) {
    if (fatal) throw new Error("HOST_PRESENTATION_FAILED");
    await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link =>
      (link.hasAttribute("data-host-style") ? link.dataset.hostStyleReady === "true" : link.sheet) ? Promise.resolve() : new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", reject, { once: true });
      })));
    surface?.getBoundingClientRect();
    await document.fonts?.ready;
    if (fatal) throw new Error("HOST_PRESENTATION_FAILED");
  }
  window.wifigateHostLoading = {
    begin,
    whenStyled,
    advance(ticket, value) {
      if (ticket !== revision || fatal) return;
      step = Math.max(step, Math.min(3, value));
      paint();
    },
    async finish(ticket, failed = false) {
      if (ticket !== revision || fatal) return;
      // Stylesheets (including @imports) must load before the shell is shown.
      try {
        await whenStyled(document.querySelector(".platform-shell"));
        if (ticket !== revision || fatal) return;
        if (!failed) { step = 4; paint(); }
        await new Promise(resolve => document.hidden ? setTimeout(resolve, 0)
          : requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (ticket !== revision || fatal) return;
        clearTimeout(timer);
        const shell = document.querySelector(".platform-shell");
        if (shell) { shell.inert = false; shell.setAttribute("aria-busy", "false"); }
        html.removeAttribute("data-host-loading");
        find("host-loading").hidden = true;
      } catch { fail(); }
    },
    fail,
  };
  begin();
})();
