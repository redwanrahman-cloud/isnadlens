import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Translate only an existing development record. Never rerun its verdict.
const record=JSON.parse(await readFile('artifacts/private/development-fasting-english.json','utf8'));
const initial=JSON.stringify(record);
const {audit_hash,...payload}=record;
if(createHash('sha256').update(JSON.stringify(payload)).digest('hex')!==audit_hash)throw new Error('Invalid original seal');
const summaries=[];
for(const language of ['bn','hi','ur','id']) {
  const started=Date.now();
  const response=await fetch('http://127.0.0.1:3100/api/translate-result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record,language})});
  const translated=await response.json();
  await writeFile(`artifacts/private/language-result-${language}.json`,JSON.stringify(translated,null,2)+'\n');
  const item={language,status:response.status,latency_ms:Date.now()-started,record_id_matches:translated.record_id===record.record_id,audit_hash_matches:translated.audit_hash===record.audit_hash,original_record_unchanged:JSON.stringify(record)===initial,summary_present:typeof translated.summary==='string'&&translated.summary.trim().length>0,limitation_count_preserved:translated.limitations?.length===record.limitations.length,review_status:translated.review_status,source_kind:translated.source_kind};
  summaries.push(item);console.log(JSON.stringify(item));
}
await writeFile('artifacts/language-result-validation-2026-10-04.json',JSON.stringify({purpose:'Development translation checks; structural integrity is not independent linguistic approval.',record_id:record.record_id,cases:summaries},null,2)+'\n');
if(summaries.some(item=>item.status!==200||!item.record_id_matches||!item.audit_hash_matches||!item.original_record_unchanged||!item.summary_present||!item.limitation_count_preserved))process.exitCode=1;
