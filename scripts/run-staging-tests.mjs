import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const siteUrl = "http://127.0.0.1:8100/login/";
const apiUrl = "http://127.0.0.1:8101/health";
const authUrl = "http://127.0.0.1:9099/";

async function ready() {
  try {
    const [site, api, auth] = await Promise.all([siteUrl, apiUrl, authUrl].map((url) => fetch(url, { signal: AbortSignal.timeout(1500) })));
    return site.ok && api.ok && auth.ok;
  } catch { return false; }
}

async function waitForReady(child) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Local staging exited before it was ready");
    if (await ready()) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("Local staging did not become ready within 120 seconds");
}

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: root, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} failed (${code})`)));
  });
}

let staging;
try {
  if (!await ready()) {
    staging = spawn(process.execPath, ["scripts/start-staging.mjs"], {
      cwd: root, stdio: ["pipe", "inherit", "inherit"], windowsHide: true,
      env: { ...process.env, STAGING_TEST_RUN: "1" }
    });
    await waitForReady(staging);
  }
  await run("scripts/staging-e2e.mjs");
  await run("scripts/staging-browser-e2e.mjs");
  await run("scripts/host-portal-browser.test.mjs");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (staging && staging.exitCode === null) {
    staging.stdin.write("shutdown\n");
    staging.stdin.end();
    await new Promise((resolve) => {
      staging.once("exit", resolve);
      setTimeout(resolve, 3000).unref();
    });
  }
}
