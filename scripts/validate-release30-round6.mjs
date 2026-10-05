import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';

// Preflight is the default and makes no network requests. --live is deliberately separate.
const live=process.argv.includes('--live');
const keyPath='artifacts/release30-round6-question-set-2026-10-06.json';
const destination='artifacts/release30-round6-first-pass-2026-10-06.json';
const rawRoot='artifacts/private/release30-round6-first-pass';
const minimumHeadroomSar=6;
const readJson=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const envBytes=await readFile('.env.local');
const env=Object.fromEntries(envBytes.toString('utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>/^\w+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim().replace(/^(['"])(.*)\1$/,'$2')];}));
const ledgerPath=join(resolve(env.ISNADLENS_PRIVATE_DIR??'artifacts/private'),'api-spend.json');
const spend=async()=>{
 const l=await readJson(ledgerPath);
 return l.entries.reduce((sum,e)=>{
  const n=e.status==='settled'?e.actual_usd:e.reserved_usd;
  if(!Number.isFinite(n)||n<0)throw Error('INVALID_SPEND_LEDGER');return sum+n;
 },0)*3.75;
};
const data=await readJson(keyPath),offline=await readJson('artifacts/verification-offline-suite-2026-10-06.json');
if(!offline.after.success||offline.after.numFailedTests!==0||offline.after.numPassedTests!==490)throw Error('OFFLINE_GATE_FAILED');
if(data.cases.length!==30||new Set(data.cases.map(c=>c.id)).size!==30)throw Error('INVALID_DATASET');
const tree=await applicationTreeHash();
if(tree!==data.protocol.application_tree_sha256)throw Error('APPLICATION_CHANGED_SINCE_PREPARATION');
const q=await readJson('data/corpus.json'),h=await readJson('data/hadeethenc.json');
const qTexts=new Map(q.verses.map(v=>[v.id,v.display]));
const hTexts=new Map(h.records.map(v=>[`${v.language}:${v.id}`,v.fields.hadith_text]));
const old=await readJson('artifacts/private/round6-novelty-inventory.json');
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const seen=new Set(old.map(c=>normalize(c.claim)));
for(const c of data.cases){
 if(seen.has(normalize(c.claim)))throw Error(`REUSED_QUESTION_${c.id}`);seen.add(normalize(c.claim));
 for(const ref of c.references){const text=(c.family==='quran'?qTexts:hTexts).get(ref.locator);if(text!==ref.primary_text||hash(text)!==ref.sha256)throw Error(`KEY_SOURCE_CHANGED_${c.id}`);}
}
const cap=Number(env.ISNADLENS_MAX_SPEND_USD)*3.75,startingSpend=await spend();
if(!Number.isFinite(cap)||cap<=0||env.ISNADLENS_PAID_CALLS_AUTHORIZED!=='true')throw Error('PAID_CALLS_NOT_CONFIGURED');
const freeze={application_tree_sha256:tree,dataset_sha256:hash(JSON.stringify(data)),build:(await readFile('.next/BUILD_ID','utf8')).trim(),configuration_sha256:hash(envBytes),development_cap_sar:cap,corpus_sha256:hash(await readFile('data/corpus.json')),hadith_sha256:hash(await readFile('data/hadeethenc.json'))};
const preflight={kind:'release30_round6_offline_preflight',created_at:new Date().toISOString(),cases:30,question_repeats:0,key_sources_valid:true,offline_tests_passed:490,freeze,starting_development_sar:startingSpend,remaining_sar:cap-startingSpend,minimum_headroom_sar:minimumHeadroomSar,ready:cap-startingSpend>=minimumHeadroomSar,new_api_calls:0};
console.log(JSON.stringify(preflight));
if(!live){await writeFile('artifacts/release30-round6-preflight-2026-10-06.json',JSON.stringify(preflight,null,2)+'\n');process.exit(0);}
if(!preflight.ready)throw Error('INSUFFICIENT_BATCH_BUDGET_HEADROOM_NO_REQUESTS_SENT');
try{await access(destination);throw Error('FIRST_PASS_EXISTS_DO_NOT_RERUN');}catch(e){if(e.code!=='ENOENT')throw e;}
const report={kind:'untouched_release30_round6_frozen_first_pass',threshold:data.threshold,protocol:data.protocol,freeze,started_at:new Date().toISOString(),starting_development_sar:startingSpend,cases:[],review_status:'pending_source_and_answer_review'};
await mkdir(rawRoot,{recursive:true});await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});
function intact(r){
 const {audit_hash,...payload}=r;
 return audit_hash===hash(JSON.stringify(payload))&&(r.evidence_items??[]).every(e=>{
  const text=(e.source_id.startsWith('QURAN-')?qTexts:hTexts).get(e.locator);
  return typeof text==='string'&&text===e.quotation&&hash(text)===e.quotation_sha256&&(e.source_context??[]).every(c=>qTexts.get(c.locator)===c.quotation&&hash(c.quotation)===c.quotation_sha256);
 })&&(!r.retrieval_recovery?.first_record||intact(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||intact(r.web_discovery.previous_record));
}
function operationalFailure(r){
 // A recovered earlier attempt may be unavailable: stop only for an unresolved final failure.
 return (r.reason_codes??[]).some(c=>/BUDGET|SPEND|PROVIDER_UNAVAILABLE|PROVIDER_INCOMPLETE|PROVIDER_RATE_LIMIT/.test(c))||r.entailment_review?.status==='unavailable'||r.qualified_explanation_review?.status==='unavailable'||r.web_discovery?.status==='unavailable';
}
let previousStart=0;
for(const item of data.cases){
 try{
  if(await applicationTreeHash()!==freeze.application_tree_sha256||(await readFile('.next/BUILD_ID','utf8')).trim()!==freeze.build||hash(await readFile('.env.local'))!==freeze.configuration_sha256||hash(JSON.stringify(await readJson(keyPath)))!==freeze.dataset_sha256||hash(await readFile('data/corpus.json'))!==freeze.corpus_sha256||hash(await readFile('data/hadeethenc.json'))!==freeze.hadith_sha256)throw Error('FROZEN_INPUT_CHANGED');
  if(await spend()>=cap)throw Error('DEVELOPMENT_CAP_REACHED');
  // Respect the six-per-minute route limit with one local client, including quick boundary cases.
  const pause=11000-(Date.now()-previousStart);if(pause>0)await new Promise(r=>setTimeout(r,pause));
  previousStart=Date.now();
  const response=await fetch(data.protocol.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({claim:item.claim,inputLanguage:item.language,corpusSelection:'auto'}),signal:AbortSignal.timeout(300000)});
  const responseText=await response.text();
  await writeFile(`${rawRoot}/${item.id}.response.txt`,responseText,{flag:'wx'});
  const r=JSON.parse(responseText);await writeFile(`${rawRoot}/${item.id}.json`,JSON.stringify(r,null,2),{flag:'wx'});
  const row={id:item.id,claim:item.claim,language:item.language,http_status:response.status,elapsed_ms:Date.now()-previousStart,expected:item.expected_verdict,actual:r.verdict??null,label_match:r.verdict===item.expected_verdict,reason_codes:r.reason_codes??[],summary:r.summary_en??null,summary_ar:r.summary_ar??null,source_and_nested_seals_valid:response.ok&&intact(r),original_preserved:r.original_claim===item.claim,detected_language:r.language_intake?.detected_language??null,evidence_locators:r.evidence_items?.map(e=>e.locator)??[],router_version:r.router_version??null,prompt_version:r.prompt_version??null,qualified_review_status:r.qualified_explanation_review?.status??null,usage:response.ok?evaluationUsage(r):[],review:'pending'};
  report.cases.push(row);await writeFile(destination,JSON.stringify(report,null,2));
  console.log(JSON.stringify({id:row.id,actual:row.actual,label_match:row.label_match,reasons:row.reason_codes,seconds:Math.round(row.elapsed_ms/1000)}));
  if(!response.ok||operationalFailure(r)){report.operational_stop=item.id;report.stop_reason='UNRESOLVED_OPERATIONAL_FAILURE';break;}
  if(!row.source_and_nested_seals_valid||!row.original_preserved){report.operational_stop=item.id;report.stop_reason='RECORD_INTEGRITY_FAILURE';break;}
  // Scope-only records can be created before the semantic router runs.
  if(r.router_version&&r.router_version!=='luna-terra-model-routing-v13-feedback-and-failure-status'){report.operational_stop=item.id;report.stop_reason='UNEXPECTED_RUNNING_SERVER_VERSION';break;}
 }catch(e){report.operational_stop=item.id;report.stop_reason=e.message;report.failed_case_request_may_have_completed=true;break;}
}
report.ended_at=new Date().toISOString();report.completed_all_30=report.cases.length===30&&!report.operational_stop;
report.final_development_sar=await spend();report.shared_ledger_delta_sar=report.final_development_sar-startingSpend;
report.cost_note='Shared-ledger delta may include concurrent user requests; sum captured usage separately before attributing batch cost.';
await writeFile(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({completed:report.cases.length,completed_all_30:report.completed_all_30,label_matches:report.cases.filter(c=>c.label_match).length,operational_stop:report.operational_stop??null,shared_ledger_delta_sar:report.shared_ledger_delta_sar,review:'pending; label matches are not a quality score'}));
