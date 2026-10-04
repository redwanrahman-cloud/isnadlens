import { expect, test } from 'vitest';
import { loadCorpus, sha256 } from '../src/lib/corpus';
import { retrieve, queryTerms } from '../src/lib/retrieval';
import { scopeGate } from '../src/lib/policy';
import { loadHadith, retrieveHadith } from '../src/lib/hadith';

test('admits general Islamic food claims while retaining personal, sensitive and unrelated referrals', () => {
  for (const claim of ['pig eating is haram', 'is eating pork forbidden?', 'pork is halal', 'هل أكل الخنزير حرام؟', 'أكل الخنزير محرم']) expect(scopeGate(claim)).toBeNull();
  expect(scopeGate('Can I eat pork because of my condition?')).toBe('PERSONAL_RULING_REFERRAL');
  expect(scopeGate('هل يجوز لي أكل الخنزير؟')).toBe('PERSONAL_RULING_REFERRAL');
  expect(scopeGate('pig food recipe')).toBe('OUTSIDE_SUPPORTED_CLAIM_SCOPE');
  expect(scopeGate('How much food does a pig need?')).toBe('OUTSIDE_SUPPORTED_CLAIM_SCOPE');
  expect(scopeGate('Patient Ali has diabetes and asks whether pork is halal')).toBe('PRIVATE_OR_SENSITIVE_FACTS_REFERRAL');
});
test('retrieves actual Quran pig passages without encoding a verdict or editing admitted strings', () => {
  const corpus = loadCorpus(); const before = sha256(JSON.stringify(corpus.verses));
  for (const claim of ['pig eating is haram', 'is eating pork forbidden?', 'pork is halal', 'أكل الخنزير حرام']) {
    const passages = retrieve(corpus, claim);
    expect(passages.some(verse => ['2:173','5:3','6:145','16:115'].includes(verse.id))).toBe(true);
    expect(passages.some(verse => verse.search.includes('الخنزير'))).toBe(true);
  }
  expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
  const claim = 'pork is not forbidden';
  expect(queryTerms(claim)).toContain('not'); expect(claim).toBe('pork is not forbidden');
  expect(queryTerms('الخنزير ليس حراما')).toContain('ليس');
  expect(queryTerms('لا يجوز أكل الخنزير')).toContain('لا');
});
test('ordinary query synonyms find exact primary text and do not turn explanations into evidence', () => {
  const corpus = loadCorpus();
  expect(retrieve(corpus, 'backbiting is haram').some(verse => verse.id === '49:12')).toBe(true);
  const hadith = loadHadith();
  const pigCandidates = retrieveHadith(hadith, 'pork is prohibited', 'en');
  expect(pigCandidates.some(record => record.id === '4556')).toBe(true);
  expect(pigCandidates.some(record => record.id === '10963')).toBe(false); // "pigeon" is not "pig".
});
test('bounded additional search terms retrieve candidates but cannot inject a locator priority', () => {
  const corpus = loadCorpus();
  expect(retrieve(corpus, 'an unfamiliar phrasing', 8, ['الخنزير']).some(verse => verse.search.includes('الخنزير'))).toBe(true);
  expect(retrieve(corpus, 'an unfamiliar phrasing', 8, ['21:30']).some(verse => verse.id === '21:30')).toBe(false);
});
test('broad AI food hints cannot displace original distinctive subject matches', () => {
  const corpus = loadCorpus();
  const hints = ['أكل الخنزير', 'تحريم لحم الخنزير', 'حكم الخنزير', 'الخنزير في الإسلام', 'نجاسة الخنزير', 'أحكام الطعام الحرام', 'forbidden food', 'unclean animal'];
  const candidates = retrieve(corpus, 'pig eating is haram', 4, hints);
  expect(new Set(candidates.map(verse => verse.id))).toEqual(new Set(['2:173','5:3','6:145','16:115']));
  expect(candidates.some(verse => verse.id === '5:75')).toBe(false);
  expect(retrieve(corpus, 'pig eating is haram 5:75', 1, hints)[0].id).toBe('5:75');
  // Independent topic demonstrates that the rule is not a pork-specific locator lookup.
  const justice = retrieve(corpus, 'justice', 4, ['الماء', 'الصلاة', 'الحياة', 'قال', 'الله']);
  expect(justice.every(verse => verse.search.includes('العدل') || verse.search.includes('القسط'))).toBe(true);
});
