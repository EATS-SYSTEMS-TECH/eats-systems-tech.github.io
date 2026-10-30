import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { load } from "cheerio";
import { chromium } from "playwright-core";

// Read the actual public shell; populate its optional slots with independent
// role examples. No former style declarations are retained in this fixture.
const files = ["../templates/niche.template.html", "../css/styles.css", "../css/accessibility.css", "../css/faq.css"];
const [template, main, accessibility, faq] = await Promise.all(files.map(p => readFile(new URL(p, import.meta.url), "utf8")));
function fixture() {
  const $ = load(template);
  $("script,link,style").remove();
  $("img").removeAttr("src");
  $("#niche-hero-lead,#niche-highlights").removeAttr("hidden");
  $("#niche-hero-lead").text("A readable entrance\nA second line");
  $("#niche-hero-proof").html('<li class="niche-hero__proof-item">Private access</li><li class="niche-hero__proof-item">One app</li>');
  $("#niche-highlights-list").html(Array.from({length:3}, () => '<article class="niche-highlight"><span class="niche-highlight__icon"><svg><path d="M0 0L1 1"/></svg></span><h3 class="niche-highlight__title">Entrance</h3><p class="niche-highlight__text">Readable supporting text</p><a class="btn niche-highlight__cta" href="#">Details</a></article>').join(""));
  const row = '<li class="bento-visual__row"><span class="bento-visual__avatar">AB</span><span class="bento-visual__name">Guest name</span><span class="bento-visual__detail">Entrance access</span><span class="bento-visual__badge">Allowed</span><time class="bento-visual__time">08:00</time><span class="bento-visual__glyph"><svg/></span><span class="bento-visual__day">Monday</span><span class="bento-visual__track"><span class="bento-visual__span" style="--from:20%;--to:70%"></span></span></li>';
  const card = (kind, index) => `<li class="bento-card bento-card--${kind} ${index===0?'bento-card--with-visual':''}"><div class="bento-card__top"><span class="bento-card__icon"><svg/></span><span class="bento-card__count">0${index+1}</span></div><div class="bento-card__body"><h3 class="bento-card__title">A private entrance</h3><p class="bento-card__text">Supporting readable text in a flexible card.</p><ul class="bento-card__tags"><li class="bento-tag">Private</li></ul></div><div class="bento-visual bento-visual--${['roster','history','invite','schedule'][index%4]}"><div class="bento-visual__bar"><span class="bento-visual__heading">Guest access</span><span class="bento-visual__status">Available</span></div><ul class="bento-visual__rows">${row}</ul></div></li>`;
  $("#niche-benefits-list").html(['lead','feature','third','half','full'].map(card).join(""));
  return $.html();
}

// Fingerprints contain browser facts, not CSS source. Transitions are disabled
// only for measurements; pointer admission and motion choices remain sampled.
export async function measureNicheSheet(sheet, onCase = () => {}, scope = {}) {
  const browser = await chromium.launch({channel:"chrome",headless:true});
  const rows=[];
  const states=['default','scaled','contrast','reduced','primary-hover','ghost-hover','pager-hover','card-hover','focus','print','forced','bn','ja','ar'];
  try {
    const page=await browser.newPage();
    await page.route('**/*', route=>route.abort());
    for(const width of scope.widths??[320,620,621,768,769,960,961,1024,1025,1440]) for(const direction of scope.directions??['ltr','rtl']) for(const state of scope.states??states) {
      await page.setViewportSize({width,height:900});
      await page.emulateMedia({media:state==='print'?'print':'screen',forcedColors:state==='forced'?'active':'none',reducedMotion:state==='reduced'?'reduce':'no-preference'});
      await page.setContent(fixture());
      await page.evaluate(({direction,state})=>{
        const root=document.documentElement;
        root.dir=direction;root.lang=['bn','ja','ar'].includes(state)?state:'en';
        root.className=state==='scaled'?'a11y-text-scaled':state==='contrast'?'a11y-high-contrast':state==='reduced'?'a11y-reduced-motion':'';
        root.style.setProperty('--a11y-text-scale','1.5');
      },{direction,state});
      await page.addStyleTag({content:main+'\n'+accessibility+'\n'+sheet+'\n'+faq+'\n*{animation:none!important;transition:none!important}'});
      await page.mouse.move(0,0);
      const target={'primary-hover':'.niche-hero__btn-primary','ghost-hover':'.niche-hero__btn-secondary','pager-hover':'.niche-hero__nav-button','card-hover':'.bento-card'}[state];
      if(target) await page.locator(target).first().hover();
      if(state==='focus') await page.locator('.niche-hero__nav-button').first().focus();
      const values=await page.evaluate(()=>{
        const nodes=[...document.querySelectorAll('html,body,main,main *')].map(element=>[element.tagName,element.className.baseVal??element.className,...[null,'::before','::after'].map(pseudo=>{
          const style=getComputedStyle(element,pseudo);
          // Custom implementation tokens may change. Every standard computed
          // property, including dimensions, stays part of the rendering contract.
          return [...style].filter(name=>!name.startsWith('--')).map(name=>[name,style.getPropertyValue(name)]);
        })]);
        // Serialize once in Chromium instead of round-tripping millions of
        // individual pairs through the automation protocol. Hash the same JSON.
        return {elements:nodes.length,serialized:JSON.stringify(nodes)};
      });
      const row={width,direction,state,elements:values.elements,sha256:createHash('sha256').update(values.serialized).digest('hex')};
      rows.push(row);onCase(row,scope.includeValues?JSON.parse(values.serialized):undefined);
    }
  } finally {await browser.close();}
  return rows;
}
