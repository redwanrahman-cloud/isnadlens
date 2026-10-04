import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const rows=[
 ['en','Does the Quran ask us to give someone struggling with a debt more time to repay?','supported','quran','2:280','Debtor hardship is the condition for respite until ease. No individual debt judgment or compulsory forgiveness asserted.'],
 ['ar','هل يذكر القرآن أن الله يعلم ما تسقط من ورقة؟','supported','quran','6:59','Not a leaf falls without His knowledge. No claims about separate doctrinal controversies.'],
 ['de','Sagt der Koran, dass wir andere Menschen verspotten dürfen, weil wir besser sind?','conflicting','quran','49:11','Prohibits ridicule; those mocked may be better. Believing audience and both group comparisons retained; no contemporary group judgment.'],
 ['fr','Le hadith dit-il qu’Allah aime la douceur plutôt que la violence?','supported','hadith','5797','Allah loves gentleness and gives for it what He does not give for violence. No universal prohibition of every use of force inferred.'],
 ['id','Apakah hadis menyebut menjenguk orang sakit sebagai salah satu hak sesama Muslim?','supported','hadith','3706','Visiting the sick appears among a Muslim’s rights over another Muslim; no individual medical instruction.'],
];
const names=['common-question-baseline-50-2026-10-04','holdout-question-set-50-2026-10-04','fresh50-question-set-2026-10-04','web50-question-set-2026-10-04','release30-question-set-2026-10-04','release30-round2-question-set-2026-10-05','release30-round3-question-set-2026-10-05'];
const previous=(await Promise.all(names.map(async n=>JSON.parse(await readFile(`artifacts/${n}.json`,'utf8')).cases))).flat();
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const cases=rows.map(([language,claim,answer,family,id,rationale],i)=>{
 if(previous.some(c=>normalize(c.claim)===normalize(claim)))throw Error('DUPLICATE');
 const source=family==='quran'?q.verses.find(v=>v.id===id):h.records.find(r=>r.id===id&&r.language==='en');if(!source)throw Error('SOURCE_MISSING');
 return {id:`P${i+1}`,language,claim,family,rationale,expected_verdict:`${answer}_within_selected_corpus`,references:[{locator:family==='quran'?id:`en:${id}`,sha256:family==='quran'?source.display_sha256:source.quotation_sha256,url:family==='quran'?`https://tanzil.net/#${id}`:`https://hadeethenc.com/en/browse/hadith/${id}`}]};
});
const data={kind:'five_new_questions_key_locked_before_requests',created_at:new Date().toISOString(),novelty:'No exact normalized duplicates among the previous 290 benchmark questions; themes/sources may recur. No retrieval pre-screening or popularity-ranking claim.',protocol:'Five questions only. Automatic source/language selection. No answer key or expected locators in requests. No production edits or manual answer-failure retries during the run. Stop at the 0.75 SAR pilot budget guard.',threshold:{total:5,minimum_satisfactory_responses:5,maximum_wrong_decisive_answers:0},maximum_spend_sar:.75,cases};
await writeFile('artifacts/pilot5-question-set-2026-10-05.json',JSON.stringify(data,null,2),{flag:'wx'});console.log(JSON.stringify({prepared:5,previous_questions:previous.length,languages:cases.map(c=>c.language)}));
