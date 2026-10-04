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
  intoxicants: ['alcohol', 'الخمر'], intoxicating: ['alcohol', 'الخمر'], necessity: ['اضطر', 'مضطر'],
  اضطرار: ['اضطر', 'مضطر', 'necessity'], مضطر: ['اضطر', 'necessity'], مسكرات: ['الخمر', 'intoxicants'],
  interest: ['الربا'], usury: ['الربا'], marriage: ['نكاح'], divorce: ['الطلاق'], inheritance: ['ميراث', 'يوصيكم'],
  water: ['الماء', 'ماء'], life: ['حي', 'حياة'], living: ['حي'], creation: ['خلق', 'جعلنا'], created: ['خلق', 'جعلنا'],
  pig: ['pork', 'swine', 'الخنزير', 'خنزير', 'الخنازير'], pigs: ['pig', 'pork', 'swine', 'الخنزير', 'خنازير'],
  pork: ['pig', 'swine', 'الخنزير', 'خنزير'], swine: ['pig', 'pork', 'الخنزير', 'خنزير'],
  haram: ['forbidden', 'prohibited', 'حرام', 'حرم', 'حرمت'], halal: ['lawful', 'permitted', 'حلال', 'أحل'],
  forbidden: ['prohibited', 'حرام', 'حرم', 'حرمت'], prohibited: ['forbidden', 'حرام', 'حرم', 'حرمت'],
  خنزير: ['الخنزير', 'خنزير', 'pig', 'pork', 'swine'], الخنزير: ['خنزير', 'pig', 'pork', 'swine'],
  intentions: ['intention', 'النيات', 'نية', 'النية'], intention: ['intentions', 'النيات', 'نية'],
  lying: ['lie', 'lies', 'falsehood', 'كذب', 'الكذب', 'كاذب'], lie: ['lying', 'falsehood', 'كذب', 'الكذب'],
  backbiting: ['backbite', 'يغتب', 'غيبة'], gossip: ['backbiting', 'يغتب', 'غيبة'],
  honesty: ['truthfulness', 'صدق', 'الصدق'], honest: ['truthful', 'صدق'],
  prayers: ['prayer', 'الصلاة', 'صلوة'], salah: ['prayer', 'الصلاة', 'صلوة'], salat: ['prayer', 'الصلاة', 'صلوة'],
  صدق: ['الصدق', 'honesty', 'truthfulness'], كذب: ['الكذب', 'lying'], غيبة: ['يغتب', 'backbiting'], اغتياب: ['يغتب', 'غيبة', 'backbiting'],
};
function topicTerms(token: string): string[] {
  // Strip common Arabic articles/conjunctions only to resolve a known topic.
  // This is bounded dictionary lookup, not stemming publisher text or arbitrary Arabic words.
  const candidates = [token];
  if (/^[وف][\u0600-\u06ff]/u.test(token)) candidates.push(token.slice(1));
  for (const candidate of [...candidates]) if (candidate.startsWith('ال') && candidate.length > 4) candidates.push(candidate.slice(2));
  return [...new Set(candidates.flatMap(candidate => topics[candidate] ? [candidate, ...topics[candidate]] : []))];
}
export function queryTerms(query: string): string[] {
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'of', 'to', 'for', 'and', 'that', 'this', 'says', 'states', 'mentions', 'في', 'من', 'على', 'هو', 'هي', 'هذا', 'ان', 'وما', 'وقد', 'هل', 'كان', 'كل']);
  const tokens = normalizeQuery(query).split(' ').filter(t => t.length > 1 && !stopwords.has(t));
  const normative = new Set(['haram', 'halal', 'forbidden', 'prohibited']);
  const hasSpecificTopic = tokens.some(token => topicTerms(token).length > 0 && !normative.has(token));
  // Publisher Simple Clean spelling is exact. Expand only query-side initial hamza variants.
  const spellingVariants = tokens.flatMap(t => t.startsWith('ا') ? ['أ' + t.slice(1), 'إ' + t.slice(1), 'ٱ' + t.slice(1)] : []);
  // Specific subject terms outrank generic prohibition vocabulary. This changes search only, not claim meaning.
  return [...new Set([...tokens, ...tokens.flatMap(t => hasSpecificTopic && normative.has(t) ? [] : topicTerms(t)), ...spellingVariants])].slice(0, 48);
}
export function retrieve(corpus: Corpus, query: string, limit = 8, additionalQueries: readonly string[] = []): Verse[] {
  // Optional model-planned terms are retrieval hints only; the original claim and references remain intact.
  const originalTerms = queryTerms(query);
  const boundedHints = additionalQueries.slice(0, 8).filter(term => typeof term === 'string' && term.length <= 160);
  const terms = [...new Set([...originalTerms, ...boundedHints.flatMap(queryTerms)])].slice(0, 48);
  // Corpus-relative rarity distinguishes subject anchors from common words.
  // A broad expansion cannot displace an original distinctive subject match.
  // When the original wording has no searchable subject, planned terms still rank candidates.
  const frequencies = new Map(terms.map(term => [term, corpus.verses.reduce((count, verse) => count + Number(verse.search.includes(term)), 0)]));
  const normativeAnchors = new Set(['haram', 'halal', 'forbidden', 'prohibited', 'حرام', 'حلال', 'حراما', 'حلالا', 'حرم', 'حرمت', 'احل', 'أحل']);
  const specificSubject = normalizeQuery(query).split(' ').some(term => topicTerms(term).length > 0 && !normativeAnchors.has(term));
  const rare = (term: string) => term.length >= 3 && (frequencies.get(term) ?? 0) > 0 && (frequencies.get(term) ?? 0) <= Math.max(1, Math.floor(corpus.verses.length * .1));
  const subjectTerms = normalizeQuery(query).split(' ').filter(term => !normativeAnchors.has(term)).flatMap(topicTerms).filter(term => !normativeAnchors.has(term) && rare(term));
  // A translated topic hint can anchor an unfamiliar language when the original
  // has no known subject; incidental shared-script words must not outrank it.
  // Known original subjects always retain priority over unrelated model hints.
  const hintedSubjects = specificSubject ? [] : boundedHints.flatMap(hint => normalizeQuery(hint).split(' ')).filter(term => !normativeAnchors.has(term)).flatMap(topicTerms).filter(term => !normativeAnchors.has(term) && terms.includes(term) && rare(term));
  const anchors = subjectTerms.length ? subjectTerms : hintedSubjects.length ? hintedSubjects : originalTerms.filter(term => !(specificSubject && normativeAnchors.has(term)) && rare(term));
  // Search Simple Clean bytes directly. Arabic spelling variants expand the query, not corpus text.
  const explicit = parseQuranReferences(query);
  const exactLocators = new Set(explicit.references);
  return corpus.verses.map(verse => ({ verse, explicit: Number(exactLocators.has(verse.id)), anchor: Number(anchors.some(term => verse.search.includes(term))),
    score: terms.reduce((score, term) => score + (verse.search.includes(term) ? Math.min(term.length, 8) : 0), 0) }))
    .filter(hit => hit.explicit || hit.score > 0).sort((a, b) => b.explicit - a.explicit || b.anchor - a.anchor || b.score - a.score || a.verse.surah - b.verse.surah || a.verse.ayah - b.verse.ayah).slice(0, limit).map(hit => hit.verse);
}
