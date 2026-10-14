// Node side of the Host dashboard browser tests that use the in-memory Host
// API (scripts/lib/host-booking-api.js): serves the repository, launches
// installed Chrome and opens /dashboard/host/ with a fixture state.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { hostShell, rolePermissions } from "../host-test-shell.mjs";

export const root = fileURLToPath(new URL("../../", import.meta.url));

export const organization = (
  id,
  name,
  role,
  { timezone = "UTC", available = true } = {},
) => ({
  id,
  name,
  timezone,
  version: 1,
  membership: { role },
  workspace: {
    role,
    permissions: rolePermissions[role],
    service: available
      ? { state: "legacy-active", available: true }
      : { state: "suspended", available: false },
  },
});

export const system = (id, name, type = "gate") => ({
  id,
  type,
  targetId: `${id}-target`,
  systemIds: type === "gate" ? [`${id}-gate`] : [`${id}-a`, `${id}-b`],
  name,
  iconId: type === "gate" ? "door-small" : "home",
  status: "active",
  version: 3,
  source: { kind: "organization" },
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
});

// A date (YYYY-MM-DD, UTC) `days` from today.
export const day = (days = 0) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export const booking = (id, systemId, systemName, from, to, extra = {}) => ({
  id,
  systemId,
  systemName,
  targetIds: systemId ? [systemId] : [],
  guest: { name: `Guest ${id}`, phone: "+972501234567" },
  startsAt: `${from}T15:00:00.000Z`,
  endsAt: `${to}T12:00:00.000Z`,
  status: "confirmed",
  version: 1,
  timezone: "UTC",
  note: "",
  ...extra,
});

export async function startHostSite(t) {
  const server = createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(path.resolve(root) + path.sep))
        return response.writeHead(403).end();
      response.setHeader(
        "Content-Type",
        file.endsWith(".js") || file.endsWith(".mjs")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".svg")
              ? "image/svg+xml"
              : file.endsWith(".html")
                ? "text/html; charset=utf-8"
                : "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  return { origin: `http://127.0.0.1:${server.address().port}`, browser };
}

// Opens /dashboard/host/<query> with `state`. `page: "real"` uses the real
// dashboard/host/index.html (its own scripts replaced by the fixture).
export async function openWorkspace(
  t,
  { origin, browser },
  state,
  { query = "", viewport = { width: 1440, height: 1000 }, real = false } = {},
) {
  const context = await browser.newContext({
    viewport,
    ...(state.locale ? { locale: state.locale } : {}),
  });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const start = `import { startWorkspace } from '/scripts/lib/host-booking-api.js'; window.workspaceStarted = startWorkspace(${JSON.stringify(state)}, { locale: ${real} });`;
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/booking-fixture.js")
      return route.fulfill({
        contentType: "application/javascript",
        body: start,
      });
    // A sensitive action's fresh sign-in: counted, and it always succeeds.
    if (url.pathname === "/js/site-auth.js")
      return route.fulfill({
        contentType: "application/javascript",
        body: "export async function reauthenticate() { window.verifications = (window.verifications ?? 0) + 1; } export async function resolveTotp() { throw new Error('No live authenticator in the fixture'); }",
      });
    if (url.pathname === "/dashboard/host/") {
      if (!real)
        return route.fulfill({
          contentType: "text/html",
          body: hostShell("/booking-fixture.js"),
        });
      let html = await readFile(
        path.join(root, "dashboard/host/index.html"),
        "utf8",
      );
      html = html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(
          "</body>",
          `<script type="module">document.querySelector('#host-sidebar').hidden=false;document.querySelector('#dashboard-content').hidden=false;document.querySelector('#access-panel').hidden=true;document.body.classList.add('host-ready');const {installHostLanguageSelector}=await import('/js/host-locale.js');installHostLanguageSelector();</script><script type="module" src="/booking-fixture.js"></script></body>`,
        );
      return route.fulfill({ contentType: "text/html", body: html });
    }
    return route.continue();
  });
  await page.goto(origin + "/dashboard/host/" + query);
  await page.waitForFunction(() => window.workspaceStarted);
  await page.evaluate(() => window.workspaceStarted);
  return { page, errors, context };
}

// The requests the page made, as {call, query, body, key}.
export const requests = (page) => page.evaluate(() => window.fixture.requests);

// Waits until a view's panel has finished loading.
export const loaded = (page, view) =>
  page.locator(`[data-workspace-view="${view}"][data-loaded="true"]`).waitFor();

// True when the page has no horizontal scroll.
export const fits = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
