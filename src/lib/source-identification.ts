import { loadCorpus } from './corpus';
import { loadHadith } from './hadith';
import { extractClaimQuotes, parseHadithLinks, parseQuranReferences } from './citations';

export type SourceIdentification = {
  status: 'identified' | 'ambiguous' | 'not_identified';
  corpus: 'quran' | 'hadith' | null;
  method: 'explicit_attribution' | 'exact_quotation' | 'normalized_quotation' | 'none';
  candidate_locators: string[];
  note: string;
};
export type IdentificationCollections = {
  verses: { id: string; display: string; search: string }[];
  records: { id: string; language: string; fields: Record<string, string | null> }[];
};
const absent = (note: string): SourceIdentification => ({ status: 'not_identified', corpus: null, method: 'none', candidate_locators: [], note });
function boundedLocators(locators: string[]): string[] {
  const unique = [...new Set(locators)];
  const quran = unique.filter(locator => locator.startsWith('quran:'));
  const hadith = unique.filter(locator => locator.startsWith('hadith:'));
  // Keep both families visible; classification always uses the full match set.
  if (quran.length && hadith.length) return [...quran.slice(0, 8), ...hadith.slice(0, 8)];
  return unique.slice(0, 16);
}
const meaningful = (text: string) => {
  const words = text.match(/\p{L}[\p{L}\p{M}]*/gu) ?? [];
  const letters = text.match(/\p{L}/gu) ?? [];
  // Source-introduction boilerplate is not a distinctive quotation.
  return ((words.length >= 3 && letters.length >= 10) || (words.length >= 2 && letters.length >= 12)) && !/^(?:قال رسول الله|قال النبي صلى الله عليه وسلم|the prophet said|the messenger of allah said)[.!؟\s]*$/iu.test(text);
};
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function queryPattern(text: string, language: 'ar' | 'en'): RegExp {
  // Construct variants from the query only; never rewrite publisher text or its indexes.
  const query = text.normalize('NFKC').toLowerCase().replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const marks = '[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]*';
  const words = query.split(/\s+/).map(word => language === 'ar'
    ? [...word].map(char => /[اأإآٱ]/.test(char) ? `[اأإآٱ]${marks}` : /[يى]/.test(char) ? `[يى]${marks}` : `${escape(char)}${marks}`).join('')
    : escape(word));
  return new RegExp(`(?<![\\p{L}\\p{N}])${words.join('[\\s\\p{P}]+')}(?![\\p{L}\\p{N}])`, 'iu');
}

/** Source routing only: no truth verdict, grading, paraphrase inference, or model call. */
export function identifySource(claim: string, inputLanguage: 'ar' | 'en', supplied?: IdentificationCollections): SourceIdentification {
  if (typeof claim !== 'string' || !['ar', 'en'].includes(inputLanguage) || claim.length > 1200) return absent('Enter an Arabic or English quotation, or select a source manually.');
  const refs = parseQuranReferences(claim);
  const links = parseHadithLinks(claim);
  if (refs.error || links.error) return absent('The explicit reference is malformed. Correct it or select the intended source.');
  if (/^(?:قال رسول الله|قال النبي صلى الله عليه وسلم|the prophet said|the messenger of allah said)[.!؟\s]*$/iu.test(claim.trim())) return absent('A source-introduction phrase alone cannot identify a quotation. Add its text.');
  const attribution = claim.replace(/["“«][^"”»]+["”»]/g, '').replace(/https?:\/\/\S+/g, '');
  const quranNamed = /\b(?:qur['’]?an|koran)\b|القرآن|القران|قرآن|قران/u.test(attribution.toLowerCase());
  const hadithNamed = /\b(?:hadith|hadeeth|prophet|messenger of allah)\b|حديث|الحديث|رسول الله|قال النبي/iu.test(attribution);
  const quranExplicit = quranNamed || refs.references.length > 0;
  const hadithExplicit = hadithNamed || links.links.length > 0;
  if (quranExplicit && hadithExplicit) return { status: 'ambiguous', corpus: null, method: 'explicit_attribution', candidate_locators: boundedLocators([...refs.references.map(id => `quran:${id}`), ...links.links.map(link => `hadith:${link.language}:${link.id}`)]), note: 'Both source families are explicitly mentioned. Select the intended source; no attribution has been corrected.' };
  if (quranExplicit || hadithExplicit) return { status: 'identified', corpus: quranExplicit ? 'quran' : 'hadith', method: 'explicit_attribution', candidate_locators: boundedLocators(quranExplicit ? refs.references.map(id => `quran:${id}`) : links.links.map(link => `hadith:${link.language}:${link.id}`)), note: 'Routed by the stated attribution or reference. This is not confirmation that the quotation or attribution is correct; verification must check it.' };
  const quotes = extractClaimQuotes(claim);
  const spans = (quotes.length ? quotes : [claim.trim()]).filter(meaningful);
  if (!spans.length) return absent('The quotation is too short or generic for source identification. Add more exact text or select a source.');
  let collections: IdentificationCollections;
  try { collections = supplied ?? { verses: loadCorpus().verses, records: loadHadith().records }; }
  catch { return absent('An admitted source failed availability or integrity checks. Automatic identification is unavailable.'); }
  const candidates = new Map<string, { corpus: 'quran' | 'hadith'; exact: boolean }>();
  for (const span of spans) {
    const pattern = queryPattern(span, inputLanguage);
    for (const verse of collections.verses) {
      if (inputLanguage !== 'ar') continue; // No English Quran translation is admitted.
      const exact = verse.display.includes(span) || verse.search.includes(span);
      if (exact || pattern.test(verse.display) || pattern.test(verse.search)) candidates.set(`quran:${verse.id}`, { corpus: 'quran', exact: exact || Boolean(candidates.get(`quran:${verse.id}`)?.exact) });
    }
    for (const record of collections.records) {
      if (record.language !== inputLanguage || !record.fields.hadith_text) continue;
      const text = record.fields.hadith_text;
      const exact = text.includes(span);
      if (exact || pattern.test(text)) candidates.set(`hadith:${record.language}:${record.id}`, { corpus: 'hadith', exact: exact || Boolean(candidates.get(`hadith:${record.language}:${record.id}`)?.exact) });
    }
  }
  if (!candidates.size) return absent('No direct quotation match was found in the admitted editions. This does not establish that the text is absent from all Quran or Hadith sources. Select a source manually for a paraphrase.');
  const families = new Set([...candidates.values()].map(value => value.corpus));
  const method = [...candidates.values()].some(value => value.exact) ? 'exact_quotation' : 'normalized_quotation';
  return { status: families.size === 1 ? 'identified' : 'ambiguous', corpus: families.size === 1 ? [...families][0] : null, method, candidate_locators: boundedLocators([...candidates.keys()]), note: families.size === 1 ? 'Direct quotation candidates identify a source family within admitted editions only. This is not a semantic verdict or independent authentication.' : 'The quotation occurs in both admitted source families. Select the intended source; no family was chosen automatically.' };
}
