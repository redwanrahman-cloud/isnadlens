import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const sha = value => createHash('sha256').update(value).digest('hex');
await mkdir(path.join(root, 'data/raw/quranenc'), { recursive: true });
await mkdir(path.join(root, 'docs/source-rights/quranenc'), { recursive: true });
async function download(url, limit) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const chunks = []; let length = 0;
  for await (const bytes of response.body) { length += bytes.length; if (length > limit) throw new Error(`Download limit exceeded: ${url}`); chunks.push(bytes); }
  return { bytes: Buffer.concat(chunks), url: response.url, acquired_at: new Date().toISOString() };
}
const catalogResponse = await download('https://quranenc.com/api/v1/translations/list', 2_000_000);
await writeFile(path.join(root, 'docs/source-rights/quranenc/catalog.json'), catalogResponse.bytes);
const catalog = JSON.parse(catalogResponse.bytes).translations;
const termsResponse = await download('https://quranenc.com/en/home/api/', 2_000_000);
await writeFile(path.join(root, 'docs/source-rights/quranenc/api-and-terms.html'), termsResponse.bytes);
const notice = 'Contents of the translations can be downloaded and re-published, with the following terms and conditions:\n1. No modification, addition, or deletion of the content.\n2. Clearly referring to the publisher and the source (QuranEnc.com).\n3. Mentioning the version number when re-publishing the translation.\n4. Keeping the transcript information inside the document.\n5. Notifying the source (QuranEnc.com) of any note on the translation.\n6. Updating the translation according to the latest version issued from the source (QuranEnc.com).\n7. Inappropriate advertisements must not be included when displaying translations of the meanings of the Noble Quran.';
if (!termsResponse.bytes.toString().includes('No modification, addition, or deletion')) throw new Error('Terms snapshot mismatch');
const selections = { en: 'english_rwwad', fr: 'french_rashid', es: 'spanish_garcia', de: 'german_rwwad', id: 'indonesian_sabiq', ur: 'urdu_junagarhi', hi: 'hindi_omari' };
const expected = JSON.parse(await readFile(path.join(root, 'data/corpus.json'), 'utf8')).verses.map(v => `${v.surah}:${v.ayah}`);
await mkdir(path.join(root, 'data/quranenc'), { recursive: true });
const pins = { id: 'quranenc-display-2026-10-04', terms_url: 'https://quranenc.com/en/home/api/', notice, sources: [], unavailable: { bn: 'Official catalog omits Bengali editions; publisher version could not be verified. No edition admitted.', ar: 'Arabic original comes from admitted Tanzil, not a QuranEnc translation.' } };
async function acquire(language, key) {
  const metadata = catalog.find(item => item.key === key && item.language_iso_code === language);
  if (!metadata?.version || metadata.database_uncompressed_url !== `https://quranenc.com/downloads/sqlite/${key}.sqlite`) throw new Error('Catalog source mismatch');
  const acquired = await download(metadata.database_uncompressed_url, 20_000_000);
  const target = path.join(root, `data/raw/quranenc/${key}.sqlite`);
  await writeFile(target, acquired.bytes);
  const db = new DatabaseSync(target, { readOnly: true });
  let records;
  try { records = db.prepare('SELECT id,sura,aya,translation,footnotes FROM translations ORDER BY sura,aya').all(); } finally { db.close(); }
  if (records.length !== 6236 || records.some((record, index) => `${record.sura}:${record.aya}` !== expected[index] || typeof record.translation !== 'string' || !record.translation || typeof record.footnotes !== 'string')) throw new Error(`Incomplete/invalid edition: ${key}`);
  const bytes = Buffer.from(JSON.stringify({ metadata, notice, records }));
  const filename = `${language}.json`;
  await writeFile(path.join(root, 'data/quranenc', filename), bytes);
  pins.sources.push({ language, key, version: metadata.version, filename, json_sha256: sha(bytes), raw_sha256: sha(acquired.bytes), raw_bytes: acquired.bytes.length, json_bytes: bytes.length, record_count: records.length, acquired_at: acquired.acquired_at, source_url: acquired.url });
  console.log(`${language}: ${records.length} records, v${metadata.version}, ${bytes.length} bytes`);
}
const entries = Object.entries(selections);
for (let index = 0; index < entries.length; index += 2) await Promise.all(entries.slice(index, index + 2).map(([language, key]) => acquire(language, key)));
pins.sources.sort((a, b) => a.language.localeCompare(b.language));
await writeFile(path.join(root, 'docs/source-rights/quranenc/pins.json'), JSON.stringify(pins, null, 2) + '\n');
console.log('Admission pins SHA256', sha(Buffer.from(JSON.stringify(pins, null, 2) + '\n')));
