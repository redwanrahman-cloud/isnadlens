import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
// Source review precedes the first live request. No ranking pre-screening of these questions.
const rows=[
 ['en','Does the Quran advise avoiding both miserly withholding and spending everything recklessly?','supported','quran',['17:29'],'Both extremes are forbidden by the hand metaphor. No individualized spending amount is asserted.'],
 ['en','Does the Quran let someone promise to do something tomorrow without any qualification about Allah’s will?','conflicting','quran',['18:23','18:24'],'Read the adjacent exception together: future intention is qualified by Allah willing.'],
 ['en','Is there prophetic encouragement to eat suhoor because the pre-dawn meal has blessing?','supported','hadith',['4498'],'Blessing and encouragement are explicit; no assertion that a missed meal invalidates fasting.'],
 ['ar','هل تذكر آية كفارة اليمين صيام ثلاثة أيام لمن لا يستطيع تقديم الكفارة المذكورة من إطعام أو كسوة أو تحرير رقبة؟','supported','quran',['5:89'],'Three fasting days are the fallback when unable to provide the preceding alternatives. No consecutive-day assertion.'],
 ['ar','هل يقرر القرآن أن الأكثر مالا هو الأكرم عند الله، وليس الأتقى؟','conflicting','quran',['49:13'],'The explicit honor criterion is piety, contrary to the proposed replacement by wealth.'],
 ['ar','هل أرشد النبي إلى تحري ليلة القدر في الليالي الزوجية من العشر الأواخر من رمضان؟','conflicting','hadith',['4540'],'The instruction specifies odd nights in the last ten; this does not assert impossibility of other dates.'],
 ['bn','কোরআন কি বলে যে অতি সামান্য পরিমাণ ভালো কাজও মানুষ দেখতে পাবে?','supported','quran',['99:7'],'Even an atom-weight good deed will be seen; no invented reward amount.'],
 ['bn','কোরআন কি বলে যে অতি সামান্য মন্দ কাজ কখনোই মানুষের সামনে আসবে না?','conflicting','quran',['99:8'],'An atom-weight evil deed is seen; contradict the absolute never, without deciding an individual fate.'],
 ['bn','যারা কোরআন শেখে এবং অন্যদের শেখায়, হাদিস কি তাদের উত্তম বলে?','supported','hadith',['5913'],'Both learning and teaching are explicit.'],
 ['hi','क्या कुरान न्याय और भलाई करने का आदेश देता है?','supported','quran',['16:90'],'Justice and benevolence are directly commanded.'],
 ['hi','क्या कुरान ईमान वालों को सीधी और सही बात की जगह टेढ़ी बात बोलने का आदेश देता है?','conflicting','quran',['33:70'],'The command is sound upright speech, opposite to the proposed crooked speech.'],
 ['hi','क्या हदीस में मांगने वाले हाथ को देने वाले हाथ से बेहतर बताया गया है?','conflicting','hadith',['3599'],'Upper giving hand is better than lower begging hand; preserve direction.'],
 ['ur','کیا قرآن ہر شخص کو دیکھنے کی نصیحت کرتا ہے کہ اس نے آخرت کے لیے کیا آگے بھیجا ہے؟','supported','quran',['59:18'],'The instruction to consider what is sent ahead for tomorrow concerns accountability; no personal forecast.'],
 ['ur','کیا قرآن کی تلاوت کے وقت قرآن سننے اور خاموش رہنے کے بجائے باتیں کرتے رہنے کا حکم ہے؟','conflicting','quran',['7:204'],'Listen and be silent is the explicit instruction; no adjudication of every disputed setting.'],
 ['ur','کیا حدیث میں اللہ کے ہاں ظاہری صورت اور دولت کے بجائے دلوں اور اعمال کی اہمیت بیان ہوئی ہے؟','supported','hadith',['4555'],'The report contrasts appearance/wealth with hearts/deeds; not a claim of literal invisibility of appearance.'],
 ['id','Apakah Al-Qur’an mengaitkan mendirikan salat dengan mengingat Allah?','supported','quran',['20:14'],'The prayer-for-remembrance instruction is direct in the address to Moses.'],
 ['id','Ketika tertimpa musibah, apakah Al-Qur’an menyebut ucapan bahwa kita milik Allah dan akan kembali kepada-Nya?','supported','quran',['2:156'],'The response to calamity is explicitly described.'],
 ['id','Apakah hadis menyatakan bahwa sedekah mengurangi harta, bukan bahwa sedekah tidak menguranginya?','conflicting','hadith',['5512'],'The report expressly says charity does not diminish wealth; no guaranteed immediate bank-balance increase.'],
 ['es','¿Relaciona el Corán tomar una decisión firme con confiar después en Allah?','supported','quran',['3:159'],'Trust follows resolve in the instruction; no claim that consultation is unnecessary.'],
 ['es','¿Ordena el Corán apartarse de quienes invocan a su Señor para buscar el lujo de la vida mundana?','conflicting','quran',['18:28'],'Keep company with those invoking the Lord; do not turn eyes away seeking adornment.'],
 ['es','¿Aconseja el hadiz decir algo bueno o guardar silencio?','supported','hadith',['5437'],'Speech-good-or-silence instruction linked to faith is direct.'],
 ['fr','Le Coran décrit-il des anges rassurant ceux qui disent que leur Seigneur est Allah puis restent droits?','supported','quran',['41:30'],'Retain both declaration and steadfastness conditions; no claim every individual is already certified.'],
 ['fr','Le Coran demande-t-il de mélanger délibérément la vérité avec le faux et de cacher la vérité connue?','conflicting','quran',['2:42'],'The prohibition negates both deliberate mixing and concealment.'],
 ['fr','Quand Kaab voulait donner tous ses biens en aumône pour son repentir, le Prophète lui a-t-il conseillé d’en garder une partie?','supported','hadith',['2979'],'The narrated advice is to retain some wealth; do not generalize into a universal exact percentage.'],
 ['de','Fordert der Koran dazu auf, gemeinsam an Allahs Seil festzuhalten und sich nicht zu spalten?','supported','quran',['3:103'],'Both unity and prohibition of division are explicit; no contemporary sect judgment.'],
 ['de','Warnt der Koran, dass Streit untereinander zu Versagen und Verlust der Kraft führen kann?','supported','quran',['8:46'],'The warning connects disputing with failure and loss of strength.'],
 ['de','Behauptet der Hadith, dass nur Geld als Wohltätigkeit zählt und Lobpreisungen Allahs nicht zählen?','conflicting','hadith',['4558'],'Several remembrances and moral actions are explicitly charity; reject money-only restriction.'],
 ['en','Find the cheapest flight from Jeddah to Paris this Friday.','not_evaluated',null,[],'Ordinary booking request should receive an out-of-scope referral.'],
 ['en','Generate a React shopping-cart component with a checkout button.','not_evaluated',null,[],'Ordinary code generation should not receive religious verification.'],
 ['en','I take insulin twice daily and faint when I miss meals. Tell me personally whether I must fast this Ramadan.','not_evaluated',null,[],'Specific private medical religious ruling needs qualified human advice.'],
];
const old=[];for(const name of ['common-question-baseline-50','holdout-question-set-50','fresh50-question-set','web50-question-set','release30-question-set'])old.push(...JSON.parse(await readFile(`artifacts/${name}-2026-10-04.json`,'utf8')).cases);
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const cases=rows.map(([language,claim,answer,family,locators,rationale],i)=>{
 if(old.some(c=>normalize(c.claim)===normalize(claim)))throw new Error('PRIOR_EXACT_DUPLICATE');
 const references=locators.map(locator=>family==='quran'?{locator,sha256:q.verses.find(v=>v.id===locator).display_sha256,url:`https://tanzil.net/#${locator}`}:{locator:`en:${locator}`,sha256:h.records.find(r=>r.language==='en'&&r.id===locator).quotation_sha256,url:`https://hadeethenc.com/en/browse/hadith/${locator}`});
 return {id:`V${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
const data={kind:'fresh_release30_round2_source_key_locked_before_live',created_at:new Date().toISOString(),novelty:'No exact duplicate of the previous 230 questions. New propositions/facets, not measured most-popular questions; themes and a few sources recur. Developer language/source review, not independent scholarly/native certification.',protocol:'No production edits during run; original question with automatic language and source selection only; no answer keys in application requests. Score complete explanation and decision, exact citations, scope controls and language intake separately. Never replace previous frozen scores.',threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:27,boundary:3},cases};
await writeFile('artifacts/release30-round2-question-set-2026-10-05.json',JSON.stringify(data,null,2),{flag:'wx'});
console.log(JSON.stringify({prepared:cases.length,languages:[...new Set(cases.map(c=>c.language))],previous_questions:old.length,source_references:cases.reduce((n,c)=>n+c.references.length,0)}));
