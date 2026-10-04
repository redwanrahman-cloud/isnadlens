import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),c=require('../artifacts/private/offline-lab-runtime/corpus.js').loadCorpus(),rt=require('../artifacts/private/offline-lab-runtime/retrieval.js');
const rows=[];
const baseline=JSON.parse(await readFile('artifacts/offline-sai-release30-2026-10-04.json','utf8'));
for(const id of ['B41','B42','H14','H20']){
 const dataset=JSON.parse(await readFile(`artifacts/${id.startsWith('B')?'common-question-baseline-50':'holdout-question-set-50'}-2026-10-04.json`,'utf8'));
 const item=dataset.cases.find(c=>c.id===id),saved=JSON.parse(await readFile(id.startsWith('B')?`artifacts/private/baseline50-${id}.json`:`artifacts/private/holdout50-first-pass/${id}.json`,'utf8'));
 const ar=saved.language_intake?.arabic_terms??saved.retrieval_plan?.arabic_terms??[],en=saved.language_intake?.english_terms??saved.retrieval_plan?.english_terms??[];
 const hints=ar.flatMap((v,i)=>[v,...(en[i]?[en[i]]:[])]).concat(en.slice(ar.length)).slice(0,20),gloss=saved.language_intake?.english_gloss||item.claim;
 for(const claim of [item.claim,`${item.input_language==='ar'?'من فضلك تحقق:':'Please check: '} ${item.claim}`]){
  const hits=rt.retrieveWithPublishedEnglishAid(c,claim,8,hints,gloss).verses;
  const supplied=new Set(hits.flatMap(v=>[-2,-1,0,1,2].map(offset=>`quran:${v.surah}:${v.ayah+offset}`)));
  const previous=baseline.retrieval_probes.find(p=>p.id===id&&p.claim===claim);
  const present=item.reference_evidence_locators.every(l=>supplied.has(l));
  rows.push({id,claim,retrieved:hits.map(v=>v.id),reference_present:present,baseline_reference_present:previous?.all_references_found,no_regression:!previous?.all_references_found||present});
 }
}
await writeFile('artifacts/context-ranking-regression-check-2026-10-04.json',JSON.stringify({kind:'known_reference_retrieval_only_not_live_answers',cases:rows},null,2));console.log(JSON.stringify(rows));
if(rows.some(r=>!r.no_regression))process.exitCode=1;
