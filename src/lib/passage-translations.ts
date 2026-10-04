import { authenticateHadith, loadHadith, type HadithCorpus } from './hadith';
import type { EvidenceItem } from './contracts';
import { loadCorpus, sha256 } from './corpus';
import { quranTranslationEvidence } from './quran-translations';

export const passageLanguages = ['ar', 'en', 'bn', 'hi', 'ur', 'id', 'es', 'fr', 'de'] as const;
type PassageLanguage = typeof passageLanguages[number];
export type PassageTranslation = {
  status: 'available' | 'not_available' | 'unsupported_language' | 'invalid_input';
  corpus: 'hadith' | 'quran'; record_id: string; source_language: string; target_language: string;
  source_record: EvidenceItem | null; translated_record: EvidenceItem | null;
  corpus_id: string | null; corpus_sha256: string | null;
  relationship: 'same_publisher_record_id' | 'same_surah_ayah'; note: string;
};
/** Returns a distinct unchanged publisher edition; it never replaces a sealed evidence item. */
export function getPassageTranslation(input: { recordId: string; sourceLanguage: string; targetLanguage: string; expectedOriginalHash?: string }, supplied?: HadithCorpus): PassageTranslation {
  const base: PassageTranslation = { status: 'invalid_input', corpus: 'hadith', record_id: input.recordId,
    source_language: input.sourceLanguage, target_language: input.targetLanguage, source_record: null,
    translated_record: null, corpus_id: null, corpus_sha256: null, relationship: 'same_publisher_record_id', note: '' };
  if (!/^[1-9]\d{0,11}$/.test(input.recordId)) return { ...base, note: 'Invalid publisher record identifier.' };
  if (!passageLanguages.includes(input.sourceLanguage as PassageLanguage) || !passageLanguages.includes(input.targetLanguage as PassageLanguage)) return { ...base, status: 'unsupported_language', note: 'This language edition has not been admitted. No generated translation is substituted.' };
  const corpus = supplied ?? loadHadith(); // Full admission/pin checks precede access; missing data fails closed.
  base.corpus_id = corpus.manifest.id; base.corpus_sha256 = corpus.manifest.sha256;
  const source = corpus.records.find(record => record.id === input.recordId && record.language === input.sourceLanguage);
  if (!source) return { ...base, status: 'not_available', note: 'The source-language publisher record is not present in the admitted edition.' };
  base.source_record = authenticateHadith(corpus, source);
  if (!base.source_record.integrity.passed) throw new Error('PASSAGE_SOURCE_INTEGRITY_FAILURE');
  if (input.expectedOriginalHash && input.expectedOriginalHash !== base.source_record.quotation_sha256) return { ...base, status: 'invalid_input', source_record: null, note: 'Original quotation hash mismatch. No translation was paired.' };
  const target = corpus.records.find(record => record.id === input.recordId && record.language === input.targetLanguage);
  if (!target) return { ...base, status: 'not_available', note: 'This publisher record has no admitted edition in the requested language. Coverage differs by language.' };
  const translated = authenticateHadith(corpus, target);
  if (!translated.integrity.passed) throw new Error('PASSAGE_TRANSLATION_INTEGRITY_FAILURE');
  return { ...base, status: 'available', translated_record: translated, note: 'Unchanged HadeethEnc edition linked by the same publisher record ID. Publisher fields, version, attribution and notice are preserved. Mechanical integrity is not scholarly or linguistic review; this display does not change the original verification verdict or audit hash.' };
}
export function getQuranPassageTranslation(input: { locator: string; targetLanguage: string; expectedOriginalHash?: string }): PassageTranslation {
  const base: PassageTranslation = { status: 'invalid_input', corpus: 'quran', record_id: input.locator, source_language: 'ar', target_language: input.targetLanguage, source_record: null, translated_record: null, corpus_id: null, corpus_sha256: null, relationship: 'same_surah_ayah', note: '' };
  if (!/^\d{1,3}:\d{1,3}$/.test(input.locator)) return { ...base, note: 'Invalid surah:ayah locator.' };
  if (!passageLanguages.includes(input.targetLanguage as PassageLanguage)) return { ...base, status: 'unsupported_language', note: 'Requested language is unsupported.' };
  const corpus = loadCorpus(); const verse = corpus.verses.find(record => record.id === input.locator);
  if (!verse) return { ...base, status: 'not_available', note: 'Locator is absent from the admitted Arabic original.' };
  if (input.expectedOriginalHash && input.expectedOriginalHash !== verse.display_sha256) return { ...base, note: 'Original quotation hash mismatch. No translation was paired.' };
  base.corpus_id = corpus.manifest.id; base.corpus_sha256 = corpus.manifest.sha256;
  const source: EvidenceItem = { evidence_id: `${corpus.manifest.id}:${verse.id}`, source_id: 'QURAN-AR-TANZIL-UTHMANI-V1.1', title: 'Quran — Tanzil Uthmani', version: '1.1', locator: verse.id, quotation: verse.display, quotation_sha256: sha256(verse.display), source_url: `https://tanzil.net/#${verse.id}`, attribution: 'Source: Tanzil Project', source_language: 'ar', source_context: [], semantic_relation: 'not_assessed', integrity: { passed: true, checks: [{ id: 'original_edition_integrity', passed: true, reason: 'Original Arabic quotation matches the fully validated admitted edition.' }] } };
  base.source_record = source;
  const translated = input.targetLanguage === 'ar' ? source : quranTranslationEvidence(input.targetLanguage, input.locator);
  if (!translated) return { ...base, status: 'not_available', note: input.targetLanguage === 'bn' ? 'Bengali QuranEnc text exists, but its publisher version is absent from the official catalog. It has not been admitted for republication; open the official Bengali source instead.' : 'No admitted publisher translation is available in this language.' };
  return { ...base, status: 'available', translated_record: translated, note: input.targetLanguage === 'ar' ? 'Arabic original; no translation was generated.' : 'Unchanged publisher translation of meanings, including original footnotes. This display does not alter the Arabic evidence, verification verdict or audit hash; translation is not a replacement for the Quran original.' };
}
