import { randomUUID } from 'node:crypto';
import { loadCorpus, sha256, type Corpus, type Verse } from './corpus';
import { recordSchema, sourceIdentificationSchema, type SourceIdentification, type EvidenceItem, type VerificationRecord, type SemanticAssessment } from './contracts';
import { scopeGate, decideVerdict } from './policy';
import { retrieve } from './retrieval';
import { assessClaim, providerReady, PROMPT_VERSION, SCHEMA_VERSION, ProviderFailure } from './provider';
import { loadHadith, retrieveHadith, authenticateHadith, getHadithCoverage, checkHadithCitation, type HadithCorpus } from './hadith';
import { parseQuranReferences, parseHadithLinks, extractClaimQuotes } from './citations';
import { planClaimQueries, validateQueryTerms, QUERY_PLANNER_VERSION, QueryPlannerFailure, type QueryOverrides } from './query-planner';

export type { VerificationRecord } from './contracts';
export const ROUTER_VERSION = 'mini-default-strong-on-semantic-reference-failure-v1';
function semanticReferenceError(assessment: SemanticAssessment, evidence: EvidenceItem[]): string | null {
  const ids = new Set(evidence.map(item => item.evidence_id));
  if (assessment.atomic_claims.some(atom => atom.evidence_ids.some(id => !ids.has(id)))) return 'SEMANTIC_REFERENCE_INVALID';
  if (assessment.atomic_claims.some(atom => atom.contradiction_basis === 'explicit_negation_or_incompatible_statement' && (!atom.basis_evidence_id || !atom.basis_quotation?.trim() || !evidence.some(item => item.evidence_id === atom.basis_evidence_id && item.quotation.includes(atom.basis_quotation!))))) return 'SEMANTIC_BASIS_QUOTATION_INVALID';
  return null;
}
export function sealRecord(record: Omit<VerificationRecord, 'audit_hash'>): VerificationRecord {
  const parsed = recordSchema.parse({ ...record, audit_hash: '' });
  const { audit_hash: omitted, ...canonical } = parsed;
  void omitted;
  return { ...canonical, audit_hash: sha256(JSON.stringify(canonical)) };
}
export function verifySeal(record: VerificationRecord): boolean {
  const { audit_hash, ...payload } = record;
  return audit_hash === sha256(JSON.stringify(payload));
}
export function authenticateEvidence(corpus: Corpus, verse: Verse): EvidenceItem {
  const found = corpus.verses.find(v => v.id === verse.id);
  const source = corpus.manifest.sources.find(s => /uthmani|display/i.test(`${s.id} ${s.type}`)) ?? corpus.manifest.sources[0];
  const checks = [
    { id: 'locator', passed: Boolean(found && found.surah === verse.surah && found.ayah === verse.ayah), reason: 'Locator belongs to the admitted complete edition.' },
    { id: 'exact_quotation', passed: Boolean(found && found.display === verse.display), reason: 'Quotation matches immutable publisher display text exactly.' },
    { id: 'quotation_sha256', passed: sha256(verse.display) === verse.display_sha256, reason: 'UTF-8 quotation SHA-256 matches the admitted record.' },
    { id: 'corpus_sha256', passed: sha256(JSON.stringify(corpus.verses)) === corpus.manifest.sha256, reason: 'Complete joined corpus matches its manifest hash.' },
  ];
  const source_context = (['preceding', 'following'] as const).flatMap(position => {
    const neighbor = corpus.verses.find(v => v.surah === verse.surah && v.ayah === verse.ayah + (position === 'preceding' ? -1 : 1));
    return neighbor ? [{ position, locator: neighbor.id, quotation: neighbor.display, quotation_sha256: neighbor.display_sha256, integrity_passed: sha256(neighbor.display) === neighbor.display_sha256 }] : [];
  });
  checks.push({ id: 'neighbor_context', passed: source_context.every(c => c.integrity_passed), reason: 'Immediate same-surah context matches admitted exact display hashes.' });
  return { evidence_id: `${corpus.manifest.id}:${verse.id}`, source_id: source.id, title: 'Quran — Tanzil Uthmani', version: source.version,
    locator: verse.id, quotation: verse.display, quotation_sha256: verse.display_sha256,
    source_url: `https://tanzil.net/#${verse.surah}:${verse.ayah}`, attribution: source.attribution,
    integrity: { passed: checks.every(c => c.passed), checks }, semantic_relation: 'not_assessed', source_context };
}
export function getCoverage() {
  const hadith = getHadithCoverage();
  try { const corpus = loadCorpus(); return { hadith, approved: true, verse_count: corpus.verses.length, source: 'Tanzil Arabic Quran', provider_ready: providerReady(), available: true, corpus_id: corpus.manifest.id, version: corpus.manifest.version, corpus_sha256: corpus.manifest.sha256, verses: corpus.verses.length, sources: corpus.manifest.sources, input_languages: ['ar', 'en'], source_languages: ['ar'], semantic_provider_ready: providerReady(), limitations: ['Verification searches admitted Arabic Quran and selected Arabic/English Hadith; published passage translations are separate display only.', 'Bounded AI-assisted or lexical retrieval can miss relevant passages; absence is not a religious ruling.'] }; }
  catch { return { hadith, approved: false, verse_count: 0, source: 'Tanzil Arabic Quran', version: 'not_admitted', provider_ready: providerReady(), available: false, verses: 0, semantic_provider_ready: providerReady(), limitations: ['Source edition is not admitted or failed integrity checks.'] }; }
}
export function checkExplicitCitation(corpus: Corpus, claim: string): string | null {
  const parsed = parseQuranReferences(claim);
  if (parsed.error) return parsed.error;
  const references = parsed.references;
  if (!references.length) return null;
  const verses = references.map(ref => corpus.verses.find(v => v.id === ref));
  if (verses.some(v => !v)) return 'EXPLICIT_LOCATOR_INVALID';
  const quotes = extractClaimQuotes(claim);
  const arabicQuotes = quotes.filter(quote => /[\u0600-\u06ff]/.test(quote));
  if (arabicQuotes.some(quote => !verses.some(v => v && (v.display.includes(quote) || v.search.includes(quote))))) return 'EXPLICIT_QUOTATION_MISMATCH';
  // English text is not an admitted Quran translation and cannot be authenticated as source quotation.
  if (quotes.some(quote => !/[\u0600-\u06ff]/.test(quote))) return 'TRANSLATED_QUOTATION_NOT_ADMITTED';
  return null;
}
export async function verifyClaim({ claim, inputLanguage, corpusSelection = 'quran', sourceIdentification, useQueryPlanner = false, queryOverrides }: { claim: string; inputLanguage: 'ar' | 'en'; corpusSelection?: 'quran' | 'hadith' | 'both'; sourceIdentification?: SourceIdentification; useQueryPlanner?: boolean; queryOverrides?: QueryOverrides }): Promise<VerificationRecord> {
  const base: Omit<VerificationRecord, 'audit_hash'> = { record_id: randomUUID(), original_claim: typeof claim === 'string' ? claim : '', verdict: 'not_evaluated', reason_codes: [], summary_ar: 'لم يتم تقييم الادعاء.', summary_en: 'This claim has not been evaluated.', evidence_items: [], limitations: ['Results apply only to retrieved evidence in the admitted Arabic Quran edition.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'English explanations are not authoritative Quran translations.'], created_at: new Date().toISOString(), model: 'none', technical_verification_status: 'not_run', human_scholarly_status: 'not_reviewed', linguistic_review_status: 'not_reviewed', input_language: inputLanguage === 'en' ? 'en' : 'ar', corpus_manifest: null, corpus_sha256: null, retrieval_ids: [], semantic_assessment: null, prompt_version: PROMPT_VERSION, schema_version: SCHEMA_VERSION, usage: null, corpus_selection: 'quran' };
  base.corpus_selection = corpusSelection;
  base.router_version = ROUTER_VERSION; base.assessment_attempts = [];
  // This argument is populated by server-side source identification, never accepted from a raw API request.
  if (sourceIdentification) base.source_identification = sourceIdentificationSchema.parse(sourceIdentification);
  if (corpusSelection === 'hadith') base.limitations = ['Results apply only to retrieved records in the selected HadeethEnc language edition.', 'Publisher supplied grading and references are preserved; this tool does not independently authenticate hadith.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'Language editions have different coverage and are never silently merged.'];
  if (corpusSelection === 'both') base.limitations = ['Search covers the admitted Arabic Quran edition and selected Arabic/English HadeethEnc records; it is not all Islamic literature.', 'Quran and Hadith evidence remain separately attributed; their quotations are never merged or silently substituted.', 'Publisher hadith grades are preserved, not independently authenticated.', 'A bounded retrieval can miss relevant passages; absence is not proof of a religious conclusion.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.'];
  const fail = (reason: string) => sealRecord({ ...base, reason_codes: [reason], ...(reason === 'OUTSIDE_SUPPORTED_CLAIM_SCOPE' ? {
    summary_ar: 'عدسة الإسناد مخصّصة للتحقق من الادعاءات المتعلقة بالقرآن والحديث، ولا تجيب عن الأسئلة العامة أو الطقس. اكتب ادعاءً واضحاً تريد فحصه في المصدر المحدد.',
    summary_en: 'IsnadLens verifies claims about the Quran and Hadith. It does not answer general questions or provide weather updates. Enter a clear claim to examine against the selected source.',
  } : {}) });
  if (typeof claim !== 'string' || !['ar', 'en'].includes(inputLanguage)) return fail('INPUT_INVALID');
  if (!['quran', 'hadith', 'both'].includes(corpusSelection)) { base.corpus_selection = 'quran'; return fail('CORPUS_SELECTION_INVALID'); }
  const blocked = scopeGate(claim);
  const identifiedQuotation = sourceIdentification && (sourceIdentification.status === 'identified' && sourceIdentification.corpus === corpusSelection || corpusSelection === 'both' && sourceIdentification.status === 'ambiguous' && sourceIdentification.candidate_locators.length > 0) && ['exact_quotation', 'normalized_quotation'].includes(sourceIdentification.method);
  if (blocked && !(blocked === 'OUTSIDE_SUPPORTED_CLAIM_SCOPE' && identifiedQuotation)) return fail(blocked);
  if (inputLanguage === 'ar' && !/\p{Script=Arabic}/u.test(claim) || inputLanguage === 'en' && !/\p{Script=Latin}/u.test(claim)) return fail('INPUT_LANGUAGE_MISMATCH');
  const explicitlyQuran = /\b(quran|qur'an|koran)\b|قرآن|القران/i.test(claim) || parseQuranReferences(claim).references.length > 0;
  const explicitlyHadith = /\b(hadith|hadeeth|prophet said|muhammad said)\b|حديث|قال النبي|قال رسول/i.test(claim) || parseHadithLinks(claim).links.length > 0;
  if (corpusSelection !== 'both' && explicitlyQuran && explicitlyHadith || corpusSelection === 'hadith' && explicitlyQuran || corpusSelection === 'quran' && explicitlyHadith) return fail('SOURCE_ATTRIBUTION_OR_SELECTION_MISMATCH');
  const malformed = parseQuranReferences(claim).error ?? parseHadithLinks(claim).error; if (malformed) return fail(malformed);
  let quran: Corpus | undefined; let hadith: HadithCorpus | undefined;
  if (corpusSelection !== 'hadith') {
    try { quran = loadCorpus(); } catch { return fail('CORPUS_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
    const citationError = checkExplicitCitation(quran, claim); if (citationError) return fail(citationError);
  }
  if (corpusSelection !== 'quran') {
    try { hadith = loadHadith(); } catch { return fail('HADITH_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
    const citationError = checkHadithCitation(hadith, claim, inputLanguage); if (citationError) return fail(citationError);
  }
  if (quran && hadith) {
    const componentHashes = { quran: quran.manifest.sha256, hadith: hadith.manifest.sha256 };
    const digest = sha256(JSON.stringify(componentHashes));
    base.corpus_manifest = { id: 'combined-quran-hadith', version: `${quran.manifest.version};${hadith.manifest.version}`, sha256: digest, components: { quran: quran.manifest, hadith: hadith.manifest } };
    base.corpus_sha256 = digest;
  } else { const manifest = quran?.manifest ?? hadith!.manifest; base.corpus_manifest = manifest; base.corpus_sha256 = manifest.sha256; }
  let overrides: QueryOverrides = { arabic_terms: [], english_terms: [] };
  if (queryOverrides) {
    try { overrides = validateQueryTerms(queryOverrides); } catch { return fail('QUERY_PLAN_TERM_INVALID'); }
    base.retrieval_plan = { ...overrides, status: 'provided', reason: 'SERVER_PROVIDED_SEARCH_TERMS', model: 'none', usage: null, planner_version: QUERY_PLANNER_VERSION };
  } else if (useQueryPlanner) {
    try {
      const plan = await planClaimQueries({ claim, inputLanguage }); overrides = { arabic_terms: plan.arabic_terms, english_terms: plan.english_terms };
      base.retrieval_plan = { ...plan, status: 'planned', reason: 'BOUNDED_AI_SEARCH_EXPANSION' };
    } catch (error) {
      base.retrieval_plan = { ...overrides, status: 'lexical_fallback', reason: error instanceof Error ? error.message : 'QUERY_PLAN_UNAVAILABLE', model: error instanceof QueryPlannerFailure ? error.model : 'none', usage: error instanceof QueryPlannerFailure ? error.usage : null, planner_version: QUERY_PLANNER_VERSION };
      base.limitations.push('AI search planning was unavailable; deterministic lexical retrieval was used instead.');
    }
  }
  if (quran) base.evidence_items.push(...retrieve(quran, claim, hadith ? 4 : 8, overrides.arabic_terms).map(verse => authenticateEvidence(quran!, verse)));
  if (hadith) {
    if (!quran) base.evidence_items.push(...retrieveHadith(hadith, claim, inputLanguage, 8, inputLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms).map(record => authenticateHadith(hadith!, record)));
    else {
      const preferred = retrieveHadith(hadith, claim, inputLanguage, 2, inputLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms);
      const otherLanguage = inputLanguage === 'ar' ? 'en' : 'ar';
      const other = retrieveHadith(hadith, claim, otherLanguage, 2, otherLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms);
      const chosen = [...preferred, ...other];
      if (chosen.length < 4) for (const record of retrieveHadith(hadith, claim, inputLanguage, 4, inputLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms)) if (chosen.length < 4 && !chosen.some(item => item.language === record.language && item.id === record.id)) chosen.push(record);
      base.evidence_items.push(...chosen.map(record => authenticateHadith(hadith!, record)));
    }
  }
  base.retrieval_ids = base.evidence_items.map(e => e.evidence_id);
  if (base.evidence_items.some(e => !e.integrity.passed)) return fail('CITATION_INTEGRITY_FAILURE');
  base.technical_verification_status = base.evidence_items.length ? 'passed' : 'no_candidates';
  if (!base.evidence_items.length) return sealRecord({ ...base, verdict: 'insufficient_within_selected_corpus', reason_codes: ['NO_RETRIEVED_EVIDENCE'], summary_ar: 'لم يسترجع البحث أدلة كافية من المجموعة المحددة.', summary_en: 'The search retrieved no evidence from the selected corpus. This does not establish that evidence does not exist.' });
  try {
    let result: Awaited<ReturnType<typeof assessClaim>> | null = null;
    const configuredModel = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
    if (!['gpt-5.4-mini', 'gpt-5.4'].includes(configuredModel)) return fail('MODEL_NOT_ALLOWLISTED');
    const models: ('gpt-5.4-mini' | 'gpt-5.4')[] = configuredModel === 'gpt-5.4' ? ['gpt-5.4'] : ['gpt-5.4-mini', 'gpt-5.4'];
    for (const requestedModel of models) {
      try { result = await assessClaim(claim, inputLanguage, base.evidence_items, requestedModel); }
      catch (error) {
        base.assessment_attempts!.push({ model: error instanceof ProviderFailure ? error.model : requestedModel, reason: error instanceof Error ? error.message : 'PROVIDER_UNAVAILABLE', raw_assessment: null, usage: error instanceof ProviderFailure ? error.usage : null });
        throw error;
      }
      base.model = result.model; base.usage = result.usage; base.semantic_assessment = result.assessment;
      const invalid = semanticReferenceError(result.assessment, base.evidence_items);
      base.assessment_attempts!.push({ model: result.model, reason: invalid ?? 'SEMANTIC_VALIDATION_PASSED', raw_assessment: result.assessment, usage: result.usage });
      if (!invalid) break;
      // Exactly one strong reassessment, only for these mechanically detected model-reference errors.
      // Scope refusals, incomplete evidence, provider errors and source corruption never trigger it.
      if (requestedModel === 'gpt-5.4' || !result.assessment.in_scope || !result.assessment.original_meaning_preserved) return fail(invalid);
    }
    if (!result) return fail('SEMANTIC_SCHEMA_OR_PROVIDER_FAILURE');
    const assessment = result.assessment;
    const ids = new Set(base.evidence_items.map(e => e.evidence_id));
    base.verdict = decideVerdict(assessment, ids);
    base.summary_ar = assessment.summary_ar; base.summary_en = assessment.summary_en;
    base.reason_codes = [base.verdict === 'supported_within_selected_corpus' ? 'COMPLETE_DIRECT_COVERAGE' : base.verdict === 'conflicting_within_selected_corpus' ? 'DIRECT_MATERIAL_CONTRADICTION' : base.verdict === 'not_evaluated' ? 'SEMANTIC_SCOPE_REFERRAL' : 'INCOMPLETE_OR_INDIRECT_COVERAGE'];
    base.limitations.push(...assessment.limitations);
    base.evidence_items = base.evidence_items.map(e => ({ ...e, semantic_relation: assessment.atomic_claims.find(a => a.evidence_ids.includes(e.evidence_id))?.relation ?? 'unrelated' }));
    return sealRecord(base);
  } catch (error) {
    if (error instanceof ProviderFailure) { base.model = error.model; base.usage = error.usage; }
    const allowed = ['PROVIDER_UNAVAILABLE', 'PROVIDER_RATE_LIMIT', 'PROVIDER_INCOMPLETE', 'PROVIDER_REFUSAL', 'SPEND_OR_CONCURRENCY_STOP', 'MODEL_NOT_ALLOWLISTED', 'PACKET_LIMIT', 'PACKET_INTEGRITY_FAILURE', 'SPEND_BUDGET_STOP', 'SPEND_BUDGET_UNAUTHORIZED', 'BUDGET_LEDGER_LOCKED', 'BUDGET_LEDGER_INVALID'];
    return fail(error instanceof Error && allowed.includes(error.message) ? error.message : 'SEMANTIC_SCHEMA_OR_PROVIDER_FAILURE');
  }
}
