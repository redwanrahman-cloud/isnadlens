import {readFile,writeFile} from 'node:fs/promises';
const run=JSON.parse(await readFile('artifacts/web50-first-pass-2026-10-04.json','utf8'));
if(!run.completed_at||run.cases.length!==50)throw new Error('RUN_INCOMPLETE');
// Explicit IDs reviewed by the principal against original question, atoms,
// cited source and summary. Never infer grounding from label agreement alone.
const grounded=new Set([2,3,8,9,13,14,15,16,17,18,19,21,25,28,31,35,37,41,43,44,47,50].map(n=>`T${String(n).padStart(2,'0')}`));
const notes={
 T01:'Generic first-person question about permitted trade in Hajj was treated as a personal ruling before language routing. A personal-case guard must distinguish ordinary learning from individualized rulings.',
 T11:'Generic shaving-rule question mentions an illness exception without identifying a patient, but native health screening blocked it.',
 T21:'The answer and atom cite the correct general treatment instruction. The summary mentions a manifest-indecency qualification in the surrounding context; future summaries should attach exceptions to their actual clause to avoid ambiguity.',
 T23:'Local retrieval missed the directly relevant 24:15. Web search opened QuranEnc /fa/ and /as/ verse pages, but the adapter restricts publisher UI locales to the nine input languages, so these exact verse URLs supplied no locator. Distinguish source UI language from user input language.',
 T29:'Correct original German proposition and 28:77 contradiction reached the decision guard, which rejected the relationship. Public claim received no answer; do not disable the guard just to obtain a pass.',
 T34:'Third-person generic pregnancy-maintenance question was screened as private health information before routing despite containing no identifiable patient facts.',
 T36:'Direct 6209 evidence distinguishes beauty from arrogance; the preserved original proposition was correctly contradicted but the additional decision guard rejected it.',
 T37:'Main assertion is in the hadith quotation; the additional pure-devotion sentence is supplied publisher explanation, not an additional literal Prophetic quotation.',
 T38:'A first-person ordinary shoe-order learning question was blocked as a personal ruling.',
 T40:'The intake classified the Spanish source-based yawning question as textual, but its English first-person gloss was blocked as a personal ruling.',
 T42:'The original German hard-versus-easy proposition was preserved and 5806 explicitly contradicts it; the additional decision guard rejected the relationship.',
 T46:'The intake accepted the public question, but the later keyword whitelist misses plural Muslims and rejected it.',
 T47:'Accepted alternative admitted ar:10103 rather than requiring the frozen en:5653 witness. The answer preserves the eating-manners conditions and does not make blanket unsafe-food recommendations.',
 T49:'The routing gloss retained Islamic teaching, yet the later domain keyword gate rejected it; adjective Islamic is not handled consistently with Islam.',
 T50:'A directly evidenced report of the Prophet eating chicken contradicts categorical prohibition. The answer excludes personal slaughter and ingredient cases.',
};
const cases=run.cases.map(row=>{
 const accepted=grounded.has(row.id);
 if(accepted&&!row.label_match)throw new Error(`REVIEW_DISAGREES_WITH_RUN:${row.id}`);
 const issue_family=accepted?'none':row.id==='T23'?'retrieval_and_publisher_locale':row.reason_codes.includes('CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED')?'decision_guard_false_abstention':row.reason_codes.includes('OUTSIDE_SUPPORTED_CLAIM_SCOPE')?'keyword_scope_overfilter':'personal_or_health_overfilter';
 return {id:row.id,full_reasoning_grounded:accepted,issue_family,note:notes[row.id]??(accepted?'Original proposition, cited passage and final answer align in principal review.':'Language intake accepts the question as textual, but the later keyword domain gate blocks it before evidence verification.')};
});
await writeFile('artifacts/web50-principal-review-2026-10-04.json',JSON.stringify({reviewer:'Principal agent, not independent scholar/native-language expert',reviewed_at:new Date().toISOString(),first_pass_unchanged:true,cases},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reviewed:cases.length,grounded:cases.filter(c=>c.full_reasoning_grounded).length}));
