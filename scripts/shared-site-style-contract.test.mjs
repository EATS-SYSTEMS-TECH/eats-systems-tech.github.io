import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {measureSharedSiteSheet,sharedSiteStyleMatrix} from './shared-site-style-measurement.mjs';

// The expected paint facts are frozen before deleting the original stylesheet.
// A mismatch must be diagnosed; never refresh expectations to accept new CSS.
test('shared site presentation retains every frozen base and composed browser case',async()=>{
 const frozen=JSON.parse(await readFile(new URL('./fixtures/shared-site-style-contract.json',import.meta.url),'utf8'));
 assert.equal(frozen.referenceSourceSha256,'f84929bd815e53daedc3c35cc12104b964a7cd6df354a8a3a04f8c972e4f20f2');
 const measurement=await readFile(new URL('./shared-site-style-measurement.mjs',import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(measurement.replace(/\r\n/g,'\n')).digest('hex'),frozen.measurementSourceSha256,'measurement implementation stays frozen with the original paint facts');
 assert.deepEqual(frozen.matrix,sharedSiteStyleMatrix);assert.equal(frozen.cases.length,376);
 let count=0;
 const rows=await measureSharedSiteSheet(await readFile(new URL('../css/styles.css',import.meta.url),'utf8'),frozen.publicCustomProperties,()=>{if(++count%24===0)console.log(`Measured ${count}/376 shared site presentation cases`);});
 assert.deepEqual(rows,frozen.cases);
});
