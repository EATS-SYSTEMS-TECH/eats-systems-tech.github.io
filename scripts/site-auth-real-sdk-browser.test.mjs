// js/site-auth.js against the real Firebase Auth 12.19.0 SDK (node_modules,
// served offline in place of gstatic): a page load restores a signed-in
// account from the storage it was saved in and never moves it. A tab-only
// sign-in stays in session storage; a remembered one, or one saved in local
// storage before "Remember me on this device" existed, stays in local storage.
// No request leaves the machine: Google APIs are refused, so the SDK keeps the
// stored account as a network failure.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { startSite } from "./platform-test-fixtures.mjs";
import { installAppCheckFixture } from "./app-check-browser-fixture.mjs";
import { firebaseConfig } from "../js/firebase-config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdk = (name) => readFile(path.join(root, "node_modules/firebase", name));
const USER_KEY = `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`;
const HARNESS = `<!doctype html><meta charset="utf-8"><title>Auth harness</title>
<script type="module">
  import { initializeSiteAuth, completeAuthCallback } from "/js/site-auth.js";
  window.harness = (async () => {
    // No redirect is pending: the sign-in page's start must not move anyone.
    const credential = await completeAuthCallback(() => null);
    const uid = await new Promise((resolve) => initializeSiteAuth((user) => resolve(user?.uid ?? null)));
    // Let the SDK finish writing.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { credential, uid };
  })();
</script>`;

function storedUser(uid) {
  const now = Date.now();
  return JSON.stringify({
    uid,
    email: `${uid}@example.test`,
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    stsTokenManager: {
      refreshToken: "fixture-refresh",
      accessToken: "fixture-access",
      expirationTime: now + 3_600_000,
    },
    createdAt: String(now - 86_400_000),
    lastLoginAt: String(now - 60_000),
    apiKey: firebaseConfig.apiKey,
    appName: "[DEFAULT]",
  });
}

async function realSdkPage(browser, origin) {
  const context = await browser.newContext();
  await installAppCheckFixture(context);
  const [app, auth] = await Promise.all([sdk("firebase-app.js"), sdk("firebase-auth.js")]);
  // Refuse everything that is not this site or the SDK files.
  await context.route(
    (url) => !url.href.startsWith(origin) && !url.href.startsWith("https://www.gstatic.com/firebasejs/"),
    (route) => route.abort("internetdisconnected"),
  );
  await context.route("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: app }),
  );
  await context.route("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: auth }),
  );
  await context.route(`${origin}/auth-harness/`, (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: HARNESS }),
  );
  await context.route(`${origin}/auth-blank/`, (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>Blank</title>" }),
  );
  const page = await context.newPage();
  // A first visit on this origin, so storage can be seeded before the load.
  await page.goto(`${origin}/auth-blank/`);
  return { context, page };
}

const where = (page) =>
  page.evaluate((key) => ({
    session: JSON.parse(sessionStorage.getItem(key))?.uid ?? null,
    local: JSON.parse(localStorage.getItem(key))?.uid ?? null,
  }), USER_KEY);

test("a page load keeps each stored sign-in in its own storage (real Firebase SDK)", async (t) => {
  const { origin, browser } = await startSite(t);
  const cases = [
    { name: "tab only", seed: { session: "tab-user" }, uid: "tab-user", after: { session: "tab-user", local: null } },
    { name: "remembered or saved before the option", seed: { local: "kept-user" }, uid: "kept-user", after: { session: null, local: "kept-user" } },
    // This tab's sign-in wins, and the account remembered on the device is left alone.
    { name: "both", seed: { session: "tab-user", local: "kept-user" }, uid: "tab-user", after: { session: "tab-user", local: "kept-user" } },
  ];
  for (const item of cases) {
    await t.test(item.name, async () => {
      const { context, page } = await realSdkPage(browser, origin);
      try {
        await page.evaluate(({ key, seed, users }) => {
          if (seed.session) sessionStorage.setItem(key, users[seed.session]);
          if (seed.local) localStorage.setItem(key, users[seed.local]);
        }, {
          key: USER_KEY,
          seed: item.seed,
          users: { "tab-user": storedUser("tab-user"), "kept-user": storedUser("kept-user") },
        });
        await page.goto(`${origin}/auth-harness/`);
        const result = await page.evaluate(() => window.harness);
        assert.deepEqual(result, { credential: null, uid: item.uid });
        assert.deepEqual(await where(page), item.after);
        // A second load does not move it either.
        await page.reload();
        await page.evaluate(() => window.harness);
        assert.deepEqual(await where(page), item.after);
      } finally {
        await context.close();
      }
    });
  }
});
