import {afterEach,expect,it,vi} from 'vitest';
import {vagueExceptionSummary} from '../src/lib/condition-summary';
import * as provider from '../src/lib/provider';
import {verifyClaim,verifySeal} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it('distinguishes vague exception references from an action-specific explanation',()=>{
 expect(vagueExceptionSummary('There is an exception related to fasting.','')).toBe(true);
 expect(vagueExceptionSummary('One supplied report mentions an exception for a person who is fasting; this is a textual assessment.','')).toBe(true);
 expect(vagueExceptionSummary('','هناك استثناء متعلق بالصيام.')).toBe(true);
 expect(vagueExceptionSummary('Deep sniffing is avoided while fasting; ordinary nasal rinsing remains prescribed.','')).toBe(false);
 expect(vagueExceptionSummary('The Quran prescribes Ramadan fasting.','')).toBe(false);
});
it.each([false,true])('rechecks a vague first-tier summary once and never publishes unresolved wording: %s',async unresolved=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 const claim='The Quran prescribes fasting in Ramadan.';
 const assessed=vi.spyOn(provider,'assessClaim').mockImplementation(async (_claim,_language,cards,model)=>{
  const assessment:SemanticAssessment={in_scope:true,original_meaning_preserved:true,all_material_claims_covered:true,
   summary_en:model==='gpt-5.6-luna'||unresolved?'Fasting is prescribed, with an exception related to travel.':'Ramadan fasting is prescribed; sick people and travellers may make up the missed days later.',
   summary_ar:'الصيام مفروض.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation:'supports',evidence_ids:[cards[0].evidence_id],direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'none',basis_evidence_id:null,basis_quotation:null}]};
  return {model:model!,usage:null,assessment};
 });
 const source=vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async (_claim,a,cards)=>({model:'fixture',usage:null,review:{explanation_preserved:true,atoms:[{atom_id:'a',entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:a.atomic_claims[0].evidence_ids[0],context_locator:null,basis_quotation:cards[0].quotation}]}}));
 const result=await verifyClaim({claim,inputLanguage:'en',admittedTextual:true});
 expect(assessed).toHaveBeenCalledTimes(2);
 expect(assessed.mock.calls[0][2]).toEqual(assessed.mock.calls[1][2]);
 expect(result.assessment_attempts?.[0].reason).toBe('QUALIFICATION_DETAIL_REVIEW_REQUIRED');
 expect(result.assessment_attempts?.[0].raw_assessment).toMatchObject({summary_en:expect.stringContaining('exception related to')});
 expect(verifySeal(result)).toBe(true);
 if(unresolved){expect(result.verdict).toBe('not_evaluated');expect(result.reason_codes).toContain('QUALIFICATION_DETAIL_UNCONFIRMED');expect(source).not.toHaveBeenCalled();expect(result.summary_en).not.toContain('exception related to');}
 else{expect(result.verdict).toBe('supported_within_selected_corpus');expect(source).toHaveBeenCalledOnce();expect(result.summary_en).toContain('make up');}
});
