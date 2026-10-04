import { NextRequest, NextResponse } from 'next/server';
import { getPassageTranslation, getQuranPassageTranslation } from '@/lib/passage-translations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const recordId = params.get('recordId') ?? '';
  const sourceLanguage = params.get('sourceLanguage') ?? '';
  const targetLanguage = params.get('targetLanguage') ?? '';
  const corpus = params.get('corpus') ?? 'hadith';
  const locator = params.get('locator') ?? '';
  const expectedOriginalHash = params.get('expectedOriginalHash') ?? undefined;
  if (!['hadith', 'quran'].includes(corpus) || (corpus === 'quran' && sourceLanguage && sourceLanguage !== 'ar') || recordId.length > 12 || locator.length > 7 || sourceLanguage.length > 2 || targetLanguage.length > 2 || (expectedOriginalHash && !/^[a-f0-9]{64}$/.test(expectedOriginalHash))) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  try {
    const result = corpus === 'quran' ? getQuranPassageTranslation({ locator, targetLanguage, expectedOriginalHash }) : getPassageTranslation({ recordId, sourceLanguage, targetLanguage, expectedOriginalHash });
    return NextResponse.json(result, { status: result.status === 'invalid_input' ? 400 : result.status === 'unsupported_language' ? 422 : result.status === 'not_available' ? 404 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'PASSAGE_EDITION_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
