# IsnadLens · عدسة الإسناد

A source-first workbench for examining bounded Islamic claims in nine languages. Citation integrity and model-assisted interpretation are separate. This is not a fatwa or scholarly approval.

## Current increment

Nine selectable input/display languages (Arabic, English, Bangla, Hindi, Urdu, Indonesian, Spanish, French, German), automatic language detection, immutable Tanzil Arabic Quran editions, official HadeethEnc workbooks in nine languages, bounded AI-assisted bilingual search expansion, lexical retrieval, exact raw/quotation/locator/hash validation, scope referral, sealed evidence records and a structured semantic-provider adapter. Real OpenAI assessment and translations of project explanations were tested within the authorized persistent development spending cap. Explanations are labelled unreviewed; original source quotations are never overwritten by language switching; separate published translations are identified alongside them. Detection and routing do not establish independent linguistic or religious approval. Final evaluation, live hosting and the pilgrimage guide remain open.

The first repository commit was created during the authorized event window. See PRE_CHALLENGE_DISCLOSURE.md and docs/BUILD-LEDGER.md for the research disclosure and starting-state record. The GitHub repository is private during development.

## Local setup

Requires Node.js 24 LTS and npm for the complete source-preparation workflow (QuranEnc uses node:sqlite).

```sh
npm ci
npm run corpus:prepare
npm test
npm run typecheck
npm run build
npm run dev
```

Open http://127.0.0.1:3100. Corpus preparation downloads only the two authorized Arabic Tanzil editions with normal TLS validation, retains their complete notices, validates all 6,236 locators and hashes, and writes private local data. Do not substitute translations or transformed source text. Network access is required for preparation and dependency installation. Raw files and joined source text are excluded from Git; source notices, provenance and a reproducible acquisition script are included.

## API boundary

Copy .env.example to .env.local for local configuration. Never paste API keys into chat or commit secrets. Paid requests require both an API key and explicit authorization; disabling authorization leaves a useful authentic passage search with a truthful not-evaluated state. It never substitutes canned successful verdicts.

The interface and mechanical tests can run without an API key. OpenAI model availability, billing and account rate limits must be verified before inference. Paid development calls are authorized up to 10 SAR, while at least 15 SAR is reserved for judging. There is no deployment or public publication yet. The local spending ledger requires durable shared atomic storage before enabling calls on multiple hosted instances.

## Sources and trust

Source: [Tanzil Project](https://tanzil.net). Arabic display: Uthmani v1.1. Exact search: the separate official Simple Clean v1.1 edition. Text is unchanged; editions join only by surah:ayah. [Licence and admission](docs/source-rights/TANZIL-ADMISSION.md).

Hadith: [HadeethEnc.com](https://hadeethenc.com/en/home), official unchanged Arabic, English, Bangla, Hindi, Urdu, Indonesian, Spanish, French and German workbooks acquired 4 October 2026. [Source conditions and admission](docs/source-rights/HADEETHENC-ADMISSION.md). Publisher grades are attributed, never independently assigned. To reproduce, run `node scripts/download-hadeethenc.mjs`, then `python scripts/prepare-hadeethenc.py` with openpyxl installed. Different acquisitions can change hashes and require deliberate re-admission of pins. Seven QuranEnc translations of meanings are admitted for separate passage display, with exact footnotes, metadata, versions and notices; they do not extend the semantic-verification corpus. [Admission](docs/source-rights/quranenc/ADMISSION.md). Reproduce with `node scripts/prepare-quranenc.mjs` after preparing the Arabic Quran. Bangla Quran translations remain direct publisher links until their required version is verified. No pilgrimage corpus is admitted.

Auto examines ordinary claims and general source questions across Quran and Hadith without requiring an exact quotation. A budgeted multilingual intake detects language and supplies a neutral English routing gloss plus Arabic/English search terms; the original claim is preserved and assessed. Uncertain detection requests explicit selection. Search terms cannot supply scripture, locators, grades or a verdict. Retrieved publisher records must pass source checks before semantic assessment. Direct Quran support is sufficient for a generic claim; irrelevant Hadith does not require additional corroboration. Source attribution, conditions and unsupported additional assertions remain material. Every mini-model contradiction requires a bounded strong-model confirmation on the same input/evidence. Retrieval can still miss relevant passages. AI judgments are provisional; mechanical tests do not measure religious correctness. See [development evaluation](docs/COMMON-QUERY-EVALUATION.md).

## Release gates still open

Independent linguistic review; untouched final evaluation after freeze; durable deployment controls; clean public clone; hosting; presentation; 115-second video; final human approval and submission.

## Development probes

With the local server running, `node scripts/validate-development.mjs` examines six Arabic/English development claims. This uses the configured paid provider only after existing authorization and budget checks; it is not an independent religious benchmark. Run a single case by adding its ID, for example `node scripts/validate-development.mjs fabricated-arabic-quote`. Full source-bearing records stay in ignored `artifacts/private`; commit-safe summaries contain verdicts, reasons, source locators, integrity checks and usage. A correct refusal must use the intended reason, not merely return the expected verdict.

## Passage translations and read-aloud

Nine input/display languages are selectable. Published passage translations appear separately alongside the unchanged original. Explanation translations remain unreviewed project text. Browser Listen/Stop controls use matching available device voices. An optional server-side Google free-tier reader produces WAV audio with native browser playback, cache and quota stops; it requires a locally configured key and confirmation of an unpaid project. No paid speech fallback is used. Live English/Arabic audio generation and identical-byte cache reuse passed; physical-phone playback and pronunciation quality remain unverified. Synthesis is assistive reading rather than recorded Quran recitation. [Free reader setup](docs/FREE-SPEECH.md), [read-aloud boundary](docs/READ-ALOUD.md).
