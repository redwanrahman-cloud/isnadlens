import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {evidenceForDisplay} from '../src/lib/evidence-display.ts';

globalThis.fetch=async()=>{throw Error('OFFLINE_DISPLAY_CHECK_ONLY');};
const expected={N13:'18:25',N16:'en:3131',N18:'en:5350',N30:'76:8'};
const cases=[];
for(let i=1;i<=30;i++){
 const id=`N${String(i).padStart(2,'0')}`;
 const record=JSON.parse(await readFile(`artifacts/private/release30-round7-first-pass/${id}.json`,'utf8'));
 const original=JSON.stringify(record),ordered=evidenceForDisplay(record);
 assert.equal(JSON.stringify(record),original,'Sealed record must remain byte-for-byte unchanged');
 assert.equal(ordered.length,record.evidence_items.length);
 assert.deepEqual([...ordered].map(e=>e.evidence_id).sort(),record.evidence_items.map(e=>e.evidence_id).sort());
 for(const item of ordered)assert.equal(item,record.evidence_items.find(e=>e.evidence_id===item.evidence_id));
 const review=record.verdict==='insufficient_within_selected_corpus'?record.qualified_explanation_review:record.entailment_review;
 if(review?.status==='passed')assert.ok(review.raw_review.atoms.some(a=>a.evidence_id===ordered[0]?.evidence_id));
 else assert.deepEqual(ordered,record.evidence_items);
 if(expected[id])assert.equal(ordered[0]?.locator,expected[id]);
 cases.push({id,previous_first:record.evidence_items[0]?.locator??null,display_first:ordered[0]?.locator??null,original_record_unchanged:true,all_sources_retained:true,targeted_regression_fixed:expected[id]?true:null});
}
const report={kind:'offline_display_replay_not_new_inference',date:'2026-10-06',cases_checked:30,targeted_regressions_fixed:4,new_api_calls:0,new_cost_sar:0,cases};
await writeFile('artifacts/evidence-display-offline-2026-10-06.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases_checked:30,targeted_regressions_fixed:4,new_api_calls:0,new_cost_sar:0}));
