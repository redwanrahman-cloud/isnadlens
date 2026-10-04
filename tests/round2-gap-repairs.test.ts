import {afterEach,expect,it,vi} from 'vitest';
import {loadCorpus} from '../src/lib/corpus';
import {loadHadith,retrieveHadith} from '../src/lib/hadith';
import {retrieveWithPublishedEnglishAid} from '../src/lib/retrieval';
import {collectiveMeaningInstructions,sourceDecisionInstructions} from '../src/lib/source-decision';
import * as provider from '../src/lib/provider';
import * as planner from '../src/lib/query-planner';
import * as discovery from '../src/lib/web-discovery';
import {verifyClaimWithRecovery,verifySeal} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it.each(['Does the Quran warn that disagreement among yourselves can lead to failure and loss of strength?','Does disagreement weaken a community according to the Quran?'])('retrieves the dispute consequence within the real four-Quran-card allowance: %s',gloss=>{
 const hits=retrieveWithPublishedEnglishAid(loadCorpus(),'Warnt der Koran vor Streit und Verlust der Kraft?',4,['التنازع والفشل','loss of strength','disagreement'],gloss).verses;
 expect(hits.map(v=>v.id)).toContain('8:46');
});
it.each(['Does the Hadith claim that only money counts as charity and that praises of Allah do not count?','Can praise of Allah be charity without giving money?'])('retrieves explicit nonfinancial charity within two English reports: %s',claim=>{
 expect(retrieveHadith(loadHadith(),claim,'en',2,['charity beyond money','remembrance of Allah','تسبيح الله']).map(r=>r.id)).toContain('4558');
});
it('defines collective clause coverage without removing source confirmation or reversal checks',()=>{
 expect(collectiveMeaningInstructions).toContain('COLLECTIVELY');expect(collectiveMeaningInstructions).toContain('faithful=no');
 expect(collectiveMeaningInstructions).toContain('never source support');expect(sourceDecisionInstructions('support')).toContain('individual clause');
});
const claim='کیا قرآن ہر شخص کو دیکھنے کی نصیحت کرتا ہے کہ اس نے آخرت کے لیے کیا آگے بھیجا ہے؟';
const options={claim,inputLanguage:'ur' as const,scopeClaim:'Does the Quran advise every person to look at what they have sent ahead for the Hereafter?',admittedTextual:true,corpusSelection:'quran' as const,queryOverrides:{arabic_terms:['ما قدمت لغد'],english_terms:['what sent ahead Hereafter']}};
function setup(){
 vi.stubEnv('ISNADLENS_WEB_SEARCH_ENABLED','true');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async (_claim,_language,cards)=>{
  const card=cards.find(c=>c.locator==='59:18')!;
  const assessment:SemanticAssessment={in_scope:true,original_meaning_preserved:true,all_material_claims_covered:false,summary_en:'Quran 59:18 advises believers to consider what they have sent ahead; its stated audience is believers, not every person without qualification.',summary_ar:'تنصح الآية المؤمنين بالنظر فيما قدموا للغد، ولا تخاطب كل شخص دون قيد.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation:'partial',evidence_ids:[card.evidence_id],direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:false,attribution_matched:true,scope_matched:false,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};
  return {model:'gpt-5.6-luna',usage:null,assessment};
 });
 return assess;
}
it.each([false,true])('only exposes source-confirmed qualified prose and leaves the broad claim unapproved: forged quote %s',forged=>{
 setup();const planned=vi.spyOn(planner,'planClaimQueries').mockRejectedValue(new planner.QueryPlannerFailure('SPEND_BUDGET_STOP'));
 const review=vi.spyOn(provider,'reviewQualifiedExplanation').mockImplementation(async (_claim,_a,cards)=>{
  const card=cards.find(c=>c.locator==='59:18')!;
  return {model:'gpt-5.6-terra',usage:null,raw_provider_review:{atoms:[]},unit_provenance:[],review:{atoms:[{atom_id:'qualified_explanation',entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:card.evidence_id,context_locator:null,basis_quotation:forged?'invented source text':card.quotation}]}};
 });
 return verifyClaimWithRecovery(options).then(r=>{
  expect(review).toHaveBeenCalledOnce();expect(r.verdict).toBe('insufficient_within_selected_corpus');expect(verifySeal(r)).toBe(true);
  expect(r.qualified_explanation_review?.status).toBe(forged?'rejected':'passed');
  if(!forged){expect(r.summary_en).toContain('Qualified explanation:');expect(r.summary_en).toContain('believers');expect(planned).not.toHaveBeenCalled();expect(r.semantic_assessment).toMatchObject({atomic_claims:[{scope_matched:false,qualifications_preserved:false}]});}
  else expect(r.summary_en).not.toContain('Qualified explanation:');
 });
});
it('stops after an unavailable qualified review, retaining its cost and original withholding',async()=>{
 setup();const usage={input_tokens:1,output_tokens:1,estimated_cost_usd:.001,reservation_id:'qualified-failed'};
 vi.spyOn(provider,'reviewQualifiedExplanation').mockRejectedValue(new provider.ProviderFailure('SPEND_BUDGET_STOP','gpt-5.6-terra',usage));
 const planned=vi.spyOn(planner,'planClaimQueries'),searched=vi.spyOn(discovery,'discoverWebReferences');
 const r=await verifyClaimWithRecovery(options);
 expect(r.qualified_explanation_review).toMatchObject({status:'unavailable',reason:'SPEND_BUDGET_STOP',usage});
 expect(r.verdict).toBe('insufficient_within_selected_corpus');expect(r.summary_en).not.toContain('Qualified explanation:');expect(planned).not.toHaveBeenCalled();expect(searched).not.toHaveBeenCalled();expect(verifySeal(r)).toBe(true);
});
