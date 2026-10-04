import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url),{loadCorpus}=require('../artifacts/private/offline-lab-runtime/corpus.js'),{loadHadith,authenticateHadith}=require('../artifacts/private/offline-lab-runtime/hadith.js');
const q=loadCorpus(),h=loadHadith();
// Project-authored questions and reviewer glosses. No model response was used to select them.
const rows=[
 ['head wiping in wudu','en','Does wudu include wiping the head according to the Quran?','yes','5:6'],
 ['tayammum without water','ar','هل يذكر القرآن التيمم بصعيد طيب عند عدم وجود الماء وفق الشروط المذكورة؟','yes','4:43','Does the Quran mention tayammum with clean earth when water is unavailable under its stated conditions?'],
 ['work after Friday prayer','en','Can people seek their livelihood after Friday prayer according to the Quran?','yes','62:10'],
 ['prescribed prayer times','bn','কোরআন কি বলে যে মুমিনদের নামাজ নির্দিষ্ট সময়ে আদায় করার বিধান রয়েছে?','yes','4:103','Does the Quran describe prayer for believers as prescribed at fixed times?'],
 ['additional night prayer','hi','क्या कुरान में पैगंबर को रात में अतिरिक्त नमाज़ पढ़ने का निर्देश दिया गया है?','yes','17:79','Does the Quran instruct the Prophet to perform additional night prayer?'],
 ['Ramadan intimacy outside itikaf','ur','کیا رمضان کی راتوں میں میاں بیوی کا تعلق جائز ہے، بشرطیکہ اعتکاف میں نہ ہوں؟','yes','2:187','Is marital intimacy permitted on Ramadan nights outside itikaf?'],
 ['Safa and Marwah','id','Apakah Al-Qur’an menyebut Safa dan Marwah sebagai bagian dari syiar Allah?','yes','2:158','Does the Quran identify Safa and Marwah as symbols of Allah?'],
 ['purpose of sacrifice','es','¿Dice el Corán que en el sacrificio lo que llega a Allah es la piedad, no la carne ni la sangre?','yes','22:37','Does the Quran say piety, rather than sacrificial flesh or blood, reaches Allah?'],
 ['women marriage gifts','fr','Le Coran demande-t-il de donner leur dot aux femmes?','yes','4:4','Does the Quran instruct giving women their marriage gifts?'],
 ['complete breastfeeding term','de','Nennt der Koran zwei volle Jahre für das Stillen, wenn die Stillzeit vollendet werden soll?','yes','2:233','Does the Quran mention two full years for those wishing to complete breastfeeding?'],
 ['pregnant divorce waiting period','en','Does the Quran say a pregnant divorced woman’s waiting period ends when she gives birth?','yes','65:4'],
 ['remarriage after waiting period','ar','هل ينهى القرآن عن منع المطلقات من العودة إلى أزواجهن بعد انتهاء العدة إذا تراضوا بالمعروف؟','yes','2:232','Does the Quran forbid preventing divorced women from remarrying their husbands after the waiting period when they mutually agree appropriately?'],
 ['ease alongside hardship','bn','কোরআন কি বলে যে কষ্টের সঙ্গে স্বস্তিও রয়েছে?','yes','94:5','Does the Quran say ease accompanies hardship?'],
 ['responsibility and capacity','hi','क्या कुरान कहता है कि अल्लाह किसी व्यक्ति पर उसकी क्षमता से अधिक जिम्मेदारी नहीं डालता?','yes','2:286','Does the Quran say Allah does not charge a soul beyond its capacity?'],
 ['remembrance and reassurance','ur','کیا قرآن کہتا ہے کہ اللہ کے ذکر سے دلوں کو اطمینان ملتا ہے؟','yes','13:28','Does the Quran say hearts find reassurance through remembrance of Allah?'],
 ['peoples knowing one another','id','Menurut Al-Qur’an, apakah manusia dijadikan berbangsa dan bersuku agar saling mengenal?','yes','49:13','Does the Quran describe peoples and tribes as formed so that people know one another?'],
 ['souls during sleep','es','¿Dice el Corán que Allah toma las almas durante el sueño además de la muerte?','yes','39:42','Does the Quran describe Allah taking souls during sleep as well as death?'],
 ['blessings upon Prophet','fr','Le Coran demande-t-il aux croyants de prier pour le Prophète et de le saluer?','yes','33:56','Does the Quran instruct believers to invoke blessings and greetings upon the Prophet?'],
 ['adornment at worship','de','Fordert der Koran dazu auf, beim Besuch der Gebetsstätte angemessenen Schmuck beziehungsweise Kleidung zu tragen?','yes','7:31','Does the Quran instruct taking adornment at each place of worship?'],
 ['insulting others objects of worship','en','Does the Quran forbid insulting what other people worship so that they do not insult Allah in ignorance?','yes','6:108'],
 ['children and fear of poverty','ar','هل ينهى القرآن عن قتل الأولاد خوفا من الفقر؟','yes','17:31','Does the Quran forbid killing children out of fear of poverty?'],
 ['nearness and supplication','en','Does the Quran describe Allah as near and responding to those who call upon Him?','yes','2:186'],
 ['creation in six days','en','Does the Quran describe the heavens and earth as created in six days?','yes','7:54'],
 ['purpose of jinn and humans','en','Does the Quran say jinn and humans were created to worship Allah?','yes','51:56'],
 ['humanity of the Messenger','ar','هل يصف القرآن الرسول بأنه بشر يوحى إليه؟','yes','18:110','Does the Quran describe the Messenger as a human receiving revelation?'],
 ['sleep attributed to Allah','en','Does the Quran say Allah needs sleep?','no','2:255'],
 ['women excluded from inheritance','ar','هل يقول القرآن إن النساء لا نصيب لهن في الميراث؟','no','4:7','Does the Quran say women have no share in inheritance?'],
 ['inherited guilt','en','Does the Quran say people automatically bear guilt for their parents’ sins?','no','6:164'],
 ['ransom on Judgment Day','en','Does the Quran say a ransom will be accepted on the Day of Judgment?','no','2:48'],
 ['wealth shielding disbelievers','ar','هل يقول القرآن إن أموال من كفروا وأولادهم تحميهم من عقاب الله؟','no','3:10','Does the Quran say the wealth and children of disbelievers shield them from Allah?'],
 ['body parts never testify','en','Does the Quran say hands and feet will never testify about people’s deeds on Judgment Day?','no','24:24'],
 ['offspring attributed to Allah','en','Does the Quran describe Allah as having a child?','no','112:3'],
 ['women denied good-deed reward','bn','কোরআন কি বলে যে সৎকর্মের পুরস্কার শুধু পুরুষদের জন্য, বিশ্বাসী নারীদের জন্য নয়?','no','16:97','Does the Quran say good-deed reward is only for men and not believing women?'],
 ['Satan treated as friend','hi','क्या कुरान कहता है कि शैतान इंसानों का मित्र है और उसे मित्र मानना चाहिए?','no','35:6','Does the Quran say Satan is humanity’s friend and should be treated as a friend?'],
 ['purposeless creation','ur','کیا قرآن کہتا ہے کہ آسمان، زمین اور ان کے درمیان کی چیزیں بے مقصد پیدا کی گئی ہیں؟','no','38:27','Does the Quran say heavens, earth and what is between them were created without purpose?'],
 ['responding with worse evil','id','Apakah Al-Qur’an memerintahkan membalas keburukan dengan yang lebih buruk?','no','41:34','Does the Quran command responding to evil with something worse?'],
 ['martyrs not alive with Lord','es','¿Dice el Corán que quienes murieron en el camino de Allah no están vivos junto a su Señor?','no','3:169','Does the Quran say those killed in Allah’s way are not alive with their Lord?'],
 ['reversed tamattu fasting days','fr','Pour le pèlerinage tamattu sans offrande disponible, le Coran indique-t-il sept jours de jeûne pendant le Hajj et trois après le retour?','no','2:196','For tamattu when no offering is available, does the Quran prescribe seven fasting days during Hajj and three after return?'],
 ['sun without a course','en','Does the Quran say the sun does not follow any course?','no','36:38'],
 ['asking for less knowledge','en','Does the Quran instruct asking Allah to decrease one’s knowledge?','no','20:114'],
 ['eating manners','en','Does the Hadith teach mentioning Allah’s name, eating with the right hand and taking food from nearby?','yes','h:58120'],
 ['forgetful eating while fasting','ar','من أكل أو شرب ناسيا وهو صائم، هل يقول الحديث أن يكمل صومه؟','yes','h:4525','Does the Hadith tell someone who forgetfully eats or drinks while fasting to complete the fast?'],
 ['Allah loves gentleness','en','Does the Hadith say Allah loves gentleness and rewards it differently from violence?','yes','h:5797'],
 ['removing road hazards and faith','en','Is removing something harmful from a path described as a branch of faith in Hadith?','yes','h:3276'],
 ['mercy toward the merciful','ar','هل يقول الحديث إن الله يرحم من عباده الرحماء؟','yes','h:6405','Does the Hadith say Allah shows mercy to His merciful servants?'],
 ['reward for Quran letters','en','Does the Hadith describe reward for each letter recited from the Quran, with a good deed multiplied tenfold?','yes','h:6275'],
 ['prompt iftar','en','Does the Hadith encourage prompt iftar rather than needless delay?','yes','h:4438'],
 ['following Prophet prayer example','ar','هل أمر النبي في الحديث بأن نصلي كما رأيناه يصلي؟','yes','h:3059','Did the Prophet instruct in Hadith to pray as people saw him pray?'],
 ['estrangement over three nights','en','Does the Hadith prohibit Muslims shunning one another for more than three nights as a general rule?','yes','h:5365'],
 ['praising Allah after food','ar','هل يذكر الحديث رضا الله عن العبد الذي يحمده بعد الأكل أو الشرب؟','yes','h:5798','Does the Hadith mention Allah’s pleasure with a servant who praises Him after eating or drinking?'],
];
const oldPaths=['artifacts/common-question-baseline-50-2026-10-04.json','artifacts/holdout-question-set-50-2026-10-04.json'];
const old=await Promise.all(oldPaths.map(async p=>JSON.parse(await readFile(p,'utf8'))));
const oldClaims=new Set(old.flatMap(d=>d.cases.map(c=>c.claim.normalize('NFKC').trim().toLowerCase())));
const cases=rows.map(([topic,input_language,claim,reference_answer,ref,gloss],index)=>{
 if(oldClaims.has(claim.normalize('NFKC').trim().toLowerCase()))throw new Error('OLD_QUESTION_REUSED');
 const hadith=ref.startsWith('h:');
 const cards=hadith?['ar','en'].map(language=>authenticateHadith(h,h.records.find(r=>r.id===ref.slice(2)&&r.language===language))):[q.verses.find(v=>v.id===ref)];
 if(cards.some(c=>!c))throw new Error('REFERENCE_MISSING');
 const witnesses=cards.map(c=>hadith?{locator:`hadith:${c.locator}`,quotation_sha256:c.quotation_sha256,source_id:c.source_id,source_version:c.version}:{locator:`quran:${c.id}`,quotation_sha256:c.display_sha256,source_id:'QURAN-AR-TANZIL-UTHMANI-V1.1',source_version:'1.1'});
 return {id:`N${String(index+1).padStart(2,'0')}`,topic,claim,reviewer_english_gloss:gloss??claim,input_language,request_input_language:'auto',corpus_selection:'auto',reference_family:hadith?'hadith':'quran',reference_answer,expected_verdict:reference_answer==='yes'?'supported_within_selected_corpus':'conflicting_within_selected_corpus',reference_accuracy_eligible:true,reference_status:'primary_text_supported_or_explicitly_incompatible',reference_witnesses:witnesses,reference_links:hadith?cards.map(c=>c.source_url):[`https://tanzil.net/#${ref}`,`https://quranenc.com/en/browse/english_rwwad/${ref.replace(':','/')}`],review_status:'developer_primary_source_and_language_review_not_scholar_certification'};
});
if(cases.length!==50||new Set(cases.map(c=>c.claim)).size!==50)throw new Error('FIFTY_UNIQUE_REQUIRED');
const dataset={dataset_id:'fresh50-luna-terra-2026-10-04-v1',created_at:new Date().toISOString(),purpose:'Fifty new project-authored propositions across online Islamic question categories; not a measured popularity ranking or verbatim search-log sample.',selection_sources:['https://www.dar-alifta.org/en/fatwa/category/126/prayer','https://www.dar-alifta.org/en/fatwa/category/127/zakat','https://hadeethenc.com/en/browse/category/267'],novelty:{prior_sets:oldPaths,exact_question_duplicates:0,semantic_review:'Manual comparison against earlier 100 questions. New propositions/facets; some familiar categories and primary passages recur. No paraphrase or negation of an earlier tested proposition selected.'},counts:{total:50,quran:40,hadith:10,supported:35,contradicted:15,languages:Object.fromEntries([...new Set(cases.map(c=>c.input_language))].map(l=>[l,cases.filter(c=>c.input_language===l).length]))},protocol:'Freeze before app calls. Send only claim, auto input language and auto source selection. Reviewer gloss, expected label, reference links and witnesses never reach the app. No application repair or replay during first pass.',cases};
await writeFile('artifacts/fresh50-question-set-2026-10-04.json',JSON.stringify(dataset,null,2)+'\n',{flag:'wx'});
const sourceRows=cases.map(c=>`| ${c.id} | ${c.input_language} | ${c.reviewer_english_gloss.replaceAll('|','\\|')} | ${c.reference_answer} | [${c.reference_witnesses[0].locator}](${c.reference_links[0]}) |`);
await writeFile('docs/FRESH50-SOURCE-REVIEW.md',['# Fresh fifty — pre-run source review','', 'PRE_FREEZE_DEVELOPER_SOURCE_REVIEW_COMPLETE', '', 'Reviewed before live calls against admitted Arabic Quran and publisher Hadith originals. Native questions preserve the reviewer propositions, speaker attribution and material qualifications. Developer review is not independent linguistic or scholarly certification. Categories are inspired by published question collections, not frequency analytics. The 35 yes / 15 no split has a 70% always-yes baseline.', '', 'Some primary verses recur because they contain different propositions: head wiping versus earlier face/arm washing; work after Friday prayer versus leaving trade before it; marital intimacy versus earlier fasting times; adornment versus avoiding waste. These are distinct facets, not paraphrases of previous questions.', '', 'The 15 negative cases contain an explicit incompatible proposition; absence alone is never the expected basis for contradiction. Hajj/tamattu qualifications and pregnant-divorce context are stated. No personal case or new fatwa is scored as a settled textual answer.', '', '| Case | Language | Reviewer proposition | Expected | Primary source |','| --- | --- | --- | --- | --- |',...sourceRows,''].join('\n'),{flag:'wx'});
console.log(JSON.stringify({prepared:50,counts:dataset.counts,dataset_sha256:hash(JSON.stringify(dataset))}));
