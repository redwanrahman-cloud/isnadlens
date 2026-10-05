import {afterEach,expect,it,vi} from 'vitest';
import * as provider from '../src/lib/provider';
import * as hadith from '../src/lib/hadith';
import {verifyClaim,verifySeal,validPositiveReview} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
const card=()=>{const h=hadith.loadHadith();return hadith.authenticateHadith(h,h.records.find(r=>r.language==='en'&&r.id==='4801')!);};
it.each([
 ['According to the hadith, is noble lineage sufficient to advance someone whom their deeds have held back?',['hadith','noble lineage','deeds','deeds hold him back','sufficient to advance someone']],
 ['According to the hadith, is noble lineage sufficient to advance someone whom his deeds have held back?',['noble lineage','deeds hold someone back','is lineage sufficient','hadith lineage and deeds']],
 ['According to the hadith, noble lineage does not advance someone whom their deeds have delayed.',['hadith','noble lineage','deeds','deeds delay him','lineage does not advance']]
])('retrieves a precise long-narration sentence despite held-back paraphrases: %s',(gloss,hints)=>{
 const h=hadith.loadHadith(),hits=hadith.retrieveHadith(h,gloss,'en',4,hints as string[]);
 expect(hits.map(r=>r.id)).toContain('4801');expect(hits.every(r=>hadith.authenticateHadith(h,r).integrity.passed)).toBe(true);
});
function assessment(claim:string,relation:'supports'|'contradicts'):SemanticAssessment {
 const c=card();return {in_scope:true,original_meaning_preserved:true,all_material_claims_covered:true,summary_en:'No. Noble lineage does not advance someone whose deeds held them back.',summary_ar:'لا، لا يقدّم النسب من أخّرته أعماله.',limitations:[],atomic_claims:[{id:'a',text:claim,material:true,relation,evidence_ids:[c.evidence_id],direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:relation==='contradicts'?'explicit_negation_or_incompatible_statement':'none',basis_evidence_id:relation==='contradicts'?c.evidence_id:null,basis_quotation:relation==='contradicts'?c.quotation:null}]};
}
function review(relation:'supports'|'contradicts'|'unproven',proposed:'supports'|'contradicts',omit=false){
 const units=provider.buildSourceUnits([card()]);return provider.resolveUnitReview({explanation_preserved:true,explanation_diagnostic:{reason:'none',language:null,sentence:null,detail:''},atoms:[{atom_id:'a',source_relationship:omit?undefined:relation,entails:'yes',attribution_preserved:true,qualifications_preserved:true,basis_unit_id:units[0].unit_id,additional_basis_unit_ids:[]}]},units,[{id:'a',relation:proposed}]);
}
it.each(['supports','contradicts'] as const)('accepts independently matching %s without using headline Yes/No as polarity',relation=>{
 const a=assessment('An original question',relation);expect(validPositiveReview(review(relation,relation),a,[card()])).toBe(true);
});
it.each([['supports','contradicts'],['contradicts','supports'],['supports','unproven']] as const)('blocks proposed %s when independently checked source relationship is %s',(proposed,checked)=>{
 const r=review(checked,proposed);expect(r.explanation_preserved).toBe(false);expect(r.explanation_diagnostic?.reason).toBe('relationship_mismatch');expect(validPositiveReview(r,assessment('An original question',proposed),[card()])).toBe(false);
});
it('does not allow a legacy/missing relation through a current live relationship packet',()=>{
 expect(review('supports','supports',true).explanation_preserved).toBe(false);
});
it('the final gate rejects a contrary independent relationship even if a caller claims prose passed',()=>{
 const r=review('contradicts','supports');r.explanation_preserved=true;expect(validPositiveReview(r,assessment('An original question','supports'),[card()])).toBe(false);
});
it.each([true,false])('reassesses the captured lineage mismatch once on identical evidence; corrected=%s',async corrected=>{
 vi.stubEnv('OPENAI_MODEL','gpt-5.6-luna');vi.spyOn(provider,'providerReady').mockReturnValue(true);
 const claim='Selon le hadith, une noble lignée suffit-elle à faire avancer celui que ses actes ont retardé?';
 vi.spyOn(hadith,'retrieveHadith').mockReturnValue(hadith.loadHadith().records.filter(r=>r.language==='en'&&r.id==='4801'));
 const packets:string[][]=[];let calls=0;
 const assess=vi.spyOn(provider,'assessClaim').mockImplementation(async(_claim,_lang,cards,model)=>{packets.push(cards.map(c=>c.evidence_id));return {model:model!,usage:null,assessment:assessment(claim,++calls===1||!corrected?'supports':'contradicts')};});
 const checker=vi.spyOn(provider,'reviewPositiveEntailment').mockImplementation(async(_claim,a)=>({model:'gpt-5.6-terra',usage:null,review:review('contradicts',a.atomic_claims[0].relation as 'supports'|'contradicts')}));
 const r=await verifyClaim({claim,inputLanguage:'fr',admittedTextual:true,corpusSelection:'hadith'});
 expect(r.verdict).toBe(corrected?'conflicting_within_selected_corpus':'not_evaluated');expect(assess).toHaveBeenCalledTimes(2);expect(checker).toHaveBeenCalledTimes(2);expect(packets[1]).toEqual(packets[0]);expect(r.assessment_attempts?.[1].reason).toBe('VERDICT_EXPLANATION_REASSESSMENT');expect(verifySeal(r)).toBe(true);
});
