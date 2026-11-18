import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function setup(t, browser, origin, kind, language = "en") {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  t.after(() => page.close());
  await page.goto(origin + "/404.html");
  await page.evaluate(
    async ({ kind, language }) => {
      const { renderManagerDeviceControls } =
        await import("/js/manager-device-controls.js");
      document.body.replaceChildren();
      const root = document.createElement("main");
      document.body.append(root);
      window.calls = [];
      window.refreshes = 0;
      window.confirmed = false;
      window.current = true;
      window.connection = {
        session: {},
        capabilities: {
          data: {
            features: [
              "GATE_OVERRIDE",
              "RELAY_WIRING",
              "SENSORS",
              "RF_LEARN",
              "MANAGER_QR_LABEL",
              "MANAGER_FACTORY_RESET",
              "FOTA",
            ],
          },
        },
        command: async (name, payload) => {
          window.calls.push({ name, payload });
          return {
            data:
              name === "ADMIN_FACTORY_RESET_PREPARE"
                ? { challenge: "a".repeat(32) }
                : name === "ADMIN_GET_QR_PAYLOAD"
                  ? {
                      sensitive: true,
                      payload: { i: "DEMO-1", n: "Demo", example: true },
                    }
                  : name === "ADMIN_RF_LEARN_START"
                    ? { operationId: "learn-1" }
                    : name === "ADMIN_RF_LEARN_STATUS"
                      ? { state: "DETECTED" }
                      : {
                          override: { mode: "NORMAL" },
                          config: { enabled: false, swapWiring: false },
                          revision: 7,
                          rfCode: {},
                          firmwareVersion: "11.26.18",
                        },
          };
        },
      };
      window.panel = await renderManagerDeviceControls({
        root,
        kind,
        language,
        connection: window.connection,
        isCurrent: () => window.current,
        confirm: async () => window.confirmed,
        ensureRecent: async (options) => (window.authOptions = options),
        errorText: (e) => e.message,
        onRefresh: async () => window.refreshes++,
      });
    },
    { kind, language },
  );
  return page;
}
test("Device settings send revisions only after confirmation", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const [kind, name, command, payload] of [
    [
      "override",
      "Save gate mode",
      "ADMIN_SET_GATE_OVERRIDE",
      { mode: "NORMAL" },
    ],
    [
      "wiring",
      "Save settings",
      "ADMIN_SET_RELAY_WIRING",
      { swapWiring: false },
    ],
    ["sensor", "Save settings", "ADMIN_SET_SENSOR_CONFIG", { enabled: false }],
  ]) {
    const page = await setup(t, browser, origin, kind);
    await page.getByRole("button", { name, exact: true }).click();
    assert.equal(await page.evaluate(() => window.calls.length), 1);
    await page.evaluate(() => (window.confirmed = true));
    await page.getByRole("button", { name, exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), {
      name: command,
      payload: { ...payload, expectedRevision: 7 },
    });
    assert.equal(await page.evaluate(() => window.refreshes), 1);
  }
});
test("QR uses display purpose, recent identity, no persistence and clears on dispose", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, "qr", "he");
  await page
    .getByRole("button", { name: "הצגת מדבקת QR Code", exact: true })
    .click();
  assert.equal(await page.locator(".manager-qr-label svg").count(), 1);
  assert.deepEqual(await page.evaluate(() => window.authOptions), {
    maxAgeSeconds: 240,
  });
  assert.deepEqual(await page.evaluate(() => window.calls), [
    { name: "ADMIN_GET_QR_PAYLOAD", payload: { purpose: "DISPLAY" } },
  ]);
  assert.equal(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
    0,
  );
  await page.getByRole("button", { name: "הסתרת המדבקה" }).click();
  assert.equal(await page.locator(".manager-qr-label svg").count(), 0);
  await page
    .getByRole("button", { name: "הצגת מדבקת QR Code", exact: true })
    .click();
  await page.evaluate(() => window.panel.dispose());
  assert.equal(await page.locator(".manager-qr-label").innerText(), "");
});
test("Late QR response is discarded after navigation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, "qr");
  await page.evaluate(
    () =>
      (window.connection.command = () =>
        new Promise((resolve) => (window.resolveQr = resolve))),
  );
  await page
    .getByRole("button", { name: "Show QR Code label", exact: true })
    .click();
  await page.waitForFunction(() => Boolean(window.resolveQr));
  await page.evaluate(() => {
    window.current = false;
    window.panel.dispose();
    window.resolveQr({ data: { sensitive: true, payload: { i: "DEMO" } } });
  });
  assert.equal(await page.locator(".manager-qr-label svg").count(), 0);
});
test("Factory reset prepares but never commits after cancellation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, "reset");
  await page.getByRole("button", { name: "Prepare factory reset" }).click();
  assert.deepEqual(await page.evaluate(() => window.calls.map((x) => x.name)), [
    "ADMIN_FACTORY_RESET_PREPARE",
  ]);
  await page.evaluate(() => (window.confirmed = true));
  await page.getByRole("button", { name: "Prepare factory reset" }).click();
  assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), {
    name: "ADMIN_FACTORY_RESET_COMMIT",
    payload: { challenge: "a".repeat(32), confirmation: "factory_reset" },
  });
});
test("RF learning saves only the detected operation after confirmation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, "rf");
  await page.getByRole("button", { name: "Start remote learning" }).click();
  await page.getByRole("button", { name: "Save detected remote" }).click();
  assert.equal(
    await page.evaluate(() =>
      window.calls.some((x) => x.name === "ADMIN_RF_LEARN_SAVE"),
    ),
    false,
  );
  await page.evaluate(() => (window.confirmed = true));
  await page.getByRole("button", { name: "Save detected remote" }).click();
  assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), {
    name: "ADMIN_RF_LEARN_SAVE",
    payload: { operationId: "learn-1", expectedRevision: 7 },
  });
});
