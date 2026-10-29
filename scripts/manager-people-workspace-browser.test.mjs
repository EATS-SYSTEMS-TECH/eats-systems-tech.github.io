import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";
import { parseManagerCsv } from "../js/manager-csv.js";

test("People workspace keeps real/example CRUD, CSV and loaded-record search accessible on phone and desktop", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) for (const mode of ["real", "sample"]) {
    await t.test(`${language}/${width}/${mode}`, async t => {
      const page = await browser.newPage({ viewport:{width,height:1000} });
      page.setDefaultTimeout(8000);
      t.after(() => page.close());
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.route(origin+"/people-fixture", route => route.fulfill({contentType:"text/html",body:`<!doctype html><html lang="${language}" dir="${language==='he'?'rtl':'ltr'}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>`}));
      await page.goto(origin+"/people-fixture");
      await page.evaluate(async language => {
        const {createManagerDashboard}=await import('/js/manager-dashboard.js');
        const {ManagerExampleConnection}=await import('/js/manager-example-connection.js');
        const {createManagerExampleData,managerExampleSystems}=await import('/js/manager-example-data.js');
        const data=createManagerExampleData(), template=managerExampleSystems[0];
        window.commands=[];
        window.WebSocket=class {constructor(){throw new Error('No physical transport in people fixtures');}};
        class Connection extends ManagerExampleConnection {
          constructor(options){super({data,system:template,onState:options.onState});}
          async command(command,payload){window.commands.push({command,payload});return super.command(command,payload);}
        }
        window.dashboard=createManagerDashboard({root:document.querySelector('#root'),user:{uid:'people-fixture'},language,Connection,
          api:async path=>path==='/me'?{role:'user',account:{id:'fixture'},organizations:[]}:{items:path.startsWith('/systems?')?[{...template,id:'real-fixture',status:'active'}]:[],nextCursor:null}});
        await window.dashboard.ready;
      },language);
      const he=language==='he', copy=(h,e)=>he?h:e;
      if(mode==='sample') await page.locator('.manager-examples > summary').click();
      const card=mode==='sample'?page.locator('[data-example-system="example-manager-gate"]'):page.locator('.manager-view > .manager-grid .manager-system');
      await card.getByRole('button',{name:copy('פתיחת סביבת ניהול','Open workspace'),exact:true}).click();
      await page.locator('[data-tab="users"]').click();
      const workspace=page.locator('.manager-people-workspace');
      await workspace.waitFor();
      const form=workspace.locator('[data-people-form]');
      assert.equal(await form.isVisible(),false,'editor stays out of the list until requested');
      assert.equal(await workspace.locator('tbody tr').count(),20);
      assert.equal(await workspace.locator('thead th').count(),4);
      const capture = async suffix => {
        if(!process.env.MANAGER_PEOPLE_EVIDENCE) return;
        await mkdir(process.env.MANAGER_PEOPLE_EVIDENCE,{recursive:true});
        await workspace.evaluate(el => el.scrollIntoView({block:'start'}));
        await page.screenshot({path:`${process.env.MANAGER_PEOPLE_EVIDENCE}/people-${language}-${width}-${mode}-${suffix}.png`});
      };
      await capture('list');
      const search=workspace.getByRole('searchbox');
      await search.fill('resident1@example.test');
      assert.equal(await workspace.locator('tbody tr:visible').count(),1);
      await workspace.getByRole('button',{name:copy('עריכה','Edit'),exact:true}).first().click();
      await form.waitFor({state:'visible'});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'editor fits the viewport');
      await capture('editor');
      assert.equal(await form.locator('[name="localNumber"]').inputValue(),'500000001');
      await form.locator('[name="name"]').fill('Updated resident');
      await form.getByRole('button',{name:copy('הוספה / עדכון','Add / update'),exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:copy('אישור','Confirm'),exact:true}).click();
      await workspace.getByText('Updated resident',{exact:true}).waitFor();
      await workspace.getByRole('button',{name:copy('הוספת משתמש','Add user'),exact:true}).click();
      for(const [key,value] of Object.entries({countryCode:'972',localNumber:'509999990',name:'Added resident',email:'added@example.test'})) await form.locator(`[name="${key}"]`).fill(value);
      assert.equal(await form.locator('[name="floorNumber"]').inputValue(),'0');
      await form.getByRole('button',{name:copy('הוספה / עדכון','Add / update'),exact:true}).click();
      await page.getByRole('dialog').getByRole('button',{name:copy('אישור','Confirm'),exact:true}).click();
      await workspace.getByRole('button',{name:copy('טען עוד','Load more'),exact:true}).click();
      await workspace.getByText('Added resident',{exact:true}).waitFor();
      assert.equal(await workspace.locator('tbody tr').count(),31);
      await workspace.getByRole('searchbox').fill('not-present');
      assert.equal(await workspace.locator('tbody tr:visible').count(),0);
      assert.equal(await workspace.locator('.manager-people-no-matches').isVisible(),true);
      await workspace.getByRole('searchbox').fill('');
      await workspace.locator('.manager-people-exports > summary').click();
      const downloaded=page.waitForEvent('download');
      await workspace.getByRole('button',{name:copy('ייצוא הרשומות שנטענו','Export loaded records'),exact:true}).click();
      assert.equal(parseManagerCsv(await readFile(await (await downloaded).path(),'utf8')).length,31);
      await workspace.getByRole('searchbox').fill('added@example.test');
      await workspace.getByRole('button',{name:copy('מחיקה','Delete'),exact:true}).first().click();
      await page.getByRole('dialog').getByRole('button',{name:copy('ביטול','Cancel'),exact:true}).click();
      assert.equal(await workspace.locator('tbody tr:visible').count(),1,'cancel does not remove the person');
      await workspace.getByRole('button',{name:copy('מחיקה','Delete'),exact:true}).first().click();
      await page.getByRole('dialog').getByRole('button',{name:copy('אישור','Confirm'),exact:true}).click();
      await workspace.getByRole('button',{name:copy('טען עוד','Load more'),exact:true}).click();
      await page.waitForFunction(()=>document.querySelectorAll('.manager-people-table tbody tr').length===30);
      assert.equal(await workspace.getByText('Added resident',{exact:true}).count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no page overflow');
      if(process.env.MANAGER_PEOPLE_EVIDENCE){await mkdir(process.env.MANAGER_PEOPLE_EVIDENCE,{recursive:true});await workspace.screenshot({path:`${process.env.MANAGER_PEOPLE_EVIDENCE}/people-${language}-${width}-${mode}.png`});}
      await page.locator('[data-tab="admins"]').click();
      await workspace.getByRole('button',{name:copy('הוספת מנהל','Add administrator'),exact:true}).waitFor();
      await workspace.getByRole('button',{name:copy('ייבוא CSV','Import CSV'),exact:true}).click();
      await page.getByRole('dialog').getByText(/Name,Email,Country,Local,Floor,Apt,Parking/).waitFor();
      await page.keyboard.press('Escape');
      assert.deepEqual(errors,[]);
      if(mode==='real'){
        const writes=await page.evaluate(()=>window.commands.filter(x=>/UPSERT|DELETE/.test(x.command)));
        assert.deepEqual(writes.map(x=>x.command),['ADMIN_UPSERT_USER','ADMIN_UPSERT_USER','ADMIN_DELETE_USER']);
        assert.ok(writes.every(x=>Number.isInteger(x.payload.expectedRevision)));
      }
    });
  }
});
