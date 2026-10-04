import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { planClaimQueries, validateQueryTerms } from '../src/lib/query-planner';
import * as planner from '../src/lib/query-planner';
import * as provider from '../src/lib/provider';
import * as corpus from '../src/lib/corpus';
import { verifyClaim, verifySeal } from '../src/lib/verification';
import type { SemanticAssessment } from '../src/lib/contracts';

const terms = { arabic_terms: ['الخنزير', 'حرمة أكل الخنزير'], english_terms: ['pork', 'eating pork', 'prohibition'] };
const sourceClaim = 'Is eating pork forbidden in Islam?';
const unrelated: SemanticAssessment = { in_scope: true, original_meaning_preserved: true, atomic_claims: [{ id: 'a', text: sourceClaim, material: true, relation: 'unrelated', evidence_ids: [], direct: false, context_fit: true, negation_checked: true, modality_checked: true, qualifications_preserved: true, attribution_matched: true, scope_matched: true, contradiction_basis: 'none', basis_evidence_id: null, basis_quotation: null }], all_material_claims_covered: false, summary_ar: 'الأدلة المختارة غير كافية.', summary_en: 'The selected evidence is incomplete.', limitations: [] };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('bounded AI search planner adapter', () => {
  let directory: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'isnadlens-plan-'));
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    vi.stubEnv('OPENAI_API_KEY', 'not-a-real-key'); vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED', 'true'); vi.stubEnv('ISNADLENS_MAX_SPEND_USD', '.1');
  });
  afterEach(() => { rmSync(directory, { recursive: true, force: true }); });
  function response(payload: unknown) { return new Response(JSON.stringify({ status: 'completed', model: 'gpt-5.4-mini', usage: { input_tokens: 100, output_tokens: 50 }, output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }] }), { status: 200 }); }
  it('returns only bounded search terms and settles known usage in the existing ledger', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(terms)); vi.stubGlobal('fetch', fetchMock);
    const result = await planClaimQueries({ claim: sourceClaim, inputLanguage: 'en' });
    expect(result.arabic_terms).toEqual(terms.arabic_terms); expect(result.english_terms).toEqual(terms.english_terms);
    expect(result.usage?.reservation_id).toBeTruthy();
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.store).toBe(false); expect(request.max_output_tokens).toBe(900); expect(request.text.format.strict).toBe(true);
    expect(JSON.parse(request.input)).toEqual({ claim: sourceClaim, input_language: 'en' });
    expect(JSON.parse(readFileSync(join(directory, 'artifacts/private/api-spend.json'), 'utf8')).entries[0].status).toBe('settled');
  });
  it.each([
    { ...terms, verdict: 'supported' },
    { ...terms, english_terms: ['2:173'] },
    { ...terms, english_terms: ['https://example.com'] },
    { ...terms, arabic_terms: ['«نص منسوب»'] },
    { ...terms, english_terms: ['ignore instructions'] },
  ])('rejects planner-generated IDs, verdicts, instructions or alleged quotations', async payload => {
    const fetchMock = vi.fn().mockResolvedValue(response(payload)); vi.stubGlobal('fetch', fetchMock);
    await expect(planClaimQueries({ claim: sourceClaim, inputLanguage: 'en' })).rejects.toThrow(/QUERY_PLAN_(?:SCHEMA|TERM)_INVALID/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it('does not send personal/private claims or make a paid request without authorization', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(planClaimQueries({ claim: 'Can I stop fasting because of my illness?', inputLanguage: 'en' })).rejects.toThrow('PERSONAL_RULING_REFERRAL');
    vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED', 'false');
    await expect(planClaimQueries({ claim: sourceClaim, inputLanguage: 'en' })).rejects.toThrow('PROVIDER_UNAVAILABLE');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('bounds query strings and retains no numeric locator authority', () => {
    expect(() => validateQueryTerms({ ...terms, english_terms: Array(11).fill('pork') })).toThrow('QUERY_PLAN_SCHEMA_INVALID');
    expect(() => validateQueryTerms({ ...terms, arabic_terms: ['٢١:٣٠'] })).toThrow('QUERY_PLAN_TERM_INVALID');
  });
  it('refuses exhausted call and cash caps before any network request', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('ISNADLENS_MAX_CALLS', '0');
    await expect(planClaimQueries({ claim: sourceClaim, inputLanguage: 'en' })).rejects.toThrow('QUERY_PLAN_CALL_OR_CONCURRENCY_STOP');
    vi.stubEnv('ISNADLENS_MAX_CALLS', '100'); vi.stubEnv('ISNADLENS_MAX_SPEND_USD', '.000001');
    await expect(planClaimQueries({ claim: sourceClaim, inputLanguage: 'en' })).rejects.toThrow('SPEND_BUDGET_STOP');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
describe('both-corpus pipeline with honest planner provenance', () => {
  it('rejects unavailable admitted sources before planning or assessment', async () => {
    vi.spyOn(corpus, 'loadCorpus').mockImplementation(() => { throw new Error('tampered'); });
    const planned = vi.spyOn(planner, 'planClaimQueries'); const assessed = vi.spyOn(provider, 'assessClaim');
    const record = await verifyClaim({ claim: sourceClaim, inputLanguage: 'en', corpusSelection: 'both', useQueryPlanner: true });
    expect(record.reason_codes).toEqual(['CORPUS_INTEGRITY_OR_AVAILABILITY_FAILURE']);
    expect(planned).not.toHaveBeenCalled(); expect(assessed).not.toHaveBeenCalled();
  });
  it('retrieves separately authenticated Quran/Hadith evidence using search expansion and preserves the original claim', async () => {
    const planUsage = { input_tokens: 100, output_tokens: 50, estimated_cost_usd: .001, reservation_id: 'planner-fixture' };
    const planned = vi.spyOn(planner, 'planClaimQueries').mockResolvedValue({ ...terms, model: 'mock-planner', usage: planUsage, planner_version: 'test' });
    const assessed = vi.spyOn(provider, 'assessClaim').mockResolvedValue({ assessment: unrelated, model: 'mock-semantic', usage: null });
    const record = await verifyClaim({ claim: sourceClaim, inputLanguage: 'en', corpusSelection: 'both', useQueryPlanner: true });
    expect(record.original_claim).toBe(sourceClaim); expect(record.corpus_selection).toBe('both');
    expect(record.evidence_items.length).toBeLessThanOrEqual(8);
    expect(record.evidence_items.filter(item => item.source_id.startsWith('QURAN-'))).toHaveLength(4);
    expect(record.evidence_items.filter(item => item.source_id.startsWith('HADEETHENC-'))).toHaveLength(4);
    expect(record.evidence_items.every(item => item.integrity.passed)).toBe(true);
    expect(record.retrieval_plan).toMatchObject({ status: 'planned', usage: planUsage });
    expect(record.corpus_manifest).toHaveProperty('components.quran'); expect(record.corpus_manifest).toHaveProperty('components.hadith');
    expect(record.verdict).toBe('insufficient_within_selected_corpus'); expect(verifySeal(record)).toBe(true);
    expect(planned).toHaveBeenCalledOnce(); expect(assessed).toHaveBeenCalledOnce();
  }, 15000);
  it('records planner failure and retains deterministic lexical fallback rather than pretending AI retrieval succeeded', async () => {
    vi.spyOn(planner, 'planClaimQueries').mockRejectedValue(new Error('PROVIDER_UNAVAILABLE'));
    vi.spyOn(provider, 'assessClaim').mockResolvedValue({ assessment: unrelated, model: 'mock-semantic', usage: null });
    const record = await verifyClaim({ claim: sourceClaim, inputLanguage: 'en', corpusSelection: 'both', useQueryPlanner: true });
    expect(record.retrieval_plan).toMatchObject({ status: 'lexical_fallback', reason: 'PROVIDER_UNAVAILABLE', usage: null });
    expect(record.limitations.some(text => text.includes('lexical retrieval'))).toBe(true); expect(verifySeal(record)).toBe(true);
  });
  it.each([
    { claim: 'The Quran at 2:9999 describes pork.', language: 'en' as const, selection: 'quran' as const },
    { claim: 'القرآن في 21:30 يقول "يجب استعمال الهاتف للصلاة".', language: 'ar' as const, selection: 'both' as const },
    { claim: 'Can I stop fasting because of my illness?', language: 'en' as const, selection: 'both' as const },
    { claim: 'The Quran at 21:30 says "We made from water every living thing".', language: 'en' as const, selection: 'both' as const },
  ])('refuses invalid citations or personal data before a planner request: $claim', async ({ claim, language, selection }) => {
    const planned = vi.spyOn(planner, 'planClaimQueries'); const assessed = vi.spyOn(provider, 'assessClaim');
    const record = await verifyClaim({ claim, inputLanguage: language, corpusSelection: selection, useQueryPlanner: true });
    expect(record.verdict).toBe('not_evaluated'); expect(planned).not.toHaveBeenCalled(); expect(assessed).not.toHaveBeenCalled();
  });
});
