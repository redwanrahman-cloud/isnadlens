# IsnadLens · عدسة الإسناد

An evidence assistant for Islamic questions in nine languages. Ask in your own words, review the explanation and inspect the original Quran/Hadith sources. Text, reviewed voice dictation and screenshot/photo text input are available.

## Review the working product

Open the [live application](https://isnadlens.alfarrajpolyclinic.com) and the [product walkthrough](docs/REVIEWER-GUIDE.md). The [Arabic submission/testing report](docs/submission-ar/IsnadLens-Arabic-Submission-and-Testing.pdf) documents the project, latest benchmark, development history and measured usage-cost estimates.

- `/` — verification, source evidence, published passage translations, read-aloud, reviewed voice/image inputs and optional recent checks.
- `/pilgrimage` — focused Umrah/Hajj source questions, topic shortcuts and manual Tawaf/Sa’i progress.
- `/tools` — prayer calculations and countdown, saved locations and Gregorian/Hijri calendars/conversion. The Qibla interface has been removed.
- `/evaluation/latest` — current round-seven results, the 425-question development audit and clearly labelled earlier evaluation history.

Reviewers use the working product and inspect the recorded results. No development-suite reruns or reproduction of historical failures is required.

The emerald/ivory workspace presents the assessed explanation separately from original evidence. A visible evidence map, attached read-aloud controls, downloadable receipt and labelled PNG share-card excerpt support inspection and sharing. Daily tools remain available through compact navigation. [Responsive UI checks](artifacts/dashboard-design-2026-10-05.json).

## Provided results

Latest complete verification benchmark: **29/30 satisfactory responses (96.7%)** in the tested sample, including 23/24 religious questions and 6/6 boundary requests. No incorrect decisive conclusion was found in this sample. One source-grounded qualified answer did not meet the frozen expectation and remains in the denominator. [Round-seven results and limits](docs/VERIFICATION-ROUND7-MIXED-2026-10-06.md).

Development coverage: **425 distinct normalized question texts across 12 completed major live sets**. This conservative count excludes targeted reruns and smaller probes. Earlier versions and datasets are not pooled into a current-version accuracy estimate. [Audited inputs and hashes](docs/submission-ar/testing-volume-audit.json). A separate offline lab passed 2,924 replay/integrity checks around 150 historical records; these are not additional live religious answers.

Independent application review on 6 October: **543 tests across 52 files passed** on commit `6f335fe`; [review scope and evidence](artifacts/independent-application-review-2026-10-06.json). This is an offline application regression, not another live semantic benchmark. The preceding recorded suite passed 542 tests across 51 files, with TypeScript passed after the tawaf retrieval repair. [Hosted smoke test and targeted repair](docs/HOSTED-SMOKE-AND-TAWAF-REPAIR-2026-10-06.md). The later content-review Linux production build and public route checks passed; see the [final website review](docs/FINAL-WEBSITE-REVIEW-2026-10-06.md). Earlier desktop/mobile and image checks remain available as historical evidence: [input journeys](artifacts/input-journeys-2026-10-05.json), [image controls](artifacts/image-input-checks-2026-10-05.json). They do not certify every physical device or every current hosted media interaction.

[Current results packet](artifacts/reviewer-evidence-index.json) is the compact machine-readable index. UI/microphone mocks and feature controls are disclosed separately from the semantic benchmark. These are observed results, not general accuracy, physical-device certification or independent scholarly approval. Later convenience additions do not change the frozen benchmark score.

## Product behavior and sources

Nine input/display languages: Arabic, English, Bangla, Hindi, Urdu, Indonesian, Spanish, French and German. Original input and source quotations are retained. Published passage translations appear separately; project explanations translated from English are labelled as such. Automatic language/source routing supports ordinary questions rather than requiring exact quotations.

Direct Quran evidence is sufficient where it proves the proposition. Hadith grades and references remain publisher-attributed. The app examines meaning against bounded evidence, preserves source conditions and refers personal rulings. It is not a personal fatwa service.

- [Tanzil Arabic Quran](docs/source-rights/TANZIL-ADMISSION.md): unchanged Uthmani/Simple Clean v1.1 editions and notices.
- [Official HadeethEnc editions](docs/source-rights/HADEETHENC-ADMISSION.md): nine language workbooks, publisher references and grading.
- [QuranEnc passage translations](docs/source-rights/quranenc/ADMISSION.md): separate published translations of meanings; no replacement of Arabic evidence.

Frameworks: Next.js 16.3.8, React 19.3, TypeScript 7, Zod 4, Sharp 0.35.5; Vitest 5 and Playwright 1.63 for checks. Luna handles initial understanding/assessment; Terra independently reviews decisive interpretation. Google free-tier services provide natural speech, dictation and image transcription. Voice/image inputs require review and an explicit verification click. No paid Google fallback is used.

## Developer setup

The repository is public. To reproduce the submitted build, use Node.js 24 LTS, npm and Python 3.10+ (standard library only). The pinned source snapshot is included in a normal clone or GitHub source ZIP; no separate corpus access request is needed.

```sh
python scripts/restore-sources.py
node deploy/check-source-bundle.mjs
npm ci
npm run dev
```

Restoration checks all 27 immutable runtime files before writing and makes no model or network calls. See [snapshot contents, versions and publisher rights](resources/README.md). Extracted corpora remain Git-ignored; the compressed, checksummed snapshot is committed. The older acquisition scripts are for future source admission, not this quick start. Changed publisher files require deliberate re-admission rather than bypassing integrity checks. The interface, prepared example and offline checks do not require model keys. For live verification, copy `.env.example` to ignored `.env.local`, supply your own server-side keys and explicitly enable an authorized spending cap; live inference is off by default. Never publish keys. Paid OpenAI requests need an authorized spending cap; Google features need the confirmed unpaid project. Local filesystem spending guards require durable shared controls before multi-instance hosting.

Developers can run `npm test`, `npm run typecheck` and `npm run build`. `scripts/check-input-journeys.mjs` uses installed Chrome, mocked providers/microphone and a public trimmed UI fixture; it makes no paid calls and creates its own synthetic image. Private user images, audio and development captures remain excluded from Git.

Implementation began during the authorized competition window; [pre-challenge disclosure](PRE_CHALLENGE_DISCLOSURE.md). Git commits and the development archive preserve engineering provenance. The application is deployed on AWS Lightsail behind HTTPS and Cloudflare. The final [Arabic demonstration video](https://youtu.be/RwM9KjWhHX8) and official portal submission were completed on 6 October 2026; the saved entry and its attached presentation were inspected independently. Broader physical-device testing and independent scholarly review remain future validation work. Publishing this documentation alone does not constitute a competition submission.

### PDF and recorded audio runtime

Receipt downloads (including saved receipts) are branded PDFs produced with `playwright-core`. The Node server needs Chrome available on the host, or set `ISNADLENS_CHROMIUM_PATH` to a deployed Chromium executable. Provision Arabic-capable system fonts (for example Noto Sans Arabic) for correct joining and diacritics. No receipt text is sent to an external PDF provider. PDF pages run without JavaScript and cannot fetch external resources. Deployments must smoke-test `/api/receipt`; a missing browser returns an explicit unavailable response, not a text file renamed as PDF.

Voice dictation starts on the Voice tap and automatically hands the transcription to the editable question when stopped. It never submits verification automatically. Explanation/translation Listen uses the configured free Google voice automatically, falling back to the device default. Playback begins after the user's Listen tap; restrictive browser policies may require a second tap on that same button. Quran Arabic uses full-verse recitation by Mishary Rashid Alafasy directly from EveryAyah, separate from synthetic speech. Audio rights remain with their holders; recordings are streamed, not redistributed as local corpus files.
