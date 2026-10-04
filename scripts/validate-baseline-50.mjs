import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const dataset=JSON.parse(await readFile('artifacts/common-question-baseline-50-2026-10-04.json','utf8'));
const reportPath='artifacts/common-question-baseline-50-results-2026-10-04.json';
let previous=[];try{previous=JSON.parse(await readFile(reportPath,'utf8')).cases;}catch{}
const from=Number(process.argv[2]??1),to=Number(process.argv[3]??25);
const selectedIds=process.argv[4]?.split(',');
const selected=dataset.cases.filter(item=>Number(item.id.slice(1))>=from&&Number(item.id.slice(1))<=to&&(!selectedIds||selectedIds.includes(item.id)));
const cases=previous.filter(item=>!selected.some(candidate=>candidate.id===item.id));
for(const item of selected){
 const started=Date.now();const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-baseline50-${item.id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:item.corpus_selection})});
 const record=await response.json();await writeFile(`artifacts/private/baseline50-${item.id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;const evidence=record.evidence_items?.map(entry=>({source_id:entry.source_id,locator:entry.locator,relation:entry.semantic_relation,integrity:entry.integrity.passed}))??[];
 const result={id:item.id,topic:item.topic,claim:item.claim,expected:item.expected_verdict,actual:record.verdict,matched:response.status===200&&record.verdict===item.expected_verdict&&(!item.expected_reason||record.reason_codes?.includes(item.expected_reason)),http_status:response.status,reason_codes:record.reason_codes,summary:record.summary_en,original_preserved:record.original_claim===item.claim,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:evidence.every(item=>item.integrity),reviewer_evidence_retrieved:evidence.some(entry=>item.reviewer_locators.includes(entry.source_id.startsWith('QURAN-')?`quran:${entry.locator}`:`hadith:${entry.locator}`)),evidence,detected_language:record.language_intake?.detected_language,model:record.model,model_attempts:record.model_attempts,intake_usage:record.language_intake?.usage,assessment_usage:record.usage,latency_ms:Date.now()-started,review_required:Boolean(item.review_required)};
 Object.assign(result,{created_at:record.created_at,prompt_version:record.prompt_version,schema_version:record.schema_version,router_version:record.router_version,intake_version:record.language_intake?.version,reading_aid:record.retrieval_plan?.reading_aid,assessment_attempts:record.assessment_attempts?.map(attempt=>({model:attempt.model,reason:attempt.reason,usage:attempt.usage})),reference_answer:item.reference_answer,reference_status:item.reference_status,reference_links:item.reference_links,reference_accuracy_eligible:item.reference_accuracy_eligible,reference_answer_matched:item.reference_accuracy_eligible?(record.verdict===(item.reference_answer==='yes'?'supported_within_selected_corpus':'conflicting_within_selected_corpus')):null});
 cases.push(result);cases.sort((a,b)=>a.id.localeCompare(b.id));
 await writeFile(reportPath,JSON.stringify({dataset_id:dataset.dataset_id,purpose:'50 distinct representative questions; development evaluation with provisional primary-source labels, not independent religious approval or search popularity ranking',cases},null,2)+'\n');
 console.log(JSON.stringify({id:item.id,actual:result.actual,matched:result.matched,retrieved_expected:result.reviewer_evidence_retrieved,latency_ms:result.latency_ms}));
 if(record.reason_codes?.some(code=>/SPEND|BUDGET/.test(code))){console.log('Authorized budget stop: remaining cases not executed.');break;}
}
if(cases.some(item=>(item.reference_accuracy_eligible?!item.reference_answer_matched:!item.matched)||!item.original_preserved||!item.seal_valid||!item.evidence_integrity))process.exitCode=1;
