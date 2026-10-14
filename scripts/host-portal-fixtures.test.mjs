// scripts/host-portal-browser.test.mjs drives Host sign-in, the Platform page
// and the owner's team invitations against mocked Firebase and API answers.
// test:staging runs it after the emulator suites; this runs the same script
// against the static site on a free port, so test:dashboard keeps it in step
// with the dashboard without an emulator.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForSite(origin, server) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error("The static site exited before it was ready");
    try {
      const response = await fetch(`${origin}/login/`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("The static site did not start within 30 seconds");
}

test("the Host portal browser fixtures pass against the static site", async (t) => {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "ignore",
    windowsHide: true,
  });
  t.after(() => {
    if (server.exitCode === null) server.kill();
  });
  await waitForSite(origin, server);
  const fixtures = spawn(
    process.execPath,
    ["scripts/host-portal-browser.test.mjs"],
    {
      cwd: root,
      env: { ...process.env, WIFIGATE_SITE_ORIGIN: origin },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let output = "";
  fixtures.stdout.on("data", (chunk) => (output += chunk));
  fixtures.stderr.on("data", (chunk) => (output += chunk));
  const code = await new Promise((resolve, reject) => {
    fixtures.once("error", reject);
    fixtures.once("close", resolve);
  });
  assert.equal(code, 0, output);
  assert.match(output, /Portal browser fixtures passed/);
});
