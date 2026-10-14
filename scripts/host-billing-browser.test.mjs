import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
test("billing, support and key dates follow the selected language; failed reloads and abandoned organizations cannot enable stale changes", async (t) => {
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
        file.endsWith(".js")
          ? "application/javascript"
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
  for (const language of ["he", "en"]) {
    const page = await browser.newPage({
      locale: language === "he" ? "en-US" : "he-IL",
      timezoneId: "America/Los_Angeles",
    });
    t.after(() => page.close());
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/billing-test?**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><head><meta charset="utf-8"></head><body><main id="billing"></main><section id="support"></section><section id="keys"></section></body></html>',
      }),
    );
    await page.goto(
      `http://127.0.0.1:${server.address().port}/billing-test?lang=${language}`,
    );
    await page.evaluate(async () => {
      const { initializeHostLocale } = await import("/js/host-locale.js");
      initializeHostLocale();
      const { profileApi } = await import("/js/api/index.js");
      const instant = "2026-10-11T12:34:00.000Z";
      window.currentOrganization = true;
      window.requests = [];
      window.fixtureSubscription = { status: "legacy-active", version: 0 };
      profileApi.defaults.adapter = async (config) => {
        window.requests.push({
          path: config.url,
          method: config.method,
          body: config.data,
        });
        let data;
        if (config.url.endsWith("/billing/subscription")) {
          if (window.delaySubscription)
            await new Promise((resolve) => {
              window.releaseSubscription = resolve;
            });
          if (window.failSubscription)
            throw new Error("isolated network failure");
          data = { subscription: window.fixtureSubscription };
          if (window.delaySubscription)
            window.subscriptionResponseCompleted = true;
        } else if (config.url.endsWith("/billing/statements")) {
          throw Object.assign(new Error("missing verified history"), {
            code: "BILLING_HISTORY_INCOMPLETE",
          });
        } else if (config.url.includes("/support/grants?")) {
          data = {
            items: [
              {
                id: "owned-support",
                purpose: "delivery",
                status: "revoked",
                endsAt: instant,
              },
            ],
            nextCursor: null,
          };
        } else if (config.url.includes("/api-keys?")) {
          data = {
            items: [
              {
                id: "owned-key",
                name: "User-entered key name",
                prefix: "public-prefix",
                status: "revoked",
                scopes: [],
                targetTypes: [],
                overlapUntil: instant,
              },
            ],
            nextCursor: null,
          };
        } else data = { items: [], nextCursor: null };
        return { status: 200, statusText: "OK", headers: {}, config, data };
      };
      const options = {
        user: {
          uid: "isolated-owner",
          getIdToken: async () => "isolated-test",
        },
        organization: {
          id: "owned-org",
          membership: { role: "owner" },
          workspace: {
            role: "owner",
            permissions: [
              "read",
              "organization:write",
              "members:write",
              "systems:write",
              "reservations:write",
              "invitations:write",
              "billing:write",
              "integrations:write",
              "operations:write",
            ],
          },
        },
        isCurrent: () => window.currentOrganization,
      };
      const { renderHostBilling } = await import("/js/host-billing.js");
      const { renderSupportOwner } = await import("/js/host-support.js");
      const { renderHostApiKeys } = await import("/js/host-api-keys.js");
      await renderHostBilling({
        ...options,
        container: document.getElementById("billing"),
      });
      await renderSupportOwner({
        ...options,
        container: document.getElementById("support"),
      });
      await renderHostApiKeys({
        ...options,
        container: document.getElementById("keys"),
      });
      // The keys live in the card's "For your developer" part.
      document.querySelector("#keys details.connect-keys").open = true;
    });
    const expected = new Intl.DateTimeFormat(
      language === "he" ? "he-IL" : "en-US",
      { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
    ).format(new Date("2026-10-11T12:34:00.000Z"));
    for (const id of ["support", "keys"])
      assert.ok(
        (await page.locator(`#${id}`).innerText()).includes(expected),
        `${id} must use selected language and UTC, independently of the browser`,
      );
    // A support approval names its purpose by the problem, in words.
    assert.ok(
      (await page.locator("#support").innerText()).includes(
        language === "he"
          ? "קישורים לאורחים לא מגיעים"
          : "Guest links don't arrive",
      ),
    );
    assert.ok(
      (await page.locator("#keys").innerText()).includes(
        "User-entered key name",
      ),
    );
    const load = page.getByRole("button", {
      name: language === "he" ? "הצגת מצב המנוי" : "Show plan status",
      exact: true,
    });
    const apply = page.getByRole("button", {
      name: language === "he" ? "שינוי המנוי" : "Change plan",
      exact: true,
    });
    // Plan & statements speaks to the owner: no operator words, and a
    // disabled Change plan says why in its ⓘ.
    const billingText = await page.locator("#billing").innerText();
    for (const word of language === "he"
      ? [
          /מחזור חיי לקוח/,
          /תמחור פנימית/,
          /היסטוריית חיוב מאומתת/,
          /טיוטה/,
          /גרסה/,
        ]
      : [
          /lifecycle/i,
          /internal pricing/i,
          /verified billing history/i,
          /draft/i,
          /revision/i,
          /subscription/i,
        ])
      assert.doesNotMatch(billingText, word);
    assert.equal(await apply.isDisabled(), true);
    const why = page.locator("#billing .system-action-blocked .info-tip");
    assert.equal(await why.isVisible(), true, "the disabled button has an ⓘ");
    assert.equal(
      await why.locator(".info-tip__bubble").textContent(),
      language === "he"
        ? "קודם מציגים את מצב המנוי."
        : "Show the plan status first.",
    );
    // The loaded state shows itself; no "loaded" line is added.
    const billingShows = (text) =>
      page.waitForFunction(
        (text) => document.getElementById("billing").innerText.includes(text),
        text,
      );
    await load.click();
    // The plan's state is a word, never its id or revision.
    await billingShows(language === "he" ? "פעיל" : "Active");
    const state = await page.locator("#billing").innerText();
    assert.doesNotMatch(state, /legacy|revision|גרסה|ותיק/);
    assert.equal(await why.isVisible(), false, "an allowed change has no ⓘ");
    assert.equal(
      await page
        .getByText(
          language === "he" ? "מצב המנוי נטען." : "Subscription loaded.",
          { exact: true },
        )
        .count(),
      0,
    );
    assert.equal(await apply.isEnabled(), true);
    await page.evaluate(() => {
      window.fixtureSubscription = {
        status: "trial",
        effectiveStatus: "trial",
        version: 1,
        trialEndsAt: "2026-10-11T12:34:00.000Z",
      };
    });
    await load.click();
    await billingShows(expected);
    assert.doesNotMatch(
      await page.locator("#billing").innerText(),
      /2026-10-11T/,
    );
    await page
      .getByRole("button", {
        name: language === "he" ? "יצירת דוח" : "Create statement",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he"
          ? "אין רישום מלא של החודש הזה. בחרו חודש מאוחר יותר."
          : "There's no full record of this month. Choose a later month.",
        { exact: true },
      )
      .waitFor();
    await page.evaluate(() => {
      window.failSubscription = true;
    });
    await load.click();
    await page
      .getByText(
        language === "he"
          ? "זה לא הצליח. נסו שוב."
          : "That didn't work. Try again.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await apply.isDisabled(),
      true,
      "a failed reload must discard the stale subscription revision",
    );
    await page.evaluate(() => {
      window.failSubscription = false;
      window.delaySubscription = true;
    });
    await load.click();
    await page.waitForFunction(
      () => typeof window.releaseSubscription === "function",
    );
    await page.evaluate(() => {
      window.currentOrganization = false;
      window.releaseSubscription();
    });
    await page.waitForFunction(() => window.subscriptionResponseCompleted);
    assert.equal(
      await apply.isDisabled(),
      true,
      "an abandoned organization must not enable an old form",
    );
    assert.equal(
      await page.evaluate(
        () =>
          window.requests.filter(
            (item) =>
              item.method === "post" && item.path.endsWith("/subscription"),
          ).length,
      ),
      0,
    );
    assert.deepEqual(
      await page.evaluate(async () => {
        const { hostDateTime } = await import("/js/host-ui.js");
        return [null, undefined, "", "corrupt"].map((value) =>
          hostDateTime(value),
        );
      }),
      Array(4).fill(
        language === "he" ? "התאריך אינו זמין" : "Date unavailable",
      ),
    );
    assert.deepEqual(errors, []);
  }
});
