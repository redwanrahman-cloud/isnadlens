import { NextRequest, NextResponse } from 'next/server';
import { translateResultExplanation, resultTranslationLanguageSchema } from '@/lib/result-translation';
import { recordSchema } from '@/lib/contracts';
import { verifySeal } from '@/lib/verification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const windows = new Map<string, {start:number;count:number}>();
const cache = new Map<string, {created:number;value:Awaited<ReturnType<typeof translateResultExplanation>>}>();
const pending = new Map<string, Promise<Awaited<ReturnType<typeof translateResultExplanation>>>>();
const headers = {'Cache-Control':'no-store'};

export async function POST(request:NextRequest) {
  const now=Date.now();
  const client=request.headers.get('x-real-ip')??'local';
  for (const [key,value] of windows) if(now-value.start>60000) windows.delete(key);
  const bucket=windows.get(client)??{start:now,count:0};
  if(bucket.count>=6) return NextResponse.json({error:'RATE_LIMITED'},{status:429,headers:{...headers,'Retry-After':'60'}});
  bucket.count++;windows.set(client,bucket);
  let body;
  try {
    const reader=request.body?.getReader(); if(!reader) throw new Error('EMPTY_BODY');
    const chunks:Uint8Array[]=[];let bytes=0;
    while(true) {
      const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;
      if(bytes>512000){await reader.cancel();throw new Error('BODY_TOO_LARGE');}
      chunks.push(value);
    }
    body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {return NextResponse.json({error:'INVALID_INPUT'},{status:400,headers});}
  if(!body||!resultTranslationLanguageSchema.safeParse(body.language).success) return NextResponse.json({error:'INVALID_LANGUAGE'},{status:400,headers});
  const parsed=recordSchema.safeParse(body.record);
  if(!parsed.success||!verifySeal(parsed.data)) return NextResponse.json({error:'INVALID_RECORD'},{status:400,headers});
  const key=`${parsed.data.audit_hash}:${body.language}`;
  for(const [id,item] of cache) if(now-item.created>1800000)cache.delete(id);
  const cached=cache.get(key);if(cached)return NextResponse.json(cached.value,{headers});
  if(pending.size>=2&&!pending.has(key))return NextResponse.json({error:'TRANSLATION_BUSY'},{status:429,headers});
  try {
    let job=pending.get(key);
    if(!job) {
      job=translateResultExplanation(parsed.data,body.language);
      pending.set(key,job);
    }
    const value=await job;
    if(cache.size>=100)cache.delete(cache.keys().next().value!);
    cache.set(key,{created:Date.now(),value});
    return NextResponse.json(value,{headers});
  } catch(error) {
    const code=error instanceof Error&&/^(?:TRANSLATION_[A-Z_]+|PROVIDER_[A-Z_]+|SPEND_[A-Z_]+|BUDGET_[A-Z_]+)$/.test(error.message)?error.message:'TRANSLATION_UNAVAILABLE';
    return NextResponse.json({error:code},{status:503,headers});
  }
  finally {pending.delete(key);}
}
