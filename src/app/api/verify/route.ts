import { NextRequest, NextResponse } from 'next/server';
import { verifyMultilingualClaim } from '@/lib/multilingual-intake';
import { isClaimInputSelection } from '@/lib/claim-language';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const windows = new Map<string, {start:number; count:number}>();
let active = 0;
const LIMIT_BYTES = 8192;

async function readBoundedBody(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('EMPTY_BODY');
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > LIMIT_BYTES) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function POST(request: NextRequest) {
  // Local single-process guard. A durable, trusted-edge limiter is a deployment gate.
  const key = request.headers.get('x-real-ip') ?? 'local';
  const now = Date.now();
  for (const [id,w] of windows) if (now-w.start>60000) windows.delete(id);
  const bucket = windows.get(key) ?? {start:now,count:0};
  if (bucket.count >= 6 || active >= 2) return NextResponse.json({error:'RATE_LIMITED'}, {status:429,headers:{'Retry-After':'60'}});
  bucket.count++; windows.set(key,bucket);
  let body;
  try { body = await readBoundedBody(request); }
  catch { return NextResponse.json({error:'INVALID_INPUT'}, {status:400}); }
  if (!body || typeof body.claim!=='string' || !isClaimInputSelection(body.inputLanguage)) {
    return NextResponse.json({error:'INVALID_INPUT'}, {status:400});
  }
  if (body.corpusSelection !== undefined && !['auto', 'quran', 'hadith'].includes(body.corpusSelection)) {
    return NextResponse.json({error:'INVALID_INPUT'}, {status:400});
  }
  active++;
  try {
    const record = await verifyMultilingualClaim({claim:body.claim,inputLanguage:body.inputLanguage,corpusSelection:body.corpusSelection ?? 'auto'});
    return NextResponse.json(record,{headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'VERIFICATION_UNAVAILABLE'},{status:503});
  } finally { active--; }
}
