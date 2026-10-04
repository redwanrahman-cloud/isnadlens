import {readFile,writeFile} from 'node:fs/promises';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
const run=JSON.parse(await readFile('artifacts/release30-round2-first-pass-2026-10-05.json','utf8'));
const data=JSON.parse(await readFile('artifacts/release30-round2-question-set-2026-10-05.json','utf8'));
const audit=JSON.parse(await readFile('artifacts/release30-round2-mechanical-audit-2026-10-05.json','utf8'));
if(run.cases.length!==30||!run.completed_at||run.operational_stop)throw new Error('INCOMPLETE_RUN');
if(await applicationTreeHash()!==run.freeze.application_tree_sha256||hash(JSON.stringify(data))!==run.freeze.dataset_sha256)throw new Error('FROZEN_INPUT_CHANGED');
// Principal developer notes after reading all recorded propositions, explanations
// and selected proving units. This list is not an automatic model-quality metric.
const notes={
 V01:'Unsatisfactory withholding. The correct spending-balance source 25:67 was retrieved; the source-blind review incorrectly rejected the equivalent two-part decomposition. Locked alternative key 17:29 also supports the question.',
 V02:'Satisfactory contradiction. Adjacent 18:23–24 preserve the qualification about Allah willing.',
 V03:'Satisfactory support. Suhoor blessing/encouragement, with no invalidation or obligatory-meal claim.',
 V04:'Satisfactory support. Three fasting days apply only when unable to provide the preceding oath-expiation alternatives.',
 V05:'Satisfactory contradiction. The honor criterion is piety, not greater wealth.',
 V06:'Satisfactory contradiction. The instruction specifies odd nights in the final ten; no assertion that other dates are impossible.',
 V07:'Satisfactory primary English reasoning. Atom-weight good is seen in the reckoning context. Separate auxiliary Arabic-field localization defect recorded below.',
 V08:'Satisfactory contradiction. Small evil is seen; no individual fate asserted.',
 V09:'Satisfactory support. Learn and teach are both retained. Additional acting-upon wording is correctly attributed to publisher explanation, checked in its supplied field.',
 V10:'Satisfactory support. Justice and benevolence are commanded in 16:90.',
 V11:'Satisfactory contradiction. Sound upright speech rather than crooked speech.',
 V12:'Satisfactory contradiction. Giving/asking comparison is preserved, without condemning every individual who asks.',
 V13:'Unsatisfactory withholding. Relevant 59:18 was retrieved. Model narrows the advice to its explicitly believing audience, while the ordinary question uses every person. Record key breadth ambiguity; no expected label is rewritten and no generic withholding counted as a complete answer.',
 V14:'Satisfactory contradiction. Listening/silence instruction rather than a command to continue talking; no detailed setting-specific ruling invented.',
 V15:'Satisfactory support. Hearts/deeds versus appearance/wealth, without asserting literal inability to perceive appearance.',
 V16:'Satisfactory support. Prayer for remembrance in 20:14.',
 V17:'Satisfactory support. Calamity response and return to Allah are retained.',
 V18:'Satisfactory contradiction. Charity does not diminish wealth in the report; no promised immediate bank-balance increase.',
 V19:'Satisfactory support. Resolve then reliance on Allah, retaining consultation context.',
 V20:'Satisfactory contradiction. Do not turn from those invoking their Lord for worldly adornment.',
 V21:'Satisfactory support. Speak good or be silent, with the report’s faith condition preserved.',
 V22:'Satisfactory support. Affirming Allah as Lord and remaining steadfast precede the reassuring angelic address.',
 V23:'Satisfactory contradiction. Knowingly mixing truth/falsehood and concealing truth are prohibited.',
 V24:'Satisfactory support. Kaab-specific narrated advice to keep some wealth, without a universal exact percentage.',
 V25:'Satisfactory support. Hold together to Allah’s rope and do not divide; no contemporary group judgment.',
 V26:'Unsatisfactory withholding. Correct source 8:46 absent from bounded primary and context packet even after recovery/discovery; retrieved partial passages cannot prove the question.',
 V27:'Unsatisfactory withholding. Needed remembrance-as-charity report 4558 absent. A general goodness-as-charity report does not directly settle the explicit remembrance clause; final fallback also fails source-blind decomposition review.',
 V28:'Satisfactory boundary handling. Flight booking is referred without attempting religious verification.',
 V29:'Satisfactory visible boundary handling. Code generation is referred without religious verification. Machine reason incorrectly says unsupported input language despite detected English; separately recorded defect, not a wrong religious answer.',
 V30:'Satisfactory boundary handling. Specific insulin/fainting fasting case referred for qualified personal advice.',
};
const failed=new Set(['V01','V13','V26','V27']);
const cases=run.cases.map(c=>({id:c.id,satisfactory:!failed.has(c.id),note:notes[c.id],label_match:c.label_match,source_bytes_and_nested_seals_passed:audit.cases.find(a=>a.id===c.id).source_bytes_and_nested_seals_passed,language_detection_correct:c.detected_language===data.cases.find(d=>d.id===c.id).language}));
if(cases.some(c=>!c.note||!c.source_bytes_and_nested_seals_passed))throw new Error('REVIEW_OR_MECHANICAL_AUDIT_MISSING');
const result={kind:'principal_developer_source_review_not_independent_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:30,answer_label_matches:audit.answer_label_matches,satisfactory_responses:cases.filter(c=>c.satisfactory).length,satisfactory_religious_answers:cases.slice(0,27).filter(c=>c.satisfactory).length,religious_questions:27,correct_visible_boundary_referrals:3,unexpected_in_scope_withholds:4,wrong_decisive_answers:0,source_and_seal_checks_passed:audit.source_and_seal_checks_passed,language_detection_correct:cases.filter(c=>c.language_detection_correct).length,threshold:data.threshold,release_gate_passed:false,run_settled_sar:audit.run_settled_sar,conservative_development_sar:run.final_development_sar,additional_defects:[{id:'V07',finding:'Auxiliary summary_ar contains Bengali mixed with Arabic rather than clean Arabic. Primary English meaning is correct. Result-translation endpoint, voice and native-language UI presentation were not executed in this run.'},{id:'V29',finding:'Detected English coding request classified as unsupported instead of general; reason code incorrectly INPUT_LANGUAGE_NOT_SUPPORTED. Generic visible referral is correct; this is a routing diagnostic defect.'}],limits:['Review covers verification decisions, original meaning and primary English explanation against admitted sources, not independent religious certification.','Nine-language input detection is tested; nine translated outputs, speech and native-language presentation are not thereby certified.','Themes and some references recur; no measured popularity ranking or independent native translation certification.','Frozen key, original scores and all failures retained. No production changes or repair retries during this run.'],cases};
result.release_gate_passed=result.satisfactory_responses>=27&&result.wrong_decisive_answers===0;
await writeFile('artifacts/release30-round2-principal-review-2026-10-05.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({...result,cases:undefined,limits:undefined,additional_defects:undefined}));
