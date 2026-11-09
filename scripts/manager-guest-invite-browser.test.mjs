import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";
import { managerGuestWindow } from "../js/manager-guest-invite.js";

test("a guest window is a named, future window of at most 31 days", () => {
  const now = Date.parse("2026-11-09T12:00:00");
  const base = { name: " Plumber ", from: "2026-11-09T12:00", until: "2026-11-10T12:00", now };
  assert.deepEqual(managerGuestWindow(base), {
    name: "Plumber", phone: undefined,
    nb: Date.parse("2026-11-09T12:00") / 1000, na: Date.parse("2026-11-10T12:00") / 1000,
  });
  assert.equal(managerGuestWindow({ ...base, name: "  " }).error, "name");
  assert.equal(managerGuestWindow({ ...base, name: "א".repeat(17) }).error, "nameLength");
  assert.equal(managerGuestWindow({ ...base, phone: "0501234567" }).error, "phone");
  assert.equal(managerGuestWindow({ ...base, phone: "+201012345678" }).phone, "+201012345678");
  assert.equal(managerGuestWindow({ ...base, until: base.from }).error, "order");
  assert.equal(managerGuestWindow({ ...base, from: "2026-11-08T10:00", until: "2026-11-08T11:00" }).error, "past");
  assert.equal(managerGuestWindow({ ...base, until: "2026-12-10T12:01" }).error, "length");
});

test("Guests tab invites a guest: the gate signs, Manager seals, the link is ready to send", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) for (const mode of ["real", "sample"]) {
    await t.test(`${language}/${width}/${mode}`, async t => {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(8000);
      t.after(() => page.close());
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route(origin + "/guest-fixture", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>` }));
      await page.goto(origin + "/guest-fixture");
      await page.evaluate(async language => {
        const { createManagerDashboard } = await import("/js/manager-dashboard.js");
        const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
        const { createManagerExampleData, managerExampleSystems } = await import("/js/manager-example-data.js");
        const data = createManagerExampleData(), template = managerExampleSystems[0];
        window.commands = []; window.requests = [];
        window.WebSocket = class { constructor() { throw new Error("No physical transport in guest fixtures"); } };
        class Connection extends ManagerExampleConnection {
          constructor(options) { super({ data, system: template, onState: options.onState }); }
          async command(command, payload) { window.commands.push({ command, payload }); return super.command(command, payload); }
        }
        window.dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "guest-fixture" }, language, Connection,
          api: async (path, method, body) => {
            window.requests.push({ path, method, body });
            if (path === "/me") return { role: "user", account: { id: "fixture" }, organizations: [] };
            if (path.endsWith("/guest-links")) return { url: "https://wifigate.io/wifigate-api/?ep=v1.sealed", name: "Plumber", notBefore: 1794200000, notAfter: 1794286400, generation: 0 };
            return { items: path.startsWith("/systems?") ? [{ ...template, id: "real-fixture", status: "active" }] : [], nextCursor: null };
          } });
        await window.dashboard.ready;
      }, language);
      const he = language === "he", copy = (h, e) => he ? h : e;
      if (mode === "sample") await page.locator(".manager-examples > summary").click();
      const card = mode === "sample" ? page.locator('[data-example-system="example-manager-gate"]') : page.locator(".manager-view > .manager-grid .manager-system");
      await card.getByRole("button", { name: copy("פתיחת סביבת ניהול", "Open workspace"), exact: true }).click();
      await page.locator('[data-tab="guests"]').click();
      const section = page.locator(".manager-guest-invite");
      await section.waitFor();
      const capture = async suffix => {
        if (!process.env.MANAGER_GUEST_EVIDENCE) return;
        await mkdir(process.env.MANAGER_GUEST_EVIDENCE, { recursive: true });
        await page.screenshot({ path: `${process.env.MANAGER_GUEST_EVIDENCE}/guest-${language}-${width}-${mode}-${suffix}.png` });
      };
      await capture("tab");
      await section.getByRole("button", { name: copy("הזמנת אורח", "Invite a guest"), exact: true }).click();
      const dialog = page.getByRole("dialog", { name: copy("הזמנת אורח", "Invite a guest") });
      await dialog.waitFor();
      assert.equal(await dialog.evaluate(d => d.open && d.matches(":modal")), true, "the invitation is a modal popup");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "the popup fits the viewport");
      await capture("form");
      const create = dialog.getByRole("button", { name: copy("יצירת קישור", "Create link"), exact: true });
      await create.click();
      await dialog.getByRole("alert").getByText(copy("נא להזין את שם האורח.", "Enter the guest's name.")).waitFor();
      assert.equal(await page.evaluate(() => window.commands.some(c => c.command === "ADMIN_ISSUE_GUEST_PASS")), false, "nothing reaches the gate before the form is valid");
      await dialog.locator('[name="name"]').fill("Plumber");
      await dialog.locator('[name="phone"]').fill("+201012345678");
      await create.click();
      const ready = page.getByRole("dialog", { name: copy("קישור האורח מוכן", "The guest link is ready") });
      await ready.waitFor();
      await capture("link");
      const link = await ready.locator("input.manager-guest-link").inputValue();
      const sealed = await page.evaluate(() => window.requests.find(r => r.path.endsWith("/guest-links")));
      if (mode === "real") {
        // A sample workspace runs the dashboard's own example connection.
        const issued = await page.evaluate(() => window.commands.find(c => c.command === "ADMIN_ISSUE_GUEST_PASS").payload);
        assert.deepEqual(Object.keys(issued).sort(), ["na", "name", "nb"]);
        assert.equal(issued.name, "Plumber");
        assert.equal(issued.na - issued.nb, 86400, "a day by default");
        assert.equal(link, "https://wifigate.io/wifigate-api/?ep=v1.sealed");
        assert.equal(sealed.method, "POST");
        assert.match(sealed.path, /^\/systems\/[^/]+\/guest-links$/);
        assert.equal(sealed.body.phone, "+201012345678");
        assert.match(sealed.body.gp, /^example-/);
      } else {
        assert.equal(sealed, undefined, "a sample workspace never asks the server to seal");
        assert.match(link, /^https:\/\/wifigate\.io\/wifigate-link\/\?ep=v1\.demo_/);
      }
      const mail = await ready.getByRole("button", { name: copy("שליחה באימייל", "Send by e-mail") }).getAttribute("data-href");
      assert.match(mail, /^mailto:\?subject=/);
      assert.ok(decodeURIComponent(mail).includes(link), "the e-mail carries the link");
      await ready.getByRole("button", { name: copy("סיום", "Done"), exact: true }).click();
      assert.equal(await page.locator("dialog.manager-guest-dialog").evaluate(d => d.open), false);
      assert.deepEqual(errors, []);
    });
  }
});
