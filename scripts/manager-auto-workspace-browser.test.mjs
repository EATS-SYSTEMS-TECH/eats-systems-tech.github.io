import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("Auto Open shows confirmed state, one action, local search, paged enrollment and safe recovery",async t=>{
  const {origin,browser}=await startSite(t);
  for(const language of ['he','en'])for(const width of [320,390,1440])await t.test(`${language}/${width}`,async t=>{
    const page=await browser.newPage({viewport:{width,height:1000}});page.setDefaultTimeout(8000);t.after(()=>page.close());
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(origin+'/auto-fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${language}" dir="${language==='he'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>`}));
    await page.goto(origin+'/auto-fixture');
    await page.evaluate(async language=>{
      const {createManagerDashboard}=await import('/js/manager-dashboard.js');
      const {ManagerExampleConnection}=await import('/js/manager-example-connection.js');
      const {createManagerExampleData,managerExampleSystems}=await import('/js/manager-example-data.js');
      const data=createManagerExampleData(),system=managerExampleSystems[0];
      window.autoCalls=[];window.autoApiCalls=[];
      window.WebSocket=class{constructor(){throw new Error('Physical transport forbidden in Auto Open fixtures');}};
      class Connection extends ManagerExampleConnection{
        constructor(options){super({data,system,onState:options.onState});}
        async command(name,payload){
          window.autoCalls.push({name,payload});
          if(name==='ADMIN_SET_AUTO_OPEN_CONFIG'&&window.autoFailSave){window.autoFailSave=false;throw new Error('CONFLICT');}
          if(name==='ADMIN_LIST_AUTO_OPEN_USERS'&&payload.page.cursor==='20'&&window.autoStale){window.autoStale=false;throw new Error('STALE_CURSOR');}
          const result=await super.command(name,payload);
          if(name==='ADMIN_GET_AUTO_OPEN_CONFIG'&&window.autoUnknown)delete result.data.config.enabled;
          return result;
        }
      }
      window.dashboard=createManagerDashboard({root:document.querySelector('#root'),user:{uid:'auto-fixture'},language,Connection,
        api:async path=>{window.autoApiCalls.push(path);return path==='/me'?{role:'user',account:{id:'fixture'},organizations:[]}:{items:path.startsWith('/systems?')?[{...system,id:'fixture-real',status:'active'}]:[],nextCursor:null};}});
      await window.dashboard.ready;
    },language);
    const he=language==='he',copy=(h,e)=>he?h:e;
    await page.locator('.manager-view > .manager-grid .manager-system button').click();
    await page.locator('[data-tab="auto"]').click();
    const content=page.locator('#manager-content'),settings=content.locator('.manager-auto-settings'),list=content.locator('.manager-auto-users');
    await list.locator('.manager-auto-user').nth(9).waitFor();
    assert.equal(await settings.locator('button').count(),1);
    assert.equal(await settings.locator('.manager-auto-status').getAttribute('data-state'),'enabled');
    const apiCount=await page.evaluate(()=>window.autoApiCalls.length);
    const readCount=await page.evaluate(()=>window.autoCalls.length);
    const search=list.getByRole('searchbox');
    await search.fill('resident 11');
    assert.equal(await list.locator('.manager-auto-user:visible').count(),0);
    assert.equal(await list.locator('.manager-auto-no-matches').isVisible(),true);
    assert.equal(await page.evaluate(()=>window.autoApiCalls.length),apiCount,'search has no cloud calls');
    assert.equal(await page.evaluate(()=>window.autoCalls.length),readCount,'search has no gate calls');
    const more=list.getByRole('button',{name:copy('משתמשים נוספים','More users'),exact:true});
    await more.click();
    assert.equal(await list.locator('.manager-auto-user').count(),20);
    assert.equal(await search.inputValue(),'resident 11','load more preserves the active query');
    assert.equal(await list.locator('.manager-auto-user:visible').count(),1);
    await page.evaluate(()=>window.autoStale=true);
    await more.click();
    await list.getByRole('alert').waitFor();
    assert.equal(await list.locator('.manager-auto-user').count(),0,'stale enrollment is discarded');
    await list.getByRole('button',{name:copy('ניסיון נוסף','Try again'),exact:true}).click();
    assert.equal(await list.locator('.manager-auto-user').count(),10);
    await search.fill('');
    await more.click();await more.click();
    assert.equal(await list.locator('.manager-auto-user').count(),24);
    assert.equal(await more.isHidden(),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(process.env.MANAGER_AUTO_EVIDENCE){await mkdir(process.env.MANAGER_AUTO_EVIDENCE,{recursive:true});await content.evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`${process.env.MANAGER_AUTO_EVIDENCE}/auto-${language}-${width}.png`});}
    await page.evaluate(()=>window.autoFailSave=true);
    await settings.getByRole('button',{name:copy('כיבוי Auto Open','Disable Auto Open'),exact:true}).click();
    await page.locator('.manager-status[role="alert"]').waitFor();
    assert.equal(await settings.locator('.manager-auto-status').getAttribute('data-state'),'enabled','failed write cannot change confirmed state');
    await settings.getByRole('button',{name:copy('כיבוי Auto Open','Disable Auto Open'),exact:true}).click();
    await settings.getByRole('button',{name:copy('הפעלת Auto Open','Enable Auto Open'),exact:true}).waitFor();
    assert.equal(await settings.locator('.manager-auto-status').getAttribute('data-state'),'disabled');
    await settings.getByRole('button',{name:copy('הפעלת Auto Open','Enable Auto Open'),exact:true}).click();
    await settings.getByRole('button',{name:copy('כיבוי Auto Open','Disable Auto Open'),exact:true}).waitFor();
    const writes=await page.evaluate(()=>window.autoCalls.filter(x=>x.name==='ADMIN_SET_AUTO_OPEN_CONFIG'));
    assert.deepEqual(writes.map(x=>x.payload.enabled),[false,false,true]);
    assert.ok(writes.every(x=>Number.isInteger(x.payload.expectedRevision)&&x.payload.cooldownSeconds===10));
    await page.evaluate(()=>window.autoUnknown=true);
    await page.locator('[data-tab="overview"]').click();await page.locator('[data-tab="auto"]').click();
    await settings.locator('[data-state="unknown"]').waitFor();
    assert.equal(await settings.locator('button').count(),0,'unknown state never becomes an assumed enable/disable action');
    assert.deepEqual(errors,[]);
  });
});
