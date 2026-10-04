import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const round=process.argv[2]??'3';if(!/^\d+$/.test(round))throw new Error('ROUND_INVALID');
const require=createRequire(import.meta.url),{loadCorpus}=require('../artifacts/private/fresh50-repair-runtime/corpus.js'),{loadHadith}=require('../artifacts/private/fresh50-repair-runtime/hadith.js');
const q=loadCorpus(),h=loadHadith(),report=JSON.parse(await readFile(`artifacts/fresh50-repairs-round${round}-2026-10-04.json`,'utf8'));
const cases=[];for(const row of report.cases){
const r=JSON.parse(await readFile(`artifacts/private/fresh50-repairs-round${round}/${row.id}.json`,'utf8'));
const records=[r,...(r.retrieval_recovery?.first_record?[r.retrieval_recovery.first_record]:[])];
const audit=records.every(record=>{const {audit_hash,...payload}=record;return audit_hash===hash(JSON.stringify(payload))&&record.original_claim===row.claim&&record.evidence_items.every(e=>{const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;return text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);});});
cases.push({id:row.id,source_bytes_original_and_nested_seals_passed:audit,principal_review:'pending'});
}
await writeFile(`artifacts/fresh50-repairs-round${round}-source-audit-2026-10-04.json`,JSON.stringify({kind:'mechanical_not_semantic',cases},null,2)+'\n');
console.log(JSON.stringify({audited:cases.length,all_passed:cases.every(c=>c.source_bytes_original_and_nested_seals_passed)}));
