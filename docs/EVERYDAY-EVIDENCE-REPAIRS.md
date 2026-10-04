# Everyday wording, retrieval and seven-case repairs — 5 October 2026 Riyadh

All seven previously unsuccessful round-three cases now pass end to end, with automatic input-language detection and source selection. The separate natural-contrast control W05 also passes. The original 23/30 benchmark is preserved; these are known regression checks, not a fresh 30-question accuracy result.

## Changes

Search-only normalization now connects ordinary knowledge/knowing and promises/covenants/accountability terminology to translated source wording. It does not rewrite the user input, stored quotations or legal categories. Oaths are not mapped to promises. Equality-comparison ranking rewards the relevant concepts appearing together in one sentence instead of incidental co-occurrence across unrelated sentences or context. No expected verse IDs are pinned into the application.

The initial attempt to apply same-sentence weighting to every query caused one existing prayer/showing-off retrieval check to fail. Restricted that weighting to equality comparisons and reran the entire suite successfully. Both the initial failure report and successful report are retained.

Generator and reviewers now explicitly accept faithful everyday paraphrases, material translation equivalence and straightforward source meanings. An interpretive contrast is not automatically a separate universal claim requiring another quotation. Genuine conjunctions, explicit only/always claims, necessary conditions and source-stated exceptions remain checked. Topical similarity, a different action, or an oath where a promise is asked about cannot establish direct proof. Quote hashes, immutable source IDs, independent final review and per-atom cited-unit binding remain enforced.

## Results

380/380 offline checks passed, including new real-corpus retrieval probes with the four-Quran-card allowance and an oath-versus-promise proof rejection control. Type checking and production build passed. Local production preview runs the new build.

| Case | Prior issue | End-to-end rerun |
|---|---|---|
| W03 | Birds/reliance explanation withheld | Correct contradiction, hadith 4721 |
| W17 | Expected conclusion with indirect knowledge evidence | Correct contradiction, direct Quran 39:9 |
| W21 | Telling a brother of affection withheld | Correct support, hadith 3017 |
| W24 | Righteousness/good-character explanation withheld | Correct support, hadith 4308; other prose evidence available |
| W25 | Promises question answered using oath evidence | Correct contradiction, covenant accountability in Quran 33:15 |
| W26 | Allah/people wrongdoing explanation withheld | Correct support, Quran 10:44 |
| W27 | Doubt about ablution during prayer withheld | Correct contradiction, hadith 3064 |
| W05, separate control | Interpretive contrast unnecessarily treated as unproven clause | Direct support for ease with hardship, Quran 94:5–6 |

The W25 answer uses 33:15 as a legitimate counterexample to the blanket absence-of-accountability claim, rather than forcing the locked reference 17:34. Its scope remains covenant accountability in the stated context, not a determination of every promise category. Offline probes show 17:34 is also retrievable. Sources and final explanations were reviewed; no source bytes changed. Seven-case audit passed 7/7; separate contrast audit passed 1/1. The Arabic W27 explanation has a minor grammatical typo; it remains recorded as a presentation defect rather than a changed religious meaning.

## Budget and records

The initial 37 SAR guard stopped W25 before a complete answer. User authorized cap 39 SAR. That operational attempt is retained separately; the four completed cases were not repeated. No product edits during the frozen live runs. Original expected answers were never included in API requests.

Seven-case run, including the budget-stop attempt: 1.239979125 SAR. Separate contrast control: 0.116877 SAR. Total this repair validation: 1.356856125 SAR. Conservative development commitment: 37.1883639375/39 SAR, leaving approximately 1.8116 SAR. Separate 15 SAR judging reserve preserved.

Records: `artifacts/seven-case-repairs-live-2026-10-05.json`, mechanical audit, principal source review and preserved budget-stop report; `artifacts/natural-contrast-live-2026-10-05.json` and its mechanical audit; `artifacts/everyday-evidence-offline-confirmed-2026-10-05.json`. Full traces remain private.

Application SHA-256: `5118ffc539d2fcc78a588d0083bd8f2f72a7cfc3f3368998e91a42addfb56270`. Build: `SVEvOLRtbYnGREzY_lq7L`.

This is principal developer review, not independent scholarly certification, a general accuracy estimate, or validation of all translated output/voice features. A future unseen benchmark is required before claiming the 27/30 release target has been met.
