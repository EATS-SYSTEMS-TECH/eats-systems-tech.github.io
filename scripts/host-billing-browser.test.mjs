import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
test("billing and access deadlines follow selected language; failed reloads and abandoned organizations cannot enable stale changes", async (t) => {
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
        body: '<!doctype html><html><head><meta charset="utf-8"></head><body><main id="billing"></main><section id="support"></section><section id="keys"></section><section id="access"></section></body></html>',
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
        } else if (config.url.includes("/access-grants?")) {
          data = {
            items: [
              {
                id: "owned-grant",
                status: "expired",
                reservationVersion: 1,
                effectiveStartsAt: instant,
                effectiveEndsAt: instant,
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
        organization: { id: "owned-org", membership: { role: "owner" } },
        isCurrent: () => window.currentOrganization,
      };
      const { renderHostBilling } = await import("/js/host-billing.js");
      const { renderSupportOwner } = await import("/js/host-support.js");
      const { renderHostApiKeys } = await import("/js/host-api-keys.js");
      const { renderHostAccessGrants } =
        await import("/js/host-access-grants.js");
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
      await renderHostAccessGrants({
        ...options,
        container: document.getElementById("access"),
        reservation: { id: "reservation", status: "cancelled" },
      });
    });
    const expected = new Intl.DateTimeFormat(
      language === "he" ? "he-IL" : "en-US",
      { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
    ).format(new Date("2026-10-11T12:34:00.000Z"));
    for (const id of ["support", "keys", "access"])
      assert.ok(
        (await page.locator(`#${id}`).innerText()).includes(expected),
        `${id} must use selected language and UTC, independently of the browser`,
      );
    assert.ok(
      (await page.locator("#support").innerText()).includes(
        language === "he" ? "מסירה" : "Delivery",
      ),
    );
    assert.ok(
      (await page.locator("#keys").innerText()).includes(
        "User-entered key name",
      ),
    );
    const load = page.getByRole("button", {
      name: language === "he" ? "טעינת מנוי" : "Load subscription",
      exact: true,
    });
    const apply = page.getByRole("button", {
      name: language === "he" ? "החלת שינוי מנוי" : "Apply subscription change",
      exact: true,
    });
    await load.click();
    await page
      .getByText(
        language === "he" ? "מצב המנוי נטען." : "Subscription loaded.",
        { exact: true },
      )
      .waitFor();
    assert.ok(
      (await page.locator("#billing").innerText()).includes(
        language === "he" ? "פעיל ותיק" : "legacy-active",
      ),
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
    await page
      .getByText(
        language === "he" ? "מצב המנוי נטען." : "Subscription loaded.",
        { exact: true },
      )
      .waitFor();
    assert.ok((await page.locator("#billing").innerText()).includes(expected));
    assert.doesNotMatch(
      await page.locator("#billing").innerText(),
      /2026-10-11T/,
    );
    await page
      .getByRole("button", {
        name:
          language === "he" ? "יצירת טיוטה חודשית" : "Generate monthly draft",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he"
          ? "נדרשת היסטוריית שימוש מאומתת מלאה לחודש הזה. בחרו חודש מאוחר יותר שהסתיים; לא ניתן לשחזר שימוש שלא תועד."
          : "A complete verified usage history is required for this month. Choose a later closed month; past usage cannot be reconstructed.",
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
          ? "לא ניתן לעדכן את החיוב. רעננו את הנתונים ובדקו את ההרשאות לפני ניסיון נוסף."
          : "Billing could not be updated. Refresh current data and verify permissions before retrying.",
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
