// Source-byte/provenance checks only. Semantic approval is supplied separately after reading every answer.
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url),{loadCorpus}=require('../artifacts/private/offline-lab-runtime/corpus.js'),{loadHadith}=require('../artifacts/private/offline-lab-runtime/hadith.js');
const q=loadCorpus(),h=loadHadith();
const dataset=JSON.parse(await readFile('artifacts/fresh50-question-set-2026-10-04.json','utf8'));
const results=JSON.parse(await readFile('artifacts/fresh50-first-pass-results-2026-10-04.json','utf8'));
const audits=[],lines=['# Fresh50 — answer and evidence audit digest','', 'Mechanical authenticity does not establish interpretation. Read every proposition, summary and asserted evidence relation before approving semantic grounding.', ''];
for(const row of results.cases){
 const record=JSON.parse(await readFile(`artifacts/private/fresh50-first-pass/${row.id}.json`,'utf8'));
 const {audit_hash,...payload}=record;let sourceCount=0,contextCount=0;
 const allSourceBytes=(record.evidence_items??[]).every(e=>{
  sourceCount++;const primary=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(r=>`${r.language}:${r.id}`===e.locator)?.fields.hadith_text;
  return primary===e.quotation&&hash(primary)===e.quotation_sha256&&e.source_context.every(c=>{contextCount++;const v=q.verses.find(v=>v.id===c.locator);return v?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256;});
 });
 const item=dataset.cases.find(c=>c.id===row.id);
 const review=record.entailment_review;
 const reviewUnits=review?.raw_review?.atoms?.map(a=>({atom:a.atom_id,entails:a.entails,evidence_id:a.evidence_id,context_locator:a.context_locator,basis_quotation:a.basis_quotation}))??[];
 const audit={id:row.id,raw_record_sha256:hash(JSON.stringify(record)),seal_valid:audit_hash===hash(JSON.stringify(payload)),original_preserved:record.original_claim===item.claim,source_count:sourceCount,context_count:contextCount,all_source_bytes_match_admitted_corpus:allSourceBytes,known_witness_match:row.known_witness_relation_matched,label_match:row.verdict_agreement,semantic_review_status:'pending_developer_primary_review',atoms:record.semantic_assessment?.atomic_claims??[],positive_basis:reviewUnits};
 audits.push(audit);
 lines.push(`## ${row.id} — ${row.topic}`, '', `Native: ${row.claim}`, `Reviewer: ${item.reviewer_english_gloss}`, `Expected: ${item.reference_answer}; app: ${row.actual}; known witness relation: ${row.known_witness_relation_matched}; detected: ${row.detected_language}.`, `EN: ${record.summary_en}`, `AR: ${record.summary_ar}`, `Reasons: ${record.reason_codes.join(', ')}`, '', 'Atomic assertions:', '```json', JSON.stringify(audit.atoms,null,2), '```', '', 'Evidence and context:', ...record.evidence_items.map(e=>`${e.locator} (${e.semantic_relation}): ${e.quotation}\n${e.source_context.map(c=>`${c.locator}: ${c.quotation}`).join('\n')}`), '', 'Positive source-check anchors:', '```json', JSON.stringify(reviewUnits,null,2), '```','');
}
await writeFile('artifacts/fresh50-mechanical-source-audit-2026-10-04.json',JSON.stringify({kind:'source_authenticity_not_semantic_approval',cases:audits},null,2)+'\n');
await writeFile('artifacts/private/fresh50-audit-digest.md',lines.join('\n')+'\n');
console.log(JSON.stringify({audited:audits.length,source_cards:audits.reduce((s,a)=>s+a.source_count,0),contexts:audits.reduce((s,a)=>s+a.context_count,0),all_bytes_passed:audits.every(a=>a.all_source_bytes_match_admitted_corpus),all_seals_passed:audits.every(a=>a.seal_valid)}));
