import {readFile,writeFile} from 'node:fs/promises';
import {applicationTreeHash} from './holdout-protocol.mjs';
const run=JSON.parse(await readFile('artifacts/seven-case-repairs-live-2026-10-05.json','utf8'));
const audit=JSON.parse(await readFile('artifacts/seven-case-repairs-mechanical-audit-2026-10-05.json','utf8'));
if(run.cases.length!==7||run.operational_stop||await applicationTreeHash()!==run.freeze.application_tree_sha256)throw new Error('INCOMPLETE_OR_CHANGED');
// Principal developer notes after reading all English/Arabic explanations,
// primary proving quotations and relevant publisher-attributed commentary.
const notes={
 W03:'Birds leave and return in 4721. Reliance/effort explanation is publisher commentary visible to the shared prose reviewer, not a new primary quotation or individual employment ruling.',
 W17:'Direct 39:9 now proves know/not-know comparison, replacing thematic evidence from 35:28. No certificate of piety or universal identity across every dimension.',
 W21:'3017 tells one who loves his brother to tell him. Muslim-brother audience in publisher explanation retained; grades attributed to publisher rather than independently authenticated.',
 W24:'4308 explicitly identifies righteousness with good character. Practical conduct explanation remains supported by supplied commentary and retrieved report 4302, without substituting it for primary proof.',
 W25:'33:15 is an admissible alternative direct counterexample to no accountability whatsoever: the covenant with Allah is subject to questioning in its stated context. Answer does not equate promises with oath expiation or decide all promise types. The locked 17:34 reference was not supplied to the application or forced into the answer.',
 W26:'10:44 directly preserves both Allah does not wrong people and people wrong themselves; no inference blaming every individual calamity on its sufferer.',
 W27:'3064 preserves doubt-during-prayer and confirming sensory indications, with publisher explanation supplying certainty interpretation. No universal exhaustive list of ablution breakers. Minor Arabic grammatical defect is retained separately; meaning remains intelligible.',
};
const cases=run.cases.map(c=>({id:c.id,satisfactory:true,note:notes[c.id],label_match:c.label_match,source_bytes_and_nested_seals_passed:audit.cases.find(a=>a.id===c.id).source_bytes_and_nested_seals_passed,explanation_review_passed:audit.cases.find(a=>a.id===c.id).explanation_review_passed}));
if(cases.some(c=>!c.note||!c.label_match||!c.source_bytes_and_nested_seals_passed||!c.explanation_review_passed))throw new Error('REVIEW_OR_INTEGRITY_FAILURE');
const report={kind:'principal_developer_known_case_review_not_fresh_accuracy_or_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:7,satisfactory_responses:7,withholds:0,wrong_decisive_answers:0,source_and_seal_checks_passed:7,repair_gate_passed:true,run_settled_sar:audit.run_settled_sar,final_development_sar:run.final_development_sar,development_cap_sar:39,limits:['Known regression cases, not a fresh benchmark. Frozen original 23/30 unchanged.','Principal developer review, not independent scholarly certification, native-language output certification or population accuracy.','W25 budget stop preserved separately and resumed after authorized cap change; completed first four cases were not repeated.'],auxiliary_defects:[{id:'W27',finding:'Arabic grammar typo: أن يُقطَعَت الصلاة. Does not change the recorded meaning; no claim of flawless Arabic presentation.'}],cases};
await writeFile('artifacts/seven-case-repairs-principal-review-2026-10-05.json',JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({...report,cases:undefined,limits:undefined}));
