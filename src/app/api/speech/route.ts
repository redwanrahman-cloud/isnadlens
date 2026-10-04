import {NextRequest,NextResponse} from 'next/server';
import {cloudSpeechReady,synthesizeSpeech,SPEECH_MODEL,SPEECH_VOICES,SPEECH_LANGUAGES} from '@/lib/cloud-speech';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({available:cloudSpeechReady(),provider:'Google Gemini',model:SPEECH_MODEL,voices:SPEECH_VOICES,languages:SPEECH_LANGUAGES,reason:cloudSpeechReady()?null:'SPEECH_NOT_CONNECTED'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:NextRequest){
  try{
    const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'SPEECH_INPUT_INVALID'},{status:400});let size=0;const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return NextResponse.json({error:'SPEECH_INPUT_INVALID'},{status:400});}chunks.push(value);}
    const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));const result=await synthesizeSpeech(input);
    return new NextResponse(new Uint8Array(result.audio),{headers:{'Content-Type':'audio/wav','Cache-Control':'private, max-age=86400','X-Speech-Provider':'Google Gemini','X-Speech-Cache':result.cacheHit?'hit':'miss','X-Speech-Text-SHA256':result.textHash}});
  }catch(error){const code=error instanceof Error?error.message:'SPEECH_PROVIDER_UNAVAILABLE';const valid=['SPEECH_INPUT_INVALID','SPEECH_PRIVATE_TEXT_REFUSED'];const limited=['SPEECH_BUSY','SPEECH_FREE_QUOTA_STOP','SPEECH_PROVIDER_QUOTA_STOP'];return NextResponse.json({error:[...valid,...limited,'SPEECH_NOT_CONNECTED','SPEECH_QUOTA_INVALID','SPEECH_PROVIDER_UNAVAILABLE','SPEECH_AUDIO_INVALID'].includes(code)?code:'SPEECH_PROVIDER_UNAVAILABLE'},{status:valid.includes(code)?400:limited.includes(code)?429:503,headers:{'Cache-Control':'no-store'}});}
}
