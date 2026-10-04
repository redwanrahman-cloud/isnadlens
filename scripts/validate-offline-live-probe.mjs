import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applicationTreeHash} from './holdout-protocol.mjs';
// Explicitly separate paid confirmation. Never called by test:offline.
const dataset=JSON.parse(await readFile('artifacts/common-question-baseline-50-2026-10-04.json','utf8'));
const item=dataset.cases.find(c=>c.id==='B19');
const claim=`Please check:  ${item.claim}`;
const suffix=process.argv.includes('--after-network-permission')?'-network-confirmation':'';
const response=await fetch('http://127.0.0.1:3100/api/verify',{method:'POST',headers:{'Content-Type':'application/json','x-real-ip':'development-offline-discovered-prefix'},body:JSON.stringify({claim,inputLanguage:'auto',corpusSelection:item.corpus_selection}),signal:AbortSignal.timeout(90000)});
const record=await response.json();
await writeFile(`artifacts/private/offline-live-prefix-B19${suffix}.json`,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
const {audit_hash,...payload}=record;
const result={kind:'real_model_probe_of_offline_discovered_retrieval_gap',application_tree_sha256:await applicationTreeHash(),id:item.id,claim,http_status:response.status,verdict:record.verdict,expected:'conflicting_within_selected_corpus',original_preserved:record.original_claim===claim,seal_valid:audit_hash===createHash('sha256').update(JSON.stringify(payload)).digest('hex'),evidence_integrity:record.evidence_items?.length?record.evidence_items.every(e=>e.integrity.passed):null,evidence:record.evidence_items?.map(e=>({source_id:e.source_id,locator:e.locator,quotation_sha256:e.quotation_sha256,relation:e.semantic_relation})),summary:record.summary_en,reason_codes:record.reason_codes,prompt_version:record.prompt_version,router_version:record.router_version,model:record.model,usage:[record.language_intake?.usage,record.retrieval_plan?.usage,...(record.assessment_attempts??[]).map(a=>a.usage),record.usage,record.entailment_review?.usage].filter(Boolean)};
await writeFile(`artifacts/offline-live-prefix-confirmation${suffix}-2026-10-04.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verdict:result.verdict,seal_valid:result.seal_valid,evidence_integrity:result.evidence_integrity}));
if(result.verdict!==result.expected||!result.original_preserved||!result.seal_valid||!result.evidence_integrity)process.exitCode=1;
