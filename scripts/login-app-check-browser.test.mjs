import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { loadLoginCopy, renderLoginPage } from "./login-pages.mjs";

test("a restored session shows a browser verification error without claiming account access was denied", async (t) => {
  const { origin, browser } = await startSite(t);
  const copies = await loadLoginCopy();
  const template = await readFile(
    new URL("../templates/login.template.html", import.meta.url),
    "utf8",
  );
  for (const language of ["en", "he"]) {
    for (const source of ["backend", "sdk", "configuration"]) {
      const fixture = await scenario(browser, { signedIn: true });
      t.after(() => fixture.context.close());
      await fixture.context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        return url.origin === origin ||
          url.pathname.startsWith("/api/v1/") ||
          (url.hostname === "www.gstatic.com" &&
            url.pathname.startsWith("/firebasejs/"))
          ? route.fallback()
          : route.abort();
      });
      const path = language === "en" ? "/login/" : "/he/login/";
      await fixture.context.route(origin + path, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: renderLoginPage(template, language, copies[language]),
        }),
      );
      await fixture.context.route("**/api/v1/platform/login", (route) =>
        route.fulfill({
          status: 403,
          json: {
            error: {
              code: "APP_CHECK_REQUIRED",
              message: "Verified app integrity is required",
            },
          },
        }),
      );
      if (source !== "backend") {
        await fixture.context.route(
          "https://www.gstatic.com/firebasejs/**/firebase-app-check.js",
          (route) =>
            route.fulfill({
              contentType: "application/javascript",
              body: `export class ReCaptchaEnterpriseProvider {} export const initializeAppCheck = () => ({}); export async function getToken() { throw Object.assign(new Error('isolated failure'), {code: ${JSON.stringify(source === "sdk" ? "appCheck/recaptcha-error" : "APP_CHECK_UNCONFIGURED")}}); }`,
            }),
        );
      }
      await fixture.page.goto(origin + path);
      await fixture.page
        .locator("#login-status", { hasText: copies[language].errorAppCheck })
        .waitFor();
      assert.equal(
        await fixture.page.locator("#login-status").textContent(),
        copies[language].errorAppCheck,
      );
      assert.equal(fixture.calls.includes("signout"), false);
      assert.equal(fixture.calls.includes("signin"), false);
      assert.equal(
        await fixture.page.locator('[data-provider="google"]').isEnabled(),
        true,
      );
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    }
  }
});
