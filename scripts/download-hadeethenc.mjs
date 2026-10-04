import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir = new URL('../data/raw/hadeethenc/',import.meta.url);
await mkdir(dir,{recursive:true});
const home = await fetch('https://hadeethenc.com/en/home');
if (!home.ok) throw new Error(`Terms HTTP ${home.status}`);
await writeFile(new URL('terms-home-nine-languages.html',dir),await home.text());
const admittedLanguages=['ar','en','bn','hi','ur','id','es','fr','de'];
const requested=process.argv.find(arg=>arg.startsWith('--languages='))?.slice('--languages='.length).split(',')??admittedLanguages;
if(requested.some(language=>!admittedLanguages.includes(language)))throw new Error('Unsupported acquisition language');
const acquisitionURL=new URL('../hadeethenc-acquisition.json',dir);
let prior={publisher:'HadeethEnc.com',terms_url:'https://hadeethenc.com/en/home',files:[]};
try{prior=JSON.parse(await readFile(acquisitionURL,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const acquired = await Promise.all(requested.map(async language=>{
 const existing=prior.files.find(file=>file.language===language);
 if(existing){
  const bytes=await readFile(new URL(existing.filename,dir));
  if(createHash('sha256').update(bytes).digest('hex')!==existing.sha256)throw new Error(`${language}: existing acquisition hash mismatch`);
  return existing; // Never silently replace an already admitted source edition.
 }
 const url=`https://hadeethenc.com/browse/download/${language}`;
 const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw new Error(`${language}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 const disposition=response.headers.get('content-disposition');
 const xlsx=bytes[0]===0x50&&bytes[1]===0x4b;
 const xls=bytes[0]===0xd0&&bytes[1]===0xcf;
 if(!xlsx&&!xls)throw new Error(`${language}: unexpected workbook signature`);
 const filename=`hadeethenc-${language}.${xlsx?'xlsx':'xls'}`;
 await writeFile(new URL(filename,dir),bytes);
 return {language,url,final_url:response.url,filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),content_type:response.headers.get('content-type'),content_disposition:disposition,retrieved_at:new Date().toISOString()};
}));
const files=[...prior.files.filter(file=>!requested.includes(file.language)),...acquired];
await writeFile(acquisitionURL,JSON.stringify({...prior,files},null,2)+'\n');
console.log(JSON.stringify(acquired.map(({language,filename,bytes,sha256,final_url})=>({language,filename,bytes,sha256,final_url})),null,2));
