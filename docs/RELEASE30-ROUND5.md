# Fresh final 30-question verification run — 5 October 2026 Riyadh

**29/30 satisfactory responses (96.7%)** passed the agreed **27/30 usefulness target**, with **zero incorrect decisive answers, zero inadequate decisive proofs, and zero badge/explanation mismatches found**. This run passes the documented verification benchmark gate. It is not a blanket release approval or a claim that every Islamic question is answered correctly.

The religious subset was 26/27 satisfactory (96.3%); all three boundary requests were handled correctly. Source-byte/nested-seal checks, original-input preservation and automatic input-language detection passed 30/30.

## One retained failure: Y16

Indonesian question: “Apakah Al-Qur’an menggambarkan orang beriman sebagai orang yang menjaga amanah dan janji mereka?” (Does the Quran describe believers as guarding their trusts and promises?)

The locked answer key used 23:8, whose believer antecedent is introduced at 23:1. Retrieval instead selected the similar 70:32. Both assessments described believers, but the independently cited source-unit packet contained only 70:32 and its ±2-verse neighbors. It did not establish the antecedent identifying that group. The reviewer rejected the explanation twice; the app displayed no decisive answer.

This is a context-selection/citation-scope gap, not a demonstrated translation error. It counts as an unexpected in-scope withhold and as a failed usefulness case. No product edits, label changes or manual reruns were made during this benchmark. Context expansion/antecedent selection remains a measured backlog item rather than triggering another unbounded paid test cycle.

## Protocol

- Fresh wording checked for exact duplication against 325 preceding planned benchmark questions and the two final badge controls. Themes and sources may recur; no measured popularity ranking claimed.
- 18 Quran questions, 9 Hadith questions and 3 boundaries; each of the nine input languages exercised.
- Key and source hashes locked before requests. Original claim plus automatic language/source selection sent; no expected source IDs, locators or verdicts supplied.
- Application/build frozen throughout. Built-in bounded reassessment/recovery allowed; no manual retries or edits within the run.
- Every English/Arabic explanation and primary/context proof reviewed against admitted sources by the principal developer; not independent scholarly or native-language certification.
- Valid alternative evidence accepted: Y11 used 2:43 instead of 2:110, Y15 used the report ar:2954 instead of en:58259, Y17 used 5:48 alongside 2:148. Each directly proves the tested relationship.
- Y23 demonstrates useful multi-unit proof: 107:5 plus exact context 107:4 and 107:6 establish the warning about showing off without condemning all prayer.
- Additional translated display outputs, speech and browser journeys were not exercised by this API benchmark. Minor Arabic phrasing defects in Y06/Y18/Y19 are polish items, not meaning inversions.

## Evidence and cost

`artifacts/release30-round5-question-set-2026-10-05.json`, `artifacts/release30-round5-first-pass-2026-10-05.json`, `artifacts/release30-round5-mechanical-audit-2026-10-05.json`, `artifacts/release30-round5-principal-review-2026-10-05.json`. Complete provider records remain private under `artifacts/private/release30-round5-first-pass`.

Application hash: `edefc432aba1ebc30c68b49ad4a75e6bf924328e23d22c1220f5927e7a2a3492`.
Build: `NU9o4Ow5wSleAe8Vd6yVj`.
Question-key hash: `90f2296743fe7113c03eddf068f95275c8fd4b1533dbe5100309fb73e61ea5c1`.
Existing offline gate: 392/392 passed; no application changes since.

User approved development cap **49 SAR**. Run cost **4.1416940625 SAR**; conservative development commitment **46.7925481875/49 SAR**, leaving **2.2074518125 SAR**. Separate **15 SAR judging reserve** preserved.

Next: move to the user journey and scoped Umrah companion milestone. Visual direction is awaiting Redwan’s answer to the design question; do not silently redesign the UI. Current core benchmark is now adequate to move forward with its recorded limits. No further paid benchmark automatically authorized or started.
