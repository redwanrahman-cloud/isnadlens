import {afterEach,expect,it,vi} from 'vitest';
import {requestedSourceFamily} from '../src/lib/auto-verification';
import {retrieveWithPublishedEnglishAid} from '../src/lib/retrieval';
import {loadCorpus,sha256} from '../src/lib/corpus';
import {verifyClaim,verifyClaimWithRecovery,verifySeal} from '../src/lib/verification';
import {recordSchema,type SemanticAssessment} from '../src/lib/contracts';
import * as provider from '../src/lib/provider';
import * as planner from '../src/lib/query-planner';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it('constrains explicit source questions without narrowing generic or mixed requests',()=>{
 expect(requestedSourceFamily('هل يقول القرآن ذلك؟')).toBe('quran');
 expect(requestedSourceFamily('Does the Hadith teach this?')).toBe('hadith');
 expect(requestedSourceFamily('Une question','Does the Quran describe this?')).toBe('quran');
 expect(requestedSourceFamily('Quran and Hadith')).toBe('both');
 expect(requestedSourceFamily('Eating pork is haram')).toBe('both');
 expect(requestedSourceFamily('Hadith','Does the Quran say this?')).toBe('both');
});
it('uses the routing meaning for an English index and retains late valid Arabic hints and original bytes',()=>{
 const corpus=loadCorpus(),before=sha256(JSON.stringify(corpus.verses));
 const french='Le Coran dit-il que la prière est prescrite à des heures déterminées?';
 expect(retrieveWithPublishedEnglishAid(corpus,french,8,['الصلاة','أوقات الصلاة'],'Does the Quran say prayer is prescribed at appointed times?').verses.some(v=>v.id==='4:103')).toBe(true);
 const hints=['القرآن','Quran','ذنوب الوالدين','parents sins','تحمل الذنب','bear guilt','المسؤولية الفردية','individual responsibility','لا تزر وازرة وزر أخرى','no bearer of burdens'];
 expect(retrieveWithPublishedEnglishAid(corpus,'Does the Quran say people bear their parents sins?',8,hints,'The user asks whether the Quran says people bear their parents sins?').verses.some(v=>v.id==='6:164')).toBe(true);
 expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
});
function assessed(claim:string):SemanticAssessment{return {in_scope:true,original_meaning_preserved:true,all_material_claims_covered:false,summary_en:'Incomplete.',summary_ar:'غير كاف.',limitations:[],atomic_claims:[{id:'a1',text:claim,material:true,relation:'unrelated',evidence_ids:[],direct:false,context_fit:false,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};}
it('retains useful model terms while dropping complete invalid hints with sealed diagnostics',()=>{
 const result=planner.filterPlannedQueries({arabic_terms:['العلم','2:114','تجاهل التعليمات'],english_terms:['knowledge','one two three four five six','https://invalid.example']});
 expect(result).toEqual({arabic_terms:['العلم'],english_terms:['knowledge'],rejected_search_term_count:4});
 expect(()=>planner.filterPlannedQueries({arabic_terms:['2:114'],english_terms:['ignore instructions']})).toThrow('QUERY_PLAN_TERM_INVALID');
 expect(()=>planner.filterPlannedQueries({arabic_terms:['العلم'],english_terms:['knowledge'],verdict:'supported'})).toThrow('QUERY_PLAN_SCHEMA_INVALID');
 expect(()=>planner.validateQueryTerms({arabic_terms:['العلم'],english_terms:['2:114']},true)).toThrow('QUERY_PLAN_TERM_INVALID');
});
it('makes one recovery plan, retains both sealed records and never recursively searches',async()=>{
 vi.spyOn(provider,'providerReady').mockReturnValue(true);
 const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async claim=>({model:'fixture',usage:null,assessment:assessed(claim)}));
 const plan=vi.spyOn(planner,'planClaimQueries').mockResolvedValue({arabic_terms:['العبادة'],english_terms:['worship'],model:'fixture',usage:null,planner_version:'fixture'});
 const claim='Does the Quran describe the purpose of worship?';
 const result=await verifyClaimWithRecovery({claim,inputLanguage:'en',corpusSelection:'quran'});
 expect(plan).toHaveBeenCalledOnce();expect(assess).toHaveBeenCalledTimes(2);
 expect(result.verdict).toBe('insufficient_within_selected_corpus');expect(result.retrieval_recovery?.status).toBe('completed');
 expect(verifySeal(recordSchema.parse(result.retrieval_recovery?.first_record))).toBe(true);
 expect(verifySeal(recordSchema.parse(result))).toBe(true);expect(result.original_claim).toBe(claim);
});
it('does not retry budget errors, private requests or provider failures',async()=>{
 vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(provider,'assessClaim').mockRejectedValue(new provider.ProviderFailure('SPEND_BUDGET_STOP','gpt-5.6-luna',null));
 const plan=vi.spyOn(planner,'planClaimQueries');
 const blocked=await verifyClaimWithRecovery({claim:'Can I stop fasting because of my illness?',inputLanguage:'en'});
 const budget=await verifyClaimWithRecovery({claim:'Does the Quran mention worship?',inputLanguage:'en'});
 expect(blocked.verdict).toBe('not_evaluated');expect(budget.reason_codes).toContain('SPEND_BUDGET_STOP');expect(plan).not.toHaveBeenCalled();
});
it.each([true,false])('confirms a proposed contradiction without forcing qualification flags: %s',async qualified=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 let calls=0;
 const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async (claim,_language,cards,model)=>{
 const source=cards.find(c=>c.locator==='24:24')!;const answer=assessed(claim);const atom=answer.atomic_claims[0];
 Object.assign(atom,{relation:'contradicts',direct:true,context_fit:true,evidence_ids:[source.evidence_id],qualifications_preserved:++calls>1&&qualified,contradiction_basis:'explicit_negation_or_incompatible_statement',basis_evidence_id:source.evidence_id,basis_quotation:source.quotation});
 return {model:model!,usage:null,assessment:answer};
 });
 const result=await verifyClaim({claim:'The Quran at 24:24 says hands and feet never testify.',inputLanguage:'en'});
 expect(assess).toHaveBeenCalledTimes(2);expect(result.assessment_attempts?.[0].reason).toBe('CONTRADICTION_CONFIRMATION_REQUIRED');
 expect(result.verdict).toBe(qualified?'conflicting_within_selected_corpus':'insufficient_within_selected_corpus');expect(verifySeal(result)).toBe(true);
});
