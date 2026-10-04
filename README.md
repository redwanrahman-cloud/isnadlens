# IsnadLens · عدسة الإسناد

A source-first workbench for examining bounded Arabic and English Islamic claims. Citation integrity and model-assisted interpretation are separate. This is not a fatwa or scholarly approval.

## Current increment

Arabic/English responsive workbench, admitted immutable Tanzil Arabic Quran editions, lexical retrieval, exact raw/quotation/locator/hash validation, scope referral, sealed evidence records and a structured semantic-provider adapter. Fresh AI assessment remains disabled pending API access and explicit paid-call authorization. Four additional output languages, model comparison, final evaluation, live hosting and the pilgrimage guide are not complete.

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

The interface and mechanical tests can run without an API key. OpenAI model availability, billing and account rate limits must be verified before inference. No paid API call, deployment or public publication occurred in this first increment.

## Sources and trust

Source: [Tanzil Project](https://tanzil.net). Arabic display: Uthmani v1.1. Exact search: the separate official Simple Clean v1.1 edition. Text is unchanged; editions join only by surah:ayah. [Licence and admission](docs/source-rights/TANZIL-ADMISSION.md). The application does not independently authenticate Hadith. No Hadith, Quran translation or pilgrimage corpus is admitted.

Lexical retrieval has limited English vocabulary and can miss relevant passages. A retrieved verse is not by itself proof of a claim. AI judgments are provisional and require qualified human review. Mechanical test results do not measure religious correctness.

## Release gates still open

Real authorized semantic assessment; controlled model comparison; six-language semantic and immutable-field checks; untouched final evaluation after freeze; durable deployment controls; clean public clone; hosting; presentation; 115-second video; final human approval and submission. Source permissions remain independent of technical progress.
