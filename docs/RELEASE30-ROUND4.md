# Fresh 30-question first pass — 5 October 2026 Riyadh

The repaired application achieved **29/30 satisfactory responses (96.7%)**, exceeding the numeric **27/30** target. There were **zero unexpected in-scope withholds**, **26/27 satisfactory religious answers**, and **3/3 correct boundary responses**. All 30 records passed source-byte/seal checks, original-input preservation and automatic input-language detection.

The stricter zero-wrong-decisive release gate **did not pass**: one badge contradicts an otherwise correct answer. This must remain visible in reporting; neither the expected key nor the result was changed to manufacture a perfect score.

## One remaining inconsistency: X24

French question: “Selon le hadith, une noble lignée suffit-elle à faire avancer celui que ses actes ont retardé?” (Does noble lineage suffice to advance someone held back by their deeds?)

The app retrieved HadeethEnc 4801, including the explicit sentence that whoever is slowed down by his deeds will not be hastened by his lineage. The English and Arabic explanations correctly answered **No**. However, the assessment marked the original affirmative proposition as `supports`; the independent source reviewer accepted it and the result displayed `supported_within_selected_corpus` rather than `conflicting_within_selected_corpus`.

This case fails the user-facing consistency check despite a correct religious explanation. Its routing gloss was accurate, the source was retrieved, and the required primary proof was available. The observed gap is distinguishing “evidence supports this answer to a question” from “evidence supports the proposition being questioned.” A targeted question-polarity/answer-consistency repair is the next priority. This run introduced no application repair and made no paid retries.

The Arabic X24 phrase “النَّسَبَة النبيلة” also has a minor wording defect; it does not invert the meaning but should be polished separately.

## Protocol and scope

- 18 Quran questions, 9 Hadith questions, 3 boundaries; all nine input languages represented.
- Questions locked before live requests and checked for exact duplicates against 295 preceding planned benchmark questions, including all five stopped-pilot items. Themes and references can recur; this is not a measured ranking of popular questions.
- Requests sent only original claim plus automatic input/source selection. No expected locators or answers provided to the app.
- Same application and production build throughout; no edits or manual retries during the run. Normal bounded internal recovery remained enabled.
- All English/Arabic explanations and source proofs reviewed by the principal developer against admitted texts. This is not independent scholarly or native-language certification.
- Valid alternate primary evidence accepted: X18 found HadeethEnc 66526 instead of 65004; X26 found Quran 6:164 instead of 53:38. Both directly contain the required meaning.
- The API benchmark did not exercise voice, the browser journey, or independently review the additional translated display outputs. Three questions per non-English input language are not proof of general language accuracy.

## Evidence and cost

Question key: `artifacts/release30-round4-question-set-2026-10-05.json`.
Captured first pass: `artifacts/release30-round4-first-pass-2026-10-05.json`.
Mechanical audit: `artifacts/release30-round4-mechanical-audit-2026-10-05.json`.
Per-case principal review: `artifacts/release30-round4-principal-review-2026-10-05.json`.
Full provider/source records remain ignored under `artifacts/private/release30-round4-first-pass`.

App hash: `5118ffc539d2fcc78a588d0083bd8f2f72a7cfc3f3368998e91a42addfb56270`.
Build: `SVEvOLRtbYnGREzY_lq7L`.
Key hash: `5e581d726bb6fc7a0243c48d0eee7ff73d0b97a93420d8fd32a1656284be8f77`.
Run time: 02:57–03:06 Riyadh, 5 October 2026.
Previously completed offline gate: **380/380**; no application changes since that gate.

User approved development cap **44 SAR**. This run cost **4.777603875 SAR**; conservative development commitment is **42.2556946875 SAR**, leaving **1.7443053125 SAR** within the cap. The separate **15 SAR judging reserve** remains preserved.
