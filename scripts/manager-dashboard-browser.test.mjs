import test from "node:test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("closing during Manager connection setup never leaves late demand or an active socket", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route(origin + "/manager-launch-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html><body></body></html>",
    }),
  );
  await page.goto(origin + "/manager-launch-test");
  const results = await page.evaluate(async () => {
    const { ManagerConnection } = await import("/js/manager-connection.js");
    const outcomes = [];
    for (const phase of ["identity", "request"]) {
      let release, entered;
      const held = new Promise((r) => {
        release = r;
      });
      const reached = new Promise((r) => {
        entered = r;
      });
      const calls = [],
        sockets = [];
      const c = new ManagerConnection({
        user: { uid: "synthetic-launch-test" },
        WebSocketImpl: class {
          constructor() {
            sockets.push(true);
          }
        },
        api: async (path) => {
          calls.push(path);
          if (path.endsWith("/identity")) {
            if (phase === "identity") {
              entered();
              await held;
            }
            return { systemId: "gate" };
          }
          if (path === "/connection-requests") {
            entered();
            await held;
            return { requestId: "late-request" };
          }
          if (path.endsWith("/cancel")) return { cancelled: true };
          throw new Error("Unexpected request");
        },
      });
      const opening = c.open("gate").catch((error) => error.message);
      await reached;
      const duplicate = await c.open("gate").catch((error) => error.message);
      c.close();
      release();
      outcomes.push({
        phase,
        result: await opening,
        duplicate,
        calls,
        sockets: sockets.length,
        keyCleared: c.key === null,
        closed: c.closed,
      });
    }
    return outcomes;
  });
  for (const r of results) {
    assert.equal(r.result, "CANCELLED");
    assert.equal(r.duplicate, "BUSY");
    assert.equal(r.sockets, 0);
    assert.equal(r.keyCleared, true);
    assert.equal(r.closed, true);
    assert.equal(
      r.calls.includes("/connection-requests/late-request/cancel"),
      r.phase === "request",
    );
    assert.equal(
      r.calls.includes("/connection-requests"),
      r.phase === "request",
    );
  }
});

test("Manager handles repeated empty cursors and discards invitations loaded after navigating away", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route(origin + "/manager-launch-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html><body></body></html>",
    }),
  );
  await page.goto(origin + "/manager-launch-test");
  await page.evaluate(async () => {
    document.body.replaceChildren();
    const root = document.createElement("main");
    document.body.append(root);
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    window.pageReads = 0;
    window.dashboard = createManagerDashboard({
      root,
      user: { uid: "fixture" },
      api: async (path) => {
        if (path === "/me")
          return {
            role: "user",
            account: { id: "account" },
            organizations: [],
          };
        if (path.startsWith("/systems?")) {
          window.pageReads++;
          return { items: [], nextCursor: "repeated" };
        }
        if (path.startsWith("/organizations?"))
          return { items: [], nextCursor: null };
        if (path.startsWith("/invitations?"))
          return new Promise((resolve) => {
            window.finishInvitations = () =>
              resolve({
                items: [{ id: "late", email: "late@example.test" }],
                nextCursor: null,
              });
          });
        throw new Error("Unexpected request");
      },
    });
    await window.dashboard.ready;
  });
  assert.equal(await page.evaluate(() => window.pageReads), 2);
  await page
    .getByRole("status")
    .filter({ hasText: "Unable to complete" })
    .waitFor();
  await page.getByRole("button", { name: "Invitations", exact: true }).click();
  await page.waitForFunction(
    () => typeof window.finishInvitations === "function",
  );
  await page
    .getByRole("button", { name: "My organizations", exact: true })
    .click();
  await page.evaluate(() => window.finishInvitations());
  await page
    .getByRole("heading", { name: "My organizations", exact: true })
    .waitFor();
  assert.equal(await page.getByText("late@example.test").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Accept invitation" }).count(),
    0,
  );
});

test("Manager workspace supports English/Hebrew desktop/mobile, organizations and deliberate gate actions", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) {
    for (const width of [1440, 390]) {
      await t.test(`${language} at ${width}px`, async () => {
        const context = await browser.newContext({
          viewport: { width, height: 950 },
        });
        t.after(() => context.close());
        const page = await context.newPage();
        const failures = [];
        page.on("pageerror", (e) => failures.push(e.message));
        await page.route(origin + "/manager-ui-test", (route) =>
          route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body style="margin:20px;background:#f5f8f6;font-family:Arial"><div id="root"></div></body></html>`,
          }),
        );
        await page.goto(origin + "/manager-ui-test");
        await page.evaluate(async (language) => {
          const { createManagerDashboard } =
            await import("/js/manager-dashboard.js");
          window.commands = [];
          window.requests = [];
          const system = {
            id: "system-one",
            name: language === "he" ? "שער חניון מרכזי" : "Central car park",
            type: "gate",
            iconId: "cantilever-gate-small",
            accessNote: { note: "East entrance <script>bad()</script>", residentName: "Acme", floorNumber: "0", apartmentNumber: "12B", parkingNumber: "P-2", address: "Haifa", addressLatitude: 0, addressLongitude: 0 },
            systemIds: ["gate-1"],
            status: "active",
            version: 1,
            orgId: null,
          };
          const api = async (path, method, body) => {
            window.requests.push({ path, method, body });
            if (path === "/me")
              return {
                role: "user",
                account: { id: "account-one" },
                organizations: [
                  {
                    id: "organization-one",
                    name:
                      language === "he" ? "בניין השקמה" : "Sycamore building",
                  },
                ],
              };
            if (
              path.startsWith("/systems?") ||
              path.startsWith("/organizations/organization-one/systems?")
            )
              return { items: [system], nextCursor: null };
            if (path.startsWith("/invitations?"))
              return { items: [], nextCursor: null };
            if (path === "/organizations")
              return { organization: { id: "new-org" } };
            throw new Error("Unexpected fixture request " + path);
          };
          class Connection {
            constructor({ onState }) {
              this.onState = onState;
            }
            async open() {
              this.onState("waiting");
              this.session = {};
              this.onState("active");
            }
            close() {
              this.session = null;
            }
            async command(cmd, payload) {
              window.commands.push({ cmd, payload });
              if (cmd === "ADMIN_GET_OVERVIEW")
                return {
                  data: {
                    systemId: "gate-1",
                    users: 18,
                    admins: 2,
                    state: "OK",
                  },
                };
              if (cmd === "ADMIN_GET_GATE_CONFIG")
                return {
                  data: {
                    config: {
                      command: "PULSE",
                      pulseWidth1Millis: 1000,
                      timeBetweenPulses1Seconds: 1,
                      pulseWidth2Millis: 1000,
                      timeBetweenPulses2Seconds: 1,
                      pulseWidth3Millis: 1000,
                    },
                    revision: 7,
                  },
                };
              if (cmd === "ADMIN_LIST_USERS")
                return {
                  data: {
                    items: [
                      {
                        name: "Fixture Resident",
                        countryCode: "972",
                        localNumber: "500000000",
                        email: "resident@example.test",
                      },
                    ],
                    revision: 9,
                    page: { nextCursor: null },
                  },
                };
              return { data: { accepted: true } };
            }
          }
          window.manager = createManagerDashboard({
            root: document.querySelector("#root"),
            user: { uid: "fixture" },
            language,
            api,
            Connection,
          });
          await window.manager.ready;
        }, language);
        const he = language === "he";
        assert.equal(await page.locator(".manager-hero, .manager-metrics, .manager-workspace-head").count(), 0);
        assert.deepEqual(await page.evaluate(() => window.commands), []);
        assert.equal(await page.locator(".manager-status").isVisible(), false);
        const icon = page.locator(".manager-system .manager-icon img");
        assert.equal(await icon.getAttribute("src"), "/assets/host-icons/gate-cantilever-gate-small.svg");
        await icon.evaluate(image => image.decode());
        assert.equal(await icon.getAttribute("alt"), "");
        await page.getByRole("button", { name: he ? "פרטי גישה" : "Access Note", exact: true }).click();
        const noteDialog = page.getByRole("dialog");
        assert.match(await noteDialog.innerText(), /Acme/);
        assert.match(await noteDialog.innerText(), /12B/);
        assert.match(await noteDialog.innerText(), /P-2/);
        assert.match(await noteDialog.innerText(), /East entrance <script>bad\(\)<\/script>/);
        assert.equal(await noteDialog.locator("script").count(), 0);
        assert.match(await noteDialog.locator("a").getAttribute("href"), /query=0%2C0$/);
        await noteDialog.getByRole("button", { name: he ? "סגירה" : "Close", exact: true }).click();

        await page
          .getByRole("button", {
            name: he ? "פתיחת סביבת ניהול" : "Open workspace",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: he ? "פתיחת שער" : "Open gate",
            exact: true,
          })
          .waitFor();
        assert.equal(
          (await page.evaluate(() => window.commands)).some(
            (c) => c.cmd === "ADMIN_REMOTE_OPEN",
          ),
          false,
        );
        await page
          .getByRole("button", {
            name: he ? "פתיחת שער" : "Open gate",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: he ? "ביטול" : "Cancel", exact: true })
          .click();
        assert.equal(
          (await page.evaluate(() => window.commands)).some(
            (c) => c.cmd === "ADMIN_REMOTE_OPEN",
          ),
          false,
        );
        await page
          .getByRole("button", {
            name: he ? "פתיחת שער" : "Open gate",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: he ? "אישור" : "Confirm", exact: true })
          .click();
        await page.waitForFunction(() =>
          window.commands.some((c) => c.cmd === "ADMIN_REMOTE_OPEN"),
        );
        await page
          .getByRole("tab", { name: he ? "הגדרות" : "Settings", exact: true })
          .click();
        await page
          .getByLabel(he ? "משך פולס ראשון (מילישניות)" : "First pulse (ms)", {
            exact: true,
          })
          .fill("1500");
        await page
          .getByRole("button", {
            name: he ? "שמירת הגדרות" : "Save settings",
            exact: true,
          })
          .click();
        if (process.env.WIFIGATE_MANAGER_UI_EVIDENCE) {
          await mkdir(process.env.WIFIGATE_MANAGER_UI_EVIDENCE, {
            recursive: true,
          });
          await page.screenshot({
            path: path.join(
              process.env.WIFIGATE_MANAGER_UI_EVIDENCE,
              `manager-settings-${language}-${width}.png`,
            ),
            fullPage: false,
          });
        }
        await page
          .getByRole("dialog")
          .getByRole("button", { name: he ? "אישור" : "Confirm", exact: true })
          .click();
        await page.waitForFunction(() =>
          window.commands.some((c) => c.cmd === "ADMIN_SET_GATE_CONFIG"),
        );
        const saved = (await page.evaluate(() => window.commands)).find(
          (c) => c.cmd === "ADMIN_SET_GATE_CONFIG",
        );
        assert.equal(saved.payload.expectedRevision, 7);
        assert.equal(saved.payload.pulseWidth1Millis, 1500);
        await page
          .getByRole("tab", { name: he ? "משתמשים" : "Users", exact: true })
          .click();
        await page.getByText("Fixture Resident", { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.deepEqual(failures, []);
        if (process.env.MANAGER_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_SCREENSHOTS}/manager-${language}-${width}.png`,
            fullPage: true,
          });
        await page.evaluate(() => window.manager.close());
        assert.equal(await page.locator("#root").textContent(), "");
      });
    }
  }
});
