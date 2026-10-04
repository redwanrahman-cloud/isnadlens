import { expect, test } from 'vitest';
import { loadCorpus, sha256 } from '../src/lib/corpus';
import { retrieve, queryTerms, retrieveWithPublishedEnglishAid } from '../src/lib/retrieval';
import { readFileSync } from 'node:fs';
import { scopeGate } from '../src/lib/policy';
import { loadHadith, retrieveHadith } from '../src/lib/hadith';

test('admits general Islamic food claims while retaining personal, sensitive and unrelated referrals', () => {
  for (const claim of ['pig eating is haram', 'is eating pork forbidden?', 'pork is halal', 'هل أكل الخنزير حرام؟', 'أكل الخنزير محرم']) expect(scopeGate(claim)).toBeNull();
  expect(scopeGate('Can I eat pork because of my condition?')).toBe('PERSONAL_RULING_REFERRAL');
  expect(scopeGate('هل يجوز لي أكل الخنزير؟')).toBe('PERSONAL_RULING_REFERRAL');
  expect(scopeGate('pig food recipe')).toBe('OUTSIDE_SUPPORTED_CLAIM_SCOPE');
  expect(scopeGate('How much food does a pig need?')).toBe('OUTSIDE_SUPPORTED_CLAIM_SCOPE');
  expect(scopeGate('Patient Ali has diabetes and asks whether pork is halal')).toBe('PRIVATE_OR_SENSITIVE_FACTS_REFERRAL');
});
test('retrieves actual Quran pig passages without encoding a verdict or editing admitted strings', () => {
  const corpus = loadCorpus(); const before = sha256(JSON.stringify(corpus.verses));
  for (const claim of ['pig eating is haram', 'is eating pork forbidden?', 'pork is halal', 'أكل الخنزير حرام']) {
    const passages = retrieve(corpus, claim);
    expect(passages.some(verse => ['2:173','5:3','6:145','16:115'].includes(verse.id))).toBe(true);
    expect(passages.some(verse => verse.search.includes('الخنزير'))).toBe(true);
  }
  expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
  const claim = 'pork is not forbidden';
  expect(queryTerms(claim)).toContain('not'); expect(claim).toBe('pork is not forbidden');
  expect(queryTerms('الخنزير ليس حراما')).toContain('ليس');
  expect(queryTerms('لا يجوز أكل الخنزير')).toContain('لا');
});
test('ordinary query synonyms find exact primary text and do not turn explanations into evidence', () => {
  const corpus = loadCorpus();
  expect(retrieve(corpus, 'backbiting is haram').some(verse => verse.id === '49:12')).toBe(true);
  const hadith = loadHadith();
  const pigCandidates = retrieveHadith(hadith, 'pork is prohibited', 'en');
  expect(pigCandidates.some(record => record.id === '4556')).toBe(true);
  expect(pigCandidates.some(record => record.id === '10963')).toBe(false); // "pigeon" is not "pig".
});
test('bounded additional search terms retrieve candidates but cannot inject a locator priority', () => {
  const corpus = loadCorpus();
  expect(retrieve(corpus, 'an unfamiliar phrasing', 8, ['الخنزير']).some(verse => verse.search.includes('الخنزير'))).toBe(true);
  expect(retrieve(corpus, 'an unfamiliar phrasing', 8, ['21:30']).some(verse => verse.id === '21:30')).toBe(false);
});
test('broad AI food hints cannot displace original distinctive subject matches', () => {
  const corpus = loadCorpus();
  const hints = ['أكل الخنزير', 'تحريم لحم الخنزير', 'حكم الخنزير', 'الخنزير في الإسلام', 'نجاسة الخنزير', 'أحكام الطعام الحرام', 'forbidden food', 'unclean animal'];
  const candidates = retrieve(corpus, 'pig eating is haram', 4, hints);
  expect(new Set(candidates.map(verse => verse.id))).toEqual(new Set(['2:173','5:3','6:145','16:115']));
  expect(candidates.some(verse => verse.id === '5:75')).toBe(false);
  expect(retrieve(corpus, 'pig eating is haram 5:75', 1, hints)[0].id).toBe('5:75');
  // Independent topic demonstrates that the rule is not a pork-specific locator lookup.
  const justice = retrieve(corpus, 'justice', 4, ['الماء', 'الصلاة', 'الحياة', 'قال', 'الله']);
  expect(justice.every(verse => verse.search.includes('العدل') || verse.search.includes('القسط'))).toBe(true);
});
test('Arabic article and conjunction topic lookup finds primary backbiting text without erasing negation', () => {
  const corpus = loadCorpus(); const before = sha256(JSON.stringify(corpus.verses));
  for (const claim of ['ينهى القرآن عن اغتياب الآخرين.', 'الغيبة حرام', 'والغيبة ليست مباحة']) {
    expect(retrieve(corpus, claim, 4, ['الغيبة', 'backbiting', 'الكذب']).some(verse => verse.id === '49:12'), claim).toBe(true);
  }
  expect(queryTerms('والغيبة لا تجوز')).toContain('لا');
  expect(queryTerms('الغيبة ليس حلالا')).toContain('ليس');
  expect(queryTerms('والكذب')).toContain('lying');
  expect(queryTerms('الصدق')).toContain('truthfulness');
  expect(queryTerms('الكتاب')).not.toContain('كتاب'); // Unknown words are not blindly stemmed.
  expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
});
test('ordinary intoxicants and necessity wording retrieves actual primary provisions despite generic surrounding words', () => {
  const corpus = loadCorpus();
  expect(retrieve(corpus, 'The Quran tells believers to avoid intoxicating drinks.', 4, ['القرآن', 'المؤمنون', 'المسكرات', 'intoxicating drinks']).some(verse => verse.id === '5:90')).toBe(true);
  expect(retrieve(corpus, 'يذكر القرآن استثناء الاضطرار للطعام المحرم، دون رغبة فيه أو تجاوز الحاجة.', 4, ['الاضطرار', 'الطعام المحرم', 'دون رغبة', 'تجاوز الحاجة', 'necessity']).some(verse => verse.id === '2:173')).toBe(true);
  expect(queryTerms('المسكرات')).toContain('الخمر');
  expect(queryTerms('والاضطرار')).toContain('اضطر');
});
test('translated subject hints anchor unfamiliar Urdu while known original topics and explicit references remain authoritative', () => {
  const corpus = loadCorpus();
  const claim = 'عام حالات میں قرآن سور کا گوشت کھانے سے منع کرتا ہے۔';
  const hints = ['قرآن', 'Quran', 'سور کا گوشت', 'eating pork', 'کھانے سے منع', 'forbids'];
  expect(new Set(retrieve(corpus, claim, 4, hints).map(verse => verse.id))).toEqual(new Set(['2:173','5:3','6:145','16:115']));
  expect(retrieve(corpus, 'backbiting is not permitted', 1, ['eating pork'])[0].id).toBe('49:12');
  expect(queryTerms('backbiting is not permitted')).toContain('not');
  expect(retrieve(corpus, claim + ' 21:30', 1, hints)[0].id).toBe('21:30');
});
test('specific prayer contexts outrank the broad prayer category without encoding passage locations', () => {
  const corpus = loadCorpus();
  const cases: [string, string, string[]][] = [
    ['Does the Quran direct prayer toward the Sacred Mosque?', '2:144', ['القبلة', 'qibla', 'المسجد الحرام', 'Sacred Mosque', 'الصلاة', 'prayer']],
    ['Does the Quran tell believers to leave trading when the Friday prayer call is made?', '62:9', ['الجمعة', 'Friday prayer', 'النداء', 'call to prayer', 'الصلاة', 'البيع', 'trade']],
    ['Does the Quran forbid approaching prayer while intoxicated until one understands what one is saying?', '4:43', ['الصلاة', 'prayer', 'سكران', 'intoxicated', 'يفهم', 'understands']],
  ];
  for (const [claim, locator, hints] of cases) expect(retrieve(corpus, claim, 4, hints).some(verse => verse.id === locator), claim).toBe(true);
});
test('validated published English reading aid retrieves diverse actual failures as immutable Arabic evidence', () => {
  const corpus = loadCorpus(); const before = sha256(JSON.stringify(corpus.verses));
  const dataset = JSON.parse(readFileSync('artifacts/common-question-baseline-50-2026-10-04.json','utf8'));
  for (const id of ['B22','B23','B24','B26','B27','B29','B32','B33','B37','B38','B41','B43']) {
    const item=dataset.cases.find((item:{id:string})=>item.id===id);
    const hints = id==='B32' ? ['السخرية', 'mocking others', 'التنابز بالألقاب', 'offensive nicknames'] : [];
    const result=retrieveWithPublishedEnglishAid(corpus,item.claim,8,hints);
    expect(result.verses.some(verse=>item.reviewer_locators.includes('quran:'+verse.id)),id).toBe(true);
    expect(result.reading_aid).toMatchObject({key:'english_rwwad',version:'1.0.19',role:'query_retrieval_only'});
    for(const verse of result.verses) expect(verse).toBe(corpus.verses.find(original=>original.id===verse.id));
  }
  expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
  expect(retrieveWithPublishedEnglishAid(corpus,'backbiting is not permitted 21:30',1,['pork']).verses[0].id).toBe('21:30');
  expect(retrieveWithPublishedEnglishAid(corpus,'backbiting is not permitted',1,['pork']).verses[0].id).toBe('49:12');
});
test('ordinary smiling-as-charity wording finds admitted Arabic report without encoding its id in search', () => {
  const corpus=loadHadith();
  for(const claim of ['The Hadith says that smiling at another person is charity.', 'Does the Hadith say that smiling at another person is charity?']) {
    const results=retrieveHadith(corpus,claim,'ar',4,['ابتسامة','smiling','صدقة','charity']);
    expect(results.some(record=>record.id==='66237')).toBe(true);
    const record=results.find(record=>record.id==='66237')!;
    expect(record).toBe(corpus.records.find(original=>original.id==='66237'&&original.language==='ar'));
    expect(record.fields.grade).toBe('حسن');
  }
});
test('published transliteration accents do not erase a negated original Ramadan subject', () => {
  const corpus=loadCorpus();const claim='The Quran never mentions Ramadan.';
  const before=sha256(JSON.stringify(corpus.verses));
  expect(retrieveWithPublishedEnglishAid(corpus,claim,8,['water','prayer']).verses.some(verse=>verse.id==='2:185')).toBe(true);
  expect(retrieveWithPublishedEnglishAid(corpus,'The Quran never mentions Ramadān.',8).verses.some(verse=>verse.id==='2:185')).toBe(true);
  expect(claim).toBe('The Quran never mentions Ramadan.');
  expect(queryTerms(claim)).toContain('never');
  expect(sha256(JSON.stringify(corpus.verses))).toBe(before);
});
test('ordinary inflections and paraphrases retrieve emancipation and self-control without source-specific rules', () => {
  const q=loadCorpus(),h=loadHadith();
  expect(retrieveWithPublishedEnglishAid(q,'Does the Quran describe freeing an enslaved person as part of the difficult path of righteousness?',8,['Quran','freeing enslaved person','path of righteousness']).verses.some(v=>v.id==='90:13')).toBe(true);
  expect(retrieveHadith(h,'Does the Hadith describe true strength as controlling oneself during anger?','en',4,['hadith','true strength','control oneself','anger']).some(r=>r.id==='5351')).toBe(true);
  expect(retrieveHadith(h,'Does the Hadith prohibit a judge from judging between people while angry?','en',4).some(r=>r.id==='2988')).toBe(true);
  expect(retrieveHadith(h,'Does the Hadith describe modesty as bringing good?','en',4).some(r=>r.id==='3055')).toBe(true);
},20000);
test('published English formal synonyms retain original subject over generic qualifiers and unrelated planner hints', () => {
  const corpus=loadCorpus();
  const claim='Does the Quran forbid pork under ordinary conditions?';
  const result=retrieveWithPublishedEnglishAid(corpus,claim,8,['خنزير','pork','حرام','forbid','قرآن','Quran','water conditions']);
  expect(result.verses.some(verse=>verse.id==='2:173')).toBe(true);
  expect(result.verses.filter(verse=>['2:173','5:3','6:145','16:115'].includes(verse.id)).length).toBe(4);
  expect(retrieveWithPublishedEnglishAid(corpus,'Does the Quran discuss gambling under ordinary conditions?',8,['water','conditions']).verses.some(verse=>verse.id==='5:90')).toBe(true);
});
