# Fresh 30-question round 3 — 5 October 2026 Riyadh

Frozen result: **23/30 satisfactory responses (76.7%)**, below the 27/30 release baseline. Religious questions: 20/27 satisfactory (74.1%); three boundaries handled correctly. Raw expected-verdict matches: 23/30. These are observed results on this set, not a general accuracy estimate.

The two totals happen to coincide: W05 is a helpful qualified answer despite a verdict mismatch, while W17 matches the expected conclusion but fails the principal developer's direct-evidence review. No expected keys were changed.

Six answers were withheld (W03, W21, W24–W27). No decisive conclusion was opposite to the key; one decisive result was inadequately proven (W17). Source bytes and nested seals passed 30/30. Automatic input-language detection matched all 30 cases across nine languages.

## Protocol and evidence

The 30 questions and admitted-source reference hashes were locked before requests. They contain no exact normalized duplicates among the earlier 260 benchmark questions, although themes/references recur. No measured search-popularity claim is made. Requests supplied only the original question and automatic language/source selection, never expected answers or source locators. No product edits or manual answer-failure retries occurred during the run; normal bounded application reassessments remain captured.

Application SHA-256: `2d28749aed96641d1841fde84e0121de37198aa9bfe226d0134c02b12be3a77c`

Dataset SHA-256: `452ff72fd225546e3eb978ecef7788e6544e1b3062a5e7462b8e1eeabfd6e531`

Build: `EBLiZR2hRylAs3IB7TpiD`

Reports in `artifacts/`: `release30-round3-question-set-2026-10-05.json`, `release30-round3-first-pass-2026-10-05.json`, `release30-round3-mechanical-audit-2026-10-05.json`, and `release30-round3-principal-review-2026-10-05.json`. Full traces stay private. An initial network-unavailable W01 attempt is retained separately, without turning it into an accuracy score or hiding its budget commitment.

The run settled 3.2550 SAR. Conservative total development commitment is 35.4274 SAR against the authorized 36 SAR cap; approximately 0.5726 SAR remains. The separate 15 SAR judging reserve remains protected.

## Findings and next repair priorities

1. **Explanation packet coverage.** W03's revised prose discusses publisher explanation absent from the selected primary proving unit. W24's revised prose cites 4302 while the final reviewer receives only 4308. The generator and reviewer need a shared explicit manifest covering every factual sentence and citation, without silently adding quotations or lowering the evidence standard.
2. **Opaque prose rejections.** W21, W26 and W27 have source relationship approval but explanation rejection. W26's final draft closely states 10:44 in both languages. Current boolean-only review cannot explain the exact failing clause; this is insufficient evidence to attribute every rejection to either the model or application. Record a bounded rejection reason and offending sentence before targeted repair. Do not simply bypass the reviewer.
3. **Direct evidence and retrieval.** W25 retrieves oath verse 5:89 for a promises question while 17:34 is missing. W17 promotes a thematic distinction in 35:28 to a general equality contradiction while 39:9 is absent. Retrieval recovery must distinguish related evidence from a direct answer and seek missing action/predicate contrasts.
4. **Qualified interpretation.** W05 usefully explains 94:5–6, but unnecessarily treats the user's contrast with a difficulty-free life as a separate unproven proposition. Review natural question contrasts as interpretations without inventing universal conclusions.

Repair and test these architecture controls offline before another paid batch. Preserve this score and the original records regardless of later repair results.

## Competition translation packaging

All nine display languages now label generated result explanations as **AI translations of the English result explanation**. Publisher source passages remain separate. Stale Arabic/English-only input wording was corrected. The existing display-copy tests passed 10/10 and production build passed before this freeze. This run tests nine-language input, English/Arabic primary explanation meaning, source integrity and boundaries; it does not independently validate all translated display outputs or speech.

The source review is by the principal developer, not independent scholarly certification. The earlier 26/30 round remains unchanged.
