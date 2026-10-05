# Fresh 30-question verification batch

Status: completed. The user explicitly approved raising the total development cap from 49 to 55 SAR on 6 October 2026 (Riyadh). No provider calls were made during preparation; the subsequent live batch retained all 30 first responses.

## Candidate and questions

Candidate: `7283b35` (review-feedback recovery and accurate failure diagnostics), with its existing 490/490 passing offline tests and successful production build. This preparation changes only evaluation scripts, documentation and artifacts.

`artifacts/release30-round6-question-set-2026-10-06.json` contains 30 source-derived questions: 18 Quran, 9 Hadith, and 3 boundary requests. Three religious questions in each of the nine supported languages. Religious expectations are 18 supported and 9 conflicting. The key includes admitted source text, locator, hash and qualification notes. Adequate alternative evidence is acceptable during review.

The novelty check read 826 historical JSON files and found 582 distinct claim strings. All final questions are new by normalized exact comparison. Manual inspection covered all earlier planned sets and additional stored claims. It identified that a draft water/creation question repeated the earliest live smoke test; that draft was replaced before any new requests. Religious propositions are new in the inspected history, while broad domains and the three boundary categories intentionally recur. This is not a random population sample or an independent scholarly review.

## Execution and preservation

Use `node scripts/validate-release30-round6.mjs` for an offline preflight; add `--live` only for the authorized live run once the spending cap permits it. The current preflight stops before requests if less than 6 SAR remains. This headroom is based on recent 4.14–4.78 SAR batches plus reservation overhead; it is not an expected charge or a change to the application budget.

Before the first request, freeze application tree, build ID, source files, dataset and configuration. Verify these remain unchanged before each request. Send only original claim, explicitly selected case language and automatic corpus selection to the finishing app on port 3302. No source hints or expected answers reach the application. Unlike round 5, language selection follows the current composer's explicit language choice.

No retrieval prescreen, midrun application edits, manual retries, substitutions or hidden exclusion of bad results. The application's existing bounded recovery is part of the measured behavior. Save raw first responses under ignored `artifacts/private/release30-round6-first-pass`, and publish a compact first-pass record separately. Stop on unresolved provider, budget, transport or record-integrity failure. Report a partial batch as incomplete. One local client is paced to respect the route limit.

The ledger is read from the application's configured private directory, which is shared with the original workspace. Never reset or discount reservations. Shared-ledger changes can include concurrent user requests; attribute batch spend from captured reservation IDs separately before reporting its cost. Recheck remaining budget immediately before execution. Starting state: 47.797608375 SAR committed, 1.202391625 SAR remaining under 49 SAR. Proposed total cap: 55 SAR, a 6 SAR increase. The separate judging reserve is not reassigned.

## Scoring and comparison

Read every answer against its cited sources. Full satisfaction requires useful response, direct relevant evidence, preservation of meaning and conditions, explanation/verdict agreement, readable requested-language output, and intact source seals. Label equality alone is not a pass. Separately record useful limited answers, unnecessary withholds, incorrect decisive conclusions, retrieval misses, unsupported elaborations and language failures. Conservative nonanswers to these answerable religious questions are not full passes. Correct refusal, clarification or referral applies only to the three boundary cases.

Keep the existing gate: at least 27/30 satisfactory responses and zero incorrect decisive answers. Last round: 29/30 overall, 26/27 religious and 3/3 boundary, with no incorrect decisive answer. Different questions and explicit language selection prevent attributing any score difference solely to the latest repair. Preserve historical scores unchanged.

## Prepared deliverables

- Source-derived key: `artifacts/release30-round6-question-set-2026-10-06.json`
- Offline readiness: `artifacts/release30-round6-preflight-2026-10-06.json`
- Prepare script: `scripts/prepare-release30-round6.mjs`
- Runner: `scripts/validate-release30-round6.mjs`

## First-pass outcome

29/30 satisfactory (96.7%), matching the previous overall score. The subtotals changed from 26/27 religious and 3/3 boundary to **27/27 religious and 2/3 boundary**. No incorrect decisive conclusions, inadequately proven decisive answers, inconsistent badges or unnecessary religious withholds were found. All 30 source/seal and input-language checks passed.

Z29 failed: “Is the religious quote in the message I received authentic?” supplied no quotation. Intake accepted it as a high-confidence textual request, searched, and returned generic insufficient-evidence text rather than asking for the missing quote. The internal assessment recognized the absent wording, but the final visible summary did not preserve that explanation. This is a clarification-routing gap, not proof that the evidence reviewer is too rigid. No product correction has been applied after the batch.

Z24 has a minor wording defect: its Arabic explanation calls `en:5970` and `ar:5970` two hadiths, although they are two language records of the same report. Its conclusion and proof are correct, so it counts as satisfactory, but not entirely clean. The separate entirely-clean count is 28/30; that stricter wording subtotal was not separately reported for the previous round.

Z12 and Z22 exercised the new feedback repair successfully. Review caught an unsupported added qualification in Z12 and an English/Arabic mismatch in Z22. Both revised explanations passed a new source review. These were built-in recoveries, not manual retries. No final qualified-answer path was exercised live. The source key's exact witnesses were absent for Z04 and Z23, but their alternative proof at 2:219 and 6:160 was adequate and accepted.

Captured batch spend: **4.4639325 SAR** over 118 provider usage reservations, matching the shared-ledger delta. Total committed development spend: 52.261540875 SAR, leaving 2.738459125 SAR of the 55 SAR cap. The separate 15 SAR judging reserve was not reassigned. Religious-answer median: 13.483 seconds; nearest-rank p95: 41.466; maximum: 49.066.

Scores come from substantive source/answer review, not label matching alone. They are not independent scholarly certification. The nine input languages and English/Arabic explanations were reviewed; browser-triggered display translations, voice, camera and rendering were not exercised. Thus the preparation's requested-language readability criterion is limited here to intake fidelity and the API's English/Arabic output contract; it does not certify the separate Lingo endpoint. The original fasting failure and old Y16 were excluded from this fresh set and their individual live outcomes remain unconfirmed.

First-pass records: `artifacts/release30-round6-first-pass-2026-10-06.json`. Per-case principal review: `artifacts/release30-round6-principal-review-2026-10-06.json`. Raw responses remain in ignored private storage with their hashes included in the review. Offline source-audit/review script: `scripts/review-release30-round6.mjs`.
