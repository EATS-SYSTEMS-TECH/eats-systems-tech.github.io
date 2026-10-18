import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {AUTO_OPEN_PAGE_KEY,getAutoOpenPageContent} from './auto-open-page.mjs';

// Real generated routes and their accepted media; never substitute a fixture
// clip or own/stop the caller's server. Every Chrome context below is owned.
const origin=(process.env.SITE_URL||'http://127.0.0.1:8000').replace(/\/$/,''),screenshots=process.env.SCREENSHOT_DIR;
const manifest=JSON.parse(await fs.readFile(new URL('../assets/vid/scene-manifest.json',import.meta.url),'utf8'));
const scene=manifest.scenes.find(item=>item.key==='auto-open-futuristic'&&item.accepted);
assert.ok(scene,'The reviewed Auto Open scene exists');
const accepted=scene.variants?.desktop?.accepted?scene.variants.desktop:scene;
const videoPath='/'+accepted.video.path,posterPath='/'+accepted.poster.path,videoVersion=accepted.video.sha256.slice(0,12),posterVersion=accepted.poster.sha256.slice(0,12);
const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
const report={schema:'wifigate.auto-open-page.browser-route-qa.v1',kind:'host_browser',status:'RUNNING',sceneId:scene.key,source:{videoPath,videoVersion,posterPath,posterVersion},cases:[],policyCases:[],captures:[]};
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const rejectAnalytics=()=>localStorage.setItem('wifigate-cookie-consent-v1',JSON.stringify({version:1,analytics:false,savedAt:Date.now()}));
async function capture(page,name,locator){
 if(!screenshots)return;const file=path.join(screenshots,name+'.png');
 const exists=await fs.stat(file).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
 assert.equal(exists,false,'Preserve prior screenshot attempts: '+file);
 if(locator)await locator.screenshot({path:file});else await page.screenshot({path:file});
 const bytes=await fs.readFile(file);report.captures.push({file:path.basename(file),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
async function actualSelection(page,width){
 const value=await page.locator('.niche-hero video').evaluate(video=>{const image=document.querySelector('#niche-image');return{src:video.currentSrc,poster:video.poster,image:image.currentSrc||image.src,variant:video.dataset.mediaVariant,width:video.videoWidth,height:video.videoHeight,muted:video.muted,loop:video.loop,duration:video.duration};});
 const src=new URL(value.src),poster=new URL(value.poster);
 assert.equal(src.pathname,videoPath,'Both viewport choices use the reviewed desktop fallback clip');assert.equal(src.searchParams.get('v'),videoVersion);
 assert.equal(poster.pathname,posterPath);assert.equal(poster.searchParams.get('v'),posterVersion);assert.equal(value.poster,value.image,'Poster and image select the same fallback pair');
 assert.equal(value.variant,width<=768?'mobile':'desktop');assert.equal(value.width,accepted.width);assert.equal(value.height,accepted.height);assert.ok(Math.abs(value.duration-accepted.durationSeconds)<.1);assert.equal(value.muted,true);assert.equal(value.loop,false);
 return{selectedVariant:value.variant,videoPath:src.pathname,posterPath:poster.pathname,decodedWidth:value.width,decodedHeight:value.height,duration:value.duration};
}
async function playing(page){await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');if(v?.error)throw Error('Accepted Auto Open decoder failed');return v&&!v.paused&&v.readyState>=2&&v.currentTime>.2;},{},{timeout:15000});}
async function inspectLayout(page){
 const result=await page.locator('.niche-hero').evaluate(hero=>{
  const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=e=>{const s=getComputedStyle(e),b=box(e);return b.width>0&&b.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  const media=hero.querySelector('.niche-hero__media'),mark=media.querySelector('[data-media-watermark]'),image=media.querySelector('img'),video=media.querySelector('video');
  return{media:box(media),headline:box(hero.querySelector('h1')),image:box(image),video:box(video),mark:box(mark),markPointer:getComputedStyle(mark).pointerEvents,markHidden:mark.getAttribute('aria-hidden'),controls:[...hero.querySelectorAll('button,a,input')].filter(visible).map(box),copy:[...hero.querySelectorAll('h1,h2,p,.niche-hero__eyebrow')].filter(visible).map(box),scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
 });
 assert.ok(result.scrollWidth<=result.viewportWidth,'No horizontal overflow');assert.ok(overlaps(result.headline,result.media),'Localized copy remains over video');assert.deepEqual(result.video,result.image,'Video/poster bounds match');assert.equal(result.markPointer,'none');assert.equal(result.markHidden,'true');
 for(const action of result.controls)assert.equal(overlaps(result.mark,action),false,'Watermark clears ALL hero actions including media siblings');for(const text of result.copy)assert.equal(overlaps(result.mark,text),false,'Watermark clears hero copy');
 return{textOverVideo:true,matchingMediaBounds:true,watermarkControlsClear:true,watermarkCopyClear:true};
}
async function inspectBenefits(page,locale){
 const section=page.locator('#niche-benefits');await section.scrollIntoViewIfNeeded();
 const copy=(await import(`./homepage-copy/${locale?'he':'en'}.mjs`)).default,expected=getAutoOpenPageContent(locale?'he':'en',copy).benefits;
 const value=await section.evaluate(element=>{
  const list=element.querySelector('#niche-benefits-list'),cards=[...list.children],box=element.getBoundingClientRect();
  return{title:element.querySelector('h2').textContent.trim(),labelledBy:element.getAttribute('aria-labelledby'),sharedGrid:getComputedStyle(list).display==='grid',columns:getComputedStyle(list).gridTemplateColumns,count:cards.length,cards:cards.map(card=>({title:card.querySelector('h3').textContent.trim(),text:card.querySelector('.bento-card__text').textContent.trim(),icon:!!card.querySelector('.bento-card__icon svg'),sharedClass:card.classList.contains('bento-card'),visible:card.getBoundingClientRect().width>0&&card.getBoundingClientRect().height>0,right:card.getBoundingClientRect().right,left:card.getBoundingClientRect().left})),sectionHeight:box.height,viewportWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth};
 });
 assert.equal(value.title,locale?'יתרונות עיקריים':'Key benefits');assert.equal(value.labelledBy,'niche-benefits-title');assert.equal(value.sharedGrid,true);assert.equal(value.count,3);assert.ok(value.sectionHeight>0);assert.ok(value.scrollWidth<=value.viewportWidth);
 const visibleCopy=value=>value.replace(/[\u200e\u200f]/g,'').trim();
 assert.deepEqual(value.cards.map(({title,text})=>({title:visibleCopy(title),text:visibleCopy(text)})),expected.map(({title,text})=>({title:visibleCopy(title),text:visibleCopy(text)})));
 assert.ok(value.cards.every(card=>card.icon&&card.sharedClass&&card.visible&&card.left>=-.5&&card.right<=value.viewportWidth+.5));
 assert.equal(await page.locator('.niche-highlight').count(),0,'Benefits appear once without duplicate highlight cards');
 return{title:value.title,count:3,sharedGrid:true,sharedCards:true,iconsPresent:true,localizedCopyMatches:true,noDuplicateHighlights:true,noHorizontalOverflow:true,columns:value.columns};
}
try{
 if(screenshots){await fs.mkdir(screenshots,{recursive:true});const exists=await fs.stat(path.join(screenshots,'auto-open-browser-report.json')).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});assert.equal(exists,false,'Use fresh evidence directory for a new attempt');}
 for(const locale of['','he/'])for(const width of[320,390,1280]){
  const height=width<769?844:900,label=(locale?'he':'en')+'-'+width,result={id:label,width,height,status:'RUNNING'};report.cases.push(result);
  const context=await browser.newContext({viewport:{width,height}});
  try{
   await context.addInitScript(rejectAnalytics);const page=await context.newPage(),requests=[];
   page.on('request',request=>{const url=new URL(request.url());if(url.pathname.includes('auto-open-futuristic'))requests.push({path:url.pathname,documentPath:new URL(page.url()).pathname});});
   const target='/'+locale+AUTO_OPEN_PAGE_KEY+'/';await page.goto(origin+'/'+locale,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
   const card=page.locator('.feature-card--auto-open');await card.scrollIntoViewIfNeeded();const icon=card.locator('img.feature-card__image');await icon.waitFor({state:'visible'});
   assert.match(await icon.getAttribute('src'),/\/auto_open\.svg(?:\?|$)/);assert.equal(await card.locator('video,[data-scene-video],[data-media-watermark]').count(),0,'Home feature keeps its ordinary icon');
   const link=page.locator('a.feature-card--auto-open[href],.feature-card--auto-open a[href]').first();assert.equal(new URL(await link.getAttribute('href'),page.url()).pathname,target,'Link opens this language video page');assert.equal(requests.length,0,'Home requests no Auto Open video or poster');
   result.homepage={svgIcon:true,localizedLink:target,inlineVideoAbsent:true,autoOpenRequests:0};await capture(page,'auto-open-'+label+'-home-icon',card);
   await Promise.all([page.waitForURL(origin+target),link.click()]);await page.locator('.niche-hero h1').waitFor();assert.ok((await page.locator('.niche-hero h1').innerText()).trim());assert.equal(await page.locator('.niche-highlight').count(),0);assert.equal(await page.locator('#niche-benefits').count(),1);assert.equal(await page.locator('#niche-faq,#niche-faq-list').count(),0);assert.equal(await page.locator('.niche-hero__pager a,.niche-hero__nav-button').count(),0,'No use-case previous/next links');assert.equal(await page.locator('.niche-hero__actions button[data-scene-replay]').count(),1);assert.equal(await page.locator('.niche-hero__actions a').count(),0);
   await playing(page);result.selection=await actualSelection(page,width);result.autoplayBeforeMediaInput=true;result.layout=await inspectLayout(page);await capture(page,'auto-open-'+label+'-autoplay');
   const replay=page.locator('.niche-hero__actions [data-scene-replay]'),pause=page.locator('.niche-hero__pager [data-scene-pause]');
   await page.waitForFunction(()=>document.querySelector('.niche-hero video').currentTime>1.1);await replay.click();await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');return!v.paused&&v.currentTime<1;});result.midPlayReplay=true;
   await page.waitForFunction(()=>document.querySelector('.niche-hero video').ended,{},{timeout:25000});const endedAt=await page.locator('.niche-hero video').evaluate(v=>v.currentTime);await page.waitForTimeout(400);assert.ok(await page.locator('.niche-hero video').evaluate((v,t)=>v.ended&&v.paused&&!v.loop&&Math.abs(v.currentTime-t)<.1,endedAt));result.naturalCompletionWithoutLoop=true;await capture(page,'auto-open-'+label+'-ended');
   await replay.click();await page.waitForFunction(()=>{const v=document.querySelector('.niche-hero video');return!v.paused&&v.currentTime<1;});result.afterEndReplay=true;await pause.click();assert.equal(await page.locator('.niche-hero video').evaluate(v=>v.paused),true);assert.ok(requests.filter(item=>item.documentPath===target&&item.path.endsWith('.mp4')).every(item=>item.path===videoPath));result.benefits=await inspectBenefits(page,locale);await capture(page,'auto-open-'+label+'-benefits',page.locator('#niche-benefits'));result.status='PASS';
  }finally{await context.close();}
 }
 for(const policy of['reduced-motion','save-data']){
  const width=policy==='reduced-motion'?390:1280,locale=policy==='reduced-motion'?'he/':'';const context=await browser.newContext({viewport:{width,height:900},reducedMotion:policy==='reduced-motion'?'reduce':'no-preference'});
  try{await context.addInitScript(rejectAnalytics);if(policy==='save-data')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}}));const page=await context.newPage();await page.goto(origin+'/'+locale+AUTO_OPEN_PAGE_KEY+'/',{waitUntil:'load'});await page.waitForTimeout(300);assert.equal(await page.locator('.niche-hero').getAttribute('data-scene-state'),'image');assert.equal(await page.locator('.niche-hero video').getAttribute('src'),null);const pair=await page.locator('.niche-hero').evaluate(hero=>({poster:hero.querySelector('video').poster,image:hero.querySelector('img').currentSrc||hero.querySelector('img').src}));assert.equal(pair.poster,pair.image);assert.equal(new URL(pair.poster).pathname,posterPath);await page.locator('[data-scene-replay]').click();await playing(page);await actualSelection(page,width);await inspectLayout(page);report.policyCases.push({policy,status:'PASS',posterOnlyBeforeInput:true,explicitManualPlay:true,scope:'Owned browser context only; no OS/radio changes'});await capture(page,'auto-open-policy-'+policy);}finally{await context.close();}
 }
 report.status='PASS';console.log('PASS: '+report.cases.length+' Auto Open generated-route cases (HE/EN320/390/1280) and '+report.policyCases.length+' page-only preference cases; homepage SVG/localized link without video requests, accepted desktop fallback, autoplay, natural completion, replay and clear watermark.');
}catch(error){report.status='FAIL';report.error=String(error.message||error);throw error;}
finally{await browser.close();if(screenshots)await fs.writeFile(path.join(screenshots,'auto-open-browser-report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});}
