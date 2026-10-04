import {cloudSpeechReady,speechConfiguration,reserveFreeRequest} from './cloud-speech';
import {CLAIM_LANGUAGES,type ClaimInputSelection} from './claim-language';
export const TRANSCRIPTION_MODEL='gemini-3.5-transcribe';
export const MAX_RECORDING_BYTES=1_000_000;
const locales:Record<string,string>={ar:'ar-EG',en:'en-US',bn:'bn-BD',hi:'hi-IN',ur:'ur-PK',id:'id-ID',es:'es-ES',fr:'fr-FR',de:'de-DE'};
let active=false;
export function validateRecording(bytes:Buffer,mime:string,language:string){
 if(!bytes.length||bytes.length>MAX_RECORDING_BYTES||!['auto',...CLAIM_LANGUAGES].includes(language))throw new Error('RECORDING_INVALID');
 const type=mime.split(';')[0].trim();
 const valid=type==='audio/webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):type==='audio/mp4'?bytes.toString('ascii',4,8)==='ftyp':type==='audio/wav'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE':type==='audio/ogg'?bytes.toString('ascii',0,4)==='OggS':false;
 if(!valid)throw new Error('RECORDING_FORMAT_UNSUPPORTED');return type;
}
export function extractTranscript(data:unknown):string{
 const value=data as {status?:string;output_text?:unknown;steps?:{type?:string;content?:{type?:string;text?:unknown}[]}[]};
 if(value.status&&value.status!=='completed')throw new Error('TRANSCRIPTION_UNAVAILABLE');
 const text=typeof value.output_text==='string'?value.output_text:value.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content??[]).filter(p=>p.type==='text').map(p=>typeof p.text==='string'?p.text:'').join('')??'';
 if(!text.trim())throw new Error('NO_SPEECH_DETECTED');if(text.length>1200)throw new Error('TRANSCRIPT_TOO_LONG');return text;
}
export async function transcribeRecording(bytes:Buffer,mime:string,language:ClaimInputSelection='auto'){
 const type=validateRecording(bytes,mime,language);
 if(!cloudSpeechReady())throw new Error('SPEECH_NOT_CONNECTED');if(active)throw new Error('SPEECH_BUSY');active=true;
 try{
  reserveFreeRequest();
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',signal:AbortSignal.timeout(45000),headers:{'x-goog-api-key':speechConfiguration().key,'Content-Type':'application/json'},body:JSON.stringify({model:TRANSCRIPTION_MODEL,store:false,input:[{type:'audio',data:bytes.toString('base64'),mime_type:type}],generation_config:{transcription_config:{language_codes:language==='auto'?[]:[locales[language]],mode:{type:'verbatim'}}}})});
  if(!response.ok)throw new Error(response.status===429?'SPEECH_PROVIDER_QUOTA_STOP':'TRANSCRIPTION_UNAVAILABLE');
  const reader=response.body?.getReader();if(!reader)throw new Error('TRANSCRIPTION_UNAVAILABLE');let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100_000){await reader.cancel();throw new Error('TRANSCRIPTION_UNAVAILABLE');}chunks.push(value);}
  return {transcript:extractTranscript(JSON.parse(Buffer.concat(chunks).toString('utf8'))),model:TRANSCRIPTION_MODEL};
 }finally{active=false;}
}
