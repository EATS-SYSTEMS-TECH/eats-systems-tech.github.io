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

const fixtureService = {
  available: false,
  reason: "TRUSTED_FIXTURE_UNAVAILABLE",
};
const plannedBatches = [
  {
    id: "prod-batch-8",
    label: "Authorized 8 MB batch",
    releaseId: "WGREL-fixture.8.0",
    profile: "8.0",
    remaining: 4,
    enabled: true,
  },
  {
    id: "prod-batch-16",
    label: "Authorized 16 MB batch",
    releaseId: "WGREL-fixture.16.0",
    profile: "16.1",
    remaining: 3,
    enabled: true,
  },
];
const approvedStation = {
  id: "assigned-station",
  label: "Authorized test station",
  enabled: true,
  activeJobId: null,
  batches: plannedBatches,
};
const workstationField = (page, field) =>
  page.locator("#factory-workstation [data-factory=" + JSON.stringify(field) + "]");

async function mockWorkstation(context, options = {}) {
  const mock = {
    role: "operator",
    stations: [approvedStation],
    jobs: [],
    writes: [],
    unavailable: false,
    failFirstQueue: false,
    ...options,
  };
  await context.route((url) => url.pathname === "/api/v1/factory/workspace", (route) => (
    mock.unavailable
      ? route.fulfill({ status: 503, json: { error: { code: "FACTORY_SERVICE_UNAVAILABLE" } } })
      : route.fulfill({ json: { mode: "PROD", role: mock.role, provisioning: fixtureService, stations: mock.stations } })
  ));
  await context.route((url) => url.pathname === "/api/v1/factory/jobs", async (route) => {
    const req = route.request();
    if (req.method() === "GET") {
      const stationId = new URL(req.url()).searchParams.get("stationId");
      return route.fulfill({ json: { jobs: mock.jobs.filter((job) => job.stationId === stationId), nextCursor: null } });
    }
    assert.equal(req.method(), "POST");
    const body = req.postDataJSON();
    const key = req.headers()["idempotency-key"];
    mock.writes.push({ body, key });
    if (mock.failFirstQueue && mock.writes.length === 1) {
      return route.fulfill({ status: 503, json: { error: { code: "FACTORY_SERVICE_UNAVAILABLE" } } });
    }
    const batch = mock.stations.find((station) => station.id === body.stationId)?.batches.find(
      (entry) => entry.id === body.batchId,
    );
    assert.ok(batch, "The queued batch must belong to the selected station");
    const job = {
      id: "factory-job-queue-test",
      stationId: body.stationId,
      batchId: body.batchId,
      releaseId: batch.releaseId,
      profile: batch.profile,
      status: "PENDING_FIXTURE",
      createdAt: "2026-11-26T10:10:00Z",
      canCancel: true,
      canQuarantine: false,
    };
    mock.jobs.unshift(job);
    return route.fulfill({ status: 201, json: { job } });
  });
  return mock;
}

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

test("the approved desktop and mobile workstation reproduces the flasher layout and its three tabs", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const mobile of [false, true]) {
    const { context, page, errors } = await scenario(browser, {
      ...permissions, factoryAccess: true, mobile,
    });
    try {
      const historyJob = {
        id: "factory-journal-test",
        stationId: approvedStation.id,
        batchId: plannedBatches[0].id,
        releaseId: plannedBatches[0].releaseId,
        profile: "8.0",
        status: "CANCELLED",
        createdAt: "2026-11-26T10:10:00Z",
        canCancel: false,
        canQuarantine: false,
      };
      await mockWorkstation(context, { jobs: [historyJob] });
      await page.addInitScript(() => {
        const device = new EventTarget();
        device.name = "Fixture NIIMBOT";
        device.gatt = {
          connect: async () => ({ getPrimaryService: async () => ({}) }),
          disconnect: () => {},
        };
        Object.defineProperty(navigator, "bluetooth", {
          configurable: true,
          value: { requestDevice: async () => device },
        });
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async (value) => { window.fixtureClipboard = value; } },
        });
      });
      await page.goto(origin + (mobile ? factoryRoute : "/dashboard/factory/"));
      await page.locator("#factory-workstation").waitFor();
      await workstationField(page, "station").selectOption(approvedStation.id);
      await workstationField(page, "latest-id").filter({ hasText: /^factory-journal-test$/ }).waitFor();
      const tabs = page.getByRole("tab");
      assert.equal(await tabs.count(), 3);
      assert.deepEqual(
        await tabs.evaluateAll((nodes) => nodes.map((node) => node.dataset.view)),
        ["programming", "printer", "logger"],
      );
      const style = await page.locator("#factory-workstation").evaluate((workstation) => ({
        sidebar: getComputedStyle(workstation.querySelector(".sidebar")).backgroundColor,
        grid: getComputedStyle(workstation.querySelector(".workspace")).display,
        tabs: getComputedStyle(workstation.querySelector(".tabs")).flexDirection,
        pageFits: document.documentElement.scrollWidth <= window.innerWidth + 1,
      }));
      assert.deepEqual(style, {
        sidebar: "rgb(10, 10, 10)",
        grid: mobile ? "block" : "grid",
        tabs: mobile ? "row" : "column",
        pageFits: true,
      });
      assert.equal(await page.locator("#factory-programming").isVisible(), true);
      assert.equal(await page.locator("#factory-printer").isVisible(), false);
      assert.equal(await page.locator("#factory-logger").isVisible(), false);

      await workstationField(page, "printer-settings").click();
      await page.locator("#factory-printer").waitFor();
      await workstationField(page, "connect").click();
      await workstationField(page, "printer-detail").filter({ hasText: /^(Printer connected|המדפסת מחוברת)$/ }).waitFor();
      await workstationField(page, "disconnect").click();
      assert.equal(await workstationField(page, "disconnect").isDisabled(), true);

      await page.locator("#factory-printer-tab").press("End");
      await page.locator("#factory-logger").waitFor();
      const log = workstationField(page, "log");
      assert.match(await log.innerText(), /CANCELLED.*factory-journal-test/);
      await workstationField(page, "copy-log").click();
      assert.match(await page.evaluate(() => window.fixtureClipboard), /factory-journal-test/);
      await workstationField(page, "follow-log").uncheck();
      assert.equal(await workstationField(page, "follow-log").isChecked(), false);
      await page.locator("#factory-logger-tab").press("Home");
      await page.locator("#factory-programming").waitFor();
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
});

test("a station and approved batch queue PROD with one idempotency key across a retry", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page, errors } = await scenario(browser, {
    ...permissions, factoryAccess: true,
  });
  t.after(() => context.close());
  const mock = await mockWorkstation(context, {
    failFirstQueue: true,
    stations: [approvedStation, { ...approvedStation, id: "spare-station", label: "Second test station" }],
  });
  await page.goto(origin + "/dashboard/factory/");
  await page.locator("#factory-workstation").waitFor();
  const submit = workstationField(page, "submit");
  const station = workstationField(page, "station");
  await station.locator("option[value=assigned-station]").waitFor({ state: "attached" });
  assert.equal(await submit.isDisabled(), true);
  await station.selectOption(approvedStation.id);
  assert.equal(await submit.isDisabled(), true);
  await workstationField(page, "batch").selectOption(plannedBatches[1].id);
  await page.getByRole("button", { name: "Queue PROD job" }).waitFor();
  assert.match(await workstationField(page, "profile").locator("option").innerText(), /16\.1\s*\/\s*16 MB/);
  assert.equal(await submit.isEnabled(), true);
  await submit.click();
  await workstationField(page, "error").waitFor();
  await submit.click();
  await workstationField(page, "latest-id").filter({ hasText: /^factory-job-queue-test$/ }).waitFor();
  assert.equal(mock.writes.length, 2);
  assert.deepEqual(mock.writes[0].body, { stationId: approvedStation.id, batchId: plannedBatches[1].id });
  assert.match(mock.writes[0].key ?? "", /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
  assert.deepEqual(mock.writes[1], mock.writes[0]);
  assert.equal(await submit.isDisabled(), true);
  assert.equal(await workstationField(page, "cancel-job").isVisible(), true);
  assert.equal(await workstationField(page, "quarantine-job").isVisible(), false);
  assert.equal(await workstationField(page, "progress").getAttribute("value"), "0");
  assert.deepEqual(errors, []);
});

test("disabled stations, active station jobs and disabled batches prevent another PROD queue request", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page } = await scenario(browser, { ...permissions, factoryAccess: true });
  t.after(() => context.close());
  const unavailableStations = [
    { ...approvedStation, id: "disabled", enabled: false, batches: [plannedBatches[0]] },
    { ...approvedStation, id: "busy", activeJobId: "current-job", batches: [plannedBatches[0]] },
    { ...approvedStation, id: "stopped-batch", batches: [{ ...plannedBatches[0], enabled: false }] },
  ];
  const mock = await mockWorkstation(context, { stations: unavailableStations });
  await page.goto(origin + "/dashboard/factory/");
  const station = workstationField(page, "station");
  await station.locator("option[value=disabled]").waitFor({ state: "attached" });
  for (const stationId of unavailableStations.map(({ id }) => id)) {
    const history = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === "/api/v1/factory/jobs" && url.searchParams.get("stationId") === stationId;
    });
    await station.selectOption(stationId);
    await history;
    assert.equal(await workstationField(page, "submit").isDisabled(), true, stationId);
    await workstationField(page, "program-form").dispatchEvent("submit");
  }
  assert.equal(mock.writes.length, 0);
});

test("workspace API failure clears stale workstation data and keeps all PROD actions unavailable", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page, errors } = await scenario(browser, {
    ...permissions, factoryAccess: true,
  });
  t.after(() => context.close());
  const mock = await mockWorkstation(context);
  await page.goto(origin + "/dashboard/factory/");
  await workstationField(page, "station").locator("option[value=assigned-station]").waitFor({ state: "attached" });
  await workstationField(page, "station").selectOption(approvedStation.id);
  await workstationField(page, "batch").selectOption(plannedBatches[0].id);
  await page.getByRole("button", { name: "Queue PROD job" }).waitFor();

  mock.unavailable = true;
  await workstationField(page, "refresh").click();
  await workstationField(page, "phase").filter({ hasText: /Factory service is unavailable/ }).waitFor();
  assert.equal(await workstationField(page, "station").isDisabled(), true);
  assert.equal(await workstationField(page, "batch").isDisabled(), true);
  assert.equal(await workstationField(page, "submit").isDisabled(), true);
  assert.equal(await page.getByText(approvedStation.label, { exact: true }).count(), 0);
  assert.equal(await page.getByText(plannedBatches[0].releaseId, { exact: true }).count(), 0);
  await workstationField(page, "program-form").dispatchEvent("submit");
  assert.equal(mock.writes.length, 0);
  assert.deepEqual(errors, []);
});

test("signing out removes the private workstation and prevents a late API response from restoring it", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page, state } = await scenario(browser, {
    ...permissions, factoryAccess: true,
  });
  t.after(() => context.close());
  await mockWorkstation(context);
  await page.goto(origin + "/dashboard/factory/");
  const station = workstationField(page, "station");
  await station.locator("option[value=assigned-station]").waitFor({ state: "attached" });
  let sendReply;
  let confirmRequest;
  const pendingRequest = new Promise((resolve) => { confirmRequest = resolve; });
  const deferredReply = new Promise((resolve) => { sendReply = resolve; });
  await context.route((url) => url.pathname === "/api/v1/factory/workspace", async (route) => {
    confirmRequest();
    await deferredReply;
    await route.fulfill({
      json: {
        mode: "PROD",
        role: "operator",
        provisioning: fixtureService,
        stations: [{ ...approvedStation, label: "Late only data" }],
      },
    }).catch(() => {});
  });
  try {
    await workstationField(page, "refresh").click();
    await pendingRequest;
    await workstationField(page, "sign-out").click();
    await page.waitForURL((url) => url.pathname === "/login/");
  } finally {
    sendReply();
  }
  assert.equal(state.signedIn, false);
  assert.equal(await page.locator("#factory-workstation").count(), 0);
  assert.equal(await page.getByText("Late only data", { exact: true }).count(), 0);
  assert.equal(await page.getByText(approvedStation.label, { exact: true }).count(), 0);
});
