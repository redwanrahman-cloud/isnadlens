import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const admittedPins = {
  corpus: 'b38d2ff661bd43dc3d57194cf10427856e2423594541f48c46b1f20e826e1dad',
  uthmani: '6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f',
  'simple-clean': '228df2a717671aeb9d2ff573002bd28d6b3f973f4bc7153554e3a81663d67610',
} as const;
export function validateAdmissionPins(corpus: Corpus): void {
  if (corpus.manifest.id !== 'tanzil-1.1-2026-10-04' || corpus.manifest.version !== '1.1' || corpus.manifest.sha256 !== admittedPins.corpus || corpus.manifest.sources.length !== 2) throw new Error('ADMISSION_PIN_MISMATCH');
  for (const type of ['uthmani', 'simple-clean'] as const) {
    const source = corpus.manifest.sources.find(s => s.type === type);
    const expectedId = type === 'uthmani' ? 'QURAN-AR-TANZIL-UTHMANI-V1.1' : 'QURAN-AR-TANZIL-SIMPLE-CLEAN-V1.1';
    if (!source || source.id !== expectedId || source.version !== '1.1' || source.raw_sha256 !== admittedPins[type] || source.url !== 'https://tanzil.net' || source.licence_url !== 'https://tanzil.net/docs/Text_License' || source.attribution !== 'Source: Tanzil Project') throw new Error('ADMISSION_PIN_MISMATCH');
  }
}
export const corpusSchema = z.object({ manifest: z.object({ id: z.string(), version: z.string(), sha256: hash,
  sources: z.array(z.object({ id: z.string(), type: z.string(), version: z.string(), raw_sha256: hash,
    attribution: z.string(), url: z.string().url(), licence_url: z.string().url() })).min(2),
}), verses: z.array(z.object({ id: z.string(), surah: z.number().int(), ayah: z.number().int(),
  display: z.string().min(1), search: z.string().min(1), display_sha256: hash })) });
export type Corpus = z.infer<typeof corpusSchema>;
export type Verse = Corpus['verses'][number];
const counts = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
export function validateCorpus(raw: unknown): Corpus {
  const corpus = corpusSchema.parse(raw);
  if (sha256(JSON.stringify(corpus.verses)) !== corpus.manifest.sha256) throw new Error('CORPUS_HASH_MISMATCH');
  if (corpus.verses.length !== 6236) throw new Error('CORPUS_INCOMPLETE');
  const locators = new Set<string>();
  for (const verse of corpus.verses) {
    if (verse.id !== `${verse.surah}:${verse.ayah}` || verse.surah < 1 || verse.surah > 114 || verse.ayah < 1 || verse.ayah > counts[verse.surah - 1] || locators.has(verse.id)) throw new Error('LOCATOR_INVALID');
    if (sha256(verse.display) !== verse.display_sha256) throw new Error('QUOTATION_HASH_MISMATCH');
    locators.add(verse.id);
  }
  // Enforce the complete edition, not merely a coincidentally correct row count.
  counts.forEach((count, index) => { for (let ayah = 1; ayah <= count; ayah++) if (!locators.has(`${index + 1}:${ayah}`)) throw new Error('CORPUS_INCOMPLETE'); });
  return corpus;
}
export function loadCorpus(): Corpus {
  const corpus = validateCorpus(JSON.parse(readFileSync(join(process.cwd(), 'data', 'corpus.json'), 'utf8')));
  validateAdmissionPins(corpus);
  validateRawSources(corpus, {
    uthmani: readFileSync(join(process.cwd(), 'data', 'raw', 'uthmani.txt')),
    'simple-clean': readFileSync(join(process.cwd(), 'data', 'raw', 'simple-clean.txt')),
  });
  return corpus;
}
export function validateRawSources(corpus: Corpus, raw: Record<'uthmani' | 'simple-clean', Buffer>): void {
  for (const type of ['uthmani', 'simple-clean'] as const) {
    const source = corpus.manifest.sources.find(s => s.type === type);
    if (!source || source.version !== '1.1' || !['https://tanzil.net', 'https://tanzil.net/'].includes(source.url) || source.licence_url !== 'https://tanzil.net/docs/Text_License') throw new Error('SOURCE_NOT_ALLOWLISTED');
    if (createHash('sha256').update(raw[type]).digest('hex') !== source.raw_sha256) throw new Error('RAW_SOURCE_HASH_MISMATCH');
    const text = raw[type].toString('utf8');
    if (!text.includes('Version 1.1') || !text.includes('Tanzil')) throw new Error('SOURCE_NOTICE_MISSING');
    const rows = new Map<string, string>();
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue;
      const match = /^(\d+)\|(\d+)\|(.*)$/.exec(line);
      if (!match || rows.has(`${Number(match[1])}:${Number(match[2])}`)) throw new Error('RAW_SOURCE_ROW_INVALID');
      rows.set(`${Number(match[1])}:${Number(match[2])}`, match[3]);
    }
    if (rows.size !== 6236) throw new Error('RAW_SOURCE_INCOMPLETE');
    for (const verse of corpus.verses) if (rows.get(verse.id) !== (type === 'uthmani' ? verse.display : verse.search)) throw new Error('RAW_JOIN_MISMATCH');
  }
}
