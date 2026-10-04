import {NextRequest,NextResponse} from 'next/server';
import {cloudSpeechReady} from '@/lib/cloud-speech';
import {transcribeRecording,MAX_RECORDING_BYTES,TRANSCRIPTION_MODEL} from '@/lib/voice-input';
import type {ClaimInputSelection} from '@/lib/claim-language';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({available:cloudSpeechReady(),model:TRANSCRIPTION_MODEL},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:NextRequest){
 try{
  const reader=request.body?.getReader();if(!reader)throw new Error('RECORDING_INVALID');let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_RECORDING_BYTES){await reader.cancel();throw new Error('RECORDING_INVALID');}chunks.push(value);}
  const result=await transcribeRecording(Buffer.concat(chunks),request.headers.get('content-type')??'',(request.headers.get('x-claim-language')??'auto') as ClaimInputSelection);
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'';const invalid=['RECORDING_INVALID','RECORDING_FORMAT_UNSUPPORTED','NO_SPEECH_DETECTED','TRANSCRIPT_TOO_LONG'];const quota=['SPEECH_BUSY','SPEECH_FREE_QUOTA_STOP','SPEECH_PROVIDER_QUOTA_STOP'];const allowed=[...invalid,...quota,'SPEECH_NOT_CONNECTED'];return NextResponse.json({error:allowed.includes(message)?message:'TRANSCRIPTION_UNAVAILABLE'},{status:invalid.includes(message)?400:quota.includes(message)?429:503,headers:{'Cache-Control':'no-store'}});}
}
