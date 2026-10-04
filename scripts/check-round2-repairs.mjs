import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const offline=JSON.parse(await readFile('artifacts/offline-round2-repair-final-2026-10-05.json','utf8'));
if(offline.failures.length||!offline.budget_unchanged||offline.new_api_calls)throw new Error('OFFLINE_GATE_FAILED');
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const data=JSON.parse(await readFile('artifacts/release30-round2-question-set-2026-10-05.json','utf8'));
const original=JSON.parse(await readFile('artifacts/release30-round2-first-pass-2026-10-05.json','utf8'));
const firstPassHash=hash(JSON.stringify(original));
const freeze={application_tree_sha256:await applicationTreeHash(),build:(await readFile('.next/BUILD_ID','utf8')).trim(),original_first_pass_sha256:firstPassHash};
const cost=entries=>entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75;
const report={kind:'known_failure_repair_checks_not_new_holdout',freeze,cases:[],started_at:new Date().toISOString()};
const root='artifacts/private/round2-repair-checks',destination='artifacts/round2-repair-checks-2026-10-05.json';
await mkdir(root,{recursive:true});await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});
function authentic(r){const {audit_hash,...payload}=r;return audit_hash===hash(JSON.stringify(payload))&&r.evidence_items.every(e=>{
 const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;
 return text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);
})&&(!r.retrieval_recovery?.first_record||authentic(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||authentic(r.web_discovery.previous_record));}
// R21 is a withholding control: the source establishes the trait but does not
// by itself establish every added inference concerning judgments of individuals.
for(const id of ['V01','V13','V26','V27','V07','V29']){
 if(await applicationTreeHash()!==freeze.application_tree_sha256)throw new Error('APPLICATION_CHANGED');
 const item=data.cases.find(c=>c.id===id);
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`repair-round2-${id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:'auto'}),signal:AbortSignal.timeout(240000)});
 const r=await response.json();await writeFile(`${root}/${id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
 const expected=id==='V13'?'insufficient_within_selected_corpus':item.expected_verdict;
 const row={id,claim:item.claim,original_benchmark_expected:item.expected_verdict,repair_check_expected:expected,actual:r.verdict,label_match:r.verdict===expected,summary:r.summary_en,summary_ar:r.summary_ar,source_bytes_and_nested_seals_passed:authentic(r),original_preserved:r.original_claim===item.claim,qualified_explanation_status:r.qualified_explanation_review?.status??null,reason_codes:r.reason_codes,evidence_locators:r.evidence_items.map(e=>e.locator),usage:evaluationUsage(r),manual_explanation_review:'pending'};
 report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({id,actual:row.actual,match:row.label_match,summary:row.summary}));
 if(!response.ok||r.entailment_review?.status==='unavailable'||row.reason_codes.some(c=>/BUDGET|SPEND|PROVIDER_UNAVAILABLE/.test(c))){report.operational_stop=id;break;}
}
report.completed_at=new Date().toISOString();report.final_development_sar=cost(JSON.parse(await readFile('artifacts/private/api-spend.json','utf8')).entries);
report.original_first_pass_unchanged=firstPassHash===hash(await readFile('artifacts/release30-round2-first-pass-2026-10-05.json','utf8').then(JSON.parse).then(JSON.stringify));
report.settled_sar=report.cases.reduce((n,c)=>n+c.usage.reduce((a,u)=>a+u.estimated_cost_usd,0),0)*3.75;
await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,cases:undefined}));

