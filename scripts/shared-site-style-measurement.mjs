import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { chromium } from 'playwright-core';
import { readHtmlTemplate, setBodyDirection, updateSharedHeader, updateFooterStaticUi } from './localized-builder-document.mjs';
import { applyHomepageCopy, updateHomeWhereLinks } from './localized-builder-content.mjs';
import { installHomeFeatureCards } from './homepage-feature-grid.mjs';
import { installHomeHostPointShells } from './host-marketing-page.mjs';
import { SITE_LANGUAGES } from './site-languages.mjs';
import english from './homepage-copy/en.mjs';
import hebrew from './homepage-copy/he.mjs';

// Use the actual current homepage, shared partials and composition functions.
// Independent compatibility examples exercise still-supported legacy roles.
const template=await readHtmlTemplate(fileURLToPath(new URL('../templates/index.template.html',import.meta.url)));
const copies={en:english,he:hebrew};
const dependencies=Object.fromEntries(await Promise.all(['fonts','accessibility','guest-invites','home-en','faq','site-header','site-cart'].map(async name=>[name,await readFile(new URL(`../css/${name}.css`,import.meta.url),'utf8')])));
const parsedTemplate=load(template);
const inline=parsedTemplate('style').map((_,node)=>parsedTemplate(node).text()).get().join('\n');
const legacy=`<section aria-label="Style compatibility examples">
  <button class="tab-dot" type="button">One</button><button class="tab-dot tab-dot--active" type="button">Two</button>
  <button class="tab-button" type="button">A supported tab</button>
  <div class="tab-pane">Inactive panel</div><div class="tab-pane tab-pane--active">Active panel</div>
  <div class="why-grid"><div class="why-media"><img class="why-media__image" width="120" height="80" alt="Example artwork"></div><div class="why-copy"><ul><li class="why-list__item">An entrance</li></ul></div></div>
  <article class="where-story-card"><header class="where-story-card__header"><h3 class="where-story-card__heading">Entrance detail</h3></header><div class="where-story-card__video-meta"><span>Information</span><span>Details</span></div></article>
  <form class="contact-form"><label>Example field<input type="text"></label><p class="contact-form__status">Status</p></form>
  <div class="contact-info__header"><span class="contact-info__avatar"><img width="50" height="50" alt="Contact artwork"></span><a class="contact-info__phone" href="#contact">Example contact</a></div>
</section>`;

function fixture(locale){
 const $=load(template),copy=copies[locale];
 installHomeFeatureCards($);installHomeHostPointShells($);setBodyDirection($,locale);
 updateFooterStaticUi($,locale,copy.footer);updateHomeWhereLinks($,locale);applyHomepageCopy($,copy,locale);
 updateSharedHeader($,{homepageCopies:copies,localeOptions:SITE_LANGUAGES},locale,'home');
 $('script,link,style').remove();$('img,source').removeAttr('src');$('video').removeAttr('poster');
 $('#main-content').append(legacy);$('.hero__media').append('<div class="hero-system is-active">Active scene</div>');
 return $.html();
}

const states=['default','navigation-open','language-open','media-image','revealed','primary-hover','ghost-hover','control-hover','card-hover','where-hover','footer-hover','focus','scaled','contrast','reduced','print','forced'];
const widths=[320,480,481,620,621,768,769,960,961,1024,1025,1199,1200,1440];
const interactionWidths=[320,480,768,769,1440];
const timingProperties=['transition-property','transition-duration','transition-delay','transition-timing-function','animation-name','animation-duration','animation-delay','animation-timing-function','animation-iteration-count','animation-direction','animation-fill-mode','animation-play-state'];
const hoverTargets={'primary-hover':'.hero__btn-primary','ghost-hover':'.hero__btn-secondary','control-hover':'#hero-mute-toggle','card-hover':'.feature-card','where-hover':'.where-list__link','footer-hover':'.site-footer__store'};

// Paint facts include every standard computed property, both pseudo-elements,
// border-box sizes and all pre-existing public custom-property values. Internal
// scroll-overflow caches and ambient viewport offsets are not style facts.
// New internal
// implementation tokens may differ. Timing values are captured before the
// measurement-only transition/animation suppression, so they are not erased.
export async function measureSharedSiteSheet(sheet,publicProperties,onCase=()=>{},scope={}){
 const server=createServer((_,response)=>{response.setHeader('Content-Type','text/html; charset=utf-8');response.end('<!doctype html><title>Style contract</title>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 let browser;const rows=[];
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
  await page.route('**/*',route=>route.request().url()===origin+'/'?route.continue():route.abort());await page.goto(origin+'/');
  for(const skin of scope.skins??['base','composed'])for(const width of scope.widths??widths)for(const locale of scope.locales??['en','he'])for(const state of scope.states??(interactionWidths.includes(width)?states:['default'])){
   await page.setViewportSize({width,height:950});
   await page.emulateMedia({media:state==='print'?'print':'screen',forcedColors:state==='forced'?'active':'none',reducedMotion:state==='reduced'?'reduce':'no-preference'});
   await page.setContent(fixture(locale));
   await page.evaluate(state=>{
    window.scrollTo(0,0);
    const root=document.documentElement;
    if(state==='scaled'){root.classList.add('a11y-text-scaled');root.style.setProperty('--a11y-text-scale','1.5');}
    if(state==='contrast')root.classList.add('a11y-high-contrast');
    if(state==='reduced')root.classList.add('a11y-reduced-motion');
    if(state==='navigation-open')document.querySelector('.nav__links-wrapper').classList.add('is-open');
    if(state==='language-open')document.querySelector('.language-selector').classList.add('is-open');
    if(state==='media-image'){
     document.querySelector('.hero').dataset.heroMediaState='image';document.querySelector('#hero-pause-toggle').dataset.paused='true';document.querySelector('#hero-mute-toggle').dataset.muted='false';document.querySelector('#hero-replay').hidden=false;
    }
    if(state==='revealed')document.querySelectorAll('.js-reveal').forEach(n=>n.classList.add('is-visible'));
   },state);
   const stack=skin==='base'?sheet:[dependencies.fonts,sheet,dependencies.accessibility,dependencies['guest-invites'],dependencies['home-en'],dependencies.faq,inline,dependencies['site-header'],dependencies['site-cart']].join('\n');
   await page.addStyleTag({content:stack});await page.mouse.move(0,0);
   // Hover/focus operate on actual browser elements. Hidden media controls are
   // admitted for their state probe without pretending that runtime opened them.
   if(hoverTargets[state])await page.locator(hoverTargets[state]).first().hover({force:true});
   if(state==='focus'){await page.keyboard.press('Tab');await page.locator('.hero__btn-primary').first().focus();}
   const policy=await page.evaluate(timingProperties=>{
    const nodes=[...document.querySelectorAll('html,body,[class],svg,img')];
    const timing=nodes.map(n=>[null,'::before','::after'].map(pseudo=>timingProperties.map(key=>getComputedStyle(n,pseudo).getPropertyValue(key))));
    const scrolling=nodes.map(n=>[null,'::before','::after'].map(pseudo=>getComputedStyle(n,pseudo).scrollBehavior));
    return{timing,scrolling};
   },timingProperties);
   // Preserve the real state timing/scroll policy above, then replay native
   // input after suppressing time-dependent movement. This prevents smooth
   // scrolling or a moving hover target from changing viewport offsets during
   // the paint sample; the original declared policy remains in the fingerprint.
   await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}html{scroll-behavior:auto!important}'});
   await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));
   if(hoverTargets[state])await page.locator(hoverTargets[state]).first().hover({force:true});
   if(state==='focus')await page.locator('.hero__btn-primary').first().focus();
   // Let canceled transitions retire their cached overflow contribution before
   // sampling scroll geometry. No product timing metadata is discarded.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const fact=await page.evaluate(async({publicProperties,policy,includeValues})=>{
    const nodes=[...document.querySelectorAll('html,body,[class],svg,img')];
    const values=nodes.map((n,index)=>{
     const r=n.getBoundingClientRect(),round=v=>Math.round(v*64)/64;
     // Width, height and every computed layout/transform property remain exact.
     // Do not treat native scroll-centering or a cached overflow extent as a
     // source difference. Real page clipping has separate browser assertions.
     return[n.tagName,n.className.baseVal??n.className,[round(r.width),round(r.height)],policy.timing[index],policy.scrolling[index],
      ...[null,'::before','::after'].map(pseudo=>{const style=getComputedStyle(n,pseudo);return[[...style].filter(key=>!key.startsWith('--')).map(key=>[key,style.getPropertyValue(key)]),publicProperties.map(key=>[key,style.getPropertyValue(key)])];})];
    });
    const bytes=new TextEncoder().encode(JSON.stringify(values));const hash=await crypto.subtle.digest('SHA-256',bytes);
    return{elements:nodes.length,serializedBytes:bytes.length,sha256:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join(''),values:includeValues?values:undefined};
   },{publicProperties,policy,includeValues:!!scope.includeValues&&(!scope.captureState||scope.captureState===state)});
   const {values,...paint}=fact;const row={skin,width,locale,state,...paint};rows.push(row);onCase(row,values);
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
 return rows;
}

export const sharedSiteStyleMatrix={widths,interactionWidths,locales:['en','he'],skins:['base','composed'],states,geometry:'border-box-width-height',expectedCases:376};
