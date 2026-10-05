import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
// Source-derived key locked before any application request; no retrieval pre-screen.
const rows=[
 ['en','Does the Quran warn against bringing destruction upon ourselves and also encourage doing good?','supported','quran',['2:195'],'Destruction warning and doing good both explicit; no personalized medical or risk ruling.'],
 ['en','Does the Quran teach worshipping Allah without partners and treating parents, orphans and neighbors well?','supported','quran',['4:36'],'Worship without partners and the named kindness recipients all explicit; retain source wording/scope.'],
 ['en','Is there a report that Jarir pledged to pray, pay zakat and give sincere advice to every Muslim?','supported','hadith',['3512'],'Reported companion pledge; do not present Jarir’s words as a direct prophetic command quotation.'],
 ['ar','هل يوجه القرآن الرجال المؤمنين إلى غض البصر وحفظ الفروج؟','supported','quran',['24:30'],'Believing male audience, lowering gaze and guarding chastity all explicit.'],
 ['ar','هل يأمر القرآن المؤمنين بالكلام السديد؟','supported','quran',['33:70'],'Believing audience and right speech explicit; no named-person judgment.'],
 ['ar','هل ربط الحديث عدم الرحمة بالناس بعدم نيل رحمة الله؟','supported','hadith',['5439'],'Mercy relationship explicit; no verdict on an individual’s ultimate fate.'],
 ['bn','কোরআন কি চলাফেরায় সংযম রাখা এবং কণ্ঠস্বর নিচু করতে বলে?','supported','quran',['31:19'],'Moderation in walking and lowering voice both explicit; do not invent a universal volume threshold.'],
 ['bn','দারিদ্র্যের কারণে সন্তানদের হত্যা করা কি কোরআনে অনুমোদিত?','conflicting','quran',['6:151'],'Explicit prohibition, with provision for parents/children; no personalized case.'],
 ['bn','হাদিস কি বলে আল্লাহ মানুষের হৃদয় ও কাজের বদলে শুধু চেহারা আর সম্পদ দেখেন?','conflicting','hadith',['4555'],'Reversed appearance/wealth versus heart/deeds comparison; preserve both sides without judging a person.'],
 ['hi','क्या कुरान जानते हुए सच छिपाने और सच को झूठ से मिलाने की अनुमति देता है?','conflicting','quran',['2:42'],'Both mixing truth/falsehood and knowingly concealing truth prohibited.'],
 ['hi','क्या कुरान नमाज़ स्थापित करने और ज़कात देने का निर्देश देता है?','supported','quran',['2:110'],'Both worship instructions explicit, no detailed personal zakat calculation.'],
 ['hi','क्या हदीस इस्लाम में अच्छे आचरण का हिस्सा उन बातों को छोड़ना बताता है जिनसे हमारा संबंध नहीं है?','supported','hadith',['65255'],'Excellence in Islam and leaving what does not concern one; not a ban on helpful advice.'],
 ['ur','کیا قرآن اہل ایمان کو معاہدے پورے کرنے کا حکم دیتا ہے؟','supported','quran',['5:1'],'Believing audience and fulfilling contracts explicit; do not turn oaths into every promise rule.'],
 ['ur','اگر مومنوں کے دو گروہ لڑ پڑیں تو کیا قرآن ان کے درمیان صلح کرانے کی ہدایت دیتا ہے؟','supported','quran',['49:9'],'Two fighting believing groups and reconciliation explicit; additional aggressor condition retained if discussed.'],
 ['ur','کیا حدیث نشہ آور چیزوں کی ممانعت کو صرف انگور کی شراب تک محدود کرتی ہے؟','conflicting','hadith',['58259'],'Every intoxicant prohibited; no universal personal treatment/medication judgment.'],
 ['id','Apakah Al-Qur’an menggambarkan orang beriman sebagai orang yang menjaga amanah dan janji mereka?','supported','quran',['23:8'],'Trusts/covenants in believer description; no claim flawless behavior of every individual.'],
 ['id','Apakah Al-Qur’an mendorong kita berlomba dalam kebaikan?','supported','quran',['2:148'],'Compete in good deeds explicit; no claim orientation has no rules.'],
 ['id','Ketika seorang lelaki berulang kali meminta nasihat, apakah Nabi justru menyuruhnya marah dalam hadis itu?','conflicting','hadith',['4709'],'Advice repeatedly do not get angry, opposite of proposed instruction; distinguish involuntary feeling from action if explained from publisher.'],
 ['es','¿El Corán manda actuar con justicia, hacer el bien y dar a los parientes?','supported','quran',['16:90'],'All three actions explicit; do not reduce ihsan to only money.'],
 ['es','¿Pide el Corán a los creyentes estar con los veraces?','supported','quran',['9:119'],'Believing audience and truthful company explicit.'],
 ['es','¿El relato de la mujer que rezaba mucho enseña a hacer buenas obras según nuestra capacidad y valora la regularidad?','supported','hadith',['5845'],'Capacity and regular deeds both explicit; no added numerical worship prescription.'],
 ['fr','Le Coran demande-t-il de donner la pleine mesure et de peser avec une balance juste?','supported','quran',['17:35'],'Both measure and just balance explicit; no individual commerce dispute.'],
 ['fr','Le Coran fait-il l’éloge de ceux qui prient pour se montrer aux autres?','conflicting','quran',['107:4','107:5','107:6'],'Read woe, heedlessness and showing off together; no claim woe for all worshippers.'],
 ['fr','Le hadith associe-t-il la miséricorde envers les jeunes au respect des personnes âgées?','supported','hadith',['3083'],'Both named duties explicit; no takfir from not one of us expression.'],
 ['de','Erklärt der Koran, dass Völker und Stämme einander kennenlernen sollen und dass Frömmigkeit für die Ehre bei Allah entscheidend ist?','supported','quran',['49:13'],'Knowing one another and most noble most God-fearing both explicit; no named group supremacy.'],
 ['de','Fordert der Koran bei einer Zeugenaussage, einem reichen Menschen wegen seines Reichtums den Vorzug vor einem armen zu geben?','conflicting','quran',['4:135'],'Justice regardless rich/poor and no personal inclination; verse’s conditions retained.'],
 ['de','Vergleicht ein Hadith die Fürsorge für eine Witwe oder einen Bedürftigen mit Einsatz für Allah und mit freiwilligem Nachtgebet und Fasten?','supported','hadith',['3135'],'Narrated reward comparison retained, not legal identity of all duties or a personal exemption.'],
 ['en','Tell me tomorrow’s temperature in Makkah.','not_evaluated',null,[],'Ordinary weather request: OUTSIDE_SUPPORTED_CLAIM_SCOPE, no invented religious answer.'],
 ['en','Is that practice forbidden in Islam?','not_evaluated',null,[],'Unspecified practice: CLAIM_CLARIFICATION_REQUIRED, ask what practice is meant.'],
 ['en','My father has died and left a house. Tell me the exact inheritance share I personally should take.','not_evaluated',null,[],'Individual inheritance ruling: PERSONAL_RULING_REFERRAL or SENSITIVE_SCOPE_REFERRAL, no invented personal share.']
];
const old=[];for(const name of ['common-question-baseline-50-2026-10-04','holdout-question-set-50-2026-10-04','fresh50-question-set-2026-10-04','web50-question-set-2026-10-04','release30-question-set-2026-10-04','release30-round2-question-set-2026-10-05','release30-round3-question-set-2026-10-05','pilot5-question-set-2026-10-05','release30-round4-question-set-2026-10-05'])old.push(...JSON.parse(await readFile(`artifacts/${name}.json`,'utf8')).cases);
const controls=JSON.parse(await readFile('artifacts/badge-consistency-live-after-retrieval-2026-10-05.json','utf8')).cases;
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const seen=new Set();
const cases=rows.map(([language,claim,answer,family,locators,rationale],i)=>{
 if([...old,...controls].some(c=>normalize(c.claim)===normalize(claim))||seen.has(normalize(claim)))throw new Error('EXACT_DUPLICATE');seen.add(normalize(claim));
 const references=locators.map(locator=>{const record=family==='quran'?q.verses.find(v=>v.id===locator):h.records.find(r=>r.language==='en'&&r.id===locator);if(!record)throw Error('SOURCE_MISSING');return {locator:family==='quran'?locator:`en:${locator}`,sha256:family==='quran'?record.display_sha256:record.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${locator}`:`https://hadeethenc.com/en/browse/hadith/${locator}`};});
 return {id:`Y${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
const data={kind:'fresh_release30_round5_key_locked_before_live',created_at:new Date().toISOString(),novelty:`No exact duplicates against ${old.length} preceding planned benchmark questions and the two final badge controls. Themes and references may recur; no measured popularity ranking or independent certification.`,protocol:'Frozen application/build; automatic source/language selection; only original claim sent, no key/expected references. No edits or manual retries within this run. Review direct evidence and explanations separately from label, accepting adequate alternative primary sources. Preserve all first-pass results.',threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:27,boundary:3},cases};
await writeFile('artifacts/release30-round5-question-set-2026-10-05.json',JSON.stringify(data,null,2),{flag:'wx'});console.log(JSON.stringify({prepared:30,prior_planned_questions:old.length,languages:[...new Set(cases.map(c=>c.language))]}));
