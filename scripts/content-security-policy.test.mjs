import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";
import {
  INLINE_SCRIPT,
  dashboardContentSecurityPolicy,
  documentContentSecurityPolicy,
  inlineScriptHash,
  withLocalSources,
} from "./lib/content-security-policy.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

// Every sign-in page and every signed-in workspace document. The legacy /pay/
// and /manager/ aliases only redirect and load nothing else.
const workspacePages = [
  "dashboard/index.html",
  "dashboard/host/index.html",
  "dashboard/host/overview/index.html",
  "dashboard/manager/index.html",
  "dashboard/manager/platform/index.html",
  "dashboard/pay/index.html",
  "dashboard/pay/platform/index.html",
  "dashboard/platform/index.html",
  "dashboard/reservations/index.html",
  "reservations/index.html",
  "pay/point/index.html",
];
const loginPages = SITE_LANGUAGES.map(({ code }) =>
  code === "en" ? "login/index.html" : `${code.toLowerCase()}/login/index.html`,
);
const read = (page) => fs.readFile(new URL(`../${page}`, import.meta.url), "utf8");
const directive = (policy, name) =>
  policy.split(";").map((part) => part.trim().split(/\s+/)).find(([key]) => key === name)?.slice(1);

test("each covered page carries the shared policy before anything it loads", async () => {
  for (const page of [...workspacePages, ...loginPages]) {
    const html = await read(page);
    const policy = documentContentSecurityPolicy(html);
    assert.ok(policy, `${page} has a Content-Security-Policy meta`);
    // A meta policy does not apply to what precedes it.
    assert.match(html, /<head>\s*<meta charset="utf-8" \/>\s*<meta http-equiv="Content-Security-Policy"/, page);
    assert.equal(html.match(/http-equiv="Content-Security-Policy"/g).length, 1, page);
    const hashes = [...html.matchAll(INLINE_SCRIPT)].map((match) => inlineScriptHash(match[1]));
    assert.equal(policy, dashboardContentSecurityPolicy({ scriptHashes: hashes }), page);
    if (!loginPages.includes(page)) assert.deepEqual(hashes, [], `${page} has no inline script`);
    const scripts = directive(policy, "script-src");
    assert.ok(!scripts.includes("'unsafe-inline'") && !scripts.includes("'unsafe-eval'"), page);
    assert.deepEqual(directive(policy, "object-src"), ["'none'"], page);
    assert.doesNotMatch(html, /<[a-z][^>]*\son[a-z]+\s*=/i, `${page} has no inline event handler`);
    assert.doesNotMatch(html, /href="javascript:/i, page);
  }
});

test("each sign-in page admits only its own cookie copy script by hash", async () => {
  for (const page of loginPages) {
    const html = await read(page);
    const inline = [...html.matchAll(INLINE_SCRIPT)].map((match) => match[1]);
    assert.equal(inline.length, 1, page);
    assert.match(inline[0], /^window\.WIFIGATE_COOKIE_COPY = /, page);
    assert.ok(documentContentSecurityPolicy(html).includes(inlineScriptHash(inline[0])), page);
  }
});

test("the local server adds loopback APIs only to connect-src and frame-src", () => {
  const policy = dashboardContentSecurityPolicy();
  const html = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
  const local = documentContentSecurityPolicy(withLocalSources(html));
  assert.ok(directive(local, "connect-src").includes("http://127.0.0.1:8101"));
  assert.ok(directive(local, "connect-src").includes("http://127.0.0.1:9099"));
  assert.ok(directive(local, "frame-src").includes("http://127.0.0.1:9099"));
  for (const name of ["default-src", "script-src", "img-src", "style-src", "object-src", "base-uri", "form-action"])
    assert.deepEqual(directive(local, name), directive(policy, name), name);
  assert.ok(!directive(policy, "connect-src").some((source) => source.includes("127.0.0.1")));
});

test("covered pages load without policy violations and the policy blocks injected script", async (t) => {
  const { origin, browser } = await startSite(t);
  const context = await browser.newContext();
  t.after(() => context.close());
  // Nothing leaves the machine: the browser checks the policy before routing,
  // so a disallowed origin is still reported even though every request
  // outside the fixture site is aborted.
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.cspViolations.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  for (const path of ["/login/", "/he/login/", "/dashboard/", "/dashboard/host/", "/dashboard/manager/", "/dashboard/pay/", "/dashboard/platform/", "/reservations/", "/pay/point/?id=" + "a".repeat(64)]) {
    await t.test(path, async () => {
      const page = await context.newPage();
      t.after(() => page.close());
      const messages = [];
      page.on("console", (message) => {
        if (/Content Security Policy/i.test(message.text())) messages.push(message.text());
      });
      await page.goto(origin + path, { waitUntil: "load" });
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => typeof window.cspViolations), "object", "the page under test was not replaced");
      assert.deepEqual(await page.evaluate(() => window.cspViolations), [], path);
      assert.deepEqual(messages, [], path);
      const blocked = await page.evaluate(async () => {
        const script = document.createElement("script");
        script.textContent = "window.injectedRan = true";
        document.head.append(script);
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ran: window.injectedRan === true, violations: window.cspViolations };
      });
      assert.equal(blocked.ran, false, `${path} blocks an injected inline script`);
      assert.ok(blocked.violations.some((entry) => entry.startsWith("script-src-elem inline")), path);
    });
  }
});
