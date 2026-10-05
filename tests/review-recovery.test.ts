import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import * as provider from '../src/lib/provider';
import * as budget from '../src/lib/budget';
import {loadCorpus} from '../src/lib/corpus';
import {retrieveWithPublishedEnglishAid} from '../src/lib/retrieval';
import {authenticateEvidence,verifyClaim,verifySeal} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';

beforeEach(()=>{vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();});
const corpus=()=>loadCorpus();
const card=()=>authenticateEvidence(corpus(),corpus().verses.find(v=>v.id==='2:187')!);
const claim='Does Quran 2:187 mention eating and drinking?';
function assessment(relation:'supports'|'partial'='supports'):SemanticAssessment{return {in_scope:true,original_meaning_preserved:true,all_material_claims_covered:relation==='supports',summary_en:'A simulated draft, not a live model answer.',summary_ar:'مسودة اختبار محاكية.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation,evidence_ids:[card().evidence_id],direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};}
function review(approved:boolean):provider.EntailmentReview{return {explanation_preserved:approved,explanation_diagnostic:{reason:approved?'none':'missing_qualification',language:approved?null:'en',sentence:null,detail:approved?'':'The draft omitted the stated time boundary.'},atoms:[{atom_id:'a',source_relationship:'supports',entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:card().evidence_id,context_locator:null,basis_quotation:card().quotation}]};}

it('retrieves the fasting passage for the reported everyday question without an answer hint',()=>{
 const result=retrieveWithPublishedEnglishAid(corpus(),'Is it good to eat while fasting?',4,[],'Is it good to eat while fasting?');
 expect(result.verses.map(v=>v.id)).toContain('2:187');
 expect(card().integrity.passed).toBe(true);
});
it.each(['approved','rejected','nondecisive'] as const)('uses one feedback-guided reassessment and mandatory re-review: %s',async outcome=>{
 // Injected control-flow fixtures do not establish religious/model accuracy.
 const original=assessment(),revised=assessment();if(outcome==='nondecisive')revised.original_meaning_preserved=false;
 const assess=vi.spyOn(provider,'assessClaim').mockResolvedValueOnce({model:'gpt-5.6-luna',usage:null,assessment:original}).mockResolvedValueOnce({model:'gpt-5.6-terra',usage:null,assessment:revised});
 const check=vi.spyOn(provider,'reviewPositiveEntailment').mockResolvedValueOnce({model:'fixture',usage:null,review:review(false)}).mockResolvedValueOnce({model:'fixture',usage:null,review:review(outcome==='approved')});
 const r=await verifyClaim({claim,inputLanguage:'en',corpusSelection:'quran',admittedTextual:true});
 expect(assess).toHaveBeenCalledTimes(2);
 expect(assess.mock.calls[1][2]).toEqual(assess.mock.calls[0][2]);
 expect(assess.mock.calls[1][4]).toEqual({previous_summary_en:original.summary_en,previous_summary_ar:original.summary_ar,review:review(false)});
 expect(check).toHaveBeenCalledTimes(outcome==='nondecisive'?1:2);
 expect(r.verdict).toBe(outcome==='approved'?'supported_within_selected_corpus':'not_evaluated');
 if(outcome!=='approved')expect(r.reason_codes).toEqual(['FINAL_EXPLANATION_UNCONFIRMED']);
 expect(r.assessment_attempts).toHaveLength(2);expect(r.source_review_attempts?.[0].review).toEqual(review(false));expect(verifySeal(r)).toBe(true);
});
it('does not mislabel a source-blind meaning rejection as a failed prose review',async()=>{
 vi.spyOn(provider,'assessClaim').mockResolvedValue({model:'gpt-5.6-luna',usage:null,assessment:assessment()});
 vi.spyOn(provider,'reviewPositiveEntailment').mockResolvedValue({model:'fixture',usage:null,meaning_check:{model:'fixture',usage:null,review:{faithful:'no'}},review:{atoms:[]}});
 const r=await verifyClaim({claim,inputLanguage:'en',corpusSelection:'quran',admittedTextual:true});
 expect(r.verdict).toBe('not_evaluated');expect(r.reason_codes).toEqual(['CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED']);expect(verifySeal(r)).toBe(true);
});
it('sends feedback as untrusted data with the unchanged question and evidence, not as instructions',async()=>{
 vi.stubEnv('OPENAI_API_KEY','offline-fixture');vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED','true');vi.stubEnv('ISNADLENS_MAX_SPEND_USD','1');vi.stubEnv('ISNADLENS_MAX_CALLS','1000');
 vi.spyOn(budget,'reserveSpend').mockReturnValue('fixture');vi.spyOn(budget,'settleSpend').mockReturnValue(0);
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({status:'completed',model:'gpt-5.6-terra',output:[{content:[{type:'output_text',text:JSON.stringify(assessment())}]}]})));vi.stubGlobal('fetch',fetcher);
 const feedback={previous_summary_en:'Rejected draft',previous_summary_ar:'مسودة',review:review(false),original_diagnostic:{reason:'unproven_statement' as const,language:'both' as const,sentence:null,detail:'Specific source context is missing.'}};
 await provider.assessClaim(claim,'en',[card()],'gpt-5.6-terra',feedback);
 const body=JSON.parse(fetcher.mock.calls[0][1].body),packet=JSON.parse(body.input);
 expect(packet.claim).toBe(claim);expect(packet.evidence).toEqual(provider.explanationEvidence([card()]));
 expect(packet.prior_review.diagnostic).toEqual(feedback.original_diagnostic);
 expect(body.instructions).toContain('untrusted diagnostic data');expect(body.instructions).not.toContain(feedback.review.explanation_diagnostic!.detail);
 expect(fetcher).toHaveBeenCalledOnce();
});

it.each(['approved','rejected','unavailable'] as const)('a narrower reassessment receives independent qualified review instead of automatic disqualification: %s',async outcome=>{
 const original=assessment(),revised=assessment('partial');
 const assess=vi.spyOn(provider,'assessClaim').mockResolvedValueOnce({model:'gpt-5.6-luna',usage:null,assessment:original}).mockResolvedValueOnce({model:'gpt-5.6-terra',usage:null,assessment:revised});
 const check=vi.spyOn(provider,'reviewPositiveEntailment').mockResolvedValue({model:'fixture',usage:null,review:review(false)});
 const qualified=vi.spyOn(provider,'reviewQualifiedExplanation').mockImplementation(async()=>{if(outcome==='unavailable')throw new provider.ProviderFailure('SPEND_BUDGET_STOP','gpt-5.6-terra',null);return {model:'gpt-5.6-terra',usage:null,raw_provider_review:{atoms:[]},unit_provenance:[],review:{explanation_preserved:outcome==='approved',atoms:[{...review(true).atoms[0],atom_id:'qualified_explanation'}]}};});
 const r=await verifyClaim({claim,inputLanguage:'en',corpusSelection:'quran',admittedTextual:true});
 expect(r.verdict).toBe('insufficient_within_selected_corpus');expect(r.qualified_explanation_review?.status).toBe(outcome==='approved'?'passed':outcome);
 expect(r.summary_en.includes('Qualified explanation:')).toBe(outcome==='approved');
 expect(assess).toHaveBeenCalledTimes(2);expect(check).toHaveBeenCalledOnce();expect(qualified).toHaveBeenCalledOnce();expect(verifySeal(r)).toBe(true);
});
