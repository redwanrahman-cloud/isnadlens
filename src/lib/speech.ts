/** Text is chunked only for playback; stored evidence is never changed. */
export function speechChunks(text: string, maxLength = 220): string[] {
  if (!Number.isInteger(maxLength) || maxLength < 20) throw new Error('INVALID_SPEECH_CHUNK_SIZE');
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > maxLength) {
    const window = rest.slice(0, maxLength + 1);
    const breakAt = Math.max(window.lastIndexOf(' '), window.lastIndexOf('\n'));
    let end = breakAt > maxLength / 3 ? breakAt : maxLength;
    // Avoid splitting a UTF-16 surrogate pair in scripts/emoji.
    if (end > 0 && /[\uD800-\uDBFF]/.test(rest[end - 1])) end--;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}
export function matchingVoices<T extends {lang: string; localService: boolean}>(voices: T[], language: string): T[] {
  const prefix = language.toLowerCase().split(/[-_]/)[0];
  return voices.filter(voice => voice.lang.toLowerCase().split(/[-_]/)[0] === prefix)
    .sort((a, b) => Number(b.localService) - Number(a.localService));
}
