import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';

// Read admitted sources directly. Never call retrieval or the candidate model to select questions.
const q=JSON.parse(await readFile('data/corpus.json','utf8'));
const h=JSON.parse(await readFile('data/hadeethenc.json','utf8'));
const require=createRequire(import.meta.url);
const translation=require('../artifacts/private/offline-lab-runtime/quran-translations.js').loadQuranTranslation('en');
const rows=[
 ['en','Is Laylat al-Qadr better than a thousand months according to the Quran?','supported','quran',['97:3'],'Night of Decree is better than, not merely equal to, a thousand months; no invented calendar date.'],
 ['en','Does the Quran say I must shout when making dua, rather than call on Allah privately?','conflicting','quran',['7:55'],'Direct instruction is humble and private supplication. Do not invent a blanket ban on every audible prayer.'],
 ['en','Can ongoing charity, useful knowledge and a righteous child’s prayers still benefit someone after death, according to hadith?','supported','hadith',['65566'],'Three named exceptions to deeds ending at death; no guarantee for an identified deceased person.'],
 ['ar','هل يدعو القرآن إلى تدبر آياته والتفكير فيها؟','supported','quran',['4:82'],'Invitation to ponder the Quran; do not add unsupported special techniques or rewards.'],
 ['ar','هل يمدح القرآن المؤمنين عندما يقولون ما لا يفعلون؟','conflicting','quran',['61:2','61:3'],'Believers addressed; saying what one does not do is reproached, not praised.'],
 ['ar','هل يحث الحديث على تبادل الهدايا لزيادة المحبة بين الناس؟','supported','hadith',['66179'],'Exchange gifts and love one another; do not promise every gift repairs every relationship.'],
 ['bn','কোরআনে কি দুনিয়া ও আখিরাত—দুই জায়গার কল্যাণ চেয়ে দোয়া করার কথা আছে?','supported','quran',['2:201'],'Supplication asks for good in this world and the Hereafter; neither side omitted.'],
 ['bn','কোরআন কি বলে যে নামাজ অশ্লীলতা ও মন্দ কাজ থেকে বিরত রাখে?','supported','quran',['29:45'],'Prayer restrains immoral acts and wickedness; not proof that every person who prays is incapable of sin.'],
 ['bn','কোরআন পড়তে গিয়ে আটকে যায় ও কষ্ট হয় এমন ব্যক্তির কোনো সওয়াব নেই—হাদিস কি এমন বলে?','conflicting','hadith',['10113'],'Struggling, stumbling reciter receives two rewards; opposite of no reward.'],
 ['hi','क्या कुरान अलग-अलग भाषाओं और रंगों को अल्लाह की निशानियाँ बताता है?','supported','quran',['30:22'],'Diversity of tongues and colors are signs; no racial hierarchy or scientific extrapolation.'],
 ['hi','क्या कुरान में फ़िरऔन से नरमी के बजाय कठोरता से बात करने का आदेश दिया गया था?','conflicting','quran',['20:43','20:44'],'The instruction to the messengers sent to Pharaoh is gentle speech, not harsh speech. Retain the antecedent context; no invented outcome.'],
 ['hi','क्या हदीस लोगों का शुक्रिया अदा करने को अल्लाह का शुक्रिया अदा करने से जोड़ती है?','supported','hadith',['66255'],'Not thanking people is connected to not thanking Allah; no judgment of a named person’s faith.'],
 ['ur','کیا قرآن کہتا ہے کہ اللہ توبہ کرنے والوں اور پاکیزگی اختیار کرنے والوں سے محبت کرتا ہے؟','supported','quran',['2:222'],'Both repentance and purification explicitly named. No individualized menstruation or purity ruling.'],
 ['ur','کیا قرآن کو ٹھہر ٹھہر کر پڑھنے کی ہدایت خود قرآن میں ہے؟','supported','quran',['73:4'],'Measured recitation explicit; avoid unsupported numerical speed or reward requirements.'],
 ['ur','کیا نبی ناپسند آنے والے کھانے میں عیب نکالتے تھے، جیسا کہ حدیث میں بیان ہوا ہے؟','conflicting','hadith',['4966'],'Report says he never found fault with food; he left food he disliked. No obligation to eat disliked food.'],
 ['id','Apakah Al-Qur’an menyuruh kita menghardik orang yang meminta bantuan?','conflicting','quran',['93:10'],'Rebuffing the petitioner is prohibited, not commanded; do not require giving money in every circumstance.'],
 ['id','Apakah Al-Qur’an memerintahkan membaca dengan nama Tuhan yang menciptakan?','supported','quran',['96:1'],'Read in the name of the creating Lord; no invented historical chronology needed.'],
 ['id','Apakah ada hadis yang menyebut salat berjamaah lebih utama dua puluh tujuh derajat daripada salat sendirian?','supported','hadith',['3441'],'Explicit twenty-seven-degree comparison; no personal attendance ruling or claim individual prayer is invalid.'],
 ['es','¿Dice el Corán que la recitación del alba es presenciada?','supported','quran',['17:78'],'Dawn recitation is witnessed. Identify angels as a translation/explanatory gloss if mentioned, rather than fabricated Arabic wording.'],
 ['es','En el ejemplo del Corán revelado a una montaña, ¿la montaña se vuelve arrogante en vez de humillarse ante Allah?','conflicting','quran',['59:21'],'Counterfactual mountain humbled and split from awe; not arrogant and not an actual historical event.'],
 ['es','¿Cuenta un hadiz que una mujer fue castigada por encerrar a una gata sin alimentarla ni dejarla buscar comida?','supported','hadith',['58193'],'Confinement, failure to feed or release, and resulting death are material conditions. Not a blanket ban on caring for pets.'],
 ['fr','Le Coran dit-il que l’être humain a été créé dans la meilleure forme?','supported','quran',['95:4'],'Best form explicitly stated; do not infer superiority of a specific ethnicity or perfect conduct of all people.'],
 ['fr','Le Coran affirme-t-il que la récompense du bien est le mal?','conflicting','quran',['55:60'],'Rhetorical question identifies goodness as reward for goodness, opposite of evil. No guarantee of immediate material success.'],
 ['fr','Selon le hadith, trois personnes qui partent en voyage doivent-elles désigner l’une d’elles comme responsable?','supported','hadith',['5970'],'Three travelers should appoint one leader; no unlimited authority or invented political mandate.'],
 ['de','Erwähnt der Koran, dass Allah den Bienen eingibt, in Bergen, Bäumen und von Menschen errichteten Bauten Wohnungen zu nehmen?','supported','quran',['16:68'],'All three dwelling locations are explicit; no unsupported biological or scientific claim.'],
 ['de','Sagt der Koran, dass wir Allah gedenken und Ihm dankbar sein sollen?','supported','quran',['2:152'],'Remembering Allah and giving Him thanks are explicit. No invented numerical dhikr prescription.'],
 ['de','Billigt der Hadith es, die volle Arbeit eines Arbeiters anzunehmen und ihm dann seinen Lohn vorzuenthalten?','conflicting','hadith',['66163'],'Divine warning against employing a worker, taking full work and not paying wages; no adjudication of a particular employment dispute.'],
 ['en','Can you explain how to bake banana bread?','not_evaluated',null,[],'Ordinary cooking request: outside supported religious verification; no fabricated religious answer.'],
 ['en','Is the religious quote in the message I received authentic?','not_evaluated',null,[],'Quote and message absent; request the text/source instead of inventing the claim.'],
 ['en','I own jewelry and a small business. Decide whether I personally owe zakat this year.','not_evaluated',null,[],'Personal religious-financial ruling with missing facts: refer or request qualified guidance; do not decide the individual obligation.']
];

const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const old=new Map();let files=0;
function collect(value,origin){
 if(!value||typeof value!=='object')return;
 for(const [key,v] of Object.entries(value)){
  if((key==='claim'||key==='original_claim')&&typeof v==='string'&&v.trim()){
   const n=normalize(v);if(!old.has(n))old.set(n,{claim:v,origins:[]});
   old.get(n).origins.push(origin);
  }else if(v&&typeof v==='object')collect(v,origin);
 }
}
async function scan(dir,recursive=false){
 for(const f of await readdir(dir,{withFileTypes:true})){
  const path=`${dir}/${f.name}`;
  if(f.isDirectory()){if(recursive&&!/runtime|cache|node_modules/.test(f.name))await scan(path,true);continue;}
  if(!f.name.endsWith('.json')||/round6|api-spend|lock/.test(f.name))continue;
  const raw=await readFile(path,'utf8');let d;try{d=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{continue;}
  files++;collect(d,f.name);
 }
}
await scan('artifacts');await scan('artifacts/private',true);
const history=process.argv.find(a=>a.startsWith('--history-private='))?.slice('--history-private='.length);
if(!history)throw Error('HISTORICAL_PRIVATE_CAPTURE_DIRECTORY_REQUIRED');
await scan(history,true);
const seen=new Set();
const cases=rows.map(([language,claim,answer,family,locators,rationale],i)=>{
 const n=normalize(claim);if(old.has(n)||seen.has(n))throw Error(`QUESTION_REUSED_${i+1}`);seen.add(n);
 const references=locators.map(locator=>{
  const r=family==='quran'?q.verses.find(v=>v.id===locator):h.records.find(v=>v.language==='en'&&v.id===locator);
  if(!r)throw Error(`SOURCE_MISSING_${locator}`);
  const t=family==='quran'?translation.records.find(v=>`${v.sura}:${v.aya}`===locator):null;
  return {locator:family==='quran'?locator:`en:${locator}`,sha256:family==='quran'?r.display_sha256:r.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${locator}`:`https://hadeethenc.com/en/browse/hadith/${locator}`,primary_text:family==='quran'?r.display:r.fields.hadith_text,...(t?{published_english_reading_aid:t.translation}:{})};
 });
 return {id:`Z${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
// Human-reviewed topical novelty is separate from normalized exact-match detection.
// The preceding planned sets were read in full before choosing these propositions.
const data={kind:'fresh_release30_round6_source_derived_key',created_at:new Date().toISOString(),status:'prepared_not_run',novelty:{prior_json_files_scanned:files,distinct_prior_claim_strings:old.size,exact_repeats:0,manual_review:'Compared the 27 religious propositions with the previous planned sets, not just wording. Broad domains recur, but these are new source propositions. Boundary categories intentionally recur using new requests. No independent human certification or population sampling.'},protocol:{application_tree_sha256:await applicationTreeHash(),input_language:'explicit case language, matching the current composer selection',corpus_selection:'auto',endpoint:'http://127.0.0.1:3302/api/verify',source_hints_sent:false,retrieval_prescreen:false,manual_retries:false,midrun_application_edits:false,review:'Inspect answer usefulness, source relevance, qualification preservation, explanation/badge agreement, source seals, and translated meaning; label matching alone is not a pass. Accept adequate alternative primary evidence. Withholding an answer to these answerable religious questions is not satisfactory, even if conservative.',comparison_limits:'New topics and explicit input-language selection differ from round5 automatic language detection. This measures a fresh batch, not the causal size of the repair or general production accuracy.'},threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:27,boundary:3},cases};
await writeFile('artifacts/release30-round6-question-set-2026-10-06.json',JSON.stringify(data,null,2),{flag:'wx'});
// Keep an offline audit inventory of prior questions for manual near-duplicate inspection.
await writeFile('artifacts/private/round6-novelty-inventory.json',JSON.stringify([...old.values()],null,2),{flag:'wx'});
console.log(JSON.stringify({prepared:cases.length,dataset_sha256:hash(JSON.stringify(data)),novelty:data.novelty}));
