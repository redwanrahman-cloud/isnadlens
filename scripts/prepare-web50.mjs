import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url);
const q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus();
const h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
// References are reviewer-only. The live runner submits only the original question.
const rows=[
 ['en','Can I earn money through trade during Hajj, or is that forbidden?','2:198',true,'Seeking livelihood during pilgrimage is allowed; not every trade is thereby lawful.'],
 ['ar','هل التقوى هي خير زاد للحج؟','2:197',true,'The verse explicitly identifies piety as the best provision.'],
 ['en','After finishing the pilgrimage rites, should people remember Allah?','2:200',true,'Remembrance follows completion of the rites.'],
 ['id','Apakah berburu binatang darat diperbolehkan ketika sedang ihram?','5:95',false,'Killing game while in ihram is prohibited; do not confuse this with fishing.'],
 ['es','¿Está permitido cazar después de salir del estado de ihram?','5:2',true,'Permission follows release from ihram; other restrictions still apply.'],
 ['en','Is praying at the Station of Abraham mentioned as part of the sacred-house guidance?','2:125',true,'The station is designated as a place of prayer.'],
 ['fr','Le pèlerinage peut-il être accompli en venant à pied, et pas seulement sur une monture?','22:27',true,'The call includes pilgrims arriving on foot and on lean camels.'],
 ['en','Does the Quran tell pilgrims to circumambulate the Ancient House?','22:29',true,'Circumambulation is explicitly commanded.'],
 ['ar','هل يبيح القرآن الجدال والفسوق أثناء الحج؟','2:197',false,'The pilgrimage passage excludes wrongdoing and disputation.'],
 ['de','Ist die Abreise nach zwei Tagen während der genannten Pilgertage grundsätzlich sündhaft?','2:203',false,'The verse states no sin for leaving in two days or delaying, with the piety qualification.'],
 ['en','Can someone shave their head before the sacrificial offering reaches its appointed place, without the stated illness exception?','2:196',false,'The prohibition and illness/head-ailment concession must both be preserved.'],
 ['bn','শপথ ভাঙার কাফফারার একটি উপায় কি দশজন দরিদ্রকে খাবার দেওয়া?','5:89',true,'Feeding ten poor people is one option, not the only option.'],
 ['hi','क्या सच्चे मन से तौबा करने का निर्देश इस्लाम में मिलता है?','66:8',true,'Sincere repentance is explicitly commanded.'],
 ['ur','کیا توبہ، ایمان اور نیک عمل کے بعد اللہ برائیوں کو نیکیوں میں بدل سکتا ہے؟','25:70',true,'Repentance, belief and righteous action are stated conditions.'],
 ['en','If someone offended me, does the Quran encourage forgiveness rather than cutting off charitable help to needy relatives?','24:22',true,'Forgiveness accompanies the instruction not to swear off such assistance.'],
 ['ar','هل المودة والرحمة بين الزوجين من آيات الله؟','30:21',true,'Affection and mercy between spouses are described among divine signs.'],
 ['id','Bolehkah orang tua menyapih anak berdasarkan persetujuan dan musyawarah bersama?','2:233',true,'Mutual consent and consultation qualify the permission.'],
 ['es','¿Debe una persona gastar en manutención según los medios que Allah le ha dado?','65:7',true,'Maintenance is according to means, without a personal amount calculation.'],
 ['fr','Est-il permis de retenir une épouse après le divorce dans le but de lui faire du mal?','2:231',false,'Harmful retention is expressly forbidden.'],
 ['de','Darf ein Mann mehrere Frauen heiraten, obwohl er fürchtet, sie nicht gerecht behandeln zu können?','4:3',false,'The stated fear of injustice directs him to one; this is not an individual marriage ruling.'],
 ['bn','স্ত্রীর সঙ্গে ভালোভাবে জীবনযাপন করার নির্দেশ কি কোরআনে আছে?','4:19',true,'Living with wives honorably is explicit, a distinct facet from forced inheritance.'],
 ['hi','क्या किसी समुदाय से नफरत हमें उसके साथ अन्याय करने की अनुमति देती है?','5:8',false,'Hatred must not cause departure from justice.'],
 ['ur','کیا بغیر علم کے افواہ کو زبان سے آگے پھیلانا قرآن کے مطابق معمولی بات ہے؟','24:15',false,'The false-accusation context treats this as grave, not trivial.'],
 ['en','Are some suspicions sinful, so I should avoid making lots of suspicious assumptions?','49:12',true,'The passage says some suspicion is sin; it does not forbid every evidence-based concern.'],
 ['ar','هل يعد الله بزيادة النعمة مع الشكر؟','14:7',true,'The promise of increase follows gratitude.'],
 ['id','Apakah berdakwah seharusnya dengan hikmah dan nasihat yang baik?','16:125',true,'Wisdom and good instruction qualify invitation.'],
 ['es','¿Se permite discutir con la Gente del Libro de cualquier manera, incluso de forma ofensiva?','29:46',false,'Discussion is in the best manner, with the specified wrongdoing exception.'],
 ['fr','La douceur du Prophète a-t-elle aidé les gens à rester autour de lui?','3:159',true,'Harshness would have caused dispersion; gentleness is described.'],
 ['de','Lehrt der Koran, dass die Suche nach dem Jenseits bedeutet, jeden Anteil am weltlichen Leben zu vergessen?','28:77',false,'The instruction explicitly says not to forget the worldly share.'],
 ['bn','অভিভাবকের কাছে এতিমের সম্পদ থাকলে, বুঝশক্তি যাচাই করে তা ফিরিয়ে দেওয়ার নির্দেশ আছে কি?','4:6',true,'Testing maturity and sound judgment precedes returning the property.'],
 ['hi','क्या विरासत बाँटते समय उपस्थित गरीबों और अनाथों को कुछ देने की बात कही गई है?','4:8',true,'The verse names those present and instructs provision and kind words.'],
 ['ur','کیا بیوی اپنی خوشی سے مہر کا کچھ حصہ واپس دے تو اسے قبول کرنا جائز ہے؟','4:4',true,'Only voluntary relinquishment qualifies the permission.'],
 ['en','Before consummation, if a dowry was already fixed, is the usual divorce entitlement half of it unless the stated waiver applies?','2:237',true,'Half the fixed dowry is the rule in this specified situation, with waiver exceptions.'],
 ['ar','هل يجب الإنفاق على المطلقة الحامل حتى تضع حملها؟','65:6',true,'The verse requires provision until delivery.'],
 ['en','Can people burdened by debt be among the Quran’s listed zakat recipients?','9:60',true,'Debtors are a listed category; individual eligibility requires further facts.'],
 ['en','Is liking nice clothes automatically arrogance in Islam?','en:6209',false,'Arrogance is rejecting truth and looking down on people; liking beauty alone is not the definition.'],
 ['ar','هل الدعاء عبادة في الحديث؟','en:5496',true,'Supplication is explicitly identified as worship.'],
 ['en','When putting shoes on, should I start with the left foot according to the prophetic instruction?','en:5357',false,'The right is first when putting on, the left first when removing.'],
 ['id','Apakah kesehatan dan waktu luang termasuk dua nikmat yang sering disia-siakan manusia?','en:5449',true,'Health and free time are the two named blessings.'],
 ['es','¿Debo taparme la boca con la mano cuando bostezo, según el hadiz?','en:5280',true,'The hadith instructs covering the mouth during yawning.'],
 ['fr','Le Prophète baissait-il la voix et couvrait-il sa bouche lorsqu’il éternuait?','en:3317',true,'Both covering and lowering the voice are reported.'],
 ['de','Hat der Prophet im Fall des Beduinen in der Moschee dazu aufgefordert, die Dinge schwer statt leicht zu machen?','en:5806',false,'The instruction in that incident is to make things easy, not difficult.'],
 ['bn','আল্লাহর সন্তুষ্টির জন্য অসুস্থ কাউকে দেখতে যাওয়ার পুরস্কার কি হাদিসে আছে?','en:3442',true,'A reward for visiting the sick for Allah is reported.'],
 ['hi','क्या स्वीकार किए गए हज का प्रतिफल जन्नत बताया गया है?','en:65627',true,'Paradise is the stated reward for accepted Hajj; acceptance is not individually certified.'],
 ['ur','کیا صفا اور مروہ کے درمیان سعی صرف تین چکر ہے؟','en:3309',false,'The report describes seven rounds of Sa’i; do not confuse three brisk Tawaf rounds with Sa’i.'],
 ['en','Should Muslims greet only people they already know?','en:5808',false,'The report includes people known and unknown.'],
 ['ar','هل يذكر الحديث أن موضع البركة في الطعام قد لا نعرفه ولذلك لا نهمل بقيته؟','en:5653',true,'The report states we do not know where its blessing lies; this is not unsafe-food advice.'],
 ['en','Are regular good deeds within a person’s capacity valued in the prophetic teaching?','en:5845',true,'Regularity and capacity are both present.'],
 ['en','Does Islamic teaching warn that bad companionship can harm a person, like a blacksmith’s bellows?','en:3127',true,'The companion metaphor explicitly includes harmful effects.'],
 ['en','Is chicken meat categorically forbidden in Islam?','en:2975',false,'The report describes the Prophet eating chicken.'],
];
const prior=(await Promise.all(['common-question-baseline-50','holdout-question-set-50','fresh50-question-set','web15-question-set'].map(async name=>JSON.parse(await readFile(`artifacts/${name}-2026-10-04.json`,'utf8'))))).flatMap(d=>d.cases);
if(rows.length!==50)throw new Error('EXPECTED_FIFTY');
const seen=new Set();
const cases=rows.map(([language,claim,locator,yes,reference_rationale],index)=>{
 if(seen.has(claim)||prior.some(c=>c.claim===claim))throw new Error('DUPLICATE_QUESTION');seen.add(claim);
 const hadith=locator.startsWith('en:');
 const entry=hadith?h.records.find(r=>r.language==='en'&&r.id===locator.slice(3)):q.verses.find(v=>v.id===locator);
 if(!entry)throw new Error(`SOURCE_MISSING:${locator}`);
 const quotation=hadith?entry.fields.hadith_text:entry.display;
 return {id:`T${String(index+1).padStart(2,'0')}`,language,claim,expected_verdict:yes?'supported_within_selected_corpus':'conflicting_within_selected_corpus',reference_rationale,reference:{kind:hadith?'hadith':'quran',locator,quotation,sha256:hash(quotation),source_url:hadith?entry.fields.link:`https://tanzil.net/#${locator}`,publisher_grade:hadith?entry.fields.grade:null},review:'Prepared for principal source review before freeze; not independent scholar or native-language expert certification.'};
});
const languages=Object.fromEntries([...new Set(cases.map(c=>c.language))].map(l=>[l,cases.filter(c=>c.language===l).length]));
const data={kind:'fresh50_after_trusted_search_and_decision_guard',created_at:new Date().toISOString(),counts:{total:50,quran:35,hadith:15,supported:cases.filter(c=>c.expected_verdict==='supported_within_selected_corpus').length,contradicted:cases.filter(c=>c.expected_verdict==='conflicting_within_selected_corpus').length,languages},novelty:'No exact duplicates of prior165. New propositions/facets; familiar sources and categories recur. Not a measured popularity ranking. Includes specific new facets of already-covered topics, explicitly disclosed.',execution:'Send only original question, automatic language/source selection. Expected answers, rationales and reference locators never enter requests. First pass immutable; no repairs during run. Score labels, complete reasoning, abstentions, unavailable calls, language handling and actual web use separately.',cases};
const destination='artifacts/web50-question-set-2026-10-04.json';
if(process.argv.includes('--freeze')){
 const existing=JSON.parse(await readFile(destination,'utf8'));
 if(hash(JSON.stringify(existing.cases))!==hash(JSON.stringify(cases)))throw new Error('DATASET_CHANGED_BEFORE_FREEZE');
 await writeFile('artifacts/web50-freeze-2026-10-04.json',JSON.stringify({dataset_sha256:hash(JSON.stringify(existing)),application_tree_sha256:await applicationTreeHash(),build:(await readFile('.next/BUILD_ID','utf8')).trim(),frozen_at:new Date().toISOString(),review:'Principal inspected admitted witnesses and query meaning; not scholarly certification.',acceptance:existing.execution},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({frozen:50,counts:existing.counts}));
}else{
 await writeFile(destination,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({counts:data.counts,source_review:cases.map(c=>({id:c.id,claim:c.claim,quotation:c.reference.quotation,rationale:c.reference_rationale}))}));
}
