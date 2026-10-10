import { spawn } from "node:child_process";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const children = [];

function start(args, env = {}) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ...env }, windowsHide: true });
  children.push(child);
  child.once("exit", (code) => {
    if (!shuttingDown) {
      console.error(`Staging process exited (${code ?? "signal"}).`);
      shutdown();
    }
  });
  return child;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) if (!child.killed) child.kill();
  setTimeout(() => process.exit(), 500).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
if (process.env.STAGING_TEST_RUN === "1") {
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (value) => { if (value.includes("shutdown")) shutdown(); });
}

async function waitForPort(port, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !shuttingDown) {
    const ready = await new Promise((resolve) => {
      const socket = connect(port, "127.0.0.1");
      socket.once("connect", () => { socket.destroy(); resolve(true); });
      socket.once("error", () => resolve(false));
      socket.setTimeout(500, () => { socket.destroy(); resolve(false); });
    });
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Port ${port} did not become ready`);
}

try {
  start(["node_modules/firebase-tools/lib/bin/firebase.js", "emulators:start", "--only", "auth", "--project", "demo-wifigate-host", "--config", "firebase.staging.json", "--non-interactive"]);
  await waitForPort(9099);
  start(["scripts/staging-api.mjs"], { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
  start(["scripts/serve.mjs"], { HOST: "127.0.0.1", PORT: "8100" });
  await Promise.all([waitForPort(8100), waitForPort(8101)]);
  console.log("\nLocal staging ready: http://127.0.0.1:8100/login/\n");
} catch (error) {
  console.error(error.message);
  shutdown();
}
