import {readFile,writeFile} from 'node:fs/promises';
import {applicationTreeHash} from './holdout-protocol.mjs';
const run=JSON.parse(await readFile('artifacts/release30-round4-first-pass-2026-10-05.json','utf8'));
const key=JSON.parse(await readFile('artifacts/release30-round4-question-set-2026-10-05.json','utf8'));
const audit=JSON.parse(await readFile('artifacts/release30-round4-mechanical-audit-2026-10-05.json','utf8'));
if(run.cases.length!==30||run.operational_stop||await applicationTreeHash()!==run.freeze.application_tree_sha256)throw Error('FROZEN_COMPLETE_RUN_REQUIRED');
// Principal developer manually reviewed every English/Arabic explanation and selected proof.
// These recorded judgments are not inferred merely from labels or the model's own review.
const notes=[
 '60:8 directly supports kindness/justice with both non-fighting/non-expulsion conditions; 60:9 context preserved.',
 '4:58 directly commands returning trusts; added justice clause also in that verse.',
 '5326 directly separates true backbiting from false slander; explanation does not claim every legitimate warning prohibited.',
 '7:31 directly combines eating/drinking and avoiding excess.',
 '16:125 directly specifies wisdom/good admonition; best disputation is also present.',
 '4717 primary report supports brother/self comparison; complete faith and religious/worldly goodness correctly attributed to publisher explanation.',
 '17:23 directly forbids uff/rebuking parents in the specified old-age context.',
 '25:63 directly supports humble walking and peaceful reply; both atoms have same adequate primary unit.',
 '5348 directly supports not belittling small good deeds and cheerful meeting example.',
 '4:29 directly supplies unjust-consumption prohibition and mutual-consent trade exception; explanation avoids claiming consent alone legalizes all trade.',
 '49:12 directly reverses the proposed instruction and retains much suspicion rather than declaring all suspicion sinful.',
 '3709 directly states best neighbor is best to neighbor; correctly identifies source records.',
 '2:256 explicitly denies religious compulsion; quoted fighting context does not override it in this assessment.',
 '31:18 directly supports both arrogance prohibitions; additional 17:37 context supports walking clause.',
 '3772 primary report covers lawful spending and wisdom judging/teaching; praiseworthy emulation is consistent with publisher explanation.',
 '2:177 rejects reducing righteousness to east/west; no denial of prayer orientation.',
 '17:36 supplies both pursuit-without-knowledge prohibition and hearing/sight/heart accountability.',
 'Alternative record en:66526 directly contains purity half faith, equivalent to locked en:65004. Publisher grade attributed, not independently authenticated.',
 '41:34 supplies repel with better and friendship comparison; explanation does not abolish legal remedies.',
 '4:135 supports just testimony even against self/parents/relatives; warning against inclination also explicit.',
 '5806 explicitly reports Bedouin incident and sent to facilitate, not make difficult; no claim all obligations optional.',
 '8:27 directly forbids knowing betrayal of trusts by believing audience.',
 '2:168 directly contains lawful/good food and not following Satan steps.',
 'FAIL: retrieved 4801 directly disproves the affirmative lineage proposition, and both explanations correctly answer No. Assessment instead marked relation supports, and independent reviewer accepted it, yielding supported badge. Correct prose does not excuse inconsistent decisive classification. Routing gloss was accurate; this is question-polarity/answer-vs-proposition inconsistency, not missing source or translation failure.',
 '42:38 directly supports consultation and spending; no invented political structure.',
 'Alternative verse 6:164 directly supplies no bearer carries another burden, equivalent to locked 53:38; appropriate contrary verdict.',
 '3024 explicitly denies stone power; both summaries correctly attribute statement to Umar and his following prophetic practice.',
 'Ordinary photo-renaming coding request kept outside supported source-verification scope.',
 'Unspecified action prompted a clear clarification rather than invented ruling.',
 'Individual divorce-status question received personal-ruling referral, no individualized marital ruling.'
];
const cases=[];
for(let i=0;i<run.cases.length;i++){
 const row=run.cases[i],r=JSON.parse(await readFile(`artifacts/private/release30-round4-first-pass/${row.id}.json`,'utf8'));
 const proofUnits=(r.entailment_review?.raw_review?.atoms??[]).every(a=>{
  const e=r.evidence_items.find(e=>e.evidence_id===a.evidence_id);
  return e&&a.entails==='yes'&&a.attribution_preserved&&a.qualifications_preserved&&(a.context_locator?e.source_context.find(c=>c.locator===a.context_locator)?.quotation:e.quotation)===a.basis_quotation;
 });
 const check=audit.cases.find(c=>c.id===row.id);
 if(!check.source_bytes_and_nested_seals_passed||!row.original_preserved||!proofUnits)throw Error(`INTEGRITY_FAILURE_${row.id}`);
 cases.push({id:row.id,language:key.cases[i].language,expected:row.expected,actual:row.actual,satisfactory:row.id!=='X24',explanation_meaning_correct:true,verdict_explanation_consistent:row.id!=='X24',source_proof_unit_check_passed:true,review_note:notes[i]});
}
const result={kind:'principal_developer_source_review_not_independent_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:30,satisfactory_responses:29,satisfactory_percentage:29/30*100,satisfactory_religious_answers:26,religious_questions:27,correct_boundary_responses:3,unexpected_in_scope_withholds:0,incorrect_religious_explanations:0,inconsistent_decisive_badges:1,source_and_seal_checks_passed:30,language_detection_correct:run.cases.filter((c,i)=>c.detected_language===key.cases[i].language).length,numeric_27_of_30_benchmark_passed:true,release_gate_passed:false,threshold:key.threshold,run_settled_sar:audit.run_settled_sar,conservative_development_sar:run.final_development_sar,development_cap_sar:44,remaining_development_sar:44-run.final_development_sar,judging_reserve_sar:15,limits:['Fresh wording checked against all 295 preceding planned benchmark questions; themes/references may recur. No ranked popularity claim.','Frozen first pass: no application edits or answer-failure retries. Built-in bounded recovery retained.','Principal developer source and explanation review; not independent scholarly/native-language certification or population accuracy.','Nine input languages tested. Additional translated display outputs, voice and browser journeys were not exercised by this API benchmark.','29/30 numerical threshold passed; zero-wrong-decisive gate failed because X24 badge misclassifies the original proposition despite correct explanation.'],cases};
await writeFile('artifacts/release30-round4-principal-review-2026-10-05.json',JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({...result,cases:undefined,limits:undefined}));
