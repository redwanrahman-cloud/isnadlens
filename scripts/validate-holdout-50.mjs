import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {applicationTreeHash} from './holdout-protocol.mjs';
const datasetPath='artifacts/holdout-question-set-50-2026-10-04.json';
const freezePath='artifacts/holdout50-freeze-2026-10-04.json';
const resultsPath='artifacts/holdout50-first-pass-results-2026-10-04.json';
const hash=text=>createHash('sha256').update(text).digest('hex');
const raw=await readFile(datasetPath,'utf8'),dataset=JSON.parse(raw);
const freeze=JSON.parse(await readFile(freezePath,'utf8'));
const currentHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(hash(raw)!==freeze.dataset_sha256||currentHead!==freeze.application_commit)throw new Error('Frozen dataset or application commit changed');
if(await applicationTreeHash()!==freeze.application_tree_sha256||(await readFile('.next/BUILD_ID','utf8')).trim()!==freeze.production_build_id)throw new Error('Frozen application files or production build changed');
if(dataset.cases.length!==50||new Set(dataset.cases.map(row=>row.id)).size!==50)throw new Error('Exactly fifty unique cases required');
let report={dataset_id:dataset.dataset_id,freeze,started_at:new Date().toISOString(),protocol:'Immutable first pass. No expected answer, reference, witness or rationale is sent to the app. No automatic retries.',cases:[]};
try{report=JSON.parse(await readFile(resultsPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
if(report.freeze.dataset_sha256!==freeze.dataset_sha256)throw new Error('Report belongs to another dataset');
const from=Number(process.argv[2]??1),to=Number(process.argv[3]??25);
const selected=freeze.execution_order.slice(from-1,to).map(id=>dataset.cases.find(item=>item.id===id));
await mkdir('artifacts/private/holdout50-first-pass',{recursive:true});
for(const item of selected){
 if(report.cases.some(row=>row.id===item.id)){console.log(`${item.id}: first-pass result already saved; skipped`);continue;}
 const started=Date.now();
 const request={claim:item.claim,inputLanguage:'auto',corpusSelection:item.corpus_selection};
 let response,record;
 try{response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-holdout50-${item.id}`},body:JSON.stringify(request),signal:AbortSignal.timeout(90000)});record=await response.json();}
 catch{report.operational_stop={case_id:item.id,reason:'Transport failure; not retried automatically',at:new Date().toISOString()};await writeFile(resultsPath,JSON.stringify(report,null,2)+'\n');break;}
 await writeFile(`artifacts/private/holdout50-first-pass/${item.id}.json`,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 const {audit_hash,...payload}=record;
 const operational=record.reason_codes?.some(code=>/SPEND|BUDGET|CALL_CAP|CALL_LIMIT|CALLS_LIMIT|CALL_OR_CONCURRENCY_STOP|PROVIDER_UNAVAILABLE|PROVIDER_RATE_LIMIT/.test(code));
 const evidence=(record.evidence_items??[]).map(entry=>({source_id:entry.source_id,source_version:entry.version,locator:entry.locator,quotation_sha256:entry.quotation_sha256,relation:entry.semantic_relation,integrity:Boolean(entry.integrity?.passed)}));
 const original=record.original_claim===item.claim,seal=audit_hash===hash(JSON.stringify(payload));
 const quotationChecks=evidence.length?evidence.every(entry=>entry.integrity):null;
 const relation=item.reference_answer==='yes'?'supports':'contradicts';
 const witnessMatched=evidence.some(entry=>(item.reference_witnesses??[]).some(witness=>witness.locator===(entry.source_id.startsWith('QURAN-')?'quran:':'hadith:')+entry.locator&&witness.source_id===entry.source_id&&witness.source_version===entry.source_version&&witness.quotation_sha256===entry.quotation_sha256)&&entry.relation===relation&&entry.integrity);
 const expected=item.reference_answer==='yes'?'supported_within_selected_corpus':'conflicting_within_selected_corpus';
 const agreement=!operational&&response.ok&&record.verdict===expected;
 const integrity=original&&seal&&quotationChecks!==false;
 const result={id:item.id,topic:item.topic,claim:item.claim,request_sha256:hash(JSON.stringify(request)),evaluation_status:operational?'operationally_blocked':'completed',reference_answer:item.reference_answer,reference_links:item.reference_links,expected_verdict:expected,actual:record.verdict,verdict_agreement:operational?null:agreement,known_witness_relation_matched:witnessMatched,grounded_match:operational?null:agreement&&integrity&&witnessMatched,grounding_review:agreement&&!witnessMatched?'alternative_evidence_requires_source_review':witnessMatched?'reference_witness_matched':'not_matched',http_status:response.status,reason_codes:record.reason_codes,summary:record.summary_en,original_preserved:original,seal_valid:seal,quotation_checks_passed:quotationChecks,evidence,created_at:record.created_at,latency_ms:Date.now()-started,model:record.model,prompt_version:record.prompt_version,schema_version:record.schema_version,router_version:record.router_version,intake_version:record.language_intake?.version,reading_aid:record.retrieval_plan?.reading_aid,usage:[record.language_intake?.usage,record.retrieval_plan?.usage,...(record.assessment_attempts??[]).map(entry=>entry.usage),record.usage].filter(Boolean)};
 report.cases.push(result);report.cases.sort((a,b)=>a.id.localeCompare(b.id));
 await writeFile(resultsPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({id:item.id,status:result.evaluation_status,actual:result.actual,agreement:result.verdict_agreement,witness:witnessMatched,latency_ms:result.latency_ms}));
 if(operational){report.operational_stop={case_id:item.id,reason_codes:record.reason_codes,at:new Date().toISOString()};await writeFile(resultsPath,JSON.stringify(report,null,2)+'\n');break;}
}
if(report.cases.some(row=>row.evaluation_status!=='completed'||!row.verdict_agreement||!row.original_preserved||!row.seal_valid||row.quotation_checks_passed===false))process.exitCode=1;
