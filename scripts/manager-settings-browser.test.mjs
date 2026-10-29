import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

const timing = ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis", "timeBetweenPulses2Seconds", "pulseWidth3Millis"];
const methods = ["PULSE", "PULSE_AFTER_PULSE", "PULSE_AFTER_PULSE_AFTER_PULSE", "TOGGLE", "PUSH_BUTTON"];
const saved = { command: "PULSE", pulseWidth1Millis: 1000, timeBetweenPulses1Seconds: 5, pulseWidth2Millis: 2000, timeBetweenPulses2Seconds: 10, pulseWidth3Millis: 3000 };

async function setup(browser, origin, { language = "en", width = 390, locked = false, command = "PULSE" } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route(origin + "/settings-fixture", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div class="manager-control-workspace" id="root"></div></section></main></body></html>`,
  }));
  await page.goto(origin + "/settings-fixture");
  await page.evaluate(async ({ language, locked, config }) => {
    const { renderManagerSettings } = await import("/js/manager-settings.js");
    window.writes = [];
    window.confirmations = 0;
    window.current = true;
    window.editor = renderManagerSettings({
      root: document.getElementById("root"), language, config,
      revision: 12, commandLocked: locked,
      isCurrent: () => window.current,
      errorText: (error) => error.message,
      confirm() { window.confirmations++; return new Promise((resolve) => { window.confirmAnswer = resolve; }); },
      async onSave(payload) {
        window.writes.push(payload);
        if (window.failSave) throw new Error("CONFLICT");
      },
    });
  }, { language, locked, config: { ...saved, command } });
  return page;
}

test("Manager settings shows 1/3/5/0/0 timing fields in English/Hebrew on mobile and desktop", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) for (const width of [320, 390, 1440]) {
    const page = await setup(browser, origin, { language, width });
    try {
      const choose = method => page.locator(`input[name="command"][value="${method}"]`).check();
      for (const [index, method] of methods.entries()) {
        await choose(method);
        assert.equal(await page.getByRole("spinbutton").count(), [1, 3, 5, 0, 0][index], `${language} ${width} ${method}`);
        const visibleNames = await page.getByRole("spinbutton").evaluateAll((items) => items.map((item) => item.name));
        assert.deepEqual(visibleNames, timing.slice(0, [1, 3, 5, 0, 0][index]));
        assert.equal(await page.getByRole("radio", {checked:true}).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (process.env.MANAGER_SETTINGS_EVIDENCE && [1,3].includes(index)) {
          await mkdir(process.env.MANAGER_SETTINGS_EVIDENCE, {recursive:true});
          await page.screenshot({path:`${process.env.MANAGER_SETTINGS_EVIDENCE}/settings-${language}-${width}-${method}.png`,fullPage:true});
        }
        if (["TOGGLE", "PUSH_BUTTON"].includes(method)) {
          assert.equal(await page.getByRole("heading", { name: language === "he" ? "תזמון הפעולה" : "Action timing" }).count(), 0);
          assert.equal(await page.getByRole("spinbutton", { name: /פולס|השהיה|pulse|delay/ }).count(), 0);
          assert.equal(await page.locator("input[type=number]:not(:disabled)").count(), 0);
        }
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.evaluate(() => window.writes.length), 0);
    } finally { await page.close(); }
  }
});

test("Manager settings merges active timings with saved inactive values and only writes after confirmation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(browser, origin);
  t.after(() => page.close());
  const choose = method => page.locator(`input[name="command"][value="${method}"]`).check();
  const save = page.getByRole("button", { name: "Save settings" });
  await choose("PULSE_AFTER_PULSE_AFTER_PULSE");
  await page.locator("[name=pulseWidth1Millis]").fill("1500");
  await page.locator("[name=pulseWidth2Millis]").fill("9000");
  await page.locator("[name=timeBetweenPulses2Seconds]").fill("90");
  await choose("PULSE");
  await save.click();
  await page.waitForFunction(() => window.confirmations === 1);
  assert.equal(await page.evaluate(() => window.writes.length), 0);
  await page.evaluate(() => window.confirmAnswer(false));
  await page.waitForFunction(() => !document.querySelector("button[type=submit]").disabled);
  assert.equal(await page.evaluate(() => window.writes.length), 0);
  await save.click();
  await page.waitForFunction(() => window.confirmations === 2);
  await page.evaluate(() => window.confirmAnswer(true));
  await page.waitForFunction(() => window.writes.length === 1);
  assert.deepEqual(await page.evaluate(() => window.writes[0]), { ...saved, pulseWidth1Millis: 1500, expectedRevision: 12 });
  for (const method of ["TOGGLE", "PUSH_BUTTON"]) {
    await choose(method);
    await page.evaluate(() => {
      for (const input of document.querySelectorAll("input[type=number]")) input.value = "99999999";
    });
    const previous = await page.evaluate(() => window.confirmations);
    await save.click();
    await page.waitForFunction((value) => window.confirmations > value, previous);
    await page.evaluate(() => window.confirmAnswer(true));
    await page.waitForFunction((count) => window.writes.length > count, method === "TOGGLE" ? 1 : 2);
    assert.deepEqual(await page.evaluate(() => window.writes.at(-1)), { ...saved, command: method, expectedRevision: 12 });
  }
});

test("Manager settings guards pulse/gap ranges, pending confirmation navigation and disposal", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(browser, origin, { command: "PULSE_AFTER_PULSE_AFTER_PULSE" });
  t.after(() => page.close());
  for (const key of timing) {
    const field = page.locator(`[name=${key}]`), gap = key.startsWith("timeBetween");
    assert.equal(await field.getAttribute("min"), gap ? "1" : "500");
    assert.equal(await field.getAttribute("max"), gap ? "300" : "60000");
    await field.fill(gap ? "0" : "499");
    await page.getByRole("button", { name: "Save settings" }).click();
    assert.equal(await page.evaluate(() => window.confirmations), 0);
    assert.equal(await field.evaluate((item) => item.validity.rangeUnderflow), true);
    await field.fill(String(saved[key]));
    await field.fill(gap ? "301" : "60001");
    await page.getByRole("button", { name: "Save settings" }).click();
    assert.equal(await page.evaluate(() => window.confirmations), 0);
    assert.equal(await field.evaluate((item) => item.validity.rangeOverflow), true);
    await field.fill(String(saved[key]));
  }
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.waitForFunction(() => window.confirmations === 1);
  await page.evaluate(() => { window.current = false; window.confirmAnswer(true); });
  await page.waitForFunction(() => !document.querySelector("button[type=submit]").disabled);
  assert.equal(await page.evaluate(() => window.writes.length), 0);
  await page.evaluate(() => { window.current = true; });
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.waitForFunction(() => window.confirmations === 2);
  await page.evaluate(() => { window.editor.dispose(); window.confirmAnswer(true); });
  await page.waitForFunction(() => !document.querySelector("button[type=submit]").disabled);
  assert.equal(await page.evaluate(() => window.writes.length), 0);
  await page.locator("form").evaluate((form) => form.requestSubmit());
  assert.equal(await page.evaluate(() => window.confirmations), 2);
});

test("Manager Dual Control locks opening method and rejects programmatic method changes", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(browser, origin, { locked: true, language: "he", command: "PULSE_AFTER_PULSE" });
  t.after(() => page.close());
  const select = page.locator('input[name="command"][value="TOGGLE"]');
  assert.equal(await select.isDisabled(), true);
  assert.equal(await page.getByRole("spinbutton").count(), 3);
  await page.locator("[name=pulseWidth1Millis]").fill("500");
  await page.getByRole('button', {name:'ביטול שינויים',exact:true}).click();
  assert.equal(await page.locator('[name=pulseWidth1Millis]').inputValue(),'1000');
  assert.equal(await page.locator('[name=pulseWidth1Millis]').evaluate(el=>document.activeElement===el),true);
  await page.locator("[name=pulseWidth1Millis]").fill("500");
  await page.getByRole("button", { name: "שמירת הגדרות" }).click();
  await page.waitForFunction(() => window.confirmations === 1);
  await page.evaluate(() => window.confirmAnswer(false));
  await page.waitForFunction(() => !document.querySelector("button[type=submit]").disabled);
  assert.equal(await select.isDisabled(), true);
  await select.evaluate((input) => { input.checked = true; input.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.locator("form").evaluate((form) => form.requestSubmit());
  await page.getByRole("alert").filter({ hasText: "INVALID_CONFIG" }).waitFor();
  assert.equal(await page.evaluate(() => window.confirmations), 1);
  assert.equal(await page.evaluate(() => window.writes.length), 0);
});

test("settings reset stays local, keyboard selection remains native, failed save retains draft and cancellation restores focus", async t => {
  const {origin,browser}=await startSite(t);
  const page=await setup(browser,origin);
  t.after(()=>page.close());
  const reset=page.getByRole('button',{name:'Reset changes',exact:true});
  assert.equal(await reset.isDisabled(),true);
  const first=page.getByRole('radio',{name:'Single pulse',exact:true});
  await first.focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('radio',{checked:true}).count(),1);
  assert.equal(await page.evaluate(()=>document.activeElement.matches(':focus-visible')),true);
  await page.locator('input[name="command"][value="PULSE_AFTER_PULSE"]').check();
  await page.locator('[name="pulseWidth1Millis"]').fill('1500');
  assert.equal(await reset.isEnabled(),true);
  await reset.click();
  assert.equal(await first.isChecked(),true);
  assert.equal(await page.locator('[name="pulseWidth1Millis"]').inputValue(),'1000');
  assert.equal(await page.evaluate(()=>window.writes.length),0);
  await page.locator('[name="pulseWidth1Millis"]').fill('1750');
  const save=page.getByRole('button',{name:'Save settings',exact:true});
  await save.click();await page.waitForFunction(()=>window.confirmations===1);
  assert.equal(await reset.isDisabled(),true);
  await page.evaluate(()=>window.confirmAnswer(false));
  await page.waitForFunction(()=>!document.querySelector('button[type=submit]').disabled);
  assert.equal(await save.evaluate(el=>document.activeElement===el),true);
  assert.equal(await page.evaluate(()=>window.writes.length),0);
  await page.evaluate(()=>window.failSave=true);
  await save.click();await page.waitForFunction(()=>window.confirmations===2);
  await page.evaluate(()=>window.confirmAnswer(true));
  await page.getByRole('alert').filter({hasText:'CONFLICT'}).waitFor();
  assert.equal(await page.locator('[name="pulseWidth1Millis"]').inputValue(),'1750');
  assert.equal(await reset.isEnabled(),true);
});
