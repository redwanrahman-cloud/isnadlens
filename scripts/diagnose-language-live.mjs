import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
if(!process.argv.includes('--live'))throw new Error('LIVE_FLAG_REQUIRED');
const gate=JSON.parse(await readFile('artifacts/explanation-diagnostics-offline-confirmed-2026-10-05.json','utf8'));
if(!gate.success||gate.numFailedTests||gate.numPassedTests!==376)throw new Error('OFFLINE_GATE_FAILED');
const root='artifacts/private/explanation-diagnostics-runtime';
await mkdir(root,{recursive:true});await writeFile(`${root}/package.json`,'{"type":"commonjs"}');
for(const name of await readdir('src/lib'))if(name.endsWith('.ts'))await writeFile(`${root}/${name.replace(/\.ts$/,'.js')}`,transformSync(await readFile(`src/lib/${name}`,'utf8'),{filename:name,jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code);
const require=createRequire(import.meta.url);require('@next/env').loadEnvConfig(process.cwd());
const provider=require(`../${root}/provider.js`),{verifySeal,validPositiveReview}=require(`../${root}/verification.js`);
const dataset=JSON.parse(await readFile('artifacts/release30-round3-question-set-2026-10-05.json','utf8'));
const cases=[];
for(const id of ['W26','W24']){
 const record=JSON.parse(await readFile(`artifacts/private/release30-round3-first-pass/${id}.json`,'utf8'));
 if(!verifySeal(record))throw new Error('ORIGINAL_SEAL_FAILURE');
 const draft=structuredClone(record.assessment_attempts.at(-1).raw_assessment);
 const gloss=record.language_intake.english_gloss;
 for(const [suffix,claim] of [['original',record.original_claim],['english',gloss]]){
  const assessment=structuredClone(draft);if(assessment.atomic_claims.length!==1)throw new Error('PAIRED_CASE_REQUIRES_SINGLE_ATOM');assessment.atomic_claims[0].text=claim;
  cases.push({id:`${id}-${suffix}`,claim,assessment,evidence:record.evidence_items,expected:'pass',language:dataset.cases.find(c=>c.id===id).language});
 }
 if(id==='W26'){
  const assessment=structuredClone(draft);assessment.atomic_claims[0].text=gloss;
  assessment.summary_ar='نعم، يعلّم القرآن أن الله يظلم الناس وأن الناس لا يظلمون أنفسهم.';
  cases.push({id:'W26-reversed-arabic-control',claim:gloss,assessment,evidence:record.evidence_items,expected:'reject',language:'en'});
 }
}
const cost=async()=>JSON.parse(await readFile('artifacts/private/api-spend.json','utf8')).entries.reduce((n,e)=>n+(e.status==='settled'?e.actual_usd:e.reserved_usd),0)*3.75;
const destination='artifacts/explanation-language-diagnostics-live-2026-10-05.json',rawroot='artifacts/private/explanation-language-diagnostics-live';
const resume=process.argv.includes('--resume');
const report=resume?JSON.parse(await readFile(destination,'utf8')):{kind:'known_case_source_review_language_pairs_not_fresh_accuracy',started_at:new Date().toISOString(),application_tree_sha256:await applicationTreeHash(),development_cap_sar:36,starting_development_sar:await cost(),limits:['Source-review layer only; original retrieval, draft and sources are held constant. No end-to-end routing/retrieval comparison.','Each original/English pair is two separate model calls; stochastic variation remains a confounder.','Known-case repairs cannot revise the frozen 23/30 benchmark.'],cases:[]};
if(resume){
 if(await applicationTreeHash()!==report.application_tree_sha256||report.operational_stop?.reason!=='SPEND_BUDGET_STOP')throw new Error('RESUME_NOT_SAFE');
 if(!process.argv.includes('--approved-cap-37'))throw new Error('NEW_CAP_APPROVAL_REQUIRED');
 report.previous_stops=[...(report.previous_stops??[]),{...report.operational_stop,completed_at:report.completed_at,development_sar:report.final_development_sar}];
 report.development_cap_sar=37;delete report.operational_stop;delete report.completed_at;
}else{await mkdir(rawroot,{recursive:true});await writeFile(destination,JSON.stringify(report,null,2),{flag:'wx'});}
for(const item of cases){
 if(report.cases.some(c=>c.id===item.id))continue;
 if(await applicationTreeHash()!==report.application_tree_sha256)throw new Error('APPLICATION_CHANGED');
 try{
  const r=await provider.reviewPositiveEntailment(item.claim,item.assessment,item.evidence,'support');
  const valid=validPositiveReview(r.review,item.assessment,item.evidence);
  await writeFile(`${rawroot}/${item.id}.json`,JSON.stringify({request:item,response:r},null,2),{flag:'wx'});
  const row={id:item.id,expected:item.expected,actual:valid?'pass':'reject',matches_control:valid===(item.expected==='pass'),diagnostic:r.review.explanation_diagnostic,relationship:r.review.atoms.map(a=>a.entails),usage:r.usage,draft_sha256:hash(JSON.stringify(item.assessment)),evidence_sha256:hash(JSON.stringify(provider.explanationEvidence(item.evidence)))};
  report.cases.push(row);console.log(JSON.stringify(row));
 }catch(error){report.operational_stop={id:item.id,reason:error.message};console.log(JSON.stringify(report.operational_stop));break;}
 await writeFile(destination,JSON.stringify(report,null,2));
}
report.completed_at=new Date().toISOString();report.final_development_sar=await cost();report.settled_sar=report.cases.reduce((n,c)=>n+(c.usage?.estimated_cost_usd??0),0)*3.75;await writeFile(destination,JSON.stringify(report,null,2));console.log(JSON.stringify({completed:report.cases.length,matched:report.cases.filter(c=>c.matches_control).length,development_sar:report.final_development_sar,run_sar:report.settled_sar}));
