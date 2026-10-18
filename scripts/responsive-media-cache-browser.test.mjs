import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import * as cheerio from 'cheerio';
import {applyNicheSceneMedia,applyHomeSceneMedia} from './scene-media.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceManifest=JSON.parse(await fs.readFile(path.join(root,'assets/vid/scene-manifest.json'),'utf8'));
const actual=id=>sourceManifest.scenes.find(scene=>scene.key===id);
const mobileVideo=await fs.readFile(path.join(root,actual('hotels-airbnb').video.path));
const desktopVideo=await fs.readFile(path.join(root,actual('office-buildings').video.path));
const mobilePoster=await fs.readFile(path.join(root,actual('hotels-airbnb').poster.path));
const desktopPoster=await fs.readFile(path.join(root,actual('office-buildings').poster.path));
const mobile={accepted:true,video:{path:'assets/vid/use-cases/hotels-airbnb-720p.mp4',sha256:hash(mobileVideo)},poster:{path:'assets/wifigate_niche_pages/hotels-airbnb-scene-hero.webp',sha256:hash(mobilePoster)},width:1280,height:720};
const desktop={accepted:true,video:{path:'assets/vid/use-cases/desktop/hotels-airbnb-1080p.mp4',sha256:hash(desktopVideo)},poster:{path:'assets/wifigate_niche_pages/desktop/hotels-airbnb-scene-hero.webp',sha256:hash(desktopPoster)},width:1920,height:1080};
const style=await fs.readFile(path.join(root,'css/scene-video.css'),'utf8');
const $=cheerio.load(`<!doctype html><html><head><meta charset="utf-8"><title>Owned responsive media/cache fixture</title><style>${style}body{margin:0}.niche-hero__media{position:relative;width:min(700px,100vw);aspect-ratio:16/9}img{width:100%;height:100%;object-fit:cover}.niche-hero__pager{padding:10px}</style></head><body><section class="niche-hero"><div class="niche-hero__media"><img id="niche-image" alt="Fixture scene"></div><div class="niche-hero__pager"></div></section></body></html>`);
applyNicheSceneMedia($,{scene:{key:'hotels-airbnb',...mobile,variants:{mobile,desktop}},assetPrefix:'/',copy:{play:'Play',pause:'Pause',replay:'Replay'}});
const html=$.html();
const home=cheerio.load(`<!doctype html><html><head><meta charset="utf-8"><title>Owned hero fixture</title><script src="/js/hero.js" defer></script><style>${style}body{margin:0}.hero{position:relative;height:500px}.hero__media{position:absolute;inset:0}.hero__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.hero__replay,.hero__media-control{position:absolute;z-index:5}#hero-replay{top:0}#hero-pause-toggle{top:60px}</style></head><body><section id="home" class="hero"><div class="hero__media"><img class="hero__bg hero__bg--image"><video id="hero-video" class="hero__bg hero__bg--video"></video></div><button id="hero-replay" class="hero__replay"><span>Play</span></button><button id="hero-pause-toggle" class="hero__media-control">Pause</button><button id="hero-mute-toggle">Mute</button></section><script>document.addEventListener('DOMContentLoaded',()=>setupHeroMedia());</script></body></html>`);
applyHomeSceneMedia(home,{scene:{key:'homepage-montage',...mobile,variants:{mobile,desktop}},assetPrefix:'/',copy:{play:'Play',pause:'Pause',replay:'Replay'}});
const homeHtml=home.html();
const files=new Map([
 ['/'+mobile.video.path,{bytes:mobileVideo,type:'video/mp4'}],['/'+desktop.video.path,{bytes:desktopVideo,type:'video/mp4'}],
 ['/'+mobile.poster.path,{bytes:mobilePoster,type:'image/webp'}],['/'+desktop.poster.path,{bytes:desktopPoster,type:'image/webp'}],
]);
for(const file of ['js/media-runtime.js','js/scene-video.js','js/hero.js','js/media-cache-policy.mjs','media-cache-sw.js'])files.set('/'+file,{bytes:await fs.readFile(path.join(root,file)),type:'text/javascript'});
let mediaUnavailable=false;const requests=[];
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');requests.push({pathname:url.pathname,query:url.search,range:req.headers.range,method:req.method});
 if(url.pathname==='/fixture/'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});res.end(html);return;}
 if(url.pathname==='/home-fixture/'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});res.end(homeHtml);return;}
 if(url.pathname==='/api/private'){res.writeHead(200,{'content-type':'text/plain','cache-control':'private,no-store'});res.end('private fixture');return;}
 const asset=files.get(url.pathname);
 if(!asset){res.writeHead(404);res.end();return;}
 const media=/\.(mp4|webp)$/.test(url.pathname);
 if(mediaUnavailable&&media){res.writeHead(503);res.end('media network unavailable');return;}
 res.writeHead(200,{'content-type':asset.type,'content-length':asset.bytes.length,'cache-control':media?'public,max-age=31536000,immutable':'no-store','etag':'"'+hash(asset.bytes)+'"'});res.end(asset.bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'wifigate-media-cache-browser-'));
let context,browser;let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};
async function open(ctx,pathname='/fixture/'){const page=await ctx.newPage();await page.goto(origin+pathname);await page.waitForFunction(()=>navigator.serviceWorker.controller,{},{timeout:10000});return page;}
async function playing(page){await page.waitForFunction(()=>{const v=document.querySelector('video');return v.readyState>=2&&!v.paused&&v.currentTime>0;},{},{timeout:10000});}
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const desktopContext=await browser.newContext({viewport:{width:769,height:900}});
 const desktopStart=requests.length,desktopPage=await open(desktopContext);await playing(desktopPage);
 check(await desktopPage.locator('video').getAttribute('data-media-variant')==='desktop','769px selects desktop');
 check((await desktopPage.locator('video').getAttribute('src')).includes('/desktop/'),'only selected desktop source attached');
 check((await desktopPage.locator('video').getAttribute('poster'))===(await desktopPage.locator('img').getAttribute('src')),'desktop image and video poster match');
 await desktopPage.locator('[data-scene-pause]').click();await desktopPage.setViewportSize({width:393,height:851});
 check(await desktopPage.locator('video').getAttribute('data-media-variant')==='desktop','entry choice stays pinned after resize');
 const desktopRequests=requests.slice(desktopStart).filter(req=>/\.(mp4|webp)$/.test(req.pathname));
 check(desktopRequests.length>0&&desktopRequests.every(req=>req.pathname.includes('/desktop/')),'no mobile video OR poster requested by desktop visit');
 await desktopContext.close();
 for(const width of [393,1280]){
  const ctx=await browser.newContext({viewport:{width,height:851}}),start=requests.length;
  try{const hero=await open(ctx,'/home-fixture/');await playing(hero);const variant=width<=768?'mobile':'desktop';check(await hero.locator('video').getAttribute('data-media-variant')===variant,'hero automatically plays chosen '+variant);check((await hero.locator('video').getAttribute('poster'))===(await hero.locator('img').getAttribute('src')),'hero selected poster/image match');check(requests.slice(start).filter(req=>req.pathname.endsWith('.mp4')).every(req=>req.pathname.includes('/desktop/')===(variant==='desktop')),'hero fetches only chosen video variant');}finally{await ctx.close();}
 }
 await browser.close();browser=null;

 context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:768,height:851}});
 const mobileStart=requests.length,page=await open(context);await page.waitForTimeout(350);
 check(await page.locator('video').getAttribute('data-media-variant')==='mobile','768px selects mobile');
 await playing(page);
 check(requests.slice(mobileStart).some(req=>req.pathname.endsWith('.mp4')),'mobile automatically requests its selected video');
 await page.setViewportSize({width:393,height:851});
 check((await page.locator('video').getAttribute('src')).includes('/use-cases/hotels-airbnb-720p.mp4'),'autoplay attaches mobile only');
 await page.waitForFunction(async()=>{for(const name of await caches.keys())if(name.startsWith('wifigate-public-media-')){const keys=await(await caches.open(name)).keys();if(keys.filter(key=>/\.(mp4|webp)\?/.test(key.url)).length>=2)return true;}return false;},{},{timeout:10000});
 const mobileRequests=requests.slice(mobileStart).filter(req=>/\.(mp4|webp)$/.test(req.pathname));
 check(mobileRequests.every(req=>!req.pathname.includes('/desktop/')),'no desktop video OR poster requested on mobile');
 check(mobileRequests.filter(req=>req.pathname.endsWith('.mp4')).every(req=>req.range===undefined),'first playback requests one complete200 body from origin, not partial206 storage');
 await context.close();context=null;

 // Reopen the actual persistent Chrome profile, with media unavailable at the
 // origin. Documents stay network-only; this does not promise an offline site.
 mediaUnavailable=true;const restartStart=requests.length;
 context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:393,height:851}});
 const cachedPage=await open(context);await playing(cachedPage);
 check(requests.slice(restartStart).every(req=>!req.pathname.endsWith('.mp4')),'browser restart reuses disk-persisted video without a media network request');
 await cachedPage.locator('[data-scene-pause]').click();
 await cachedPage.locator('video').evaluate(video=>{video.currentTime=9;});
 await cachedPage.waitForFunction(()=>{const v=document.querySelector('video');return!v.seeking&&Math.abs(v.currentTime-9)<.05;},{},{timeout:5000});
 check(await cachedPage.locator('video').evaluate(v=>v.currentTime>=9),'real MP4 seek works with cached byte ranges');
 await cachedPage.reload();await playing(cachedPage);
 await context.setOffline(true);
 const target=origin+'/'+mobile.video.path+'?v='+mobile.video.sha256.slice(0,12);
 for(const[range,status,expected,contentRange]of [[null,200,mobileVideo,null],['bytes=5-17',206,mobileVideo.subarray(5,18),`bytes 5-17/${mobileVideo.length}`],['bytes=-8',206,mobileVideo.subarray(-8),`bytes ${mobileVideo.length-8}-${mobileVideo.length-1}/${mobileVideo.length}`],[`bytes=${mobileVideo.length}-`,416,Buffer.alloc(0),`bytes */${mobileVideo.length}`]]){
  const result=await cachedPage.evaluate(async({target,range})=>{const response=await fetch(target,{cache:'no-store',headers:range?{Range:range}:{}}),bytes=new Uint8Array(await response.arrayBuffer()),digest=await crypto.subtle.digest('SHA-256',bytes);return{status:response.status,length:bytes.length,contentRange:response.headers.get('content-range'),hash:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')};},{target,range});
  check(result.status===status&&result.length===expected.length&&result.hash===hash(expected)&&result.contentRange===contentRange,'offline cached response has exact'+status+'bytes/headers for '+range);
 }
 await context.setOffline(false);
 const privateResponse=await cachedPage.evaluate(async()=>await(await fetch('/api/private')).text());check(privateResponse==='private fixture','private request retains normal network behavior');
 const keys=await cachedPage.evaluate(async()=>{const result=[];for(const name of await caches.keys())for(const key of await(await caches.open(name)).keys())result.push(key.url);return result;});
 check(keys.length===2&&keys.every(key=>key.includes('hotels-airbnb')&&!key.includes('/desktop/')),'only selected public video and poster persisted; no HTML/private/unselected assets');
 console.log(`PASS: ${assertions} responsive/cache browser assertions; first visit,768/769boundary,matching poster,pinned resize,actual play,Chrome restart,reload,offline200/206/416,seek,private exclusion`);
}finally{
 if(context)await context.close();if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
 assert.equal(path.dirname(profile),path.resolve(os.tmpdir()));assert.ok(path.basename(profile).startsWith('wifigate-media-cache-browser-'));await fs.rm(profile,{recursive:true,force:true});
}
