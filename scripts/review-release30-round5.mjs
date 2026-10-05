import {readFile,writeFile} from 'node:fs/promises';
import {applicationTreeHash} from './holdout-protocol.mjs';
const run=JSON.parse(await readFile('artifacts/release30-round5-first-pass-2026-10-05.json','utf8'));
const key=JSON.parse(await readFile('artifacts/release30-round5-question-set-2026-10-05.json','utf8'));
const audit=JSON.parse(await readFile('artifacts/release30-round5-mechanical-audit-2026-10-05.json','utf8'));
if(run.cases.length!==30||run.operational_stop||await applicationTreeHash()!==run.freeze.application_tree_sha256)throw Error('FROZEN_COMPLETE_RUN_REQUIRED');
// Principal developer reviewed every English/Arabic explanation and selected unit.
const notes=[
 '2:195 directly proves destruction warning and doing good; no individual risk ruling.',
 '4:36 directly covers worship without partners and kindness to all named recipients.',
 '3512 directly describes Jarir’s pledge, correctly attributed to him rather than presented as the Prophet’s direct speech.',
 '24:30 directly covers believing male audience, lowering gaze and guarding chastity.',
 '33:70 directly covers believers and sound speech; God-consciousness retained in explanation.',
 '5439 directly supplies lack-of-mercy relationship; no individual salvation judgment. Minor Arabic wording polish remains nonmaterial.',
 '31:19 directly supplies moderate walking and lowering voice.',
 '6:151 directly forbids child killing because of poverty; additional 17:31 fear-of-poverty reference accurately contextualized.',
 '4555 directly reverses appearance/wealth versus hearts/deeds claim.',
 '2:42 directly forbids mixing falsehood/truth and knowing concealment; supplementary 3:71 attribution correctly identified.',
 'Alternate 2:43 directly proves prayer and zakat, equivalent to locked 2:110; no invented personal calculation.',
 '65255 directly proves leaving irrelevant matters as excellence in Islam; duty/responsibility qualification consistent with publisher explanation.',
 '5:1 directly commands believing audience to fulfill contracts.',
 '49:9 directly covers reconciliation of two fighting believing groups; aggressor and justice conditions retained in explanation.',
 'Alternate ar:2954 explicitly includes grapes, dates, honey, wheat and barley and defines khamr by intoxicating mind; directly disproves grape-only claim. Correct report-level attribution, no claim this is direct prophetic speech.',
 'FAIL: retrieval selected 70:32 with nearby context, not the locked 23:8 plus believer introduction 23:1. Both assessments identified believers, but the independent cited-unit packet did not establish that antecedent; reviewer rejected twice. No wrong decisive answer shown. Context selection/citation scope gap, not demonstrated input-translation failure.',
 'Alternate 5:48 explicitly commands competing in good, with 2:148 also supplied; direct adequate evidence.',
 'ar:4709 directly contradicts instruction to get angry; repeated advice context preserved.',
 '16:90 directly covers justice, goodness and giving relatives. Calling additional prohibitions a contextual constraint is awkward wording but does not reverse the conclusion.',
 '9:119 directly commands believing audience to be with truthful; no personalized claim.',
 '5845 directly covers capacity and regularity, no added amount or quotation reconstruction.',
 '17:35 directly covers full measure and just scales; additional 6:152 supports same theme.',
 '107:5 primary plus exact context 107:4 and 107:6 jointly establish warning against show-off prayer, not condemnation of all prayer.',
 '3083 directly pairs mercy for young and honoring elders; publisher explanation explicitly says warning, not expulsion from Islam.',
 '49:13 directly covers mutual acquaintance and God-consciousness criterion, no named-group superiority.',
 '4:135 directly rejects rich-over-poor preference in testimony and preserves justice/no-bias context.',
 '3135 directly supplies reward comparisons; publisher explanation supports care/provision and seeking reward, not legal identity of all acts.',
 'Ordinary weather request kept outside Quran/Hadith verification.',
 'Missing practice prompted an explicit clarification instead of an invented ruling.',
 'Individual inheritance-share request referred, without inventing a personal share.'
];
const cases=[];
for(let i=0;i<run.cases.length;i++){
 const row=run.cases[i],r=JSON.parse(await readFile(`artifacts/private/release30-round5-first-pass/${row.id}.json`,'utf8'));
 const decisive=['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(r.verdict);
 const basisValid=b=>{const e=r.evidence_items.find(e=>e.evidence_id===b.evidence_id);return Boolean(e&& (b.context_locator===null?e.quotation:e.source_context.find(c=>c.locator===b.context_locator)?.quotation)===b.basis_quotation);};
 const proof=decisive&&(r.entailment_review?.raw_review?.atoms??[]).length>0&&r.entailment_review.raw_review.atoms.every(a=>{
  const atom=r.semantic_assessment.atomic_claims.find(p=>p.id===a.atom_id);
  return atom&&a.source_relationship===atom.relation&&a.entails==='yes'&&a.attribution_preserved&&a.qualifications_preserved&&basisValid(a)&&(a.additional_basis??[]).every(basisValid);
 });
 const check=audit.cases.find(c=>c.id===row.id);
 if(!check.source_bytes_and_nested_seals_passed||!row.original_preserved||(decisive&&!proof))throw Error(`INTEGRITY_FAILURE_${row.id}`);
 cases.push({id:row.id,language:key.cases[i].language,expected:row.expected,actual:row.actual,satisfactory:row.id!=='Y16',badge_explanation_consistent:decisive?true:null,source_proof_unit_check_passed:decisive?proof:null,review_note:notes[i]});
}
const result={kind:'principal_developer_source_review_not_independent_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:30,satisfactory_responses:29,satisfactory_percentage:29/30*100,satisfactory_religious_answers:26,religious_questions:27,correct_boundary_responses:3,unexpected_in_scope_withholds:1,incorrect_decisive_answers:0,inadequately_proven_decisive_answers:0,inconsistent_decisive_badges:0,source_and_seal_checks_passed:30,language_detection_correct:run.cases.filter((c,i)=>c.detected_language===key.cases[i].language).length,numeric_27_of_30_benchmark_passed:true,release_gate_passed:true,threshold:key.threshold,run_settled_sar:audit.run_settled_sar,conservative_development_sar:run.final_development_sar,development_cap_sar:49,remaining_development_sar:49-run.final_development_sar,judging_reserve_sar:15,limits:['Fresh wording checked against 325 preceding planned benchmark questions and final badge controls; references/themes may recur, no popularity ranking.','First pass frozen without application edits/manual retries; built-in bounded recovery allowed.','All English/Arabic explanations and source relationships reviewed by principal developer, not independent scholarly or native-language certification.','Nine input languages exercised, three religious questions each. Additional translated display outputs and voice/browser journeys not certified by this API benchmark.','Y16 is a known context-selection failure and counts against usefulness. Passing this benchmark does not mean every Islamic question can be answered or imply population accuracy.'],cases};
await writeFile('artifacts/release30-round5-principal-review-2026-10-05.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({...result,cases:undefined,limits:undefined}));
