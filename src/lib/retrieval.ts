import type { Corpus, Verse } from './corpus';
import { parseQuranReferences } from './citations';
// Only query strings receive these transformations. Stored publisher text is never changed.
export function normalizeQuery(query: string): string {
  return query.toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
const topics: Record<string, string[]> = {
  prayer: ['الصلاة', 'صلوة'], pray: ['الصلاة'], fasting: ['الصيام', 'صيام'], fast: ['صيام'], ramadan: ['رمضان'],
  charity: ['الزكاة', 'صدقة'], zakat: ['الزكاة'], pilgrimage: ['الحج'], hajj: ['الحج'], umrah: ['العمرة'],
  parents: ['الوالدين'], mother: ['والدته'], justice: ['العدل', 'القسط'], mercy: ['رحمة'], forgiveness: ['غفور', 'يغفر'],
  compulsion: ['إكراه'], religion: ['الدين'], alcohol: ['الخمر'], wine: ['الخمر'], gambling: ['الميسر'],
  interest: ['الربا'], usury: ['الربا'], marriage: ['نكاح'], divorce: ['الطلاق'], inheritance: ['ميراث', 'يوصيكم'],
  water: ['الماء', 'ماء'], life: ['حي', 'حياة'], living: ['حي'], creation: ['خلق', 'جعلنا'], created: ['خلق', 'جعلنا'],
};
export function queryTerms(query: string): string[] {
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'of', 'to', 'for', 'and', 'that', 'this', 'says', 'states', 'mentions', 'في', 'من', 'على', 'هو', 'هي', 'هذا', 'ان', 'لا', 'وما', 'وقد', 'هل', 'كان', 'كل']);
  const tokens = normalizeQuery(query).split(' ').filter(t => t.length > 1 && !stopwords.has(t));
  // Publisher Simple Clean spelling is exact. Expand only query-side initial hamza variants.
  const spellingVariants = tokens.flatMap(t => t.startsWith('ا') ? ['أ' + t.slice(1), 'إ' + t.slice(1), 'ٱ' + t.slice(1)] : []);
  return [...new Set([...tokens, ...tokens.flatMap(t => topics[t] ?? []), ...spellingVariants])].slice(0, 48);
}
export function retrieve(corpus: Corpus, query: string, limit = 8): Verse[] {
  const terms = queryTerms(query);
  // Search Simple Clean bytes directly. Arabic spelling variants expand the query, not corpus text.
  const explicit = parseQuranReferences(query);
  const exactLocators = new Set(explicit.references);
  return corpus.verses.map(verse => ({ verse, score: (exactLocators.has(verse.id) ? 1000 : 0) + terms.reduce((score, term) => score + (verse.search.includes(term) ? Math.min(term.length, 8) : 0), 0) }))
    .filter(hit => hit.score > 0).sort((a, b) => b.score - a.score || a.verse.surah - b.verse.surah || a.verse.ayah - b.verse.ayah).slice(0, limit).map(hit => hit.verse);
}
