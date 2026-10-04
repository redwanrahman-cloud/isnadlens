import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applicationTreeHash} from './holdout-protocol.mjs';
const dataset=JSON.parse(await readFile('artifacts/holdout-question-set-50-2026-10-04.json','utf8'));
const baseline=JSON.parse(await readFile('artifacts/common-question-baseline-50-2026-10-04.json','utf8'));
const finalRound=process.argv[2]==='final';
const schemaRound=process.argv[2]==='schema';
const unitRound=process.argv[2]==='units';
const summaryRound=process.argv[2]==='summary';
const ids=summaryRound?['B46']:unitRound?['B46']:schemaRound?['B46']:finalRound?['H37','B46']:['H12','H14','H15','H36','H37','H42','B46','B19'];
const suffix=summaryRound?'summary-repair':unitRound?'unit-repair':schemaRound?'schema-repair':finalRound?'final-repair':'repair';
const publicPath=summaryRound?'artifacts/holdout50-summary-targeted-checks-2026-10-04.json':unitRound?'artifacts/holdout50-unit-targeted-checks-2026-10-04.json':schemaRound?'artifacts/holdout50-schema-targeted-checks-2026-10-04.json':finalRound?'artifacts/holdout50-final-targeted-checks-2026-10-04.json':'artifacts/holdout50-targeted-repair-checks-2026-10-04.json';
const report={purpose:'Targeted post-repair checks. Separate from immutable new50 first-pass results; not a fresh benchmark.',application_tree_sha256:await applicationTreeHash(),cases:[]};
for(const id of ids){
 const item=[...dataset.cases,...baseline.cases].find(row=>row.id===id),started=Date.now();
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-holdout-repairs-${id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:item.corpus_selection}),signal:AbortSignal.timeout(90000)});
 const record=await response.json();await writeFile(`artifacts/private/holdout50-${suffix}-${id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record,expected=item.reference_answer==='yes'?'supported_within_selected_corpus':'conflicting_within_selected_corpus';
 const result={id,claim:item.claim,actual:record.verdict,expected,verdict_agreement:record.verdict===expected,http_status:response.status,original_preserved:record.original_claim===item.claim,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:record.evidence_items?.length?record.evidence_items.every(entry=>entry.integrity.passed):null,evidence:record.evidence_items?.map(entry=>({source_id:entry.source_id,locator:entry.locator,relation:entry.semantic_relation,quotation_sha256:entry.quotation_sha256})),summary:record.summary_en,reason_codes:record.reason_codes,entailment_status:record.entailment_review?.status,entailment_version:record.entailment_review?.version,prompt_version:record.prompt_version,router_version:record.router_version,usage:[record.language_intake?.usage,record.retrieval_plan?.usage,...(record.assessment_attempts??[]).map(entry=>entry.usage),record.usage,record.entailment_review?.usage].filter(Boolean),latency_ms:Date.now()-started};
 report.cases.push(result);await writeFile(publicPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id,actual:result.actual,agreement:result.verdict_agreement,entailment:result.entailment_status,reasons:result.reason_codes}));
 if(record.reason_codes?.some(code=>/SPEND|BUDGET/.test(code)||record.entailment_review?.reason?.includes('BUDGET'))){console.log('Authorized budget stop; unexecuted repairs remain open.');break;}
}
if(report.cases.some(row=>!row.verdict_agreement||!row.original_preserved||!row.seal_valid||row.evidence_integrity===false))process.exitCode=1;
