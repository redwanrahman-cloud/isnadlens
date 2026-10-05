import {expect,it} from 'vitest';
import {answerReviewRejected,recordedReviewDiagnostic,reviewStatusCopy} from '../src/lib/review-status';
it('distinguishes rejected review from unavailable assessment without changing the verdict',()=>{
 for(const reason of ['FINAL_EXPLANATION_UNCONFIRMED','SOURCE_ENTAILMENT_UNCONFIRMED','CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED'])expect(answerReviewRejected({verdict:'not_evaluated',reason_codes:[reason]})).toBe(true);
 for(const reason of ['PROVIDER_UNAVAILABLE','SOURCE_ENTAILMENT_UNAVAILABLE','SPEND_OR_CONCURRENCY_STOP'])expect(answerReviewRejected({verdict:'not_evaluated',reason_codes:[reason]})).toBe(false);
 expect(answerReviewRejected({verdict:'supported_within_selected_corpus',reason_codes:[]})).toBe(false);
});
it('uses the last recorded objection, including an early reassessment stop, and never fabricates one',()=>{
 const record={verdict:'not_evaluated',reason_codes:['FINAL_EXPLANATION_UNCONFIRMED'],source_review_attempts:[{review:{explanation_diagnostic:{reason:'missing_qualification',language:'en',detail:'A condition was omitted.'}}}]};
 expect(recordedReviewDiagnostic(record)).toEqual({reason:'missing_qualification',language:'en',detail:'A condition was omitted.'});
 expect(recordedReviewDiagnostic({...record,source_review_attempts:[]})).toBeNull();
 expect(recordedReviewDiagnostic({...record,entailment_review:{status:'rejected',raw_review:{explanation_diagnostic:{reason:'ambiguous',language:'both',detail:'Final objection'}}}})?.detail).toBe('Final objection');
 expect(Object.keys(reviewStatusCopy)).toHaveLength(9);
});

it('retains the specific original reviewer objection when relationship normalization adds a generic mismatch',()=>{
 const record={verdict:'not_evaluated',reason_codes:['FINAL_EXPLANATION_UNCONFIRMED'],entailment_review:{status:'rejected',raw_review:{explanation_diagnostic:{reason:'relationship_mismatch',detail:'Generic mismatch'}},raw_provider_review:{explanation_diagnostic:{reason:'unproven_statement',language:'both',detail:'The supplied context does not identify the audience.'}}}};
 expect(recordedReviewDiagnostic(record)?.detail).toBe('The supplied context does not identify the audience.');
});
