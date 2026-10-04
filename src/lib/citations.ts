export function asciiDigits(text: string): string {
  return text.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0));
}
export function parseQuranReferences(claim: string): { references: string[]; error: string | null } {
  const references: string[] = [];
  const matches = [...claim.matchAll(/(?:^|[^\p{N}])(-?[0-9٠-٩۰-۹]+)\s*:\s*([^\s"“”«»<>]+)/gu)];
  for (const match of matches) {
    const surah = asciiDigits(match[1]);
    const ayah = asciiDigits(match[2].replace(/[.,;!?،؛۔)\]}]+$/u, ''));
    // Ranges/multiple chained references are not silently reduced to their first verse.
    if (!/^\d{1,3}$/.test(surah) || !/^\d{1,3}$/.test(ayah)) return { references: [], error: 'EXPLICIT_LOCATOR_MALFORMED_OR_RANGE_UNSUPPORTED' };
    references.push(`${Number(surah)}:${Number(ayah)}`);
  }
  return { references: [...new Set(references)], error: null };
}
export function parseHadithLinks(claim: string): { links: { language: string; id: string }[]; error: string | null } {
  const links: { language: string; id: string }[] = [];
  const matches = [...claim.matchAll(/https?:\/\/(?:www\.)?hadeethenc\.com[^\s"“”«»<>]*/gi)];
  for (const match of matches) {
    try {
      const url = new URL(match[0].replace(/[.,;!?،؛۔)\]}]+$/u, ''));
      const path = /^\/(ar|en|bn|hi|ur|id)\/browse\/hadith\/([1-9]\d*)\/?$/.exec(url.pathname);
      if (url.protocol !== 'https:' || url.hostname !== 'hadeethenc.com' || url.port || url.username || url.password || url.search || url.hash || !path) return { links: [], error: 'HADITH_EXPLICIT_URL_MALFORMED' };
      links.push({ language: path[1], id: path[2] });
    } catch { return { links: [], error: 'HADITH_EXPLICIT_URL_MALFORMED' }; }
  }
  return { links, error: null };
}
export const extractClaimQuotes = (claim: string): string[] => [...claim.matchAll(/["“«]([^"”»]+)["”»]/g)].map(match => match[1]);
