import { z } from 'zod';

export const verdictSchema = z.enum(['supported_within_selected_corpus', 'conflicting_within_selected_corpus', 'insufficient_within_selected_corpus', 'not_evaluated']);
export const relationSchema = z.enum(['supports', 'contradicts', 'partial', 'unrelated', 'not_assessed']);
export const integrityCheckSchema = z.object({ id: z.string(), passed: z.boolean(), reason: z.string() });
export const evidenceSchema = z.object({
  evidence_id: z.string(), source_id: z.string(), title: z.string(), version: z.string(), locator: z.string(),
  quotation: z.string(), quotation_sha256: z.string(), source_url: z.string(), attribution: z.string(),
  integrity: z.object({ passed: z.boolean(), checks: z.array(integrityCheckSchema) }), semantic_relation: relationSchema,
  source_context: z.array(z.object({ position: z.enum(['preceding', 'following']), locator: z.string(), quotation: z.string(), quotation_sha256: z.string(), integrity_passed: z.boolean() })),
  source_language: z.string().optional(), publisher_fields: z.record(z.string(), z.string().nullable()).optional(),
  publisher_grade_status: z.literal('publisher_supplied_not_independently_graded').optional(), publisher_notice: z.string().optional(),
});
export const usageSchema = z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative(), estimated_cost_usd: z.number().nonnegative(), reservation_id: z.string() });
export const sourceIdentificationSchema = z.object({ status: z.enum(['identified', 'ambiguous', 'not_identified']), corpus: z.enum(['quran', 'hadith']).nullable(), method: z.enum(['explicit_attribution', 'exact_quotation', 'normalized_quotation', 'none']), candidate_locators: z.array(z.string()).max(16), note: z.string().max(2000) });
export type SourceIdentification = z.infer<typeof sourceIdentificationSchema>;
export const recordSchema = z.object({
  record_id: z.string(), original_claim: z.string(), verdict: verdictSchema, reason_codes: z.array(z.string()),
  summary_ar: z.string(), summary_en: z.string(), evidence_items: z.array(evidenceSchema), limitations: z.array(z.string()),
  created_at: z.string(), model: z.string(), technical_verification_status: z.string(), human_scholarly_status: z.string(),
  linguistic_review_status: z.string(), audit_hash: z.string(),
  input_language: z.enum(['ar', 'en']), corpus_manifest: z.unknown().nullable(), corpus_sha256: z.string().nullable(),
  retrieval_ids: z.array(z.string()), semantic_assessment: z.unknown().nullable(),
  prompt_version: z.string(), schema_version: z.string(), usage: usageSchema.nullable(),
  corpus_selection: z.enum(['quran', 'hadith']),
  router_version: z.string().optional(),
  assessment_attempts: z.array(z.object({ model: z.string(), reason: z.string(), raw_assessment: z.unknown().nullable(), usage: usageSchema.nullable() })).max(2).optional(),
  source_identification: sourceIdentificationSchema.optional(),
});
export type VerificationRecord = z.infer<typeof recordSchema>;
export type EvidenceItem = z.infer<typeof evidenceSchema>;
export const semanticSchema = z.object({
  in_scope: z.boolean(), original_meaning_preserved: z.boolean(),
  atomic_claims: z.array(z.object({ id: z.string(), text: z.string(), material: z.boolean(),
    relation: z.enum(['supports', 'contradicts', 'partial', 'unrelated']), evidence_ids: z.array(z.string()),
    direct: z.boolean(), context_fit: z.boolean(), negation_checked: z.boolean(), modality_checked: z.boolean(),
    qualifications_preserved: z.boolean(), attribution_matched: z.boolean(), scope_matched: z.boolean(),
    contradiction_basis: z.enum(['explicit_negation_or_incompatible_statement', 'absence_only', 'none']),
    basis_evidence_id: z.string().nullable(), basis_quotation: z.string().nullable(),
  })).min(1).max(12),
  all_material_claims_covered: z.boolean(), summary_ar: z.string().max(2000), summary_en: z.string().max(2000),
  limitations: z.array(z.string()).max(12),
});
export type SemanticAssessment = z.infer<typeof semanticSchema>;
