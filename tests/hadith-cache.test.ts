import { afterEach, expect, test, vi } from 'vitest';
import { performance } from 'node:perf_hooks';

const control = vi.hoisted(() => ({ reads: 0, statPaths: new Set<string>(), changedPath: '', missingPath: '', corruptPath: '', metadataKey: 'ctimeNs', race: false, raceCalls: 0 }));
vi.mock('node:fs', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs')>();
  return { ...original,
    readFileSync: (...args: Parameters<typeof original.readFileSync>) => {
      control.reads++;
      const name = String(args[0]).replaceAll('\\', '/');
      if (name.endsWith(control.corruptPath) && control.corruptPath) return (args[1] as unknown) === 'utf8' ? '{}' : Buffer.from('tampered');
      return original.readFileSync(...args);
    },
    statSync: (...args: Parameters<typeof original.statSync>) => {
      const name = String(args[0]).replaceAll('\\', '/'); control.statPaths.add(name);
      if (control.missingPath && name.endsWith(control.missingPath)) throw new Error('ENOENT');
      const stat = original.statSync(...args)!;
      if (control.changedPath && name.endsWith(control.changedPath)) {
        if (!control.race || ++control.raceCalls > 1) {
          const key = control.metadataKey as keyof typeof stat;
          return { ...stat, isFile: () => true, [key]: BigInt(stat[key] as bigint) + 1n };
        }
      }
      return stat;
    },
  };
});
afterEach(() => {
  control.changedPath = ''; control.missingPath = ''; control.corruptPath = ''; control.race = false; control.raceCalls = 0;
  control.reads = 0; control.statPaths.clear(); vi.resetModules();
});

test('reuses only a fully validated deep-frozen corpus and checks all eight files each time', async () => {
  const { loadHadith } = await import('../src/lib/hadith');
  const start = performance.now(); const first = loadHadith(); const cold = performance.now() - start;
  const reads = control.reads;
  expect(reads).toBe(8);
  expect(control.statPaths.size).toBe(8);
  const warmStart = performance.now(); const again = loadHadith(); const warm = performance.now() - warmStart;
  expect(again).toBe(first); expect(control.reads).toBe(reads);
  expect(Object.isFrozen(first)).toBe(true); expect(Object.isFrozen(first.records)).toBe(true);
  expect(Object.isFrozen(first.records[0].fields)).toBe(true); expect(Object.isFrozen(first.manifest.sources[0])).toBe(true);
  expect(() => { first.records[0].fields.hadith_text = 'changed'; }).toThrow();
  console.info(`Hadith cache benchmark: cold ${cold.toFixed(1)} ms; warm ${warm.toFixed(3)} ms; records ${first.records.length}`);
});

test('invalidates on every source path and every required metadata dimension before reading', async () => {
  const { loadHadith } = await import('../src/lib/hadith');
  const paths = ['docs/source-rights/hadeethenc-pins.json', 'data/hadeethenc.json', ...['ar','en','bn','hi','ur','id'].map(l => `data/raw/hadeethenc/hadeethenc-${l}.xlsx`)];
  // Restore the real fingerprint after each fail-closed attempt; no real file is modified.
  for (const changedPath of paths) {
    control.changedPath = ''; control.corruptPath = ''; loadHadith();
    control.changedPath = changedPath; control.corruptPath = 'docs/source-rights/hadeethenc-pins.json';
    expect(() => loadHadith()).toThrow('HADITH_PIN_FILE_MISMATCH');
  }
  for (const metadataKey of ['size', 'mtimeNs', 'ctimeNs', 'ino', 'dev']) {
    control.changedPath = ''; control.corruptPath = ''; loadHadith();
    control.metadataKey = metadataKey; control.changedPath = 'data/hadeethenc.json'; control.corruptPath = 'docs/source-rights/hadeethenc-pins.json';
    expect(() => loadHadith()).toThrow('HADITH_PIN_FILE_MISMATCH');
  }
}, 30000);

test('missing sources clear the cache; restored files cannot resurrect the previous cached object', async () => {
  const { loadHadith } = await import('../src/lib/hadith'); const before = loadHadith();
  control.missingPath = 'data/raw/hadeethenc/hadeethenc-ur.xlsx';
  expect(() => loadHadith()).toThrow('ENOENT');
  control.missingPath = ''; control.corruptPath = 'docs/source-rights/hadeethenc-pins.json';
  expect(() => loadHadith()).toThrow('HADITH_PIN_FILE_MISMATCH');
  control.corruptPath = ''; expect(loadHadith()).not.toBe(before);
});

test('detects raw-byte tampering and rejects a metadata race during validation', async () => {
  const { loadHadith } = await import('../src/lib/hadith'); loadHadith();
  control.changedPath = 'data/raw/hadeethenc/hadeethenc-en.xlsx'; control.corruptPath = control.changedPath;
  expect(() => loadHadith()).toThrow('HADITH_RAW_HASH_MISMATCH');
  control.corruptPath = ''; control.race = true; control.raceCalls = 0;
  expect(() => loadHadith()).toThrow('HADITH_SOURCES_CHANGED_DURING_VALIDATION');
});
