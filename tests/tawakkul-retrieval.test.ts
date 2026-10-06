import {expect,it} from 'vitest';
import {loadCorpus,sha256} from '../src/lib/corpus';
import {retrieveWithPublishedEnglishAid} from '../src/lib/retrieval';

it('retrieves practical action together with reliance for the Arabic starter without altering source bytes',()=>{
 const corpus=loadCorpus(),before=sha256(JSON.stringify(corpus.verses));
 const claim='هل التوكل على الله يعني أن أتوقف عن التخطيط والأخذ بالأسباب؟';
 for(const gloss of ['Does trusting Allah mean I should stop planning and taking practical steps?','Does reliance on Allah mean abandoning planning and taking means?']){
  const verses=retrieveWithPublishedEnglishAid(corpus,claim,4,['التوكل','الأخذ بالأسباب','trust Allah','planning'],gloss).verses;
  // Both passages combine practical action with reliance; no locator is
  // supplied to retrieval, and these expected locators are test-only.
  expect(verses.some(v=>v.id==='3:159'||v.id==='12:67')).toBe(true);
 }
 expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
});
