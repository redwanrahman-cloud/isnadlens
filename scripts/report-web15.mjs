import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const run=JSON.parse(await readFile('artifacts/web15-first-pass-2026-10-04.json','utf8'));
const cases=[];
function audit(r){
 const {audit_hash,...payload}=r;if(audit_hash!==hash(JSON.stringify(payload)))return false;
 const ok=r.evidence_items.every(e=>{
 const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;
 return text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);
 });
 return ok&&(!r.retrieval_recovery?.first_record||audit(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||audit(r.web_discovery.previous_record));
}
for(const row of run.cases){const r=JSON.parse(await readFile(`artifacts/private/web15-first-pass/${row.id}.json`,'utf8'));cases.push({id:row.id,label_match:row.label_match,source_bytes_and_nested_seals_passed:audit(r),principal_source_review:row.id==='W06'?'correct_answer_label_but_internal_proposition_reversed':'supported_by_direct_original_source_with_context',full_reasoning_grounded:row.label_match&&row.id!=='W06'});}
const l=JSON.parse(await readFile('artifacts/private/api-spend.json','utf8'));
const result={kind:'fresh15_first_pass_principal_review_not_independent_certification',cases,total:cases.length,answer_label_matches:cases.filter(c=>c.label_match).length,full_reasoning_grounded:cases.filter(c=>c.full_reasoning_grounded).length,wrong_decisive_answer_labels:run.cases.filter(c=>!c.label_match&&['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(c.actual)).length,abstentions:run.cases.filter(c=>['not_evaluated','insufficient_within_selected_corpus'].includes(c.actual)).length,web_used_in_fresh15:run.cases.filter(c=>c.web_discovery).length,first_pass_settled_sar:run.cases.reduce((s,c)=>s+c.usage.reduce((n,u)=>n+u.estimated_cost_usd,0),0)*3.75,conservative_total_development_sar:l.entries.reduce((s,e)=>s+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75,development_cap_sar:18,limits:['15 cases across six languages; 14 Quran questions and one Hadith question. Not comprehensive coverage.','W11 overlaps an earlier private-charity topic but tests a new public-charity proposition.','The fresh15 answered locally; separate direct probes test web discovery.','W06 first pass remains frozen. A targeted stronger decision check rejects the malformed atom; not a rerun of the complete 15 on the final build.','No measured most-asked ranking, independent scholarly review or perfect-answer claim.']};
await writeFile('artifacts/web15-reviewed-summary-2026-10-04.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
