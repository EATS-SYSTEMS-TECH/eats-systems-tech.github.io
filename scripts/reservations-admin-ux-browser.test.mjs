import test from 'node:test';import assert from 'node:assert/strict';import {startSite,scenario}from './platform-test-fixtures.mjs';import{mkdir}from'node:fs/promises';
test('reservation workspace adapts status icons, summaries and empty states across language and width',async t=>{
 const site=await startSite(t);
 for(const language of ['he','en'])for(const width of [320,390,1440])await t.test(language+'/'+width,async t=>{
 const f=await scenario(site.browser,{platformRole:'admin',admin:true,enrolled:true,verified:true,viewport:{width,height:1000}});t.after(()=>f.context.close());
 const statuses=[];await f.context.route('**/api/v1/product-reservations/admin?*',r=>{statuses.push(new URL(r.request().url()).searchParams.get('status'));return r.fulfill({json:{items:[],counts:{new:0,contacted:0,confirmed:0,shipped:0,delivered:0,cancelled:0},nextCursor:null,truncated:false}});});
 await f.page.goto(site.origin+'/dashboard/reservations/?lang='+language);await f.page.locator('.reservations-admin-empty:not([hidden])').waitFor();
 assert.equal(await f.page.locator('.reservations-overview-card').count(),3);assert.equal(await f.page.locator('.reservations-filters button .reservation-admin-icon svg').count(),7);
 assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const button=f.page.locator('[data-stage=shipped]');await button.hover();const color=await button.evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));assert.deepEqual(color,{foreground:'rgb(255, 255, 255)',background:'rgb(20, 40, 63)'});
 await button.click();await f.page.getByRole('heading',{name:language==='he'?'אין הזמנות בסטטוס הזה.':'No reservations in this status.'}).waitFor();assert.equal(await button.getAttribute('aria-pressed'),'true');assert.ok(statuses.includes('shipped'));
 await f.page.locator('[data-stage=all]').click();await f.page.getByRole('heading',{name:language==='he'?'ההזמנות הבאות שלכם מתחילות כאן':'Your next reservations start here'}).waitFor();
 if(process.env.WIFIGATE_RESERVATIONS_UX_SCREENSHOTS){await mkdir(process.env.WIFIGATE_RESERVATIONS_UX_SCREENSHOTS,{recursive:true});await f.page.locator('.reservations-admin').screenshot({path:process.env.WIFIGATE_RESERVATIONS_UX_SCREENSHOTS+'/empty-'+language+'-'+width+'.png'});}
 assert.deepEqual(f.errors,[]);
 });
});
