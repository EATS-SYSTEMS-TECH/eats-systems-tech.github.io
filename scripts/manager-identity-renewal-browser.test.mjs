import test from 'node:test';
import assert from 'node:assert/strict';
import {startSite} from './platform-test-fixtures.mjs';

async function workspace(t) {
  const {origin,browser}=await startSite(t);const page=await browser.newPage();t.after(()=>page.close());page.setDefaultTimeout(6000);
  await page.route(origin+'/identity-renewal-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="root"></div>'}));
  await page.goto(origin+'/identity-renewal-fixture');
  await page.evaluate(async()=>{
    const {createManagerDashboard}=await import('/js/manager-dashboard.js');
    window.connections=[];window.qrCalls=0;window.commands=[];
    const system={id:'real-system',name:'Gate fixture',type:'gate',systemIds:['12345'],version:1,status:'active'};
    class Connection {
      constructor({onState}){this.onState=onState;this.capabilities={data:{features:['MANAGER_QR_LABEL']}};window.connections.push(this);}
      async open(){this.session={};this.onState('active');}
      close(){this.session=null;this.closed=true;}
      async command(name){window.commands.push(name);return {data:name==='ADMIN_GET_QR_PAYLOAD'?{sensitive:true,payload:{i:'12345',n:'Fixture'}}:{systemId:'12345'}};}
    }
    const api=async(path)=>{
      if(path==='/me')return {role:'user',account:{id:'owner'},organizations:[]};
      if(path.startsWith('/systems?'))return {items:[system]};
      if(path.endsWith('/qr-label')){window.qrCalls++;return{token:'WGQ.'+'a'.repeat(100)};}
      throw Error('Unexpected fixture route');
    };
    window.dashboard=createManagerDashboard({root:document.querySelector('#root'),user:{uid:'owner'},api,Connection,
      ensureRecent:options=>options?.requireTotp?new Promise(resolve=>window.releaseIdentity=resolve):Promise.resolve()});
    await window.dashboard.ready;
  });
  await page.getByRole('button',{name:'Open workspace',exact:true}).click();
  await page.getByRole('tab',{name:'QR Code label',exact:true}).click();
  await page.getByRole('button',{name:'Show QR Code label',exact:true}).click();
  await page.waitForFunction(()=>typeof window.releaseIdentity==='function');
  return page;
}

test('Fresh identity verification survives a transparent same-gate channel renewal while waiting for TOTP',async t=>{
  const page=await workspace(t);
  await page.evaluate(()=>{window.connections[0].onState('SECURE_SESSION_EXPIRED');window.connections[0].close();});
  await page.waitForFunction(()=>window.connections.length===2&&window.connections[1].session&&!document.querySelector('#manager-content').inert);
  await page.evaluate(()=>window.releaseIdentity());
  await page.locator('.manager-qr-label svg').waitFor();
  assert.equal(await page.evaluate(()=>window.qrCalls),1);
  assert.equal(await page.evaluate(()=>window.commands.filter(n=>n==='ADMIN_GET_QR_PAYLOAD').length),1);
});

test('Leaving the workspace during identity verification still fences every credential request',async t=>{
  const page=await workspace(t);
  await page.evaluate(()=>{window.dashboard.close();window.releaseIdentity();});
  assert.equal(await page.evaluate(()=>window.qrCalls),0);
  assert.equal(await page.evaluate(()=>window.commands.filter(n=>n==='ADMIN_GET_QR_PAYLOAD').length),0);
});
