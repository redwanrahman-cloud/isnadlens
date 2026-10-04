import {evaluationUsage} from './lib/evaluation-usage.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
const path='artifacts/fresh50-first-pass-results-2026-10-04.json';
const raw=await readFile('artifacts/fresh50-question-set-2026-10-04.json','utf8'),data=JSON.parse(raw),freeze=JSON.parse(await readFile('artifacts/fresh50-freeze-2026-10-04.json','utf8'));
const head=()=>execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
async function frozen(){if(hash(raw)!==freeze.dataset_sha256||head()!==freeze.application_commit||await applicationTreeHash()!==freeze.application_tree_sha256||(await readFile('.next/BUILD_ID','utf8')).trim()!==freeze.production_build_id)throw new Error('FREEZE_CHANGED');}
await frozen();
let report={dataset_id:data.dataset_id,freeze,started_at:new Date().toISOString(),protocol:'Untouched first pass. No expected answer, witness, gloss, source URL or reference location is sent to the app. No automatic external retries.',cases:[]};
try{report=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(report.freeze.dataset_sha256!==freeze.dataset_sha256)throw new Error('REPORT_DATASET_MISMATCH');
await mkdir('artifacts/private/fresh50-first-pass',{recursive:true});
const from=Number(process.argv[2]??1),to=Number(process.argv[3]??50);
for(const id of freeze.execution_order.slice(from-1,to)){
 if(report.cases.some(c=>c.id===id)){console.log(JSON.stringify({id,skipped:'immutable first pass already recorded'}));continue;}
 await frozen();
 const item=data.cases.find(c=>c.id===id),started=Date.now();
 const request={claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'};
 let response,record;
 try{response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-fresh50-${id}`},body:JSON.stringify(request),signal:AbortSignal.timeout(90000)});record=await response.json();}
 catch{report.operational_stop={case_id:id,reason:'Transport failed; not retried automatically',at:new Date().toISOString()};await writeFile(path,JSON.stringify(report,null,2)+'\n');break;}
 await writeFile(`artifacts/private/fresh50-first-pass/${id}.json`,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 const {audit_hash,...payload}=record,seal=audit_hash===hash(JSON.stringify(payload));
 const evidence=(record.evidence_items??[]).map(e=>({source_id:e.source_id,source_version:e.version,locator:e.locator,quotation_sha256:e.quotation_sha256,relation:e.semantic_relation,integrity:Boolean(e.integrity?.passed),context:e.source_context?.map(c=>({locator:c.locator,quotation_sha256:c.quotation_sha256,integrity:c.integrity_passed}))??[]}));
 const operational=!response.ok||record.reason_codes?.some(c=>/SPEND|BUDGET|CALL_CAP|CALL_LIMIT|CALLS_LIMIT|CALL_OR_CONCURRENCY_STOP|PROVIDER_UNAVAILABLE|PROVIDER_RATE_LIMIT|PROVIDER_INCOMPLETE/.test(c))||record.entailment_review?.status==='unavailable';
 const expected=item.expected_verdict,agreement=record.verdict===expected;
 const witnessMatched=evidence.some(e=>e.integrity&&e.relation===(item.reference_answer==='yes'?'supports':'contradicts')&&item.reference_witnesses.some(w=>w.locator===(e.source_id.startsWith('QURAN-')?'quran:':'hadith:')+e.locator&&w.source_id===e.source_id&&w.source_version===e.source_version&&w.quotation_sha256===e.quotation_sha256));
 const usage=evaluationUsage(record);
 const result={id,topic:item.topic,claim:item.claim,reviewer_english_gloss:item.reviewer_english_gloss,input_language:item.input_language,detected_language:record.language_intake?.detected_language??record.input_language,language_match:(record.language_intake?.detected_language??record.input_language)===item.input_language,request_sha256:hash(JSON.stringify(request)),evaluation_status:operational?'operationally_blocked':'completed',reference_family:item.reference_family,reference_answer:item.reference_answer,reference_links:item.reference_links,expected_verdict:expected,actual:record.verdict,verdict_agreement:operational?null:agreement,known_witness_relation_matched:witnessMatched,grounded_match:operational?null:agreement&&seal&&record.original_claim===item.claim&&witnessMatched&&evidence.every(e=>e.integrity&&e.context.every(c=>c.integrity)),grounding_review:'pending_developer_full_source_review',http_status:response.status,reason_codes:record.reason_codes,summary:record.summary_en,summary_ar:record.summary_ar,original_preserved:record.original_claim===item.claim,seal_valid:seal,quotation_checks_passed:evidence.length?evidence.every(e=>e.integrity&&e.context.every(c=>c.integrity)):null,evidence,model:record.model,prompt_version:record.prompt_version,router_version:record.router_version,intake_version:record.language_intake?.version,assessment_attempts:record.assessment_attempts?.map(a=>({model:a.model,reason:a.reason})),positive_source_check:record.entailment_review?.status??null,usage,latency_ms:Date.now()-started};
 report.cases.push(result);report.cases.sort((a,b)=>a.id.localeCompare(b.id));
 await writeFile(path,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({id,language:result.detected_language,status:result.evaluation_status,actual:result.actual,agreement:result.verdict_agreement,witness:witnessMatched,latency_ms:result.latency_ms}));
 if(operational){report.operational_stop={case_id:id,reason_codes:record.reason_codes,at:new Date().toISOString()};await writeFile(path,JSON.stringify(report,null,2)+'\n');break;}
}
if(report.cases.length===50){report.completed_at=new Date().toISOString();await writeFile(path,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({recorded:report.cases.length,completed:report.cases.filter(c=>c.evaluation_status==='completed').length,label_matches:report.cases.filter(c=>c.verdict_agreement).length,first_pass_unchanged:true,operational_stop:report.operational_stop??null}));
