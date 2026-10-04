import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const expected = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
await mkdir(path.join(root, 'data/raw'), { recursive: true });
await mkdir(path.join(root, 'docs/source-rights'), { recursive: true });
const acquisitions = [];
async function acquire(url, relative) {
  const response = await fetch(url); // Normal platform TLS verification; no bypass.
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(root, relative), bytes);
  acquisitions.push({ requested_url: url, final_url: response.url, acquired_at: new Date().toISOString(), path: relative, bytes: bytes.length, sha256: hash(bytes), content_type: response.headers.get('content-type') });
  return bytes.toString('utf8');
}
await acquire('https://tanzil.net/docs/Text_License', 'docs/source-rights/tanzil-license.html');
await acquire('https://tanzil.net/updates/', 'docs/source-rights/tanzil-updates.html');
await acquire('https://tanzil.net/docs/Quran_Text_Types', 'docs/source-rights/tanzil-text-types.html');
const editions = {};
const notices = {};
for (const type of ['uthmani', 'simple-clean']) {
  const params = new URLSearchParams({ quranType: type, outType: 'txt-2', agree: 'true' });
  if (type === 'uthmani') for (const option of ['marks', 'sajdah', 'tatweel']) params.set(option, 'true');
  const text = await acquire(`https://tanzil.net/pub/download/index.php?${params}`, `data/raw/${type}.txt`);
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) continue;
    const match = /^(\d+)\|(\d+)\|(.*)$/.exec(line);
    if (!match) throw new Error(`Unexpected source line in ${type}`);
    const [, s, a, exactText] = match;
    const surah = Number(s), ayah = Number(a), id = `${surah}:${ayah}`;
    if (surah < 1 || surah > 114 || ayah < 1 || ayah > expected[surah - 1] || map.has(id) || exactText.length === 0) throw new Error(`Invalid identifier ${id}`);
    map.set(id, { surah, ayah, text: exactText });
  }
  if (map.size !== 6236) throw new Error(`${type}: ${map.size} verses`);
  for (let surah = 1; surah <= 114; surah++) for (let ayah = 1; ayah <= expected[surah - 1]; ayah++) if (!map.has(`${surah}:${ayah}`)) throw new Error(`Missing ${surah}:${ayah}`);
  editions[type] = map;
  const notice = text.split(/\r?\n/).filter(line => line.startsWith('#')).join('\n');
  notices[type] = notice;
  if (!notice.includes('Version 1.1') || !notice.includes('Tanzil')) throw new Error('Missing edition/version notice');
  await writeFile(path.join(root, `docs/source-rights/TANZIL-${type.toUpperCase()}-NOTICE.txt`), notice + '\n');
}
await writeFile(path.join(root, 'data/TANZIL-NOTICE.txt'), Object.values(notices).join('\n\n') + '\n');
const verses = [...editions.uthmani].map(([id, v]) => ({ id, surah: v.surah, ayah: v.ayah, display: v.text, search: editions['simple-clean'].get(id).text, display_sha256: hash(v.text) }));
const manifest = { id: 'tanzil-1.1-2026-10-04', version: '1.1', sha256: hash(JSON.stringify(verses)), sources: ['uthmani', 'simple-clean'].map(type => ({ id: type === 'uthmani' ? 'QURAN-AR-TANZIL-UTHMANI-V1.1' : 'QURAN-AR-TANZIL-SIMPLE-CLEAN-V1.1', type, version: '1.1', raw_sha256: acquisitions.find(x => x.path === `data/raw/${type}.txt`).sha256, attribution: 'Source: Tanzil Project', url: 'https://tanzil.net', licence_url: 'https://tanzil.net/docs/Text_License' })) };
manifest.copyright_notices = notices;
await writeFile(path.join(root, 'data/corpus.json'), JSON.stringify({ manifest, verses }));
await writeFile(path.join(root, 'docs/source-rights/tanzil-acquisition.json'), JSON.stringify({ acquisitions, manifest, validation: { unique_verses_per_edition: 6236, surahs: 114, per_surah_counts: expected, exact_text_preserved: true, join: 'surah:ayah only' } }, null, 2));
console.log(JSON.stringify({ manifest, count: verses.length, sources: acquisitions.filter(x => x.path.startsWith('data/')) }, null, 2));
