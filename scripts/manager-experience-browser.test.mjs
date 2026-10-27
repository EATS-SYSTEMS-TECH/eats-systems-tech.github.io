import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const profile = {
  user: {
    uid: "fixture-user",
    name: "Example Operator",
    email: "operator@example.test",
  },
  role: "admin",
  roles: ["admin"],
  account: null,
  organizations: [],
};
const auth = {
  manager: "active",
  enrolled: true,
  verified: true,
  authTime: Math.floor(Date.now() / 1000),
};
const screenshot = async (page, name) => {
  if (process.env.MANAGER_UX_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.MANAGER_UX_SCREENSHOTS}/${name}.png`,
      fullPage: true,
    });
};

test("Manager has a directional orange shortcut and a dedicated three-count admin view with history navigation", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440]) {
      const { page, context, errors } = await scenario(browser, {
        ...auth,
        viewport: { width, height: 900 },
      });
      t.after(() => context.close());
      const calls = [];
      await context.route("**/api/v1/manager/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        calls.push(path);
        return route.fulfill({
          json: path.endsWith("/me")
            ? profile
            : path.endsWith("/admin/overview")
              ? {
                  admins: 2,
                  users: 12,
                  organizations: 4,
                  organizationAdmins: 99,
                }
              : { items: [], nextCursor: null },
        });
      });
      const suffix = language === "he" ? "?lang=he" : "";
      await page.goto(origin + "/dashboard/manager/" + suffix);
      const entry = page.locator(".manager-platform-entry");
      await entry.waitFor();
      assert.equal(
        calls.some((path) => path.endsWith("/admin/overview")),
        false,
      );
      assert.equal(
        await page.locator(".manager-platform-header").isHidden(),
        true,
      );
      const box = await entry.boundingBox();
      assert.ok(box.y + box.height <= 900 && box.y >= 750);
      assert.ok(language === "he" ? box.x > width / 2 : box.x < width / 2);
      assert.equal(
        await entry.evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgb(165, 61, 17)",
      );
      await screenshot(page, `manager-workspace-${language}-${width}`);
      await entry.click();
      await page.waitForURL(origin + "/dashboard/manager/platform/" + suffix);
      await page.locator(".manager-overview-card").last().waitFor();
      assert.equal(await page.locator(".manager-nav").isHidden(), true);
      assert.equal(await entry.isHidden(), true);
      assert.equal(
        await page.locator(".manager-platform-tabs button").count(),
        4,
      );
      assert.deepEqual(
        await page.locator(".manager-overview-card strong").allTextContents(),
        ["2", "12", "4"],
      );
      assert.equal(
        await page
          .getByText(
            language === "he" ? "מנהלי ארגונים" : "Organization admins",
            { exact: true },
          )
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await screenshot(page, `manager-administration-${language}-${width}`);
      await page.locator(".manager-workspace-back").click();
      await page.waitForURL(origin + "/dashboard/manager/" + suffix);
      await entry.waitFor();
      await page.goBack();
      await page.locator(".manager-overview-card").last().waitFor();
      assert.equal(
        new URL(page.url()).pathname,
        "/dashboard/manager/platform/",
      );
      assert.deepEqual(errors, []);
    }
});

test("direct Manager administration deep links require its live admin role and preserve the language through sign-in", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const role of ["admin", "user"]) {
    const { page, context } = await scenario(browser, auth);
    t.after(() => context.close());
    const calls = [];
    await context.route("**/api/v1/manager/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      calls.push(path);
      return route.fulfill({
        json: path.endsWith("/me")
          ? {
              ...profile,
              role,
              roles: [role],
              account: role === "user" ? { id: "customer" } : null,
            }
          : path.endsWith("/overview")
            ? { admins: 1, users: 2, organizations: 3 }
            : { items: [], nextCursor: null },
      });
    });
    await page.goto(origin + "/dashboard/manager/platform/?lang=he");
    if (role === "admin")
      await page.locator(".manager-overview-card").last().waitFor();
    else {
      await page
        .getByRole("heading", {
          name: "המסך זמין למנהלי Manager בלבד",
          exact: true,
        })
        .waitFor();
      assert.equal(
        calls.some((path) => path.includes("/admin/")),
        false,
      );
      assert.equal(
        await page.locator(".manager-platform-entry").isHidden(),
        true,
      );
    }
  }
});

test("slow API reads show progress and skeletons and failures offer a safe reload", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await scenario(browser, auth);
  t.after(() => context.close());
  let release,
    attempts = 0;
  await context.route("**/api/v1/manager/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) return route.fulfill({ json: profile });
    if (path.endsWith("/admin/overview")) {
      attempts++;
      if (attempts === 1) {
        await new Promise((resolve) => {
          release = resolve;
        });
        return route.fulfill({
          status: 503,
          json: { error: { code: "DEPENDENCY_UNAVAILABLE" } },
        });
      }
      return route.fulfill({ json: { admins: 1, users: 2, organizations: 3 } });
    }
    return route.fulfill({ json: { items: [], nextCursor: null } });
  });
  await page.goto(origin + "/dashboard/manager/platform/?lang=he");
  await page
    .locator(".manager-progress")
    .getByText("טוען את תמונת המצב…", { exact: true })
    .waitFor();
  assert.equal(
    await page.locator(".manager-view").getAttribute("aria-busy"),
    "true",
  );
  assert.equal(await page.locator(".manager-loading-panel").isVisible(), true);
  await screenshot(page, "manager-overview-loading-he");
  release();
  await page.locator(".manager-status[role=alert]").waitFor();
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.equal(await page.locator(".manager-loading-panel").count(), 0);
  await page.locator(".manager-retry").click();
  await page.locator(".manager-overview-card").last().waitFor();
  assert.equal(attempts, 2);
  assert.equal(await page.locator(".manager-retry").isHidden(), true);
  assert.deepEqual(errors, []);
});

test("a late failure cannot clear a new view's loading state or replace its content", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await scenario(browser, auth);
  t.after(() => context.close());
  let releaseOverview, releaseOrganizations;
  await context.route("**/api/v1/manager/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/me")) return route.fulfill({ json: profile });
    if (path.endsWith("/admin/overview")) {
      await new Promise((resolve) => {
        releaseOverview = resolve;
      });
      return route.fulfill({ status: 503, json: {} });
    }
    if (path.endsWith("/admin/organizations"))
      await new Promise((resolve) => {
        releaseOrganizations = resolve;
      });
    return route.fulfill({ json: { items: [], nextCursor: null } });
  });
  await page.goto(origin + "/dashboard/manager/platform/?lang=he");
  await page
    .locator(".manager-progress")
    .getByText("טוען את תמונת המצב…", { exact: true })
    .waitFor();
  await page
    .locator(".manager-platform-tabs")
    .getByRole("button", { name: "ארגונים", exact: true })
    .click();
  await page
    .locator(".manager-progress")
    .getByText("טוען ארגונים…", { exact: true })
    .waitFor();
  const oldResponse = page.waitForResponse((response) =>
    response.url().includes("/admin/overview"),
  );
  releaseOverview();
  await oldResponse;
  assert.equal(await page.locator(".manager-progress").isVisible(), true);
  assert.equal(
    await page.locator(".manager-view").getAttribute("aria-busy"),
    "true",
  );
  releaseOrganizations();
  await page.locator(".manager-empty-organizations").waitFor();
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.equal(await page.locator(".manager-status[role=alert]").count(), 0);
  assert.equal(await page.locator(".manager-overview-card").count(), 0);
  assert.deepEqual(errors, []);
});

test("saving forms show pending state, block duplicate submits and retain input after a failure", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route(origin + "/manager-saving-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="he" dir="rtl"><head><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"></body></html>',
    }),
  );
  await page.goto(origin + "/manager-saving-fixture");
  await page.evaluate(async () => {
    const { createManagerDialog } = await import("/js/manager-dialog.js");
    window.saved = [];
    window.dialogs = createManagerDialog({ language: "he" });
    window.result = window.dialogs.form({
      title: "ארגון חדש",
      message: "",
      fields: [["name", "שם ארגון"]],
      submitLabel: "שמירה",
      errorText: () => "השמירה נכשלה. נסו שוב.",
      onSubmit: async (values) => {
        window.saved.push(values);
        await new Promise((resolve, reject) => {
          window.finishSave = resolve;
          window.failSave = () => reject(new Error("NETWORK_ERROR"));
        });
      },
    });
  });
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("שם ארגון", { exact: true }).fill("Example Hotel");
  await dialog.getByRole("button", { name: "שמירה", exact: true }).click();
  await dialog.locator(".manager-dialog-progress").waitFor();
  assert.equal(await dialog.locator("form").getAttribute("aria-busy"), "true");
  assert.equal(
    await dialog
      .getByRole("button", { name: "שמירה", exact: true })
      .isDisabled(),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), true);
  await dialog.locator("form").evaluate((form) => form.requestSubmit());
  assert.equal(await page.evaluate(() => window.saved.length), 1);
  await page.evaluate(() => window.failSave());
  await dialog.getByRole("alert").waitFor();
  assert.equal(
    await dialog.getByLabel("שם ארגון", { exact: true }).inputValue(),
    "Example Hotel",
  );
  assert.equal(
    await dialog.locator(".manager-dialog-progress").isHidden(),
    true,
  );
  await dialog.getByRole("button", { name: "שמירה", exact: true }).click();
  await page.evaluate(() => window.finishSave());
  await dialog.waitFor({ state: "detached" });
  assert.deepEqual(await page.evaluate(() => window.saved), [
    { name: "Example Hotel" },
    { name: "Example Hotel" },
  ]);
});

async function gateFixture(t, browser, origin, language = "he", width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  t.after(() => page.close());
  await page.route(origin + "/manager-feedback-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div id="root"></div></main></body></html>`,
    }),
  );
  await page.goto(origin + "/manager-feedback-fixture");
  await page.evaluate(async (language) => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    window.connections = [];
    window.commands = [];
    class Connection {
      constructor({ onState }) {
        this.onState = onState;
        window.connections.push(this);
      }
      async open() {
        this.onState("waiting");
        await new Promise((resolve, reject) => {
          this.finish = () => {
            this.session = {};
            this.onState("active");
            resolve();
          };
          this.fail = (code = "NO_COMMUNICATION") => reject(typeof code === "object" ? Object.assign(new Error("Connection failed"), code) : new Error(code));
          this.cancel = () => reject(new Error("CANCELLED"));
        });
      }
      close() {
        this.session = null;
        if (!this.deferCancellation) this.cancel?.();
      }
      async command(cmd) {
        window.commands.push(cmd);
        if (cmd === "ADMIN_GET_OVERVIEW")
          return new Promise((resolve, reject) => {
            this.failRead = () => reject(new Error("NO_COMMUNICATION"));
            this.finishRead = () =>
              resolve({ data: { users: 12, admins: 1, state: "OK" } });
          });
        return { data: { accepted: true } };
      }
    }
    const api = async (path) =>
      path === "/me"
        ? { role: "user", account: { id: "owner" }, organizations: [] }
        : {
            items: [
              {
                id: "test",
                name: "שער לדוגמה בבדיקה",
                type: "gate",
                systemIds: ["synthetic-gate"],
                status: "active",
                version: 1,
                accessNote: {
                  residentName: "Example Resident",
                  note: "Have a good day ;)",
                  address: "123 Example Avenue, Example City",
                  floorNumber: "0",
                },
              },
            ],
            nextCursor: null,
          };
    window.dashboard = createManagerDashboard({
      root: document.querySelector("#root"),
      user: { uid: "test" },
      language,
      api,
      Connection,
    });
    await window.dashboard.ready;
  }, language);
  return page;
}

async function assertCleanConnectionPage(page, { readyToReconnect = false } = {}) {
  assert.equal(await page.locator(".manager-status").innerText(), "", "the page does not repeat a connection error or stale connected status");
  assert.notEqual(await page.locator(".manager-status").getAttribute("data-state"), "error");
  assert.equal(await page.locator(".manager-connection-recovery h3, .manager-connection-recovery p").count(), 0, "recovery keeps controls without a second explanation");
  if (readyToReconnect) {
    await page.getByRole("button", { name: /^(?:חיבור מחדש לשער|Reconnect to gate)$/ }).waitFor();
    assert.equal(await page.locator(".manager-system-menu summary").isVisible(), true);
    assert.equal(await page.locator(".manager-progress").isHidden(), true);
    assert.equal(await page.locator(".manager-loading-panel").count(), 0);
    assert.equal(await page.locator(".manager-view").getAttribute("aria-busy"), "false");
  }
}

test("gate connection exposes waiting, verification, success and live-data loading without issuing a gate action", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page
    .locator('.manager-connection-dialog[data-stage="waiting"]')
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "ביטול וחזרה", exact: true })
      .isEnabled(),
    true,
  );
  await screenshot(page, "manager-connection-waiting-he-390");
  await page.evaluate(() => window.connections[0].onState("connecting"));
  await page
    .locator('.manager-connection-dialog[data-stage="connecting"]')
    .waitFor();
  await page.evaluate(() => window.connections[0].finish());
  await page
    .locator('.manager-connection-dialog[data-stage="loading"]')
    .waitFor();
  await page.waitForFunction(
    () => typeof window.connections[0].finishRead === "function",
  );
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.equal(await page.locator(".manager-loading-panel").count(), 0);
  assert.equal(
    await page.getByRole("progressbar").getAttribute("aria-valuenow"),
    "2",
  );
  assert.equal(
    await page.locator("#manager-content").evaluate((el) => el.inert),
    true,
  );
  await page.evaluate(() => window.connections[0].finishRead());
  await page
    .locator(".manager-connection-dialog")
    .waitFor({ state: "detached" });
  await page.getByRole("button", { name: "פתיחת שער", exact: true }).waitFor();
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.equal(
    await page.locator("#manager-content").evaluate((el) => el.inert),
    false,
  );
  assert.deepEqual(await page.evaluate(() => window.commands), [
    "ADMIN_GET_OVERVIEW",
  ]);
  await screenshot(page, "manager-connection-success-he-390");
});

test("failed and cancelled connections stop their spinners and offer recovery without replaying commands", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page
    .locator('.manager-connection-dialog[data-stage="waiting"]')
    .waitFor();
  await page.evaluate(() => window.connections[0].fail());
  await page
    .locator('.manager-connection-dialog[data-state="error"]')
    .waitFor();
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  await screenshot(page, "manager-connection-failure-he-390");
  await page
    .getByRole("button", { name: "ניסיון חיבור נוסף", exact: true })
    .click();
  await page
    .locator('.manager-connection-dialog[data-stage="waiting"]')
    .waitFor();
  await page.getByRole("button", { name: "ביטול וחזרה", exact: true }).click();
  await page
    .getByRole("heading", { name: "המערכות שלי", exact: true })
    .waitFor();
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
  assert.deepEqual(await page.evaluate(() => window.commands), []);
});

test("first data failure stays in the connection popup and never reports a ready workspace", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page.evaluate(() => window.connections[0].finish());
  await page.waitForFunction(
    () => typeof window.connections[0].failRead === "function",
  );
  await page.evaluate(() => window.connections[0].failRead());
  const failure = page.locator(
    '.manager-connection-dialog[data-state="error"]',
  );
  await failure.waitFor();
  await assertCleanConnectionPage(page);
  assert.equal(
    await failure.getByRole("progressbar").getAttribute("aria-valuenow"),
    "2",
  );
  assert.equal(
    await page
      .locator('.manager-connection-dialog[data-state="complete"]')
      .count(),
    0,
  );
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.deepEqual(await page.evaluate(() => window.commands), [
    "ADMIN_GET_OVERVIEW",
  ]);
  await page.evaluate(() => window.dashboard.close());
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
});

test("cancelling during initial data loading fences late reads and removes the modal", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page.evaluate(() => window.connections[0].finish());
  await page.waitForFunction(
    () => typeof window.connections[0].finishRead === "function",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("heading", { name: "המערכות שלי", exact: true })
    .waitFor();
  await page.evaluate(() => window.connections[0].finishRead());
  assert.equal(
    await page.locator(".manager-connection-dialog, #manager-content").count(),
    0,
  );
  assert.equal(await page.locator(".manager-progress").isHidden(), true);
  assert.deepEqual(await page.evaluate(() => window.commands), [
    "ADMIN_GET_OVERVIEW",
  ]);
});

test("a revoked local Manager authorization explains the failure and keeps metadata actions available without a live gate", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page
    .locator('.manager-connection-dialog[data-stage="waiting"]')
    .waitFor();
  await page.evaluate(() => window.connections[0].fail("CREDENTIAL_REVOKED"));
  const failure = page.locator(
    '.manager-connection-dialog[data-state="error"]',
  );
  await failure.waitFor();
  assert.match(await failure.innerText(), /השער דחה את הרשאת Manager/);
  assert.match(await failure.innerText(), /ייתכן שאישור זמני פג/);
  assert.match((await failure.locator(".manager-connection-dialog__recovery li").allTextContents())[0], /נסו תחילה חיבור נוסף/);
  assert.match(await failure.innerText(), /כמנהל מקומי שהרשאתו עדיין תקפה/);
  assert.match(await failure.innerText(), /תפריט החשבון דרך תמונת הפרופיל/);
  assert.match(await failure.innerText(), /WIFIGATE Manager ולחצו ״סנכרון״ בכרטיס המערכת/);
  assert.match(await failure.innerText(), /האתר אינו יכול לחדש אותה מרחוק/);
  await assertCleanConnectionPage(page);
  await failure
    .getByRole("button", { name: "לפרטי המערכת", exact: true })
    .click();
  await assertCleanConnectionPage(page, { readyToReconnect: true });
  assert.doesNotMatch(await page.locator(".manager-shell").innerText(), /השער דחה את הרשאת Manager|כמנהל מקומי שהרשאתו עדיין תקפה|CREDENTIAL_REVOKED/);
  await page.locator(".manager-system-menu summary").click();
  await page.getByRole("button", { name: "פרטי גישה", exact: true }).click();
  assert.match(await page.getByRole("dialog").innerText(), /Example Resident/);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "סגירה", exact: true })
    .click();
  await page.locator(".manager-system-menu summary").click();
  await page.locator(".manager-system-menu summary").press("Escape");
  assert.equal(
    await page.locator(".manager-system-menu").getAttribute("open"),
    null,
  );
  assert.deepEqual(await page.evaluate(() => window.commands), []);
});

test("connection errors give localized recovery steps and safe optional diagnostics without exposing backend details", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) {
    const page = await gateFixture(t, browser, origin, language, language === "he" ? 390 : 1440);
    await page.getByRole("button", { name: language === "he" ? "פתיחת סביבת ניהול" : "Open workspace", exact: true }).click();
    const failure = page.locator('.manager-connection-dialog[data-state="error"]');
    const cases = [
      ["CREDENTIAL_REVOKED", language === "he" ? /ליד המערכת/ : /near the system/],
      ["CREDENTIAL_UNKNOWN", language === "he" ? /שהרשאתו עדיין תקפה/ : /whose access is still valid/],
      ["NO_COMMUNICATION", language === "he" ? /מופעלת ומחוברת לאינטרנט/ : /powered on and online/],
      ["BUSY", language === "he" ? /חיבור ניהול אחר/ : /Another management session/],
      ["STORAGE_BUSY", language === "he" ? /המתינו מעט/ : /Wait a moment/],
      ["MANAGER_ACCESS_DENIED", language === "he" ? /מנהל הארגון/ : /organization administrator/],
      ["RESPONSE_TIMEOUT", language === "he" ? /בדקו את המצב העדכני ואת ההיסטוריה/ : /check the current state and history/],
      ["VERSION_UNSUPPORTED", language === "he" ? /לעדכן את קושחת המערכת/ : /update the system firmware/],
      ["PRIVATE_UNKNOWN_FAILURE", language === "he" ? /מזהה המערכת והזמן/ : /system ID and the time/],
    ];
    for (const [index, [code, expected]] of cases.entries()) {
      await page.waitForFunction((index) => typeof window.connections[index]?.fail === "function", index);
      await page.evaluate(({ index, code }) => window.connections[index].fail({ code, message: "PRIVATE_BACKEND_MESSAGE token=SECRET_SAMPLE", reason: "PRIVATE_SERVER_REASON" }), { index, code });
      await failure.waitFor();
      await assertCleanConnectionPage(page);
      const text = await failure.innerText();
      assert.match(text, expected);
      assert.doesNotMatch(text, /PRIVATE_BACKEND_MESSAGE|SECRET_SAMPLE|PRIVATE_SERVER_REASON|PRIVATE_UNKNOWN_FAILURE/);
      assert.equal(await failure.locator(".manager-connection-dialog__recovery ol li").count() > 0, true);
      const diagnostics = failure.locator(".manager-connection-dialog__diagnostics");
      if (code === "PRIVATE_UNKNOWN_FAILURE") assert.equal(await diagnostics.count(), 0);
      else {
        assert.doesNotMatch(text, new RegExp(code), "technical code is collapsed by default");
        await diagnostics.locator("summary").click();
        assert.equal(await diagnostics.locator("code").innerText(), code);
      }
      assert.equal(await failure.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth), true);
      const dismiss = await failure.getByRole("button", { name: language === "he" ? "לפרטי המערכת" : "View system details", exact: true }).boundingBox();
      assert.ok(dismiss && dismiss.y >= 0 && dismiss.y + dismiss.height <= 900 && dismiss.height >= 44, "recovery actions stay visible and touch sized");
      await failure.getByRole("button", { name: language === "he" ? "לפרטי המערכת" : "View system details", exact: true }).click();
      await assertCleanConnectionPage(page, { readyToReconnect: true });
      assert.equal(await failure.count(), 0);
      assert.doesNotMatch(await page.locator(".manager-shell").innerText(), expected, "dismissed recovery guidance does not remain on the page");
      assert.doesNotMatch(await page.locator(".manager-shell").innerText(), new RegExp(code));
      await page.evaluate(({ index, code }) => window.connections[index].onState(code), { index, code });
      assert.equal(await failure.count(), 0, "a repeated failure notification cannot reopen a dismissed error");
      await assertCleanConnectionPage(page, { readyToReconnect: true });
      if (index < cases.length - 1) await page.getByRole("button", { name: language === "he" ? "חיבור מחדש לשער" : "Reconnect to gate", exact: true }).click();
    }
    assert.deepEqual(await page.evaluate(() => window.commands), []);
    await page.evaluate(() => window.dashboard.close());
  }
});

test("disconnects during completion or after a ready workspace show one popup and dismiss to clean metadata", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const completionFinished of [false, true]) {
    const page = await gateFixture(t, browser, origin, "en");
    await page.clock.install();
    await page.getByRole("button", { name: "Open workspace", exact: true }).click();
    await page.evaluate(() => window.connections[0].finish());
    await page.waitForFunction(() => typeof window.connections[0].finishRead === "function");
    await page.evaluate(() => window.connections[0].finishRead());
    await page.locator('.manager-connection-dialog[data-state="complete"]').waitFor();
    if (completionFinished) {
      await page.clock.fastForward(500);
      await page.locator(".manager-connection-dialog").waitFor({ state: "detached" });
    }
    await page.evaluate(() => { window.connections[0].onState("DISCONNECTED"); window.connections[0].close(); });
    const failure = page.locator('.manager-connection-dialog[data-state="error"]');
    await failure.waitFor();
    assert.match(await failure.innerText(), /active connection ended|system disconnected/i);
    await assertCleanConnectionPage(page);
    await page.clock.fastForward(1000);
    assert.equal(await failure.count(), 1, "the old completion timer cannot remove the failure popup");
    await failure.getByRole("button", { name: "View system details", exact: true }).click();
    await assertCleanConnectionPage(page, { readyToReconnect: true });
    await page.evaluate(() => window.connections[0].onState("DISCONNECTED"));
    assert.equal(await failure.count(), 0);
    assert.deepEqual(await page.evaluate(() => window.commands), ["ADMIN_GET_OVERVIEW"]);
    await page.evaluate(() => window.dashboard.close());
  }
});

test("a late open rejection after error dismissal cannot repeat the popup or page explanation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await gateFixture(t, browser, origin, "en");
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => typeof window.connections[0]?.fail === "function");
  await page.evaluate(() => { window.connections[0].deferCancellation = true; window.connections[0].onState("NO_COMMUNICATION"); });
  const failure = page.locator('.manager-connection-dialog[data-state="error"]');
  await failure.waitFor();
  assert.match(await failure.innerText(), /system did not respond/i);
  await assertCleanConnectionPage(page);
  await failure.getByRole("button", { name: "View system details", exact: true }).click();
  await page.evaluate(() => window.connections[0].fail("NO_COMMUNICATION"));
  await page.waitForFunction(() => document.querySelector(".manager-view").getAttribute("aria-busy") === "false");
  await assertCleanConnectionPage(page, { readyToReconnect: true });
  assert.equal(await failure.count(), 0, "the still-pending open catch is fenced by the first failure");
  await page.evaluate(() => window.connections[0].onState("NO_COMMUNICATION"));
  assert.equal(await failure.count(), 0);
  assert.deepEqual(await page.evaluate(() => window.commands), []);
});
