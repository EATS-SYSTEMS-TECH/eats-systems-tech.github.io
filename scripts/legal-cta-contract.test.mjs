import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { chromium } from 'playwright-core';
import { legalBundles,renderLegalMain,LEGAL_PAGES } from './legal/legal-pages.mjs';
const data=JSON.parse(await readFile(new URL('./legal/locale-cta.json',import.meta.url),'utf8'));
const fixed=JSON.parse(await readFile(new URL('../maintenance/ip-contracts/legal-cta.json',import.meta.url),'utf8'));
const phase=process.env.WIFIGATE_CTA_CONTRACT_PHASE||'replacement';
assert.ok(['original','replacement'].includes(phase),'only the explicit original freeze and replacement acceptance phases exist');
const sha=value=>createHash('sha256').update(value).digest('hex');
const digest=value=>sha(JSON.stringify(value));

// These frozen whole-consumer fingerprints exclude exactly four approved words
// slots; all remaining policy/company/fallback data stays inside the assertion.
function dom(n){
 if(n.type==='comment')return null;
 if(n.type==='text'){const s=n.data.replace(/\s+/g,' ').trim();return s?['text',s]:null;}
 return[n.type,n.name??null,Object.entries(n.attribs??{}).sort(([a],[b])=>a.localeCompare(b)),(n.children??[]).map(dom).filter(Boolean)];
}
test('legal CTA data retains the exact approved phase, locale order and seven-field schema',()=>{
 assert.equal(digest(data),fixed[phase+'DataSha256']);assert.deepEqual(Object.keys(data),fixed.locales);
 for(const [locale,row] of Object.entries(data)){
  assert.deepEqual(Object.keys(row),['eyebrow','pricing','back']);
  for(const group of ['pricing','back'])assert.deepEqual(Object.keys(row[group]),['title','text','button']);
  for(const field of fixed.fields){const [group,key]=field.split('.');assert.equal(sha(row[group][key]),fixed.freshFieldHashes[locale][field][phase]);assert.notEqual(fixed.freshFieldHashes[locale][field].original,fixed.freshFieldHashes[locale][field].replacement);}
 }
});
test('legal eyebrows and native action labels remain fixed nonempty plain-text facts',()=>{
 for(const [locale,row] of Object.entries(data)){
  const labels=fixed.fixedLabels[locale];assert.equal(row.eyebrow,labels.eyebrow);assert.equal(row.pricing.button,labels.pricingButton);assert.equal(row.back.button,labels.backButton);
  for(const value of [row.eyebrow,...Object.values(row.pricing),...Object.values(row.back)]){assert.equal(typeof value,'string');assert.ok(value.trim());assert.doesNotMatch(value,/[<>]/);}
  assert.doesNotMatch(row.pricing.button,/@/);
 }
});
test('all 156 complete actual legal bundles retain policy, company and fallback data',()=>{
 for(const page of LEGAL_PAGES){
  const bundles=legalBundles(page);assert.equal(Object.keys(bundles).length,39);
  for(const [locale,value] of Object.entries(bundles)){
   const row=structuredClone(value);
   if(locale in data)for(const field of fixed.fields){const [group,key]=field.split('.');assert.equal(row.cta[group][key],data[locale][group][key]);row.cta[group][key]='FIXED_APPROVED_CTA_COPY_SLOT';}
   assert.equal(digest(row),fixed.normalizedBundles[page][locale],page+'/'+locale);
  }
 }
});
test('all four complete legal renderer bodies change only the approved copy nodes',()=>{
 for(const page of LEGAL_PAGES){
  const $=load(renderLegalMain(page));
  for(const field of fixed.fields){const selector=`[data-i18n="legal.cta.${field}"]`;assert.equal($(selector).length,1);const [group,key]=field.split('.');assert.equal($(selector).text(),data.en[group][key]);$(selector).text('FIXED_APPROVED_CTA_COPY_SLOT');}
  assert.equal(digest(dom($.root()[0])),fixed.normalizedRender[page]);
 }
});
test('legal action destinations and the thirteen uncovered locale defaults remain exact',()=>{
 for(const page of LEGAL_PAGES){
  const $=load(renderLegalMain(page));const pricing=$('[data-i18n="legal.cta.pricing.button"]'),back=$('[data-i18n="legal.cta.back.button"]');
  assert.equal(pricing.attr('href'),'https://wa.me/message/NZWNMX6V2XVHJ1');assert.equal(pricing.attr('target'),'_blank');assert.equal(pricing.attr('rel'),'noopener noreferrer');assert.equal(back.attr('href'),'../index.html');
  const bundles=legalBundles(page),uncovered=Object.keys(bundles).filter(locale=>!(locale in data));assert.equal(uncovered.length,13);
  for(const locale of uncovered)assert.deepEqual(bundles[locale].cta,{pricing:{title:'Need pricing or installation guidance?',text:'Send us a WhatsApp message and we will help with product fit, installation and next steps.',button:'Open WhatsApp'},back:{title:'Back to the main site',text:'Return to the homepage to review features, applications, tutorials and contact details.',button:'Go to homepage'}});
 }
});

// Render the real legal body, actual shared/legal CSS and all 26 existing
// native labels. Narrow cards must contain long labels without hiding words.
test('actual Chrome keeps all legal actions inside narrow and wide cards',async()=>{
 const styles=(await Promise.all(['../css/styles.css','../css/legal.css'].map(file=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  for(const [locale,row] of Object.entries(data))for(const width of [320,375,1440]){
   const $=load(renderLegalMain('privacy-policy'));
   for(const group of ['pricing','back'])for(const key of ['title','text','button'])$(`[data-i18n="legal.cta.${group}.${key}"]`).text(row[group][key]);
   const rtl=['he','ar'].includes(locale);$('html').attr({lang:locale,dir:rtl?'rtl':'ltr'});$('body').attr('class','legal-page'+(rtl?' rtl':''));$('head').append($('<style>').text(styles));
   await page.setViewportSize({width,height:950});await page.setContent($.html());
   const actual=await page.locator('.legal-cta').evaluate(section=>({scrollWidth:section.scrollWidth,clientWidth:section.clientWidth,buttons:Array.from(section.querySelectorAll('a')).map(n=>({scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,width:n.getBoundingClientRect().width,text:n.textContent}))}));
   assert.ok(actual.scrollWidth<=actual.clientWidth+1,`${locale}/${width}: section overflow`);
   for(const button of actual.buttons){assert.ok(button.width>0,`${locale}/${width}: hidden action`);assert.ok(button.scrollWidth<=button.clientWidth+1,`${locale}/${width}: clipped label`);}
  }
 }finally{await browser.close();}
});
