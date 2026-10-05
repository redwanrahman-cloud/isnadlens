# Approved redesign and competition finishing

## Ownership and provenance — 5 October 2026

Redwan selected the independent navy/blue, light-surface design shown in the
interactive `/design` preview, then asked this chat to take over finishing the
original project. Redwan subsequently refined that direction: retain its modern polish, restore
emerald/ivory/gold, and keep the question, explanation and primary source visible
together. Source badges communicate text integrity; they do not certify the
interpretation. This final direction supersedes the blue, tabbed result layout.
It does not replace the verification engine or its evidence policy.

Work continues on `design/competition-finish`, a branch of the original
repository starting at `6af76583d812e9982cc07311198152f5ddd19adc`. A separate Git
worktree protects the existing preview during implementation. Earlier commits,
evaluation failures, source-admission records and build dates remain unchanged.
The approved preview was created on 5 October within the declared event window.
It uses the existing curated example, never a fabricated live verification.

## What the project is for

IsnadLens / عدسة الإسناد is Redwan's individual entry in Track 4, Knowledge and
Verification Tools for Islamic Outreach. Its primary audience is people who need
to check Islamic questions, claims and interpretations against traceable sources.
The interface must help them understand an answer, inspect original evidence and
recognize limits or referrals. It must distinguish quotation integrity, model
interpretation, published translations and qualified human review.

The app is not a personal fatwa service. Hadith grading remains attributed to the
publisher. General questions and faithful paraphrases remain supported inputs;
this finishing work does not tighten semantic acceptance or add new source rules.

## Established product and evidence

- Nine input/display languages; immutable original input and source quotations.
- Admitted Tanzil Quran and HadeethEnc editions; separately attributed QuranEnc
  translations, with the documented Bangla Quran-link limitation.
- Existing Luna/Terra interpretation, retrieval, review and sealed-record pipeline.
- User-triggered voice/image input, explanation reading, Quran recitation,
  PDF receipts, share cards and optional local saved checks.
- Secondary Umrah/Hajj questions and manual counters; prayer, calendar and Qibla tools.
- Latest frozen benchmark: 29/30 satisfactory responses (96.7%) on that sample.
  One context-related withholding remains recorded. No general accuracy or
  independent scholarly certification is claimed.
- 365 distinct questions across ten documented development sets describe coverage,
  not a pooled accuracy score. Later UI tests do not change either figure.

The older morning handover and release checklist contain superseded milestones.
Use `RELEASE30-ROUND5.md`, `ENGINEERING-HISTORY.md`, the latest build-ledger entries
and the current code for completed verification work.

## Design and implementation priorities

1. Carry the approved visual design into the real application: persistent desktop
   navigation, compact mobile navigation, clear question entry and comfortable reading.
2. Keep verification primary in a single dual-panel workspace. Show the explanation,
   primary original passage and published translation together, without result
   tabs. Use an integrity badge and a horizontal, inspectable evidence flow;
   technical metadata and additional passages may expand on demand.
3. Preserve all nine languages and explicit display preferences, RTL, keyboard
   focus, source attribution, limits and review labels.
4. Repair the independently reproduced application issues: receipt failure hiding
   answers; translation omissions in receipts; voice-to-starter state; saved-location
   settings; share-dialog focus; localization gaps; actionable rate-limit errors;
   custom-coordinate selection and invalid receipt JSON handling.
5. Give pilgrimage Ask/Learn/Count navigation and daily tools the same design system.
6. Finish focused UI regression checks, type checking, production build and visual
   review. Keep UI evidence separate from semantic benchmark evidence.

## Competition finishing gates

The official participant guide requires a functioning product, a working live
demo, a public GitHub repository with publishable complete code/run documentation,
source/tool/licence records, a PDF/PowerPoint presentation and a video no longer
than two minutes. The recovered plan records 6 October 23:59 Riyadh as the close;
confirm the submission portal before final submission. Internal submission target:
6 October 20:00 Riyadh.

The source corpus, local spend ledger, PDF browser dependency and process-local
limits require a suitable hosting arrangement. Hosting readiness is still a real
release task; a polished local UI does not establish deployment readiness.
Presentation/video and a submission receipt are also not yet confirmed complete.

Official references re-opened during this takeover:
- https://islamicaich.org/?lang=en
- https://islamicaich.org/files/Hackathon/i2xgA3mxVhrbRe0ReLlA86kTDbFZ9QQ9eb856dq8.pdf

## Work and history discipline

- Make focused, accurately dated commits with the problem, resulting behavior and
  validation in their descriptions. Append milestones to `BUILD-LEDGER.md`.
- Do not rewrite, squash away or re-date the earlier competition history.
- Keep the approved design reference and the actual implementation distinguishable.
- Preserve original semantic outputs and benchmark records. No new live provider
  testing is authorized for this finishing run; request a specific limited allowance
  if needed. The finishing preview has provider calls disabled locally.
- Do not publish credentials, private provider records, user recordings or private
  images. A copied configuration does not transfer spending authorization.
- Prepare release artifacts before any requested external publication, deployment
  or final submission. Do not infer those actions from local design approval.
