import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw new Error('EXPLICIT_LIVE_FLAG_REQUIRED');
const data=JSON.parse(await readFile('artifacts/web50-question-set-2026-10-04.json','utf8')),freeze=JSON.parse(await readFile('artifacts/web50-freeze-2026-10-04.json','utf8'));
if(hash(JSON.stringify(data))!==freeze.dataset_sha256)throw new Error('DATASET_CHANGED');
const root='artifacts/private/web50-first-pass';await mkdir(root,{recursive:true});
const destination='artifacts/web50-first-pass-2026-10-04.json';
const report={kind:'untouched_fresh50_live_first_pass',freeze,started_at:new Date().toISOString(),cases:[]};await writeFile(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
for(const item of data.cases){
 if(await applicationTreeHash()!==freeze.application_tree_sha256||(await readFile('.next/BUILD_ID','utf8')).trim()!==freeze.build)throw new Error('APPLICATION_CHANGED');
 try{
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-web50-${item.id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
 const r=await response.json();await writeFile(`${root}/${item.id}.json`,JSON.stringify(r,null,2)+'\n',{flag:'wx'});
 const {audit_hash,...payload}=r;
 const row={id:item.id,claim:item.claim,expected:item.expected_verdict,actual:r.verdict,label_match:r.verdict===item.expected_verdict,summary:r.summary_en,summary_ar:r.summary_ar,seal_valid:audit_hash===hash(JSON.stringify(payload)),original_preserved:r.original_claim===item.claim,reason_codes:r.reason_codes,web_discovery:r.web_discovery?{status:r.web_discovery.status,reason:r.web_discovery.reason,search_calls:r.web_discovery.search_calls,verification_attempted:r.web_discovery.verification_attempted,pages:r.web_discovery.pages}:null,usage:evaluationUsage(r),review:'pending'};
 report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id:row.id,actual:row.actual,match:row.label_match,web:row.web_discovery?.reason??null}));
 if(!response.ok||row.reason_codes.some(c=>/BUDGET|SPEND|PROVIDER_UNAVAILABLE|PROVIDER_INCOMPLETE/.test(c))||r.entailment_review?.status==='unavailable'||r.web_discovery?.status==='unavailable'){report.operational_stop=item.id;break;}
 }catch(e){report.operational_stop=item.id;report.transport_failure=e.message;break;}
}
report.completed_at=new Date().toISOString();await writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({completed:report.cases.length,label_matches:report.cases.filter(c=>c.label_match).length,operational_stop:report.operational_stop??null}));

