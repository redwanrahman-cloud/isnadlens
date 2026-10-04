import { NextResponse } from 'next/server';
import { getCoverage } from '@/lib/verification';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json(getCoverage(),{headers:{'Cache-Control':'no-store'}}); }
