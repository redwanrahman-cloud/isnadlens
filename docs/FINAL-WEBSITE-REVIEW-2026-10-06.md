# Final public website review — 6 October 2026

The live website documentation now reflects round 7 and the audited submission facts. This was a content and application-flow review, not a new live model benchmark.

## Changes

- `/evaluation/latest` uses the preserved round-7 run, key and review: 29/30 satisfactory, 23/24 religious, 6/6 boundary, 425 distinct question texts across 12 major sets. All 30 outcomes remain visible.
- N09 is described as a qualified answer differing from the expected response. The typo was understood and Quran 27:30 retrieved. It does not establish a language defect. Historical records and scores were not rewritten.
- Arabic and English approach, evaluation and source pages follow the workspace language, with a simple AR/EN documentation switch. Other app languages retain their existing behavior.
- Individual authorship and AI assistance, offline-check scope, measured 11–15 SAR/100-text-question estimate and temporary AWS-credit coverage are explicit.
- Earlier evaluation pages are labeled historical archives. `/design` now redirects to the shipped workspace; its original prototype remains in Git history.
- The build allowlist includes the new public reports. Release packaging now checks this allowlist before shipping imported evaluation records.

## Checks performed

- TypeScript passed. Full offline suite: 542 tests in 51 files passed. The initial Windows sandbox invocation could not resolve temporary test modules; the normal-environment rerun passed.
- All twelve evaluation artifact SHA-256 values matched the submission audit; the recorded set counts total 425.
- Linux production build passed and authenticated all 27 immutable source files. The first build exposed a stale Docker report allowlist; it was corrected before activation.
- Sixteen public page, redirect, icon and availability requests returned HTTP 200. `/design` resolved to `/`. Origin readiness: ready, sources admitted, inference enabled.
- Browser review: English and Arabic home and documentation; all 30 recorded cases; all twelve history rows; navigation and language persistence; supporting-tool pages; default-Makkah prayer lookup/countdown; date conversion and monthly calendar; pilgrimage topic selection; reversible Tawaf counter increment/undo; attachment menu; saved-checks view; share-card preview.
- 390px browser-width checks: Arabic and English results, source page and Arabic workspace. Results and source pages had no horizontal overflow. This is browser emulation, not a physical-phone test.
- The Arabic curated-example PDF downloaded successfully (87,208 bytes, three A4 pages), with its illustrative/no-new-assessment label. All pages were visually inspected. The browser automation download wait timed out, but the completed file was recovered from Downloads and verified.
- No new paid verification, speech, transcription or image-inference request was made. Microphone capture, camera capture and new live answers were not retested.

## Deployment

Live image: `isnadlens:20261006-content-review`

Image ID: `sha256:7e06da51dfe50e2f7035bb583e34f970748d6a9d6ab64c5ae799d3bdf9265863`

Release directory: `/srv/isnadlens/releases/20261006-content-review`.

The source archive SHA-256 was `14036fa8d41a92c041c58d5cd3f77671a0b8fd9affee6b9974c5d51b56856bcf`. The `.dockerignore` public-report allowlist was corrected after extraction before the successful build. The committed source and allowlist describe the final runtime content; the original archive alone does not.

The previous favicon release/container is retained. Runtime secrets, source editions, model configuration, persistent accounting and budget settings were not changed.
