import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
test("sensitive Host forms retain one reviewed intent through real-auth retries and stop on cancellation or abandoned organizations", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(path.resolve(root) + path.sep))
        return response.writeHead(403).end();
      response.setHeader("Content-Type", "application/javascript");
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const language of ["en", "he"]) {
    const page = await browser.newPage();
    t.after(() => page.close());
    await page.route("**/identity-fixture?**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><body><main id="main"></main></body></html>',
      }),
    );
    await page.route("**/js/site-auth.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `export async function reauthenticate(user, challenge) { window.verifications++; window.verifiedUid = user.uid; await new Promise((resolve, reject) => { window.finishVerification = resolve; window.cancelVerification = () => reject(Object.assign(new Error('user canceled'), { code: 'auth/popup-closed-by-user' })); }); } export async function resolveTotp() { throw new Error('No live authenticator in isolated fixture'); }`,
      }),
    );
    for (const module of ["keys", "support", "billing", "rotation"]) {
      await page.goto(`${origin}/identity-fixture?lang=${language}`);
      await page.evaluate(async (module) => {
        const { initializeHostLocale } = await import("/js/host-locale.js");
        initializeHostLocale();
        const { profileApi } = await import("/js/api/index.js");
        window.requests = [];
        window.verifications = 0;
        window.forcedTokens = 0;
        window.current = true;
        const options = {
          container: document.getElementById("main"),
          user: {
            uid: "reviewed-owner",
            getIdToken: async (force) => {
              if (force) window.forcedTokens++;
              return "isolated-token";
            },
          },
          organization: { id: "reviewed-org", membership: { role: "owner" } },
          isCurrent: () => window.current,
        };
        profileApi.defaults.adapter = async (config) => {
          const method = config.method.toUpperCase();
          if (method === "POST") {
            window.requests.push({
              path: config.url,
              body: config.data,
              intent: config.headers.get("idempotency-key"),
            });
            if (window.requests.length === 1)
              throw Object.assign(new Error("stale identity"), {
                code: ["keys", "rotation"].includes(module)
                  ? "RECENT_REAUTH_REQUIRED"
                  : module === "support"
                    ? "RECENT_AUTH_REQUIRED"
                    : "RECENT_TOTP_REQUIRED",
              });
          }
          return {
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            data: {
              items:
                module === "rotation" ||
                (module === "keys" && window.requests.length === 2)
                  ? [
                      {
                        id: "owned-key",
                        name: "Reviewed original intent",
                        prefix: "public-prefix",
                        status:
                          window.requests.length === 2 ? "revoked" : "active",
                        version: 1,
                        scopes: ["guest-invitations:create"],
                        targetTypes: ["gate"],
                      },
                    ]
                  : [],
              nextCursor: null,
              grant: { id: "owned-support" },
              subscription: { status: "active", version: 1 },
            },
          };
        };
        if (["keys", "rotation"].includes(module))
          await (
            await import("/js/host-api-keys.js")
          ).renderHostApiKeys(options);
        if (module === "support")
          await (
            await import("/js/host-support.js")
          ).renderSupportOwner(options);
        if (module === "billing")
          await (
            await import("/js/host-billing.js")
          ).renderHostBilling(options);
      }, module);
      const he = language === "he";
      if (module === "billing")
        await page
          .getByRole("button", {
            name: he ? "טעינת מנוי" : "Load subscription",
            exact: true,
          })
          .click();
      const field = page.locator(
        module === "rotation"
          ? 'input[name="overlapHours"]'
          : module === "keys"
            ? 'input[name="name"]'
            : module === "support"
              ? 'input[name="email"]'
              : 'input[name="reason"]',
      );
      await field.fill(
        module === "rotation"
          ? "0"
          : module === "support"
            ? "qa-owner@wifigate.test"
            : "Reviewed original intent",
      );
      const label =
        module === "rotation"
          ? he
            ? "החלפת מפתח API"
            : "Rotate API key"
          : module === "keys"
            ? he
              ? "יצירת מפתח API"
              : "Create API key"
            : module === "support"
              ? he
                ? "אישור תמיכה זמנית"
                : "Approve temporary support"
              : he
                ? "החלת שינוי מנוי"
                : "Apply subscription change";
      const button = page.getByRole("button", { name: label, exact: true });
      await button.click();
      await page.waitForFunction(() => window.verifications === 1);
      assert.equal(
        await page.evaluate(async () =>
          (
            await import("/js/host-recent-identity.js")
          ).recentIdentityActionInProgress(),
        ),
        true,
      );
      assert.equal(await button.isDisabled(), true);
      await field.fill(
        module === "rotation"
          ? "4"
          : module === "support"
            ? "different@wifigate.test"
            : "Unreviewed changed intent",
      );
      await button.evaluate((element) => element.click());
      assert.equal(
        await page.evaluate(() => window.requests.length),
        1,
        "a second click must not start a second intent",
      );
      await page.evaluate(() => window.finishVerification());
      await page.waitForFunction(() => window.requests.length === 2);
      await page.waitForFunction(
        () => document.querySelectorAll("button:disabled").length === 0,
      );
      const result = await page.evaluate(() => ({
        requests: window.requests,
        uid: window.verifiedUid,
        forced: window.forcedTokens,
        verifications: window.verifications,
      }));
      assert.deepEqual(
        result.requests[0],
        result.requests[1],
        `${module}/${language} must preserve path, reviewed body and idempotency key`,
      );
      assert.equal(result.uid, "reviewed-owner");
      assert.equal(result.forced, 1);
      assert.equal(result.verifications, 1);
      assert.equal(
        await page.evaluate(async () =>
          (
            await import("/js/host-recent-identity.js")
          ).recentIdentityActionInProgress(),
        ),
        false,
      );
      assert.doesNotMatch(
        await page.locator("#main").innerText(),
        /isolated-token|wfg_live_k_/,
      );
      if (module === "keys") {
        assert.deepEqual(JSON.parse(result.requests[0].body).targetTypes, [
          "gate",
        ]);
        assert.ok(
          (await page.locator("#main").innerText()).includes(
            he ? "שער" : "Gate",
          ),
        );
        assert.doesNotMatch(
          await page.locator("#main").innerText(),
          /guest-invitations:create/,
        );
      }
      if (module === "rotation") {
        assert.equal(JSON.parse(result.requests[1].body).overlapHours, 0);
        assert.ok(
          (await page.locator("#main").innerText()).includes(
            he ? "המפתח הקודם בוטל מיד" : "previous key is revoked immediately",
          ),
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: he ? "הצגת מפתח API פרטי" : "Reveal private API key",
              exact: true,
            })
            .count(),
          0,
        );
      }
    }
    for (const failure of ["cancel", "abandon", "denied", "still-stale"]) {
      await page.goto(`${origin}/identity-fixture?lang=${language}`);
      await page.evaluate(async (failure) => {
        const { profileApi } = await import("/js/api/index.js");
        const { requestWithRecentIdentity } =
          await import("/js/host-recent-identity.js");
        window.requests = [];
        window.verifications = 0;
        window.current = true;
        profileApi.defaults.adapter = async (config) => {
          window.requests.push(config.data);
          throw Object.assign(new Error("denied"), {
            code:
              failure === "denied"
                ? "OWNER_REQUIRED"
                : "RECENT_REAUTH_REQUIRED",
          });
        };
        window.completed = requestWithRecentIdentity({
          user: { uid: "owner", getIdToken: async () => "isolated-token" },
          path: "/api/v1/organizations/owned/api-keys",
          body: { name: "reviewed" },
          intent: "owned-intent",
          isCurrent: () => window.current,
          onVerifying: () => {},
        }).then(
          () => "unexpected success",
          (error) => error.code ?? error.name,
        );
      }, failure);
      if (failure !== "denied") {
        await page.waitForFunction(() => window.verifications === 1);
        await page.evaluate((failure) => {
          if (failure === "cancel") window.cancelVerification();
          else {
            if (failure === "abandon") window.current = false;
            window.finishVerification();
          }
        }, failure);
      }
      const result = await page.evaluate(async () => ({
        outcome: await window.completed,
        writes: window.requests.length,
        verification: window.verifications,
      }));
      assert.equal(result.writes, failure === "still-stale" ? 2 : 1);
      assert.equal(result.verification, failure === "denied" ? 0 : 1);
      assert.notEqual(result.outcome, "unexpected success");
      assert.equal(
        await page.evaluate(async () =>
          (
            await import("/js/host-recent-identity.js")
          ).recentIdentityActionInProgress(),
        ),
        false,
      );
    }
  }
});
