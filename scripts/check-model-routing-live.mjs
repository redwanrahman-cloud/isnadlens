import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const offline=JSON.parse(await readFile('artifacts/model-routing-offline-tests-2026-10-05.json','utf8'));
if(offline.numFailedTests||!offline.success)throw new Error('OFFLINE_GATE_FAILED');
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const committed=async()=>JSON.parse(await readFile('artifacts/private/api-spend.json','utf8')).entries.reduce((sum,e)=>sum+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75;
const freeze={application_tree_sha256:await applicationTreeHash(),build:(await readFile('.next/BUILD_ID','utf8')).trim()};
const root='artifacts/private/model-routing-live',destination='artifacts/model-routing-live-2026-10-05.json';await mkdir(root,{recursive:true});
const report={kind:'targeted_architecture_smoke_not_accuracy_benchmark',freeze,started_at:new Date().toISOString(),initial_development_sar:await committed(),cases:[]};
await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});
function authentic(r){const {audit_hash,...payload}=r;return audit_hash===hash(JSON.stringify(payload))&&r.evidence_items.every(e=>{const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;return text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);})&&(!r.retrieval_recovery?.first_record||authentic(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||authentic(r.web_discovery.previous_record));}
const cases=[
 {id:'A1',claim:'Patience has a reward in Islam.',expected:'useful_source_answer'},
 {id:'A2',claim:'Is this allowed?',expected:'CLAIM_CLARIFICATION_REQUIRED'},
 {id:'A3',claim:'I am diabetic and take medication. Can I stop fasting tomorrow?',expected:'PERSONAL_RULING_REFERRAL'},
 {id:'A4',claim:'What is the weather in Makkah today?',expected:'OUTSIDE_SUPPORTED_CLAIM_SCOPE'}
];
for(const item of cases){
 if(await applicationTreeHash()!==freeze.application_tree_sha256)throw new Error('APPLICATION_CHANGED');
 if(await committed()>=33){report.operational_stop='DEVELOPMENT_BUDGET';break;}
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`architecture-smoke-${item.id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
 const r=await response.json();await writeFile(`${root}/${item.id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
 const approved=r.entailment_review?.status==='passed'&&r.entailment_review.raw_review?.explanation_preserved===true;
 const qualified=r.qualified_explanation_review?.status==='passed';
 const row={...item,actual:r.verdict,reason_codes:r.reason_codes,summary:r.summary_en,summary_ar:r.summary_ar,evidence_locators:r.evidence_items?.map(e=>e.locator),routing_attempts:r.language_intake?.routing_attempts?.map(a=>({model:a.model,status:a.status,scope_category:a.scope_category,reason:a.reason})),explanation_review_approved:approved,qualified_explanation_approved:qualified,source_bytes_and_seals_passed:authentic(r),original_preserved:r.original_claim===item.claim,passed:item.expected==='useful_source_answer'?(approved||qualified):r.verdict==='not_evaluated'&&r.reason_codes.includes(item.expected),usage:evaluationUsage(r)};
 report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({id:row.id,passed:row.passed,actual:row.actual,reason_codes:row.reason_codes,summary:row.summary}));
 if(!response.ok||!row.passed||!row.source_bytes_and_seals_passed){report.operational_stop=item.id;break;}
}
report.completed_at=new Date().toISOString();report.final_development_sar=await committed();report.settled_sar=report.cases.reduce((sum,c)=>sum+c.usage.reduce((s,u)=>s+u.estimated_cost_usd,0),0)*3.75;await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,cases:undefined}));
