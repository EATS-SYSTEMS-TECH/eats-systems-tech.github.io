import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {measureNicheSheet} from './niche-style-measurement.mjs';

// These expectations were frozen before removing the old implementation.
// Never refresh them to accept a mismatch in the replacement stylesheet.
test('use-case presentation preserves frozen real-browser rendering',async()=>{
  const expected=JSON.parse(await readFile(new URL('./fixtures/niche-presentation-contract.json',import.meta.url),'utf8'));
  assert.equal(expected.referenceSourceSha256,'d72b3bb739675369ee4c5175ee24e600724f42e45acfb729ecf92f99ccdc6a7f');
  assert.equal(expected.cases.length,280);
  let measured=0;
  const actual=await measureNicheSheet(await readFile(new URL('../css/niche.css',import.meta.url),'utf8'),()=>{
    if(++measured%56===0) console.log(`Measured ${measured}/280 use-case presentation cases`);
  });
  assert.deepEqual(actual,expected.cases);
});
