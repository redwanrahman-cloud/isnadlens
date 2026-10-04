import {afterEach,expect,it,vi} from 'vitest';
import {loadCorpus,sha256} from '../src/lib/corpus';
import {loadHadith,retrieveHadith} from '../src/lib/hadith';
import {retrieveWithPublishedEnglishAid,englishWords} from '../src/lib/retrieval';
import {sourceDecisionInstructions} from '../src/lib/source-decision';
import * as provider from '../src/lib/provider';
import * as planner from '../src/lib/query-planner';
import * as discovery from '../src/lib/web-discovery';
import {verifyClaimWithRecovery,verifySeal} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it('retrieves pregnancy maintenance within the real combined-source Quran allowance',()=>{
 const c=loadCorpus(),before=sha256(JSON.stringify(c.verses));
 const claim='هل يجب الإنفاق على المطلقة الحامل حتى تضع حملها؟';
 const gloss='Is financial support required for a divorced woman who is pregnant until she gives birth?';
 const hints=['نفقة المطلقة الحامل','الإنفاق على المطلقة','نفقة الحامل حتى تضع','حقوق المطلقة الحامل','support for pregnant divorcee','financial support for divorced woman','maintenance until childbirth','rights of pregnant divorcee'];
 expect(retrieveWithPublishedEnglishAid(c,claim,4,hints,gloss).verses.map(v=>v.id)).toContain('65:6');
 expect(sha256(JSON.stringify(c.verses))).toBe(before);
});
it.each([{claim:'Should Muslims greet only people they already know?',limit:2},{claim:'Is greeting strangers part of good conduct in Islam?',limit:4}])('finds the greeting report within the source allowance without AI hints: $claim',({claim,limit})=>{
 const c=loadHadith(),before=sha256(JSON.stringify(c.records));
 expect(retrieveHadith(c,claim,'en',limit).map(r=>r.id)).toContain('5808');
 expect(sha256(JSON.stringify(c.records))).toBe(before);
});
it('normalizes derived concepts without changing user qualifiers or source strings',()=>{
 expect(englishWords('maintain maintenance childbirth delivery pregnancy known')).toEqual(['support','support','birth','birth','pregnant','know']);
 const original='Should Muslims greet only people they already know?';englishWords(original);expect(original).toContain('only');
});
it('defines contradiction confirmation without the old support-only override',()=>{
 const p=sourceDecisionInstructions('decision');
 expect(p).toContain('A faithful false user proposition contradicted by the source receives entails=yes');
 expect(p).toContain('return entails=no even when it matches the source');
 expect(p).not.toContain('FINAL DECISION OVERRIDE');
 expect(p).not.toContain('yes only if complete assertion with its qualifications follows');
 expect(sourceDecisionInstructions('support')).toContain('Only proposed_relation=supports can receive entails=yes');
});
function incomplete(claim:string):SemanticAssessment{return {in_scope:true,original_meaning_preserved:true,all_material_claims_covered:false,summary_en:'Incomplete.',summary_ar:'غير كاف.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation:'unrelated',evidence_ids:[],direct:false,context_fit:false,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};}
it('propagates domain admission to recovery and permits bounded discovery after unusable model hints',async()=>{
 vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','true');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(provider,'assessClaim').mockImplementation(async claim=>({model:'fixture',usage:null,assessment:incomplete(claim)}));
 const planned=vi.spyOn(planner,'planClaimQueries').mockRejectedValue(new planner.QueryPlannerFailure('QUERY_PLAN_TERM_INVALID'));
 const searched=vi.spyOn(discovery,'discoverWebReferences').mockResolvedValue({version:'trusted-reference-discovery-v1',status:'completed',reason:'NO_AUTHENTICATED_LOCATORS',search_calls:1,model:'fixture',usage:null,pages:[],quran_locators:[],hadith_locators:[]});
 const claim='Should Muslims greet only people they already know?';
 const r=await verifyClaimWithRecovery({claim,inputLanguage:'en',scopeClaim:claim,admittedTextual:true,corpusSelection:'both'});
 expect(planned).toHaveBeenCalledWith({claim,inputLanguage:'en',admittedTextual:true});
 expect(searched).toHaveBeenCalledWith(claim,claim,'both',true);
 expect(verifySeal(r)).toBe(true);expect(r.verdict).toBe('insufficient_within_selected_corpus');
});
it('still stops bounded discovery after a recovery budget failure',async()=>{
 vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','true');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(provider,'assessClaim').mockImplementation(async claim=>({model:'fixture',usage:null,assessment:incomplete(claim)}));
 vi.spyOn(planner,'planClaimQueries').mockRejectedValue(new planner.QueryPlannerFailure('SPEND_BUDGET_STOP'));
 const searched=vi.spyOn(discovery,'discoverWebReferences');
 await verifyClaimWithRecovery({claim:'Should Muslims greet only people they already know?',inputLanguage:'en',admittedTextual:true,corpusSelection:'both'});
 expect(searched).not.toHaveBeenCalled();
});
