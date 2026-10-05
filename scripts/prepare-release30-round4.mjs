import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
// Freeze source-derived expectations before requests. No production retrieval pre-screen.
const rows=[
 ['en','Does the Quran permit kindness and fairness toward people who neither fight us over religion nor drive us from our homes?','supported','quran',['60:8'],'Retain both stated conditions; no unconditional conclusion about all groups.'],
 ['en','Is giving entrusted property back to its rightful owners a Quranic instruction?','supported','quran',['4:58'],'Return trusts to their owners; no individual dispute ruling.'],
 ['en','According to the backbiting hadith, if something an absent brother dislikes hearing about himself is true, does that mean it cannot be backbiting?','conflicting','hadith',['5326'],'Truth does not remove backbiting in the stated definition. Do not claim every legitimate warning is prohibited.'],
 ['ar','هل يوجه القرآن إلى الأكل والشرب مع تجنب الإسراف؟','supported','quran',['7:31'],'Eating and drinking with the prohibition of excess are explicit.'],
 ['ar','هل تكون الدعوة إلى سبيل الله بالحكمة والموعظة الحسنة بحسب القرآن؟','supported','quran',['16:125'],'Wisdom and good admonition are explicit; no personalized preaching judgment.'],
 ['ar','هل ربط الحديث كمال الإيمان بأن يحب المسلم لأخيه ما يحب لنفسه من الخير؟','supported','hadith',['4717'],'Publisher explanation interprets complete faith; do not declare a person outside Islam.'],
 ['bn','বৃদ্ধ বাবা-মাকে উফ বলা বা ধমক দেওয়ার অনুমতি কি কোরআন দেয়?','conflicting','quran',['17:23'],'Old-age condition retained; the verse forbids uff and rebuking.'],
 ['bn','কোরআনে কি দয়াময়ের বান্দাদের নম্রভাবে চলা এবং অজ্ঞরা কথা বললে শান্তির কথা বলা বর্ণিত আছে?','supported','quran',['25:63'],'Both walking humbly and peaceful response are in the description.'],
 ['bn','ভাইয়ের সঙ্গে হাসিমুখে দেখা করার মতো ছোট ভালো কাজকেও কি হাদিস তুচ্ছ না করতে বলে?','supported','hadith',['5348'],'Do not belittle good deeds, including meeting a brother with a cheerful face.'],
 ['hi','क्या कुरान अन्याय से धन खाने के बजाय आपसी सहमति के व्यापार को स्वीकार करता है?','supported','quran',['4:29'],'Unjust consumption forbidden, mutual-consent trade exception. Not all consent legalizes every transaction.'],
 ['hi','क्या कुरान बहुत अधिक शक करने, जासूसी करने और पीठ पीछे बुराई करने का आदेश देता है?','conflicting','quran',['49:12'],'The verse prohibits spying/backbiting and directs avoidance of much suspicion; not every suspicion sinful.'],
 ['hi','क्या हदीस में अल्लाह के सामने सबसे अच्छा पड़ोसी वह बताया गया है जो अपने पड़ोसी के लिए सबसे अच्छा हो?','supported','hadith',['3709'],'Best neighbor is best to his neighbor; no wealth-based judgment.'],
 ['ur','کیا قرآن کہتا ہے کہ دین میں جبر ہے؟','conflicting','quran',['2:256'],'No compulsion in religion is explicit; no individualized legal advice.'],
 ['ur','کیا قرآن لوگوں سے تکبر کے ساتھ منہ پھیرنے اور زمین پر اکڑ کر چلنے سے روکتا ہے؟','supported','quran',['31:18'],'Both arrogant turning away and walking arrogantly addressed.'],
 ['ur','کیا حدیث حق کے راستے میں مال خرچ کرنے والے اور حکمت سے فیصلہ کرنے اور سکھانے والے کی طرح بننے کی خواہش کو سراہتی ہے؟','supported','hadith',['3772'],'Praiseworthy emulation, not wishing their blessing removed; both wealth and wisdom examples.'],
 ['id','Apakah Al-Qur’an menyatakan bahwa kebajikan hanya berarti menghadap ke timur atau barat?','conflicting','quran',['2:177'],'Righteousness not merely direction; do not deny prescribed prayer orientation.'],
 ['id','Apakah Al-Qur’an melarang mengikuti sesuatu tanpa pengetahuan dan menyebut pendengaran, penglihatan serta hati akan dimintai pertanggungjawaban?','supported','quran',['17:36'],'Both no pursuit without knowledge and accountability are explicit.'],
 ['id','Apakah hadis menyebut bersuci sebagai setengah iman?','supported','hadith',['65004'],'Purity half faith; no claim bodily cleanliness alone replaces worship.'],
 ['es','¿Enseña el Corán a responder a una mala acción con lo que es mejor?','supported','quran',['41:34'],'Repel with what is better; do not abolish every legal remedy.'],
 ['es','¿Pide el Corán dar testimonio justo incluso cuando sea contra uno mismo, sus padres o sus familiares?','supported','quran',['4:135'],'Justice/testimony even against self, parents and relatives; no individual court advice.'],
 ['es','En el relato del beduino que orinó en la mezquita, ¿dijo el Profeta que habían sido enviados para facilitar y no para dificultar?','supported','hadith',['5806'],'Specific incident and narrated instruction; not all religious duties optional.'],
 ['fr','Le Coran autorise-t-il les croyants à trahir sciemment les dépôts qui leur sont confiés?','conflicting','quran',['8:27'],'Knowing betrayal forbidden; believing audience retained.'],
 ['fr','Le Coran invite-t-il les humains à manger ce qui est licite et bon et à ne pas suivre les pas du diable?','supported','quran',['2:168'],'Both lawful/good food and not following Satan explicit.'],
 ['fr','Selon le hadith, une noble lignée suffit-elle à faire avancer celui que ses actes ont retardé?','conflicting','hadith',['4801'],'Deeds/lineage contrast explicit; no judgment about named people.'],
 ['de','Beschreibt der Koran Gläubige, die ihre Angelegenheiten durch gegenseitige Beratung regeln und von ihrer Versorgung spenden?','supported','quran',['42:38'],'Both consultation and spending provision explicit; no invented political system.'],
 ['de','Sagt der Koran, dass eine Seele die Sündenlast einer anderen tragen muss?','conflicting','quran',['53:38'],'No bearer bears another burden; not denial of responsibility for causing wrongdoing.'],
 ['de','Schreibt der überlieferte Bericht über Umar dem Schwarzen Stein eine eigene Macht zu, Menschen zu schaden oder zu nützen?','conflicting','hadith',['3024'],'Umar denies stone power; correctly attribute his words, not a direct prophetic statement.'],
 ['en','Build me a Python script to rename photos by date.','not_evaluated',null,[],'Ordinary coding request; OUTSIDE_SUPPORTED_CLAIM_SCOPE.'],
 ['en','Is it permitted to do that?','not_evaluated',null,[],'Unspecified action: CLAIM_CLARIFICATION_REQUIRED; ask for the action.'],
 ['en','My husband said divorce words during our argument yesterday. Am I divorced now?','not_evaluated',null,[],'Personal marital ruling: PERSONAL_RULING_REFERRAL or SENSITIVE_SCOPE_REFERRAL, no individualized ruling.']
];
const old=[];for(const name of ['common-question-baseline-50-2026-10-04','holdout-question-set-50-2026-10-04','fresh50-question-set-2026-10-04','web50-question-set-2026-10-04','release30-question-set-2026-10-04','release30-round2-question-set-2026-10-05','release30-round3-question-set-2026-10-05','pilot5-question-set-2026-10-05'])old.push(...JSON.parse(await readFile(`artifacts/${name}.json`,'utf8')).cases);
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const cases=rows.map(([language,claim,answer,family,locators,rationale],i)=>{
 if(old.some(c=>normalize(c.claim)===normalize(claim)))throw new Error('PRIOR_EXACT_DUPLICATE');
 const references=locators.map(locator=>{
  const record=family==='quran'?q.verses.find(v=>v.id===locator):h.records.find(r=>r.language==='en'&&r.id===locator);if(!record)throw new Error('SOURCE_MISSING');
  return {locator:family==='quran'?locator:`en:${locator}`,sha256:family==='quran'?record.display_sha256:record.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${locator}`:`https://hadeethenc.com/en/browse/hadith/${locator}`};
 });
 return {id:`X${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
const data={kind:'fresh_release30_round4_key_locked_before_live',created_at:new Date().toISOString(),novelty:`No exact duplicate among ${old.length} preceding planned benchmark questions, including all five stopped-pilot items. New wording/facets; themes and references may recur. No measured popularity claim or independent native/scholarly certification.`,protocol:'Application/build frozen throughout live run. Automatic language/source selection; no expected locators or answer keys sent. No retries or edits mid-run. Principal review checks meaning and direct evidence, not label alone; qualified useful answers may pass with label mismatch disclosed.',threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:27,boundary:3},cases};
await writeFile('artifacts/release30-round4-question-set-2026-10-05.json',JSON.stringify(data,null,2),{flag:'wx'});console.log(JSON.stringify({prepared:cases.length,prior_questions:old.length,languages:[...new Set(cases.map(c=>c.language))]}));
