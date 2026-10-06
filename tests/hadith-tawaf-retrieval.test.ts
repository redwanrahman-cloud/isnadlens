import {expect,it} from 'vitest';
import {loadHadith,retrieveHadith,authenticateHadith} from '../src/lib/hadith';

it.each([
 'How many circuits are performed in tawaf around the Kaaba?',
 'The user asks how many circuits are performed during Tawaf around the Kaaba.',
 'How many rounds are performed in tawaf around the Ka‘bah?',
 'How many laps are performed when circumambulating the Kaaba?',
])('retrieves the admitted primary narration for %s within the two-card English allowance',query=>{
 const corpus=loadHadith();
 const results=retrieveHadith(corpus,query,'en',2,['number of Tawaf circuits','Tawaf around the Kaaba','Tawaf circuits']);
 const source=results.find(record=>record.id==='3309');
 expect(source).toBeDefined();
 expect(source!.fields.hadith_text).toContain('first three rounds and normally during the last four ones');
 expect(authenticateHadith(corpus,source!).integrity.passed).toBe(true);
});

it('keeps farewell-tawaf and menstruation questions on their distinct primary sources',()=>{
 const corpus=loadHadith();
 const results=retrieveHadith(corpus,'Are menstruating women exempt from farewell tawaf?','en',2);
 expect(results.some(record=>record.id==='3229')).toBe(true);
});
