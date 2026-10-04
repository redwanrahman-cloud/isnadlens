import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {transformSync} from 'next/dist/build/swc/index.js';
delete process.env.OPENAI_API_KEY;process.env.ISNADLENS_PAID_CALLS_AUTHORIZED='false';
globalThis.fetch=async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');};
const root='artifacts/private/gap-runtime';await mkdir(root,{recursive:true});await writeFile(`${root}/package.json`,JSON.stringify({type:'commonjs'}));
for(const name of await readdir('src/lib'))if(name.endsWith('.ts'))await writeFile(`${root}/${name.replace(/\.ts$/,'.js')}`,transformSync(await readFile(`src/lib/${name}`,'utf8'),{filename:name,jsc:{target:'es2022',parser:{syntax:'typescript'}},module:{type:'commonjs'}}).code);
const require=createRequire(import.meta.url);
const {loadCorpus}=require(`../${root}/corpus.js`),{loadHadith,retrieveHadith}=require(`../${root}/hadith.js`),{retrieveWithPublishedEnglishAid,englishWords}=require(`../${root}/retrieval.js`),{loadQuranTranslation}=require(`../${root}/quran-translations.js`);
const q=loadCorpus(),h=loadHadith();
for(const id of ['T34','T46']){
 const r=JSON.parse(await readFile(`artifacts/private/scope-repair/${id}.json`,'utf8'));
 const hints=[...r.language_intake.arabic_terms,...r.language_intake.english_terms];
 if(id==='T34'){
  const ranked=retrieveWithPublishedEnglishAid(q,r.original_claim,6236,hints,r.language_intake.english_gloss).verses;
  console.log(JSON.stringify({id,expected_rank:ranked.findIndex(v=>v.id==='65:6')+1,top:ranked.slice(0,8).map(v=>({id:v.id,matches:[...new Set(englishWords(r.language_intake.english_gloss))].filter(w=>englishWords(loadQuranTranslation('en').records.find(t=>t.sura===v.surah&&t.aya===v.ayah).translation).includes(w))})),translation:loadQuranTranslation('en').records.find(v=>v.sura===65&&v.aya===6)?.translation}));
 }else{
  const ranked=retrieveHadith(h,r.language_intake.english_gloss,'en',200,hints,r.original_claim);
  console.log(JSON.stringify({id,expected_rank:ranked.findIndex(v=>v.id==='5808')+1,top:ranked.slice(0,8).map(v=>({id:v.id,title:v.fields.title})),target:h.records.find(v=>v.id==='5808'&&v.language==='en')?.fields.hadith_text}));
 }
}
