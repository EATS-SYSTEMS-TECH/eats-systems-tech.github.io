import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));

test("Service health explains missing and stale evidence, isolates roles and discards late responses", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(path.resolve(root) + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "application/octet-stream",
      );
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
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/health-test", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/host-workspace.css"></head><body class="portal-dashboard"><aside id="host-sidebar" class="host-sidebar"><nav id="host-section-navigation"></nav></aside><main class="portal-shell"><details id="account-details"><summary>Account</summary></details><section id="host-management" class="portal-panel" data-organization-id="org"></section></main></body></html>`,
    }),
  );
  await page.goto(`http://127.0.0.1:${server.address().port}/health-test`);
  await page.evaluate(async () => {
    const { profileApi } = await import("/js/api/index.js");
    window.validOrganization = true;
    window.healthResult = {
      observedAt: new Date().toISOString(),
      policy: null,
      ownerActive: false,
      monitoring: {
        state: "unconfigured",
        latestWindowEnd: null,
        maximumAgeMs: 900000,
      },
      assessment: null,
      items: [],
    };
    profileApi.defaults.adapter = async (config) => {
      if (window.failHealth) throw new Error("isolated unavailable");
      if (window.delayHealth)
        await new Promise((resolve) => {
          window.releaseHealth = resolve;
        });
      return {
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: window.healthResult,
      };
    };
    const { renderServiceHealth } = await import("/js/host-service-health.js");
    window.renderHealth = (role) =>
      renderServiceHealth({
        container: document.getElementById("host-management"),
        user: { uid: "owner", getIdToken: async () => "isolated-test" },
        organization: { id: "org", membership: { role } },
        isCurrent: () => window.validOrganization,
      });
    window.renderHealth("owner");
    await import("/js/host-dashboard-navigation.js");
  });
  await page.getByRole("button", { name: "Operations", exact: true }).click();
  const section = page.getByRole("region", {
    name: "Service health",
    exact: true,
  });
  const refresh = section.getByRole("button", {
    name: "Refresh service health",
    exact: true,
  });
  await refresh.click();
  await section
    .getByText(
      "No retained observations yet. Refresh after the monitor runs.",
      { exact: true },
    )
    .waitFor();
  assert.equal(await section.locator(".health-metrics article").count(), 0);
  assert.equal(
    await section
      .getByRole("button", { name: "Save service targets" })
      .isDisabled(),
    true,
  );

  await page.evaluate(() => {
    const metric = {
      state: "healthy",
      reasons: [],
      samples: 25,
      successPercent: 100,
      p95LatencyMs: 120,
    };
    const row = {
      from: new Date(Date.now() - 3600000).toISOString(),
      to: new Date().toISOString(),
      policyVersion: 3,
      state: "breached",
      telemetryAvailable: true,
      metrics: {
        api: {
          ...metric,
          state: "breached",
          reasons: ["SUCCESS_BELOW_TARGET"],
          successPercent: 92,
        },
        automation: metric,
        delivery: {
          ...metric,
          state: "unknown",
          samples: 0,
          successPercent: null,
          p95LatencyMs: null,
        },
      },
    };
    window.healthResult = {
      ...window.healthResult,
      policy: { version: 3, responsibleUid: "operations-owner", enabled: true },
      ownerActive: true,
      monitoring: {
        ...window.healthResult.monitoring,
        state: "current",
        latestWindowEnd: row.to,
      },
      assessment: "breached",
      items: [row],
    };
  });
  await refresh.click();
  await section
    .getByRole("status")
    .getByText("Target breached", { exact: true })
    .waitFor();
  assert.equal(await section.locator(".health-metrics article").count(), 3);
  await section
    .getByText("Success rate below target", { exact: true })
    .waitFor();
  assert.match(
    await section
      .getByRole("article", { name: "Provider acceptance" })
      .textContent(),
    /Unknown success/,
  );

  for (const [state, message] of [
    ["stale", "Scheduled observations are overdue."],
    ["awaiting", "Waiting for the first scheduled observation"],
    ["disabled", "Scheduled monitoring is disabled"],
    ["unowned", "The responsible operations member is unavailable"],
    ["unavailable", "The monitor could not read complete telemetry"],
  ]) {
    await page.evaluate((state) => {
      window.healthResult.monitoring.state = state;
      window.healthResult.assessment = null;
    }, state);
    await refresh.click();
    await section
      .getByRole("status")
      .getByText(message, { exact: false })
      .waitFor();
    await section
      .getByRole("heading", { name: "Historical results — not current health" })
      .waitFor();
  }
  await page.setViewportSize({ width: 360, height: 900 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: path.join(tmpdir(), "wifigate-v10-service-health-mobile.png"),
    fullPage: true,
  });

  await page.route("**/js/site-auth.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "export async function reauthenticate(){window.identityConfirmed=true;} export async function resolveTotp(){}",
    }),
  );
  await page.evaluate(async () => {
    const { profileApi } = await import("/js/api/index.js");
    const previous = profileApi.defaults.adapter;
    window.policyIntents = [];
    profileApi.defaults.adapter = async (config) => {
      if (!config.url.endsWith("/operations/slo-policy"))
        return previous(config);
      if (config.method === "put") {
        window.policyIntents.push(config.headers.get("Idempotency-Key"));
        if (!window.identityConfirmed) throw { code: "RECENT_REAUTH_REQUIRED" };
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: { policy: { ...JSON.parse(config.data), version: 1 } },
        };
      }
      return {
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: { policy: null, ownerActive: false },
      };
    };
  });
  await section
    .getByRole("button", { name: "Load service targets", exact: true })
    .click();
  await section
    .getByRole("status")
    .getByText("Service targets loaded.", { exact: true })
    .waitFor();
  await section
    .getByRole("button", { name: "Save service targets", exact: true })
    .click();
  await section
    .getByRole("status")
    .getByText("Choose Verify identity to edit targets", { exact: false })
    .waitFor();
  await section
    .getByRole("button", {
      name: "Verify identity to edit targets",
      exact: true,
    })
    .click();
  await section
    .getByRole("status")
    .getByText("Identity verified.", { exact: false })
    .waitFor();
  await section
    .getByRole("button", { name: "Save service targets", exact: true })
    .click();
  await section
    .getByRole("status")
    .getByText("Service targets saved and audited.", { exact: true })
    .waitFor();
  const intents = await page.evaluate(() => window.policyIntents);
  assert.equal(intents.length, 2);
  assert.equal(intents[0], intents[1]);
  assert.equal(await section.locator(".health-metrics article").count(), 0);

  await page.evaluate(() => {
    window.failHealth = true;
  });
  await refresh.click();
  await section
    .getByRole("status")
    .getByText("Unable to load or save service health.", { exact: false })
    .waitFor();
  assert.equal(await section.locator(".health-metrics article").count(), 0);
  await page.evaluate(() => {
    window.failHealth = false;
    window.delayHealth = true;
  });
  await refresh.click();
  await page.waitForFunction(() => typeof window.releaseHealth === "function");
  await page.evaluate(() => {
    window.validOrganization = false;
    window.releaseHealth();
  });
  await page.waitForTimeout(100);
  assert.equal(await section.locator(".health-metrics article").count(), 0);

  await page.evaluate(() => {
    document.getElementById("host-management").replaceChildren();
    window.validOrganization = true;
    window.renderHealth("viewer");
  });
  assert.equal(
    await page
      .getByRole("region", { name: "Service health", exact: true })
      .count(),
    0,
  );
  await page.evaluate(() => window.renderHealth("staff"));
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Operations", exact: true }).click();
  assert.equal(
    await section.getByRole("button", { name: "Save service targets" }).count(),
    0,
  );
  assert.equal(
    await section.getByRole("button", { name: "Open support access" }).count(),
    0,
  );
  assert.deepEqual(errors, []);
});
