# Explanation evidence and language diagnostics — 5 October 2026 Riyadh

The generator and prose reviewer now consume the same bounded, authenticated evidence view: all retrieved primary passages, context, locators, and separately attributed publisher explanation/reference/grade fields. Atomic proof remains restricted to each atom's cited immutable primary/context units. Commentary and extra prose citations cannot substitute for direct proof.

Final English/Arabic explanation review remains mandatory. Required provider diagnostics identify the rejected sentence, affected draft language, reason category and concise detail; these are retained in sealed review traces. Reasons distinguish translation mismatch, unproven statement, missing qualification, wrong reference/language, relationship mismatch and ambiguity. Review compares material meaning rather than word-for-word identity. Version: `source-focused-decision-v14-shared-evidence-diagnostics`.

## Validation

376/376 offline tests passed with two workers. The initial highly parallel run had seven five-second timeouts, with no assertion failures; its report is retained separately. Added controls check shared prose evidence, publisher attribution, unchanged per-atom proof scope, tampered evidence rejection, diagnostic preservation and contradictory-diagnostic rejection. Type checking and production build passed.

Five live controls matched expectations: W26 German accepted, its English equivalent accepted, deliberately reversed Arabic draft rejected, W24 French accepted, its English equivalent accepted. The negative control identifies the exact reversed Arabic sentence and explains that both material propositions were reversed relative to English and the source. Translation review remains active.

Each pair reuses identical recorded evidence and English/Arabic prose, changing only the original question and its whole-question atom. W24's extra prose citation, missing from the earlier proving packet, is now visible to the prose reviewer. W26's previously rejected accurate draft passed in German and English.

This supports an evidence/context and review-instruction problem for these known failures, rather than inability to understand German/French. It does not isolate which prompt change caused each improvement, exclude model variation, establish quality in every language, or test end-to-end multilingual retrieval. These are two paired known cases and one faulty draft, not five new questions or an updated accuracy benchmark. The frozen 23/30 score remains unchanged. Promise/oath and direct knowledge-comparison retrieval remain separate repair targets.

## Budget and records

User authorized cap 37 SAR after the initial 36 SAR budget guard blocked the second call before network use. The completed German call was preserved and not repeated on resumption.

Five checks settled at 0.404135625 SAR. Conservative development commitment is 35.8315078125/37 SAR, approximately 1.1685 SAR remaining. Separate 15 SAR judging reserve preserved.

Public result: `artifacts/explanation-language-diagnostics-live-2026-10-05.json`. Offline result: `artifacts/explanation-diagnostics-offline-confirmed-2026-10-05.json`. Full requests and outputs remain private. Runner: `scripts/diagnose-language-live.mjs`.
