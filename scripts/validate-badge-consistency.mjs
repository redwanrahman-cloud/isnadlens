import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw Error('LIVE_FLAG_REQUIRED');
const afterRetrieval=process.argv.includes('--after-retrieval');
const offline=JSON.parse(await readFile(afterRetrieval?'artifacts/badge-consistency-with-retrieval-offline-2026-10-05.json':'artifacts/badge-consistency-offline-confirmed-2026-10-05.json','utf8'));
if(!offline.success||offline.numFailedTests!==0||offline.numPassedTests<(afterRetrieval?392:389))throw Error('OFFLINE_GATE_FAILED');
const questions=[
 {id:'B01',claim:'Selon le hadith, une noble lignée suffit-elle à faire avancer celui que ses actes ont retardé?',expected:'conflicting_within_selected_corpus'},
 {id:'B02',claim:'Selon le hadith, une noble lignée ne fait pas avancer celui que ses actes ont retardé.',expected:'supported_within_selected_corpus'}
];
const cost=()=>readFile('artifacts/private/api-spend.json','utf8').then(s=>JSON.parse(s).entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75);
const report={kind:'targeted_badge_repair_and_opposite_polarity_control_not_fresh_benchmark',created_at:new Date().toISOString(),freeze:{app:await applicationTreeHash(),build:(await readFile('.next/BUILD_ID','utf8')).trim()},starting_development_sar:await cost(),development_cap_sar:44,cases:[]};
const suffix=afterRetrieval?'-after-retrieval':'';
const root=`artifacts/private/badge-consistency-live${suffix}`,path=`artifacts/badge-consistency-live${suffix}-2026-10-05.json`;await mkdir(root,{recursive:true});await writeFile(path,JSON.stringify(report,null,2),{flag:'wx'});
for(const q of questions){
 if(await applicationTreeHash()!==report.freeze.app)throw Error('APPLICATION_CHANGED');
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`badge-${q.id}`},body:JSON.stringify({claim:q.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
 const r=await response.json();await writeFile(`${root}/${q.id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
 const {audit_hash,...payload}=r;
 report.cases.push({...q,actual:r.verdict,label_match:r.verdict===q.expected,summary:r.summary_en,summary_ar:r.summary_ar,reason_codes:r.reason_codes,detected_language:r.language_intake?.detected_language,original_preserved:r.original_claim===q.claim,seal_valid:audit_hash===hash(JSON.stringify(payload)),locators:r.evidence_items.map(e=>e.locator),assessment_attempt_reasons:r.assessment_attempts?.map(a=>a.reason),source_review:r.entailment_review?.raw_review,review_version:r.entailment_review?.version,usage:evaluationUsage(r)});
 await writeFile(path,JSON.stringify(report,null,2));console.log(JSON.stringify(report.cases.at(-1)));
 if(!response.ok||r.reason_codes.some(c=>/BUDGET|PROVIDER_UNAVAILABLE|PROVIDER_INCOMPLETE/.test(c))){report.operational_stop=q.id;break;}
}
report.completed_at=new Date().toISOString();report.final_development_sar=await cost();report.run_sar=report.final_development_sar-report.starting_development_sar;await writeFile(path,JSON.stringify(report,null,2));console.log(JSON.stringify({completed:report.cases.length,matching:report.cases.filter(c=>c.label_match).length,cost_sar:report.run_sar,development_sar:report.final_development_sar}));
