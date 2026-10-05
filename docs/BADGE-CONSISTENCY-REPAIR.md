# Badge/proposition consistency repair — 5 October 2026 Riyadh

The fresh benchmark's X24 had a correct No explanation but an incorrect Supported badge. Its original affirmative proposition asked whether noble lineage advances someone held back by their deeds. HadeethEnc 4801 explicitly denies that proposition. The assessment and reviewer instead treated proof of the correct answer as support for the original proposition.

## Application changes

The existing independent source reviewer now must report `source_relationship` (`supports`, `contradicts`, `unproven`) separately from confirming the proposed relationship with `entails`. This field is required in current live structured output. The application compares it with each original proposition's proposed relation. Missing or disagreeing relationships cannot pass the current live review packet; a diagnostic triggers the existing single reassessment on the same authenticated evidence, followed by independent confirmation. Unresolved disagreement cannot produce a decisive badge. Raw provider responses and attempts are retained. Legacy persisted fixtures remain readable, but do not satisfy a current packet when the independent field is missing.

Generation and review instructions explicitly distinguish support for an answer from support for the proposition under test. Negative propositions remain eligible for Supported: the application does not flip labels based on the first word Yes/No or use a rule about negative wording. Final source review also rejects explicitly disagreeing relationships even if a caller reports that prose passed. Review version: `source-focused-decision-v15-independent-relationship`.

The initial two live controls then exposed separate retrieval instability: both missed 4801 and returned insufficient evidence before reaching review. Their routing/search variants overweighted short, unrelated “held back” passages. This failure is preserved rather than counted as success.

Hadith ranking now gives a length-independent candidate bonus when a rare concept from the original search query occurs with another original query concept in the same sentence of a narration. Hint-only terms cannot earn it. This avoids losing a precise sentence just because it is part of a long multi-topic report. No source IDs or expected references are pinned in production; publisher quotations, proof requirements and source integrity checks remain unchanged. Retrieval ranking is only candidate selection, not proof.

## Validation and limits

- Targeted badge checks passed, including disagreement in either direction, unproven/missing independent relationship, acceptance in either direction, final-gate protection, one successful reassessment and bounded failure if unresolved.
- Three captured search-wording variants retrieve 4801 in the English candidate window, preserving admitted source bytes.
- Initial full suite: 387 passed, two corpus-heavy tests exceeded five-second timeout. Rerun with 15-second timeout: 389/389 passed before retrieval change.
- Final full suite after both changes: **392/392 passed** with two workers and 15-second test timeout. Type checking and production build passed.
- Final live controls: **2/2 passed**. Original French question now receives Conflicting with a correct No explanation; matching negative statement receives Supported. Both cite authenticated en:4801 and independently confirmed matching relationships.
- Source-byte and nested-seal audits passed **4/4 captured records**, including the two initial retrieval failures. Principal developer reviewed the two final English/Arabic explanations against the original admitted report.

The frozen fresh benchmark remains **29/30 (96.7%)**. These two targeted repair controls are not a fresh 30/30 score, independent scholarly certification, or proof that all future questions will succeed. The live controls validated normal successful decisions; the forced disagreement-and-reassessment path was validated offline with injected provider responses.

Evidence: `artifacts/badge-consistency-with-retrieval-offline-2026-10-05.json`, `artifacts/badge-consistency-live-2026-10-05.json`, `artifacts/badge-consistency-live-after-retrieval-2026-10-05.json`, `artifacts/badge-consistency-audit-2026-10-05.json`. Complete provider records stay under ignored `artifacts/private`.

Total targeted API cost **0.3951594375 SAR**. Conservative development commitment **42.650854125/44 SAR**, leaving **1.349145875 SAR**. Separate **15 SAR judging reserve** preserved. Updated production build is running locally; no new paid benchmark started.
