import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url);
const q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus();
const h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const run=JSON.parse(await readFile('artifacts/web50-first-pass-2026-10-04.json','utf8'));
const questions=JSON.parse(await readFile('artifacts/web50-question-set-2026-10-04.json','utf8'));
const reviews=JSON.parse(await readFile('artifacts/web50-principal-review-2026-10-04.json','utf8'));
if(!run.completed_at||run.cases.length!==50)throw new Error('FIRST_PASS_NOT_COMPLETE');
if(reviews.cases.length!==50||new Set(reviews.cases.map(c=>c.id)).size!==50)throw new Error('REVIEW_INCOMPLETE');
function audit(r){
 const {audit_hash,...payload}=r;
 if(audit_hash!==hash(JSON.stringify(payload)))return false;
 return r.evidence_items.every(e=>{
  const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;
  return typeof text==='string'&&text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);
 })&&(!r.retrieval_recovery?.first_record||audit(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||audit(r.web_discovery.previous_record));
}
const cases=[];
for(const row of run.cases){
 const r=JSON.parse(await readFile(`artifacts/private/web50-first-pass/${row.id}.json`,'utf8'));
 const review=reviews.cases.find(c=>c.id===row.id);
 if(!review||typeof review.full_reasoning_grounded!=='boolean')throw new Error(`REVIEW_MISSING:${row.id}`);
 const expectedLanguage=questions.cases.find(c=>c.id===row.id).language;
 cases.push({id:row.id,label_match:row.label_match,actual:row.actual,reasons:row.reason_codes,source_bytes_and_nested_seals_passed:audit(r),original_preserved:r.original_claim===row.claim,detected_language:r.language_intake?.detected_language??null,expected_language:expectedLanguage,language_match:r.language_intake?.detected_language===expectedLanguage,web_used:Boolean(row.web_discovery?.search_calls),web_search_calls:row.web_discovery?.search_calls??0,...review});
}
const ledger=JSON.parse(await readFile('artifacts/private/api-spend.json','utf8'));
const groups={};for(const c of cases)if(!c.full_reasoning_grounded){groups[c.issue_family]=(groups[c.issue_family]??0)+1;}
const result={kind:'untouched_fresh50_principal_source_review_not_independent_certification',total:50,counts:questions.counts,answer_label_matches:cases.filter(c=>c.label_match).length,fully_source_grounded:cases.filter(c=>c.full_reasoning_grounded).length,wrong_decisive_answer_labels:cases.filter(c=>!c.label_match&&['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(c.actual)).length,abstentions:cases.filter(c=>['not_evaluated','insufficient_within_selected_corpus'].includes(c.actual)).length,source_and_seal_checks_passed:cases.filter(c=>c.source_bytes_and_nested_seals_passed).length,web_cases:cases.filter(c=>c.web_used).length,search_calls:cases.reduce((n,c)=>n+c.web_search_calls,0),first_pass_settled_sar:run.cases.reduce((n,c)=>n+c.usage.reduce((s,u)=>s+u.estimated_cost_usd,0),0)*3.75,conservative_total_development_sar:ledger.entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75,development_cap_sar:28,issue_families:groups,cases,limits:['Not a measured most-asked ranking; no independent scholarly or native-language certification.','First-pass results are preserved. Any repairs or targeted replays must be reported separately.','Fresh questions can share a category, source or distinct facet with earlier cases.','An abstention is a usefulness failure in this source-answerable set; it is not a decisive false religious answer.']};
await writeFile('artifacts/web50-reviewed-summary-2026-10-04.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,cases:undefined}));
