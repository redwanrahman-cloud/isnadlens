import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Fresh question phrasing after development fixes; no locators or search overrides.
const inputs=[['parents-question','Does Islam encourage being kind to parents?','en'],['intentions-question','Are good deeds judged by intentions in Islam?','en'],['gambling-spanish','¿Está prohibido apostar en el islam?','es']];
const cases=[];
for(const [id,claim,language] of inputs){
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':`development-holdout-${id}`},body:JSON.stringify({claim,inputLanguage:'auto',corpusSelection:'auto'})});
 const record=await response.json();await writeFile(`artifacts/private/holdout-${id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;
 const item={id,claim,expected:'supported_within_selected_corpus',actual:record.verdict,detected_language:record.language_intake?.detected_language,language_matched:record.language_intake?.detected_language===language,original_preserved:record.original_claim===claim,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),integrity:record.evidence_items?.every(item=>item.integrity.passed),summary:record.summary_en,model:record.model,reason_codes:record.reason_codes};
 cases.push(item);console.log(JSON.stringify(item));
}
await writeFile('artifacts/common-query-holdouts-2026-10-04.json',JSON.stringify({purpose:'Fresh development phrasing; provisional source expectations, not independent final religious evaluation',cases},null,2)+'\n');
if(cases.some(item=>item.actual!==item.expected||!item.original_preserved||!item.seal_valid||!item.integrity||!item.language_matched))process.exitCode=1;
