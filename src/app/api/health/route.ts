import {constants, accessSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {getCoverage} from '@/lib/verification';
import {loadQuranTranslation} from '@/lib/quran-translations';
import {privateDirectory} from '@/lib/private-directory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// No provider calls. Dataset loaders cache their validated editions and invalidate
// on file changes; readiness must also notice a missing persistent ledger.
export async function GET() {
  try {
    const coverage = getCoverage();
    if (!coverage.approved || !coverage.hadith.approved) throw new Error('SOURCES');
    for (const language of ['en','hi','ur','id','es','fr','de']) {
      if (!loadQuranTranslation(language)) throw new Error('TRANSLATIONS');
    }
    if (process.env.ISNADLENS_REQUIRE_EXISTING_LEDGER === 'true') {
      const directory = privateDirectory();
      accessSync(directory, constants.W_OK);
      const ledger = JSON.parse(readFileSync(join(directory, 'api-spend.json'), 'utf8'));
      const quota = JSON.parse(readFileSync(join(directory, 'speech', 'quota.json'), 'utf8'));
      if (ledger.version !== 1 || !Array.isArray(ledger.entries) || typeof quota.day !== 'string' || !Number.isInteger(quota.requests) || quota.requests < 0 || !Array.isArray(quota.recent)) throw new Error('ACCOUNTING');
    }
    return Response.json({status:'ready', sources:'admitted', inference:process.env.ISNADLENS_PAID_CALLS_AUTHORIZED === 'true' ? 'enabled' : 'disabled'}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({status:'not_ready'}, {status:503, headers:{'Cache-Control':'no-store'}});
  }
}
