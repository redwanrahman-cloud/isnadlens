import { expect, test } from 'vitest';
import { getPassageTranslation, getQuranPassageTranslation } from '../src/lib/passage-translations';
import { loadHadith } from '../src/lib/hadith';
import { sha256, loadCorpus } from '../src/lib/corpus';

test('returns distinct exact publisher editions with all attribution, version and integrity metadata', () => {
  const corpus = loadHadith();
  const english = corpus.records.find(record => record.language === 'en' && corpus.records.some(other => other.id === record.id && other.language === 'bn'))!;
  const bangla = corpus.records.find(record => record.id === english.id && record.language === 'bn')!;
  const originalText = english.fields.hadith_text;
  const result = getPassageTranslation({ recordId: english.id, sourceLanguage: 'en', targetLanguage: 'bn' });
  expect(result.status).toBe('available');
  expect(result.source_record?.quotation).toBe(originalText);
  expect(result.translated_record?.quotation).toBe(bangla.fields.hadith_text);
  expect(result.translated_record?.quotation_sha256).toBe(sha256(bangla.fields.hadith_text!));
  expect(result.translated_record?.publisher_fields).toEqual(bangla.fields);
  expect(result.translated_record?.source_url).toBe(`https://hadeethenc.com/bn/browse/hadith/${english.id}`);
  expect(result.translated_record?.publisher_notice).toContain("PLEASE DON'T REMOVE");
  expect(result.translated_record?.version).toBe(corpus.manifest.sources.find(source => source.language === 'bn')!.version);
  expect(result.translated_record?.integrity.passed).toBe(true);
  expect(english.fields.hadith_text).toBe(originalText);
}, 10000);
test('reports missing counterparts instead of generating or cross-joining another record', () => {
  const corpus = loadHadith();
  const source = corpus.records.find(record => record.language === 'ar' && !corpus.records.some(other => other.id === record.id && other.language === 'en'))!;
  expect(getPassageTranslation({ recordId: source.id, sourceLanguage: 'ar', targetLanguage: 'en' })).toMatchObject({ status: 'not_available', translated_record: null, record_id: source.id });
  expect(getPassageTranslation({ recordId: '999999999999', sourceLanguage: 'ar', targetLanguage: 'en' }).source_record).toBeNull();
});
test('keeps non-admitted language requests and malformed identifiers out of corpus access', () => {
  expect(getPassageTranslation({ recordId: '1', sourceLanguage: 'en', targetLanguage: 'pt' }).status).toBe('unsupported_language');
  for (const recordId of ['../1', '0', '-1', '1 OR 1=1', '1.5']) expect(getPassageTranslation({ recordId, sourceLanguage: 'en', targetLanguage: 'bn' }).status).toBe('invalid_input');
});
test('binds Hadith display editions to the expected original quotation hash', () => {
  const corpus = loadHadith(); const source = corpus.records.find(record => record.language === 'ar')!;
  expect(getPassageTranslation({ recordId: source.id, sourceLanguage: 'ar', targetLanguage: 'en', expectedOriginalHash: '0'.repeat(64) })).toMatchObject({ status: 'invalid_input', source_record: null, translated_record: null });
});
test('returns seven published Quran translations at the same locator, with exact original binding and footnotes', () => {
  const verse = loadCorpus().verses.find(record => record.id === '21:30')!;
  for (const language of ['en', 'hi', 'ur', 'id', 'es', 'fr', 'de']) {
    const result = getQuranPassageTranslation({ locator: verse.id, targetLanguage: language, expectedOriginalHash: verse.display_sha256 });
    expect(result.status).toBe('available'); expect(result.source_record?.quotation).toBe(verse.display);
    expect(result.translated_record?.source_language).toBe(language);
    expect(result.translated_record?.quotation_sha256).toBe(sha256(result.translated_record!.quotation));
    expect(result.translated_record?.publisher_fields).toHaveProperty('footnotes');
    expect(result.translated_record?.publisher_notice).toContain('Mentioning the version number');
    expect(result.translated_record?.version).not.toBe('');
  }
  expect(getQuranPassageTranslation({ locator: verse.id, targetLanguage: 'en', expectedOriginalHash: '0'.repeat(64) })).toMatchObject({ status: 'invalid_input', source_record: null, translated_record: null });
  expect(getQuranPassageTranslation({ locator: verse.id, targetLanguage: 'bn' })).toMatchObject({ status: 'not_available', translated_record: null });
}, 10000);
