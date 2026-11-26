import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { passGateGame } from "./gate-game-helper.mjs";

const factoryRoute = "/dashboard/factory/?lang=he";
const permissions = {
  enrolled: true,
  verified: true,
  host: "no-plan",
  hostRole: null,
  pay: "no-plan",
  manager: "no-plan",
};

test("Factory appears beneath the plans and only founders see its founder shortcut", async (t) => {
  const { origin, browser } = await startSite(t);
  const scenarios = [
    { name: "founder", options: { platformRole: "admin", host: "active" }, founder: true, allowed: true },
    { name: "Factory-only member", options: { factoryAccess: true, mobile: true }, founder: false, allowed: true },
    { name: "ordinary customer", options: { host: "active", factoryAccess: false }, founder: false, allowed: false },
  ];
  for (const entry of scenarios) {
    const { context, page, errors } = await scenario(browser, { ...permissions, ...entry.options });
    try {
      await page.goto(origin + "/dashboard/?lang=he");
      await page.locator('#platform-status[data-state="ready"]').waitFor({ state: "attached" });
      const card = page.locator("#profile-subscriptions + #profile-factory");
      const shortcut = page.locator(".platform-admin-tools #platform-factory-founder-entry");
      assert.equal(await card.count(), Number(entry.allowed), entry.name);
      assert.equal(await shortcut.count(), Number(entry.founder), entry.name);
      if (entry.allowed) {
        assert.equal(await card.locator("a").getAttribute("href"), factoryRoute);
        await card.locator("a").click();
        await page.getByRole("heading", { name: "WIFIGATE Factory", exact: true }).waitFor();
        assert.equal(await page.locator("#product-workspace").isVisible(), true);
      }
      assert.deepEqual(errors, [], entry.name);
    } finally {
      await context.close();
    }
  }
});

test("direct Factory navigation rejects an ordinary account and prompts for a second factor when needed", async (t) => {
  const { origin, browser } = await startSite(t);
  const scenarios = [
    { options: { host: "active", factoryAccess: false }, selector: "#platform-status", text: /אין לחשבון/ },
    { options: { factoryAccess: true, verified: false }, selector: "#platform-security", text: /אימות/ },
  ];
  for (const { options, selector, text } of scenarios) {
    const { context, page } = await scenario(browser, { ...permissions, ...options });
    try {
      await page.goto(origin + factoryRoute);
      await page.locator('#platform-status[data-state="ready"]').waitFor({ state: "attached" });
      const selected = page.locator(selector);
      assert.equal(await selected.isVisible(), true);
      assert.match(await selected.innerText(), text);
      assert.equal(await page.locator("#product-workspace").isVisible(), false);
    } finally {
      await context.close();
    }
  }
});

test("a removed Factory grant clears the workspace at the next access check", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page, state } = await scenario(browser, { ...permissions, host: "active", factoryAccess: true });
  t.after(() => context.close());
  await page.goto(origin + factoryRoute);
  await page.getByRole("heading", { name: "WIFIGATE Factory", exact: true }).waitFor();
  state.factoryAccess = false;
  await page.evaluate(() => window.dispatchEvent(new Event("platform:refresh")));
  await page.getByText(/אין לחשבון הזה הרשאה/).waitFor();
  assert.equal(await page.locator("#product-workspace").isVisible(), false);
  assert.equal(await page.getByRole("heading", { name: "WIFIGATE Factory", exact: true }).count(), 0);
});

test("a Factory-only user can sign in from the exclusive workspace link", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page, calls } = await scenario(browser, {
    ...permissions, factoryAccess: true, signedIn: false, verified: false,
  });
  t.after(() => context.close());
  await page.goto(origin + factoryRoute);
  await page.waitForURL((url) => url.pathname === "/he/login/" && url.searchParams.get("next") === factoryRoute);
  await (await passGateGame(page, "google")).click();
  const dialog = page.locator("#mfa-challenge");
  await dialog.locator("input[name=code]").fill("123456");
  await dialog.locator("button[type=submit]").click();
  await page.waitForURL(origin + factoryRoute);
  await page.getByRole("heading", { name: "WIFIGATE Factory", exact: true }).waitFor();
  assert.ok(calls.some((entry) => entry?.path === "/api/v1/platform/login" && entry.method === "POST"));
});
