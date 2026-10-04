import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { sha256, loadCorpus } from './corpus';
import type { EvidenceItem } from './contracts';
const PIN_HASH = '02e8640257bd54ea32a5f9c300e97a55619ba2d512351132936374d2952f0f96';
const languages = ['en', 'hi', 'ur', 'id', 'es', 'fr', 'de'] as const;
const rowSchema = z.object({ id: z.number().int(), sura: z.number().int(), aya: z.number().int(), translation: z.string().min(1), footnotes: z.string() });
const editionSchema = z.object({ metadata: z.object({ key: z.string(), language_iso_code: z.string(), version: z.string(), title: z.string(), description: z.string() }).passthrough(), notice: z.string(), records: z.array(rowSchema) });
type Edition = z.infer<typeof editionSchema>;
const cache = new Map<string, { fingerprint: string; edition: Edition }>();
function fingerprint(paths: string[]) {
  return JSON.stringify(paths.map(file => { const stat = statSync(file, { bigint: true }); if (!stat.isFile()) throw new Error('QURAN_TRANSLATION_FILE_INVALID'); return [file, stat.size.toString(), stat.mtimeNs.toString(), stat.ctimeNs.toString(), stat.ino.toString(), stat.dev.toString()]; }));
}
function freeze<T>(value: T): T { if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } return value; }
export function getQuranTranslationAdmission() {
  let bytes: Buffer;
  try { bytes = readFileSync(join(process.cwd(), 'docs', 'source-rights', 'quranenc', 'pins.json')); }
  catch (error) { cache.clear(); throw error; }
  if (createHash('sha256').update(bytes).digest('hex') !== PIN_HASH) { cache.clear(); throw new Error('QURAN_TRANSLATION_PIN_MISMATCH'); }
  return freeze(JSON.parse(bytes.toString('utf8')) as { id: string; terms_url: string; notice: string; sources: { language: string; key: string; version: string; json_sha256: string; raw_sha256: string; record_count: number }[]; unavailable: Record<string,string> });
}
export function loadQuranTranslation(language: string): Edition | null {
  if (!languages.includes(language as typeof languages[number])) return null;
  const pinPath = join(process.cwd(), 'docs', 'source-rights', 'quranenc', 'pins.json');
  let pinsBytes: Buffer;
  try { pinsBytes = readFileSync(pinPath); } catch (error) { cache.clear(); throw error; }
  if (sha256(pinsBytes.toString('utf8')) !== PIN_HASH) { cache.clear(); throw new Error('QURAN_TRANSLATION_PIN_MISMATCH'); }
  const pins = JSON.parse(pinsBytes.toString('utf8')) as { notice: string; sources: {language:string; key:string;version:string;filename:string;json_sha256:string;raw_sha256:string;record_count:number}[] };
  const pin = pins.sources.find(source => source.language === language);
  if (!pin || pin.filename !== `${language}.json` || !/^[a-z_]+$/.test(pin.key)) throw new Error('QURAN_TRANSLATION_PIN_INVALID');
  const jsonPath = join(process.cwd(), 'data', 'quranenc', `${language}.json`);
  const rawPath = join(process.cwd(), 'data', 'raw', 'quranenc', `${pin.key}.sqlite`);
  const paths = [pinPath, jsonPath, rawPath];
  let current: string;
  try { current = fingerprint(paths); } catch (error) { cache.delete(language); throw error; }
  const previous = cache.get(language);
  // Trust local filesystem metadata / immutable deployment image, not hostile metadata forgery.
  if (previous?.fingerprint === current) return previous.edition;
  cache.delete(language);
  const bytes = readFileSync(jsonPath); const raw = readFileSync(rawPath);
  if (createHash('sha256').update(bytes).digest('hex') !== pin.json_sha256) throw new Error('QURAN_TRANSLATION_HASH_MISMATCH');
  // Binary SQLite must be hashed as bytes rather than a transcoded string.
  const binaryHash = createHash('sha256').update(raw).digest('hex');
  if (binaryHash !== pin.raw_sha256) throw new Error('QURAN_TRANSLATION_RAW_HASH_MISMATCH');
  const edition = editionSchema.parse(JSON.parse(bytes.toString('utf8')));
  if (edition.metadata.key !== pin.key || edition.metadata.language_iso_code !== language || edition.metadata.version !== pin.version || edition.notice !== pins.notice || edition.records.length !== 6236 || pin.record_count !== 6236) throw new Error('QURAN_TRANSLATION_EDITION_MISMATCH');
  const original = loadCorpus();
  edition.records.forEach((record, index) => { if (`${record.sura}:${record.aya}` !== original.verses[index].id) throw new Error('QURAN_TRANSLATION_LOCATOR_MISMATCH'); });
  if (fingerprint(paths) !== current) throw new Error('QURAN_TRANSLATION_CHANGED_DURING_VALIDATION');
  const frozen = freeze(edition); cache.set(language, { fingerprint: current, edition: frozen }); return frozen;
}
export function quranTranslationEvidence(language: string, locator: string): EvidenceItem | null {
  const edition = loadQuranTranslation(language); if (!edition) return null;
  const row = edition.records.find(record => `${record.sura}:${record.aya}` === locator); if (!row) return null;
  return { evidence_id: `quranenc:${edition.metadata.key}:${edition.metadata.version}:${locator}`, source_id: `QURANENC-${edition.metadata.key}`, title: edition.metadata.title, version: edition.metadata.version, locator, quotation: row.translation, quotation_sha256: sha256(row.translation), source_url: `https://quranenc.com/en/browse/${edition.metadata.key}/${row.sura}/${row.aya}`, attribution: `Source: QuranEnc.com — ${edition.metadata.title}`, source_language: language, publisher_fields: { translation: row.translation, footnotes: row.footnotes, description: edition.metadata.description, publisher: edition.metadata.title }, publisher_notice: edition.notice, source_context: [], semantic_relation: 'not_assessed', integrity: { passed: true, checks: [{ id: 'translation_edition_hash', passed: true, reason: 'Exact publisher edition and original SQLite match committed admission pins.' }, { id: 'translation_locator', passed: true, reason: 'Surah and ayah join to the admitted Arabic original by numeric identity.' }] } };
}
