import {NextRequest,NextResponse} from 'next/server';
import {cloudSpeechReady} from '../../../lib/cloud-speech';
import {readClaimImage,MAX_IMAGE_BYTES,IMAGE_READER_MODEL} from '../../../lib/image-input';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
let active=0;
export async function GET(){return NextResponse.json({available:cloudSpeechReady(),model:IMAGE_READER_MODEL,maxBytes:MAX_IMAGE_BYTES},{headers});}
export async function POST(request:NextRequest){
 if(active>=2)return NextResponse.json({error:'IMAGE_BUSY'},{status:429,headers});active++;
 try{
  if(!['image/png','image/jpeg','image/webp'].includes((request.headers.get('content-type')??'').split(';')[0].trim()))throw new Error('IMAGE_FORMAT_UNSUPPORTED');
  const length=Number(request.headers.get('content-length')??0);if(length>MAX_IMAGE_BYTES)throw new Error('IMAGE_INVALID');
  const reader=request.body?.getReader();if(!reader)throw new Error('IMAGE_INVALID');let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_IMAGE_BYTES){await reader.cancel();throw new Error('IMAGE_INVALID');}chunks.push(value);}
  return NextResponse.json(await readClaimImage(Buffer.concat(chunks),request.headers.get('content-type')??''),{headers});
 }catch(error){
  const message=error instanceof Error?error.message:'';const invalid=['IMAGE_INVALID','IMAGE_FORMAT_UNSUPPORTED'];const quota=['IMAGE_BUSY','IMAGE_PROVIDER_QUOTA_STOP','SPEECH_BUSY','SPEECH_FREE_QUOTA_STOP'];const allowed=[...invalid,...quota,'IMAGE_NOT_CONNECTED'];
  return NextResponse.json({error:allowed.includes(message)?message:'IMAGE_READING_UNAVAILABLE'},{status:invalid.includes(message)?400:quota.includes(message)?429:503,headers});
 }finally{active--;}
}
