type DisplayEvidence = {
  evidence_id:string;
  quotation:string;
  integrity:{passed:boolean};
  source_context?:{locator:string;quotation:string;integrity_passed:boolean}[];
};
type RecordedReview = {status:string;raw_review?:unknown};
type DisplayRecord<T extends DisplayEvidence> = {
  verdict:string;
  evidence_items:readonly T[];
  entailment_review?:RecordedReview;
  qualified_explanation_review?:RecordedReview;
};
function object(value:unknown):Record<string,unknown>|null {
  return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
}

/** Display-only ordering from the final accepted review. Never sort the sealed
 * record in place or infer proof from retrieval rank / draft relation labels. */
export function evidenceForDisplay<T extends DisplayEvidence>(record:DisplayRecord<T>):T[] {
  const evidence=[...record.evidence_items];
  const review=record.verdict==='supported_within_selected_corpus'||record.verdict==='conflicting_within_selected_corpus'
    ?record.entailment_review
    :record.verdict==='insufficient_within_selected_corpus'?record.qualified_explanation_review:undefined;
  const raw=object(review?.raw_review);
  if(review?.status!=='passed'||raw?.explanation_preserved!==true||!Array.isArray(raw.atoms)||!raw.atoms.length)return evidence;

  const primary=new Set<string>(), additional=new Set<string>();
  function matchingEvidence(value:unknown):string|null {
    const basis=object(value);
    if(!basis||typeof basis.evidence_id!=='string'||typeof basis.basis_quotation!=='string'||!basis.basis_quotation.trim())return null;
    const card=evidence.find(item=>item.evidence_id===basis.evidence_id&&item.integrity.passed);
    const text=basis.context_locator===null?card?.quotation:card?.source_context?.find(item=>item.locator===basis.context_locator&&item.integrity_passed)?.quotation;
    return text===basis.basis_quotation?card!.evidence_id:null;
  }
  for(const value of raw.atoms){
    const atom=object(value);
    if(!atom||atom.entails!=='yes'||atom.attribution_preserved!==true||atom.qualifications_preserved!==true)return evidence;
    const id=matchingEvidence(atom);
    if(!id)return evidence;
    primary.add(id);
    if(atom.additional_basis!==undefined&&!Array.isArray(atom.additional_basis))return evidence;
    for(const basis of (atom.additional_basis??[]) as unknown[]){
      const extra=matchingEvidence(basis);
      if(!extra)return evidence;
      additional.add(extra);
    }
  }
  const rank=(item:T)=>primary.has(item.evidence_id)?0:additional.has(item.evidence_id)?1:2;
  return evidence.sort((a,b)=>rank(a)-rank(b));
}
