import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {startSite, scenario} from './platform-test-fixtures.mjs';
import {openWorkspace, loaded} from './lib/host-booking-site.mjs';

async function fitsWidth(page, width) {
  const boxes = await page.evaluate(() => {
    const rect = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return {left:b.left,right:b.right,width:b.width}; };
    return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,header:rect('.platform-header, .host-topbar'),shell:rect('.platform-shell')};
  });
  assert.ok(boxes.scroll <= boxes.viewport + 1, `no page overflow at ${width}: ${JSON.stringify(boxes)}`);
  assert.ok(boxes.header.left >= 11 && boxes.header.left <= 25, `small leading gutter: ${JSON.stringify(boxes)}`);
  assert.ok(boxes.viewport - boxes.header.right >= 11 && boxes.viewport - boxes.header.right <= 25, 'matching trailing gutter');
  assert.ok(boxes.header.width >= boxes.viewport - 50, 'header fills available width');
  assert.ok(Math.abs(boxes.shell.width - boxes.viewport) <= 1, 'page shell fills available width');
}

test('dashboard headers and workspaces use the viewport in both languages without horizontal overflow', async t => {
  const site = await startSite(t);
  for (const language of ['he','en']) for (const width of [320,390,1440,2560]) await t.test(`${language}/${width}`, async t => {
    const f = await scenario(site.browser,{platformRole:'admin',admin:true,enrolled:true,verified:true,manager:'active',pay:'active',viewport:{width,height:1000}});
    t.after(()=>f.context.close());
    for (const product of ['manager','pay']) await f.context.route(`**/api/v1/${product}/**`,r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/me')?{user:{uid:'fixture-user'},role:'user',account:{id:'fixture-account'},canManageSystems:true,organizations:[]}:{items:[],nextCursor:null}}));
    for (const path of ['/dashboard/','/dashboard/platform/','/dashboard/manager/','/dashboard/pay/']) {
      await f.page.goto(site.origin+path+'?lang='+language);
      await f.page.locator('.platform-header').waitFor();
      if(path.includes('/manager/')) await f.page.locator('.manager-sidebar-roles').waitFor();
      if(path.includes('/pay/')) await f.page.locator('.manager-shell').waitFor();
      await fitsWidth(f.page,width);
      if(path.includes('/manager/') && width===2560) {
        await f.page.locator('.manager-examples > summary').click();
        await f.page.locator('[data-example-system="example-manager-gate"]').getByRole('button').click();
        await f.page.locator('.manager-simulation-note').waitFor();
        await f.page.locator('[data-tab="events"]').click();
        const track = f.page.locator('.manager-event-day-track').first();
        await track.waitFor();
        assert.ok((await track.boundingBox()).width > 1800,'event timeline benefits from the expanded workspace');
        await fitsWidth(f.page,width);
        if(process.env.WIFIGATE_WIDTH_SCREENSHOTS){await mkdir(process.env.WIFIGATE_WIDTH_SCREENSHOTS,{recursive:true});await f.page.screenshot({path:`${process.env.WIFIGATE_WIDTH_SCREENSHOTS}/manager-events-${language}-${width}.png`,fullPage:true});}
      }
    }
    const host = await openWorkspace(t,site,{plan:'user',organizations:[],mySystems:[]},{query:'?lang='+language,viewport:{width,height:1000},real:true});
    await loaded(host.page,'my-systems');
    await fitsWidth(host.page,width);
    assert.deepEqual(f.errors,[]);
  });
});
