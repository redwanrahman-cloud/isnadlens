import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const label=process.argv[2];
if(!['mini','strong'].includes(label))throw new Error('Use mini or strong with the correspondingly configured local server');
const probes=[
 {id:'ramadan-prescribed',claim:'The Quran prescribes fasting during Ramadan (2:185).',inputLanguage:'en',corpusSelection:'quran',expected:'supported_within_selected_corpus'},
 {id:'ramadan-negated',claim:'القرآن يقول إن رمضان ليس شهراً للصيام (2:185).',inputLanguage:'ar',corpusSelection:'quran',expected:'conflicting_within_selected_corpus'},
 {id:'compound-app-requirement',claim:'The Quran prescribes fasting during Ramadan and requires recording every fast in a smartphone app (2:185).',inputLanguage:'en',corpusSelection:'quran',expected:'insufficient_within_selected_corpus'},
 {id:'hadith-intention-negated',claim:'The Prophet said that intentions have no importance in actions.',inputLanguage:'en',corpusSelection:'hadith',expected:'conflicting_within_selected_corpus'},
];
await mkdir('artifacts/private',{recursive:true});
const cases=[];
for(const probe of probes){
 const started=Date.now();
 const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(probe)});
 const record=await response.json();
 await writeFile(`artifacts/private/comparison-${label}-${probe.id}.json`,JSON.stringify(record,null,2)+'\n');
 const {audit_hash,...payload}=record;
 const item={id:probe.id,label,http_status:response.status,expected_provisional:probe.expected,actual:record.verdict,agrees_with_provisional:record.verdict===probe.expected,latency_ms:Date.now()-started,model:record.model,prompt_version:record.prompt_version,schema_version:record.schema_version,record_id:record.record_id,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),source_integrity:record.evidence_items?.every(e=>e.integrity.passed),locators:record.evidence_items?.map(e=>e.locator),reason_codes:record.reason_codes,usage:record.usage};
 cases.push(item);console.log(JSON.stringify(item));
}
await writeFile(`artifacts/model-comparison-${label}-2026-10-04.json`,JSON.stringify({purpose:'Paired development comparison on reused cases; provisional labels are not independent religious ground truth. Not the untouched final evaluation.',cases},null,2)+'\n');
if(cases.some(item=>item.http_status!==200||!item.seal_valid||!item.source_integrity||!item.model?.includes(label==='mini'?'mini':'gpt-5.4-')))process.exitCode=1;
