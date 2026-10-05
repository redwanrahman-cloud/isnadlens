import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
function sourceAudit(r){const {audit_hash,...payload}=r;return audit_hash===hash(JSON.stringify(payload))&&r.evidence_items.every(e=>{
 const text=e.source_id.startsWith('QURAN-')?q.verses.find(v=>v.id===e.locator)?.display:h.records.find(v=>`${v.language}:${v.id}`===e.locator)?.fields.hadith_text;
 return text===e.quotation&&hash(text)===e.quotation_sha256&&e.source_context.every(c=>q.verses.find(v=>v.id===c.locator)?.display===c.quotation&&hash(c.quotation)===c.quotation_sha256);
})&&(!r.retrieval_recovery?.first_record||sourceAudit(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||sourceAudit(r.web_discovery.previous_record));}
const phases=[];
for(const suffix of ['','-after-retrieval']){
 const run=JSON.parse(await readFile(`artifacts/badge-consistency-live${suffix}-2026-10-05.json`,'utf8'));
 const cases=[];
 for(const row of run.cases){const r=JSON.parse(await readFile(`artifacts/private/badge-consistency-live${suffix}/${row.id}.json`,'utf8'));
  const confirmedProof=(r.entailment_review?.raw_review?.atoms??[]).every(a=>{const atom=r.semantic_assessment.atomic_claims.find(p=>p.id===a.atom_id),e=r.evidence_items.find(e=>e.evidence_id===a.evidence_id);return e&&atom&&a.source_relationship===atom.relation&&a.entails==='yes'&&e.quotation===a.basis_quotation;});
  cases.push({id:row.id,expected:row.expected,actual:row.actual,source_bytes_and_seals_passed:sourceAudit(r),original_preserved:row.original_preserved,independent_relationship_and_proof_confirmed:suffix!==''&&confirmedProof&&r.entailment_review?.status==='passed',satisfactory:suffix!==''&&row.label_match,review_note:suffix===''?'Retrieval did not include en:4801; insufficient response, not validation of the badge layer.':row.id==='B01'?'Original affirmative question is directly contradicted by the final lineage sentence in en:4801. English/Arabic explanations correctly answer No and badge now agrees.':'Negative proposition is directly supported by the same sentence. English/Arabic explanations preserve the negation and badge now agrees.'});
 }
 phases.push({phase:suffix||'before_retrieval_repair',freeze:run.freeze,cases,run_sar:run.run_sar,development_sar:run.final_development_sar});
}
const result={kind:'targeted_repair_source_and_principal_review_not_fresh_accuracy_benchmark',created_at:new Date().toISOString(),source_and_seal_checks_passed:phases.flatMap(p=>p.cases).filter(c=>c.source_bytes_and_seals_passed).length,total_captured:4,after_repair_satisfactory:2,after_repair_total:2,original_fresh30_satisfactory:29,original_fresh30_total:30,total_targeted_cost_sar:phases.reduce((s,p)=>s+p.run_sar,0),conservative_development_sar:phases.at(-1).development_sar,development_cap_sar:44,remaining_development_sar:44-phases.at(-1).development_sar,judging_reserve_sar:15,limits:['Principal developer review, not independent scholarly certification.','Only the original failing question and one negative-proposition control were checked live. No updated population accuracy or fresh 30/30 claim.','Initial failed retrieval controls retained; subsequent bounded targeted rerun is explicitly a repair check.'],phases};
await writeFile('artifacts/badge-consistency-audit-2026-10-05.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,phases:undefined,limits:undefined}));
if(phases.some(p=>p.cases.some(c=>!c.source_bytes_and_seals_passed||!c.original_preserved))||phases.at(-1).cases.some(c=>!c.satisfactory||!c.independent_relationship_and_proof_confirmed))process.exitCode=1;
