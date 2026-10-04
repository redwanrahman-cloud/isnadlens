# Fresh 50: frozen live first pass

All 50 questions ran against the production preview with Luna/Terra and the trusted-domain fallback on 4 October 2026. No application changes or repair replays occurred during the run. Questions, expected answers, source passages, application tree and build were frozen before execution. Only original questions and automatic language/source selection went to the app.

## Results

- 22/50 expected answer labels, accepted in principal source/meaning review.
- 28/50 withheld answers: 27 not evaluated and one insufficient-evidence result.
- Zero opposite decisive answer labels in this set. This does not establish universal correctness or useful coverage.
- 50/50 exact admitted-source byte, context-hash and nested-record seal checks passed.
- Nine input languages; 35 Quran and 15 Hadith questions. Some categories and distinct facets recur from earlier tests, but no exact question duplicates of the prior 165.
- One question used web discovery, with two search calls; it remained unanswered.
- Settled live-run estimate: 1.569864 SAR. Conservative total development commitment: 19.0236714375/28 SAR, including retained unknown reservations. The 15 SAR judging reserve is unchanged.

## Root causes and repair order

1. **19 keyword-scope rejections.** The model language intake accepts the questions as textual, but a second lexical whitelist rejects them. It misses ordinary pilgrimage wording, some family-law wording, plural Muslims and the adjective Islamic. Repair the relationship between validated intake and downstream domain screening rather than maintaining question-specific keyword patches. Keep general live-information requests outside verification.
2. **5 personal/health overfilters.** First-person educational queries such as shoe-order learning and generic descriptions of pregnancy or an illness exception are conflated with individualized rulings/private patient facts. Separate public educational guidance from personal-case decisions while retaining private-data and actual sensitive-case screening.
3. **1 retrieval/publisher-locale miss.** T23 asks whether spreading an unverified rumor is trivial. Direct evidence is in 24:15. Search opened trusted QuranEnc verse URLs with `/fa/` and `/as/` UI locales, but the adapter admits only the nine user-input language prefixes. Publisher UI locale must not be conflated with user-language support; exact verse attribution and immutable Arabic/API matching must still be required.
4. **3 decision-check abstentions.** T29, T36 and T42 preserve the original proposition and supply directly contradictory evidence, but the extra decision review rejects the relationship. Inspect conflicting support-only versus decision-mode prompt wording. Retain the original-proposition safeguard; test it against the earlier W06 reversed-atom control rather than disabling it to improve the score.

T21's surrounding-context exception wording should be clearer about which clause it qualifies. T37's additional sentence comes from the publisher explanation, not a separate literal hadith quotation. T47 succeeds using an alternative admitted hadith witness; evaluations should accept valid alternative evidence rather than requiring a single frozen locator.

## Next validation

Implement family-level repairs, test affected routing paths locally with provider mocks and non-Islamic/private/injection controls, then use a small budgeted targeted live replay. Publish repaired-case results separately from this unchanged 22/50 first pass. Do not expand to another large new batch until the routing and source adapter gaps are addressed.

Artifacts: `web50-first-pass-2026-10-04.json` (untouched run), `web50-principal-review-2026-10-04.json` (case notes), `web50-reviewed-summary-2026-10-04.json` (mechanical audit and reviewed counts). Full provider responses remain private. Principal review is not independent scholarly or expert native-language certification; this is not a measured search-popularity sample.
