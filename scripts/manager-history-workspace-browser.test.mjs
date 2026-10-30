import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("History/guest views localize codes, paginate without duplicate tables, export visible guests only and fit phone/desktop",async t=>{
  const {origin,browser}=await startSite(t);
  for(const language of ['he','en']) for(const width of [320,390,1440]) await t.test(`${language}/${width}`,async t=>{
    const page=await browser.newPage({viewport:{width,height:1000}});
    page.setDefaultTimeout(8000); t.after(()=>page.close());
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(origin+'/history-fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${language}" dir="${language==='he'?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>`}));
    await page.goto(origin+'/history-fixture');
    await page.evaluate(async language=>{
      const {createManagerDashboard}=await import('/js/manager-dashboard.js');
      const {ManagerExampleConnection}=await import('/js/manager-example-connection.js');
      const {createManagerExampleData,managerExampleSystems}=await import('/js/manager-example-data.js');
      const data=createManagerExampleData(),system=managerExampleSystems[0];
      window.historyCalls=[];
      window.WebSocket=class{constructor(){throw new Error('Physical transport forbidden in history fixtures');}};
      class Connection extends ManagerExampleConnection{
        constructor(options){super({data,system,onState:options.onState});}
        async command(command,payload){
          window.historyCalls.push({command,payload});
          if(command!=='ADMIN_LIST_HISTORY')return super.command(command,payload);
          if(window.historyFailure)throw Object.assign(new Error(window.historyFailure),{code:window.historyFailure});
          if(!payload.dayKey)return {data:payload.page.cursor?{days:[['20261027',25],['20261026',0]],page:{nextCursor:null}}:{days:[['20261027',25]],page:{nextCursor:'days-2'}}};
          const rows=Array.from({length:25},(_,i)=>[i,1793098720+i,180,0,0,1,3,i%2?2:3,i===2?1:0,0,0,0,0,(i%2?'System member ':'Guest visitor ')+i,'']);
          const start=Number(payload.page.cursor||0);
          return {data:{items:payload.dayKey==='20261027'?rows.slice(start,start+20):[],page:{nextCursor:payload.dayKey==='20261027'&&start===0?'20':null}}};
        }
      }
      window.dashboard=createManagerDashboard({root:document.querySelector('#root'),user:{uid:'history-fixture'},language,Connection,
        api:async path=>path==='/me'?{role:'admin',roles:['admin'],account:{id:'fixture'},organizations:[]}:{items:path.startsWith('/systems?')?[{...system,id:'fixture-real',status:'active'}]:[],nextCursor:null}});
      await window.dashboard.ready;
    },language);
    const he=language==='he',copy=(h,e)=>he?h:e;
    await page.locator('.manager-view > .manager-grid .manager-system').getByRole('button',{name:language==='he'?'פתיחת סביבת ניהול':'Open workspace',exact:true}).click();
    await page.locator('[data-tab="history"]').click();
    const content=page.locator('#manager-content');
    await content.locator('[data-history-day="20261027"]').waitFor();
    await content.getByRole('button',{name:copy('ימים נוספים','More days'),exact:true}).click();
    assert.equal(await content.locator('[data-history-day]').count(),2,'duplicate days are not repeated');
    await content.locator('[data-history-day="20261027"]').click();
    assert.equal(await content.locator('tbody tr').count(),20);
    assert.deepEqual(await content.locator('thead th').allTextContents(),he?['מועד','פעולה','מקור הפעולה','פרטי משתמש','תוצאה']:['When','Action','Source','Person','Result']);
    assert.equal(await content.getByText(copy('לחצן טכנאי','Technician button'),{exact:true}).count(),20);
    assert.equal(await content.locator('[data-state="refused"]').count(),1);
    await content.getByRole('button',{name:copy('טען עוד','Load more'),exact:true}).click();
    assert.equal(await content.locator('table').count(),1);
    assert.equal(await content.locator('tbody tr').count(),25);
    await content.getByRole('button',{name:copy('חזרה לימים','Back to days'),exact:true}).click();
    await content.locator('[data-history-day="20261027"]').waitFor();
    await page.locator('[data-tab="guests"]').click();
    await content.locator('[data-history-day="20261027"]').click();
    assert.equal(await content.locator('tbody tr').count(),10);
    assert.equal(await content.getByText(/System member/).count(),0);
    await content.getByRole('button',{name:copy('טען עוד','Load more'),exact:true}).click();
    assert.equal(await content.locator('tbody tr').count(),13);
    const pending=page.waitForEvent('download');
    await content.getByRole('button',{name:copy('ייצוא הנתונים המוצגים','Export displayed data'),exact:true}).click();
    const csv=await readFile(await(await pending).path(),'utf8');
    assert.equal(csv.includes('System member'),false,'guest export excludes other principals');
    assert.equal(csv.trim().split(/\r?\n/).length,14);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(process.env.MANAGER_HISTORY_EVIDENCE){await mkdir(process.env.MANAGER_HISTORY_EVIDENCE,{recursive:true});await content.evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`${process.env.MANAGER_HISTORY_EVIDENCE}/history-${language}-${width}.png`});}
    await content.getByRole('button',{name:copy('חזרה לימים','Back to days'),exact:true}).click();
    await content.getByRole('button',{name:copy('ימים נוספים','More days'),exact:true}).click();
    await content.locator('[data-history-day="20261026"]').click();
    assert.equal(await content.getByRole('button',{name:copy('ייצוא הנתונים המוצגים','Export displayed data'),exact:true}).isDisabled(),true);
    for(const code of ['STORAGE_IO','STORAGE_RECOVERY_REQUIRED']){
      await page.evaluate(code=>{window.historyFailure=code;},code);
      await page.locator('[data-tab="history"]').click();
      await page.getByRole('alert').filter({hasText:code==='STORAGE_IO'?copy('כרטיס ה־SD','SD card'):copy('התאוששות','recovery')}).waitFor();
      assert.equal(await content.locator('.manager-history-empty').count(),0,'failure never appears as empty history');
    }
    await page.evaluate(()=>{window.historyFailure=null;});
    await page.locator('[data-tab="history"]').click();
    await content.locator('[data-history-day="20261027"]').waitFor();
    const commands=await page.evaluate(()=>window.historyCalls.map(call=>call.command));
    assert.equal(commands.some(cmd=>/DELETE|UPSERT|IMPORT|REMOTE_OPEN/.test(cmd)),false);
    assert.deepEqual(errors,[]);
  });
});
