import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function setup(t, browser, origin, kind, language = "en", options = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  t.after(() => page.close());
  await page.goto(origin + "/404.html");
  await page.evaluate(
    async ({ kind, language, options }) => {
      const { renderManagerDeviceControls } =
        await import("/js/manager-device-controls.js");
      document.body.replaceChildren();
      const root = document.createElement("main");
      document.body.append(root);
      window.calls = [];
      window.refreshes = 0;
      window.confirmed = false;
      window.resetResults = [];
      window.current = true;
      window.firmwareDownloads=0;window.firmwareUpdates=0;
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
                : name === "ADMIN_FACTORY_RESET_COMMIT"
                  ? { accepted: true }
                : name === "ADMIN_GET_QR_PAYLOAD"
                  ? {
                      sensitive: true,
                      hardwareType: options.hardwareType,
                      firmwareVersion: "W.11.26.28",
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
                          firmwareVersion: "W.11.26.18",
                          releaseCounter:2026110018,
                          pendingVerify:false,
                          ...options.status,
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
        confirm: async (message, options) => { window.confirmation = {message, options}; return window.confirmed; },
        ensureRecent: async (options) => {
          window.authOptions = options;
          if(window.deferQrAuth)await new Promise(resolve=>window.finishQrAuth=resolve);
        },
        qrSource:async(payload)=>{window.qrEncodedPayload=payload;return options.badQr?'plain-json-not-a-WIFIGATE-code':'WGQ.'+'a'.repeat(100);},
        onFactoryReset: async result => window.resetResults.push(result),
        errorText: (e) => e.message,
        onRefresh: async () => window.refreshes++,
        firmwareSource:kind==='firmware'?{
          latest:async()=>{
            if(options.unavailable)throw Error('FIRMWARE_SOURCE_UNAVAILABLE');
            return{releaseId:'a'.repeat(64),manifest:{version:options.latestVersion||'W.11.26.19',releaseCounter:options.latestCounter||2026110019}};
          },
          download:async()=>{window.firmwareDownloads++;return{bytes:new Uint8Array([1,2,3]),beginPayload:{version:'W.11.26.19'}}},
        }:undefined,
        onFirmwareUpdate:async()=>{window.firmwareUpdates++},
      });
    },
    { kind, language, options },
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

test('Automatic firmware panel shows installed/latest/decision and one update action without file inputs',async t=>{
  const {origin,browser}=await startSite(t);
  for(const language of ['he','en']){
    const page=await setup(t,browser,origin,'firmware',language);
    assert.equal(await page.locator('input[type="file"]').count(),0);
    const facts=await page.locator('.manager-firmware-facts').innerText();
    assert.match(facts,/W\.11\.26\.18/);assert.match(facts,/W\.11\.26\.19/);
    const update=page.getByRole('button',{name:language==='he'?'עדכון קושחה':'Update firmware',exact:true});
    await update.click();assert.equal(await page.evaluate(()=>window.firmwareUpdates),0);
    await page.evaluate(()=>window.confirmed=true);
    await update.click();
    assert.equal(await page.evaluate(()=>window.firmwareDownloads),1);
    assert.equal(await page.evaluate(()=>window.firmwareUpdates),1);
    assert.deepEqual(await page.evaluate(()=>window.authOptions),{maxAgeSeconds:240,requireTotp:true});
  }
});

test('Identical and unavailable releases never offer a download',async t=>{
  const {origin,browser}=await startSite(t);
  for(const options of [{latestCounter:2026110018,latestVersion:'W.11.26.18'},{unavailable:true}]){
    const page=await setup(t,browser,origin,'firmware','en',options);
    assert.equal(await page.getByRole('button',{name:'Update firmware',exact:true}).isDisabled(),true);
    assert.equal(await page.locator('input[type="file"]').count(),0);
    assert.equal(await page.evaluate(()=>window.firmwareDownloads),0);
    assert.match(await page.locator('.manager-firmware-facts').innerText(),options.unavailable?/Unknown/:/No/);
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
    requireTotp: true,
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

test("Raw JSON is never rendered as a label; hiding during encoding discards the late token",async t=>{
  const {origin,browser}=await startSite(t);
  const invalid=await setup(t,browser,origin,'qr','en',{badQr:true});
  await invalid.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  assert.equal(await invalid.locator('.manager-qr-label svg').count(),0);
  assert.match(await invalid.getByRole('alert').innerText(),/INVALID_RESPONSE/);
  const page=await setup(t,browser,origin,'qr');
  await page.evaluate(()=>{window.connection.command=()=>new Promise(resolve=>window.resolveQr=resolve);});
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  await page.waitForFunction(()=>Boolean(window.resolveQr));
  await page.getByRole('button',{name:'Hide label',exact:true}).click();
  await page.evaluate(()=>window.resolveQr({data:{sensitive:true,payload:{i:'DEMO',n:'Demo'}}}));
  await page.waitForFunction(()=>!document.querySelector('.manager-button.primary').disabled);
  assert.equal(await page.locator('.manager-qr-label svg').count(),0);
});

test('A successful label retry clears an earlier failure message',async t=>{
  const {origin,browser}=await startSite(t);const page=await setup(t,browser,origin,'qr','en',{badQr:true});
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  assert.match(await page.getByRole('alert').innerText(),/INVALID_RESPONSE/);
  await page.evaluate(()=>{window.connection.command=async()=>({data:{sensitive:true,payload:{i:'DEMO',n:'Demo'}}});});
  // Replace the fixture encoder only through a new real component invocation.
  await page.evaluate(async()=>{
    window.panel.dispose();document.querySelector('main').replaceChildren();
    const {renderManagerDeviceControls}=await import('/js/manager-device-controls.js');
    window.panel=await renderManagerDeviceControls({root:document.querySelector('main'),kind:'qr',connection:window.connection,
      isCurrent:()=>true,ensureRecent:async()=>{},errorText:e=>e.message,qrSource:async()=>{if(!window.qrReady)throw Error('QR_LABEL_UNAVAILABLE');return 'WGQ.'+'a'.repeat(100);}});
  });
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  assert.match(await page.getByRole('alert').innerText(),/QR_LABEL_UNAVAILABLE/);
  await page.evaluate(()=>window.qrReady=true);
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  assert.equal(await page.getByRole('alert').count(),0);
  assert.match(await page.getByRole('status').innerText(),/ready to scan/);
});

test('Hide during QR identity verification cancels the pending label; the normal authentication popup can return safely',async t=>{
  const {origin,browser}=await startSite(t);
  for(const hide of [true,false]){
    const page=await setup(t,browser,origin,'qr');
    await page.evaluate(()=>{
      window.deferQrAuth=true;window.backgrounded=false;
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.backgrounded});
    });
    await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
    await page.waitForFunction(()=>typeof window.finishQrAuth==='function');
    if(hide)await page.getByRole('button',{name:'Hide label',exact:true}).click();
    else await page.evaluate(()=>{window.backgrounded=true;document.dispatchEvent(new Event('visibilitychange'));window.backgrounded=false;document.dispatchEvent(new Event('visibilitychange'));});
    await page.evaluate(()=>window.finishQrAuth());
    await page.waitForFunction(()=>!document.querySelector('.manager-button.primary').disabled);
    assert.equal(await page.locator('.manager-qr-label svg').count(),hide?0:1);
  }
});
test("Factory reset prepares but never commits after cancellation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, "reset");
  await page.getByRole("button", { name: "Factory reset", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.calls.map((x) => x.name)), [
    "ADMIN_FACTORY_RESET_PREPARE",
  ]);
  await page.evaluate(() => (window.confirmed = true));
  assert.deepEqual(await page.evaluate(() => window.authOptions), {maxAgeSeconds:240,force:true,requireTotp:true});
  assert.equal(await page.locator('.manager-reset-button.danger').count(), 1);
  assert.match(await page.locator('main').innerText(), /Wi-Fi networks.*administrators.*Manager authorization/s);
  assert.equal((await page.evaluate(() => window.confirmation.options)).danger, true);
  await page.getByRole("button", { name: "Factory reset", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), {
    name: "ADMIN_FACTORY_RESET_COMMIT",
    payload: { challenge: "a".repeat(32), confirmation: "factory_reset" },
  });
  assert.deepEqual(await page.evaluate(() => window.resetResults), [{acknowledged:true}]);
});

test("Factory reset never prepares when authenticator verification fails", async t => {
  const {origin,browser}=await startSite(t);
  const page=await setup(t,browser,origin,"reset","he");
  await page.evaluate(async()=>{
    window.panel.dispose();document.querySelector('main').replaceChildren();
    const {renderManagerDeviceControls}=await import('/js/manager-device-controls.js');
    window.panel=await renderManagerDeviceControls({root:document.querySelector('main'),kind:'reset',language:'he',connection:window.connection,isCurrent:()=>true,confirm:async()=>true,ensureRecent:async()=>{throw Error('TOTP_REQUIRED')},errorText:e=>e.message});
  });
  await page.getByRole('button',{name:'איפוס להגדרות יצרן',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.calls),[]);
  assert.match(await page.getByRole('alert').innerText(),/TOTP_REQUIRED/);
});

test("Factory reset uncertain reply closes the workspace once without replay", async t => {
  const {origin,browser}=await startSite(t);
  const page=await setup(t,browser,origin,"reset");
  await page.evaluate(()=>{
    window.confirmed=true;
    const send=window.connection.command;
    window.connection.command=async(name,payload)=>{
      if(name!=='ADMIN_FACTORY_RESET_COMMIT')return send(name,payload);
      window.calls.push({name,payload});throw Error('RESPONSE_TIMEOUT');
    };
  });
  await page.getByRole('button',{name:'Factory reset',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.resetResults),[{acknowledged:false}]);
  assert.equal(await page.evaluate(()=>window.calls.filter(x=>x.name==='ADMIN_FACTORY_RESET_COMMIT').length),1);
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


test('Pending controller verification blocks updates and Check again reads fresh controller status',async t=>{
  const {origin,browser}=await startSite(t);
  for(const status of [{pendingVerify:true},{rebootPending:true}]){
    const page=await setup(t,browser,origin,'firmware','en',{status});
    const update=page.getByRole('button',{name:'Update firmware',exact:true});
    assert.equal(await update.isDisabled(),true);
    assert.match(await page.getByRole('status').innerText(),/completing restart and verification/);
    await page.evaluate(()=>{
      window.connection.command=async name=>{
        window.calls.push({name});
        return {data:{firmwareVersion:'W.11.26.20',releaseCounter:2026110020,pendingVerify:false}};
      };
    });
    await page.getByRole('button',{name:'Check again',exact:true}).click();
    assert.equal(await update.isDisabled(),false);
    assert.match(await page.locator('.manager-firmware-facts').innerText(),/W\.11\.26\.20/);
    assert.equal(await page.evaluate(()=>window.calls.at(-1).name),'ADMIN_FOTA_GET_STATUS');
  }
});

test('A different signed published build is offered even when its build counter is lower',async t=>{
 const {origin,browser}=await startSite(t);
 const page=await setup(t,browser,origin,'firmware','en',{latestVersion:'W.11.26.17',latestCounter:2026110017});
 assert.equal(await page.getByRole('button',{name:'Update firmware',exact:true}).isEnabled(),true);
 assert.match(await page.locator('.manager-firmware-facts').innerText(),/Yes/);
 await page.getByRole('button',{name:'Update firmware',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.firmwareDownloads),0); // cancelled confirmation
});


test('HW Type is above firmware and old firmware never gets a guessed revision',async t=>{
  const {origin,browser}=await startSite(t);
  for(const hardwareType of ['8.0','16.0','16.1',undefined]){
    const page=await setup(t,browser,origin,'firmware','en',{status:{hardwareType,flashVariantMb:16}});
    const facts=await page.locator('.manager-firmware-facts').innerText();
    assert.ok(facts.indexOf('HW Type')<facts.indexOf('Installed version'));
    assert.match(facts,new RegExp(hardwareType?hardwareType.replace('.','\\.'):'—'));
  }
});

test('the original encrypted QR label includes reported HW Type above firmware',async t=>{
  const {origin,browser}=await startSite(t);
  const page=await setup(t,browser,origin,'qr','en',{hardwareType:'16.1'});
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  const label=await page.locator('.manager-qr-label').innerText();
  assert.match(label,/HW Type: 16\.1/);assert.ok(label.indexOf('HW Type')<label.indexOf('W.11.26.28'));
  assert.equal(await page.locator('.manager-qr-label svg').count(),1);
});
