import {expect,it} from 'vitest';
import {evidenceForDisplay} from '../src/lib/evidence-display';

const card=(id:string)=>({evidence_id:id,quotation:`Source ${id}`,integrity:{passed:true},source_context:[] as {locator:string;quotation:string;integrity_passed:boolean}[]});
const basis=(id:string)=>({evidence_id:id,context_locator:null as string|null,basis_quotation:`Source ${id}`});
const atom=(id:string)=>({...basis(id),entails:'yes',attribution_preserved:true,qualifications_preserved:true,additional_basis:[] as ReturnType<typeof basis>[]});
function record(){return {verdict:'conflicting_within_selected_corpus',evidence_items:[card('topic'),card('context'),card('proof'),card('other')],entailment_review:{status:'passed',raw_review:{explanation_preserved:true,atoms:[atom('proof')]}}};}
const ids=(items:ReturnType<typeof card>[])=>items.map(e=>e.evidence_id);

it('puts reviewed contradictory evidence first without mutating the sealed record or dropping sources',()=>{
 const r=record(),snapshot=JSON.stringify(r);
 const sorted=evidenceForDisplay(r);
 expect(ids(sorted)).toEqual(['proof','topic','context','other']);
 expect(sorted[0]).toBe(r.evidence_items[2]);
 expect(JSON.stringify(r)).toBe(snapshot);
});
it('keeps all primary proofs before additional required context, then stable retrieval order',()=>{
 const r=record();r.entailment_review.raw_review.atoms[0].additional_basis=[basis('context')];
 r.entailment_review.raw_review.atoms.push(atom('other'));
 expect(ids(evidenceForDisplay(r))).toEqual(['proof','other','context','topic']);
});
it('can promote a card whose reviewed proof is in authenticated adjoining context',()=>{
 const r=record();r.evidence_items[2].source_context=[{locator:'2:3',quotation:'Adjoining proof',integrity_passed:true}];
 Object.assign(r.entailment_review.raw_review.atoms[0],{context_locator:'2:3',basis_quotation:'Adjoining proof'});
 expect(evidenceForDisplay(r)[0].evidence_id).toBe('proof');
 r.evidence_items[2].source_context[0].integrity_passed=false;
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
it.each(['rejected','unavailable'])('retains retrieval order for a %s final review',status=>{
 const r=record();r.entailment_review.status=status;
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
it('never promotes a draft proof for an unconfirmed result',()=>{
 const r=record();r.verdict='not_evaluated';
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
it('uses only the accepted qualified review for a qualified answer',()=>{
 const r={...record(),verdict:'insufficient_within_selected_corpus',qualified_explanation_review:{status:'passed',raw_review:{explanation_preserved:true,atoms:[atom('other')]}}};
 expect(evidenceForDisplay(r)[0].evidence_id).toBe('other');
 r.qualified_explanation_review.status='rejected';
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
it('leaves legacy records without final review metadata in their original order',()=>{
 const r={verdict:'supported_within_selected_corpus',evidence_items:record().evidence_items};
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
it.each(['quotation','integrity','missing','explanation','additional'])('does not promote an invalid %s proof',kind=>{
 const r=record();
 if(kind==='quotation')r.entailment_review.raw_review.atoms[0].basis_quotation='Invented';
 if(kind==='integrity')r.evidence_items[2].integrity.passed=false;
 if(kind==='missing')r.entailment_review.raw_review.atoms[0].evidence_id='missing';
 if(kind==='explanation')r.entailment_review.raw_review.explanation_preserved=false;
 if(kind==='additional')r.entailment_review.raw_review.atoms[0].additional_basis=[basis('missing')];
 expect(ids(evidenceForDisplay(r))).toEqual(ids(r.evidence_items));
});
