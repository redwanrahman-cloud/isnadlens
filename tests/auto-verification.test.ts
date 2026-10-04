import {describe,it,expect,vi} from 'vitest';
import {verifyAutoClaim} from '../src/lib/auto-verification';
import {verifySeal} from '../src/lib/verification';
import * as identification from '../src/lib/source-identification';
import * as provider from '../src/lib/provider';
import * as verification from '../src/lib/verification';

describe('automatic source routing boundary',()=>{
 it('does not search or pay for ordinary questions or personal requests',async()=>{
  const find=vi.spyOn(identification,'identifySource');const assess=vi.spyOn(provider,'assessClaim');
  try{
   for(const claim of ["What's the weather today?",'How are you doing?','Can I stop fasting because of my condition?']){
    const record=await verifyAutoClaim({claim,inputLanguage:'en'});
    expect(record.verdict).toBe('not_evaluated');expect(record.usage).toBeNull();expect(record.evidence_items).toEqual([]);expect(verifySeal(record)).toBe(true);
   }
   expect(find).not.toHaveBeenCalled();expect(assess).not.toHaveBeenCalled();
  }finally{find.mockRestore();assess.mockRestore();}
 });
 it.each(['ambiguous','not_identified'] as const)('searches both source families for a scoped %s paraphrase',async status=>{
  const baseline=await verifyAutoClaim({claim:"What's the weather today?",inputLanguage:'en'});
  const find=vi.spyOn(identification,'identifySource').mockReturnValue({status,corpus:null,method:'none',candidate_locators:[],note:'Development-only routing fixture'});
  const verify=vi.spyOn(verification,'verifyClaimWithRecovery').mockResolvedValue(baseline);
  try{
   const claim='Eating pork is haram in Islam.';
   await verifyAutoClaim({claim,inputLanguage:'en'});
   expect(verify).toHaveBeenCalledWith(expect.objectContaining({claim,inputLanguage:'en',corpusSelection:'both',useQueryPlanner:true}));
   if(status==='not_identified')expect(verify.mock.calls[0][0].sourceIdentification).toBeUndefined();
  }finally{find.mockRestore();verify.mockRestore();}
 });
});
