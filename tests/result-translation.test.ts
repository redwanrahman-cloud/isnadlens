import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sealRecord } from '../src/lib/verification';
import type { VerificationRecord } from '../src/lib/contracts';
import { translateResultExplanation } from '../src/lib/result-translation';

function fixture() {
  const record: Omit<VerificationRecord, 'audit_hash'> = { record_id: 'translation-mechanical-fixture', original_claim: 'PRIVATE CLAIM MUST NOT REACH TRANSLATOR', verdict: 'insufficient_within_selected_corpus', reason_codes: ['FIXTURE'], summary_ar: 'لا توجد أدلة كافية.', summary_en: 'Only 2 retrieved passages were assessed; evidence is incomplete.', evidence_items: [], limitations: ['This is not a fatwa.', 'Human review is required.'], created_at: '2026-10-04T00:00:00Z', model: 'mock-only', technical_verification_status: 'passed', human_scholarly_status: 'not_reviewed', linguistic_review_status: 'not_reviewed', input_language: 'en', corpus_manifest: null, corpus_sha256: null, retrieval_ids: [], semantic_assessment: null, prompt_version: 'fixture', schema_version: 'fixture', usage: null, corpus_selection: 'quran' };
  return sealRecord(record);
}
const valid = { summary: 'Hanya 2 kutipan yang dinilai; bukti belum lengkap.', limitations: ['Ini bukan fatwa.', 'Peninjauan manusia diperlukan.'] };
function response(payload: unknown, withUsage = true) { return new Response(JSON.stringify({ status: 'completed', ...(withUsage ? { usage: { input_tokens: 100, output_tokens: 50 } } : {}), output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }] }), { status: 200 }); }
let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'isnadlens-translation-'));
  vi.spyOn(process, 'cwd').mockReturnValue(directory);
  vi.stubEnv('OPENAI_API_KEY', 'not-a-real-key'); vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED', 'true'); vi.stubEnv('ISNADLENS_MAX_SPEND_USD', '1');
  vi.stubEnv('ISNADLENS_MAX_CALLS','100');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); rmSync(directory, { recursive: true, force: true }); });
describe('sealed result explanation translation', () => {
  it.each(['es','fr','de','id'] as const)('rejects invented mixed-script prose for %s without a paid retry',async language=>{
    const fetchMock=vi.fn().mockResolvedValue(response({summary:'Se evaluaron 2 pasajes, ni تجاوزing limits.',limitations:['No es una fetua.','Se requiere revisión humana.']}));
    vi.stubGlobal('fetch',fetchMock);
    await expect(translateResultExplanation(fixture(),language)).rejects.toThrow('TRANSLATION_UNEXPECTED_FOREIGN_SCRIPT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('allows an unchanged source-authored Arabic name, but rejects changed names or attached Latin fragments',async()=>{
    const {audit_hash:ignored,...record}=fixture();void ignored;
    const original=sealRecord({...record,summary_en:'Scholar "عمر" assessed 2 passages.'});
    const limitations=['Esto no es una fetua.','Se requiere revisión humana.'];
    const fetchMock=vi.fn().mockResolvedValueOnce(response({summary:'El estudioso "عمر" evaluó 2 pasajes.',limitations})).mockResolvedValueOnce(response({summary:'El estudioso "عمرو" evaluó 2 pasajes.',limitations})).mockResolvedValueOnce(response({summary:'El estudioso "عمرing" evaluó 2 pasajes.',limitations}));
    vi.stubGlobal('fetch',fetchMock);
    expect((await translateResultExplanation(original,'es')).summary).toContain('"عمر"');
    await expect(translateResultExplanation(original,'es')).rejects.toThrow('TRANSLATION_UNEXPECTED_FOREIGN_SCRIPT');
    await expect(translateResultExplanation(original,'es')).rejects.toThrow('TRANSLATION_UNEXPECTED_FOREIGN_SCRIPT');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('checks every limitation and rejects foreign-script homoglyphs not present in that exact input field',async()=>{
    const fetchMock=vi.fn().mockResolvedValue(response({summary:'Solo se evaluaron 2 pasajes.',limitations:['Esto no es una fetua.','Se requiere revisión de Tаnzil.']}));
    vi.stubGlobal('fetch',fetchMock);
    // The apparent Latin name contains a Cyrillic а rather than Latin a.
    await expect(translateResultExplanation(fixture(),'es')).rejects.toThrow('TRANSLATION_UNEXPECTED_FOREIGN_SCRIPT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([
    {language:'es' as const,summary:'Solo se evaluaron 2 pasajes recuperados; la evidencia está incompleta.',limitations:['Esto no es una fetua.','Se requiere revisión humana.']},
    {language:'fr' as const,summary:'Seuls 2 passages retrouvés ont été évalués ; les preuves sont incomplètes.',limitations:['Ceci n’est pas une fatwa.','Une révision humaine est nécessaire.']},
    {language:'de' as const,summary:'Nur 2 gefundene Textstellen wurden bewertet; die Belege sind unvollständig.',limitations:['Dies ist keine Fatwa.','Eine menschliche Prüfung ist erforderlich.']}
  ])('translates the project explanation to $language without changing record or source evidence',async ({language,summary,limitations})=>{
    const original=fixture();const before=JSON.stringify(original);
    const fetchMock=vi.fn().mockResolvedValue(response({summary,limitations}));vi.stubGlobal('fetch',fetchMock);
    const translated=await translateResultExplanation(original,language);
    expect(translated).toEqual({language,summary,limitations,review_status:'not_independently_reviewed',source_kind:'project_explanation_translation',record_id:original.record_id,audit_hash:original.audit_hash});
    expect(JSON.stringify(original)).toBe(before);
    const request=JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.parse(request.input).target_language).toBe(language);
    expect(request.input).not.toContain(original.original_claim);
    expect(request.input).not.toContain('evidence_items');
  });
  it('translates only project explanations and preserves linkage/review labels and source record', async () => {
    const original = fixture(); const before = JSON.stringify(original);
    const fetchMock = vi.fn().mockResolvedValue(response(valid)); vi.stubGlobal('fetch', fetchMock);
    const result = await translateResultExplanation(original, 'id');
    expect(result).toEqual({ language: 'id', ...valid, review_status: 'not_independently_reviewed', source_kind: 'project_explanation_translation', record_id: original.record_id, audit_hash: original.audit_hash });
    expect(JSON.stringify(original)).toBe(before);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.model).toBe('gpt-5.4-mini'); expect(request.store).toBe(false); expect(request.text.format.strict).toBe(true);
    expect(JSON.parse(request.input)).toEqual({ target_language: 'id', summary: original.summary_en, limitations: original.limitations });
    expect(request.input).not.toContain(original.original_claim); expect(request.input).not.toContain(original.verdict);
    const ledger = JSON.parse(readFileSync(join(directory, 'artifacts/private/api-spend.json'), 'utf8'));
    expect(ledger.entries[0].status).toBe('settled');
  });
  it('refuses tampered records before any network request or spend reservation', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(translateResultExplanation({ ...fixture(), summary_en: 'Forged summary' }, 'id')).rejects.toThrow('TRANSLATION_RECORD_SEAL_INVALID');
    await expect(translateResultExplanation({ record_id: 'malformed' }, 'id')).rejects.toThrow('TRANSLATION_RECORD_SCHEMA_INVALID');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects unsupported languages and oversized sealed explanation input before sending anything', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(translateResultExplanation(fixture(), 'en' as 'id')).rejects.toThrow('TRANSLATION_LANGUAGE_NOT_SUPPORTED');
    const { audit_hash: ignored, ...record } = fixture(); void ignored;
    const oversized = sealRecord({ ...record, summary_en: 'A'.repeat(2001) });
    await expect(translateResultExplanation(oversized, 'id')).rejects.toThrow('TRANSLATION_INPUT_LIMIT');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['false', ''])('does not translate without explicit paid authorization (%s)', async paid => {
    vi.stubEnv('ISNADLENS_PAID_CALLS_AUTHORIZED', paid);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(translateResultExplanation(fixture(), 'id')).rejects.toThrow('PROVIDER_UNAVAILABLE'); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('stops before fetch if the persistent budget cannot reserve the conservative request cost', async () => {
    vi.stubEnv('ISNADLENS_MAX_SPEND_USD', '.00001');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(translateResultExplanation(fixture(), 'id')).rejects.toThrow('SPEND_BUDGET_STOP'); expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['0', 'NaN'])('stops before fetch for exhausted or invalid request caps (%s)', async cap => {
    vi.stubEnv('ISNADLENS_MAX_CALLS', cap);
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(translateResultExplanation(fixture(), 'id')).rejects.toThrow('TRANSLATION_CALL_LIMIT');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    { payload: { ...valid, limitations: [valid.limitations[0]] }, error: 'TRANSLATION_LIMITATION_COUNT_MISMATCH' },
    { payload: { ...valid, summary: 'Hanya 3 kutipan yang dinilai.' }, error: 'TRANSLATION_NUMERIC_INVARIANCE_FAILURE' },
    { payload: { ...valid, verdict: 'supported' }, error: 'TRANSLATION_OUTPUT_SCHEMA_INVALID' },
    { payload: { ...valid, summary: 'supported_within_selected_corpus 2' }, error: 'TRANSLATION_VERDICT_ID_FORBIDDEN' },
  ])('refuses malformed or invariant-breaking provider output: $error', async ({ payload, error }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(payload)));
    await expect(translateResultExplanation(fixture(), 'id')).rejects.toThrow(error);
    const ledger = JSON.parse(readFileSync(join(directory, 'artifacts/private/api-spend.json'), 'utf8'));
    expect(ledger.entries[0].status).toBe('settled');
  });
  it('retains a reservation when provider usage is unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(valid, false)));
    await translateResultExplanation(fixture(), 'id');
    const ledger = JSON.parse(readFileSync(join(directory, 'artifacts/private/api-spend.json'), 'utf8'));
    expect(ledger.entries[0].status).toBe('reserved');
  });
  it('rejects an English response for Bengali instead of displaying untranslated content as complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ summary: 'Only 2 passages were assessed.', limitations: ['This is not a fatwa.', 'Human review is required.'] })));
    await expect(translateResultExplanation(fixture(), 'bn')).rejects.toThrow('TRANSLATION_LANGUAGE_OR_EMPTY_OUTPUT');
  });
  it('preserves literal source-reference punctuation in Hindi and excludes reformatted or localized references', async () => {
    const { audit_hash: ignored, ...record } = fixture(); void ignored;
    const sealed = sealRecord({ ...record, summary_en: 'The Quran prescribes fasting and links it to Ramadan in 2:185.' });
    const limitations = ['यह फतवा नहीं है।', 'मानवीय समीक्षा आवश्यक है।'];
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ summary: 'कुरान रोज़े का आदेश देता है और 2:185 में इसे रमज़ान से जोड़ता है।', limitations })).mockResolvedValueOnce(response({ summary: 'कुरान रोज़े का आदेश देता है और सूरा 2 आयत 185 में इसे रमज़ान से जोड़ता है।', limitations })).mockResolvedValueOnce(response({ summary: 'कुरान रोज़े का आदेश देता है और २:१८५ में इसे रमज़ान से जोड़ता है।', limitations }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await translateResultExplanation(sealed, 'hi')).summary).toContain('2:185');
    await expect(translateResultExplanation(sealed, 'hi')).rejects.toThrow('TRANSLATION_NUMERIC_INVARIANCE_FAILURE');
    await expect(translateResultExplanation(sealed, 'hi')).rejects.toThrow('TRANSLATION_REFERENCE_INVARIANCE_FAILURE');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.instructions).toContain('2:185 must remain exactly 2:185');
  });
  it.each([
    { language: 'bn' as const, summary: 'শুধু ২টি অংশ মূল্যায়ন করা হয়েছে; প্রমাণ অসম্পূর্ণ।', limitations: ['এটি কোনো ফতোয়া নয়।', 'মানব পর্যালোচনা প্রয়োজন।'] },
    { language: 'hi' as const, summary: 'केवल २ अंशों का मूल्यांकन हुआ; प्रमाण अधूरा है।', limitations: ['यह फतवा नहीं है।', 'मानवीय समीक्षा आवश्यक है।'] },
    { language: 'ur' as const, summary: 'صرف ۲ اقتباسات کا جائزہ لیا گیا؛ شواہد نامکمل ہیں۔', limitations: ['یہ فتویٰ نہیں ہے۔', 'انسانی جائزہ ضروری ہے۔'] },
  ])('accepts localized digits and script for $language while preserving numeric meaning', async ({ language, summary, limitations }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ summary, limitations })));
    expect((await translateResultExplanation(fixture(), language)).language).toBe(language);
  });
});
