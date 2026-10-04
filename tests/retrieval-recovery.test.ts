import {afterEach,expect,it,vi} from 'vitest';
import {requestedSourceFamily} from '../src/lib/auto-verification';
import {retrieveWithPublishedEnglishAid} from '../src/lib/retrieval';
import {loadCorpus,sha256} from '../src/lib/corpus';
import {verifyClaim,verifyClaimWithRecovery,verifySeal} from '../src/lib/verification';
import {recordSchema,type SemanticAssessment} from '../src/lib/contracts';
import * as webDiscovery from '../src/lib/web-discovery';
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
 vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async (_claim,a,cards)=>({model:'fixture',usage:null,review:{explanation_preserved:true,atoms:a.atomic_claims.filter(x=>x.material).map(x=>({atom_id:x.id,entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:x.evidence_ids[0],context_locator:null,basis_quotation:cards.find(c=>c.evidence_id===x.evidence_ids[0])!.quotation}))}}));
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
it('rejects a contradiction whose atom silently reverses the original German question',async()=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(provider,'assessClaim').mockImplementation(async (_claim,_language,cards,model)=>{
 const source=cards.find(c=>c.locator==='18:23')!;const a=assessed('fixture');
 Object.assign(a.atomic_claims[0],{text:'Man soll nicht versprechen, morgen etwas ohne wenn Allah will zu tun.',relation:'contradicts',direct:true,context_fit:true,evidence_ids:[source.evidence_id],qualifications_preserved:true,contradiction_basis:'explicit_negation_or_incompatible_statement',basis_evidence_id:source.evidence_id,basis_quotation:source.quotation});
 return {model:model!,usage:null,assessment:a};
 });
 const review=vi.spyOn(provider,'reviewPositiveEntailment').mockResolvedValue({model:'fixture',usage:null,review:{explanation_preserved:true,atoms:[{atom_id:'a1',entails:'no',attribution_preserved:true,qualifications_preserved:false,evidence_id:null,context_locator:null,basis_quotation:null}]}});
 const result=await verifyClaim({claim:'Soll man laut Koran eine Tat für morgen versprechen, ohne wenn Allah will zu sagen?',inputLanguage:'de',scopeClaim:'Does the Quran tell people to promise doing something tomorrow without saying if Allah wills?',queryOverrides:{arabic_terms:['غدا'],english_terms:['tomorrow']}});
 expect(review.mock.calls[0][3]).toBe('decision');expect(result.verdict).toBe('not_evaluated');expect(result.reason_codes).toContain('CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED');expect(verifySeal(result)).toBe(true);
});
it('runs online discovery once after two local gaps and rechecks only immutable source cards',async()=>{
 vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','true');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 vi.spyOn(planner,'planClaimQueries').mockResolvedValue({arabic_terms:['العبادة'],english_terms:['worship'],model:'fixture',usage:null,planner_version:'fixture'});
 const discover=vi.spyOn(webDiscovery,'discoverWebReferences').mockResolvedValue({version:'trusted-reference-discovery-v1',status:'completed',reason:'PUBLISHER_REFERENCES_AUTHENTICATED',model:'fixture',usage:null,search_calls:1,pages:[],quran_locators:['51:56'],hadith_locators:[]});
 let calls=0;const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async (claim,_lang,cards)=>{
 const a=assessed(claim);if(++calls===3){a.all_material_claims_covered=true;const source=cards.find(c=>c.locator==='51:56')!;Object.assign(a.atomic_claims[0],{relation:'supports',direct:true,context_fit:true,evidence_ids:[source.evidence_id]});}
 return {model:'fixture',usage:null,assessment:a};
 });
 vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async (_claim,a,cards)=>({model:'fixture',usage:null,review:{explanation_preserved:true,atoms:a.atomic_claims.map(x=>({atom_id:x.id,entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:x.evidence_ids[0],context_locator:null,basis_quotation:cards.find(c=>c.evidence_id===x.evidence_ids[0])!.quotation}))}}));
 const claim='Does the Quran describe the purpose of worship?';const r=await verifyClaimWithRecovery({claim,inputLanguage:'en',corpusSelection:'quran'});
 expect(discover).toHaveBeenCalledOnce();expect(assess).toHaveBeenCalledTimes(3);expect(assess.mock.calls.every(c=>c[0]===claim)).toBe(true);expect(r.web_discovery?.verification_attempted).toBe(true);expect(r.verdict).toBe('supported_within_selected_corpus');
 expect(verifySeal(r)).toBe(true);expect(verifySeal(recordSchema.parse(r.web_discovery?.previous_record))).toBe(true);expect(r.evidence_items.find(e=>e.locator==='51:56')?.quotation).toBe(loadCorpus().verses.find(v=>v.id==='51:56')!.display);
});
