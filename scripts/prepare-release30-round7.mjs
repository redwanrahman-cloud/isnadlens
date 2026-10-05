import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {hash,applicationTreeHash} from './holdout-protocol.mjs';

// Read admitted sources directly. Never call retrieval or the candidate model to select questions.
const q=JSON.parse(await readFile('data/corpus.json','utf8'));
const h=JSON.parse(await readFile('data/hadeethenc.json','utf8'));
const require=createRequire(import.meta.url);
const translation=require('../artifacts/private/offline-lab-runtime/quran-translations.js').loadQuranTranslation('en');
const rows=[
  [
    "en",
    "In Yusuf's dreem, were there eleven stars along with the sun and moon?",
    "supported",
    "quran",
    [
      "12:4"
    ],
    "Dream contains eleven stars, sun and moon; do not turn a dream into a physical astronomical event.",
    "typo",
    "main"
  ],
  [
    "en",
    "Does the Quran say the sleepers stayed in the cave for only ten years?",
    "conflicting",
    "quran",
    [
      "18:25"
    ],
    "Text states three hundred years plus nine, not ten.",
    "false_premise_number",
    "main"
  ],
  [
    "en",
    "Does hadith tell us to blow into a drnking cup?",
    "conflicting",
    "hadith",
    [
      "5453",
      "58123"
    ],
    "Reports forbid blowing into a drink/vessel; do not replace the question with the opposite.",
    "typo_false_premise",
    "main"
  ],
  [
    "en",
    "I copied a religious sentence earlier. Can you check whether that exact sentence is from the Quran?",
    "not_evaluated",
    null,
    [],
    "The sentence is absent; ask for its text or usable reference before retrieval.",
    "missing_quote",
    "main"
  ],
  [
    "en",
    "Is it okay to repeat it again before the other one?",
    "not_evaluated",
    null,
    [],
    "No identifiable action or object; ask what actions are meant, without inventing them.",
    "ambiguous",
    "main"
  ],
  [
    "en",
    "Please draft a polite note asking my landlord to repair the kitchen tap.",
    "not_evaluated",
    null,
    [],
    "Unrelated writing request; no religious reframing or invented answer.",
    "out_of_scope",
    "main"
  ],
  [
    "ar",
    "هل أُمرت مريم بهز جذع النخله لتسقط عليها رطباً؟",
    "supported",
    "quran",
    [
      "19:25"
    ],
    "Mary is instructed to shake the palm trunk so ripe dates fall; preserve narrative setting.",
    "typo",
    "main"
  ],
  [
    "ar",
    "هل يدعو الحديث إلى إبعاد شخص من مجلسه لكي نجلس مكانه؟",
    "conflicting",
    "hadith",
    [
      "5350"
    ],
    "Moving another from their seat to take it is prohibited; making room is the instruction.",
    "false_premise",
    "main"
  ],
  [
    "ar",
    "وصلتني عبارة منسوبة للنبي، فهل نسبتها صحيحة؟",
    "not_evaluated",
    null,
    [],
    "Absent attributed phrase; request wording/reference instead of generating a substitute.",
    "missing_quote",
    "main"
  ],
  [
    "bn",
    "কোরআনের বর্ণনায় কি একটি পিঁপড়া সুলায়মান ও তাঁর বাহিনী আসার সময় অন্য পিঁপড়াদের বাসায় ঢুকতে বলেছিল?",
    "supported",
    "quran",
    [
      "27:18"
    ],
    "An ant warns the ants to enter dwellings to avoid being crushed unknowingly by Solomon and his army.",
    "ordinary_narrative",
    "main"
  ],
  [
    "bn",
    "হাদিসে কি হাঁচি দেওয়ার পর আলহামদুলিল্লাহ বলতে বলা হয়েছে?",
    "supported",
    "hadith",
    [
      "3433"
    ],
    "Sneezer says alhamdulillah; retain conditions if explaining the response sequence.",
    "ordinary_short",
    "main"
  ],
  [
    "bn",
    "ফেসবুকে দেখা দোয়াটার কোনো সহিহ ভিত্তি আছে?",
    "not_evaluated",
    null,
    [],
    "The particular dua is absent; ask the user to paste it or give its reference. Do not equate lack of supplied text with fabricated status.",
    "missing_quote",
    "main"
  ],
  [
    "hi",
    "क्या मूसा ने अपने रब से अपना सीना खोल देने की दुआ की थी?",
    "supported",
    "quran",
    [
      "20:25"
    ],
    "Moses asks his Lord to expand his chest; context can identify speaker without inventing circumstances.",
    "ordinary_question",
    "main"
  ],
  [
    "hi",
    "क्या कुरान नींद को आराम के बजाय सज़ा बताता है?",
    "conflicting",
    "quran",
    [
      "78:9"
    ],
    "Sleep is rest in the text, not a general punishment.",
    "false_premise",
    "main"
  ],
  [
    "hi",
    "क्या हदीस सजदे में दोनों बाँहों को कुत्ते की तरह ज़मीन पर फैला देने के लिए कहती है?",
    "conflicting",
    "hadith",
    [
      "3111"
    ],
    "Report prohibits spreading forearms on ground like a dog; retain prostration setting.",
    "false_premise",
    "main"
  ],
  [
    "ur",
    "کیا قرآن میں ایوب کی دعا میں تکلیف کا ذکر اور اللہ کو سب سے بڑھ کر رحم کرنے والا کہا گیا ہے؟",
    "supported",
    "quran",
    [
      "21:83"
    ],
    "Job states affliction has touched him and addresses the most merciful; no personal healing promise.",
    "ordinary_question",
    "main"
  ],
  [
    "ur",
    "کیا ڈراؤنا خواب آنے پر حدیث اللہ کی پناہ مانگنے اور بائیں طرف تھتکارنے کی ہدایت دیتی ہے؟",
    "supported",
    "hadith",
    [
      "3586"
    ],
    "For a feared dream, seek refuge from its evil and spit lightly to the left; do not claim every dream predicts reality.",
    "ordinary_question",
    "main"
  ],
  [
    "ur",
    "میں نے سفر میں دو نمازیں اکٹھی پڑھیں۔ کیا میری اپنی نمازیں درست ہو گئیں؟",
    "not_evaluated",
    null,
    [],
    "Concrete personal ritual-validity judgment with insufficient circumstances; refer for qualified guidance rather than settle individual validity.",
    "personal_ruling",
    "main"
  ],
  [
    "id",
    "Apakah hilal membantu menentukan waktu ibadah haji menurut Al-Quran?",
    "supported",
    "quran",
    [
      "2:189"
    ],
    "New moons are time markers for people and Hajj; not a fabricated date for a current year.",
    "pilgrimage",
    "pilgrimage"
  ],
  [
    "id",
    "Apakah Al-Quran menyebut emas sebagai bekal terbaik untuk haji, bukan takwa?",
    "conflicting",
    "quran",
    [
      "2:197"
    ],
    "Best provision is taqwa, not gold; do not prohibit taking practical provisions.",
    "pilgrimage_false_premise",
    "pilgrimage"
  ],
  [
    "id",
    "Apakah hadits menyuruh mencui bejana tujuh kali setelah dijilat anjing?",
    "supported",
    "hadith",
    [
      "3143"
    ],
    "A vessel a dog drinks from is to be washed seven times; preserve report scope and any stated earth detail from source.",
    "typo",
    "main"
  ],
  [
    "es",
    "¿Dice el Corán que la verdadera ceguera puede estar en los corazones y no en los ojos?",
    "supported",
    "quran",
    [
      "22:46"
    ],
    "The verse contrasts eyes with hearts in breasts; keep spiritual context, not medical claims.",
    "ordinary_question",
    "main"
  ],
  [
    "es",
    "¿Permite el hadiz beber en recipientes de oro y plata?",
    "conflicting",
    "hadith",
    [
      "2985"
    ],
    "The instruction prohibits drinking in gold/silver vessels, not permits it.",
    "false_premise",
    "main"
  ],
  [
    "es",
    "¿Excluye el Corán al cautivo cuando elogia dar comida al necesitado y al huérfano?",
    "conflicting",
    "quran",
    [
      "76:8"
    ],
    "Captive is explicitly included with needy and orphan; do not omit the third named recipient.",
    "false_premise_omission",
    "main"
  ],
  [
    "fr",
    "La lettre de Soulayman à la reine comence-t-elle par le nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux ?",
    "supported",
    "quran",
    [
      "27:30"
    ],
    "Letter is from Solomon and begins in the name of Allah, the Merciful; no invented textual additions.",
    "typo",
    "main"
  ],
  [
    "fr",
    "Dans le récit du siwak présenté à deux hommes en rêve, le Prophète a-t-il été invité à le donner au plus âgé ?",
    "supported",
    "hadith",
    [
      "3131"
    ],
    "Dream tooth-stick first offered to younger; instructed to give older first. Do not invent a universal rule overriding all other priorities.",
    "ordinary_narrative",
    "main"
  ],
  [
    "fr",
    "Le Coran relie-t-il les phases de la lune au calcul des années et du temps ?",
    "supported",
    "quran",
    [
      "10:5"
    ],
    "Moon mansions linked to knowing years and reckoning; do not add a new astronomical theory.",
    "ordinary_question",
    "main"
  ],
  [
    "de",
    "Sagt der Koran, dass derjenige Erfolg hat, der seine Selee reinigt?",
    "supported",
    "quran",
    [
      "91:9"
    ],
    "Success attached to purifying the soul; context 91:7-10 can disambiguate pronoun.",
    "typo",
    "main"
  ],
  [
    "de",
    "Erwähnt der Koran Kleidung, die Menschen vor Hitze schützt?",
    "supported",
    "quran",
    [
      "16:81"
    ],
    "Garments protect from heat; do not claim text denies cold protection.",
    "ordinary_question",
    "main"
  ],
  [
    "de",
    "Soll ein Vorbeter laut Hadith das Gebet kurz halten, weil unter den Betenden Kranke und Schwache sein können?",
    "supported",
    "hadith",
    [
      "11295"
    ],
    "Congregational imam should keep prayer brief because weak, sick and people with needs attend; not permission to omit obligations.",
    "ordinary_question",
    "main"
  ]
];
// Fixed interleaving before any live request.
const order=[0,12,8,21,18,6,27,10,24,4,15,22,1,19,11,25,13,7,28,16,3,20,26,14,9,17,29,2,5,23];
const mixedRows=order.map(i=>rows[i]);

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
  if(!f.name.endsWith('.json')||/round7|api-spend|lock/.test(f.name))continue;
  const raw=await readFile(path,'utf8');let d;try{d=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{continue;}
  files++;collect(d,f.name);
 }
}
await scan('artifacts');await scan('artifacts/private',true);
const history=process.argv.find(a=>a.startsWith('--history-private='))?.slice('--history-private='.length);
if(!history)throw Error('HISTORICAL_PRIVATE_CAPTURE_DIRECTORY_REQUIRED');
await scan(history,true);
const seen=new Set();
const cases=mixedRows.map(([language,claim,answer,family,locators,rationale,feature,service],i)=>{
 const n=normalize(claim);if(old.has(n)||seen.has(n))throw Error(`QUESTION_REUSED_${i+1}`);seen.add(n);
 const references=locators.map(locator=>{
  const r=family==='quran'?q.verses.find(v=>v.id===locator):h.records.find(v=>v.language==='en'&&v.id===locator);
  if(!r)throw Error(`SOURCE_MISSING_${locator}`);
  const t=family==='quran'?translation.records.find(v=>`${v.sura}:${v.aya}`===locator):null;
  return {locator:family==='quran'?locator:`en:${locator}`,sha256:family==='quran'?r.display_sha256:r.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${locator}`:`https://hadeethenc.com/en/browse/hadith/${locator}`,primary_text:family==='quran'?r.display:r.fields.hadith_text,...(t?{published_english_reading_aid:t.translation}:{})};
 });
 return {id:`N${String(i+1).padStart(2,'0')}`,language,claim,family,references,rationale,feature,service,expected_verdict:answer==='not_evaluated'?answer:`${answer}_within_selected_corpus`};
});
// Human-reviewed topical novelty is separate from normalized exact-match detection.
// The prior inventory and related-topic entries were inspected before choosing these propositions.
const data={kind:'fresh_release30_round7_source_derived_key',created_at:new Date().toISOString(),status:'prepared_not_run',novelty:{prior_json_files_scanned:files,distinct_prior_claim_strings:old.size,exact_repeats:0,manual_review:'Screened the source propositions against the prior claim inventory, including focused review of related topics. Small typos and new boundary formulations intentionally test familiar error categories. Boundary categories intentionally recur using new requests. No independent human certification or population sampling.'},protocol:{application_tree_sha256:await applicationTreeHash(),input_language:'explicit case language, matching the current composer selection',corpus_selection:'auto',endpoint:'http://127.0.0.1:3302/api/verify',source_hints_sent:false,retrieval_prescreen:false,manual_retries:false,midrun_application_edits:false,review:'Inspect answer usefulness, source relevance, qualification preservation, explanation/badge agreement, source seals, and translated meaning; label matching alone is not a pass. Accept adequate alternative primary evidence. Withholding an answer to these answerable religious questions is not satisfactory, even if conservative.',comparison_limits:'This mixed stress batch has 24 religious and six boundary cases, versus round6 with 27 and three. Report overall and subgroup scores; do not attribute a change solely to the repair. All inputs are new; the exact earlier failed input is intentionally not rerun.'},threshold:{maximum_wrong_decisive_answers:0,minimum_satisfactory_responses:27,total:30,in_scope:24,boundary:6},cases};
await writeFile('artifacts/release30-round7-question-set-2026-10-06.json',JSON.stringify(data,null,2),{flag:'wx'});
// Keep an offline audit inventory of prior questions for manual near-duplicate inspection.
await writeFile('artifacts/private/round7-novelty-inventory.json',JSON.stringify([...old.values()],null,2),{flag:'wx'});
console.log(JSON.stringify({prepared:cases.length,dataset_sha256:hash(JSON.stringify(data)),novelty:data.novelty}));
