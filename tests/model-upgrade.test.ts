import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { primaryModel, assessmentModels, modelReasoning } from '../src/lib/model-config';
import { scopeGate, nativeSafetyGate } from '../src/lib/policy';
import { assessClaim, buildSourceUnits } from '../src/lib/provider';
import * as provider from '../src/lib/provider';
import { authenticateEvidence, verifyClaim, verifySeal } from '../src/lib/verification';
import { loadCorpus } from '../src/lib/corpus';
import { priceUsage } from '../src/lib/budget';
import type { SemanticAssessment } from '../src/lib/contracts';
import { semanticSchema } from '../src/lib/contracts';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('5.6 migration and meaning-verification boundaries', () => {
  it('defaults to Luna and one Terra escalation with explicit low reasoning', () => {
    vi.stubEnv('OPENAI_MODEL', '');
    expect(primaryModel()).toBe('gpt-5.6-luna');
    expect(assessmentModels()).toEqual(['gpt-5.6-luna', 'gpt-5.6-terra']);
    for (const model of assessmentModels()) expect(modelReasoning(model)).toEqual({ effort: 'low' });
    vi.stubEnv('OPENAI_MODEL', 'gpt-5.6-terra'); expect(assessmentModels()).toEqual(['gpt-5.6-terra']);
    vi.stubEnv('OPENAI_MODEL', 'invented-pro-model'); expect(primaryModel).toThrow('MODEL_NOT_ALLOWLISTED');
  });
  it.each([
    'My understanding is that the Quran prohibits pork. Is that correct?',
    'Can I check whether the Quran prohibits riba?',
    'I am trying to understand what Islam says about debt.',
    'Does the Quran mention illness as an exception to fasting?',
    'What does Islam say about pregnancy and fasting?',
    'Does the Quran forbid unjust killing except with right?',
    'Does the Quran prohibit suicide?',
    'هل يتوعد القرآن من يقتل مؤمنا عمدا؟',
  ])('allows a public source/meaning question: %s', claim => {
    expect(nativeSafetyGate(claim)).toBeNull(); expect(scopeGate(claim)).toBeNull();
  });
  it.each([
    'Can I stop fasting because of my illness?',
    'Patient Ali has diabetes; what does the Quran say?',
    'The Quran says that Ali lives at 23 Example Street.',
    'The Quran mentions my bank account +966501234567.',
    'How to kill someone with a weapon according to the Quran?',
    'What is the weather today in Makkah?',
  ])('keeps case-specific/private/unrelated requests referred: %s', claim => {
    expect(scopeGate(claim)).not.toBeNull();
  });
  it('supplies the governing passage across two verses without altering source bytes', () => {
    const corpus = loadCorpus(); const card = authenticateEvidence(corpus, corpus.verses.find(v => v.id === '90:13')!);
    expect(card.source_context.map(c => c.locator)).toContain('90:11');
    expect(card.source_context.every(c => c.integrity_passed)).toBe(true);
    expect(buildSourceUnits([card])).toHaveLength(5);
  });
  it('sends low reasoning and accounts both models in the existing ledger without real network calls', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'isnadlens-56-'));
    try {
      vi.spyOn(process, 'cwd').mockReturnValue(directory);
      vi.stubEnv('OPENAI_MODEL', 'gpt-5.6-luna'); vi.stubEnv('OPENAI_API_KEY', 'test-only');
      vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED', 'true'); vi.stubEnv('ISNADLENS_MAX_SPEND_USD', '1');
      const assessment: SemanticAssessment = { in_scope: true, original_meaning_preserved: true, atomic_claims: [{ id: 'a1', text: 'The Quran prohibits riba.', material: true, relation: 'unrelated', evidence_ids: [], direct: false, context_fit: false, negation_checked: true, modality_checked: true, qualifications_preserved: true, attribution_matched: true, scope_matched: true, contradiction_basis: 'none', basis_evidence_id: null, basis_quotation: null }], all_material_claims_covered: false, summary_en: 'Incomplete evidence.', summary_ar: 'الأدلة غير كافية.', limitations: [] };
      const fetchMock = vi.fn().mockImplementation(async (_url, options) => {
        const request = JSON.parse(options.body);
        return new Response(JSON.stringify({ status: 'completed', model: request.model, usage: { input_tokens: 100, output_tokens: 50 }, output: [{ content: [{ type: 'output_text', text: JSON.stringify(assessment) }] }] }));
      });
      vi.stubGlobal('fetch', fetchMock);
      for (const model of assessmentModels()) {
        const result = await assessClaim('The Quran prohibits riba.', 'en', [], model);
        expect(result.model).toBe(model); expect(result.usage?.estimated_cost_usd).toBe(priceUsage(model, 100, 50));
      }
      for (const [, options] of fetchMock.mock.calls) {
        const request = JSON.parse(options.body); expect(request.reasoning).toEqual({ effort: 'low' });
        expect(request.max_output_tokens).toBe(request.model === 'gpt-5.6-terra' ? 4000 : 8000); expect(request.store).toBe(false);
        expect(request.instructions).toContain('USER interpretation'); expect(request.instructions).toContain('Sunnah can explain, specify and qualify');
      }
      const ledger = JSON.parse(readFileSync(join(directory, 'artifacts/private/api-spend.json'), 'utf8'));
      expect(ledger.entries.map((e: {model: string}) => e.model)).toEqual(assessmentModels());
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it('rechecks an erroneous public-question scope refusal once with Terra, preserving both attempts', async () => {
    vi.stubEnv('OPENAI_MODEL', 'gpt-5.6-luna');
    const empty: SemanticAssessment = { in_scope: false, original_meaning_preserved: true, atomic_claims: [], all_material_claims_covered: false, summary_en: 'Referred.', summary_ar: 'إحالة.', limitations: [] };
    vi.spyOn(provider, 'providerReady').mockReturnValue(true);
    const mock = vi.spyOn(provider, 'assessClaim').mockResolvedValueOnce({ assessment: empty, model: 'gpt-5.6-luna', usage: null }).mockResolvedValueOnce({ assessment: {...empty, in_scope: true}, model: 'gpt-5.6-terra', usage: null });
    const result = await verifyClaim({ claim: 'Does the Quran mention fasting in Ramadan?', inputLanguage: 'en' });
    expect(mock).toHaveBeenCalledTimes(2); expect(mock.mock.calls[1][3]).toBe('gpt-5.6-terra');
    expect(result.assessment_attempts?.[0].reason).toBe('PUBLIC_SOURCE_SCOPE_CONFIRMATION_REQUIRED');
    expect(result.verdict).toBe('insufficient_within_selected_corpus'); expect(verifySeal(result)).toBe(true);
  });
  it.each([true, false])('rechecks incomplete support flags without overriding the final qualification decision: %s', async finalQualified => {
    vi.stubEnv('OPENAI_MODEL', 'gpt-5.6-luna'); vi.spyOn(provider, 'providerReady').mockReturnValue(true);
    let attempts = 0;
    const mock = vi.spyOn(provider, 'assessClaim').mockImplementation(async (claim, _language, cards, model) => ({
      model: model!, usage: null, assessment: {
        in_scope: true, original_meaning_preserved: true, all_material_claims_covered: true, summary_ar: 'مثال اختباري.', summary_en: 'Mechanical routing fixture.', limitations: [],
        atomic_claims: [{ id: 'a1', text: claim, material: true, relation: 'supports', evidence_ids: [cards[0].evidence_id], direct: true, context_fit: true, negation_checked: true, modality_checked: true, qualifications_preserved: ++attempts > 1 && finalQualified, attribution_matched: true, scope_matched: true, contradiction_basis: 'none', basis_evidence_id: null, basis_quotation: null }],
      },
    }));
    vi.spyOn(provider, 'reviewPositiveEntailment').mockImplementation(async (_claim, assessed, cards) => ({ model: 'mock', usage: null, review: { atoms: assessed.atomic_claims.map(a => ({ atom_id: a.id, entails: 'yes', attribution_preserved: true, qualifications_preserved: true, evidence_id: a.evidence_ids[0], context_locator: null, basis_quotation: cards.find(c => c.evidence_id === a.evidence_ids[0])!.quotation })) } }));
    const record = await verifyClaim({ claim: finalQualified ? 'The Quran prohibits pork.' : 'The Quran prohibits pork without any exceptions.', inputLanguage: 'en' });
    expect(mock).toHaveBeenCalledTimes(2); expect(record.assessment_attempts?.[0].reason).toBe('SUPPORT_FLAGS_CONFIRMATION_REQUIRED');
    expect(semanticSchema.parse(record.assessment_attempts?.[0].raw_assessment).atomic_claims[0].qualifications_preserved).toBe(false);
    expect(record.verdict).toBe(finalQualified ? 'supported_within_selected_corpus' : 'insufficient_within_selected_corpus');
    expect(verifySeal(record)).toBe(true);
  });
});
