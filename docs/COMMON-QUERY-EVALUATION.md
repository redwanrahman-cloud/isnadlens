# Everyday claim evaluation — 4 October 2026

This is a source-reviewed set of representative everyday questions and claims, not a list of the most searched questions. No search-volume analytics were available or used. Topic selection follows the official HadeethEnc worship/jurisprudence and manners categories, its featured core Hadiths, and ordinary subjects addressed in the admitted Quran text. This broadens evaluation beyond changing the wording of the pork example.

Dataset: `artifacts/common-query-cases-2026-10-04.json`. It contains 20 Arabic/English cases and nine language equivalents of one proposition. Labels are provisional independent agent review of admitted primary text, not a scholar-certified benchmark. The parent builder subsequently executed live development probes; results and failures are retained below.

## Primary source review

Official topic entry points: [HadeethEnc homepage and category index](https://hadeethenc.com/en/home), [Jurisprudence and Juristic Principles](https://hadeethenc.com/en/browse/category/4), and [Virtues and Manners](https://hadeethenc.com/en/browse/category/5). The homepage publishes these category links and featured core Hadiths. Direct category fetching encountered HTTP 429/oversized-page limitations; no popularity figures were inferred from category counts.

Verse and record review used the frozen official Tanzil Arabic editions, the admitted QuranEnc English Rowwad v1.0.19 translation as an identified reading aid, and unchanged admitted HadeethEnc primary text. Explanations and titles were not promoted into primary quotation evidence. Relevant source versions and corpus hashes are recorded in the dataset. Review explicitly distinguished source-text integrity, a semantic proposition, and a personal legal ruling.

Sources include [QuranEnc API and publication terms](https://quranenc.com/en/home/api/), [Tanzil text licence](https://tanzil.net/docs/Text_License), [five daily prayers](https://hadeethenc.com/en/browse/hadith/65044), [intentions](https://hadeethenc.com/en/browse/hadith/4560), [neighbor treatment](https://hadeethenc.com/en/browse/hadith/4965), [truthfulness and lying](https://hadeethenc.com/en/browse/hadith/5504), and [backbiting definition](https://hadeethenc.com/en/browse/hadith/5326). Each dataset case carries its own independent source links and locators. No copied publisher prose is included in the evaluation claims.

## Coverage and interpretation boundaries

| Cases | What is tested |
| --- | --- |
| CQ01–CQ04 | Intentions, five prayers, qualified Ramadan fasting, and charity |
| CQ05 | A familiar smile-as-charity claim for which the admitted English primary-text search did not locate direct support |
| CQ06–CQ09 | Neighbors, parents, lying/truthfulness, and backbiting |
| CQ10–CQ13 | Gambling, intoxicants, riba versus trade, and the qualified necessity exception |
| CQ14–CQ16 | Unsupported modern application, mistaken source attribution, and an unsupported conjunct |
| CQ17–CQ18 | Weather and a personal health/fatwā request: pre-provider refusals |
| CQ19 | A statement explicitly incompatible with the Quran's riba prohibition |
| CQ20 | An unresolved blanket claim about applying necessity to difficult work schedules |

The five-prayer expectation is grounded in a primary Hadith explicitly confirming the number; passages that merely mention prayer are not enough. Intoxicants are deliberately narrower than every chemical substance named alcohol. Riba is not silently equated with every modern bank product. Charity language does not attempt a complete legal definition of zakāh. The necessity case retains its conditions and does not decide whether a person's circumstances satisfy them.

The smile case must not receive support from a report that merely describes smiling. Its insufficient expectation means a gap in the admitted English source review, not that the claim is globally false or absent from all Hadith books. Additional direct primary evidence would justify re-reviewing that provisional label, rather than training the engine to repeat it.

For the attribution mistake, a direct Hadith passage does not establish that the Quran makes the attributed statement. Do not silently replace the user's source attribution. For the compound example, one supported fasting component cannot cover an invented purchase requirement. For both cases, missing evidence is not an explicit contradiction. CQ20 requires human review of the overgeneralization; do not issue a universal personal ruling about work, hardship, or necessity.

## Evaluation procedure

1. Freeze the dataset and record the code commit, admitted source hashes, model, prompt/schema versions, and authorized budget before running it.
2. Submit only the original `claim`, `input_language`, and `corpus_selection`. Reviewer locators, primary links, and rationale are evaluation metadata. Never append them to the claim, inject them as planner hints, or force the expected sources into retrieval.
3. For CQ17/CQ18, verify the expected referral and no semantic assessment. Personal circumstances must be screened before intake. Automatic multilingual routing of a generic weather question currently incurs a small language-intake call before general-scope referral; do not claim this path is entirely free of provider use.
4. For other cases, preserve the original claim and every material qualification. Record actual retrieval IDs, immutable quotations, source/version/hash checks, planner output, atomic coverage, contradiction basis, verdict, sealed record, latency, model attempts, and measured usage.
5. Score retrieval recall independently from citation integrity and verdict correctness. A retrieved authentic passage may be unrelated. A failed retrieval can lead to safe abstention while still revealing a product defect. Support requires complete direct coverage; conflict needs an actual incompatible source statement.
6. Review failures before broadening the source or changing thresholds. Keep unresolved cases visibly provisional. Do not declare the benchmark passed from mocks, a source-presence test, or aggregate accuracy that hides unsupported claims falsely marked supported.

Report each case and the confusion matrix. Prioritize false support, fabricated citation, false contradiction from absence, lost exceptions, silent attribution changes, and personal-ruling leakage. Also report legitimate supported cases that abstained due to retrieval failure. Dataset source references are reviewer aids, not forced retrieval instructions.

## Nine-language invariant check

The multilingual block expresses one proposition: Quran prohibition of pork in ordinary circumstances. Arabic, English, Bengali, Hindi, Urdu, Indonesian, Spanish, French, and German versions use natural draft phrasing, not nine certified human translations. Keep that status explicit until language reviewers validate equivalence.

Input-language acceptance is distinct from display-language support. When a language needs a translation stage, record the original and translated claim and verify that ordinary-conditions qualification, Quran attribution, and the eating proposition survive. All presentation variants must retain the same source identities, quotations, canonical verdict and audit hash. Missing local voices, missing publisher translations, and untranslated explanatory text should be disclosed as availability states, not silently replaced or described as source recordings.

These nine variants are an equivalence check and should not be used to inflate independent-question coverage. A qualified scholarly and linguistic review remains outstanding.

## Live development results

Initial live run: 18/29 provisional verdict expectations matched. All nine language variants were detected correctly. Failures exposed missing query expansion, incidental shared-script anchors, separation of ordinary qualifiers into unsupported atoms, and false contradiction from missing evidence. `common-query-initial-live-2026-10-04.json` preserves that run; `common-query-network-blocked-2026-10-04.json` preserves the earlier transport-blocked attempt. Unknown usage reservations remain conservatively retained.

After general retrieval/prompt/router corrections, the complete live rerun matched 29/29 provisional verdict expectations, including all nine equivalent pork claims. Original input, audit seals and every retrieved quotation's integrity passed. The explicit incompatible-riba claim used strong-model confirmation; missing-support claims abstained instead of becoming false contradictions. These are development cases used to improve the implementation, not an untouched final benchmark or proof that every Islamic question is answered correctly. See `artifacts/common-query-results-2026-10-04.json`.

The fresh phrasing probes in `scripts/validate-common-holdouts.mjs` separately examine parents, intentions and Spanish gambling questions without any source locators injected. Browser testing confirmed automatic Spanish selection, a separate generated explanation and an identified published Spanish Quran translation. One generated explanation contained mixed-language prose; this is a translation defect, not altered source text or a changed verdict, and motivated a separate script-consistency guard. Independent linguistic and scholarly review remains open.
