import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {HOST_PAGE_KEY} from './host-marketing-page.mjs';

const origin=(process.env.SITE_URL||'http://127.0.0.1:8000').replace(/\/$/,''),screenshots=process.env.SCREENSHOT_DIR;
const manifest=JSON.parse(await fs.readFile(new URL('../assets/vid/scene-manifest.json',import.meta.url),'utf8'));
const scene=manifest.scenes.find(item=>item.key==='hotels-airbnb'&&item.accepted);
assert.ok(scene?.variants?.mobile?.accepted&&scene?.variants?.desktop?.accepted,'Both accepted hospitality variants exist');
const artifact=width=>scene.variants[width<=768?'mobile':'desktop'];
const report={schema:'wifigate.host-marketing-page.browser-route-qa.v1',kind:'host_browser',status:'RUNNING',sceneId:scene.key,cases:[],policyCases:[],redirectCases:[],captures:[]};
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const rejectAnalytics=()=>localStorage.setItem('wifigate-cookie-consent-v1',JSON.stringify({version:1,analytics:false,savedAt:Date.now()}));
const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
async function capture(page,name){
 if(!screenshots)return;const file=path.join(screenshots,name+'.png');
 assert.equal(await fs.stat(file).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;}),false,'Preserve prior screenshots');
 await page.screenshot({path:file});const bytes=await fs.readFile(file);report.captures.push({file:path.basename(file),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
async function playing(page){await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');if(v?.error)throw Error('Accepted Host decoder failed');return v&&!v.paused&&v.readyState>=2&&v.currentTime>.2;},{},{timeout:20000});}
async function selection(page,width){
 const accepted=artifact(width),value=await page.locator('.niche-hero video').evaluate(v=>({src:v.currentSrc,poster:v.poster,image:document.querySelector('#niche-image').currentSrc,variant:v.dataset.mediaVariant,width:v.videoWidth,height:v.videoHeight,duration:v.duration,muted:v.muted,loop:v.loop}));
 const src=new URL(value.src),poster=new URL(value.poster);
 assert.equal(src.pathname,'/'+accepted.video.path);assert.equal(src.searchParams.get('v'),accepted.video.sha256.slice(0,12));assert.equal(poster.pathname,'/'+accepted.poster.path);assert.equal(poster.searchParams.get('v'),accepted.poster.sha256.slice(0,12));assert.equal(value.poster,value.image);
 assert.equal(value.variant,width<=768?'mobile':'desktop');assert.equal(value.width,accepted.width);assert.equal(value.height,accepted.height);assert.ok(Math.abs(value.duration-accepted.durationSeconds)<.1);assert.equal(value.muted,true);assert.equal(value.loop,false);
 return{selectedVariant:value.variant,videoPath:src.pathname,posterPath:poster.pathname,decodedWidth:value.width,decodedHeight:value.height,duration:value.duration};
}
async function layout(page){
 const result=await page.locator('.niche-hero').evaluate(hero=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const visible=e=>{const s=getComputedStyle(e),r=box(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};const media=hero.querySelector('.niche-hero__media'),mark=media.querySelector('[data-media-watermark]');return{media:box(media),headline:box(hero.querySelector('h1')),image:box(media.querySelector('img')),video:box(media.querySelector('video')),mark:box(mark),pointer:getComputedStyle(mark).pointerEvents,controls:[...hero.querySelectorAll('button,a,input')].filter(visible).map(box),copy:[...hero.querySelectorAll('h1,h2,p')].filter(visible).map(box),scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};});
 assert.ok(result.scrollWidth<=result.viewportWidth,'No horizontal overflow');assert.ok(overlaps(result.headline,result.media),'Copy stays above the video');assert.deepEqual(result.image,result.video,'Poster/video crop matches');assert.equal(result.pointer,'none');for(const bounds of [...result.controls,...result.copy])assert.equal(overlaps(result.mark,bounds),false,'Watermark clears hero copy/actions');
 return{textOverVideo:true,matchingMediaBounds:true,watermarkClear:true};
}
try{
 if(screenshots)await fs.mkdir(screenshots,{recursive:true});
 for(const locale of['','he/'])for(const width of[320,390,1280]){
  const height=width<769?844:900,label=(locale?'he':'en')+'-'+width,result={id:label,width,height,status:'RUNNING'};report.cases.push(result);
  const context=await browser.newContext({viewport:{width,height}});
  try{
   await context.addInitScript(rejectAnalytics);const page=await context.newPage(),requests=[];page.on('request',request=>{const url=new URL(request.url());if(url.pathname.includes('hotels-airbnb')&&url.pathname.endsWith('.mp4'))requests.push(url.pathname);});
   const target='/'+locale+HOST_PAGE_KEY+'/';await page.goto(origin+'/'+locale+'#wifigate-automation',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
   const section=page.locator('#wifigate-automation'),frame=section.locator('.automation-stay__media');await frame.scrollIntoViewIfNeeded();await frame.locator('img').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#wifigate-automation .automation-stay__media img').complete);
   assert.equal(await section.locator('video,[data-scene-video],[data-scene-copy],.scene-video-controls').count(),0,'Homepage Host is a photo without playback registration');assert.equal(await frame.locator('[data-media-watermark]').count(),1);assert.equal(requests.length,0,'Home never requests the Host MP4');
   const markLayout=await frame.evaluate(element=>{const frame=element.getBoundingClientRect(),mark=element.querySelector('[data-media-watermark]').getBoundingClientRect();return{position:getComputedStyle(element).position,rightInset:frame.right-mark.right,bottomInset:frame.bottom-mark.bottom,inside:mark.left>=frame.left&&mark.top>=frame.top&&mark.right<=frame.right&&mark.bottom<=frame.bottom};});assert.equal(markLayout.position,'relative');assert.equal(markLayout.inside,true);assert.ok(Math.abs(markLayout.rightInset-12)<1.1&&Math.abs(markLayout.bottomInset-12)<1.1,'Static photo owns its watermark geometry');
   const poster=new URL(await frame.locator('img').evaluate(image=>image.currentSrc));assert.equal(poster.pathname,'/'+artifact(width).poster.path);assert.equal(poster.searchParams.get('v'),artifact(width).poster.sha256.slice(0,12));
   const link=section.locator('.guest-invites__cta');assert.equal(new URL(await link.getAttribute('href'),page.url()).pathname,target);result.homepage={staticPhoto:true,watermarkPreserved:true,selectedPoster:poster.pathname,localizedLink:target,hostVideoRequests:0};await capture(page,'host-marketing-'+label+'-home-static');
   await Promise.all([page.waitForURL(origin+target),link.click()]);await playing(page);result.selection=await selection(page,width);result.autoplayBeforeMediaInput=true;result.layout=await layout(page);
   assert.equal(await page.locator('main.niche-main').count(),1);assert.equal(await page.locator('body.wa-page,.wa-hero').count(),0);assert.equal(await page.locator('.niche-highlight').count(),3);assert.equal(await page.locator('#niche-benefits .bento-card').count(),6);assert.equal(await page.locator('.host-marketing-details .wa-plan').count(),4);assert.equal(await page.locator('#niche-faq,#niche-prev-link,#niche-next-link').count(),0);
   assert.equal(await page.locator('.niche-hero__actions a').count(),0);assert.equal(await page.locator('.niche-hero__actions [data-scene-replay]').count(),1);await capture(page,'host-marketing-'+label+'-autoplay');
   const replay=page.locator('.niche-hero__actions [data-scene-replay]');await page.waitForFunction(()=>document.querySelector('.niche-hero video').currentTime>1.1);await replay.click();await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');return!v.paused&&v.currentTime<1;});result.midPlayReplay=true;
   await page.waitForFunction(()=>document.querySelector('.niche-hero video').ended,{},{timeout:25000});await page.waitForTimeout(350);assert.ok(await page.locator('.niche-hero video').evaluate(v=>v.ended&&v.paused&&!v.loop));result.naturalCompletionWithoutLoop=true;await capture(page,'host-marketing-'+label+'-ended');
   await replay.click();await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');return!v.paused&&v.currentTime<1;});result.afterEndReplay=true;result.status='PASS';
   if(width===1280)for(const alias of['automation','Automated-Guest-Invites-API']){await page.goto(origin+'/'+locale+alias+'/',{waitUntil:'load'});await page.waitForURL(origin+target);assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://wifigate.io'+target);report.redirectCases.push({locale:locale||'en',alias,status:'PASS',target});}
  }finally{await context.close();}
 }
 for(const policy of['reduced-motion','save-data']){
  const width=policy==='reduced-motion'?390:1280,context=await browser.newContext({viewport:{width,height:900},reducedMotion:policy==='reduced-motion'?'reduce':'no-preference'});
  try{await context.addInitScript(rejectAnalytics);if(policy==='save-data')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}}));const page=await context.newPage();await page.goto(origin+'/he/'+HOST_PAGE_KEY+'/',{waitUntil:'load'});await page.waitForTimeout(300);assert.equal(await page.locator('.niche-hero').getAttribute('data-scene-state'),'image');assert.equal(await page.locator('.niche-hero video').getAttribute('src'),null);await page.locator('[data-scene-replay]').click();await playing(page);await selection(page,width);await layout(page);report.policyCases.push({policy,status:'PASS',posterOnlyBeforeInput:true,explicitManualPlay:true});await capture(page,'host-marketing-policy-'+policy);}finally{await context.close();}
 }
 report.status='PASS';console.log(`PASS: ${report.cases.length} Host generated-route browser cases, ${report.policyCases.length} preference cases and ${report.redirectCases.length} legacy redirects; static responsive home photo, shared use-case layout, exact native media selection, autoplay/end/replay and preserved pricing.`);
}catch(error){report.status='FAIL';report.error=String(error.message||error);throw error;}
finally{await browser.close();if(screenshots)await fs.writeFile(path.join(screenshots,'host-marketing-browser-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
