import {describe,it,expect} from 'vitest';
import {clarificationProposal,needsClarification,closeWordingRepair} from '../src/lib/clarification';
const record={original_claim:'What does the Quran say about chariti?',verdict:'not_evaluated',reason_codes:['CLAIM_CLARIFICATION_REQUIRED'],language_intake:{detected_language:'en' as const,confidence:'high',scope_category:'clarification',clarification_proposal:'What does the Quran say about charity?'}};
describe('clarification confirmation boundary',()=>{
  it('submits only the structured question, never a yes/no answer or parsed summary',()=>{
    expect(clarificationProposal(record)).toEqual({question:record.language_intake.clarification_proposal,language:'en'});
  });
  it('never offers Yes as a substitute for missing source content',()=>{
    expect(clarificationProposal({...record,language_intake:{...record.language_intake,referenced_content_missing:true}})).toBeNull();
  });
  it('keeps older records editable without inventing a suggestion from prose',()=>{
    expect(needsClarification({...record,language_intake:undefined})).toBe(true);
    expect(clarificationProposal({...record,language_intake:undefined})).toBeNull();
  });
  it.each([null,'','   ','x'.repeat(1201)])('does not confirm a missing or oversized proposal',question=>{
    expect(clarificationProposal({...record,language_intake:{...record.language_intake,clarification_proposal:question}})).toBeNull();
  });
  it('never turns an evaluated or referred result into a confirmation bypass',()=>{
    expect(clarificationProposal({...record,verdict:'supported_within_selected_corpus'})).toBeNull();
    expect(clarificationProposal({...record,reason_codes:['PERSONAL_RULING_REFERRAL']})).toBeNull();
  });
});

describe('close wording repair guard',()=>{
  it('accepts a small typo correction across Latin and Bengali scripts',()=>{
    expect(closeWordingRepair('what is most evil ting','What is most evil thing?')).toBe(true);
    expect(closeWordingRepair('কুরআনে দান সম্পর্কে কী বলে','কুরআনে দান সম্পর্কে কী বলা হয়েছে')).toBe(false);
    expect(closeWordingRepair('দন সম্পর্কে কী বলা আছে','দান সম্পর্কে কী বলা আছে')).toBe(true);
  });
  it('rejects adding a religious framing or materially rewriting a request',()=>{
    expect(closeWordingRepair('what is most evil ting','What is the most evil thing according to Islamic texts?')).toBe(false);
    expect(closeWordingRepair('give me a cake recipe','What does the Quran say about food?')).toBe(false);
    expect(closeWordingRepair('','A question?')).toBe(false);
    expect(closeWordingRepair('Is this true?','Is this true?')).toBe(false);
  });
});
