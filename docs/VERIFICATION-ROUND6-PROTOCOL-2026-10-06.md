# Fresh 30-question verification batch

Status: prepared for the user-authorized live run. The user explicitly approved raising the total development cap from 49 to 55 SAR on 6 October 2026 (Riyadh). No provider calls were made during preparation.

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

No first-pass score exists until live execution and answer review are complete.
