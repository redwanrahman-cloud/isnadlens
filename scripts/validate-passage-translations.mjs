import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const reports=[];
for(const corpus of ['quran','hadith']) {
  const filename=corpus==='quran'?'auto-source-unknown-origin-quran':'auto-source-unknown-origin-hadith';
  const record=JSON.parse(await readFile(`artifacts/private/${filename}.json`,'utf8'));
  const original=JSON.stringify(record);
  const item=record.evidence_items[0];
  for(const language of ['en','bn','hi','ur','id','es','fr','de']) {
    const params=new URLSearchParams({corpus,sourceLanguage:item.source_language||'ar',targetLanguage:language,expectedOriginalHash:item.quotation_sha256});
    params.set(corpus==='quran'?'locator':'recordId',corpus==='quran'?item.locator:item.locator.split(':')[1]);
    const response=await fetch(`http://127.0.0.1:3100/api/passage-translations?${params}`);
    const body=await response.json();
    const unavailable=corpus==='quran'&&language==='bn';
    const quote=body.translated_record?.quotation;
    const success=unavailable?response.status===404&&body.status==='not_available':response.status===200&&body.status==='available'&&body.target_language===language&&body.source_record?.quotation_sha256===item.quotation_sha256&&body.translated_record?.integrity?.passed&&typeof quote==='string'&&createHash('sha256').update(quote).digest('hex')===body.translated_record.quotation_sha256;
    reports.push({corpus,language,status:response.status,success,expected_unavailable:unavailable,original_record_unchanged:original===JSON.stringify(record),version:body.translated_record?.version||null,source_url:body.translated_record?.source_url||null});
  }
  const wrong=new URLSearchParams({corpus,sourceLanguage:item.source_language||'ar',targetLanguage:'en',expectedOriginalHash:'0'.repeat(64)});
  wrong.set(corpus==='quran'?'locator':'recordId',corpus==='quran'?item.locator:item.locator.split(':')[1]);
  const response=await fetch(`http://127.0.0.1:3100/api/passage-translations?${wrong}`);
  reports.push({corpus,case:'wrong_original_hash',status:response.status,success:response.status===400});
}
await writeFile('artifacts/passage-translation-validation-2026-10-04.json',JSON.stringify({purpose:'Exact published translation linkage/integrity, not independent linguistic review. No paid API calls.',cases:reports},null,2)+'\n');
console.log(JSON.stringify(reports));
if(reports.some(report=>!report.success||report.original_record_unchanged===false))process.exitCode=1;
