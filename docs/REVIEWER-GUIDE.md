# Try IsnadLens

Review the working product. There is no requirement to run the development suites or reproduce earlier failures.

Current preview: http://127.0.0.1:3100 (local prototype). A hosted competition URL will be added after deployment. Choose your display language from the selector; nine languages are available.

## Main verification

1. Open the main workbench. A clearly labelled previously checked example shows the evidence report immediately; it is not an answer to a newly typed question. Choose a starter question or type an Islamic source question in your own words, such as “Does trusting Allah mean I should stop planning and taking practical steps?”
2. Leave automatic language and Quran/Hadith selection enabled, or select the source you want to examine.
3. Press **Examine the evidence**.
4. Read the answer and its evidence. Each passage has its source reference, original wording and attribution. Published passage translations appear separately. **Listen** reads the explanation or passage aloud.
5. The visible **Evidence map** connects the question, retrieved sources, available context and actual result. **Create share card** previews an explicitly labelled excerpt, downloads a PNG or copies text.
6. **Download evidence receipt** saves the displayed question, answer and sources. **Save this check on this device** keeps a historical receipt and the question in this browser.

**365 distinct questions across 10 documented development evaluation sets, plus targeted reruns and offline/application checks. Latest frozen benchmark: 29/30 satisfactory responses (96.7%).** The 30-question final run is one part of the development history. Earlier versions and different datasets are counted as coverage, not pooled into a current-version accuracy claim. The product is an evidence assistant, not personal scholarly certification.

## Voice and image input

- Voice: choose the **Voice** tab, record a short question, stop, press **Transcribe**, review/edit the words, then **Use this text**.
- Image: choose the **Image** tab, then **Choose an image**. Select or paste a screenshot or photographed quote, press **Read image**, select and edit the extracted claim, then **Use this claim**.
- Both methods place reviewed text in the claim box. Press **Examine the evidence** when ready. Choosing a file or recording does not automatically verify it.

Text, PNG/JPEG/WebP images and short recordings are supported. Tap Voice to record, then Stop to place the transcription in the editable question. Tap Listen for automatic speech; Quran Arabic has a separate full-verse recitation control. Download evidence receipt produces a branded PDF. The free Google reader can pause at quota; typing remains available. Reading a screenshot extracts its claim rather than proving the photograph's authenticity.

## Recent checks

Open **Recent checks** to view or download saved receipts, load a saved question, delete one entry or clear that tool's saved checks. Loading a question does not spend verification credit. Saved entries stay on this device, with no account sync.

## Umrah and Hajj companion

Open `/pilgrimage`. Select an Umrah or Hajj topic or a starter question, then examine its source evidence. Use the separate Tawaf and Sa’i progress counters to record your own completed rounds. Questions outside pilgrimage can be transferred to the main workbench.

## Daily tools

Open `/tools`. Choose a city or your coordinates, check the calculation method and request prayer times. The page shows the location timezone and next calculated prayer countdown. Save a location for reuse if desired. Qibla gives a bearing from true north. Gregorian/Hijri conversion and the month calendar are also available.

## Supporting evidence

The app's `/evaluation/latest` page shows the latest provided benchmark. [Current results packet](../artifacts/reviewer-evidence-index.json). Reviewers can inspect these results and use the working product; no historical test reruns are required.

The current interface retains your selected display language across the verification workspace, companion, daily tools and reloads. The saved landing example includes separate branded PDF receipt and PNG share exports. Its exports identify the historical abridged example. Attached audio icons provide explanation reading and separately recorded Quran recitation. Current UI audit: `artifacts/site-polish-2026-10-05.json`; automated suite: 459 passing checks across 40 files. These interface checks do not change the reported semantic benchmark. Predefined journey questions outside Arabic remain explicitly labelled English; navigation and counter controls support all nine display languages.

The landing example is now a curated source-based illustration answering the displayed planning question with No. Question, explanation, audio, share card and PDF use the selected language. The stored earlier assessment remains unchanged as evidence provenance. Automated accessibility results: `artifacts/accessibility-audit-2026-10-05.json` (12 tested views, zero detected WCAG violations; not a complete UX/content review). Reviewed screenshot regression tests are in `qa/`; run the Playwright test configuration without updating snapshots to detect unintended visual changes. The original semantic benchmark remains unchanged.
