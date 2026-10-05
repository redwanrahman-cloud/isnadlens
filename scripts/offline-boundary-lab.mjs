import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
import {createReplayStore,requestFromRecord,fingerprint} from './lib/offline-replay.mjs';
import {applicationTreeHash} from './holdout-protocol.mjs';

// This command never loads .env.local, cannot reach a provider, and has no live fallback.
delete process.env.OPENAI_API_KEY;delete process.env.GOOGLE_API_KEY;delete process.env.GEMINI_API_KEY;
process.env.ISNADLENS_PAID_CALLS_AUTHORIZED='false';
process.env.ISNADLENS_GOOGLE_FREE_TIER_CONFIRMED='false';
let networkAttempts=0;
globalThis.fetch=async()=>{networkAttempts++;throw new Error('OFFLINE_NETWORK_FORBIDDEN');};
const privateRoot='artifacts/private/offline-lab-runtime';
await mkdir(privateRoot,{recursive:true});await writeFile(`${privateRoot}/package.json`,JSON.stringify({type:'commonjs'}));
for(const name of await readdir('src/lib'))if(name.endsWith('.ts')){
 const raw=await readFile(`src/lib/${name}`,'utf8');
 await writeFile(`${privateRoot}/${name.replace(/\.ts$/,'.js')}`,transformSync(raw,{filename:name,jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code);
}
const require=createRequire(import.meta.url);
const {sha256,loadCorpus}=require(`../${privateRoot}/corpus.js`);
const {recordSchema,semanticSchema}=require(`../${privateRoot}/contracts.js`);
const {verifySeal,validPositiveReview}=require(`../${privateRoot}/verification.js`);
const {decideVerdict}=require(`../${privateRoot}/policy.js`);
const {retrieveWithPublishedEnglishAid,retrieve}=require(`../${privateRoot}/retrieval.js`);
const {loadHadith,retrieveHadith}=require(`../${privateRoot}/hadith.js`);
const {requestedSourceFamily}=require(`../${privateRoot}/auto-verification.js`);
const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
const captureRoot=process.argv.find(arg=>arg.startsWith('--captures='))?.slice(11)??'artifacts/private';
const ledgerPath=join(captureRoot,'api-spend.json');
const budgetBytes=await readFile(ledgerPath);
const datasets=await Promise.all(['artifacts/common-question-baseline-50-2026-10-04.json','artifacts/holdout-question-set-50-2026-10-04.json','artifacts/fresh50-question-set-2026-10-04.json'].map(readJson));
const cases=datasets.flatMap(d=>d.cases);
const records=[];
for(const item of cases){
 const path=item.id.startsWith('N')?join(captureRoot,`fresh50-first-pass/${item.id}.json`):item.id.startsWith('H')?join(captureRoot,`holdout50-first-pass/${item.id}.json`):join(captureRoot,`baseline50-${item.id}.json`);
 const record=await readJson(path);recordSchema.parse(record);
 if(!verifySeal(record)||record.original_claim!==item.claim)throw new Error(`INVALID_CAPTURE:${item.id}`);
 records.push({id:item.id,record});
}
const store=createReplayStore(records.map(row=>row.record));
const checks=[],deltas=[],retrievalProbes=[],queue=[];
function check(group,id,variant,ok){checks.push({group,id,variant,passed:Boolean(ok)});}
function rejected(fn){try{fn();return false;}catch(error){return error.message==='REPLAY_CACHE_MISS_REQUIRES_LIVE';}}
for(const {id,record} of records){
 const request=requestFromRecord(record);
 check('exact_historical_replay',id,'unchanged_packet',fingerprint(store.replay(request).historical_record)===fingerprint(record));
 const changes=[['new_question',{claim:`${request.claim} `}],['new_language',{language:request.language==='en'?'ar':'en'}],['new_prompt',{prompt:`${request.prompt}-changed`}],['new_model',{model:`${request.model}-changed`}],['new_corpus',{corpus_hash:'different-admitted-edition'}],['new_evidence',{evidence:[]}]];
 // Empty evidence must also change identity for historical refusal captures.
 for(const [variant,change] of changes){if(variant==='new_evidence'&&!request.evidence.length)change.evidence=[{evidence_id:'unsupplied'}];check('replay_miss',id,variant,rejected(()=>store.replay({...request,...change})));}
 for(const field of ['original_claim','summary_en','verdict']){const mutated=structuredClone(record);mutated[field]=`${mutated[field]} changed`;check('sealed_record_tamper',id,field,!verifySeal(mutated));}
 check('saved_source_bytes',id,'quotation_and_context_hashes',record.evidence_items.every(e=>sha256(e.quotation)===e.quotation_sha256&&e.source_context.every(c=>sha256(c.quotation)===c.quotation_sha256)));
 const parsed=semanticSchema.safeParse(record.semantic_assessment);
 if(!parsed.success)continue;
 const assessed=parsed.data;
 const current=decideVerdict(assessed,new Set(record.evidence_items.map(e=>e.evidence_id)));
 if(current!==record.verdict)deltas.push({id,historical:record.verdict,current_policy_on_saved_response:current,note:'Policy-only replay; no new interpretation or positive review.'});
 if(current!=='supported_within_selected_corpus')continue;
 const review={explanation_preserved:true,atoms:assessed.atomic_claims.filter(a=>a.material).map(a=>({atom_id:a.id,entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:a.evidence_ids[0]??null,context_locator:null,basis_quotation:record.evidence_items.find(e=>e.evidence_id===a.evidence_ids[0])?.quotation??null}))};
 if(!validPositiveReview(review,assessed,record.evidence_items)){queue.push({id,reason:'SAVED_POSITIVE_PACKET_MECHANICALLY_INCOMPLETE',priority:'high',needs_real_model:true});continue;}
 // Injected reviews deliberately assume semantic yes; this does NOT approve the assertion.
 check('injected_guard_control',id,'well_formed_injected_yes',true);
 const mutations=[['unknown_atom',r=>r.atoms[0].atom_id='unknown'],['unknown_source',r=>r.atoms[0].evidence_id='unsupplied'],['invented_quote',r=>r.atoms[0].basis_quotation='UNSUPPLIED SOURCE TEXT'],['wrong_context',r=>r.atoms[0].context_locator='unsupplied'],['missing_atom',r=>r.atoms.pop()],['duplicate_atom',r=>r.atoms.push({...r.atoms[0]})],['negative_review',r=>r.atoms[0].entails='no'],['uncertain_review',r=>r.atoms[0].entails='uncertain'],['lost_attribution',r=>r.atoms[0].attribution_preserved=false],['lost_qualification',r=>r.atoms[0].qualifications_preserved=false]];
 for(const [variant,mutate] of mutations){const changed=structuredClone(review);mutate(changed);check('injected_guard_rejection',id,variant,!validPositiveReview(changed,assessed,record.evidence_items));}
 const corrupt=structuredClone(record.evidence_items);for(const e of corrupt)e.integrity.passed=false;
 check('injected_guard_rejection',id,'source_integrity_failed',!validPositiveReview(review,assessed,corrupt));
}

// Predeclared source-search probes. References are used ONLY after retrieval for scoring.
const probeIds=process.argv.includes('--full-retrieval')?cases.filter(c=>c.reference_accuracy_eligible).map(c=>c.id):['B01','B03','B19','B46','H01','H12','H14','H15','H36','H37','H41','H42'];
const quran=loadCorpus();let hadith;
for(const id of probeIds){
 const item=cases.find(c=>c.id===id),saved=records.find(r=>r.id===id).record;
 const ar=saved.language_intake?.arabic_terms??saved.retrieval_plan?.arabic_terms??[],en=saved.language_intake?.english_terms??saved.retrieval_plan?.english_terms??[];
 const hints=ar.flatMap((v,i)=>[v,...(en[i]?[en[i]]:[])]).concat(en.slice(ar.length)).slice(0,20);
 const gloss=saved.language_intake?.english_gloss||item.claim,selection=requestedSourceFamily(item.claim,gloss);
 const variants=[['original',item.claim],['polite_prefix',`${item.input_language==='ar'?'من فضلك تحقق:':'Please check: '} ${item.claim}`],['unicode_form',item.claim.normalize('NFKC')]];
 for(const [variant,claim] of variants){
  const locators=[],contextLocators=[];
  if(selection!=='hadith'){
   const limit=selection==='both'?4:8;
   const found=retrieveWithPublishedEnglishAid(quran,claim,limit,hints,gloss).verses;
   locators.push(...found.map(v=>`quran:${v.id}`));
   for(const verse of found)for(const offset of [-2,-1,1,2])if(quran.verses.some(v=>v.surah===verse.surah&&v.ayah===verse.ayah+offset))contextLocators.push(`quran:${verse.surah}:${verse.ayah+offset}`);
  }
  if(selection!=='quran'){
   hadith??=loadHadith();const perLanguage=selection==='both'?2:4,limit=selection==='both'?4:8;
   const found=[...retrieveHadith(hadith,gloss,'en',perLanguage,en,claim),...retrieveHadith(hadith,claim,'ar',perLanguage,ar,claim)];
   if(found.length<limit)for(const row of retrieveHadith(hadith,gloss,'en',limit,en,claim))if(found.length<limit&&!found.some(r=>r.id===row.id&&r.language===row.language))found.push(row);
   locators.push(...found.map(r=>`hadith:${r.language}:${r.id}`));
  }
  const witnesses=item.reference_evidence_locators??item.reviewer_locators??item.reference_witnesses?.map(w=>w.locator)??[];
  const primaryMatched=witnesses.filter(w=>locators.includes(w));
  const matched=witnesses.filter(w=>locators.includes(w)||contextLocators.includes(w));
  retrievalProbes.push({id,variant,claim,retrieved_locators:locators,supplied_context_locators:[...new Set(contextLocators)],reference_count:witnesses.length,reference_overlap_primary:primaryMatched.length,reference_overlap_including_context:matched.length,all_references_found:witnesses.length>0&&matched.length===witnesses.length,mode:'search_only_with_fixed_historical_hints_not_new_AI_planning'});
  if(witnesses.length&&matched.length!==witnesses.length)queue.push({id,variant,reason:matched.length?'PARTIAL_WITNESS_RETRIEVAL':'NO_FROZEN_WITNESS_RETRIEVED',priority:['H12','H42','B46'].includes(id)?'high':'medium',needs_source_review:true,needs_real_model:matched.length===0||id==='H12',note:'Review source coverage before scheduling a paid run. Witness miss is a retrieval diagnostic, not a false-answer judgment; valid alternatives or context may exist.'});
 }
 console.log(JSON.stringify({retrieval_probe:id,variants:variants.length}));
}
const bad=records.find(row=>row.id==='H42').record;
const badAssessment=semanticSchema.parse(bad.semantic_assessment);
const badAtom=badAssessment.atomic_claims.find(a=>a.material);
const badCard=bad.evidence_items.find(e=>badAtom.evidence_ids.includes(e.evidence_id));
const falseYes={explanation_preserved:true,atoms:[{atom_id:badAtom.id,entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:badCard.evidence_id,context_locator:null,basis_quotation:badCard.quotation}]};
const falseSemanticYesCanPassMechanics=validPositiveReview(falseYes,badAssessment,bad.evidence_items);
const budgetUnchanged=fingerprint(await readFile(ledgerPath))===fingerprint(budgetBytes);
check('offline_isolation','run','no_network_attempts',networkAttempts===0);check('offline_isolation','run','spending_ledger_unchanged',budgetUnchanged);
const failures=checks.filter(c=>!c.passed),groups=Object.fromEntries([...new Set(checks.map(c=>c.group))].map(group=>[group,{checks:checks.filter(c=>c.group===group).length,passed:checks.filter(c=>c.group===group&&c.passed).length}]));
const report={kind:'offline_engineering_lab_not_model_accuracy',created_at:new Date().toISOString(),application_tree_sha256:await applicationTreeHash(),historical_records:records.length,checks:checks.length,passed:checks.length-failures.length,failures,groups,new_api_calls:0,new_api_cost_usd:0,network_attempts:networkAttempts,budget_unchanged:budgetUnchanged,policy_replay_deltas:deltas,retrieval_probes:retrievalProbes,live_validation_queue:queue,known_remaining_boundary:{incorrect_semantic_yes_with_real_unrelated_text_passes_pure_mechanics:falseSemanticYesCanPassMechanics,note:'A model can still incorrectly assert entailment of genuine unrelated text. Offline guards do not establish religious meaning; this historical error requires real source-focused review and independent reference audit.'},limits:['Historical replay returns captured outputs only for the full exact packet and versions.','Fault injection checks robustness, not fresh model behavior or religious accuracy.','Query variations are not additional independent questions.','Search probes reuse fixed historical hints; multilingual AI detection and new planning are not simulated.','No app verdict or expected-answer database is used as a production fallback.']};
const reportPath=process.argv.find(arg=>arg.startsWith('--report='))?.slice(9)??'artifacts/offline-boundary-lab-2026-10-04.json';
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({historical_records:records.length,checks:report.checks,passed:report.passed,retrieval_probes:retrievalProbes.length,queued:queue.length,new_api_calls:0,budget_unchanged:budgetUnchanged,residual_semantic_risk_demonstrated:falseSemanticYesCanPassMechanics}));
if(failures.length)process.exitCode=1;
