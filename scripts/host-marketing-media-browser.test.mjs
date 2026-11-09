import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {HOST_PAGE_KEY} from './host-marketing-page.mjs';

const origin=(process.env.SITE_URL||'http://127.0.0.1:8000').replace(/\/$/,''),screenshots=process.env.SCREENSHOT_DIR;
// The Host hero shows the approved white line animation (js/line-hero.js), not
// a video; scripts/line-hero-browser.test.mjs covers its layout and controls in
// depth. This route test keeps the homepage-to-Host journey and page contract.
const report={schema:'wifigate.host-marketing-page.browser-route-qa.v2',kind:'host_browser',status:'RUNNING',hero:'line-animation',cases:[],policyCases:[],redirectCases:[],captures:[]};
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const rejectAnalytics=()=>localStorage.setItem('wifigate-cookie-consent-v1',JSON.stringify({version:1,analytics:false,savedAt:Date.now()}));
const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
async function capture(page,name){
 if(!screenshots)return;const file=path.join(screenshots,name+'.png');
 assert.equal(await fs.stat(file).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;}),false,'Preserve prior screenshots');
 await page.screenshot({path:file});const bytes=await fs.readFile(file);report.captures.push({file:path.basename(file),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
async function animating(page){
 await page.waitForFunction(()=>document.querySelector('.niche-hero')?.dataset.lineHeroState==='playing'&&document.querySelector('svg.line-hero__art'),{},{timeout:15000});
 const before=await page.evaluate(()=>document.querySelector('svg.line-hero__art').innerHTML);
 await page.waitForFunction(previous=>document.querySelector('svg.line-hero__art').innerHTML!==previous,before,{timeout:5000});
}
async function selection(page){
 const value=await page.evaluate(()=>({image:document.querySelector('#niche-image').currentSrc,videos:document.querySelectorAll('.niche-hero video, [data-media-watermark]').length,svg:document.querySelector('svg.line-hero__art')?.getAttribute('aria-hidden'),light:document.querySelector('.niche-hero').classList.contains('niche-hero--line')}));
 assert.match(new URL(value.image).pathname,/^\/assets\/img\/line-hero\/host-(start|still)\.svg$/);assert.equal(value.videos,0,'No video or video watermark in the Host hero');assert.equal(value.svg,'true');assert.equal(value.light,true);
 return{frame:new URL(value.image).pathname,video:false};
}
async function layout(page){
 const result=await page.locator('.niche-hero').evaluate(hero=>{const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const visible=e=>{const s=getComputedStyle(e),r=box(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};const media=hero.querySelector('.niche-hero__media');return{media:box(media),headline:box(hero.querySelector('h1')),stage:box(media.querySelector('[data-line-hero-stage]')),controls:[...hero.querySelectorAll('.niche-hero__actions button,.niche-hero__actions a')].filter(visible).map(box),copy:[...hero.querySelectorAll('h1,h2,p')].filter(visible).map(box),scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};});
 // The art fills the media layer as the video did (full width, never cropped); the copy overlays it on the white scrim.
 assert.ok(result.scrollWidth<=result.viewportWidth,'No horizontal overflow');assert.ok(overlaps(result.headline,result.media),'Copy stays in the full-width hero media layer');assert.ok(Math.abs(result.stage.width-Math.min(result.media.width,result.media.height*16/9))<1&&Math.abs(result.stage.height-result.stage.width*9/16)<1,'The 16:9 art is as large as the media layer allows');
 return{textInHero:true,artFillsMedia:true};
}
try{
 if(screenshots)await fs.mkdir(screenshots,{recursive:true});
 for(const locale of['','he/'])for(const width of[320,390,1280]){
  const height=width<769?844:900,label=(locale?'he':'en')+'-'+width,result={id:label,width,height,status:'RUNNING'};report.cases.push(result);
  const context=await browser.newContext({viewport:{width,height}});
  try{
   await context.addInitScript(rejectAnalytics);const page=await context.newPage(),requests=[];page.on('request',request=>{const url=new URL(request.url());if(url.pathname.includes('hotels-airbnb')&&url.pathname.endsWith('.mp4'))requests.push(url.pathname);});
   const target='/'+locale+HOST_PAGE_KEY+'/';await page.goto(origin+'/'+locale+'#wifigate-for-business',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
   const section=page.locator('#wifigate-for-business'),frame=section.locator('.business-plan--host .business-plan__art');await frame.scrollIntoViewIfNeeded();await frame.waitFor({state:'visible'});
   assert.equal(await frame.locator('.business-plan__art-letter').innerText(),'H');assert.equal(await section.locator('img,video,[data-scene-video],[data-scene-copy],.scene-video-controls,[data-media-watermark]').count(),0,'Homepage plans show the shop card artwork, no media');assert.equal(requests.length,0,'Home never requests the Host MP4');
   const link=section.locator('.guest-invites__cta');assert.equal(new URL(await link.getAttribute('href'),page.url()).pathname,target);result.homepage={shopArtwork:true,localizedLink:target,hostVideoRequests:0};await capture(page,'host-marketing-'+label+'-home-static');
   await Promise.all([page.waitForURL(origin+target),link.click()]);await animating(page);result.selection=await selection(page);result.animatesBeforeInput=true;result.layout=await layout(page);assert.equal(requests.length,0,'The Host page requests no hospitality video');
   assert.equal(await page.locator('main.niche-main').count(),1);assert.equal(await page.locator('body.wa-page,.wa-hero').count(),0);assert.equal(await page.locator('.niche-highlight').count(),3);assert.equal(await page.locator('#niche-benefits .bento-card').count(),6);assert.equal(await page.locator('.niche-hero + .host-marketing-pricing .wa-plan').count(),3);assert.equal(await page.locator('#niche-faq,#niche-prev-link,#niche-next-link').count(),0);
   assert.equal(await page.locator('.niche-hero__actions a').count(),0);assert.equal(await page.locator('.niche-hero__actions [data-scene-replay]').count(),1);await capture(page,'host-marketing-'+label+'-autoplay');
   // The loop never ends; replay restarts it and the pager offers pause/resume.
   const replay=page.locator('.niche-hero__actions [data-scene-replay]'),pause=page.locator('.niche-hero__pager [data-scene-pause]');await pause.click();assert.equal(await page.locator('.niche-hero').getAttribute('data-line-hero-state'),'paused');
   await replay.click();await animating(page);result.replayRestarts=true;assert.equal(await pause.getAttribute('aria-pressed'),'false');result.pauseResume=true;result.status='PASS';
   if(width===1280)for(const alias of['automation','Automated-Guest-Invites-API']){await page.goto(origin+'/'+locale+alias+'/',{waitUntil:'load'});await page.waitForURL(origin+target);assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://wifigate.io'+target);report.redirectCases.push({locale:locale||'en',alias,status:'PASS',target});}
  }finally{await context.close();}
 }
 for(const policy of['reduced-motion','save-data']){
  const width=policy==='reduced-motion'?390:1280,context=await browser.newContext({viewport:{width,height:900},reducedMotion:policy==='reduced-motion'?'reduce':'no-preference'});
  // Reduced motion shows the approved still until the visitor asks for motion. The drawn
  // animation costs no data, so a save-data connection still animates it.
  try{await context.addInitScript(rejectAnalytics);if(policy==='save-data')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}}));const page=await context.newPage();await page.goto(origin+'/he/'+HOST_PAGE_KEY+'/',{waitUntil:'load'});
   if(policy==='reduced-motion'){await page.waitForFunction(()=>document.querySelector('.niche-hero')?.dataset.lineHeroState==='still');assert.match(await page.locator('#niche-image').evaluate(image=>image.currentSrc),/host-still\.svg/);assert.equal(await page.locator('[data-scene-pause]').isVisible(),false);await page.locator('[data-scene-replay]').click();}
   await animating(page);await selection(page);await layout(page);report.policyCases.push({policy,status:'PASS',stillBeforeInput:policy==='reduced-motion',explicitManualPlay:policy==='reduced-motion'});await capture(page,'host-marketing-policy-'+policy);}finally{await context.close();}
 }
 report.status='PASS';console.log(`PASS: ${report.cases.length} Host generated-route browser cases, ${report.policyCases.length} preference cases and ${report.redirectCases.length} legacy redirects; static homepage card, shared use-case layout, light line-animation hero with replay/pause and no video, preserved pricing.`);
}catch(error){report.status='FAIL';report.error=String(error.message||error);throw error;}
finally{await browser.close();if(screenshots)await fs.writeFile(path.join(screenshots,'host-marketing-browser-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
