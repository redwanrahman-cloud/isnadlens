import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const offline=JSON.parse(await readFile('artifacts/offline-final-gap-repair-2026-10-04.json','utf8'));
if(offline.failures.length||offline.new_api_calls!==0||!offline.budget_unchanged)throw new Error('OFFLINE_GATE_FAILED');
const data=JSON.parse(await readFile('artifacts/web50-question-set-2026-10-04.json','utf8'));
const freeze={application_tree_sha256:await applicationTreeHash(),dataset_sha256:hash(JSON.stringify(data)),build:(await readFile('.next/BUILD_ID','utf8')).trim(),development_cap_sar:33};
const ledger=JSON.parse(await readFile('artifacts/private/api-spend.json','utf8'));
const cost=entries=>entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75;
const report={kind:'known_fifty_post_repair_regression_not_new_holdout',freeze,started_at:new Date().toISOString(),starting_development_sar:cost(ledger.entries),cases:[]};
const destination='artifacts/final50-post-repair-2026-10-04.json',root='artifacts/private/final50-post-repair';
await mkdir(root,{recursive:true});await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});
const priority=['T04','T38','T34','T46'];
const ordered=[...priority.map(id=>data.cases.find(c=>c.id===id)),...data.cases.filter(c=>!priority.includes(c.id))];
for(const item of ordered){
 if(await applicationTreeHash()!==freeze.application_tree_sha256||(await readFile('.next/BUILD_ID','utf8')).trim()!==freeze.build)throw new Error('APPLICATION_CHANGED');
 try{
  const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`final50-${item.id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
  const r=await response.json();await writeFile(`${root}/${item.id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
  const {audit_hash,...payload}=r;
  const row={id:item.id,claim:item.claim,expected:item.expected_verdict,actual:r.verdict,label_match:r.verdict===item.expected_verdict,reason_codes:r.reason_codes,summary:r.summary_en,summary_ar:r.summary_ar,seal_valid:audit_hash===hash(JSON.stringify(payload)),original_preserved:r.original_claim===item.claim,detected_language:r.language_intake?.detected_language??null,evidence_locators:r.evidence_items?.map(e=>e.locator),web_discovery:r.web_discovery?{status:r.web_discovery.status,reason:r.web_discovery.reason,search_calls:r.web_discovery.search_calls,verification_attempted:r.web_discovery.verification_attempted}:null,usage:evaluationUsage(r),review:'pending'};
  report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({id:row.id,actual:row.actual,match:row.label_match,reasons:row.reason_codes}));
  if(!response.ok||row.reason_codes.some(c=>/BUDGET|SPEND|PROVIDER_UNAVAILABLE|PROVIDER_INCOMPLETE/.test(c))||r.entailment_review?.status==='unavailable'||r.web_discovery?.status==='unavailable'){report.operational_stop=item.id;break;}
 }catch(e){report.operational_stop=item.id;report.transport_failure=e.message;break;}
}
report.completed_at=new Date().toISOString();report.final_development_sar=cost(JSON.parse(await readFile('artifacts/private/api-spend.json','utf8')).entries);
await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({completed:report.cases.length,label_matches:report.cases.filter(c=>c.label_match).length,operational_stop:report.operational_stop??null,development_sar:report.final_development_sar}));
