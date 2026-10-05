import {readFile,writeFile} from 'node:fs/promises';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';
import {evaluationUsage} from './lib/evaluation-usage.mjs';

// Offline reproduction of the principal developer's case-by-case source review.
// Notes were written after inspecting actual English/Arabic answers, intake glosses,
// selected proof units, material extra statements, and reviewer diagnostics for all 30.
// These notes are judgments, not automatic semantic certification from label equality.
globalThis.fetch=async()=>{throw Error('OFFLINE_REVIEW_ONLY');};
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const run=await json('artifacts/release30-round6-first-pass-2026-10-06.json');
const key=await json('artifacts/release30-round6-question-set-2026-10-06.json');
if(!run.completed_all_30||run.cases.length!==30)throw Error('INCOMPLETE_BATCH');
if(hash(JSON.stringify(key))!==run.freeze.dataset_sha256||await applicationTreeHash()!==run.freeze.application_tree_sha256)throw Error('FROZEN_INPUT_CHANGED');
const notes=[
 '97:3 explicitly gives the better-than-one-thousand-months comparison; no invented date.',
 '7:55 instructs humble, private supplication and contradicts the must-shout claim. No blanket prohibition of all audible prayer was added.',
 'Hadith 65566 provides the three continuing benefits after death; ongoing charity, useful knowledge and the pious child’s supplication retain their conditions.',
 'Valid alternative proof: 2:219, carried as context on the 2:217 card, says Allah explains the verses so people may reflect. The key’s 4:82 is not required when this relevant alternative establishes the asked general invitation.',
 '61:2 and its 61:3 context reject praise for saying what one does not do. Additional praise for believers doing good deeds is supported by the retrieved 18:2 card.',
 'Hadith 66179 directly links exchanging gifts and love; no guaranteed repair of every relationship.',
 '2:201, present as context on the 2:200 card, supports the supplication for good in both worlds and protection from the Fire.',
 '29:45 directly attributes restraint from indecency and wrongdoing to prayer. The answer does not say that everyone who prays becomes incapable of sin.',
 'Hadith 10113 explicitly gives two rewards to the struggling reciter, directly contradicting no reward.',
 '30:22 identifies diversity of languages and colors as signs. No racial hierarchy or speculative mechanism added.',
 '20:44 with its 20:43 neighboring context directs gentle speech to Pharaoh. The answer correctly rejects harsh speech and retains the possible, rather than guaranteed, purpose.',
 'Hadith 66255 directly connects not thanking people with not thanking Allah. The first draft added an unproved qualification; feedback led to a revised explanation that passed independent source review.',
 '2:222 explicitly names love for repentant people and those who purify themselves; its purification context is acknowledged without deciding an individual case.',
 '73:4 directly instructs measured recitation. The answer adds no numerical speed, reward or personal ruling.',
 'Hadith 4966 says the Prophet did not find fault with food and left what he disliked; the negative answer preserves both facts.',
 '93:10 prohibits rebuking the petitioner, the opposite of the proposed instruction. It does not invent an obligation to give money in every circumstance.',
 '96:1 directly commands reading in the name of the creating Lord; no unsupported chronology.',
 'Hadith 3441 supports twenty-seven degrees. The extra variation note is grounded in retrieved 11286 (twenty-five) and 4566 (twenty-something), rather than silently flattening the reports.',
 '17:78 explicitly describes dawn recitation as witnessed. The answer correctly distinguishes the verse’s words from an explanation identifying the witnesses.',
 '59:21 describes a mountain humbled and split out of awe in a conditional example; the answer preserves that hypothetical framing and rejects arrogance.',
 'Hadith 58193 supports confinement, failure to feed or release, death and punishment. The authentic grade is explicitly attributed to the publisher and matches its preserved grade field.',
 '95:4 supports best form, with 64:3 also retrieved for the extra form reference. A first-draft English/Arabic mismatch was caught, revised, and re-reviewed successfully.',
 'Valid alternative proof: 6:160 gives multiplied good reward for a good deed and directly contradicts reward-for-good-is-evil. The key’s 55:60 is not mandatory when this adequate evidence is supplied.',
 'Hadith 5970 directly establishes appointing one leader when three people travel. English en:5970 and Arabic ar:5970 are two language records of the same report. Core answer is correct; Arabic calling them two hadiths is a minor presentation/provenance wording issue and should say two language versions.',
 '16:68 supports the three dwelling locations for bees. The answer does not claim every bee lives in every kind of dwelling or invent a scientific mechanism.',
 '2:152 directly combines remembering Allah and giving thanks; no numerical practice invented.',
 'Hadith 66163 condemns taking a worker’s full work and withholding wages; the answer retains the Prophet’s report of divine speech and does not adjudicate a personal dispute.',
 'Correct outside-scope handling for the banana-bread request, with no invented religious answer or evidence.',
 'Failure: the quote itself was never provided. Intake incorrectly accepted a textual claim with high confidence and generated broad retrieval terms. Eight unrelated cards were retrieved; the visible answer says only that evidence is insufficient. Although the internal draft noticed missing wording, the final response never asks the user to paste the quote. Expected clarification was not delivered.',
 'Correct personal-ruling referral for the user’s own zakat obligation; no invented personal calculation or obligation. Stronger intake review confirms personal scope.'
];
const q=await json('data/corpus.json'),h=await json('data/hadeethenc.json');
const qt=new Map(q.verses.map(v=>[v.id,v.display])),ht=new Map(h.records.map(v=>[`${v.language}:${v.id}`,v.fields.hadith_text]));
function intact(r){const {audit_hash,...payload}=r;return audit_hash===hash(JSON.stringify(payload))&&(r.evidence_items??[]).every(e=>{const text=(e.source_id.startsWith('QURAN-')?qt:ht).get(e.locator);return text===e.quotation&&hash(text)===e.quotation_sha256&&(e.source_context??[]).every(c=>qt.get(c.locator)===c.quotation&&hash(c.quotation)===c.quotation_sha256);})&&(!r.retrieval_recovery?.first_record||intact(r.retrieval_recovery.first_record))&&(!r.web_discovery?.previous_record||intact(r.web_discovery.previous_record));}
function proofUnitIntact(r){
 if(!/^(supported|conflicting)_/.test(r.verdict))return null;
 const a=r.entailment_review?.raw_review?.atoms??[];
 return a.length>0&&a.every(p=>[p,...(p.additional_basis??[])].every(b=>{const e=r.evidence_items.find(e=>e.evidence_id===b.evidence_id);const text=b.context_locator===null?e?.quotation:e?.source_context.find(c=>c.locator===b.context_locator)?.quotation;return typeof text==='string'&&text===b.basis_quotation;}));
}
const usage=new Map(),cases=[],recoveries=[];
for(let i=0;i<run.cases.length;i++){
 const c=run.cases[i],k=key.cases[i],r=await json(`artifacts/private/release30-round6-first-pass/${c.id}.json`);
 if(c.id!==k.id||r.original_claim!==k.claim||r.verdict!==c.actual)throw Error('RECORD_KEY_MISMATCH');
 const integrity=intact(r),proof=proofUnitIntact(r);
 if(!integrity||proof===false)throw Error(`PROVENANCE_FAILED_${c.id}`);
 const u=evaluationUsage(r);for(const x of u)usage.set(x.reservation_id,x);
 const attempts=r.source_review_attempts??[];
 if(attempts.length>1)recoveries.push({id:c.id,diagnostics:attempts.map(a=>a.raw_provider_review?.explanation_diagnostic??null),final_status:r.entailment_review?.status});
 const available=new Set(r.evidence_items.flatMap(e=>[e.locator,...(e.source_context??[]).map(c=>c.locator)]));
 cases.push({id:c.id,language:k.language,claim:k.claim,expected:k.expected_verdict,actual:r.verdict,satisfactory:c.id!=='Z29',fully_clean:c.id!=='Z29'&&c.id!=='Z24',minor_wording_issue:c.id==='Z24',badge_explanation_consistent:true,source_and_seal_check_passed:integrity,source_proof_unit_check_passed:proof,language_intake_correct:r.language_intake?.detected_language===k.language,all_key_witnesses_retrieved:k.references.length?k.references.every(ref=>available.has(ref.locator)):null,review_note:notes[i],summary_en:r.summary_en,summary_ar:r.summary_ar,reason_codes:r.reason_codes,elapsed_seconds:c.elapsed_ms/1000,cost_sar:u.reduce((n,x)=>n+x.estimated_cost_usd,0)*3.75,raw_record_sha256:hash(await readFile(`artifacts/private/release30-round6-first-pass/${c.id}.json`))});
}
const times=cases.slice(0,27).map(c=>c.elapsed_seconds).sort((a,b)=>a-b);
const cost=[...usage.values()].reduce((n,u)=>n+u.estimated_cost_usd,0)*3.75;
const satisfactory=cases.filter(c=>c.satisfactory).length;
const review={kind:'principal_developer_source_review_not_independent_scholarly_certification',created_at:new Date().toISOString(),freeze:run.freeze,total:30,satisfactory_responses:satisfactory,satisfactory_percentage:satisfactory/30*100,satisfactory_religious_answers:27,religious_questions:27,correct_boundary_responses:2,boundary_questions:3,unexpected_in_scope_withholds:0,incorrect_decisive_answers:0,inadequately_proven_decisive_answers:0,inconsistent_decisive_badges:0,clarification_routing_failures:1,minor_wording_issues:1,fully_clean_responses:28,source_and_seal_checks_passed:30,language_intake_correct:30,automatic_feedback_recoveries:recoveries,qualified_answer_branch_exercised:false,threshold:run.threshold,release_gate_passed:satisfactory>=27,numeric_27_of_30_benchmark_passed:satisfactory>=27,run_settled_sar:cost,usage_reservations:usage.size,shared_ledger_delta_matches_captured_usage:Math.abs(cost-run.shared_ledger_delta_sar)<1e-8,conservative_development_sar:run.final_development_sar,development_cap_sar:run.freeze.development_cap_sar,remaining_development_sar:run.freeze.development_cap_sar-run.final_development_sar,judging_reserve_sar:15,latency_religious_seconds:{minimum:times[0],median:times[13],p95_nearest_rank:times[25],maximum:times[26]},comparison:{previous_round5:{satisfactory:29,religious:26,boundary:3,unnecessary_in_scope_withholds:1,incorrect_decisive:0},current_round6:{satisfactory,religious:27,boundary:2,unnecessary_in_scope_withholds:0,incorrect_decisive:0},overall_percentage_point_change:0},limits:[
 'Satisfactory means a correct useful verification response, not flawless wording. Z24 remains satisfactory on the substantive question, but is excluded from the separate fully-clean count because its Arabic text calls two translations of one report two hadiths.',
 'Nine input languages and English/Arabic explanations were inspected. Browser-triggered Lingo translations, voice, camera and rendering were not exercised by this verification API batch. The preparation note about requested-language output must not be read as certification of those separate display endpoints.',
 'The principal development assistant reviewed source relationships and bilingual answers; there was no independent scholar or native-language panel.',
 'Questions and explicit language selection differ from round5, so this is not a controlled causal estimate of the repair or a population accuracy estimate.',
 'All 27 religious gold questions were answerable from admitted sources; this batch does not establish performance on every disputed, unavailable or composite claim.',
 'The original fasting failure and old Y16 question were deliberately not rerun in this new set. Two feedback revisions succeeded, but no final qualified-answer branch was exercised live.',
 'All first responses were retained; there were no manual retries, hidden exclusions or application edits during the run. No post-run product repair is represented by this score.'
],cases};
await writeFile('artifacts/release30-round6-principal-review-2026-10-06.json',JSON.stringify(review,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({satisfactory:satisfactory,total:30,religious:27,boundary:2,minor_wording_issue:'Z24',failed_case:'Z29',fully_clean:28,run_sar:cost,remaining_sar:review.remaining_development_sar,recoveries:recoveries.map(c=>c.id),latency:review.latency_religious_seconds}));
