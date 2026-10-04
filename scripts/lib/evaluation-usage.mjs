// Include the bounded recovery's first record, without counting a reservation twice.
export function evaluationUsage(record) {
 const unique=new Map();
 function collect(r,depth=0){
  if(!r||depth>3)throw new Error('UNEXPECTED_RECOVERY_DEPTH');
  for(const usage of [r.language_intake?.usage,r.retrieval_plan?.usage,...(r.meaning_review_attempts??[]).map(a=>a.usage),...(r.source_review_attempts??[]).map(a=>a.usage),...(r.assessment_attempts??[]).map(a=>a.usage),r.usage,r.entailment_review?.usage,r.qualified_explanation_review?.usage,r.retrieval_recovery?.usage,r.web_discovery?.usage])if(usage?.reservation_id)unique.set(usage.reservation_id,usage);
  if(r.retrieval_recovery?.first_record)collect(r.retrieval_recovery.first_record,depth+1);
  if(r.web_discovery?.previous_record)collect(r.web_discovery.previous_record,depth+1);
 }
 collect(record);return [...unique.values()];
}
