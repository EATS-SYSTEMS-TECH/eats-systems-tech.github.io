import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("secure session renewal preserves edits and daily identity without replaying uncertain operations", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  t.after(() => page.close());
  await page.route(origin + "/renewal-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><div id="root"></div>',
    }),
  );
  await page.goto(origin + "/renewal-fixture");
  await page.evaluate(async () => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    window.connections = [];
    window.commands = [];
    window.identityChecks = 0;
    const system = {
      id: "system",
      name: "Test gate",
      type: "gate",
      systemIds: ["gate"],
      version: 1,
      status: "active",
    };
    const api = async (path) => {
      if (path === "/me")
        return { role: "user", account: { id: "owner" }, organizations: [] };
      if (path.startsWith("/systems?")) return { items: [system] };
      throw new Error("Unexpected API path: " + path);
    };
    class Connection {
      constructor({ onState }) {
        this.onState = onState;
        window.connections.push(this);
      }
      async open() {
        this.session = {};
        this.onState("active");
      }
      close() {
        this.session = null;
        if (this.holdCancellation && !this.cancellation) {
          this.cancellation = new Promise((resolve) => {
            window.releaseCancellation = resolve;
          });
        }
        return this.cancellation;
      }
      expire() {
        this.onState("SECURE_SESSION_EXPIRED");
        this.close();
      }
      async command(cmd) {
        window.commands.push(cmd);
        if (cmd === "ADMIN_GET_GATE_CONFIG")
          return {
            data: {
              revision: 1,
              config: {
                command: "PUSH_BUTTON",
                pulseWidth1Millis: 1000,
                pulseWidth2Millis: 1000,
                pulseWidth3Millis: 1000,
                timeBetweenPulses1Seconds: 1,
                timeBetweenPulses2Seconds: 1,
              },
            },
          };
        return { data: { systemId: "gate" } };
      }
    }
    window.manager = createManagerDashboard({
      root: document.querySelector("#root"),
      user: { uid: "owner" },
      api,
      Connection,
      ensureRecent: async () => {
        window.identityChecks++;
      },
    });
    await window.manager.ready;
  });
  await page
    .getByRole("button", { name: "Open workspace", exact: true })
    .click();
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  const input = page.getByLabel("First pulse (ms)", { exact: true });
  await input.fill("1234");
  await page.evaluate(() => {
    window.connections[0].holdCancellation = true;
    window.connections[0].busy = true;
    window.connections[0].pendingCommand = "ADMIN_PING";
    window.connections[0].expire();
  });
  assert.equal(
    await page.locator("#manager-content").evaluate((el) => el.inert),
    true,
  );
  assert.equal(await page.evaluate(() => window.connections.length), 1);
  await page.evaluate(() => window.releaseCancellation());
  await page.waitForFunction(
    () =>
      window.connections.length === 2 &&
      !document.querySelector("#manager-content").inert,
  );
  assert.equal(await input.inputValue(), "1234");
  assert.equal(
    await page
      .getByRole("tab", { name: "Settings", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.equal(await page.evaluate(() => window.identityChecks), 1);
  assert.equal(
    await page.evaluate(() =>
      window.commands.some((cmd) => cmd.startsWith("ADMIN_SET")),
    ),
    false,
  );

  // An operation in progress has an unknown outcome: require readback instead
  // of silently repeating it on a replacement connection.
  await page.evaluate(() => {
    const c = window.connections[1];
    c.busy = true;
    c.expire();
  });
  await page
    .getByRole("button", { name: "Reconnect to gate", exact: true })
    .waitFor();
  assert.equal(await page.evaluate(() => window.connections.length), 2);
  await page
    .getByRole("button", { name: "Reconnect to gate", exact: true })
    .click();
  await page.waitForFunction(() => window.connections.length === 3);
  assert.equal(await page.evaluate(() => window.identityChecks), 1);
  assert.equal(
    await page.evaluate(() =>
      window.commands.some((cmd) => cmd.startsWith("ADMIN_SET")),
    ),
    false,
  );

  // A network failure offers an explicit retry and does not replay writes.
  await page.evaluate(() => {
    window.connections[2].onState("DISCONNECTED");
    window.connections[2].close();
  });
  await page.getByRole("heading", { name: "Connection interrupted" }).waitFor();
  await page.getByRole("button", { name: "Reconnect to gate", exact: true }).click();
  await page.waitForFunction(() => window.connections.length === 4);
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  // An idle channel renewal cancels a pending confirmation; it cannot apply
  // that old draft against the replacement connection.
  await page.evaluate(() => window.connections[3].expire());
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await page.waitForFunction(() => window.connections.length === 5);
  assert.equal(await page.evaluate(() => window.commands.some((cmd) => cmd.startsWith("ADMIN_SET"))), false);
  assert.equal(await page.evaluate(() => window.identityChecks), 1);

  // Leaving while cancellation is pending must not open a background session.
  await page.evaluate(() => {
    const c = window.connections[4];
    c.holdCancellation = true;
    c.expire();
  });
  await page.getByRole("button", { name: "My systems", exact: true }).click();
  await page.evaluate(() => window.releaseCancellation());
  await page
    .getByRole("button", { name: "Open workspace", exact: true })
    .waitFor();
  assert.equal(await page.evaluate(() => window.connections.length), 5);
  await page.evaluate(() => window.manager.close());
});
