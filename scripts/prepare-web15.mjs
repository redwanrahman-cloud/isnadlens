import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {applicationTreeHash,hash} from './holdout-protocol.mjs';
const require=createRequire(import.meta.url),q=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),h=require('../artifacts/private/offline-lab-runtime/hadith.js').loadHadith();
const rows=[
 ['W01','en','Does Islam praise spending moderately, neither extravagantly nor miserly?','25:67',true],
 ['W02','en','Does the Quran recommend donating bad goods that the donor would not willingly accept?','2:267',false],
 ['W03','ar','هل يأمر القرآن بإيتاء حق الزرع يوم حصاده؟','6:141',true],
 ['W04','es','¿Dice el Corán que quienes saben y quienes no saben son iguales?','39:9',false],
 ['W05','fr','Le Coran dit-il que les enfants d’Adam ont été honorés?','17:70',true],
 ['W06','de','Soll man laut Koran eine Tat für morgen versprechen, ohne „wenn Allah will“ zu sagen?','18:23',false],
 ['W07','bn','কোরআন কি বলে যে প্রত্যেক প্রাণ মৃত্যুর স্বাদ গ্রহণ করবে?','3:185',true],
 ['W08','en','Does the Quran say that race determines who is most noble before Allah?','49:13',false],
 ['W09','en','Does the Quran tell people to direct their family to prayer and remain steadfast in it?','20:132',true],
 ['W10','ar','هل يقول القرآن إن من يعمل مثقال ذرة خيرا يره؟','99:7',true],
 ['W11','en','Does the Quran describe giving charity openly as good, even though giving secretly to the poor is better?','2:271',true],
 ['W12','en','Does the Quran instruct spending everything until one is left destitute?','17:29',false],
 ['W13','en','Does the Quran say that wealth should circulate only among the rich?','59:7',false],
 ['W14','ar','هل يأمر القرآن بالعدل والإحسان؟','16:90',true],
 ['W15','en','Does Hadith say Allah looks at hearts and deeds rather than appearance and wealth?','en:4555',true],
];
const prior=(await Promise.all(['common-question-baseline-50','holdout-question-set-50','fresh50-question-set'].map(async f=>JSON.parse(await readFile(`artifacts/${f}-2026-10-04.json`,'utf8'))))).flatMap(d=>d.cases);
const cases=rows.map(([id,language,claim,locator,yes])=>{
 if(prior.some(c=>c.claim===claim))throw new Error('DUPLICATE_QUESTION');
 const hadith=locator.startsWith('en:'),entry=hadith?h.records.find(r=>r.language==='en'&&r.id===locator.slice(3)):q.verses.find(v=>v.id===locator);
 if(!entry)throw new Error('SOURCE_MISSING');
 const quotation=hadith?entry.fields.hadith_text:entry.display;
 return {id,language,claim,expected_verdict:yes?'supported_within_selected_corpus':'conflicting_within_selected_corpus',reference:{kind:hadith?'hadith':'quran',locator,quotation,sha256:hash(quotation),source_url:hadith?entry.fields.link:`https://tanzil.net/#${locator}`,context:!hadith&&locator==='18:23'?q.verses.find(v=>v.id==='18:24').display:null},review:'Principal agent inspected original admitted passage before live run; not independent scholar review.'};
});
const data={kind:'fresh15_trusted_search_setup_evaluation',created_at:new Date().toISOString(),counts:{total:15,supported:9,contradicted:6,quran:14,hadith:1},novelty:'New propositions/facets compared with prior150; W11 adds explicit public-charity permissibility to previously tested private-charity preference. Not a measured most-searched ranking.',execution:'Only original claim, automatic language and automatic source selection go to app. References and expected answers are reviewer-only. No retuning during first pass.',cases};
await writeFile('artifacts/web15-question-set-2026-10-04.json',JSON.stringify(data,null,2)+'\n',{flag:'wx'});
await writeFile('artifacts/web15-freeze-2026-10-04.json',JSON.stringify({dataset_sha256:hash(JSON.stringify(data)),application_tree_sha256:await applicationTreeHash(),build:(await readFile('.next/BUILD_ID','utf8')).trim(),frozen_at:new Date().toISOString(),acceptance:'Report decisive correct/incorrect, abstentions, unavailable calls, actual web usage and reviewed grounding separately. No perfect-coverage claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:cases.length,source_review:cases.map(c=>({id:c.id,claim:c.claim,quotation:c.reference.quotation,context:c.reference.context}))}));
