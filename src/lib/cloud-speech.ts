import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync,openSync,closeSync,unlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {privateDirectory} from './private-directory';

export const SPEECH_MODEL='gemini-3.8-flash-tts';
export const SPEECH_VOICES=['Achernar','Algieba','Sulafat'] as const;
export const SPEECH_LANGUAGES=['ar','en','bn','hi','ur','id','es','fr','de'] as const;
let active=0;
const directory=()=>join(privateDirectory(),'speech');
export function speechConfiguration(){
  const path=join(privateDirectory(),'google-speech.env');
  const file=existsSync(path)?readFileSync(path,'utf8'):'';
  const settings=Object.fromEntries(file.split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1).trim()];}));
  return {key:process.env.GEMINI_API_KEY||settings.GEMINI_API_KEY||'',confirmed:(process.env.ISNADLENS_GOOGLE_FREE_TIER_CONFIRMED||settings.ISNADLENS_GOOGLE_FREE_TIER_CONFIRMED)==='true'};
}
export function cloudSpeechReady(){const config=speechConfiguration();return Boolean(config.key)&&config.confirmed;}
export function validateSpeechInput(input:unknown):{text:string;language:string;voice:string}{
  const value=input as {text?:unknown;language?:unknown;voice?:unknown};
  if(!value||typeof value.text!=='string'||value.text.trim().length<1||value.text.length>2400||typeof value.language!=='string'||!SPEECH_LANGUAGES.includes(value.language as typeof SPEECH_LANGUAGES[number])||typeof value.voice!=='string'||!SPEECH_VOICES.includes(value.voice as typeof SPEECH_VOICES[number]))throw new Error('SPEECH_INPUT_INVALID');
  // No private user information belongs in this free-tier read-aloud service.
  if(/[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s-]{8,}|\b(api.?key|password|passport|credit card|bank account|patient|diagnosis)\b|كلمة المرور|رقم الهوية|جواز السفر/i.test(value.text))throw new Error('SPEECH_PRIVATE_TEXT_REFUSED');
  return {text:value.text,language:value.language,voice:value.voice};
}
export function reserveFreeRequest(){
  mkdirSync(directory(),{recursive:true});
  const lock=join(directory(),'quota.lock');let handle:number;
  try{handle=openSync(lock,'wx');}catch{throw new Error('SPEECH_BUSY');}
  const path=join(directory(),'quota.json');const temporary=join(directory(),`quota-${randomUUID()}.tmp`);
  try{
    if(process.env.ISNADLENS_REQUIRE_EXISTING_LEDGER==='true'&&!existsSync(path))throw new Error('SPEECH_QUOTA_INVALID');
    const now=Date.now();const day=new Date().toISOString().slice(0,10);
    const previous=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{day,requests:0,recent:[]};
    if(typeof previous.day!=='string'||!Number.isInteger(previous.requests)||previous.requests<0||!Array.isArray(previous.recent)||previous.recent.some((n:unknown)=>typeof n!=='number'||!Number.isFinite(n)))throw new Error('SPEECH_QUOTA_INVALID');
    const requests=previous.day===day?previous.requests:0;const recent=previous.recent.filter((n:number)=>now-n<60000);
    // This app cap is deliberately small. Provider/project quota may be lower.
    if(requests>=60||recent.length>=2)throw new Error('SPEECH_FREE_QUOTA_STOP');
    writeFileSync(temporary,JSON.stringify({day,requests:requests+1,recent:[...recent,now]}),{flag:'wx'});renameSync(temporary,path);
  }finally{if(existsSync(temporary))unlinkSync(temporary);closeSync(handle);unlinkSync(lock);}
}
export function validateWav(bytes:Buffer){
  if(bytes.length<44||bytes.length>12_000_000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw new Error('SPEECH_AUDIO_INVALID');
  if(bytes.readUInt32LE(4)!==bytes.length-8)throw new Error('SPEECH_AUDIO_INVALID');
  let position=12;let format=false;let data=false;
  while(position+8<=bytes.length){const name=bytes.toString('ascii',position,position+4);const length=bytes.readUInt32LE(position+4);const start=position+8;if(start+length>bytes.length)throw new Error('SPEECH_AUDIO_INVALID');
    if(name==='fmt '){if(length<16||bytes.readUInt16LE(start)!==1||bytes.readUInt16LE(start+2)!==1||bytes.readUInt32LE(start+4)!==24000||bytes.readUInt16LE(start+14)!==16)throw new Error('SPEECH_AUDIO_INVALID');format=true;}
    if(name==='data'){if(!length||length%2)throw new Error('SPEECH_AUDIO_INVALID');data=true;}
    position=start+length+(length%2);
  }
  if(!format||!data||position!==bytes.length)throw new Error('SPEECH_AUDIO_INVALID');
  return bytes;
}
export async function synthesizeSpeech(raw:unknown):Promise<{audio:Buffer;cacheHit:boolean;textHash:string}>{
  const {text,language,voice}=validateSpeechInput(raw);
  if(!cloudSpeechReady())throw new Error('SPEECH_NOT_CONNECTED');
  const hash=createHash('sha256').update(JSON.stringify({model:SPEECH_MODEL,text,language,voice})).digest('hex');
  const path=join(directory(),`${hash}.wav`);
  if(existsSync(path)){const audio=validateWav(readFileSync(path));return {audio,cacheHit:true,textHash:createHash('sha256').update(text).digest('hex')};}
  if(active>=1)throw new Error('SPEECH_BUSY');
  active++;
  try{
    reserveFreeRequest();
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',signal:AbortSignal.timeout(45000),headers:{'x-goog-api-key':speechConfiguration().key,'Content-Type':'application/json'},body:JSON.stringify({model:SPEECH_MODEL,store:false,input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:'Read the verbatim transcript clearly in a calm, warm, natural speaking voice. Preserve every word. No introduction, commentary, music, extra words, or Quran recitation performance.'}]}]}],response_format:{type:'audio',mime_type:'audio/wav'},generation_config:{speech_config:[{voice}]}})});
    if(!response.ok)throw new Error(response.status===429?'SPEECH_PROVIDER_QUOTA_STOP':'SPEECH_PROVIDER_UNAVAILABLE');
    const contentLength=Number(response.headers.get('content-length')??0);if(contentLength>18_000_000)throw new Error('SPEECH_AUDIO_INVALID');
    const reader=response.body?.getReader();if(!reader)throw new Error('SPEECH_AUDIO_INVALID');let size=0;const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>18_000_000){await reader.cancel();throw new Error('SPEECH_AUDIO_INVALID');}chunks.push(value);}
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {steps?:{type?:string;content?:{type?:string;mime_type?:string;data?:string}[]}[]};
    const blocks=data.steps?.filter(step=>step.type==='model_output').flatMap(step=>step.content??[]).filter(part=>part.type==='audio')??[];
    if(blocks.length!==1||blocks[0].mime_type!=='audio/wav'||typeof blocks[0].data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(blocks[0].data))throw new Error('SPEECH_AUDIO_INVALID');
    const audio=validateWav(Buffer.from(blocks[0].data,'base64'));
    mkdirSync(directory(),{recursive:true});const temporary=join(directory(),`${hash}-${randomUUID()}.tmp`);writeFileSync(temporary,audio,{flag:'wx'});renameSync(temporary,path);
    return {audio,cacheHit:false,textHash:createHash('sha256').update(text).digest('hex')};
  }finally{active--;}
}
