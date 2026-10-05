import {expect,it} from 'vitest';
import {insertDictation} from '../src/lib/dictation-draft';
it('keeps the draft and replaces only the selected words',()=>{
 expect(insertDictation('What about fasting today?','prayer',11,18)).toBe('What about prayer today?');
 expect(insertDictation('My question','is about charity',11,11)).toBe('My question is about charity');
});
it('preserves Arabic, newlines and adjacent punctuation',()=>{
 expect(insertDictation('ما حكم ؟','الصيام',7,7)).toBe('ما حكم الصيام؟');
 expect(insertDictation('First line\n','Second line',11,11)).toBe('First line\nSecond line');
 expect(insertDictation('', 'کیا یہ درست ہے؟',0,0)).toBe('کیا یہ درست ہے؟');
});
it('rejects overlong or empty dictation without truncating the draft',()=>{
 expect(insertDictation('a'.repeat(1199),'hello',1199,1199)).toBeNull();
 expect(insertDictation('Keep this','  ',0,0)).toBeNull();
});
