// scripts/not-found-page.mjs
// /404.html: GitHub Pages serves it for every missing path. It keeps the
// visitor (and a crawler following a stale link) inside the site: the home
// page, every use case and contact, with no index of its own.

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function buildNotFoundPage({ niches, pageUrl, cookieConsentVersion }) {
  const links = niches
    .map((niche) => `      <li><a href="${new URL(pageUrl("en", niche.key)).pathname}">${escapeHtml(niche.content.label)}</a></li>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page not found | WIFIGATE</title>
  <meta name="robots" content="noindex, follow" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/css/cookie-consent.css?v=${cookieConsentVersion}">
  <style>
    :root { color-scheme: light; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 2rem 1rem;
      background: #f5f7fb; color: #0f172a; font: 400 1rem/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { width: min(40rem, 100%); }
    h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.15; }
    p { margin: 0 0 1.5rem; color: #475569; }
    .home { display: inline-block; margin-bottom: 2rem; padding: .75rem 1.4rem; border-radius: .6rem;
      background: #0b63ff; color: #fff; font-weight: 700; text-decoration: none; }
    h2 { margin: 0 0 .6rem; font-size: 1rem; }
    ul { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: .35rem 1rem; }
    a { color: #0b4fbd; }
  </style>
</head>
<body>
  <main>
    <p><a href="/"><img src="/logo-1024.png" alt="WIFIGATE" width="56" height="56" /></a></p>
    <h1>This page doesn't exist</h1>
    <p>The link may be old or mistyped. WIFIGATE opens gates, doors, parking barriers and roller shutters from your phone; start from the home page or pick a use case.</p>
    <a class="home" href="/">Go to the WIFIGATE home page</a>
    <h2>Use cases</h2>
    <ul>
${links}
      <li><a href="/automation/">WIFIGATE Host</a></li>
      <li><a href="/contact-us/">Contact us</a></li>
    </ul>
  </main>
  <script src="/js/cookie-consent-copy.js?v=${cookieConsentVersion}" defer></script>
  <script src="/js/cookie-consent.js?v=${cookieConsentVersion}" defer></script>
</body>
</html>
`;
}
