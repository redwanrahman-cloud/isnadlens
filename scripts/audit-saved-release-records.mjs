import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

// Read-only historical audit. Never imports provider code or loads credentials.
globalThis.fetch=async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');};
const captures=process.argv.find(a=>a.startsWith('--captures='))?.slice(11);
if(!captures)throw new Error('Pass --captures=<existing private capture directory>');
const output=process.argv.find(a=>a.startsWith('--report='))?.slice(9);
if(!output)throw new Error('Pass --report=<new report path>; historical scores are never overwritten');
const hash=s=>createHash('sha256').update(s).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const q=await json('data/corpus.json'),h=await json('data/hadeethenc.json');
const qTexts=new Map(q.verses.map(v=>[v.id,v.display]));
const hTexts=new Map(h.records.map(v=>[`${v.language}:${v.id}`,v.fields.hadith_text]));
function intact(r){
 const {audit_hash,...payload}=r;
 return audit_hash===hash(JSON.stringify(payload))&&r.evidence_items.every(e=>{
  const text=(e.source_id.startsWith('QURAN-')?qTexts:hTexts).get(e.locator);
  return typeof text==='string'&&text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>qTexts.get(c.locator)===c.quotation&&hash(c.quotation)===c.quotation_sha256);
 })&&(!r.retrieval_recovery?.first_record||intact(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||intact(r.web_discovery.previous_record));
}
const rows=[],inputs=[];
for(const [suffix,date] of [['','2026-10-04'],['-round2','2026-10-05'],['-round3','2026-10-05'],['-round4','2026-10-05'],['-round5','2026-10-05']]){
 const path=`artifacts/release30${suffix}-first-pass-${date}.json`;
 const bytes=await readFile(path);inputs.push({path,sha256:hash(bytes)});
 const run=JSON.parse(bytes);
 for(const item of run.cases){
  const r=await json(join(captures,`release30${suffix}-first-pass`,`${item.id}.json`));
  rows.push({id:item.id,verdict:r.verdict,reason_codes:r.reason_codes,source_and_nested_seals_passed:intact(r),published_verdict_matches:item.actual===r.verdict,review_attempts:r.source_review_attempts?.length??0,recorded_diagnostics:(r.source_review_attempts??[]).map(a=>a.review?.explanation_diagnostic??null)});
 }
}
const report={kind:'saved_release_record_integrity_audit_not_new_model_accuracy',created_at:new Date().toISOString(),total:rows.length,passed:rows.filter(r=>r.source_and_nested_seals_passed&&r.published_verdict_matches).length,new_api_calls:0,historical_inputs:inputs,cases:rows};
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:report.total,passed:report.passed,new_api_calls:0}));
if(report.passed!==report.total)process.exitCode=1;
