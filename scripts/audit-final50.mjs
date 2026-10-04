import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url);
const q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus();
const h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const run=JSON.parse(await readFile('artifacts/final50-post-repair-2026-10-04.json','utf8'));
if(!run.completed_at)throw new Error('RUN_NOT_COMPLETE');
function audit(r){
 const {audit_hash,...payload}=r;if(audit_hash!==hash(JSON.stringify(payload)))return false;
 return r.evidence_items.every(e=>{
  const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;
  return typeof text==='string'&&text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);
 })&&(!r.retrieval_recovery?.first_record||audit(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||audit(r.web_discovery.previous_record));
}
const rows=[];
for(const row of run.cases){
 const r=JSON.parse(await readFile(`artifacts/private/final50-post-repair/${row.id}.json`,'utf8'));
 rows.push({id:row.id,expected:row.expected,actual:row.actual,label_match:row.label_match,source_bytes_and_nested_seals_passed:audit(r),original_preserved:row.original_preserved,reason_codes:row.reason_codes});
}
const result={kind:'final_known_case_regression_mechanical_audit_not_scholarly_certification',total:rows.length,answer_label_matches:rows.filter(c=>c.label_match).length,wrong_decisive_answer_labels:rows.filter(c=>!c.label_match&&['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(c.actual)).length,abstentions:rows.filter(c=>['not_evaluated','insufficient_within_selected_corpus'].includes(c.actual)).length,source_and_seal_checks_passed:rows.filter(c=>c.source_bytes_and_nested_seals_passed).length,run_settled_sar:run.cases.reduce((n,c)=>n+c.usage.reduce((s,u)=>s+u.estimated_cost_usd,0),0)*3.75,development_sar:run.final_development_sar,development_cap_sar:33,cases:rows};
await writeFile('artifacts/final50-mechanical-audit-2026-10-04.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,cases:undefined}));
if(rows.some(r=>!r.source_bytes_and_nested_seals_passed||!r.original_preserved))process.exitCode=1;
