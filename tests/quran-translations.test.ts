import { afterEach, expect, test, vi } from 'vitest';
const control = vi.hoisted(() => ({ corrupt: '', reads: 0 }));
vi.mock('node:fs', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs')>();
  return { ...original,
    readFileSync: (...args: Parameters<typeof original.readFileSync>) => { control.reads++; const file = String(args[0]).replaceAll('\\','/'); return control.corrupt && file.endsWith(control.corrupt) ? Buffer.from('tampered') : original.readFileSync(...args); },
    statSync: (...args: Parameters<typeof original.statSync>) => { const stat = original.statSync(...args)!; const file = String(args[0]).replaceAll('\\','/'); return control.corrupt && file.endsWith(control.corrupt) ? { ...stat, isFile: () => true, ctimeNs: (stat as unknown as {ctimeNs:bigint}).ctimeNs + 1n } : stat; },
  };
});
afterEach(() => { control.corrupt = ''; control.reads = 0; vi.resetModules(); });
test('warm reuse preserves frozen publisher fields while still authenticating admission pins', async () => {
  const { loadQuranTranslation, getQuranTranslationAdmission } = await import('../src/lib/quran-translations');
  const first = loadQuranTranslation('en')!; const before = control.reads;
  expect(loadQuranTranslation('en')).toBe(first); expect(control.reads - before).toBe(1);
  expect(Object.isFrozen(first.records[0])).toBe(true); expect(first.records).toHaveLength(6236);
  expect(getQuranTranslationAdmission().sources).toHaveLength(7);
});
test.each([
  ['docs/source-rights/quranenc/pins.json', 'QURAN_TRANSLATION_PIN_MISMATCH'],
  ['data/quranenc/en.json', 'QURAN_TRANSLATION_HASH_MISMATCH'],
  ['data/raw/quranenc/english_rwwad.sqlite', 'QURAN_TRANSLATION_RAW_HASH_MISMATCH'],
])('rejects %s tampering after a valid warm cache', async (file, code) => {
  const { loadQuranTranslation } = await import('../src/lib/quran-translations');
  loadQuranTranslation('en'); control.corrupt = file;
  expect(() => loadQuranTranslation('en')).toThrow(code);
  control.corrupt = ''; expect(loadQuranTranslation('en')?.records).toHaveLength(6236);
});
