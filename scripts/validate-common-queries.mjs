import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dataset=JSON.parse(await readFile('artifacts/common-query-cases-2026-10-04.json','utf8'));
const probes=[...dataset.cases.map(item=>({...item,expected_language:item.input_language})),...dataset.same_proposition_multilingual.variants.map(item=>({id:`LANG-${item.language}`,topic:'same proposition, automatic language detection',claim:item.claim,expected_language:item.language,corpus_selection:'auto',expected_verdict:dataset.same_proposition_multilingual.expected_source_verdict,reviewer_locators:dataset.same_proposition_multilingual.reviewer_locators}))];
const selected=process.argv[2]?probes.filter(item=>process.argv[2].split(',').includes(item.id)):probes;
if(!selected.length)throw new Error('Unknown evaluation case');
const cases=[];
for(const item of selected){
 // Reviewer references remain private expectations, not search hints or part of the submitted claim.
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-common-${item.id}`},body:JSON.stringify({claim:item.claim,inputLanguage:'auto',corpusSelection:item.corpus_selection})});
 const record=await response.json();await writeFile(`artifacts/private/common-${item.id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;
 const evidence=record.evidence_items?.map(entry=>({source_id:entry.source_id,locator:entry.locator,relation:entry.semantic_relation,integrity:entry.integrity.passed}))??[];
 const reviewerHit=evidence.some(entry=>item.reviewer_locators?.includes(entry.source_id.startsWith('QURAN-')?`quran:${entry.locator}`:`hadith:${entry.locator}`));
 const noAssessment=record.model==='none'&&!record.usage;
 const summary={id:item.id,topic:item.topic,http_status:response.status,expected:item.expected_verdict,actual:record.verdict,expected_language:item.expected_language,detected_language:record.language_intake?.detected_language??null,input_language:record.input_language,language_matched:record.language_intake?.detected_language===item.expected_language,matched:response.status===200&&record.verdict===item.expected_verdict&&(!item.expected_reason||record.reason_codes?.includes(item.expected_reason)),original_preserved:record.original_claim===item.claim,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:evidence.every(entry=>entry.integrity),reviewer_evidence_retrieved:reviewerHit,reason_codes:record.reason_codes,evidence,model:record.model,intake_status:record.language_intake?.status,intake_usage:record.language_intake?.usage,assessment_usage:record.usage,no_semantic_assessment:noAssessment,review_required:Boolean(item.review_required)};
 cases.push(summary);console.log(JSON.stringify(summary));
}
const suffix=process.argv[2]?'-'+process.argv[2].replaceAll(',','-'):'';
await writeFile(`artifacts/common-query-results${suffix}-2026-10-04.json`,JSON.stringify({dataset_id:dataset.dataset_id,purpose:'Development evaluation; labels are provisional source review, not an independent religious accuracy benchmark. No reference injection. All requests use automatic language detection.',cases},null,2)+'\n');
if(cases.some(item=>!item.matched||!item.original_preserved||!item.seal_valid||!item.evidence_integrity))process.exitCode=1;
