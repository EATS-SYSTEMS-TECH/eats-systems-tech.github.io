import test from "node:test";
import assert from "node:assert/strict";
import { managerHistoryRecord, managerHistoryDay } from "../js/manager-history-workspace.js";

test("History uses firmware source/event/result codes and the recorded gate offset", () => {
  const row=[0,Date.parse('2026-10-27T10:58:40Z')/1000,180,0,0,1,3,3,0,0,0,0,0,'Guest visitor','972501234567'];
  const he=managerHistoryRecord(row,'he');
  assert.equal(he.source,'לחצן טכנאי');
  assert.equal(he.time,'13:58:40');
  assert.equal(he.action,'פתיחה');
  assert.equal(he.state,'done');
  const labels=['System','WIFIGATE app','Auto Open','Technician button','Gate button','Remote control','Scheduled event','Override','Service','WIFIGATE Manager'];
  for(let source=0;source<labels.length;source++) assert.equal(managerHistoryRecord(row.map((v,i)=>i===6?source:v)).source,labels[source]);
  assert.equal(managerHistoryRecord(row.map((v,i)=>i===8?1:v),'he').result,'סורב');
});
test("Unknown codes, unset clocks, missing contact data and invalid days remain explicit", () => {
  const row=[0,0,0,0,0,99,99,0,99,0,0,0,0,'',''];
  const value=managerHistoryRecord(row);
  assert.equal(value.time,'');
  assert.equal(value.date,'Time unavailable');
  assert.equal(value.action,'Unrecognized action');
  assert.equal(value.source,'Unrecognized source');
  assert.equal(value.result,'Result unavailable');
  assert.equal(value.state,'unknown');
  assert.equal(value.phone,'');
  assert.equal(managerHistoryDay('20261027'),'27 October 2026');
  assert.equal(managerHistoryDay('20260231'),'20260231');
  assert.equal(managerHistoryDay('not-a-day'),'not-a-day');
});
