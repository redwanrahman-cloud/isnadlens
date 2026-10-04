import {expect, test} from 'vitest';
import {matchingVoices, speechChunks} from '../src/lib/speech';
test('long multilingual speech preserves words and avoids broken surrogate pairs', () => {
  const text = ('إنما الأعمال بالنيات 💚 Read the published translation. ').repeat(20).trim();
  const chunks = speechChunks(text);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every(chunk => chunk.length <= 220 && !/[\uD800-\uDBFF]$/.test(chunk))).toBe(true);
  expect(chunks.join(' ')).toBe(text);
});
test('voice selection stays in the requested language and prefers a local voice', () => {
  const voices = [{lang:'en-US',localService:true}, {lang:'ar-SA',localService:false}, {lang:'ar_EG',localService:true}];
  expect(matchingVoices(voices,'ar')).toEqual([voices[2],voices[1]]);
  expect(matchingVoices(voices,'bn')).toEqual([]);
});
