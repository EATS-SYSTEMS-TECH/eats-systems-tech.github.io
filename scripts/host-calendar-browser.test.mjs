import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
test('reference dashboard: authorized navigation, three-week spans, editor and mobile overflow', async t => {
  const server = createServer(async (request,response) => {
    try {
      const file = path.resolve(root, '.' + new URL(request.url,'http://localhost').pathname);
      if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const browser = await chromium.launch({channel:process.env.WIFIGATE_BROWSER_CHANNEL??'chrome',headless:true});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/calendar-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/host-workspace.css"></head><body class="portal-dashboard"><aside id="host-sidebar" class="host-sidebar"><a class="brand" href="/"><img src="/assets/img/wifigate-horizontal-logo.png" alt="WIFIGATE"></a><nav id="host-section-navigation"></nav></aside><main class="portal-shell"><details id="account-details"><summary>Account and security</summary></details><div id="workspace-org-switcher"><label>Organization<select aria-label="Organization"><option>Test organization</option></select></label></div><section id="host-management" class="portal-panel"></section></main></body></html>`}));
  await page.goto(`http://127.0.0.1:${server.address().port}/calendar-test`);
  await page.evaluate(async()=>{
    const {profileApi}=await import('/js/api/index.js');
    const start=new Date().toISOString().slice(0,10);
    const day=n=>new Date(Date.parse(start+'T00:00:00Z')+n*86400000).toISOString();
    const reservation={id:'booking',propertyId:'property',roomId:'room',roomName:'Room 101',guest:{name:'Test guest',phone:'+15555550123',email:'guest@example.test'},startsAt:day(1),endsAt:day(4),status:'confirmed',version:1,targetIds:[]};
    profileApi.defaults.adapter=async config=>({status:200,statusText:'OK',headers:{},config,data:config.url.includes('/time-zone/resolve')?{instant:config.data?JSON.parse(config.data).localTime+':00Z':''}:(config.url.includes('/systems')||config.url.includes('/access-grants'))?{items:[],nextCursor:null}:{items:[reservation],nextCursor:null}});
    await import('/js/host-dashboard-navigation.js');
    const {renderHostCalendar}=await import('/js/host-calendar.js');
    await renderHostCalendar({container:document.getElementById('host-management'),user:{getIdToken:async()=>'isolated-test'},organization:{id:'org',timezone:'UTC',membership:{role:'owner'}},properties:[{id:'property',name:'Test hotel',timezone:'UTC'}],rooms:[{id:'room',propertyId:'property',name:'Room 101'}],isCurrent:()=>true});
  });
  await page.getByRole('button',{name:'Calendar',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Calendar',exact:true}).getAttribute('aria-current'),'page');
  await page.getByRole('button',{name:'3 Weeks',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.calendar-scroll thead th').length===22);
  const card=page.locator('.reservation-chip');
  assert.equal(await card.count(),1);
  const group=page.getByRole('button',{name:'Test hotel',exact:true});
  await group.click(); assert.equal(await card.isVisible(),false);
  await group.click(); assert.equal(await card.isVisible(),true);
  assert.equal(await card.evaluate(element=>element.style.gridColumn),'2 / 5');
  await card.click();
  await page.getByRole('heading',{name:'Edit reservation'}).waitFor();
  await page.getByRole('button',{name:'Close reservation',exact:true}).click();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  assert.equal(await page.locator('#account-details').evaluate(element=>element.open),true);
  await page.getByRole('button',{name:'Calendar',exact:true}).click();
  await page.screenshot({path:process.env.WIFIGATE_DASHBOARD_SCREENSHOT??path.join(tmpdir(),`wifigate-dashboard-${process.pid}-desktop.png`),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.screenshot({path:process.env.WIFIGATE_DASHBOARD_MOBILE_SCREENSHOT??path.join(tmpdir(),`wifigate-dashboard-${process.pid}-mobile.png`),fullPage:true});
  await page.evaluate(()=>document.getElementById('host-management').replaceChildren());
  await page.waitForFunction(()=>document.querySelector('#host-section-navigation button[data-view=Calendar]').disabled);
  await page.evaluate(async()=>{
    const {profileApi}=await import('/js/api/index.js');
    profileApi.defaults.adapter=async config=>({status:200,statusText:'OK',headers:{},config,data:config.url.startsWith('/api/v1/organizations?')?{organizations:[],nextCursor:null}:{items:[],nextCursor:null}});
    const {loadHostManagement}=await import('/js/host-management.js');
    await loadHostManagement({uid:'isolated-user',getIdToken:async()=>'isolated-test'},{role:'user'});
  });
  const empty=page.getByRole('region',{name:'Reservation calendar',exact:true});
  await empty.getByRole('heading',{name:'No organization access'}).waitFor();
  assert.equal(await page.getByLabel('Organization',{exact:true}).isDisabled(),true);
  assert.equal(await empty.getByRole('button',{name:'New reservation',exact:true}).isDisabled(),true);
  await empty.getByRole('button',{name:'3 Weeks',exact:true}).click();
  assert.equal(await empty.locator('thead th').count(),22);
  await empty.getByRole('button',{name:'View invitations',exact:true}).click();
  await page.getByRole('region',{name:'Team invitations',exact:true}).getByText('No pending team invitations.').waitFor();
  await page.evaluate(async()=>{
    const {profileApi}=await import('/js/api/index.js');
    const organizations=['a','b'].map(id=>({id,name:`Organization ${id}`,timezone:'UTC',membership:{role:'viewer'}}));
    profileApi.defaults.adapter=async config=>{
      const url=config.url,org=url.includes('/organizations/b/')?'b':'a';let data;
      if(url.startsWith('/api/v1/organizations?'))data={organizations,nextCursor:null};
      else if(url.includes('/properties?'))data={items:[{id:`property-${org}`,name:`Property ${org}`,timezone:'UTC'}],nextCursor:null};
      else if(url.includes('/rooms?'))data={items:[{id:`room-${org}`,propertyId:`property-${org}`,name:`Room ${org}`,capacity:2}],nextCursor:null};
      else if(url.includes('/systems/icons'))data={icons:{}};
      else if(url.includes('/time-zone/resolve'))data={instant:JSON.parse(config.data).localTime+':00Z'};
      else if(url.includes('/reservations?')){
        const query=new URL(url,'http://localhost').searchParams,start=query.get('from'),end=new Date(Date.parse(start)+86400000).toISOString();
        data={items:[{id:`booking-${org}`,roomId:`room-${org}`,propertyId:`property-${org}`,guest:{name:`Guest ${org}`,email:`${org}@example.test`},startsAt:start,endsAt:end,status:'confirmed',version:1}],nextCursor:null};
        if(org==='a')await new Promise(resolve=>{window.releaseFirstCalendar=resolve;});
      } else data={items:[],nextCursor:null};
      return {status:200,statusText:'OK',headers:{},config,data};
    };
    const {loadHostManagement}=await import('/js/host-management.js');
    void loadHostManagement({uid:'isolated-user',getIdToken:async()=>'isolated-test'},{role:'user'});
  });
  await page.waitForFunction(()=>typeof window.releaseFirstCalendar==='function');
  await page.getByLabel('Organization',{exact:true}).selectOption('b');
  await page.locator('.reservation-chip').filter({hasText:'Guest b'}).waitFor();
  await page.evaluate(()=>window.releaseFirstCalendar());
  await page.waitForFunction(()=>document.getElementById('host-management').dataset.loading==='false');
  assert.equal(await page.locator('.reservation-chip').filter({hasText:'Guest a'}).count(),0);
  assert.equal(await page.getByRole('button',{name:'New reservation',exact:true}).count(),0);
  await page.getByRole('button',{name:'Guests',exact:true}).click();
  await page.getByRole('region',{name:'Guests',exact:true}).getByText('b@example.test',{exact:false}).waitFor();
  assert.equal(await page.getByRole('region',{name:'Reservation calendar',exact:true}).isVisible(),false);
  await page.getByRole('region',{name:'Guests',exact:true}).getByRole('button',{name:'Guest b',exact:true}).click();
  await page.getByRole('dialog',{name:'Reservation details',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Save reservation',exact:true}).count(),0);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog',{name:'Reservation details',exact:true}).isVisible(),false);
  assert.deepEqual(errors,[]);
});
