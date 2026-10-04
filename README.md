# IsnadLens · عدسة الإسناد

A source-first workbench for examining bounded Arabic and English Islamic claims. Citation integrity and model-assisted interpretation are separate. This is not a fatwa or scholarly approval.

## Current increment

Six selectable display languages (Arabic, English, Bangla, Hindi, Urdu, Indonesian), Arabic/English fresh claim input, immutable Tanzil Arabic Quran editions, official HadeethEnc workbooks in six languages, lexical retrieval, exact raw/quotation/locator/hash validation, scope referral, sealed evidence records and a structured semantic-provider adapter. Real OpenAI assessment and on-demand translations of project explanations were tested within the authorized persistent development spending cap. Explanations are labelled unreviewed; source quotations are never translated or overwritten by language switching. Model comparison, final evaluation, live hosting and the pilgrimage guide are not complete.

The first repository commit was created during the authorized event window. See PRE_CHALLENGE_DISCLOSURE.md and docs/BUILD-LEDGER.md for the research disclosure and starting-state record. The GitHub repository is private during development.

## Local setup

Requires Node.js 20.9 or later and npm.

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

Hadith: [HadeethEnc.com](https://hadeethenc.com/en/home), official unchanged Arabic, English, Bangla, Hindi, Urdu and Indonesian workbooks acquired 4 October 2026. [Source conditions and admission](docs/source-rights/HADEETHENC-ADMISSION.md). Publisher grades are attributed, never independently assigned. To reproduce, run `node scripts/download-hadeethenc.mjs`, then `python scripts/prepare-hadeethenc.py` with openpyxl installed. Different acquisitions can change hashes and require deliberate re-admission of pins. No Quran translations or pilgrimage corpus is admitted.

Lexical retrieval has limited English vocabulary and can miss relevant passages. A retrieved verse is not by itself proof of a claim. AI judgments are provisional and require qualified human review. Mechanical test results do not measure religious correctness.

## Release gates still open

Independent linguistic review; untouched final evaluation after freeze; durable deployment controls; clean public clone; hosting; presentation; 115-second video; final human approval and submission.

## Development probes

With the local server running, `node scripts/validate-development.mjs` examines six Arabic/English development claims. This uses the configured paid provider only after existing authorization and budget checks; it is not an independent religious benchmark. Run a single case by adding its ID, for example `node scripts/validate-development.mjs fabricated-arabic-quote`. Full source-bearing records stay in ignored `artifacts/private`; commit-safe summaries contain verdicts, reasons, source locators, integrity checks and usage. A correct refusal must use the intended reason, not merely return the expected verdict.
