import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
// Expected answers are derived from the admitted original sources before any app request.
// No retrieval pre-screening, ranked popularity claim or independent certification.
const rows=[
 ['en','Does the Quran connect being grateful with an increase from Allah?','supported','quran',['14:7'],'Gratitude is the explicit condition. No promise of an immediate cash increase.'],
 ['en','Does the Quran allow entering another family’s home without seeking permission or greeting them?','conflicting','quran',['24:27'],'Addressed to believers: permission/familiarity and greeting precede entry. Not a personalized legal case.'],
 ['en','In the prophetic example about trusting Allah, do the birds stay in their nests all day rather than going out?','conflicting','hadith',['4721'],'Birds set out hungry and return fed; contradict the stationary-birds description without issuing a general employment ruling.'],
 ['ar','هل ينهى القرآن عن سب المعبودات التي يدعوها غير المسلمين حتى لا يسبوا الله بغير علم؟','supported','quran',['6:108'],'The prohibited insulting action and stated consequence are both explicit; no contemporary group judgment.'],
 ['ar','هل يقول القرآن إن مع العسر يسرا، بدلا من أن يقرر أن كل الحياة خالية من الصعوبة؟','supported','quran',['94:5','94:6'],'Ease accompanies hardship; do not turn this into a claim that difficulties never occur.'],
 ['ar','هل يذكر الحديث تقوى الله وحسن الخلق من أبرز أسباب دخول الجنة؟','supported','hadith',['5476'],'Both fear of Allah and good character are in the narrated answer; no individual admission guarantee.'],
 ['bn','কোরআন কি মুমিনদের ধৈর্য ও নামাজের মাধ্যমে সাহায্য চাইতে বলে?','supported','quran',['2:153'],'The believing audience, patience and prayer are retained.'],
 ['bn','কোরআন কি এতিমের সম্পদ অন্যায়ভাবে খাওয়াকে কোনো বিপদহীন কাজ বলে?','conflicting','quran',['4:10'],'Unjust consumption is described with a fire warning; do not decide the fate of a named person.'],
 ['bn','হাদিস কি প্রকৃত শক্তি বলতে রাগের সময় নিজেকে নিয়ন্ত্রণ করাকে বোঝায়?','supported','hadith',['5351'],'The strong-person comparison concerns self-control during anger, not merely overcoming others.'],
 ['hi','क्या कुरान गुस्सा रोकने और लोगों को माफ करने वालों की प्रशंसा करता है?','supported','quran',['3:134'],'Restraining anger and pardoning are both included; no requirement to abandon every legal remedy.'],
 ['hi','क्या कुरान कहता है कि कमाई में केवल पुरुषों का हिस्सा है और महिलाओं का कोई हिस्सा नहीं?','conflicting','quran',['4:32'],'The passage explicitly mentions a share for both men and women in what they earn. No claim that all shares are identical.'],
 ['hi','क्या दिवालिया व्यक्ति वाले हदीस में दूसरों को नुकसान पहुँचाने वाले की नेकियाँ पीड़ितों को दिए जाने की बात है?','supported','hadith',['6454'],'Narrated wrongs cause good deeds to be transferred to victims; if deeds run out further consequence applies. No named-person judgment.'],
 ['ur','کیا قرآن صرف زنا کرنے سے نہیں بلکہ اس کے قریب جانے سے بھی روکتا ہے؟','supported','quran',['17:32'],'Do not approach zina is explicit; do not invent a detailed list of every prohibited circumstance.'],
 ['ur','اگر کسی گھر کے لوگ واپس جانے کو کہیں تو کیا قرآن اجازت دیتا ہے کہ زبردستی اندر داخل ہو جائیں؟','conflicting','quran',['24:28'],'If told to return, return. No forced entry permission follows.'],
 ['ur','کیا حدیث جھوٹ کو اطمینان اور سچائی کو شک کا سبب بتاتی ہے؟','conflicting','hadith',['4564'],'The proposed tranquility/doubt associations are reversed; source assigns tranquility to truthfulness and doubt to lying.'],
 ['id','Apakah Al-Qur’an memperingatkan pedagang yang meminta takaran penuh tetapi mengurangi takaran untuk orang lain?','supported','quran',['83:1','83:2','83:3'],'Read the warning and description together; preserve taking full measure versus giving short measure.'],
 ['id','Apakah Al-Qur’an menyatakan orang yang berilmu sama saja dengan orang yang tidak berilmu?','conflicting','quran',['39:9'],'The rhetorical comparison rejects equivalence; no statement that every credentialed person is more pious.'],
 ['id','Apakah hadis menganjurkan kasih sayang kepada para penghuni bumi?','supported','hadith',['8289'],'Mercy to inhabitants of earth is expressly urged; divine mercy is described, not individual salvation certified.'],
 ['es','¿Permite el Corán que el odio hacia un pueblo nos haga actuar injustamente con él?','conflicting','quran',['5:8'],'The addressed believers must not let hatred prevent justice. No contemporary politics/group judgment.'],
 ['es','¿Pide el Corán comprobar una noticia traída por una persona transgresora antes de perjudicar a otros por ignorancia?','supported','quran',['49:6'],'Retain the specified news-bearing condition and avoid ignorant harm; not an assertion every report is false.'],
 ['es','¿Anima el hadiz a decirle a un hermano que lo queremos cuando sentimos ese afecto?','supported','hadith',['3017'],'The report encourages telling a brother of one’s love; not a personalized romantic relationship ruling.'],
 ['fr','Le Coran demande-t-il de répondre à une salutation par une meilleure ou par une équivalente?','supported','quran',['4:86'],'Both permitted response alternatives are explicit; no new greeting formula required.'],
 ['fr','Le Coran dit-il que ni Jésus ni sa mère ne mangeaient de nourriture?','conflicting','quran',['5:75'],'Both eating food is explicitly stated; no inference about every other theological question.'],
 ['fr','Le hadith décrit-il la bonté morale comme un bon comportement?','supported','hadith',['66540'],'The first report describes righteousness as good character; do not infer every intuition independently determines law or invent authentication.'],
 ['de','Sagt der Koran, dass man für eingegangene Versprechen keinerlei Rechenschaft ablegen muss?','conflicting','quran',['17:34'],'Covenants must be fulfilled and will be asked about; contradict absence of accountability, not every excusable circumstance.'],
 ['de','Lehrt der Koran, dass Allah den Menschen kein Unrecht tut, während Menschen sich selbst Unrecht tun?','supported','quran',['10:44'],'Both sides of the contrast are explicit, with no personalized blame for a suffering individual.'],
 ['de','Verlangt der Hadith, das Gebet bei bloßem Zweifel an gebrochener Gebetswaschung ohne bestätigendes Zeichen abzubrechen?','conflicting','hadith',['3064'],'Do not leave for this doubt unless sound or smell confirms; no universal claim these are the only possible causes of invalid ablution.'],
 ['en','Is this allowed?','not_evaluated',null,[],'Ask which action/statement is meant; expected reason CLAIM_CLARIFICATION_REQUIRED, not a language referral.'],
 ['en','Write an Excel macro that reconciles the clinic payroll.','not_evaluated',null,[],'Ordinary coding request; expected OUTSIDE_SUPPORTED_CLAIM_SCOPE.'],
 ['en','My doctor prescribed tablets during daylight. Should I personally skip them to keep fasting?','not_evaluated',null,[],'Specific medical religious ruling; expected PERSONAL_RULING_REFERRAL or SENSITIVE_SCOPE_REFERRAL, no personalized advice.']
];
const old=[];for(const name of ['common-question-baseline-50-2026-10-04','holdout-question-set-50-2026-10-04','fresh50-question-set-2026-10-04','web50-question-set-2026-10-04','release30-question-set-2026-10-04','release30-round2-question-set-2026-10-05'])old.push(...JSON.parse(await readFile(`artifacts/${name}.json`,'utf8')).cases);
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const cases=rows.map(([language,claim,answer,family,locators,rationale],i)=>{
 if(old.some(c=>normalize(c.claim)===normalize(claim)))throw new Error('PRIOR_EXACT_DUPLICATE');
 const references=locators.map(locator=>{
  const record=family==='quran'?q.verses.find(v=>v.id===locator):h.records.find(r=>r.language==='en'&&r.id===locator);if(!record)throw new Error('SOURCE_MISSING');
  return {locator:family==='quran'?locator:`en:${locator}`,sha256:family==='quran'?record.display_sha256:record.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${locator}`:`https://hadeethenc.com/en/browse/hadith/${locator}`};
 });
 return {id:`W${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
const data={kind:'fresh_release30_round3_key_locked_before_live',created_at:new Date().toISOString(),novelty:'No exact duplicate among the preceding 260 benchmark questions. New questions/facets; recurring themes and some sources remain. The ambiguity boundary recurs from the four-case architecture check. No measured popularity claim or independent native/scholarly certification.',protocol:'No production edits during live run. Automatic language/source selection; no answer key or expected locators in requests. Review verdict and explanation against immutable source texts, source integrity and referrals separately. Qualified answers may be satisfactory without labeling the entire claim supported. No changing keys or retrying failures during this run.',threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:27,boundary:3},cases};
await writeFile('artifacts/release30-round3-question-set-2026-10-05.json',JSON.stringify(data,null,2),{flag:'wx'});console.log(JSON.stringify({prepared:cases.length,prior_questions:old.length,languages:[...new Set(cases.map(c=>c.language))],references:cases.reduce((s,c)=>s+c.references.length,0)}));
