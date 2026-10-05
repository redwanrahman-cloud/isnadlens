import { assessmentModels, isFirstTier, primaryModel } from './model-config';
import { CLAIM_LANGUAGES, type ClaimLanguage } from './claim-language';
import { randomUUID } from 'node:crypto';
import { loadCorpus, sha256, type Corpus, type Verse } from './corpus';
import { recordSchema, semanticSchema, sourceIdentificationSchema, type SourceIdentification, type EvidenceItem, type VerificationRecord, type SemanticAssessment } from './contracts';
import { scopeGate, decideVerdict, nativeSafetyGate, inputValidityGate, publicEvidenceRequest } from './policy';
import { retrieve, retrieveWithPublishedEnglishAid } from './retrieval';
import { assessClaim, reviewPositiveEntailment, reviewQualifiedExplanation, ENTAILMENT_VERSION, providerReady, PROMPT_VERSION, SCHEMA_VERSION, ProviderFailure, type EntailmentReview } from './provider';
import { loadHadith, retrieveHadith, authenticateHadith, getHadithCoverage, checkHadithCitation, type HadithCorpus } from './hadith';
import { parseQuranReferences, parseHadithLinks, extractClaimQuotes } from './citations';
import { planClaimQueries, validateQueryTerms, QUERY_PLANNER_VERSION, QueryPlannerFailure, type QueryOverrides } from './query-planner';
import { discoverWebReferences } from './web-discovery';
import {preserveWholeQuestion} from './source-decision';
import {vagueExceptionSummary} from './condition-summary';

export type { VerificationRecord } from './contracts';
export const ROUTER_VERSION = 'luna-terra-model-routing-v12-reviewed-explanation';
export function validPositiveReview(review: EntailmentReview, assessment: SemanticAssessment, evidence: EvidenceItem[]): boolean {
  const atoms = assessment.atomic_claims.filter(a => a.material);
  if (review.explanation_preserved !== true) return false;
  if (review.atoms.length !== atoms.length || new Set(review.atoms.map(a => a.atom_id)).size !== atoms.length) return false;
  return atoms.every(atom => {
    const check = review.atoms.find(a => a.atom_id === atom.id);
    if(check?.source_relationship!==undefined&&check.source_relationship!==atom.relation)return false;
    if (!check || check.entails !== 'yes' || !check.attribution_preserved || !check.qualifications_preserved || !check.evidence_id || !atom.evidence_ids.includes(check.evidence_id) || !check.basis_quotation?.trim()) return false;
    const card = evidence.find(e => e.evidence_id === check.evidence_id);
    const text = check.context_locator === null ? card?.quotation : card?.source_context.find(c => c.locator === check.context_locator && c.integrity_passed)?.quotation;
    return Boolean(card?.integrity.passed && text===check.basis_quotation) && (check.additional_basis??[]).every(b=>{const c=evidence.find(e=>e.evidence_id===b.evidence_id);const t=b.context_locator===null?c?.quotation:c?.source_context.find(u=>u.locator===b.context_locator&&u.integrity_passed)?.quotation;return Boolean(c?.integrity.passed&&atom.evidence_ids.includes(b.evidence_id)&&t===b.basis_quotation);});
  });
}
function semanticReferenceError(assessment: SemanticAssessment, evidence: EvidenceItem[]): string | null {
  if(/[\p{Script=Bengali}\p{Script=Devanagari}]/u.test(assessment.summary_ar))return 'ARABIC_SUMMARY_LANGUAGE_INVALID';
  const ids = new Set(evidence.map(item => item.evidence_id));
  if (assessment.atomic_claims.some(atom => atom.evidence_ids.some(id => !ids.has(id)))) return 'SEMANTIC_REFERENCE_INVALID';
  const invalidBasis=assessment.atomic_claims.some(atom=>{
    if(atom.contradiction_basis!=='explicit_negation_or_incompatible_statement')return false;
    const quote=atom.basis_quotation;
    if(!atom.basis_evidence_id||!quote?.trim())return true;
    return !evidence.some(item=>item.evidence_id===atom.basis_evidence_id && item.integrity.passed &&
      (item.quotation.includes(quote)||item.source_context.some(c=>c.integrity_passed&&sha256(c.quotation)===c.quotation_sha256&&c.quotation.includes(quote))));
  });
  if(invalidBasis)return 'SEMANTIC_BASIS_QUOTATION_INVALID';
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
  const source_context = ([-2, -1, 1, 2] as const).flatMap(offset => {
    const position = offset < 0 ? 'preceding' as const : 'following' as const;
    const neighbor = corpus.verses.find(v => v.surah === verse.surah && v.ayah === verse.ayah + offset);
    return neighbor ? [{ position, locator: neighbor.id, quotation: neighbor.display, quotation_sha256: neighbor.display_sha256, integrity_passed: sha256(neighbor.display) === neighbor.display_sha256 }] : [];
  });
  checks.push({ id: 'neighbor_context', passed: source_context.every(c => c.integrity_passed), reason: 'Bounded two-verse same-surah context matches admitted exact display hashes.' });
  return { evidence_id: `${corpus.manifest.id}:${verse.id}`, source_id: source.id, title: 'Quran — Tanzil Uthmani', version: source.version,
    locator: verse.id, quotation: verse.display, quotation_sha256: verse.display_sha256,
    source_url: `https://tanzil.net/#${verse.surah}:${verse.ayah}`, attribution: source.attribution,
    integrity: { passed: checks.every(c => c.passed), checks }, semantic_relation: 'not_assessed', source_context };
}
export function promoteSuppliedContext(corpus: Corpus, assessment: SemanticAssessment, evidence: EvidenceItem[]): { evidence: EvidenceItem[]; promotions: NonNullable<VerificationRecord['context_promotions']> } | null {
  if (evidence.length > 8) return null;
  const referenced = new Set(assessment.atomic_claims.flatMap(a => [...a.evidence_ids, ...(a.basis_evidence_id ? [a.basis_evidence_id] : [])]));
  const missing = [...referenced].filter(id => !evidence.some(e => e.evidence_id === id));
  if (!missing.length) return { evidence, promotions: [] };
  const additions: { card: EvidenceItem; parent: EvidenceItem }[] = [];
  for (const id of missing) {
    const parent = evidence.find(e => e.integrity.passed && e.source_context.some(c => `${corpus.manifest.id}:${c.locator}` === id));
    const ctx = parent?.source_context.find(c => `${corpus.manifest.id}:${c.locator}` === id);
    const verse = ctx && corpus.verses.find(v => v.id === ctx.locator);
    if (!parent || !ctx || !verse || !ctx.integrity_passed || ctx.quotation !== verse.display || ctx.quotation_sha256 !== verse.display_sha256 || sha256(ctx.quotation) !== ctx.quotation_sha256) return null;
    const card = authenticateEvidence(corpus, verse);
    if (!card.integrity.passed || card.evidence_id !== id || card.quotation !== ctx.quotation) return null;
    additions.push({ card, parent });
  }
  const next = [...evidence]; const promotions: NonNullable<VerificationRecord['context_promotions']> = [];
  for (const { card, parent } of additions) {
    let dropped: string | null = null;
    if (next.length >= 8) {
      const index = next.findLastIndex(e => !referenced.has(e.evidence_id) && !additions.some(a => a.parent.evidence_id === e.evidence_id));
      if (index < 0) return null;
      dropped = next.splice(index, 1)[0].evidence_id;
    }
    next.push(card); promotions.push({ parent_evidence_id: parent.evidence_id, context_locator: card.locator, added_evidence_id: card.evidence_id, quotation_sha256: card.quotation_sha256, dropped_evidence_id: dropped, method: 'supplied_exact_context_authenticated_as_primary' });
  }
  return { evidence: next, promotions };
}
export function getCoverage() {
  const hadith = getHadithCoverage();
  try { const corpus = loadCorpus(); return { hadith, approved: true, verse_count: corpus.verses.length, source: 'Tanzil Arabic Quran', provider_ready: providerReady(), available: true, corpus_id: corpus.manifest.id, version: corpus.manifest.version, corpus_sha256: corpus.manifest.sha256, verses: corpus.verses.length, sources: corpus.manifest.sources, input_languages: [...CLAIM_LANGUAGES], source_languages: ['ar'], semantic_provider_ready: providerReady(), limitations: ['Verification searches admitted Arabic Quran and selected Arabic/English Hadith; published passage translations are separate display only.', 'Bounded AI-assisted or lexical retrieval can miss relevant passages; absence is not a religious ruling.'] }; }
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
export async function verifyClaim({ claim, inputLanguage, corpusSelection = 'quran', sourceIdentification, useQueryPlanner = false, queryOverrides, scopeClaim, webLocators, retainedLocators, admittedTextual = false }: { claim: string; inputLanguage: ClaimLanguage; scopeClaim?: string; admittedTextual?: boolean; corpusSelection?: 'quran' | 'hadith' | 'both'; sourceIdentification?: SourceIdentification; useQueryPlanner?: boolean; queryOverrides?: QueryOverrides; retainedLocators?:{quran:string[];hadith:string[]}; webLocators?:{quran:string[];hadith:string[]} }): Promise<VerificationRecord> {
  const base: Omit<VerificationRecord, 'audit_hash'> = { record_id: randomUUID(), original_claim: typeof claim === 'string' ? claim : '', verdict: 'not_evaluated', reason_codes: [], summary_ar: 'لم يتم تقييم الادعاء.', summary_en: 'This claim has not been evaluated.', evidence_items: [], limitations: ['Results apply only to retrieved evidence in the admitted Arabic Quran edition.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'English explanations are not authoritative Quran translations.'], created_at: new Date().toISOString(), model: 'none', technical_verification_status: 'not_run', human_scholarly_status: 'not_reviewed', linguistic_review_status: 'not_reviewed', input_language: CLAIM_LANGUAGES.includes(inputLanguage) ? inputLanguage : 'en', corpus_manifest: null, corpus_sha256: null, retrieval_ids: [], semantic_assessment: null, prompt_version: PROMPT_VERSION, schema_version: SCHEMA_VERSION, usage: null, corpus_selection: 'quran' };
  base.corpus_selection = corpusSelection;
  base.router_version = ROUTER_VERSION; base.assessment_attempts = [];
  // This argument is populated by server-side source identification, never accepted from a raw API request.
  if (sourceIdentification) base.source_identification = sourceIdentificationSchema.parse(sourceIdentification);
  if (corpusSelection === 'hadith') base.limitations = ['Results apply only to bounded retrieved records from the admitted Arabic and English HadeethEnc editions; other published languages are separate display editions.', 'Publisher supplied grading and references are preserved; this tool does not independently authenticate hadith.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.', 'Arabic and English editions have different coverage; each record remains separately attributed and is never silently merged.'];
  if (corpusSelection === 'both') base.limitations = ['Search covers the admitted Arabic Quran edition and selected Arabic/English HadeethEnc records; it is not all Islamic literature.', 'Quran and Hadith evidence remain separately attributed; their quotations are never merged or silently substituted.', 'Publisher hadith grades are preserved, not independently authenticated.', 'A bounded retrieval can miss relevant passages; absence is not proof of a religious conclusion.', 'Model-assisted interpretation requires qualified human review; this is not a fatwa.'];
  const fail = (reason: string) => sealRecord({ ...base, reason_codes: [reason], ...(reason === 'OUTSIDE_SUPPORTED_CLAIM_SCOPE' ? {
    summary_ar: 'عدسة الإسناد مخصّصة للتحقق من الادعاءات المتعلقة بالقرآن والحديث، ولا تجيب عن الأسئلة العامة أو الطقس. اكتب ادعاءً واضحاً تريد فحصه في المصدر المحدد.',
    summary_en: 'IsnadLens verifies claims about the Quran and Hadith. It does not answer general questions or provide weather updates. Enter a clear claim to examine against the selected source.',
  } : {}) });
  if (typeof claim !== 'string' || !CLAIM_LANGUAGES.includes(inputLanguage)) return fail('INPUT_INVALID');
  if (!['quran', 'hadith', 'both'].includes(corpusSelection)) { base.corpus_selection = 'quran'; return fail('CORPUS_SELECTION_INVALID'); }
  const nativeBlocked = (admittedTextual ? inputValidityGate(claim) : nativeSafetyGate(claim)); if (nativeBlocked) return fail(nativeBlocked);
  const searchClaim = scopeClaim ?? claim;
  // Server-only routing admission; the API never accepts this flag from clients.
  const blocked = scopeGate(searchClaim, admittedTextual);
  const identifiedQuotation = sourceIdentification && (sourceIdentification.status === 'identified' && sourceIdentification.corpus === corpusSelection || corpusSelection === 'both' && sourceIdentification.status === 'ambiguous' && sourceIdentification.candidate_locators.length > 0) && ['exact_quotation', 'normalized_quotation'].includes(sourceIdentification.method);
  if (blocked && !(blocked === 'OUTSIDE_SUPPORTED_CLAIM_SCOPE' && identifiedQuotation)) return fail(blocked);
  if (inputLanguage === 'ar' && !/\p{Script=Arabic}/u.test(claim) || !['ar', 'ur', 'bn', 'hi'].includes(inputLanguage) && !/\p{Script=Latin}/u.test(claim) || inputLanguage === 'ur' && !/\p{Script=Arabic}/u.test(claim) || inputLanguage === 'bn' && !/\p{Script=Bengali}/u.test(claim) || inputLanguage === 'hi' && !/\p{Script=Devanagari}/u.test(claim)) return fail('INPUT_LANGUAGE_MISMATCH');
  const explicitlyQuran = /\b(quran|qur'an|koran)\b|قرآن|القران/i.test(claim + " " + searchClaim) || parseQuranReferences(claim).references.length > 0;
  const explicitlyHadith = /\b(hadith|hadeeth|prophet said|muhammad said)\b|حديث|قال النبي|قال رسول/i.test(claim + " " + searchClaim) || parseHadithLinks(claim).links.length > 0;
  if (corpusSelection !== 'both' && explicitlyQuran && explicitlyHadith || corpusSelection === 'hadith' && explicitlyQuran || corpusSelection === 'quran' && explicitlyHadith) return fail('SOURCE_ATTRIBUTION_OR_SELECTION_MISMATCH');
  const malformed = parseQuranReferences(claim).error ?? parseHadithLinks(claim).error; if (malformed) return fail(malformed);
  const retrievalLanguage: 'ar' | 'en' = inputLanguage === 'ar' ? 'ar' : 'en';
  let quran: Corpus | undefined; let hadith: HadithCorpus | undefined;
  if (corpusSelection !== 'hadith') {
    try { quran = loadCorpus(); } catch { return fail('CORPUS_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
    const citationError = checkExplicitCitation(quran, claim); if (citationError) return fail(citationError);
  }
  if (corpusSelection !== 'quran') {
    try { hadith = loadHadith(); } catch { return fail('HADITH_INTEGRITY_OR_AVAILABILITY_FAILURE'); }
    const citationError = checkHadithCitation(hadith, claim, retrievalLanguage); if (citationError) return fail(citationError);
  }
  if (quran && hadith) {
    const componentHashes = { quran: quran.manifest.sha256, hadith: hadith.manifest.sha256 };
    const digest = sha256(JSON.stringify(componentHashes));
    base.corpus_manifest = { id: 'combined-quran-hadith', version: `${quran.manifest.version};${hadith.manifest.version}`, sha256: digest, components: { quran: quran.manifest, hadith: hadith.manifest } };
    base.corpus_sha256 = digest;
  } else { const manifest = quran?.manifest ?? hadith!.manifest; base.corpus_manifest = manifest; base.corpus_sha256 = manifest.sha256; }
  let overrides: QueryOverrides = { arabic_terms: [], english_terms: [] };
  if (queryOverrides) {
    try { overrides = validateQueryTerms(queryOverrides, Boolean(scopeClaim)); } catch { return fail('QUERY_PLAN_TERM_INVALID'); }
    base.retrieval_plan = { ...overrides, status: 'provided', reason: 'SERVER_PROVIDED_SEARCH_TERMS', model: 'none', usage: null, planner_version: QUERY_PLANNER_VERSION };
  } else if (useQueryPlanner) {
    try {
      const plan = await planClaimQueries({ claim: searchClaim, inputLanguage: retrievalLanguage, admittedTextual }); overrides = { arabic_terms: plan.arabic_terms, english_terms: plan.english_terms };
      base.retrieval_plan = { ...plan, status: 'planned', reason: 'BOUNDED_AI_SEARCH_EXPANSION' };
    } catch (error) {
      base.retrieval_plan = { ...overrides, status: 'lexical_fallback', reason: error instanceof Error ? error.message : 'QUERY_PLAN_UNAVAILABLE', model: error instanceof QueryPlannerFailure ? error.model : 'none', usage: error instanceof QueryPlannerFailure ? error.usage : null, planner_version: QUERY_PLANNER_VERSION };
      base.limitations.push('AI search planning was unavailable; deterministic lexical retrieval was used instead.');
    }
  }
  const fallbackQueries = scopeClaim && !queryOverrides && !useQueryPlanner ? [scopeClaim.slice(0, 160)] : [];
  if (fallbackQueries.length) {
    base.retrieval_plan = { arabic_terms: [], english_terms: [], status: 'lexical_fallback', reason: 'INTAKE_NO_USABLE_SEARCH_HINTS', model: 'none', usage: null, planner_version: QUERY_PLANNER_VERSION };
    base.limitations.push('No usable intake search hints remained; retrieval used the original input and a bounded neutral routing gloss as lexical queries only. No generated locator or quotation was trusted.');
  }
  const quranHints = overrides.arabic_terms.flatMap((term, index) => [term, ...(overrides.english_terms[index] ? [overrides.english_terms[index]] : [])]);
  for (let index = overrides.arabic_terms.length; index < overrides.english_terms.length; index++) quranHints.push(overrides.english_terms[index]);
  if (quran) {
    const queries = [...quranHints, ...fallbackQueries].slice(0, 20);
    let verses: Verse[];
    const plan = base.retrieval_plan ?? { status: 'provided' as const, reason: 'PUBLISHED_ENGLISH_QUERY_READING_AID', model: 'none', arabic_terms: [], english_terms: [], usage: null, planner_version: QUERY_PLANNER_VERSION };
    try {
      const result = retrieveWithPublishedEnglishAid(quran, claim, hadith ? 4 : 8, queries, scopeClaim ?? claim);
      verses = result.verses;
      base.retrieval_plan = { ...plan, reading_aid: result.reading_aid, reading_aid_status: 'used' };
      base.limitations.push('The admitted QuranEnc English edition was used only to locate Arabic Quran passages. Its version/hash is recorded as a query reading aid; only immutable Arabic primary quotations entered the evidence assessment.');
    } catch {
      verses = retrieve(quran, claim, hadith ? 4 : 8, queries);
      base.retrieval_plan = { ...plan, reading_aid_status: 'unavailable_or_integrity_failure' };
      base.limitations.push('The published English query reading aid was unavailable or failed integrity validation. Retrieval fell back to Arabic corpus lexical search; no reading-aid integrity approval is claimed.');
    }
    base.evidence_items.push(...verses.map(verse => authenticateEvidence(quran!, verse)));
  }
  if (hadith) {
      const perLanguage = quran ? 2 : 4; const hadithLimit = quran ? 4 : 8;
      const preferred = retrieveHadith(hadith, retrievalLanguage === 'en' ? searchClaim : claim, retrievalLanguage, perLanguage, [...(retrievalLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms), ...fallbackQueries], claim);
      const otherLanguage = retrievalLanguage === 'ar' ? 'en' : 'ar';
      const other = retrieveHadith(hadith, otherLanguage === 'en' ? searchClaim : claim, otherLanguage, perLanguage, [...(otherLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms), ...fallbackQueries], claim);
      const chosen = [...preferred, ...other];
      if (chosen.length < hadithLimit) for (const record of retrieveHadith(hadith, retrievalLanguage === 'en' ? searchClaim : claim, retrievalLanguage, hadithLimit, [...(retrievalLanguage === 'ar' ? overrides.arabic_terms : overrides.english_terms), ...fallbackQueries], claim)) if (chosen.length < hadithLimit && !chosen.some(item => item.language === record.language && item.id === record.id)) chosen.push(record);
      base.evidence_items.push(...chosen.map(record => authenticateHadith(hadith!, record)));
  }
  // Internal-only discovered IDs seed existing immutable source cards, never generated web text.
  if(webLocators){
    const discovered:EvidenceItem[]=[];
    if(quran)for(const id of webLocators.quran.slice(0,4)){const verse=quran.verses.find(v=>v.id===id);if(verse)discovered.push(authenticateEvidence(quran,verse));}
    if(hadith)for(const id of webLocators.hadith.slice(0,4)){const record=hadith.records.find(r=>`${r.language}:${r.id}`===id&&['ar','en'].includes(r.language));if(record)discovered.push(authenticateHadith(hadith,record));}
    base.evidence_items=[...new Map([...discovered,...base.evidence_items].map(e=>[e.evidence_id,e])).values()].slice(0,8);
  }
  if(retainedLocators){
    // Server-only previous-candidate IDs are reauthenticated, never trusted as supplied text.
    const retained:EvidenceItem[]=[];
    if(quran)for(const id of retainedLocators.quran){const verse=quran.verses.find(v=>v.id===id);if(verse)retained.push(authenticateEvidence(quran,verse));}
    if(hadith)for(const id of retainedLocators.hadith){const record=hadith.records.find(r=>`${r.language}:${r.id}`===id&&['ar','en'].includes(r.language));if(record)retained.push(authenticateHadith(hadith,record));}
    base.evidence_items=[...new Map([...retained.slice(0,4),...base.evidence_items].map(e=>[e.evidence_id,e])).values()].slice(0,8);
    base.limitations.push('Up to four previously relevant source cards were reauthenticated and retained alongside the new bounded search candidates.');
  }
  base.retrieval_ids = base.evidence_items.map(e => e.evidence_id);
  if (base.evidence_items.some(e => !e.integrity.passed)) return fail('CITATION_INTEGRITY_FAILURE');
  base.technical_verification_status = base.evidence_items.length ? 'passed' : 'no_candidates';
  if (!base.evidence_items.length) return sealRecord({ ...base, verdict: 'insufficient_within_selected_corpus', reason_codes: ['NO_RETRIEVED_EVIDENCE'], summary_ar: 'لم يسترجع البحث أدلة كافية من المجموعة المحددة.', summary_en: 'The search retrieved no evidence from the selected corpus. This does not establish that evidence does not exist.' });
  try {
    let result: Awaited<ReturnType<typeof assessClaim>> | null = null;
    const models = assessmentModels();
    for (const requestedModel of models) {
      try { result = await assessClaim(claim, inputLanguage, base.evidence_items, requestedModel); }
      catch (error) {
        base.assessment_attempts!.push({ model: error instanceof ProviderFailure ? error.model : requestedModel, reason: error instanceof Error ? error.message : 'PROVIDER_UNAVAILABLE', raw_assessment: null, usage: error instanceof ProviderFailure ? error.usage : null });
        throw error;
      }
      base.model = result.model; base.usage = result.usage; base.semantic_assessment = result.assessment;
      if (quran) {
        const promoted = promoteSuppliedContext(quran, result.assessment, base.evidence_items);
        if (promoted?.promotions.length && (base.context_promotions?.length ?? 0) + promoted.promotions.length <= 8) {
          base.evidence_items = promoted.evidence; base.retrieval_ids = promoted.evidence.map(e => e.evidence_id);
          base.context_promotions = [...(base.context_promotions ?? []), ...promoted.promotions];
          base.limitations.push('An already-supplied exact Quran neighbor was authenticated as a primary card to resolve its cited ID. The promotion and any removed unreferenced card are sealed; raw model assessments remain unchanged.');
        }
      }
      const invalid = semanticReferenceError(result.assessment, base.evidence_items);
      // A proposed explicit contradiction needs confirmation even if the first
      // model marked a qualification false. Never flip those flags by code.
      const conflictNeedsConfirmation = isFirstTier(requestedModel) && !invalid && result.assessment.in_scope && result.assessment.original_meaning_preserved && result.assessment.atomic_claims.some(a => a.material && a.relation === 'contradicts' && a.contradiction_basis === 'explicit_negation_or_incompatible_statement' && a.basis_evidence_id && a.basis_quotation);
      const scopeNeedsConfirmation = isFirstTier(requestedModel) && !result.assessment.in_scope && (admittedTextual || publicEvidenceRequest(searchClaim));
      const atoms = result.assessment.atomic_claims.filter(a => a.material);
      const supportFlagsNeedConfirmation = isFirstTier(requestedModel) && !invalid && result.assessment.in_scope && result.assessment.original_meaning_preserved && result.assessment.all_material_claims_covered && atoms.length > 0 && atoms.every(a => a.relation === 'supports') && decideVerdict(result.assessment, new Set(base.retrieval_ids)) === 'insufficient_within_selected_corpus';
      const summaryNeedsConfirmation=isFirstTier(requestedModel)&&!invalid&&['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(decideVerdict(result.assessment,new Set(base.retrieval_ids)))&&vagueExceptionSummary(result.assessment.summary_en,result.assessment.summary_ar);
      base.assessment_attempts!.push({ model: result.model, reason: invalid ?? (scopeNeedsConfirmation ? 'PUBLIC_SOURCE_SCOPE_CONFIRMATION_REQUIRED' : supportFlagsNeedConfirmation ? 'SUPPORT_FLAGS_CONFIRMATION_REQUIRED' : conflictNeedsConfirmation ? 'CONTRADICTION_CONFIRMATION_REQUIRED' : summaryNeedsConfirmation?'QUALIFICATION_DETAIL_REVIEW_REQUIRED':'SEMANTIC_VALIDATION_PASSED'), raw_assessment: result.assessment, usage: result.usage });
      if (!invalid && !conflictNeedsConfirmation && !scopeNeedsConfirmation && !supportFlagsNeedConfirmation && !summaryNeedsConfirmation) break;
      // Exactly one strong reassessment for invalid semantic references or a proposed mini contradiction.
      // A screened public source question gets one scope reassessment; private/sensitive gates remain pre-provider.
      // Ordinary insufficiency, provider errors and source corruption never trigger it.
      if (!isFirstTier(requestedModel) || (!result.assessment.in_scope && !scopeNeedsConfirmation) || !result.assessment.original_meaning_preserved) return fail(invalid ?? 'CONTRADICTION_UNCONFIRMED');
    }
    if (!result) return fail('SEMANTIC_SCHEMA_OR_PROVIDER_FAILURE');
    let assessment = result.assessment;
    const ids = new Set(base.evidence_items.map(e => e.evidence_id));
    base.verdict = decideVerdict(assessment, ids);
    if(['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(base.verdict)&&vagueExceptionSummary(assessment.summary_en,assessment.summary_ar)){base.verdict='not_evaluated';return fail('QUALIFICATION_DETAIL_UNCONFIRMED');}
    let restoredFirstCandidate=false;
    if(base.verdict==='insufficient_within_selected_corpus' && assessment.in_scope && assessment.original_meaning_preserved && assessment.all_material_claims_covered && assessment.atomic_claims.some(a=>a.material&&a.relation==='contradicts') && base.assessment_attempts?.length===2){
      const first=base.assessment_attempts[0];const parsed=semanticSchema.safeParse(first.raw_assessment);
      if(parsed.success && !semanticReferenceError(parsed.data,base.evidence_items) && decideVerdict(parsed.data,ids)==='conflicting_within_selected_corpus'){
        // Preserve the failed stronger assessment unchanged. The earlier candidate
        // still needs a source-blind meaning check AND independent source confirmation.
        assessment=parsed.data;base.semantic_assessment=assessment;base.model=first.model;base.usage=first.usage;
        base.verdict='conflicting_within_selected_corpus';restoredFirstCandidate=true;
        base.assessment_selection_reason='previous_contradiction_after_flag_disagreement';
      }
    }
    if (base.verdict === 'supported_within_selected_corpus' || base.verdict === 'conflicting_within_selected_corpus') {
      let decisionMode:'decision'|'support'=base.verdict==='conflicting_within_selected_corpus'?'decision':'support';
      base.limitations.push('A separate source-focused model check evaluates proposed support or contradiction and preservation of the original question; it is not independent scholarly review and can still err. Its additional usage is sealed separately.');
      try {
        const preserveCandidate=()=>{
          const exact=preserveWholeQuestion(claim,assessment);
          if(exact!==assessment){assessment=exact;base.semantic_assessment=exact;base.proposition_derivation='single_material_proposition_uses_whole_original_input';}
        };
        preserveCandidate();
        let checked = await reviewPositiveEntailment(claim, assessment, base.evidence_items, decisionMode);
        const recordMeaning = () => {
          if(checked.meaning_check)base.meaning_review_attempts=[...(base.meaning_review_attempts??[]),{assessment_model:base.model, ...checked.meaning_check}];
          base.source_review_attempts=[...(base.source_review_attempts??[]),{assessment_model:base.model,mode:decisionMode,version:ENTAILMENT_VERSION,input_assessment:assessment,review:checked.review,raw_provider_review:checked.raw_provider_review,unit_provenance:checked.unit_provenance,model:checked.model,usage:checked.usage}];
        };
        recordMeaning();
        // Prose or badge/answer disagreement is not a retrieval failure. Reassess once on the SAME
        // authenticated evidence, then independently review the replacement.
        if(checked.review.explanation_preserved===false && base.assessment_attempts?.length===1 && assessmentModels().length>1){
          const strong=assessmentModels()[1];
          const revised=await assessClaim(claim,inputLanguage,base.evidence_items,strong);
          base.assessment_attempts.push({model:revised.model,reason:checked.review.explanation_diagnostic?.reason==='relationship_mismatch'?'VERDICT_EXPLANATION_REASSESSMENT':'FINAL_EXPLANATION_REASSESSMENT',raw_assessment:revised.assessment,usage:revised.usage});
          const revisedVerdict=decideVerdict(revised.assessment,new Set(base.retrieval_ids));
          if(semanticReferenceError(revised.assessment,base.evidence_items)||!['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(revisedVerdict))return fail('FINAL_EXPLANATION_UNCONFIRMED');
          assessment=revised.assessment;base.semantic_assessment=assessment;base.model=revised.model;base.usage=revised.usage;base.verdict=revisedVerdict;
          restoredFirstCandidate=true;
          decisionMode=revisedVerdict==='conflicting_within_selected_corpus'?'decision':'support';
          preserveCandidate();
          checked=await reviewPositiveEntailment(claim,assessment,base.evidence_items,decisionMode);recordMeaning();
        }
        // A reassessment can accidentally answer instead of representing the question.
        // Reuse only an already recorded, structurally valid first candidate; it must
        // independently pass both meaning and source checks. No forced verdict or new loop.
        if(!restoredFirstCandidate && (checked.meaning_check?.review.faithful==='no'||base.proposition_derivation&&!validPositiveReview(checked.review,assessment,base.evidence_items)) && base.assessment_attempts?.length===2){
          const first=base.assessment_attempts[0];
          const parsed=semanticSchema.safeParse(first.raw_assessment);
          if(parsed.success && !semanticReferenceError(parsed.data,base.evidence_items)){
            const candidateVerdict=decideVerdict(parsed.data,ids);
            if(candidateVerdict==='supported_within_selected_corpus'||candidateVerdict==='conflicting_within_selected_corpus'){
              assessment=parsed.data;base.semantic_assessment=assessment;base.model=first.model;base.usage=first.usage;base.verdict=candidateVerdict;
              restoredFirstCandidate=true;base.assessment_selection_reason=checked.meaning_check?.review.faithful==='no'?'previous_candidate_after_meaning_rejection':'previous_candidate_after_source_rejection';
              decisionMode=candidateVerdict==='conflicting_within_selected_corpus'?'decision':'support';
              preserveCandidate();
              checked=await reviewPositiveEntailment(claim,assessment,base.evidence_items,decisionMode);recordMeaning();
            }
          }
        }
        const passed = validPositiveReview(checked.review, assessment, base.evidence_items);
        base.entailment_review = { version: ENTAILMENT_VERSION, model: checked.model, status: passed ? 'passed' : 'rejected', raw_review: checked.review, raw_provider_review: checked.raw_provider_review, unit_provenance: checked.unit_provenance, derivation: 'whole_immutable_selected_source_unit', usage: checked.usage, reason: passed ? 'SOURCE_ENTAILMENT_CONFIRMED' : 'SOURCE_ENTAILMENT_UNCONFIRMED' };
        if (!passed) { base.verdict = 'not_evaluated'; return fail(checked.review.explanation_preserved!==true?'FINAL_EXPLANATION_UNCONFIRMED':decisionMode==='decision'?'CLAIM_MEANING_OR_CONTRADICTION_UNCONFIRMED':'SOURCE_ENTAILMENT_UNCONFIRMED'); }
      } catch (error) {
        base.entailment_review = { version: ENTAILMENT_VERSION, model: error instanceof ProviderFailure ? error.model : primaryModel(), status: 'unavailable', raw_review: null, usage: error instanceof ProviderFailure ? error.usage : null, reason: error instanceof Error ? error.message : 'PROVIDER_UNAVAILABLE' };
        base.verdict = 'not_evaluated'; return fail('SOURCE_ENTAILMENT_UNAVAILABLE');
      }
    }
    if(['supported_within_selected_corpus','conflicting_within_selected_corpus'].includes(base.verdict)&&vagueExceptionSummary(assessment.summary_en,assessment.summary_ar)){base.verdict='not_evaluated';return fail('QUALIFICATION_DETAIL_UNCONFIRMED');}
    base.summary_ar = assessment.summary_ar; base.summary_en = assessment.summary_en;
    // The sealed final decision controls the headline; retain the raw model prose in semantic_assessment.
    if (base.verdict === 'insufficient_within_selected_corpus') {
      base.summary_ar = 'الأدلة المسترجعة لا تكفي لإثبات الادعاء كاملًا أو نقضه ضمن مجموعة المصادر المحددة. هذا لا يعني عدم وجود دليل في موضع آخر.';
      base.summary_en = 'The retrieved evidence is insufficient to establish or contradict the complete claim within the selected corpus. This does not mean evidence is absent elsewhere.';
      const material=assessment.atomic_claims.filter(a=>a.material);
      // Only a directly evidenced narrower condition/audience is eligible.
      // Missing retrieval, unrelated evidence and unpreserved meanings cannot qualify.
      if(assessment.in_scope&&assessment.original_meaning_preserved&&material.some(a=>['partial','supports'].includes(a.relation)&&a.direct&&a.context_fit&&a.negation_checked&&a.modality_checked&&a.attribution_matched&&a.evidence_ids.length)&&!vagueExceptionSummary(assessment.summary_en,assessment.summary_ar)){
        const draft={draft_en:assessment.summary_en,draft_ar:assessment.summary_ar};
        try{
          const checked=await reviewQualifiedExplanation(claim,assessment,base.evidence_items);
          const r=checked.review.atoms[0],card=base.evidence_items.find(e=>e.evidence_id===r?.evidence_id);
          const text=r?.context_locator===null?card?.quotation:card?.source_context.find(c=>c.locator===r?.context_locator&&c.integrity_passed)?.quotation;
          const cited=new Set(material.flatMap(a=>a.evidence_ids));
          const passed=checked.review.explanation_preserved===true&&checked.review.atoms.length===1&&r.atom_id==='qualified_explanation'&&r.entails==='yes'&&r.attribution_preserved&&r.qualifications_preserved&&Boolean(card?.integrity.passed&&cited.has(card.evidence_id)&&r.basis_quotation&&text===r.basis_quotation)&&(r.additional_basis??[]).every(b=>{const c=base.evidence_items.find(e=>e.evidence_id===b.evidence_id);const t=b.context_locator===null?c?.quotation:c?.source_context.find(u=>u.locator===b.context_locator&&u.integrity_passed)?.quotation;return Boolean(c?.integrity.passed&&cited.has(b.evidence_id)&&t===b.basis_quotation);});
          base.qualified_explanation_review={version:'qualified-explanation-v2',...draft,model:checked.model,status:passed?'passed':'rejected',raw_review:checked.review,raw_provider_review:checked.raw_provider_review,unit_provenance:checked.unit_provenance,usage:checked.usage,reason:passed?'QUALIFIED_EXPLANATION_SOURCE_CONFIRMED':'QUALIFIED_EXPLANATION_UNCONFIRMED'};
          if(passed){base.summary_en=`Qualified explanation: ${assessment.summary_en} The complete claim is not established as worded.`;base.summary_ar=`توضيح مقيّد: ${assessment.summary_ar} لم يثبت الادعاء كاملًا بصيغته الواردة.`;}
        }catch(error){base.qualified_explanation_review={version:'qualified-explanation-v2',...draft,model:error instanceof ProviderFailure?error.model:primaryModel(),status:'unavailable',raw_review:null,usage:error instanceof ProviderFailure?error.usage:null,reason:error instanceof Error?error.message:'PROVIDER_UNAVAILABLE'};}
      }
    } else if (base.verdict === 'not_evaluated') {
      base.summary_ar = 'لم يتم التحقق من هذا الادعاء؛ يلزم الرجوع إلى سبب التوقف المعروض.';
      base.summary_en = 'This claim has not been verified; see the displayed reason for the stop.';
    }
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

function usefulLocators(record:VerificationRecord):{quran:string[];hadith:string[]}{
  const parsed=semanticSchema.safeParse(record.semantic_assessment);
  const ids=new Set(parsed.success?parsed.data.atomic_claims.filter(a=>a.material&&['supports','partial'].includes(a.relation)&&a.direct&&a.context_fit).flatMap(a=>a.evidence_ids):[]);
  const cards=record.evidence_items.filter(e=>ids.has(e.evidence_id)&&e.integrity.passed).slice(0,4);
  return {quran:cards.filter(e=>e.source_id.startsWith('QURAN-')).map(e=>e.locator),hadith:cards.filter(e=>!e.source_id.startsWith('QURAN-')).map(e=>e.locator)};
}

/** One additional search plan for an evidence gap, never a recursive retry or a verdict override. */
async function verifyClaimWithLocalRecovery(options: Parameters<typeof verifyClaim>[0]): Promise<VerificationRecord> {
  const first = await verifyClaim(options);
  if(first.qualified_explanation_review?.status==='passed'||first.qualified_explanation_review?.status==='unavailable')return first;
  const assessment = first.semantic_assessment as SemanticAssessment | null;
  const missing = first.verdict === 'insufficient_within_selected_corpus' &&
    (first.reason_codes.includes('NO_RETRIEVED_EVIDENCE') || assessment?.in_scope && assessment.original_meaning_preserved && assessment.atomic_claims.filter(a=>a.material).every(a=>['partial','unrelated'].includes(a.relation)));
  const uncertainSupport = first.reason_codes.includes('SOURCE_ENTAILMENT_UNCONFIRMED');
  if (!missing && !uncertainSupport || !providerReady()) return first;
  const {audit_hash: omitted,...initialPayload} = first; void omitted;
  let plan: Awaited<ReturnType<typeof planClaimQueries>>;
  try { plan = await planClaimQueries({claim:options.scopeClaim ?? options.claim,inputLanguage:options.scopeClaim?'en':options.inputLanguage==='ar'?'ar':'en',admittedTextual:options.admittedTextual}); }
  catch (error) {
    return sealRecord({...initialPayload,retrieval_recovery:{version:'bounded-retrieval-recovery-v1',status:'unavailable',reason:error instanceof QueryPlannerFailure?error.message:'QUERY_PLAN_UNAVAILABLE',first_record:first,usage:error instanceof QueryPlannerFailure?error.usage:null}});
  }
  const second = await verifyClaim({...options,retainedLocators:usefulLocators(first),useQueryPlanner:false,queryOverrides:{arabic_terms:plan.arabic_terms,english_terms:plan.english_terms}});
  const {audit_hash: discarded,...payload} = second; void discarded;
  return sealRecord({...payload,retrieval_recovery:{version:'bounded-retrieval-recovery-v1',status:'completed',reason:'ONE_ALTERNATIVE_SEARCH_FOR_EVIDENCE_GAP',first_record:first,usage:plan.usage,rejected_search_term_count:plan.rejected_search_term_count},limitations:[...second.limitations,'One bounded alternative search was attempted after incomplete evidence. The complete first sealed result and extra planning usage are retained; no original verdict was rewritten.']});
}

/** At most one online discovery run, after eligible local evidence recovery. */
export async function verifyClaimWithRecovery(options:Parameters<typeof verifyClaim>[0]):Promise<VerificationRecord>{
  const previous=await verifyClaimWithLocalRecovery(options);
  if(previous.qualified_explanation_review?.status==='passed'||previous.qualified_explanation_review?.status==='unavailable')return previous;
  if(process.env.ISNADLENS_WEB_SEARCH_ENABLED!=='true'||!providerReady())return previous;
  const a=previous.semantic_assessment as SemanticAssessment|null;
  const eligible=previous.verdict==='insufficient_within_selected_corpus'&&(!a||a.in_scope&&a.original_meaning_preserved)||previous.reason_codes.includes('SOURCE_ENTAILMENT_UNCONFIRMED');
  const operational=previous.reason_codes.some(r=>/BUDGET|SPEND|PROVIDER|INTEGRITY|REFERRAL|INPUT|MALFORMED|MISMATCH/.test(r))||previous.retrieval_recovery?.status==='unavailable'&&!['QUERY_PLAN_TERM_INVALID','QUERY_PLAN_SCHEMA_INVALID'].includes(previous.retrieval_recovery.reason);
  if(!eligible||operational)return previous;
  const discovery=await discoverWebReferences(options.claim,options.scopeClaim??options.claim,options.corpusSelection??'quran',options.admittedTextual);
  const attempted=discovery.status==='completed'&&(discovery.quran_locators.length>0||discovery.hadith_locators.length>0);
  const result=attempted?await verifyClaim({...options,retainedLocators:usefulLocators(previous),useQueryPlanner:false,webLocators:{quran:discovery.quran_locators,hadith:discovery.hadith_locators}}):previous;
  const {audit_hash:omitted,...payload}=result;void omitted;
  return sealRecord({...payload,web_discovery:{...discovery,previous_record:previous,verification_attempted:attempted},limitations:[...result.limitations,'Online search discovers references only. Quran and Hadith conclusions are rechecked against immutable admitted passages. Al-Ifta links are attributed guidance, not a verified scripture verdict.']});
}
