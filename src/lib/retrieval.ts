import type { Corpus, Verse } from './corpus';
import { parseQuranReferences } from './citations';
import { loadQuranTranslation, getQuranTranslationAdmission } from './quran-translations';
// Only query strings receive these transformations. Stored publisher text is never changed.
export function normalizeQuery(query: string): string {
  return query.toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export type QuranReadingAid = { source: 'QuranEnc'; key: 'english_rwwad'; version: string; language: 'en'; role: 'query_retrieval_only'; sha256:string; source_url:string };
const englishStop = new Set('a an the does do did is are was were has have had what which who when where how why quran koran allah god say says describe describes tell tells teach teaches command commands instruct instructs forbid forbids forbidden prohibited permitted permissible lawful warn warns require requires state states mention mentions one another people believers of to for and or in on at as by with from that this it its be before after while until not no never please kindly check verify user ask asks asking whether question according describe describes call calls appropriate visiting provided automatically during rather something humans should already only someone somebody anybody everyone anyone she he they them their'.split(' '));
export function englishWords(text: string): string[] {
  // Derived search tokens only; publisher strings and original negation remain intact.
  // Latin transliteration macrons (e.g. ā) are folded in the derived index only.
  // Otherwise the strict Latin token filter silently loses publisher spellings.
  const latinFolded = text.replace(/\p{Script=Latin}/gu, char=>char.normalize('NFD').replace(/\p{M}/gu,''));
  return normalizeQuery(latinFolded).split(' ').filter(word => /^[a-z]{3,}$/.test(word) && !englishStop.has(word)).map(word => {
    const synonyms: Record<string,string> = {maintain:'support',maintenance:'support',childbirth:'birth',deliver:'birth',delivery:'birth',pregnancy:'pregnant',divorcee:'divorce',divorced:'divorce',known:'know',home:'house',homes:'house',hurtful:'hurt',spying:'spy',backbite:'backbit',ridicule:'mock',ridiculing:'mock',secretly:'secret',encompassing:'encompass',everything:'everything',enslaved:'slave',slaves:'slave',strength:'strong',angry:'anger'};
    const irregular:Record<string,string>={saw:'see',seen:'see',children:'child',men:'man',women:'woman',feet:'foot',took:'take',taken:'take',gave:'give',given:'give',ate:'eat',eaten:'eat',drank:'drink',drunk:'drink'};
    if (irregular[word]) return irregular[word];
    if (synonyms[word]) return synonyms[word];
    return word.replace(/ying$/, 'y').replace(/ies$/, 'y').replace(/([a-z])\1ing$/, '$1').replace(/ing$/, '').replace(/ed$/, '').replace(/ly$/, '').replace(/(?<!s)s$/, '');
  }).filter(word => word.length >= 3);
}
type EnglishIndex = {rows: {id:string;words:Set<string>}[];frequency:Map<string,number>};
const englishIndices = new WeakMap<object, EnglishIndex>();
export function retrieveWithPublishedEnglishAid(corpus: Corpus, originalClaim: string, limit = 8, additionalQueries: readonly string[] = [], englishSearchClaim = originalClaim): {verses:Verse[];reading_aid:QuranReadingAid} {
  // Admission is checked on every call before the derived cache is consulted.
  // The edition loader enforces immutable pin/raw/JSON hashes and locator identity.
  const edition = loadQuranTranslation('en');
  if (!edition || edition.metadata.key !== 'english_rwwad') throw new Error('QURAN_ENGLISH_READING_AID_UNAVAILABLE');
  let index = englishIndices.get(edition);
  if (!index) {
    const rows = edition.records.map(row => ({id:`${row.sura}:${row.aya}`,words:new Set(englishWords(row.translation))}));
    const frequency = new Map<string,number>();
    for (const row of rows) for (const word of row.words) frequency.set(word,(frequency.get(word)??0)+1);
    index = {rows,frequency}; englishIndices.set(edition,index);
  }
  // The server routing gloss is a retrieval aid only. Native text still controls
  // original references, safety checks and the final model assessment.
  const originalWords = [...new Set(englishWords(englishSearchClaim))];
  const hints = additionalQueries.slice(0,20).filter(value => typeof value==='string' && value.length<=160);
  const hintedWords = [...new Set(hints.flatMap(hint=>englishWords(queryTerms(hint).join(' '))))].slice(0,48);
  const primaryWords = originalWords.length ? originalWords : hintedWords;
  const secondaryWords = originalWords.length ? hintedWords.filter(word=>!originalWords.includes(word)) : [];
  const score = (words:Set<string>, queries:string[]) => queries.reduce((total,word)=>total+(words.has(word)?Math.log(1+index!.rows.length/(index!.frequency.get(word)??index!.rows.length)):0),0);
  const englishScores = new Map(index.rows.map(row=>[row.id,score(row.words,primaryWords)+.15*score(row.words,secondaryWords)]));
  // Reward joint coverage of the original question's concepts, rather than
  // letting an Arabic rank for one incidental word dominate a routed question.
  const conceptCoverage = new Map(index.rows.map(row=>[row.id,primaryWords.filter(word=>row.words.has(word)).length/Math.max(1,primaryWords.length)]));
  // A known original subject can be expressed differently by the translation
  // (e.g. an ordinary English noun versus its formal synonym). Preserve its
  // Arabic/English dictionary matches ahead of incidental question qualifiers.
  const normativeSubjects=new Set(['haram','halal','forbidden','prohibited']);
  const subjectTerms=normalizeQuery(originalClaim).split(' ').filter(term=>!normativeSubjects.has(term)).flatMap(topicTerms);
  const englishSubjects=new Set(englishWords(subjectTerms.join(' ')));
  const englishSubjectMatches=new Set(index.rows.filter(row=>[...englishSubjects].some(term=>row.words.has(term))).map(row=>row.id));
  const subjectMatches=(verse:Verse)=>englishSubjectMatches.has(verse.id)||subjectTerms.some(term=>verse.search.includes(term));
  const lexical = retrieve(corpus,originalClaim,corpus.verses.length,hints);
  const lexicalRanks = new Map(lexical.map((verse,position)=>[verse.id,position]));
  const explicit = new Set(parseQuranReferences(originalClaim).references);
  const englishRanks = new Map([...englishScores].filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]).map(([id],rank)=>[id,rank]));
  // Fuse independent Arabic and English rankings rather than allowing a
  // dictionary subject or foreign Latin token to veto the other channel.
  const phrases = hints.map(normalizeQuery).filter(s=>/\p{Script=Arabic}/u.test(s)&&s.split(' ').length>=3);
  const rankScore = (verse:Verse) => 1/(20+(englishRanks.get(verse.id)??Infinity)) + 1/(20+(lexicalRanks.get(verse.id)??Infinity)) + .06*(conceptCoverage.get(verse.id)??0) + (phrases.some(p=>normalizeQuery(verse.search).includes(p))?.1:0);
  const verses = corpus.verses.filter(verse=>explicit.has(verse.id)||(englishScores.get(verse.id)??0)>0||lexicalRanks.has(verse.id))
    .sort((a,b)=>Number(explicit.has(b.id))-Number(explicit.has(a.id)) || (englishSearchClaim===originalClaim ? Number(subjectMatches(b))-Number(subjectMatches(a)) || (englishScores.get(b.id)??0)-(englishScores.get(a.id)??0) || (lexicalRanks.get(a.id)??Infinity)-(lexicalRanks.get(b.id)??Infinity) : rankScore(b)-rankScore(a)) || a.surah-b.surah || a.ayah-b.ayah).slice(0,limit);
  const pin=getQuranTranslationAdmission().sources.find(source=>source.key==='english_rwwad');
  if(!pin) throw new Error('QURAN_ENGLISH_READING_AID_PIN_MISSING');
  return {verses,reading_aid:{source:'QuranEnc',key:'english_rwwad',version:edition.metadata.version,language:'en',role:'query_retrieval_only',sha256:pin.json_sha256,source_url:'https://quranenc.com/en/browse/english_rwwad'}};
}
const topics: Record<string, string[]> = {
  prayer: ['الصلاة', 'صلوة'], pray: ['الصلاة'], fasting: ['الصيام', 'صيام'], fast: ['صيام'], ramadan: ['رمضان'],
  mosque: ['المسجد'], sacred: ['الحرام'], qibla: ['قبلة', 'القبلة'], friday: ['الجمعة'],
  trading: ['البيع', 'تجارة'], trade: ['البيع', 'تجارة'], intoxicated: ['سكارى', 'سكاري'], drunk: ['سكارى', 'سكاري'], سكران: ['سكارى', 'سكاري'],
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
  smile: ['تبسم', 'ابتسام', 'smiling'], smiling: ['تبسم', 'ابتسام', 'smile'], ابتسامة: ['تبسم', 'ابتسام', 'smile'], ابتسام: ['تبسم', 'smile'],
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
  const boundedHints = additionalQueries.slice(0, 20).filter(term => typeof term === 'string' && term.length <= 160);
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
  const groupInput = subjectTerms.length ? [query] : hintedSubjects.length ? boundedHints : [];
  const groups = groupInput.flatMap(input => normalizeQuery(input).split(' ')).filter(term => !normativeAnchors.has(term)).map(topicTerms).map(group => group.filter(term => anchors.includes(term))).filter(group => group.length);
  const subjectGroups = groups.map(group => ({terms: group, frequency: corpus.verses.reduce((count, verse) => count + Number(group.some(term => verse.search.includes(term))), 0)}));
  // Search Simple Clean bytes directly. Arabic spelling variants expand the query, not corpus text.
  const explicit = parseQuranReferences(query);
  const exactLocators = new Set(explicit.references);
  return corpus.verses.map(verse => ({ verse, explicit: Number(exactLocators.has(verse.id)), anchor: Number(anchors.some(term => verse.search.includes(term))),
    // Match multiple original subject aspects, weighting rarer vocabulary more
    // than broad categories such as prayer. No source locator is encoded here.
    subjectScore: subjectGroups.reduce((score, group) => score + (group.terms.some(term => verse.search.includes(term)) ? Math.log(1 + corpus.verses.length / Math.max(1, group.frequency)) : 0), 0),
    score: terms.reduce((score, term) => score + (verse.search.includes(term) ? Math.min(term.length, 8) : 0), 0) }))
    .filter(hit => hit.explicit || hit.score > 0).sort((a, b) => b.explicit - a.explicit || b.anchor - a.anchor || b.subjectScore - a.subjectScore || b.score - a.score || a.verse.surah - b.verse.surah || a.verse.ayah - b.verse.ayah).slice(0, limit).map(hit => hit.verse);
}
