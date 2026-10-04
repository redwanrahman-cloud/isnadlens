# Independent holdout review

Review scope: first-pass evaluation protocol and pre-freeze source labels. No app changes, paid calls, or holdout app answers were used for this review. Primary-source labels remain provisional agent review, not scholarly certification.

## Protocol findings

The existing `scripts/validate-baseline-50.mjs` merges previous cases and replaces selected case rows and private record files on retest. Its output is therefore a latest-development-results table, not an immutable first-pass benchmark. For the new holdout, preserve the first full record and first report separately from all later repair runs. Freeze the dataset byte hash and implementation/prompt/router/intake versions before the first request.

The runner's `reference_answer_matched` compares verdict labels alone. The report does not make that match conditional on HTTP success, seal validity, intact evidence, correct source attribution, complete user-assertion coverage, or preserved source exceptions. Report label agreement separately from grounded correctness. A witness appearing among candidates does not establish that the witness supports the proposition: check its actual governing action, scope, speaker, qualifications and claimed relationship.

`evidence.every(...)` is true for an empty evidence array. An empty sealed refusal can pass record-integrity checks, but cannot count as verified quotation evidence. Report record integrity, nonempty evidence integrity, and grounded answer correctness separately.

The existing report correctly separates abstentions from wrong decisive answers, and acknowledges targeted repairs. Retain that distinction for the untouched holdout. Report:

- Number planned, number executed, and number not executed because of budget/provider limits.
- Yes and no reference counts, with class-specific correct, wrong decisive and abstaining counts.
- Correct decisive answers divided by all executed established-reference cases.
- Decisive coverage, and accuracy among decisive answers.
- Wrong decisive yes and wrong decisive no separately.
- Source-witness/attribution/qualification audit failures, even when a verdict label matches.
- All attempt costs deduplicated by reservation ID, plus unknown reservations separately.

A request that executes but cannot reach verification is an abstention with its reason. A case never submitted because the cap stopped the run is unexecuted, not an abstention or a success. Do not claim fifty-case accuracy from a partial run.

Balanced yes/no labels must follow primary text. An invented concept missing from retrieved sources is insufficient evidence, not an established no. Negative references require explicit source negation, an incompatible same-proposition statement, or a valid counterexample to a user universal, with the relevant conditions preserved.

Do not adapt code, prompts, hints or labels after observing new holdout answers until the first-pass report is preserved. A necessary label correction must retain the original label and be separately adjudicated/versioned rather than silently improving the score. Reviewer locators, witness quotations and rationales must never enter the application request or search hints.

Novelty should distinguish exact duplicates, semantic paraphrases, translated duplicates, polarity inversions of previously tested propositions, and new propositions. Fresh wording or reversing a known claim is useful, but does not establish entirely new-topic performance.

## Pre-freeze source review

Read all fifty draft propositions against their actual admitted Arabic Quran or Hadith primary text. The admitted QuranEnc English Rowwad edition was used as a published reading aid, not as a substitute primary corpus. The raw/joined Quran and Hadith pins, nine raw Hadith workbooks, and English reading-aid JSON/SQLite pins verified. All 58 final witness quotations matched their hashes, and Hadith publisher grades matched the preserved publisher fields. No holdout app answers were accessed.

The draft contains 40 yes and 10 no references, including 40 Quran and 10 Hadith cases. It is not a 50:50 class-balanced set: an always-yes predictor would attain 80% label agreement. Report class-specific and macro-averaged results. The separate predeclared execution order interleaves six Quran yes, two Quran no and two Hadith yes cases per ten; stable case IDs remain unchanged.

There were no normalized exact duplicates within the draft or against the previous fifty questions and twenty common queries. The prior nine multilingual pork variants also assert different propositions. A manual comparison found no material paraphrase duplicates. Broad domains recur, including finance, charity, family conduct and theology, but the operative actions, objects or conditions differ. H44 and H45 share Hadith record 4801 while testing distinct knowledge-seeking and helping propositions; this is shared-source dependence, not duplicate wording or an independent-source sample.

All six pre-freeze corrections were applied and independently rechecked in the final dataset:

| Case | Finding |
| --- | --- |
| H34 | Change “needing to be fed” to “being fed.” Quran 6:14 directly negates being fed; necessity is an extra inferred predicate. Keep the no label. |
| H37 | Add Quran 5:117 as a witness: the stated exclusive instruction to worship Allah directly opposes the alleged instruction to worship Jesus and his mother. It is stronger than relying only on the conditional denial in 5:116. |
| H17 | Describe a four-witness standard for accusations against chaste women, rather than imply an exceptionless rule across the separate spousal procedure in 24:6–9. |
| H05 | Record that the adultery exception in the adjoining clause of 4:19 does not authorize coerced inheritance of women. The claim’s yes label is supported. |
| H40 | Preserve the predicate “encompasses,” not a broader “sees.” The publisher footnote discusses vision in Paradise; the no label concerns the stated encompassing proposition. |
| H46 | The English primary witness supports the Arabic question; adding or using the admitted Arabic counterpart improves same-language traceability without changing the yes label. |

Other conditions worth retaining in grounded-answer review include H09’s specified household privacy times, H13’s narrated Children-of-Israel attribution, H20’s non-fighting/non-expulsion qualifications, H29’s journey/no-scribe setting, and H30’s known-paternal-identity condition. H21 presents the recorded advice about gait and voice; H23 encourages pardon in its stated context. These should not be broadened into personal rulings.

The ten no references otherwise have genuine same-proposition primary counterstatements: limited knowledge (17:85), knowledgeable watchers/scribes (82:10–12), adorned lowest heaven (67:5), revival by the original Creator (36:78–79), fresh versus salty water (25:53), Abraham’s expressly negated Jewish identity (3:67), expressly negated fatherhood (33:40), and expressly negated encompassing vision (6:103). None relies merely on failure to find a concept. H34 now uses the narrower wording and H37 includes the additional direct witness noted above.

## Final freeze approval

Final dataset SHA-256: `02d2408c7d9836a016f9c30ee297581ca2e5d026802cdd72a71661caea06a539`. All 58 final witnesses match the admitted quotation hashes; Hadith grades and versions match the publisher fields. The final H17/H34 wording, H37 added witness, H05/H40 qualification notes, and H46 Arabic witness were checked. Stable IDs, unique fifty-case execution order, and the declared ten-case distribution verified without errors.

Approved for an untouched first-pass run with the protocol safeguards above. This approval is provisional source-backed agent review, not scholarly certification. It does not assert application accuracy; no new holdout application answers or paid calls were used.

PRE_FREEZE_REVIEW_COMPLETE
