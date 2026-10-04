import { expect, test } from 'vitest';
import { identifySource, type IdentificationCollections } from '../src/lib/source-identification';
import { loadCorpus } from '../src/lib/corpus';
import { loadHadith } from '../src/lib/hadith';

// Synthetic text is isolated unit-test input, never admitted application evidence.
const fixtures: IdentificationCollections = {
  verses: [{ id: '21:30', display: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ', search: 'وجعلنا من الماء كل شيء حي' }],
  records: [
    { id: '1', language: 'en', fields: { hadith_text: 'Actions are judged by intentions.', explanation: 'A fabricated phrase describing a golden spaceship.' } },
    { id: '2', language: 'ar', fields: { hadith_text: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى' } },
    { id: '3', language: 'id', fields: { hadith_text: 'Actions are judged by intentions.' } },
  ],
};
test('identifies exact primary quotations from either family and preserves originals', () => {
  const before = JSON.stringify(fixtures);
  expect(identifySource('“وجعلنا من الماء كل شيء حي”', 'ar', fixtures)).toMatchObject({ status: 'identified', corpus: 'quran', method: 'exact_quotation', candidate_locators: ['quran:21:30'] });
  expect(identifySource('Actions are judged by intentions.', 'en', fixtures)).toMatchObject({ status: 'identified', corpus: 'hadith', method: 'exact_quotation', candidate_locators: ['hadith:en:1'] });
  expect(JSON.stringify(fixtures)).toBe(before);
});
test('uses only query-side Arabic variants and English punctuation patterns', () => {
  expect(identifySource('اِنَّمَا الاعمال بالنيات', 'ar', fixtures)).toMatchObject({ corpus: 'hadith', method: 'normalized_quotation' });
  expect(identifySource('ACTIONS, are judged by intentions', 'en', fixtures)).toMatchObject({ corpus: 'hadith', method: 'normalized_quotation' });
  expect(identifySource('الأعمال بالنيات', 'ar', fixtures)).toMatchObject({ corpus: 'hadith', method: 'exact_quotation' });
});
test('does not infer a source from short/generic text, paraphrases, or publisher explanations', () => {
  for (const quote of ['الله أكبر', 'قال رسول الله', 'good intentions', 'A fabricated phrase describing a golden spaceship', 'A statement about inner purpose determining reward']) {
    expect(identifySource(quote, /\p{Script=Arabic}/u.test(quote) ? 'ar' : 'en', fixtures).status).toBe('not_identified');
  }
  expect(identifySource('A fabricated phrase describing a golden spaceship', 'en', fixtures).note).toContain('does not establish');
});
test('marks cross-family duplicate quotations and mixed attribution ambiguous', () => {
  const both = { ...fixtures, records: [...fixtures.records, { id: '4', language: 'ar', fields: { hadith_text: fixtures.verses[0].search } }] };
  expect(identifySource(fixtures.verses[0].search, 'ar', both)).toMatchObject({ status: 'ambiguous', corpus: null });
  expect(identifySource('Is this Quran or Hadith: “Actions are judged by intentions”', 'en', fixtures)).toMatchObject({ status: 'ambiguous', method: 'explicit_attribution', corpus: null });
});
test('preserves explicit attribution even when quotation belongs to another family', () => {
  const result = identifySource('The Quran says “Actions are judged by intentions”', 'en', fixtures);
  expect(result).toMatchObject({ status: 'identified', corpus: 'quran', method: 'explicit_attribution' });
  expect(result.note).toContain('not confirmation');
  expect(identifySource('٢١:٣٠ “وجعلنا من الماء كل شيء حي”', 'ar', fixtures).corpus).toBe('quran');
  expect(identifySource('https://hadeethenc.com/en/browse/hadith/1', 'en', fixtures)).toMatchObject({ corpus: 'hadith', candidate_locators: ['hadith:en:1'] });
});
test('rejects malformed references and never identifies another language edition silently', () => {
  expect(identifySource('https://hadeethenc.com/en/browse/hadith/nope', 'en', fixtures).status).toBe('not_identified');
  const otherOnly = { verses: [], records: [fixtures.records[2]] };
  expect(identifySource('Actions are judged by intentions.', 'en', otherOnly).status).toBe('not_identified');
});
test('bounds returned locators without hiding a source family or overflowing the API schema', () => {
  const many = { verses: Array.from({ length: 20 }, (_, index) => ({ ...fixtures.verses[0], id: `1:${index + 1}` })), records: [{ id: '99', language: 'ar', fields: { hadith_text: fixtures.verses[0].search } }] };
  const result = identifySource(fixtures.verses[0].search, 'ar', many);
  expect(result).toMatchObject({ status: 'ambiguous', corpus: null });
  expect(result.candidate_locators.length).toBeLessThanOrEqual(16);
  expect(result.candidate_locators).toContain('hadith:ar:99');
  expect(result.candidate_locators.some(locator => locator.startsWith('quran:'))).toBe(true);
  const singleFamily = identifySource(fixtures.verses[0].search, 'ar', { ...many, records: [] });
  expect(singleFamily.candidate_locators).toHaveLength(16);
  expect(singleFamily.corpus).toBe('quran');
  const references = Array.from({ length: 20 }, (_, index) => `1:${index + 1}`).join(' ');
  expect(identifySource(references, 'ar', fixtures).candidate_locators).toHaveLength(16);
});
test('matches genuine admitted Quran and Hadith primary passages without API calls', () => {
  const quran = loadCorpus(); const hadith = loadHadith();
  const verse = quran.verses.find(v => v.id === '21:30')!;
  expect(identifySource(`“${verse.display}”`, 'ar')).toMatchObject({ status: 'identified', corpus: 'quran', method: 'exact_quotation' });
  const repeatedQuranQuote = identifySource('قل هو الله أحد', 'ar');
  expect(repeatedQuranQuote).toMatchObject({ status: 'ambiguous', corpus: null });
  expect(repeatedQuranQuote.candidate_locators).toContain('quran:112:1');
  const shortHadith = identifySource('الأعمال بالنيات', 'ar');
  expect(shortHadith).toMatchObject({ status: 'identified', corpus: 'hadith', method: 'normalized_quotation' });
  const real = hadith.records.find(r => r.language === 'en' && r.fields.hadith_text?.includes('we only judge you by what is apparent to us from your deeds'))!;
  const text = 'we only judge you by what is apparent to us from your deeds';
  expect(identifySource(text, 'en')).toMatchObject({ status: 'identified', corpus: 'hadith', method: 'exact_quotation' });
  expect(identifySource(text, 'en').candidate_locators).toContain(`hadith:en:${real.id}`);
}, 10000);
