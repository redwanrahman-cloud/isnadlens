# Try IsnadLens

Review the working product. There is no requirement to run the development suites or reproduce earlier failures.

Live application: https://isnadlens.alfarrajpolyclinic.com. Choose your display language from the compact selector; nine languages are available, with Arabic and English the immediate presentation focus. Read the [Arabic project and testing report](submission-ar/IsnadLens-Arabic-Submission-and-Testing.pdf).

## Main verification

1. Open the main workbench. A clearly labelled previously checked example shows the evidence report immediately; it is not an answer to a newly typed question. Choose a starter question or type an Islamic source question in your own words, such as “Does trusting Allah mean I should stop planning and taking practical steps?”
2. The input language follows the selected display language by default. Change the small language control in the composer if needed. Leave Quran/Hadith selection automatic, or choose the source scope.
3. Press **Examine the evidence**.
4. Read the answer and its evidence. Each passage has its source reference, original wording and attribution. Published passage translations appear separately. **Listen** reads the explanation or passage aloud.
5. The visible **Evidence map** connects the question, retrieved sources, available context and actual result. **Create share card** previews an explicitly labelled excerpt, downloads a PNG or copies text.
6. **Download evidence receipt** saves the displayed question, answer and sources. **Save this check on this device** keeps a historical receipt and the question in this browser.

**425 distinct normalized question texts across 12 completed major live evaluation sets, plus separately recorded targeted reruns and offline/application checks. Latest complete frozen benchmark: 29/30 satisfactory responses (96.7%).** Round seven includes 23/24 satisfactory religious answers and 6/6 correct boundary responses. Earlier versions and different datasets are coverage, not pooled current-version accuracy. [Round-seven report](VERIFICATION-ROUND7-MIXED-2026-10-06.md), [count audit](submission-ar/testing-volume-audit.json). The product is an evidence assistant, not personal scholarly certification.

## Voice and image input

- Voice: tap the microphone inside the typing box, record a short question and stop. Review/edit the transcribed words before submitting.
- Image: use the **plus** menu to choose an image or take a photo, where camera access is available. Review the extracted text before verification.
- Both methods place reviewed text in the claim box. Press **Examine the evidence** when ready. Choosing a file or recording does not automatically verify it.

Text, PNG/JPEG/WebP images and short recordings are supported. Tap Voice to record, then Stop to place the transcription in the editable question. Tap Listen for automatic speech; Quran Arabic has a separate full-verse recitation control. Download evidence receipt produces a branded PDF. The free Google reader can pause at quota; typing remains available. Reading a screenshot extracts its claim rather than proving the photograph's authenticity.

## Recent checks

Open **Recent checks** to view or download saved receipts, load a saved question, delete one entry or clear that tool's saved checks. Loading a question does not spend verification credit. Saved entries stay on this device, with no account sync.

## Umrah and Hajj companion

Open `/pilgrimage`. Select an Umrah or Hajj topic or a starter question, then examine its source evidence. Use the separate Tawaf and Sa’i progress counters to record your own completed rounds. Questions outside pilgrimage can be transferred to the main workbench.

## Daily tools

Open `/tools`. Choose a city or your coordinates, check the calculation method and request prayer times. The page shows the location timezone and next calculated prayer countdown. Save a location for reuse if desired. Gregorian/Hijri conversion and the month calendar are also available. The Qibla interface has been removed.

## Supporting evidence

The app's `/evaluation/latest` dashboard retains earlier evaluation history. The [round-seven report](VERIFICATION-ROUND7-MIXED-2026-10-06.md) and [current results packet](../artifacts/reviewer-evidence-index.json) identify the latest complete benchmark. Reviewers can inspect these results and use the working product; no historical test reruns are required.

The interface retains your selected display language across the verification workspace, companion, daily tools and reloads. The landing example includes branded PDF receipt and PNG share exports, labelled as a curated illustration. Attached audio controls provide explanation reading and separately recorded Quran recitation. Historical UI audit: `artifacts/site-polish-2026-10-05.json`. Latest recorded full offline regression: 542 passing checks across 51 files after the tawaf repair. These checks do not change the frozen semantic benchmark. Predefined journey questions outside Arabic remain explicitly labelled English; navigation and counter controls support all nine display languages.

The landing example is now a curated source-based illustration answering the displayed planning question with No. Question, explanation, audio, share card and PDF use the selected language. The stored earlier assessment remains unchanged as evidence provenance. Automated accessibility results: `artifacts/accessibility-audit-2026-10-05.json` (12 tested views, zero detected WCAG violations; not a complete UX/content review). Reviewed screenshot regression tests are in `qa/`; run the Playwright test configuration without updating snapshots to detect unintended visual changes. The original semantic benchmark remains unchanged.
