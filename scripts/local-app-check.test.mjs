import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { request } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { authErrorMessage, isAppCheckError } from "../js/host-auth-errors.js";
import { loadLoginCopy, renderLoginPage } from "./login-pages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const debugFlag = "self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;";

async function start(t, flag) {
  const server = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: "0",
      HOST: "127.0.0.1",
      WIFIGATE_APP_CHECK_DEBUG: flag,
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(
    () =>
      new Promise((resolve) => {
        if (server.exitCode !== null) return resolve();
        server.once("exit", resolve);
        server.kill();
      }),
  );
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error("Local fixture server did not start")),
      10000,
    );
    server.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(output));
    });
    server.stderr.on("data", (chunk) => {
      output += chunk;
    });
    server.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/Local site: (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });
}

function get(origin, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = request(new URL(path, origin), options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

test("App Check debug mode is opt-in, injected before modules, and leaves files and assets untouched", async (t) => {
  const original = await readFile(
    new URL("../login/index.html", import.meta.url),
  );
  const ordinary = await start(t, "");
  const normal = await get(ordinary, "/login/");
  assert.equal(normal.status, 200);
  assert.deepEqual(normal.body, original);
  assert.equal(normal.body.includes(debugFlag), false);

  const debug = await start(t, "1");
  const result = await get(debug, "/login/");
  const html = result.body.toString("utf8");
  assert.equal(result.status, 200);
  assert.equal(Number(result.headers["content-length"]), result.body.length);
  assert.equal(result.headers["cache-control"], "no-store");
  assert.match(result.headers["content-type"], /^text\/html/);
  assert.ok(html.indexOf(debugFlag) > html.indexOf("<head>"));
  assert.ok(html.indexOf(debugFlag) < html.indexOf('type="module"'));
  assert.equal(html.split(debugFlag).length, 2);
  assert.deepEqual(
    await readFile(new URL("../login/index.html", import.meta.url)),
    original,
  );
  const head = await get(debug, "/login/", { method: "HEAD" });
  assert.equal(head.body.length, 0);
  assert.equal(
    head.headers["content-length"],
    result.headers["content-length"],
  );
  const asset = await get(debug, "/js/site-app-check.js");
  assert.deepEqual(
    asset.body,
    await readFile(new URL("../js/site-app-check.js", import.meta.url)),
  );
  for (const host of [
    "evil.example",
    "127.0.0.1.evil.example",
    "evil@localhost",
    "localhost/other",
  ]) {
    assert.equal(
      (await get(debug, "/login/", { headers: { Host: host } })).status,
      403,
      host,
    );
  }
  assert.equal(
    (await get(debug, "/login/", { headers: { Host: "localhost" } })).status,
    200,
  );
});

test("App Check debug mode refuses a public listening address", async () => {
  const child = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: "0",
      HOST: "0.0.0.0",
      WIFIGATE_APP_CHECK_DEBUG: "1",
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  assert.notEqual(code, 0);
  assert.match(output, /requires a loopback HOST/);
});

test("login and shared authentication errors identify browser verification failures in English and Hebrew", async () => {
  const copies = await loadLoginCopy();
  const template = await readFile(
    new URL("../templates/login.template.html", import.meta.url),
    "utf8",
  );
  for (const language of ["en", "he"]) {
    const html = renderLoginPage(template, language, copies[language]);
    const runtime = JSON.parse(
      html.match(/id="login-copy">(.*?)<\/script>/s)[1],
    );
    for (const code of [
      "APP_CHECK_REQUIRED",
      "APP_CHECK_UNCONFIGURED",
      "appCheck/recaptcha-error",
      "appCheck/fetch-status-error",
    ]) {
      const error = { code, status: 403 };
      assert.equal(isAppCheckError(error), true);
      assert.equal(
        authErrorMessage(error, language),
        copies[language].errorAppCheck,
      );
      assert.equal(runtime.errorAppCheck, copies[language].errorAppCheck);
      assert.notEqual(runtime.errorAppCheck, runtime.errorForbidden);
    }
    assert.equal(
      isAppCheckError({ code: "TENANT_ACCESS_DENIED", status: 403 }),
      false,
    );
    assert.equal(
      authErrorMessage({ status: 403 }, language),
      copies[language].errorForbidden,
    );
  }
});
