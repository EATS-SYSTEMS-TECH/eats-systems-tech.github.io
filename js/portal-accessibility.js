// Workspaces (the dashboards, /reservations/ and the Pay point) choose English
// or Hebrew at run time and set <html lang> from their module script. The
// shared accessibility menu (js/accessibility.js) and the links to the
// accessibility statement follow <html lang>: this script keeps the links
// marked data-accessibility-statement and the menu in the page's language,
// and keeps the menu button clear of the workspace tools fixed in its corner.
(() => {
  // The site footer's statement link label (scripts/legal/footer-labels.mjs,
  // accessibilityLinkLabels); scripts/verify-site.mjs checks the two agree.
  const labels = {
    "en": "Accessibility Statement",
    "he": "הצהרת נגישות",
    "es": "Declaración de accesibilidad",
    "fr": "Déclaration d'accessibilité",
    "de": "Erklärung zur Barrierefreiheit",
    "nl": "Toegankelijkheidsverklaring",
    "it": "Dichiarazione di accessibilità",
    "pt": "Declaração de acessibilidade",
    "pt-BR": "Declaração de acessibilidade",
    "pl": "Deklaracja dostępności",
    "no": "Tilgjengelighetserklæring",
    "cs": "Prohlášení o přístupnosti",
    "ru": "Заявление о доступности",
    "uk": "Заява про доступність",
    "tr": "Erişilebilirlik beyanı",
    "ar": "بيان إمكانية الوصول",
    "hi": "सुलभता विवरण",
    "bn": "অভিগম্যতা বিবৃতি",
    "mr": "सुलभता निवेदन",
    "te": "ప్రాప్యత ప్రకటన",
    "zh-Hans": "无障碍声明",
    "zh-Hant": "無障礙聲明",
    "ja": "アクセシビリティ方針",
    "ko": "접근성 선언문",
    "da": "Tilgængelighedserklæring",
    "sv": "Tillgänglighetsredogörelse",
    "hu": "Akadálymentességi nyilatkozat",
    "el": "Δήλωση προσβασιμότητας",
    "ro": "Declarație de accesibilitate",
    "hr": "Izjava o pristupačnosti",
    "fi": "Saavutettavuusseloste",
    "bg": "Декларация за достъпност",
    "sr": "Изјава о приступачности",
    "sk": "Vyhlásenie o prístupnosti",
    "sl": "Izjava o dostopnosti",
    "id": "Pernyataan aksesibilitas",
    "th": "คำชี้แจงการเข้าถึง",
    "vi": "Tuyên bố về khả năng tiếp cận",
    "ms": "Pernyataan kebolehcapaian",
    "fil": "Pahayag sa accessibility",
  };
  const root = document.documentElement;
  const language = () => {
    const requested = (root.getAttribute("lang") || "en").toLowerCase();
    return Object.keys(labels).find((code) => code.toLowerCase() === requested) || "en";
  };
  let current = null;
  function localize() {
    const code = language();
    if (code === current) return;
    current = code;
    const href = code === "en" ? "/accessibility/" : `/${code.toLowerCase()}/accessibility/`;
    for (const link of document.querySelectorAll("a[data-accessibility-statement]")) {
      link.href = href;
      link.textContent = labels[code];
    }
    const statement = document.getElementById("a11y-statement");
    if (statement) statement.href = href;
    // js/accessibility.js translates the menu and the skip link again.
    document.dispatchEvent(new CustomEvent("site-language-change"));
  }

  // The admin tools and the management entry sit in the button's corner
  // (css/platform.css). While the menu is closed the button rests above them,
  // unless the visitor moved it.
  const tools = ".platform-admin-tools, .platform-management-entry";
  let scheduled = false;
  function clear() {
    scheduled = false;
    const fab = document.getElementById("a11y-fab");
    if (!fab) return;
    fab.style.removeProperty("--a11y-fab-lift");
    if (fab.hidden || fab.style.left || document.body.classList.contains("a11y-panel-open")) return;
    const box = fab.getBoundingClientRect();
    let bottom = box.bottom;
    for (const tool of document.querySelectorAll(tools)) {
      if (getComputedStyle(tool).position !== "fixed") continue;
      const area = tool.getBoundingClientRect();
      if (!area.width || box.left >= area.right || box.right <= area.left) continue;
      bottom = Math.min(bottom, area.top - 12);
    }
    const lift = Math.round(box.bottom - bottom);
    if (lift > 0) fab.style.setProperty("--a11y-fab-lift", `${lift}px`);
  }
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(clear);
    }
  };
  const watched = new WeakSet();
  const resize = window.ResizeObserver ? new ResizeObserver(schedule) : null;
  function watchTools() {
    for (const tool of document.querySelectorAll(tools)) {
      if (watched.has(tool)) continue;
      watched.add(tool);
      resize?.observe(tool);
    }
    schedule();
  }

  function start() {
    localize();
    new MutationObserver(localize).observe(root, { attributes: true, attributeFilter: ["lang"] });
    watchTools();
    new MutationObserver(watchTools).observe(document.body, { childList: true });
    new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", schedule);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
