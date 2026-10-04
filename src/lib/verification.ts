import { randomUUID } from 'node:crypto';
import { loadCorpus, sha256, type Corpus, type Verse } from './corpus';
import { recordSchema, type EvidenceItem, type VerificationRecord } from './contracts';
import { scopeGate, decideVerdict } from './policy';
import { retrieve } from './retrieval';
import { assessClaim, providerReady, PROMPT_VERSION, SCHEMA_VERSION, ProviderFailure } from './provider';
import { loadHadith, retrieveHadith, authenticateHadith, getHadithCoverage, checkHadithCitation } from './hadith';

export type { VerificationRecord } from './contracts';
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
  try { const corpus = loadCorpus(); return { hadith, approved: true, verse_count: corpus.verses.length, source: 'Tanzil Arabic Quran', provider_ready: providerReady(), available: true, corpus_id: corpus.manifest.id, version: corpus.manifest.version, corpus_sha256: corpus.manifest.sha256, verses: corpus.verses.length, sources: corpus.manifest.sources, input_languages: ['ar', 'en'], source_languages: ['ar'], semantic_provider_ready: providerReady(), limitations: ['Quran selection covers Arabic Quran only; Hadith is available through its separate selector. No Quran translations are admitted.', 'Lexical retrieval can miss relevant passages; absence is not a religious ruling.'] }; }
  catch { return { hadith, approved: false, verse_count: 0, source: 'Tanzil Arabic Quran', version: 'not_admitted', provider_ready: providerReady(), available: false, verses: 0, semantic_provider_ready: providerReady(), limitations: ['Source edition is not admitted or failed integrity checks.'] }; }
}
export function checkExplicitCitation(corpus: Corpus, claim: string): string | null {
  const references = [...claim.matchAll(/(?:^|[^\d])(\d{1,3})\s*:\s*(\d{1,3})(?!\d)/g)];
  if (!references.length) return null;
  const verses = references.map(ref => corpus.verses.find(v => v.id === `${Number(ref[1])}:${Number(ref[2])}`));
  if (verses.some(v => !v)) return 'EXPLICIT_LOCATOR_INVALID';
  const quotes = [...claim.matchAll(/["“«]([^"”»]+)["”»]/g)].map(match => match[1]);
  const arabicQuotes = quotes.filter(quote => /[\u0600-\u06ff]/.test(quote));
  if (arabicQuotes.some(quote => !verses.some(v => v && (v.display.includes(quote) || v.search.includes(quote))))) return 'EXPLICIT_QUOTATION_MISMATCH';
  // English text is not an admitted Quran translation and cannot be authenticated as source quotation.
  if (quotes.some(quote => !/[\u0600-\u06ff]/.test(quote))) return 'TRANSLATED_QUOTATION_NOT_ADMITTED';
  return null;
}
export async function verifyClaim({ claim, inputLanguage, corpusSelection = 'quran' }: { claim: string; inputLanguage: 'ar' | 'en'; corpusSelection?: 'quran' | 'hadith' }): Promise<VerificationRecord> {
  const base: Omit<VerificationRecord, 'audit_hash'> = { record_id: randomUUID(), original_claim: typeof claim === 'string' ? claim : '', verdict: 'not_evaluated', reason_codes: [], summary_ar: 'لم يتم تقييم الادعاء.', summary_en: 'This claim has not been evaluated.', evidence_items: [], limitations: ['Results apply only to retrieved evidence in the admitted Arabic Quran edition.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'English explanations are not authoritative Quran translations.'], created_at: new Date().toISOString(), model: 'none', technical_verification_status: 'not_run', human_scholarly_status: 'not_reviewed', linguistic_review_status: 'not_reviewed', input_language: inputLanguage === 'en' ? 'en' : 'ar', corpus_manifest: null, corpus_sha256: null, retrieval_ids: [], semantic_assessment: null, prompt_version: PROMPT_VERSION, schema_version: SCHEMA_VERSION, usage: null, corpus_selection: 'quran' };
  base.corpus_selection = corpusSelection;
  if (corpusSelection === 'hadith') base.limitations = ['Results apply only to retrieved records in the selected HadeethEnc language edition.', 'Publisher supplied grading and references are preserved; this tool does not independently authenticate hadith.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'Language editions have different coverage and are never silently merged.'];
  const fail = (reason: string) => sealRecord({ ...base, reason_codes: [reason] });
  if (typeof claim !== 'string' || !['ar', 'en'].includes(inputLanguage)) return fail('INPUT_INVALID');
  if (!['quran', 'hadith'].includes(corpusSelection)) { base.corpus_selection = 'quran'; return fail('CORPUS_SELECTION_INVALID'); }
  const blocked = scopeGate(claim); if (blocked) return fail(blocked);
  if (inputLanguage === 'ar' && !/\p{Script=Arabic}/u.test(claim) || inputLanguage === 'en' && !/\p{Script=Latin}/u.test(claim)) return fail('INPUT_LANGUAGE_MISMATCH');
  const explicitlyQuran = /\b(quran|qur'an|koran)\b|قرآن|القران/i.test(claim);
  const explicitlyHadith = /\b(hadith|hadeeth|prophet said|muhammad said)\b|حديث|قال النبي|قال رسول/i.test(claim);
  if (explicitlyQuran && explicitlyHadith || corpusSelection === 'hadith' && explicitlyQuran || corpusSelection === 'quran' && explicitlyHadith) return fail('SOURCE_ATTRIBUTION_OR_SELECTION_MISMATCH');
  if (corpusSelection === 'quran') {
    let corpus: Corpus;
    try { corpus = loadCorpus(); } catch { return fail('CORPUS_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
    base.corpus_manifest = corpus.manifest; base.corpus_sha256 = corpus.manifest.sha256;
    const citationError = checkExplicitCitation(corpus, claim); if (citationError) return fail(citationError);
    base.evidence_items = retrieve(corpus, claim).map(v => authenticateEvidence(corpus, v));
  } else {
    try {
      const corpus = loadHadith(); base.corpus_manifest = corpus.manifest; base.corpus_sha256 = corpus.manifest.sha256;
      const citationError = checkHadithCitation(corpus, claim, inputLanguage); if (citationError) return fail(citationError);
      base.evidence_items = retrieveHadith(corpus, claim, inputLanguage).map(record => authenticateHadith(corpus, record));
    } catch { return fail('HADITH_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
  }
  base.retrieval_ids = base.evidence_items.map(e => e.evidence_id);
  if (base.evidence_items.some(e => !e.integrity.passed)) return fail('CITATION_INTEGRITY_FAILURE');
  base.technical_verification_status = base.evidence_items.length ? 'passed' : 'no_candidates';
  if (!base.evidence_items.length) return sealRecord({ ...base, verdict: 'insufficient_within_selected_corpus', reason_codes: ['NO_RETRIEVED_EVIDENCE'], summary_ar: 'لم يسترجع البحث أدلة كافية من المجموعة المحددة.', summary_en: 'The search retrieved no evidence from the selected corpus. This does not establish that evidence does not exist.' });
  try {
    const { assessment, model, usage } = await assessClaim(claim, inputLanguage, base.evidence_items);
    base.model = model; base.usage = usage; base.semantic_assessment = assessment;
    const ids = new Set(base.evidence_items.map(e => e.evidence_id));
    if (assessment.atomic_claims.some(a => a.evidence_ids.some(id => !ids.has(id)))) return fail('SEMANTIC_REFERENCE_INVALID');
    if (assessment.atomic_claims.some(a => a.contradiction_basis === 'explicit_negation_or_incompatible_statement' && (!a.basis_evidence_id || !a.basis_quotation || !base.evidence_items.some(e => e.evidence_id === a.basis_evidence_id && e.quotation.includes(a.basis_quotation!))))) return fail('SEMANTIC_BASIS_QUOTATION_INVALID');
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
