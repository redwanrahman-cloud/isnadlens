/** A conservative prose-quality trigger, never an evidence or truth decision.
 * Generic exception references must identify the restricted action/degree. */
export function vagueExceptionSummary(summaryEn:string,summaryAr:string):boolean {
 const ar=summaryAr.normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'');
 return /\bexception\s+(?:related\s+to|concerning|regarding|associated\s+with|connected\s+with|in\s+connection\s+with)\b/i.test(summaryEn)
  || /\b(?:mentions?|notes?|includes?)\s+(?:an?\s+)?exception\s+for\b[^.;:]*[.;]/i.test(summaryEn)
  || /استثناء\s+(?:متعلق|يتعلق|مرتبط)/u.test(ar);
}
