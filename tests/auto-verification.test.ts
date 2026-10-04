import {describe,it,expect,vi} from 'vitest';
import {verifyAutoClaim} from '../src/lib/auto-verification';
import {verifySeal} from '../src/lib/verification';
import * as identification from '../src/lib/source-identification';
import * as provider from '../src/lib/provider';

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
 it.each(['ambiguous','not_identified'] as const)('does not grade or assess an %s source',async status=>{
  const find=vi.spyOn(identification,'identifySource').mockReturnValue({status,corpus:null,method:'none',candidate_locators:[],note:'Development-only routing fixture'});
  const assess=vi.spyOn(provider,'assessClaim');
  try{
   const record=await verifyAutoClaim({claim:'A hadith mentions a particular mobile app.',inputLanguage:'en'});
   expect(record.verdict).toBe('not_evaluated');expect(record.source_identification?.status).toBe(status);
   expect(record.reason_codes).toContain(status==='ambiguous'?'SOURCE_IDENTIFICATION_AMBIGUOUS':'SOURCE_NOT_IDENTIFIED');
   expect(record.evidence_items).toEqual([]);expect(record.usage).toBeNull();expect(verifySeal(record)).toBe(true);expect(assess).not.toHaveBeenCalled();
  }finally{find.mockRestore();assess.mockRestore();}
 });
});
