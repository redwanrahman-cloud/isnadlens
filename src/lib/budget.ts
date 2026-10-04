import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { MODEL_IDS } from './model-config';

const entrySchema = z.object({ id: z.string(), model: z.enum(MODEL_IDS), reserved_usd: z.number().nonnegative(), actual_usd: z.number().nonnegative().nullable(), status: z.enum(['reserved', 'settled']), created_at: z.string(), input_tokens: z.number().int().nonnegative().nullable(), output_tokens: z.number().int().nonnegative().nullable() });
const ledgerSchema = z.object({ version: z.literal(1), entries: z.array(entrySchema) });
type Ledger = z.infer<typeof ledgerSchema>;
const rates = { 'gpt-5.4-mini': { input: .75, output: 4.5 }, 'gpt-5.4': { input: 2.5, output: 15 }, 'gpt-5.6-luna': { input: .20, output: 1.20 }, 'gpt-5.6-terra': { input: 2, output: 12 } } as const;
export function authorizedBudget(): number {
  const cap = Number(process.env.ISNADLENS_MAX_SPEND_USD ?? '0');
  return process.env.ISNADLENS_PAID_CALLS_AUTHORIZED === 'true' && Number.isFinite(cap) && cap > 0 ? cap : 0;
}
export function priceUsage(model: keyof typeof rates, input: number, output: number): number {
  // Conservatively cover possible 5.6 cache-write billing on every input token.
  // Ledger estimates can exceed invoices; cache discounts never expand the authorization cap.
  return (input * rates[model].input * (model.startsWith('gpt-5.6-') ? 1.25 : 1) + output * rates[model].output) / 1_000_000;
}
const defaultDirectory = () => join(process.cwd(), 'artifacts', 'private');
function updateLedger<T>(directory: string, mutate: (ledger: Ledger) => T): T {
  mkdirSync(directory, { recursive: true });
  const lockPath = join(directory, 'api-spend.lock');
  let descriptor: number;
  // An abandoned lock fails closed and requires an explicit operator check. Never steal another process's lock.
  try { descriptor = openSync(lockPath, 'wx'); } catch { throw new Error('BUDGET_LEDGER_LOCKED'); }
  const ledgerPath = join(directory, 'api-spend.json');
  const tempPath = join(directory, `api-spend-${randomUUID()}.tmp`);
  try {
    const ledger = existsSync(ledgerPath) ? ledgerSchema.parse(JSON.parse(readFileSync(ledgerPath, 'utf8'))) : { version: 1 as const, entries: [] };
    const result = mutate(ledger);
    writeFileSync(tempPath, JSON.stringify(ledger, null, 2), { flag: 'wx' });
    renameSync(tempPath, ledgerPath);
    return result;
  } catch (error) {
    if (existsSync(tempPath)) unlinkSync(tempPath);
    if (error instanceof Error && ['SPEND_BUDGET_STOP', 'BUDGET_USAGE_INVALID', 'BUDGET_RESERVATION_NOT_FOUND'].includes(error.message)) throw error;
    throw new Error('BUDGET_LEDGER_INVALID');
  } finally { closeSync(descriptor); unlinkSync(lockPath); }
}
export function reserveSpend(model: keyof typeof rates, serializedRequest: string, outputLimit: number, directory = defaultDirectory(), tools?: { maximumCalls: number; inputTokenBound: number }): string {
  const cap = authorizedBudget();
  if (!cap) throw new Error('SPEND_BUDGET_UNAUTHORIZED');
  // A UTF-8 byte per input token is conservative for this text-only request; extra framing margin is explicit.
  const inputUpperBound = Buffer.byteLength(serializedRequest, 'utf8') + 4096;
  if (tools && (!Number.isSafeInteger(tools.maximumCalls) || tools.maximumCalls < 0 || tools.maximumCalls > 3 || !Number.isSafeInteger(tools.inputTokenBound) || tools.inputTokenBound < 0)) throw new Error('BUDGET_USAGE_INVALID');
  const reserved = priceUsage(model, inputUpperBound + (tools?.inputTokenBound ?? 0), outputLimit) + (tools?.maximumCalls ?? 0) * .01;
  return updateLedger(directory, ledger => {
    const committed = ledger.entries.reduce((sum, item) => sum + (item.status === 'settled' ? item.actual_usd! : item.reserved_usd), 0);
    if (committed + reserved > cap) throw new Error('SPEND_BUDGET_STOP');
    const id = randomUUID();
    ledger.entries.push({ id, model, reserved_usd: reserved, actual_usd: null, status: 'reserved', created_at: new Date().toISOString(), input_tokens: null, output_tokens: null });
    return id;
  });
}
export function settleSpend(id: string, usage: { input_tokens: number; output_tokens: number }, directory = defaultDirectory(), toolCalls = 0): number {
  if (!Number.isSafeInteger(usage.input_tokens) || usage.input_tokens < 0 || !Number.isSafeInteger(usage.output_tokens) || usage.output_tokens < 0) throw new Error('BUDGET_USAGE_INVALID');
  return updateLedger(directory, ledger => {
    const entry = ledger.entries.find(item => item.id === id);
    if (!entry || entry.status !== 'reserved') throw new Error('BUDGET_RESERVATION_NOT_FOUND');
  if (!Number.isSafeInteger(toolCalls) || toolCalls < 0 || toolCalls > 3) throw new Error('BUDGET_USAGE_INVALID');
  const actual = priceUsage(entry.model, usage.input_tokens, usage.output_tokens) + toolCalls * .01;
    // If the assumed bound is violated, retain at least the actual charge and stop subsequent calls via the cap.
    entry.actual_usd = actual; entry.input_tokens = usage.input_tokens; entry.output_tokens = usage.output_tokens; entry.status = 'settled';
    return actual;
  });
}
