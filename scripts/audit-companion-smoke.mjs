import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url);
const corpus=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus();
const report=JSON.parse(readFileSync('artifacts/companion-smoke-2026-10-05.json','utf8'));
function audit(record){
  const {audit_hash,...payload}=record;
  return audit_hash===hash(JSON.stringify(payload))&&record.evidence_items.every(item=>{
    const text=corpus.verses.find(verse=>verse.id===item.locator)?.display;
    return item.source_id.startsWith('QURAN-')&&text===item.quotation&&hash(text)===item.quotation_sha256&&item.source_context.every(context=>corpus.verses.find(verse=>verse.id===context.locator)?.display===context.quotation&&hash(context.quotation)===context.quotation_sha256);
  })&&(!record.retrieval_recovery?.first_record||audit(record.retrieval_recovery.first_record))&&(!record.web_discovery?.previous_record||audit(record.web_discovery.previous_record));
}
const rows=report.cases.map(row=>{
  const record=JSON.parse(readFileSync(`artifacts/private/companion-live-2026-10-05/${row.id}.json`,'utf8'));
  return {id:row.id,label_matches:row.verdict===row.expected,source_and_nested_seals:audit(record),original_preserved:record.original_claim===row.claim,expected_direct_reference_found:row.source?record.evidence_items.some(item=>item.locator===row.source):record.evidence_items.length===0};
});
const result={kind:'companion_integration_audit_not_population_accuracy',application_tree_sha256:await applicationTreeHash(),build:readFileSync('.next/BUILD_ID','utf8').trim(),cases:rows,passed:rows.every(row=>row.label_matches&&row.source_and_nested_seals&&row.original_preserved&&row.expected_direct_reference_found),cost_sar:report.cost_sar,development_sar:report.ending_sar,remaining_sar:49-report.ending_sar};
writeFileSync('artifacts/companion-smoke-audit-2026-10-05.json',JSON.stringify(result,null,2));
const browser=JSON.parse(readFileSync('artifacts/private/companion-browser-2026-10-05/report.json','utf8'));
writeFileSync('artifacts/companion-browser-2026-10-05.json',JSON.stringify({kind:'headless_desktop_and_mobile_viewport_checks_not_physical_phone_certification',cases:browser},null,2));
console.log(JSON.stringify(result));if(!result.passed)process.exitCode=1;
