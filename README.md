# IsnadLens · عدسة الإسناد

An evidence assistant for Islamic questions in nine languages. Ask in your own words, review the explanation and inspect the original Quran/Hadith sources. Text, reviewed voice dictation and screenshot/photo text input are available.

## Review the working product

Use the [product walkthrough](docs/REVIEWER-GUIDE.md). Current preview: http://127.0.0.1:3100. A hosted competition URL will be added after deployment.

- `/` — verification, source evidence, published passage translations, read-aloud, reviewed voice/image inputs and optional recent checks.
- `/pilgrimage` — focused Umrah/Hajj source questions, topic shortcuts and manual Tawaf/Sa’i progress.
- `/tools` — prayer calculations and countdown, saved locations, Gregorian/Hijri calendars/conversion and Qibla bearing.
- `/evaluation/latest` — the provided latest verification results.

Reviewers use the working product and inspect the results we provide. No development-suite reruns or reproduction of historical failures is required.

The emerald/ivory workspace presents the assessed explanation separately from original evidence. A visible evidence map, attached read-aloud controls, downloadable receipt and labelled PNG share-card excerpt support inspection and sharing. Daily tools remain available through compact navigation. [Responsive UI checks](artifacts/dashboard-design-2026-10-05.json).

## Provided results

Latest verification benchmark: **over 95% success — 96.7% satisfactory responses** in the tested sample (29/30), including 26/27 religious questions and 3/3 boundary requests. Zero incorrect decisive answers, inadequate decisive proofs or badge/explanation mismatches were found in this set. One context-related withholding remains in the denominator. [Recorded results](docs/RELEASE30-ROUND5.md).

Current application checks: **448 tests across 38 files**, TypeScript and production build passed. Desktop/mobile-width checks passed starters in all nine languages, explicit saved-check persistence, receipt download, reload, deletion/clearing and reviewed text/voice/image handoffs without automatic verification. [Journey evidence](artifacts/input-journeys-2026-10-05.json). Four live image-reader controls passed: English, Arabic, blank and embedded-instruction screenshots. [Image evidence](artifacts/image-input-checks-2026-10-05.json).

[Current results packet](artifacts/reviewer-evidence-index.json) is the compact machine-readable index. UI/microphone mocks and feature controls are disclosed separately from the semantic benchmark. These are observed results, not general accuracy, physical-device certification or independent scholarly approval. Later convenience additions do not change the frozen benchmark score.

## Product behavior and sources

Nine input/display languages: Arabic, English, Bangla, Hindi, Urdu, Indonesian, Spanish, French and German. Original input and source quotations are retained. Published passage translations appear separately; project explanations translated from English are labelled as such. Automatic language/source routing supports ordinary questions rather than requiring exact quotations.

Direct Quran evidence is sufficient where it proves the proposition. Hadith grades and references remain publisher-attributed. The app examines meaning against bounded evidence, preserves source conditions and refers personal rulings. It is not a personal fatwa service.

- [Tanzil Arabic Quran](docs/source-rights/TANZIL-ADMISSION.md): unchanged Uthmani/Simple Clean v1.1 editions and notices.
- [Official HadeethEnc editions](docs/source-rights/HADEETHENC-ADMISSION.md): nine language workbooks, publisher references and grading.
- [QuranEnc passage translations](docs/source-rights/quranenc/ADMISSION.md): separate published translations of meanings; no replacement of Arabic evidence.

Frameworks: Next.js 16.3.8, React 19.3, TypeScript 7, Zod 4, Sharp 0.35.5; Vitest 5 and Playwright 1.63 for checks. Luna handles initial understanding/assessment; Terra independently reviews decisive interpretation. Google free-tier services provide natural speech, dictation and image transcription. Voice/image inputs require review and an explicit verification click. No paid Google fallback is used.

## Developer setup

This is optional setup for running the repository, not a reviewer testing requirement. Node.js 24 LTS, npm, Python/openpyxl for Hadith preparation and network access for source preparation are needed.

```sh
npm ci
npm run corpus:prepare
node scripts/download-hadeethenc.mjs
python scripts/prepare-hadeethenc.py
node scripts/prepare-quranenc.mjs
npm run dev
```

Source acquisitions must match the documented pins and notices. Changed publisher files require deliberate re-admission rather than bypassing integrity checks. Joined corpora are excluded from Git and prepared locally. Configure server-side keys with `.env.example` and ignored `.env.local`; never publish keys. Paid OpenAI requests need an authorized spending cap; Google features need the confirmed unpaid project. Local filesystem spending guards require durable shared controls before multi-instance hosting.

Developers can run `npm test`, `npm run typecheck` and `npm run build`. `scripts/check-input-journeys.mjs` uses installed Chrome, mocked providers/microphone and a public trimmed UI fixture; it makes no paid calls and creates its own synthetic image. Private user images, audio and development captures remain excluded from Git.

Implementation began during the authorized competition window; [pre-challenge disclosure](PRE_CHALLENGE_DISCLOSURE.md). Git commits and the development archive preserve engineering provenance. Current work is a local prototype; evening visual design, physical-device checks, hosting controls, deployment, presentation/video and final submission remain pending.
