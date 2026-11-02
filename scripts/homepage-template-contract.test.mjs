import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const frozen=JSON.parse(await readFile(new URL('../maintenance/ip-contracts/homepage-template.json',import.meta.url),'utf8'));
const source=await readFile(new URL('../templates/index.template.html',import.meta.url),'utf8');
const $=load(source);

// Keep all actual nodes, meaningful words, attributes, JSON and vector geometry;
// only authoring comments, indentation and attribute ordering are irrelevant.
function model(n){
 if(n.type==='comment')return null;
 if(n.type==='text'){const s=n.data.replace(/\s+/g,' ').trim();return s?['text',s]:null;}
 return[n.type,n.name??null,Object.entries(n.attribs??{}).sort(([a],[b])=>a.localeCompare(b)),(n.children??[]).map(model).filter(Boolean)];
}
test('entire homepage document retains its frozen complete original DOM',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(model($.root()[0]))).digest('hex'),frozen.domSha256);
});
test('homepage section order, real skip target and standalone shared mounts remain exact',()=>{
 assert.deepEqual($('main > section').map((_,n)=>n.attribs.id).get(),frozen.sectionOrder);
 assert.equal($('.skip-link').attr('href'),'#main-content');assert.equal($('main#main-content').length,1);
 assert.deepEqual($('[data-partial]').map((_,n)=>n.attribs['data-partial']).get(),frozen.partialNames);
 for(const name of frozen.partialNames)assert.match(source,new RegExp('^\\s*<div data-partial="'+name+'"></div>\\s*$','m'));
 assert.equal($('.features-grid').children().length,0);assert.equal($('.guest-invites__points').children().length,0);
});
test('homepage head retains script order, SEO alternatives and structured facts',()=>{
 assert.deepEqual($('head script[src]').map((_,n)=>n.attribs.src).get(),frozen.headScripts);
 assert.equal($('link[rel="alternate"]').length,40);
 assert.equal($('link[rel="canonical"]').attr('href'),'https://wifigate.io/');
 assert.equal(JSON.parse($('#hero-locale-data').text()).phrases.length,3);
 const schema=JSON.parse($('script[type="application/ld+json"]').text());
 assert.deepEqual(schema.map(n=>n['@type']),['WebSite','Organization','FAQPage']);
 assert.deepEqual(schema[2].mainEntity.map(n=>[n.name,n.acceptedAnswer.text]),$('.seo-faq__item').toArray().map(n=>[$(n).find('summary').text(),$(n).find('.seo-faq__answer p').text()]));
});
test('hero preserves real video controls, initial state and section destinations',()=>{
 assert.equal($('#home').attr('data-hero-media-state'),'video');
 assert.equal($('#hero-video[muted][loop][playsinline]').length,1);assert.equal($('#hero-video').attr('preload'),'none');
 assert.equal($('#hero-pause-toggle').attr('data-paused'),'false');assert.equal($('#hero-mute-toggle').attr('data-muted'),'true');
 assert.equal($('#hero-replay[hidden]').length,1);
 assert.deepEqual($('.hero__actions a').map((_,n)=>n.attribs.href).get(),['#how-it-works','#get-in-touch']);
 for(const id of ['hero-pause-toggle','hero-mute-toggle','hero-replay'])assert.equal($('#'+id+' svg').length,2);
});
test('homepage illustrations, native FAQ state and indexed entry labels stay intact',()=>{
 assert.deepEqual($('body img').toArray().map(n=>({...n.attribs})),frozen.imageFacts);
 assert.equal($('.seo-faq__item').length,4);assert.equal($('.seo-faq__item[open]').length,1);assert.equal($('.seo-faq__item').first().is('[open]'),true);
 assert.deepEqual($('.entry-point__label').map((_,n)=>n.attribs['data-entry-point']).get(),['0','1','2','3','4','5','6','7']);
 assert.equal($('#entry-points-note[hidden]').length,1);assert.equal($('#entry-points-note').text(),'');
});
test('homepage contact actions, niche targets and tutorial availability remain honest',()=>{
 assert.equal($('.where-list__link').length,10);
 $('.where-list__link').each((_,n)=>assert.equal(n.attribs.href,'/'+n.attribs['data-niche-key']+'/'));
 assert.equal($('.tutorial-card').length,6);assert.equal($('.tutorial-card a,.tutorial-card video').length,0);
 assert.deepEqual($('.tutorial-card__status').map((_,n)=>$(n).text()).get(),Array(6).fill('Coming soon'));
 assert.equal($('.contact-option-card').length,3);assert.equal($('.contact-option-card a[href="mailto:support@wifigate.io"]').length,1);
 assert.equal($('.contact-option-card a[href="https://wa.me/message/NZWNMX6V2XVHJ1"]').length,2);
 $('a[target="_blank"]').each((_,n)=>assert.equal(n.attribs.rel,'noopener noreferrer'));
});
