import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applicationTreeHash} from './holdout-protocol.mjs';
if(!process.argv.includes('--live'))throw new Error('EXPLICIT_LIVE_FLAG_REQUIRED');
const suffix=process.argv.find(a=>a.startsWith('--round='))?.split('=')[1]??'1';if(!/^\d+$/.test(suffix))throw new Error('ROUND_INVALID');
const original=JSON.parse(await readFile('artifacts/fresh50-first-pass-results-2026-10-04.json','utf8'));
const data=JSON.parse(await readFile('artifacts/fresh50-question-set-2026-10-04.json','utf8'));
const ids=[...original.cases.filter(c=>!c.verdict_agreement).map(c=>c.id),'N01','N27','N41','N50'];
const selected=process.argv.find(a=>a.startsWith('--ids='));const sequence=selected?selected.split('=')[1].split(','):ids;
if(sequence.some(id=>!data.cases.some(c=>c.id===id)))throw new Error('ID_INVALID');
const root=`artifacts/private/fresh50-repairs-round${suffix}`;await mkdir(root,{recursive:true});
const sha=s=>createHash('sha256').update(s).digest('hex');
const tree=await applicationTreeHash(),build=(await readFile('.next/BUILD_ID','utf8')).trim();
const report={kind:'targeted_development_retests_not_fresh_accuracy',round:suffix,application_tree_sha256:tree,build,started_at:new Date().toISOString(),cases:[]};
const destination=`artifacts/fresh50-repairs-round${suffix}-2026-10-04.json`;
await writeFile(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
for(const id of sequence){
 if(await applicationTreeHash()!==tree)throw new Error('APPLICATION_CHANGED_DURING_RETEST');
 const item=data.cases.find(c=>c.id===id),response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-fresh50-repair-${suffix}-${id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(180000)});
 const record=await response.json();await writeFile(`${root}/${id}.json`,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 const {audit_hash,...payload}=record;
 const usage=new Map();function costs(r){for(const u of [r.language_intake?.usage,r.retrieval_plan?.usage,...(r.assessment_attempts??[]).map(a=>a.usage),r.usage,r.entailment_review?.usage,r.retrieval_recovery?.usage])if(u?.reservation_id)usage.set(u.reservation_id,u);if(r.retrieval_recovery?.first_record)costs(r.retrieval_recovery.first_record);}costs(record);
 const row={id,claim:item.claim,expected:item.expected_verdict,actual:record.verdict,label_match:record.verdict===item.expected_verdict,model:record.model,summary:record.summary_en,summary_ar:record.summary_ar,seal_valid:audit_hash===sha(JSON.stringify(payload)),original_preserved:record.original_claim===item.claim,source_family:record.corpus_selection,language:record.language_intake?.detected_language,reason_codes:record.reason_codes,recovery:record.retrieval_recovery?{status:record.retrieval_recovery.status,first_verdict:record.retrieval_recovery.first_record.verdict}:null,locators:record.evidence_items.map(e=>({locator:e.locator,relation:e.semantic_relation,integrity:e.integrity.passed})),usage:[...usage.values()],principal_review:'pending'};
 report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id,actual:row.actual,match:row.label_match,recovery:row.recovery}));
 if(!response.ok||record.reason_codes.some(r=>/BUDGET|SPEND|PROVIDER_UNAVAILABLE|PROVIDER_INCOMPLETE|CALL_OR_CONCURRENCY|CALL_LIMIT/.test(r))||record.entailment_review?.status==='unavailable'){report.operational_stop=id;break;}
}
report.completed_at=new Date().toISOString();await writeFile(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({completed:report.cases.length,label_matches:report.cases.filter(c=>c.label_match).length,operational_stop:report.operational_stop??null}));
