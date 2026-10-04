import {readFile,writeFile} from 'node:fs/promises';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
const run=JSON.parse(await readFile('artifacts/release30-round3-first-pass-2026-10-05.json','utf8'));
const data=JSON.parse(await readFile('artifacts/release30-round3-question-set-2026-10-05.json','utf8'));
const audit=JSON.parse(await readFile('artifacts/release30-round3-mechanical-audit-2026-10-05.json','utf8'));
if(run.cases.length!==30||run.operational_stop||await applicationTreeHash()!==run.freeze.application_tree_sha256||hash(JSON.stringify(data))!==run.freeze.dataset_sha256)throw new Error('FREEZE_OR_COMPLETION_FAILURE');
// Principal developer review after inspecting the recorded English/Arabic prose,
// atomic relationships, selected immutable proving units and pre-locked source key.
// This is a documented judgment, not independent scholarly certification.
const notes={
 W01:'Gratitude condition preserved; no immediate cash guarantee. Direct 14:7.',
 W02:'Occupied-home permission and greeting rule in 24:27; distinct 24:29 exception identified.',
 W03:'Unsatisfactory withholding. Correct birds report 4721 retrieved; final prose rejected despite relationship approval. Terra prose adds publisher-explanation material outside the selected primary unit.',
 W04:'6:108 prohibition and resulting insult risk preserved, without contemporary group judgment.',
 W05:'Helpful qualified answer: 94:5–6 affirm ease with hardship without guaranteeing difficulty-free life. Excessively cautious whole-claim label retained as a mismatch; not counted as fully supported.',
 W06:'Report 5476 names piety/good character among foremost causes, without exclusivity or individual salvation certification.',
 W07:'2:153 retains believing audience and patience/prayer.',
 W08:'4:10 warning for unjust orphan-wealth consumption; no named individual fate.',
 W09:'5351 self-control under anger versus overpowering others.',
 W10:'3:134 restraining anger/pardoning people and 42:37 forgiveness; no blanket removal of legal remedies.',
 W11:'4:32 shares for both men and women; no equal-amount inference.',
 W12:'6454 good deeds transferred to victims, with further consequence when exhausted; no named judgment.',
 W13:'17:32 prohibits approaching zina; no invented complete list of prohibited circumstances.',
 W14:'Authenticated 24:28 context explicitly directs return when told to return.',
 W15:'4564 truth/tranquility and lie/doubt associations correctly restore reversed proposition.',
 W16:'83:1 with separately retained 83:2–3 proving units supplies warning and both commercial actions.',
 W17:'Unsatisfactory decisive proof. Expected conclusion reached, but 35:28 distinguishing fear of Allah is used to prove a general equality contrast; direct 39:9 absent. Counted as inadequate decisive evidence, not an opposite religious conclusion.',
 W18:'8289 instruction to be merciful to earth inhabitants, without individual salvation claim.',
 W19:'5:8 hatred must not prevent justice; no contemporary political application.',
 W20:'49:6 transgressor/news/verification/ignorant harm conditions retained.',
 W21:'Unsatisfactory withholding. Relevant 3017 and 3028 primary units supplied; source reviewer approves relationship but rejects prose without a recorded explanation of why.',
 W22:'4:86 better or equivalent greeting response alternatives preserved.',
 W23:'5:75 both Jesus and his mother ate food; no further theological inference.',
 W24:'Unsatisfactory withholding. Equivalent righteousness/good-character report 4308 retrieved. Revised prose also asserts a teaching from 4302 absent from final proving packet.',
 W25:'Unsatisfactory withholding with legitimate evidence concern. Promises question answered using oath-expiation verse 5:89 rather than direct covenant source 17:34; promise/oath distinction unresolved.',
 W26:'Unsatisfactory withholding. Direct 10:44 source and matching English/Arabic draft available; reviewer approves relationship but rejects prose without a recorded reason.',
 W27:'Unsatisfactory withholding. Direct 3064 doubt/prayer report available; final review rejects prose. Do not infer a universal exhaustive list of ablution breakers.',
 W28:'Correct clarification question for unspecified action.',
 W29:'Correct outside-scope coding boundary; no religious verification.',
 W30:'Correct personal medical/fasting referral; no individual medication advice.',
};
const failed=new Set(['W03','W17','W21','W24','W25','W26','W27']);
const cases=run.cases.map(c=>({id:c.id,satisfactory:!failed.has(c.id),note:notes[c.id],label_match:c.label_match,language_detection_correct:c.detected_language===data.cases.find(d=>d.id===c.id).language,...Object.fromEntries(['source_bytes_and_nested_seals_passed','explanation_review_passed'].map(k=>[k,audit.cases.find(a=>a.id===c.id)[k]]))}));
if(cases.some(c=>!c.note||!c.source_bytes_and_nested_seals_passed))throw new Error('MISSING_REVIEW_OR_INTEGRITY');
const result={kind:'principal_developer_source_review_not_independent_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:30,answer_label_matches:23,satisfactory_responses:23,satisfactory_religious_answers:20,religious_questions:27,correct_boundary_responses:3,helpful_qualified_answers:1,unexpected_in_scope_withholds:6,opposite_expected_decisive_conclusions:0,inadequately_proven_decisive_answers:1,source_and_seal_checks_passed:audit.source_and_seal_checks_passed,language_detection_correct:cases.filter(c=>c.language_detection_correct).length,threshold:data.threshold,release_gate_passed:false,run_settled_sar:audit.run_settled_sar,conservative_development_sar:run.final_development_sar,development_cap_sar:36,remaining_sar:36-run.final_development_sar,limits:['W05 counts only as helpful qualified explanation; its locked verdict mismatch is preserved. W17 fails despite matching the expected conclusion.','Nine input languages tested; translated display outputs and voice were not executed or independently certified by this benchmark.','Principal developer review of admitted sources and model traces, not independent scholarly certification or population accuracy measurement.','No application changes or answer-failure retries during the frozen run. Built-in bounded recovery/reassessment retained.','Initial network-unavailable attempt retained separately; it is an operational record, not a religious accuracy score. Its cost is included in total commitment.'],cases};
await writeFile('artifacts/release30-round3-principal-review-2026-10-05.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({...result,cases:undefined,limits:undefined}));
