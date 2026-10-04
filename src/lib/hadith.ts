import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { sha256 } from './corpus';
import { queryTerms } from './retrieval';
import type { EvidenceItem } from './contracts';
import { parseHadithLinks, extractClaimQuotes } from './citations';

const languages = z.enum(['ar', 'en', 'bn', 'hi', 'ur', 'id']);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const sourceSchema = z.object({ language: languages, raw_sha256: hash, version: z.string(), filename: z.string() });
const pinSchema = z.object({ id: z.string(), sha256: hash, sources: z.array(sourceSchema), counts: z.record(z.string(), z.number().int().positive()) });
export const hadithSchema = z.object({ manifest: z.object({ id: z.string(), version: z.string(), sha256: hash, sources: z.array(sourceSchema.extend({ notice: z.string() })) }), records: z.array(z.object({ id: z.string().regex(/^\d+$/), language: languages, fields: z.record(z.string(), z.string().nullable()), quotation_sha256: hash })) });
export type HadithCorpus = z.infer<typeof hadithSchema>;
export type HadithRecord = HadithCorpus['records'][number];
const ADMITTED_RECORDS_HASH = '4b8dcc11ef25e42c44b1333eaed643adfb752d6868513f6b98465513d465e17d';
// This pin is updated only when the committed admission artifact changes after source review.
const ADMITTED_PIN_FILE_HASH = 'c419ec4106b358d8ca409f1f537acfbf91f1ba572d0f37887c89bcb319309a33';
export function validateHadith(raw: unknown, pins: z.infer<typeof pinSchema>): HadithCorpus {
  const corpus = hadithSchema.parse(raw);
  if (corpus.manifest.id !== pins.id || corpus.manifest.sha256 !== pins.sha256 || pins.sha256 !== ADMITTED_RECORDS_HASH || sha256(JSON.stringify(corpus.records)) !== ADMITTED_RECORDS_HASH) throw new Error('HADITH_ADMISSION_HASH_MISMATCH');
  if (corpus.manifest.sources.length !== 6 || pins.sources.length !== 6) throw new Error('HADITH_SOURCE_INCOMPLETE');
  const counts: Record<string, number> = {}; const keys = new Set<string>();
  for (const record of corpus.records) {
    const key = `${record.language}:${record.id}`;
    if (keys.has(key) || record.fields.id !== record.id || !record.fields.hadith_text || sha256(record.fields.hadith_text) !== record.quotation_sha256 || record.fields.link !== `https://hadeethenc.com/${record.language}/browse/hadith/${record.id}`) throw new Error('HADITH_ROW_INVALID');
    keys.add(key); counts[record.language] = (counts[record.language] ?? 0) + 1;
  }
  for (const language of languages.options) {
    if (counts[language] !== pins.counts[language]) throw new Error('HADITH_COUNT_MISMATCH');
    const source = corpus.manifest.sources.find(s => s.language === language);
    const pin = pins.sources.find(s => s.language === language);
    if (!source || !pin || source.filename !== `hadeethenc-${language}.xlsx` || source.filename !== pin.filename || source.raw_sha256 !== pin.raw_sha256 || source.version !== pin.version || !source.notice.includes(`https://hadeethenc.com/${language}`) || !source.notice.includes("PLEASE DON'T REMOVE")) throw new Error('HADITH_SOURCE_PIN_MISMATCH');
  }
  return corpus;
}
let cachedHadith: { fingerprint: string; corpus: HadithCorpus } | undefined;
function sourceFingerprint(): string {
  const paths = [join(process.cwd(), 'docs', 'source-rights', 'hadeethenc-pins.json'),
    join(process.cwd(), 'data', 'hadeethenc.json'),
    ...languages.options.map(language => join(process.cwd(), 'data', 'raw', 'hadeethenc', `hadeethenc-${language}.xlsx`))];
  return JSON.stringify(paths.map(absolute => {
    const stat = statSync(absolute, { bigint: true });
    if (!stat.isFile()) throw new Error('HADITH_SOURCE_NOT_FILE');
    return [absolute, stat.size.toString(), stat.mtimeNs.toString(), stat.ctimeNs.toString(), stat.ino.toString(), stat.dev.toString()];
  }));
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
// Stat reuse assumes trusted local files / an immutable pinned deployment image.
// Metadata is an invalidation signal, not a fresh cryptographic proof of unchanged bytes.
// An attacker controlling the filesystem and its metadata is outside this cache trust boundary.
export function loadHadith(): HadithCorpus {
  let fingerprint: string;
  try { fingerprint = sourceFingerprint(); }
  catch (error) { cachedHadith = undefined; throw error; }
  if (cachedHadith?.fingerprint === fingerprint) return cachedHadith.corpus;
  cachedHadith = undefined;
  const pinsBytes = readFileSync(join(process.cwd(), 'docs/source-rights/hadeethenc-pins.json'));
  if (createHash('sha256').update(pinsBytes).digest('hex') !== ADMITTED_PIN_FILE_HASH) throw new Error('HADITH_PIN_FILE_MISMATCH');
  const pins = pinSchema.parse(JSON.parse(pinsBytes.toString('utf8')));
  const corpus = validateHadith(JSON.parse(readFileSync(join(process.cwd(), 'data/hadeethenc.json'), 'utf8')), pins);
  for (const source of corpus.manifest.sources) {
    const bytes = readFileSync(join(process.cwd(), 'data/raw/hadeethenc', source.filename));
    if (createHash('sha256').update(bytes).digest('hex') !== source.raw_sha256) throw new Error('HADITH_RAW_HASH_MISMATCH');
  }
  // Refuse publication if a file changed while the full validation was in progress.
  if (sourceFingerprint() !== fingerprint) throw new Error('HADITH_SOURCES_CHANGED_DURING_VALIDATION');
  const frozen = deepFreeze(corpus);
  cachedHadith = { fingerprint, corpus: frozen };
  return frozen;
}
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function retrieveHadith(corpus: HadithCorpus, query: string, language: 'ar' | 'en', limit = 8): HadithRecord[] {
  const explicit = parseHadithLinks(query).links;
  const boilerplate = new Set(['prophet', 'messenger', 'muhammad', 'said', 'says', 'hadith', 'hadeeth', 'that', 'have', 'has', 'no', 'not', 'explicitly', 'نبي', 'النبي', 'رسول', 'الرسول', 'قال', 'حديث']);
  const lexicalSynonyms: Record<string, string[]> = { actions: ['deeds'], action: ['deed'], deeds: ['actions'], deed: ['action'], judged: ['rewarded', 'considered'] };
  const originalTerms = queryTerms(query).filter(t => !boilerplate.has(t) && (language === 'ar' ? /\p{Script=Arabic}/u.test(t) : /\p{Script=Latin}/u.test(t)));
  const terms = [...new Set([...originalTerms, ...originalTerms.flatMap(term => lexicalSynonyms[term] ?? [])])].slice(0, 48);
  const patterns = terms.map(term => language === 'ar' ? new RegExp([...term].map(char => /[اأإآٱ]/.test(char) ? '[اأإآٱ]' : escapeRegex(char)).join('[\u064b-\u065f\u0670]*'), 'u') : new RegExp(`\\b${escapeRegex(term.length > 3 && term.endsWith('s') ? term.slice(0, -1) : term)}s?\\b`, 'i'));
  const selected = corpus.records.filter(record => record.language === language);
  const weights = patterns.map(pattern => {
    const frequency = selected.filter(record => pattern.test(record.fields.hadith_text ?? '') || pattern.test(record.fields.title ?? '')).length;
    return 1 + Math.log((selected.length + 1) / (frequency + 1));
  });
  return selected.map(record => {
    // Publisher title/text remain unchanged. Explanations are not promoted into primary quotation support.
    const title = record.fields.title ?? ''; const text = record.fields.hadith_text ?? '';
    const score = (explicit.some(link => record.language === link.language && record.id === link.id) ? 1000 : 0) + patterns.reduce((n, pattern, index) => n + weights[index] * ((pattern.test(text) ? 1 : 0) + (pattern.test(title) ? .5 : 0)), 0);
    return { record, score };
  }).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score || Number(a.record.id) - Number(b.record.id)).slice(0, limit).map(hit => hit.record);
}
export function checkHadithCitation(corpus: HadithCorpus, claim: string, language: 'ar' | 'en'): string | null {
  const parsed = parseHadithLinks(claim);
  if (parsed.error) return parsed.error;
  const links = parsed.links;
  if (!links.length) return null;
  if (links.some(link => link.language !== language)) return 'HADITH_CITATION_LANGUAGE_MISMATCH';
  const cited = links.map(link => corpus.records.find(record => record.language === link.language && record.id === link.id));
  if (cited.some(record => !record)) return 'HADITH_EXPLICIT_LOCATOR_INVALID';
  const quotes = extractClaimQuotes(claim);
  if (quotes.some(quote => !cited.some(record => record?.fields.hadith_text?.includes(quote)))) return 'HADITH_EXPLICIT_QUOTATION_MISMATCH';
  return null;
}
export function authenticateHadith(corpus: HadithCorpus, record: HadithRecord): EvidenceItem {
  const source = corpus.manifest.sources.find(s => s.language === record.language)!;
  const admitted = corpus.records.find(r => r.id === record.id && r.language === record.language);
  const passed = Boolean(admitted && JSON.stringify(admitted) === JSON.stringify(record) && sha256(record.fields.hadith_text ?? '') === record.quotation_sha256);
  return { evidence_id: `${corpus.manifest.id}:${record.language}:${record.id}`, source_id: `HADEETHENC-${record.language.toUpperCase()}`, title: record.fields.title ?? 'HadeethEnc publisher record', version: source.version, locator: `${record.language}:${record.id}`, quotation: record.fields.hadith_text!, quotation_sha256: record.quotation_sha256, source_url: record.fields.link!, attribution: 'Source: HadeethEnc.com — publisher text and grading preserved unchanged', integrity: { passed, checks: [{ id: 'hadith_exact_record_hash', passed, reason: 'Quotation and publisher fields match the admitted language edition; this is citation integrity, not independent hadith authentication.' }] }, semantic_relation: 'not_assessed', source_context: [], source_language: record.language, publisher_fields: record.fields, publisher_grade_status: 'publisher_supplied_not_independently_graded', publisher_notice: source.notice };
}
export function getHadithCoverage() {
  try { const corpus = loadHadith(); return { approved: true, record_count: corpus.records.length, languages: languages.options, version: corpus.manifest.version, counts_by_language: Object.fromEntries(languages.options.map(language => [language, corpus.records.filter(r => r.language === language).length])), limitations: ['Arabic and English fresh claim retrieval only; six unchanged publisher language editions admitted.', 'Publisher grades and references are preserved, not independently authenticated.', 'Language editions differ in coverage; text is never merged or overwritten.'] }; }
  catch { return { approved: false, record_count: 0, languages: [] as string[], version: 'not_admitted', limitations: ['Hadith source files are missing or failed admission/integrity checks.'] }; }
}
