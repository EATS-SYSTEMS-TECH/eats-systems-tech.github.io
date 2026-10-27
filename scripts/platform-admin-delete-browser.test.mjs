import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const people = [
  {name:"Example Admin",email:"admin@example.test",role:"admin",identityStatus:"verified",products:{host:{state:"blocked"},pay:{state:"no-plan"},manager:{state:"no-plan"}}},
  {name:"Example User",email:"user@example.test",role:"user",identityStatus:"unavailable",products:{}},
  {name:"Current Admin",email:"fixture@example.test",role:"admin",identityStatus:"verified",products:{host:{state:"blocked"},pay:{state:"no-plan"},manager:{state:"no-plan"}}},
];
const admin={platformRole:"admin",admin:true,enrolled:true,verified:true,authTime:Math.floor(Date.now()/1000)};

test("account deletion is visible on admin/user rows, readable on hover, confirmed explicitly and retryable",async t=>{
  const {origin,browser}=await startSite(t);
  for (const language of ["he","en"]) for (const width of [390,1440]) {
    const {page,context,errors}=await scenario(browser,admin);t.after(()=>context.close());
    await page.setViewportSize({width,height:950});
    const changes=[];let previewRelease, delayPreview=true;
    await context.route("**/api/v1/platform/directory?*",route=>{
      const role=new URL(route.request().url()).searchParams.get("role");
      return route.fulfill({json:{counts:{admins:2,users:1,total:3},productCounts:{host:3,pay:2,manager:3},items:people.filter(p=>role==="all"||p.role===role),nextCursor:null}});
    });
    await context.route("**/api/v1/platform/directory/financials?*",route=>route.fulfill({json:{totals:[],unknownAccounts:1,complete:false}}));
    await context.route("**/api/v1/platform/directory/account/deletion",async route=>{
      if(delayPreview) await new Promise(resolve=>previewRelease=resolve);
      return route.fulfill({json:{allowed:true,targetUid:"target-uid",subscriptions:[],closingOrganizations:[],memberships:1,mySystems:1}});
    });
    await context.route("**/api/v1/platform/directory/account/delete",route=>{
      changes.push({body:route.request().postDataJSON(),key:route.request().headers()["idempotency-key"]});
      return route.fulfill(changes.length===1?{status:503,json:{error:{code:"ACCOUNT_DELETION_INCOMPLETE"}}}:{json:{deleted:true}});
    });
    await page.goto(origin+"/dashboard/platform/"+(language==="he"?"?lang=he":""));
    const root=page.locator("#platform-admin-management");await root.locator(".platform-admin-delete").first().waitFor();
    assert.equal(await root.locator(".platform-admin-delete").count(),3);
    assert.equal(await root.locator(".platform-admin-delete").last().isDisabled(),true);
    assert.equal((await root.textContent()).includes("—"),false);
    const row=root.locator(".platform-admin-person-summary").first();await row.hover();
    const colors=await row.evaluate(el=>({background:getComputedStyle(el).backgroundColor,text:[...el.querySelectorAll("strong,.platform-admin-person-identity>span,.platform-admin-person-price small,.platform-admin-role")].map(n=>getComputedStyle(n).color)}));
    assert.equal(colors.background,"rgb(17, 24, 39)");assert.ok(colors.text.every(v=>v==="rgb(255, 255, 255)"),JSON.stringify(colors));
    await row.locator(".platform-admin-delete").click();
    assert.equal(await root.locator(".platform-admin-person").first().getAttribute("open"),null,"trash never expands a row");
    const modal=page.locator(".platform-account-delete-dialog");await modal.waitFor();
    const submit=modal.locator("button[type=submit]");assert.equal(await submit.isDisabled(),true);
    await modal.locator("input[name=confirmEmail]").fill("admin@example.test");
    assert.equal(await submit.isDisabled(),true,"the server preview must finish first");
    previewRelease();delayPreview=false;await submit.waitFor({state:"visible"});
    await page.waitForFunction(()=>!document.querySelector(".platform-account-delete-dialog button[type=submit]").disabled);
    assert.match(await modal.textContent(),language==="he"?/המנויים השייכים לו יבוטלו/:/subscriptions will be cancelled/);
    await modal.locator("input[name=confirmEmail]").fill("wrong@example.test");assert.equal(await submit.isDisabled(),true);
    await modal.getByRole("button",{name:language==="he"?"ביטול":"Cancel",exact:true}).click();assert.equal(changes.length,0);
    await row.locator(".platform-admin-delete").click();await modal.waitFor();
    await modal.locator("input[name=confirmEmail]").fill("admin@example.test");
    await page.waitForFunction(()=>!document.querySelector(".platform-account-delete-dialog button[type=submit]").disabled);
    if(process.env.WIFIGATE_DELETE_SCREENSHOT_PREFIX) await page.screenshot({path:`${process.env.WIFIGATE_DELETE_SCREENSHOT_PREFIX}-${language}-${width}.png`,fullPage:true});
    await submit.click();await modal.getByText(language==="he"?/נסו שוב כדי להשלים/:/Retry to finish/).waitFor();
    await submit.click();await modal.waitFor({state:"hidden"});
    assert.equal(changes.length,2);assert.equal(changes[0].key,changes[1].key);
    assert.deepEqual(changes[0].body,{email:"admin@example.test",confirmEmail:"admin@example.test",targetUid:"target-uid"});
    assert.ok(await root.locator('[role="status"]').allTextContents().then(items=>items.some(v=>language==="he"?v.includes("החשבון הוסר"):v.includes("account was removed"))));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);await context.close();
  }
});

test("product administrators have no global account deletion action",async t=>{
  const {origin,browser}=await startSite(t);
  const {page,context}=await scenario(browser,{...admin,platformRole:null});t.after(()=>context.close());
  await page.goto(origin+"/dashboard/platform/");
  await page.getByText("This page is available to WIFIGATE administrators only.",{exact:true}).waitFor();
  assert.equal(await page.locator(".platform-admin-delete").count(),0);
});
