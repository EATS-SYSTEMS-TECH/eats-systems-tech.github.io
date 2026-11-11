import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, writeFile, mkdir, mkdtemp} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
const logs = process.env.WG_REVIEW_LOG_ROOT ?? path.join(root, ".codex-artifacts/logs/bulk-client-sequence");

test("fresh browser WebCrypto shares, burns and retires the actual sending epoch", {timeout: 60000}, async t => {
  await mkdir(logs, {recursive: true});
  const work = await mkdtemp(path.join(logs, "site-browser-"));
  const temp = path.join(work, "temp");
  await mkdir(temp);
  // The edge-only seed bridge is the actual private module plus one test export.
  // It is served from, and retained inside, the ignored developer evidence root.
  const epoch = await readFile(path.join(root, "js/manager-bulk-sequence.js"), "utf8") +
    "\nexport function seedForTest(owner,n){epochs.get(owner[epochHandle]).next=n;}\n";
  await writeFile(path.join(work, "epoch-bridge.js"), epoch);
  const cryptoSource = await readFile(path.join(root, "js/manager-crypto.js"), "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/") {response.writeHead(200, {"Content-Type": "text/html"});response.end("<!doctype html><title>Local bulk sequence probe</title>");}
    else if (request.url === "/js/manager-crypto.js" || request.url === "/js/manager-bulk-sequence.js") {
      response.writeHead(200, {"Content-Type": "text/javascript"});
      response.end(request.url.endsWith("manager-crypto.js") ? cryptoSource : epoch);
    } else {response.writeHead(404);response.end();}
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = "http://127.0.0.1:" + server.address().port;
  const originalTemp = process.env.TEMP, originalTmp = process.env.TMP;
  process.env.TEMP = temp; process.env.TMP = temp;
  let browser;
  try {
    browser = await chromium.launchPersistentContext(path.join(work, "profile"), {
      executablePath: process.env.WG_TEST_BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      headless: true, downloadsPath: path.join(work, "downloads"), tracesDir: path.join(work, "traces"),
      env: {...process.env, TEMP: temp, TMP: temp},
      args: ["--disable-background-networking", "--no-first-run", "--disable-sync"],
    });
    await browser.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
    const page = await browser.newPage();
    await page.goto(origin);
    const result = await page.evaluate(async () => {
      const c = await import("/js/manager-crypto.js"), e = await import("/js/manager-bulk-sequence.js");
      let seed = 0;
      const session = () => {const n = ++seed;return e.beginBulkSendEpoch({systemId: "synthetic-system", sessionId: n.toString(16).padStart(16,"0"), transcriptHash: new Uint8Array(32).fill(n), clientWriteKey: new Uint8Array(32).fill(n+1), deviceWriteKey: new Uint8Array(32).fill(n+2)});};
      const frame = {type: 1, transferId: 99, byteOffset: 0, flagsOrValue: 1, plaintext: Uint8Array.of(1)};
      const sequence = bytes => new DataView(bytes.buffer, bytes.byteOffset).getUint32(8);
      const check = (value, message) => {if (!value) throw Error(message);};
      const refuses = async (operation, reason) => {try {await operation();} catch (error) {check(error.message.toLowerCase().includes(reason), "wrong refusal");return;}throw Error("missing refusal");};
      const s = session();
      const packets = await Promise.all([s, {...s}, Object.assign({},s)].map(owner => c.managerClientBulkFrame(owner, frame)));
      check(packets.map(sequence).join(",") === "1,2,3", "concurrent sequence reservation");
      for (const owner of [{}, structuredClone(s), JSON.parse(JSON.stringify(s))]) await refuses(() => c.managerClientBulkFrame(owner, frame), "unavailable");
      await refuses(() => c.managerClientBulkFrame(s, {...frame, transferId: 0}), "invalid_bulk_frame");
      check(sequence(await c.managerClientBulkFrame(s, frame)) === 5, "invalid frame must burn reservation");
      const last = session();e.seedForTest(last,0xffffffff);
      check(sequence(await c.managerClientBulkFrame(last,frame)) === 0xffffffff, "MAX must remain usable");
      await refuses(() => c.managerClientBulkFrame({...last},frame), "exhausted");
      c.eraseManagerSession({...s});await refuses(() => c.managerClientBulkFrame(s,frame), "closed");
      check(s.clientWriteKey.every(n => n === 0), "existing erase behavior");
      check(sequence(await c.managerClientBulkFrame(session(), frame)) === 1, "fresh keys start fresh epoch");
      return {sequences: packets.map(sequence), failedReservationNext: 5, max: 0xffffffff, unregisteredRefused: 3, closed: true, wireLength: packets[0].length};
    });
    await writeFile(path.join(work, "result.json"), JSON.stringify(result, null, 2) + "\n");
    assert.deepEqual(result.sequences, [1, 2, 3]);
    assert.equal(result.wireLength, 37);
  } finally {
    await browser?.close();
    if (originalTemp === undefined) delete process.env.TEMP; else process.env.TEMP = originalTemp;
    if (originalTmp === undefined) delete process.env.TMP; else process.env.TMP = originalTmp;
  }
});
