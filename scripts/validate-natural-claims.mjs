import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Development expectations, not an independent religious accuracy benchmark.
const probes=[
 {id:'user-pig-wording-stale-language',claim:'pig eating is haram',inputLanguage:'ar',expectedLanguage:'en',corpusSelection:'auto',expected:'supported_within_selected_corpus'},
 {id:'ordinary-pork-question',claim:'Is eating pork haram?',inputLanguage:'en',corpusSelection:'auto',expected:'supported_within_selected_corpus'},
 {id:'opposite-pork-claim',claim:'Eating pork is halal in Islam.',inputLanguage:'en',corpusSelection:'auto',expected:'conflicting_within_selected_corpus'},
 {id:'arabic-pork-question',claim:'هل أكل لحم الخنزير حرام؟',inputLanguage:'ar',corpusSelection:'auto',expected:'supported_within_selected_corpus'},
 {id:'ordinary-intentions-paraphrase',claim:'In Islam, what someone intends matters when they do an action.',inputLanguage:'en',corpusSelection:'auto',expected:'supported_within_selected_corpus'},
 {id:'weather-refusal',claim:"What's the weather today?",inputLanguage:'en',corpusSelection:'auto',expected:'not_evaluated',reason:'OUTSIDE_SUPPORTED_CLAIM_SCOPE',noPaid:true},
 {id:'personal-refusal',claim:'Can I stop fasting because of my illness?',inputLanguage:'en',corpusSelection:'auto',expected:'not_evaluated',reason:'PERSONAL_RULING_REFERRAL',noPaid:true},
 {id:'fabricated-reference',claim:'The Quran at 2:9999 describes pork.',inputLanguage:'en',corpusSelection:'auto',expected:'not_evaluated',noPaid:true},
];
const cases=[];
for(const probe of probes){
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`local-development-${probe.id}`},body:JSON.stringify(probe)});
 const record=await response.json();
 await writeFile(`artifacts/private/natural-${probe.id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;
 const noPaid=!record.retrieval_plan?.usage&&!record.usage&&!record.assessment_attempts?.some(a=>a.usage);
 const item={id:probe.id,http_status:response.status,expected:probe.expected,actual:record.verdict,matched:response.status===200&&record.verdict===probe.expected&&(!probe.reason||record.reason_codes.includes(probe.reason))&&(!probe.noPaid||noPaid)&&(!probe.expectedLanguage||record.input_language===probe.expectedLanguage),original_preserved:record.original_claim===probe.claim,input_language:record.input_language,corpus_selection:record.corpus_selection,reason_codes:record.reason_codes,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:record.evidence_items?.every(e=>e.integrity.passed),locators:record.evidence_items?.map(e=>({source_id:e.source_id,locator:e.locator,relation:e.semantic_relation})),retrieval_plan:record.retrieval_plan,model:record.model,usage:record.usage,no_paid_usage:noPaid};
 cases.push(item); console.log(JSON.stringify(item));
}
await writeFile('artifacts/natural-claims-validation-2026-10-04.json',JSON.stringify({purpose:'Live development probes of ordinary wording; no independent scholarly accuracy claim.',cases},null,2)+'\n');
if(cases.some(c=>!c.matched||!c.original_preserved||!c.seal_valid||!c.evidence_integrity))process.exitCode=1;
