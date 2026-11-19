// "Remember me on this device" on /login/ and /reservations/
// (js/host-login.js, js/reservations-page.js, js/site-auth.js). Unchecked, a
// sign-in is kept in session storage (until the tab closes); checked, in local
// storage. Page loads never choose: Auth starts with session storage first,
// so a restored account stays where it was saved. A redirect sign-in carries
// the choice across the redirect in session storage and is moved to the chosen
// storage when it returns. The Firebase SDK is a fixture here; the real SDK's
// page-load behaviour is in site-auth-real-sdk-browser.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { passGateGame } from "./gate-game-helper.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const REMEMBER_KEY = "wifigate-auth-remember";
const ORDER = ["session", "local", "indexedDB"];
const starts = (calls) => calls.filter((event) => event?.type === "init").map((event) => event.persistence);
const choices = (calls) => calls.filter((event) => event?.type === "persistence").map((event) => event.mode);

test("an unchecked sign-in is kept for the tab only and page loads never choose", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, { signedIn: false });
  t.after(() => fixture.context.close());
  const { page, calls } = fixture;
  await page.goto(origin + "/login/");
  await page.locator('[data-provider="google"]:enabled').waitFor();
  const box = page.getByRole("checkbox", { name: "Remember me on this device" });
  assert.equal(await box.isChecked(), false);
  assert.equal(await box.isEnabled(), true);
  assert.deepEqual(starts(calls), [ORDER]);
  assert.deepEqual(choices(calls), [], "loading the sign-in page chooses no storage");
  await (await passGateGame(page, "google")).click();
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard/"));
  await page.locator(".product-tile").first().waitFor();
  assert.deepEqual(choices(calls), ["session"]);
  assert.ok(calls.indexOf(calls.find((event) => event?.type === "persistence")) < calls.indexOf("signin"));
  for (const start of starts(calls)) assert.deepEqual(start, ORDER);
  assert.deepEqual(fixture.errors, []);
});

test("a checked sign-in is remembered in local storage, from the keyboard and in Hebrew", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, { signedIn: false, viewport: { width: 390, height: 844 } });
  t.after(() => fixture.context.close());
  const { page, calls } = fixture;
  await page.goto(origin + "/he/login/");
  await page.locator('[data-provider="google"]:enabled').waitFor();
  const box = page.getByRole("checkbox", { name: "זכור אותי במכשיר הזה" });
  await box.focus();
  assert.equal(await box.evaluate((input) => input.matches(":focus-visible")), true);
  await page.keyboard.press("Space");
  assert.equal(await box.isChecked(), true);
  // The whole label toggles it.
  await page.locator(".app-login__remember span").click();
  assert.equal(await box.isChecked(), false);
  await page.locator(".app-login__remember span").click();
  assert.equal(await box.isChecked(), true);
  await (await passGateGame(page, "google")).click();
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard/"));
  await page.locator(".product-tile").first().waitFor();
  assert.deepEqual(choices(calls), ["local"]);
  assert.deepEqual(fixture.errors, []);
});

test("a second-factor sign-in keeps the chosen storage and the box is locked while it runs", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const remember of [true, false]) {
    await t.test(remember ? "remembered" : "tab only", async (t) => {
      const fixture = await scenario(browser, { signedIn: false, enrolled: true, admin: true, verified: false });
      t.after(() => fixture.context.close());
      const { page, calls } = fixture;
      await page.goto(origin + "/login/");
      await page.locator('[data-provider="google"]:enabled').waitFor();
      if (remember) await page.locator("#login-remember").check();
      await (await passGateGame(page, "google")).click();
      const code = page.locator('#mfa-challenge input[name="code"]');
      await code.waitFor();
      assert.equal(await page.locator("#login-remember").isDisabled(), true, "the choice cannot change mid sign-in");
      await code.fill("123456");
      await page.locator('#mfa-challenge button[type="submit"]').click();
      await page.waitForURL((url) => url.pathname.startsWith("/dashboard/"));
      assert.ok(calls.includes("verify"));
      // Chosen once, before the provider window; the second factor does not change it.
      assert.deepEqual(choices(calls), [remember ? "local" : "session"]);
      assert.deepEqual(fixture.errors, []);
    });
  }
});

test("a redirect sign-in is kept where it was chosen, and the choice is used once", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const { remember, enrolled } of [
    { remember: true, enrolled: false },
    { remember: false, enrolled: false },
    { remember: true, enrolled: true },
  ]) {
    await t.test(`${remember ? "remembered" : "tab only"}${enrolled ? " with a second factor" : ""}`, async (t) => {
      const fixture = await scenario(browser, { signedIn: false, popupBlocked: true, enrolled, admin: enrolled, verified: false });
      t.after(() => fixture.context.close());
      const { page, calls } = fixture;
      await page.goto(origin + "/login/");
      await page.locator('[data-provider="google"]:enabled').waitFor();
      if (remember) await page.locator("#login-remember").check();
      await (await passGateGame(page, "google")).click();
      for (let wait = 0; !calls.includes("redirect"); wait++) {
        assert.ok(wait < 100, "the blocked window moves to the redirect sign-in");
        await page.waitForTimeout(50);
      }
      assert.deepEqual(
        calls.filter((event) => event?.type === "redirect-choice").map((event) => event.remember),
        [remember ? "1" : null],
      );
      // The provider returns to the sign-in page: the account is moved to the
      // chosen storage once the sign-in completes, and the key is removed.
      const before = calls.length;
      fixture.state.popupBlocked = false;
      await page.reload();
      if (enrolled) {
        const code = page.locator('#mfa-challenge input[name="code"]');
        await code.fill("123456");
        await page.locator('#mfa-challenge button[type="submit"]').click();
      }
      await page.waitForURL((url) => url.pathname.startsWith("/dashboard/"));
      const returned = calls.slice(before);
      assert.deepEqual(starts(returned)[0], ORDER, "the return page starts Auth like any other load");
      const signin = returned.indexOf("signin");
      assert.ok(signin >= 0);
      assert.deepEqual(choices(returned.slice(signin)), [remember ? "local" : "session"]);
      assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), REMEMBER_KEY), null);
      // A new anonymous sign-in starts unchecked. A still-signed-in account
      // is automatically redirected and cannot reliably expose this form.
      fixture.state.signedIn = false;
      await page.goto(origin + "/login/?reason=no-account");
      assert.equal(await page.locator("#login-remember").isChecked(), false, "every visit starts unchecked");
      assert.deepEqual(fixture.errors, []);
    });
  }
});

test("going back from an abandoned redirect forgets the choice", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, { signedIn: false });
  t.after(() => fixture.context.close());
  const { page } = fixture;
  await page.goto(origin + "/login/");
  await page.locator('[data-provider="google"]:enabled').waitFor();
  await page.evaluate((key) => {
    sessionStorage.setItem(key, "1");
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  }, REMEMBER_KEY);
  assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), REMEMBER_KEY), null);
  assert.deepEqual(fixture.errors, []);
});

test("the /reservations/ sign-in offers the same choice", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const remember of [false, true]) {
    await t.test(remember ? "remembered" : "tab only", async (t) => {
      const fixture = await scenario(browser, { signedIn: false });
      t.after(() => fixture.context.close());
      const { page, calls } = fixture;
      await page.goto(origin + "/reservations/");
      const box = page.getByRole("checkbox", { name: "Remember me on this device" });
      await box.waitFor();
      assert.equal(await box.isChecked(), false);
      if (remember) await box.check();
      await page.locator('#reservations-sign-in [data-provider="google"]').click();
      for (let wait = 0; !calls.includes("signin"); wait++) {
        assert.ok(wait < 100, "the sign-in completes");
        await page.waitForTimeout(50);
      }
      assert.deepEqual(choices(calls), [remember ? "local" : "session"]);
      for (const start of starts(calls)) assert.deepEqual(start, ORDER);
      assert.deepEqual(fixture.errors, []);
    });
  }
});

const pagePath = (code) => (code === "en" ? "" : `/${code.toLowerCase()}`) + "/login/";

test("the checkbox fits the sign-in card in every language on a small phone", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, { signedIn: false, viewport: { width: 320, height: 640 } });
  t.after(() => fixture.context.close());
  const { page } = fixture;
  for (const { code } of SITE_LANGUAGES) {
    await page.goto(origin + pagePath(code));
    const layout = await page.evaluate(() => {
      const card = document.querySelector(".app-login__card").getBoundingClientRect();
      const label = document.querySelector(".app-login__remember").getBoundingClientRect();
      const box = document.querySelector("#login-remember").getBoundingClientRect();
      const apple = document.querySelector('[data-provider="apple"]').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        inside: label.left >= card.left && label.right <= card.right && label.top >= apple.bottom,
        fits: card.bottom <= innerHeight,
        target: Math.min(box.width, box.height),
        checked: document.querySelector("#login-remember").checked,
      };
    });
    assert.deepEqual(layout, { overflow: false, inside: true, fits: true, target: 20, checked: false }, code);
  }
  assert.deepEqual(fixture.errors, []);
});

test("the whole card, down to the legal and statement lines, stays on a landscape phone screen in every language", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const viewport of [{ width: 568, height: 320 }, { width: 667, height: 375 }]) {
    await t.test(`${viewport.width}x${viewport.height}`, async (t) => {
      const fixture = await scenario(browser, { signedIn: false, viewport });
      t.after(() => fixture.context.close());
      const { page } = fixture;
      for (const { code } of SITE_LANGUAGES) {
        await page.goto(origin + pagePath(code));
        await page.locator(".app-login__legal").waitFor();
        const layout = await page.evaluate(() => {
          const card = document.querySelector(".app-login__card");
          const box = card.getBoundingClientRect();
          const legal = document.querySelector(".app-login__legal").getBoundingClientRect();
          const statement = document.querySelector(".app-login__statement").getBoundingClientRect();
          return {
            cardFits: card.scrollHeight <= card.clientHeight,
            legalInCard: legal.bottom <= box.bottom,
            legalOnScreen: legal.bottom <= innerHeight,
            statementInCard: statement.top >= legal.bottom && statement.bottom <= box.bottom,
          };
        });
        assert.deepEqual(layout, { cardFits: true, legalInCard: true, legalOnScreen: true, statementInCard: true }, code);
      }
      assert.deepEqual(fixture.errors, []);
    });
  }
});
