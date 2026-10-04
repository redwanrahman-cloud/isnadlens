import {expect,it} from 'vitest';
import {loadCorpus} from '../src/lib/corpus';
import {retrieveWithPublishedEnglishAid,englishWords} from '../src/lib/retrieval';
import {validPositiveReview,authenticateEvidence} from '../src/lib/verification';
import type {SemanticAssessment} from '../src/lib/contracts';
it.each([
 ['Apakah Al-Qur’an menyatakan orang yang berilmu sama saja dengan orang yang tidak berilmu?','Does the Quran state that people who possess knowledge are the same as people who do not possess knowledge?',['knowledgeable and ignorant','people of knowledge and ignorance','العلم والجهل'],'39:9'],
 ['Sagt der Koran, dass man für eingegangene Versprechen keinerlei Rechenschaft ablegen muss?','Does the Quran say that one bears no accountability whatsoever for promises that have been made?',['keeping promises','accountability for promises','الوفاء بالعهد'],'17:34'],
 ['هل تتساوى المعرفة والجهل؟','Are knowledgeable people equal to those without knowledge?',['learned and ignorant','العلم والجهل'],'39:9'],
])('finds direct evidence for an everyday paraphrase: %s',(original,gloss,hints,locator)=>{
 expect(retrieveWithPublishedEnglishAid(loadCorpus(),original,4,hints as string[],gloss).verses.map(v=>v.id)).toContain(locator);
});
it('search expansion never equates oath evidence with promise proof',()=>{
 expect(englishWords('promises covenants accountability')).toEqual(['covenant','covenant','account']);
 expect(englishWords('oaths')).not.toContain('covenant');
 const corpus=loadCorpus(),c=authenticateEvidence(corpus,corpus.verses.find(v=>v.id==='17:34')!),d=authenticateEvidence(corpus,corpus.verses.find(v=>v.id==='5:89')!);
 const a:SemanticAssessment={in_scope:true,original_meaning_preserved:true,all_material_claims_covered:true,summary_en:'A source-based answer.',summary_ar:'إجابة من المصدر.',limitations:[],atomic_claims:[{id:'a',text:'A promise question',material:true,relation:'contradicts',evidence_ids:[c.evidence_id],direct:true,context_fit:true,negation_checked:true,modality_checked:true,qualifications_preserved:true,attribution_matched:true,scope_matched:true,contradiction_basis:'explicit_negation_or_incompatible_statement',basis_evidence_id:c.evidence_id,basis_quotation:c.quotation}]};
 expect(validPositiveReview({explanation_preserved:true,atoms:[{atom_id:'a',entails:'yes',attribution_preserved:true,qualifications_preserved:true,evidence_id:d.evidence_id,context_locator:null,basis_quotation:d.quotation}]},a,[c,d])).toBe(false);
});
