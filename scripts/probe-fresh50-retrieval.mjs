import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
delete process.env.OPENAI_API_KEY; process.env.ISNADLENS_PAID_CALLS_AUTHORIZED='false';
globalThis.fetch=async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');};
const root='artifacts/private/fresh50-repair-runtime';await mkdir(root,{recursive:true});await writeFile(`${root}/package.json`,JSON.stringify({type:'commonjs'}));
for(const name of await readdir('src/lib'))if(name.endsWith('.ts'))await writeFile(`${root}/${name.replace(/\.ts$/,'.js')}`,transformSync(await readFile(`src/lib/${name}`,'utf8'),{filename:name,jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code);
const require=createRequire(import.meta.url),{loadCorpus}=require(`../${root}/corpus.js`),{loadHadith,retrieveHadith}=require(`../${root}/hadith.js`),{retrieveWithPublishedEnglishAid}=require(`../${root}/retrieval.js`),{requestedSourceFamily}=require(`../${root}/auto-verification.js`);
const q=loadCorpus(),h=loadHadith(),dataset=JSON.parse(await readFile('artifacts/fresh50-question-set-2026-10-04.json','utf8'));
const cases=[];
for(const item of dataset.cases){
const r=JSON.parse(await readFile(`artifacts/private/fresh50-first-pass/${item.id}.json`,'utf8'));
const intake=r.language_intake,gloss=intake.english_gloss,ar=intake.arabic_terms,en=intake.english_terms;
const family=requestedSourceFamily(item.claim,gloss),queries=ar.flatMap((v,i)=>[v,...(en[i]?[en[i]]:[])]);queries.push(...en.slice(ar.length));
const verses=family==='hadith'?[]:retrieveWithPublishedEnglishAid(q,item.claim,family==='both'?4:8,queries.slice(0,20),gloss).verses;
const records=family==='quran'?[]:[...retrieveHadith(h,gloss,'en',family==='both'?2:4,en,item.claim),...retrieveHadith(h,item.claim,'ar',family==='both'?2:4,ar,item.claim)];
const actual=verses.map(v=>'quran:'+v.id).concat(records.map(v=>'hadith:'+v.language+':'+v.id));
const witness=item.reference_witnesses.some(w=>actual.includes(w.locator));
cases.push({id:item.id,family,witness_retrieved:witness,locators:actual});
}
await writeFile('artifacts/fresh50-repair-retrieval-probes-2026-10-04.json',JSON.stringify({kind:'offline_frozen_hint_retrieval_only_not_model_accuracy',cases},null,2)+'\n');
console.log(JSON.stringify({witnesses:cases.filter(c=>c.witness_retrieved).length,total:50,misses:cases.filter(c=>!c.witness_retrieved)}));
