import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Development probes, not an independent religious accuracy benchmark.
const cases = [
  {id:'invalid-locator', claim:'The Quran says this in 999:999.', inputLanguage:'en', corpusSelection:'quran', expected:'not_evaluated'},
  {id:'source-mixup', claim:'The Quran says fasting is prescribed.', inputLanguage:'en', corpusSelection:'hadith', expected:'not_evaluated'},
  {id:'fabricated-arabic-quote', claim:'القرآن في 21:30 يقول "يجب استعمال الهاتف للصلاة".', inputLanguage:'ar', corpusSelection:'quran', expected:'not_evaluated',expectedReason:'EXPLICIT_QUOTATION_MISMATCH'},
  {id:'fasting-english', claim:'The Quran prescribes fasting during Ramadan (2:185).', inputLanguage:'en', corpusSelection:'quran', expected:'supported_within_selected_corpus'},
  {id:'compulsion-arabic', claim:'القرآن يقول لا إكراه في الدين (2:256).', inputLanguage:'ar', corpusSelection:'quran', expected:'supported_within_selected_corpus'},
  {id:'compound-modern-addition', claim:'The Quran prescribes fasting during Ramadan and requires recording every fast in a smartphone app (2:185).', inputLanguage:'en', corpusSelection:'quran', expected:'insufficient_within_selected_corpus'},
];
await mkdir('artifacts/private', {recursive:true});
const summaries=[];
const selected=process.argv[2] ? cases.filter(probe=>probe.id===process.argv[2]) : cases;
if (!selected.length) throw new Error('Unknown development probe');
for (const probe of selected) {
  const response=await fetch('http://127.0.0.1:3100/api/verify', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(probe)});
  const record=await response.json();
  await writeFile(`artifacts/private/development-${probe.id}.json`,JSON.stringify(record,null,2)+'\n');
  const {audit_hash,...payload}=record;
  const summary={id:probe.id,http_status:response.status,expected:probe.expected,expected_reason:probe.expectedReason,actual:record.verdict,matched:record.verdict===probe.expected && (!probe.expectedReason || record.reason_codes?.includes(probe.expectedReason)),reason_codes:record.reason_codes,record_id:record.record_id,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:record.evidence_items?.every(e=>e.integrity.passed),locators:record.evidence_items?.map(e=>e.locator),usage:record.usage};
  summaries.push(summary); console.log(JSON.stringify(summary));
}
await writeFile(`artifacts/development-validation-${process.argv[2] ?? 'all'}-2026-10-04.json`,JSON.stringify({purpose:'Development probes; provisional expected behavior, not independent scholarly evaluation.',cases:summaries},null,2)+'\n');
if (summaries.some(probe=>!probe.matched || !probe.seal_valid || !probe.evidence_integrity)) process.exitCode=1;
