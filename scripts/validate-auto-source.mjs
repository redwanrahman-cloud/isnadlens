import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const probes=[
 {id:'unknown-origin-hadith',claim:'إنما الأعمال بالنيات',inputLanguage:'ar',corpusSelection:'auto',expectedSource:'hadith'},
 {id:'unknown-origin-quran',claim:'وجعلنا من الماء كل شيء حي',inputLanguage:'ar',corpusSelection:'auto',expectedSource:'quran'},
 {id:'quoted-in-both',claim:'قل هو الله أحد',inputLanguage:'ar',corpusSelection:'auto',expectedStatus:'ambiguous'},
 {id:'religious-paraphrase-needs-selection',claim:'Intentions are essential for every action.',inputLanguage:'en',corpusSelection:'auto',expectedStatus:'not_identified'},
 {id:'weather-outside',claim:"What's the weather today?",inputLanguage:'en',corpusSelection:'auto',expectedReason:'OUTSIDE_SUPPORTED_CLAIM_SCOPE'},
 {id:'arabic-negation-router',claim:'القرآن يقول إن رمضان ليس شهراً للصيام (2:185).',inputLanguage:'ar',corpusSelection:'quran',expectedVerdict:'conflicting_within_selected_corpus'},
];
const cases=[];
for(const probe of probes){
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(probe)});
 const record=await response.json();
 await writeFile(`artifacts/private/auto-source-${probe.id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;
 const matched=response.status===200&&(!probe.expectedSource||record.source_identification?.corpus===probe.expectedSource)&&(!probe.expectedStatus||record.source_identification?.status===probe.expectedStatus)&&(!probe.expectedReason||record.reason_codes?.includes(probe.expectedReason))&&(!probe.expectedVerdict||record.verdict===probe.expectedVerdict);
 const item={id:probe.id,http_status:response.status,matched,verdict:record.verdict,reason_codes:record.reason_codes,source_identification:record.source_identification,record_id:record.record_id,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:record.evidence_items?.every(e=>e.integrity.passed),model:record.model,attempts:record.assessment_attempts?.map(a=>({model:a.model,reason:a.reason,usage:a.usage})),usage:record.usage};
 cases.push(item);console.log(JSON.stringify(item));
}
await writeFile('artifacts/auto-source-validation-2026-10-04.json',JSON.stringify({purpose:'Development routing and linkage checks; no independent scholarly approval.',cases},null,2)+'\n');
if(cases.some(c=>!c.matched||!c.seal_valid||!c.evidence_integrity))process.exitCode=1;
