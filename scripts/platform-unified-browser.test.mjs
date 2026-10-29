import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {startSite,scenario} from './platform-test-fixtures.mjs';
const admin={platformRole:'admin',admin:true,enrolled:true,verified:true,manager:'active',pay:'active'};

test('central management puts selectable products first and shows organizations for every product',async t=>{
 const {origin,browser}=await startSite(t);
 for(const language of ['he','en']) for(const width of [390,1440]) await t.test(`${language}/${width}`,async t=>{
  const f=await scenario(browser,{...admin,viewport:{width,height:1000}});t.after(()=>f.context.close());
  const requests=[];
  await f.context.route('**/api/v1/platform/directory?*',r=>r.fulfill({json:{counts:{admins:1,users:1,total:2},...(new URL(r.request().url()).searchParams.get('product')==='all'?{productCounts:{host:2,pay:1,manager:2}}:{}),items:[],nextCursor:null}}));
  await f.context.route('**/api/v1/platform/directory/organization-overview?*',r=>{const product=new URL(r.request().url()).searchParams.get('product');requests.push(product);return r.fulfill({json:{items:[{id:product+'-org',name:'Example '+product,status:'active',products:{[product]:'active'}}],complete:true,basis:'provisioned-organizations'}});});
  await f.page.goto(origin+'/dashboard/platform/?product=manager'+(language==='he'?'&lang=he':''));
  const root=f.page.locator('#platform-admin-management');await root.locator('.platform-admin-counts strong').first().waitFor();
  assert.equal(await root.locator(':scope > :first-child').getAttribute('class'),'platform-admin-products');
  assert.equal(await root.locator('[data-product="manager"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await root.locator('.platform-admin-product-count').allTextContents(),['2','1','2']);
  if(width>600){
   const boxes=await Promise.all(['host','pay','manager'].map(id=>root.locator(`button[data-product="${id}"]`).boundingBox()));
   assert.ok(boxes[0].x<boxes[1].x && boxes[1].x<boxes[2].x,'Host stays left, Pay center and Manager right in both languages');
  }
  await root.locator('[data-role="organizations"]').click();
  await root.getByRole('heading',{name:'Example manager',exact:true}).waitFor();
  assert.equal(await root.locator('.platform-admin-revenue').isVisible(),false);
  for(const product of ['host','pay','manager']){
   await root.locator(`button[data-product="${product}"]`).click();
   await root.getByRole('heading',{name:'Example '+product,exact:true}).waitFor();
   assert.equal(await root.locator('.platform-admin-organization').count(),1);
   assert.equal(await root.locator('[data-role="admin"]').innerText(),`WIFIGATE ${product[0].toUpperCase()+product.slice(1)} Admins`);
  }
  assert.deepEqual(requests,['manager','host','pay','manager']);
  assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.WIFIGATE_UNIFIED_SCREENSHOTS){await mkdir(process.env.WIFIGATE_UNIFIED_SCREENSHOTS,{recursive:true});await root.screenshot({path:`${process.env.WIFIGATE_UNIFIED_SCREENSHOTS}/central-${language}-${width}.png`});}
  assert.deepEqual(f.errors,[]);
 });
});

test('legacy product management addresses redirect to the central hub without changing product or language',async t=>{
 const {origin,browser}=await startSite(t);
 const f=await scenario(browser,admin);t.after(()=>f.context.close());
 for(const language of ['he','en']) for(const product of ['host','pay','manager']){
  const old=product==='host'?'/dashboard/host/overview/':`/dashboard/${product}/platform/`;
  await f.page.goto(origin+old+(language==='he'?'?lang=he':''));
  await f.page.waitForURL(url=>url.pathname==='/dashboard/platform/'&&url.searchParams.get('product')===product);
  assert.equal(new URL(f.page.url()).searchParams.get('lang'),language==='he'?'he':null);
 }
});

test('Host workspace has no product platform-management entry',async t=>{
 const {origin,browser}=await startSite(t);const f=await scenario(browser,admin);t.after(()=>f.context.close());
 await f.page.goto(origin+'/dashboard/host/?lang=he');
 await f.page.locator('#host-management[data-loading="false"]').waitFor();
 assert.equal(await f.page.locator('.host-platform-entry').count(),0);
 assert.equal(new URL(f.page.url()).pathname,'/dashboard/host/');
 assert.deepEqual(f.errors,[]);
});
