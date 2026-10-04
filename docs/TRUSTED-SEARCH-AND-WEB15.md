# Trusted search fallback and fresh 15-question evaluation

## Behavior

The app searches its admitted Quran and Hadith editions first, with the existing one-time local recovery. An eligible remaining evidence gap can trigger one hosted web discovery request restricted to QuranEnc, HadeethEnc and Saudi Al-Ifta. The request has a maximum of three built-in tool calls, so searches cannot exceed three. Opening publisher pages is a separate bounded server operation: up to three pages and four Quran verse API checks, with ten-second source timeouts and a four-megabyte response limit.

Web output discovers references; it never supplies an automatic verification verdict. Quran references must belong to a cited QuranEnc surah/verse page, exist in the admitted corpus, and match the publisher's verse API after display-orthography normalization. Hadith references require an opened HadeethEnc page containing the complete normalized admitted passage. The actual assessment uses unchanged admitted quotations and their context, not web-generated scripture or quotations. Explicit verse URLs also supply candidate locators when formatted search prose cannot be parsed.

Al-Ifta pages remain clickable, attributed scholarly guidance. This release does **not** automatically turn an Al-Ifta ruling into a scripture verdict, independently adjudicate disputed fiqh, or summarize every ruling as a universal answer. The three domains do not represent every Islamic school or every possible question. Source retrieval can still fail or miss relevant evidence.

Successful reference discoveries are cached in memory for one hour, up to 100 question/source-selection entries. Cached references still receive a fresh assessment when used; final model answers are not cached as proof. Cache hits carry no new search usage. Provider errors and missing evidence remain explicit, with prior sealed results preserved.

## Budget

Hosted search reserves the maximum three search fees and a conservative 128,000-token search-context allowance before a paid call. Settlement includes actual search count plus model usage. Unknown/failed call reservations are retained. The existing development cap remains **18 SAR**; the judging reserve is unchanged.

## Historical checks without API credits

All **150 historical records** were replayed and checked mechanically with provider/network access disabled. All **2,924 checks passed**, with **zero new API calls** and an unchanged budget ledger. The current retrieval probe uses saved hints and screened glosses, including two-verse Quran context and the current source-family selection. It runs 432 search probes, including variants; these are diagnostics, not hundreds of independent accuracy cases. Missing frozen witnesses do not establish a wrong answer because valid alternative passages may exist.

Historical replay cannot predict the current model's response to a changed prompt, evidence packet, search result or model. No new live accuracy score is inferred from replay.

## Untouched fresh 15

The dataset, expected reference passages, app tree and build were frozen before execution. Only the original question and automatic language/source selection were submitted. The set has 14 Quran questions and one Hadith question across six languages, with nine supported and six contradicted propositions. Topics are project-authored representative questions, not a measured most-searched ranking. One public-charity proposition shares the earlier private-charity topic but adds a different assertion.

First-pass answer labels matched **15/15**. All source bytes and outer/nested record seals passed. Principal source review accepted the complete reasoning in **14/15**: W06's German final answer was correct, but the stronger assessor silently rewrote its atom into the opposite proposition. That defect is retained in the original result and excludes W06 from fully grounded reasoning. None of the 15 needed web search. This is not independent scholarly or expert multilingual certification.

The fresh run cost approximately **0.97 SAR**. Including integration and repair probes, conservative development commitment is approximately **17.45/18 SAR**, including retained unknown reservations.

## Repair and integration evidence

Contradiction decisions now also pass a separate source-focused decision check using Terra when Luna is primary. The check compares the original asked proposition with the atom and its evidence, and blocks an unconfirmed contradiction. A targeted live replay of W06's captured bad atom was incorrectly accepted by a Luna checker; the stronger Terra check rejected it. Both probes remain saved. An automated regression verifies that a rejected check cannot yield a decisive contradiction. This catches the observed defect; it does not prove that every future language or interpretation error is prevented.

The live Hadith discovery probe used one search, opened publisher pages and authenticated en:4555 and en:3880 against admitted passages. The Quran probe exposed two source-adapter problems: larger publisher HTML pages exceeded the first size limit, and publication orthography differed from the admitted display. After repair, direct rechecks of the already-retrieved QuranEnc 16:90 URLs matched the publisher API against the admitted display with **zero additional model calls**. Earlier unsuccessful probes remain preserved. The final complete 15-question set was not rerun after these repairs.

The user-facing result displays opened publisher links and distinguishes Al-Ifta guidance. No visual redesign, public deployment, new paid service or corpus expansion was performed.

Final validation: **273 automated tests passed**, the production build/type checks passed, and the updated preview is serving locally. The offline source-search review flagged 71 probe variants across 25 distinct historical questions for possible missing witnesses; these are diagnostic review candidates, not 25 confirmed wrong model answers.

## Artifacts

- `artifacts/web15-question-set-2026-10-04.json` and `web15-freeze-2026-10-04.json`
- `artifacts/web15-first-pass-2026-10-04.json` — unchanged first pass
- `artifacts/web15-reviewed-summary-2026-10-04.json` — principal review and budget
- `artifacts/trusted-web-live-probe-2026-10-04.json` — live Hadith discovery
- `artifacts/trusted-web-quran-source-repair-2026-10-04.json` — publisher source rechecks
- `artifacts/web15-decision-guard-strong-probe-2026-10-04.json` — stronger check rejecting W06
- `artifacts/offline-boundary-lab-2026-10-04.json` — historical engineering checks

The next release review should exercise an actual evidence-gap journey, guidance links, mobile voice controls and deployment limits. Any further paid evaluation must remain inside the existing cap or receive additional spending authorization.
