import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {hash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const data=JSON.parse(await readFile('artifacts/web50-question-set-2026-10-04.json','utf8'));
const ids=['T01','T04','T34','T38','T46','T49'];
const root='artifacts/private/scope-repair';await mkdir(root,{recursive:true});
const report={kind:'targeted_known_case_replay_not_new_holdout',started_at:new Date().toISOString(),cases:[]};
for(const id of ids){
 const item=data.cases.find(r=>r.id===id);
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`scope-repair-${id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
 const r=await response.json();await writeFile(`${root}/${id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
 const {audit_hash,...payload}=r;
 const row={id,claim:item.claim,expected:item.expected_verdict,actual:r.verdict,reason_codes:r.reason_codes,summary:r.summary_en,evidence:r.evidence_items?.map(e=>({locator:e.locator,integrity:e.integrity.passed})),seal_valid:audit_hash===hash(JSON.stringify(payload)),usage:evaluationUsage(r)};
 report.cases.push(row);await writeFile('artifacts/scope-repair-live-2026-10-04.json',JSON.stringify(report,null,2));console.log(JSON.stringify({id,actual:row.actual,reasons:row.reason_codes}));
 if(!response.ok||row.reason_codes.some(c=>/BUDGET|SPEND|PROVIDER/.test(c)))break;
}
report.completed_at=new Date().toISOString();await writeFile('artifacts/scope-repair-live-2026-10-04.json',JSON.stringify(report,null,2));
