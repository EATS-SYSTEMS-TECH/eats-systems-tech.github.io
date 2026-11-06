// Run before styles and the dashboard module: never expose a half-built shell.
(() => {
  const html = document.documentElement;
  if (!html.hasAttribute("data-manager-loading")) return;
  const he = new URLSearchParams(location.search).get("lang") === "he";
  html.lang = he ? "he" : "en";
  html.dir = he ? "rtl" : "ltr";
  const labels = he
    ? ["טוענים את WIFIGATE Manager", "בודקים את החשבון וההרשאות", "מכינים את סביבת הניהול", "משלימים את התצוגה"]
    : ["Loading WIFIGATE Manager", "Checking your account and access", "Preparing your workspace", "Finishing your workspace"];
  let revision = 0, step = 0, fatal = false, delayed = false, timer;
  const find = id => document.getElementById(id);
  function paint() {
    const progress = find("manager-loading-progress"), label = find("manager-loading-label");
    if (!progress || !label) return;
    progress.value = step;
    progress.setAttribute("aria-label", he ? "התקדמות טעינת סביבת הניהול" : "Workspace loading progress");
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
    html.setAttribute("data-manager-loading", "");
    const shell = document.querySelector(".platform-shell");
    if (shell) { shell.inert = true; shell.setAttribute("aria-busy", "true"); }
    if (find("manager-loading")) find("manager-loading").hidden = false;
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
    if (!html.hasAttribute("data-manager-loading")) return;
    const target = event.target;
    if ((target instanceof HTMLLinkElement && target.rel === "stylesheet") ||
        (target instanceof HTMLScriptElement && target.src.includes("platform-dashboard.bundle.js"))) fail();
  }, true);
  // Non-blocking styles let the small inline loading surface paint immediately.
  document.addEventListener("load", event => {
    const target = event.target;
    if (target instanceof HTMLLinkElement && target.hasAttribute("data-manager-style")) {
      target.dataset.managerStyleReady = "true";
      target.media = "all";
    }
  }, true);
  document.addEventListener("DOMContentLoaded", paint, { once: true });
  window.wifigateManagerLoading = {
    begin,
    advance(ticket, value) {
      if (ticket !== revision || fatal) return;
      step = Math.max(step, Math.min(3, value));
      paint();
    },
    async finish(ticket, failed = false) {
      if (ticket !== revision || fatal) return;
      // Stylesheets (including @imports) must load before the shell is shown.
      try {
        await Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(link =>
          (link.hasAttribute("data-manager-style") ? link.dataset.managerStyleReady === "true" : link.sheet) ? Promise.resolve() : new Promise((resolve, reject) => {
            link.addEventListener("load", resolve, { once: true });
            link.addEventListener("error", reject, { once: true });
          })));
        // Reflow the concealed shell so its actual fonts are requested before
        // observing FontFaceSet.ready (display:none would defer those requests).
        document.querySelector(".platform-shell")?.getBoundingClientRect();
        await document.fonts?.ready;
        if (ticket !== revision || fatal) return;
        if (!failed) { step = 4; paint(); }
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (ticket !== revision || fatal) return;
        clearTimeout(timer);
        const shell = document.querySelector(".platform-shell");
        if (shell) { shell.inert = false; shell.setAttribute("aria-busy", "false"); }
        html.removeAttribute("data-manager-loading");
        find("manager-loading").hidden = true;
      } catch { fail(); }
    },
    fail,
  };
  begin();
})();
