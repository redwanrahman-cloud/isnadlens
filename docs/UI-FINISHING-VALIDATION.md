# Modern scholarly workspace — validation, 5 October 2026

## Final direction

Redwan approved the modern prototype, then explicitly refined it to combine its
spacing, typography and navigation with emerald, ivory and restrained gold.
Desktop question entry and the evidence report share one workspace. The answer,
primary quotation, source badge and available published translation are visible
together, without result tabs. Additional passages and technical metadata can
expand. The original navy prototype remains at `/design` as a historical design
reference, not the submission interface.

Source badges describe quotation integrity, not independent scholarly approval
or the correctness of a model interpretation. The initial example is explicitly
curated and is not presented as a new live assessment.

## Checks completed

- Full offline automated suite: **471 passed in 42 files**. This includes saved
  prayer-profile validation and malformed receipt request regressions.
- Final production build, including TypeScript and static generation: passed.
- Local production browser checks with model/media requests intercepted: French
  display selection persists after English input; question, answer, Arabic source
  and published French translation remain exposed together; a simulated PDF 503
  retains the report; Escape returns focus to the share button; a saved question
  returns to text mode with editor focus.
- London profile saved with Muslim World League calculation and Hanafi Asr,
  switched to Riyadh, then restored with London timezone and both saved choices.
  Selecting custom coordinates remains selected. No location lookup was sent.
- Responsive DOM checks at approximately 390 CSS pixels for all nine languages:
  no horizontal document overflow; Arabic and Urdu use RTL. Desktop layout at
  approximately 1440 CSS pixels keeps both columns. Desktop English and mobile
  Arabic text rendering were visually inspected. Browser zoom affected screenshot
  scaling; this is browser emulation, not a physical-device certification.
- Verification engine, historical assessment outputs and source records were not
  changed. No new live model or paid semantic tests were used.

## Limits and remaining release work

This milestone completes the revised workspace direction and the listed fixes.
It does not certify the whole submission as ready. The independent review's
remaining receipt translation parity, secondary-label localization, and richer
rate-limit recovery follow-ups remain open. Existing provider budget restrictions remain in place.

Hosting, physical-device checks, final presentation/video, public-release review
and competition submission remain release tasks. Benchmark results remain 29/30
for the frozen latest sample and 365 distinct development questions as coverage;
interface tests are separate evidence.


## Connected tools and navigation refinement — 5 October, evening

User authorized restoring the original API environment. The finishing worktree now
uses the original local configuration and a shared private directory for the
existing spending ledger and Google quota. No cap, model policy, source data or
frozen benchmark changed. Credentials remain in ignored local files. The local
preview must run with outbound networking; the design-only sandbox had blocked
AlAdhan requests as well as disabling provider configuration.

- Verification remains `/`, with question and report together on desktop.
- Sidebar starts collapsed, preserves the user's choice, reopens from the header,
  and closes with Escape. Mobile navigation closes when following a link.
- Secondary navigation is now Settings & Tools. The location badge identifies
  Makkah as the default; coordinates are inside Edit location / Custom coordinates.
  No automatic-location claim is made for a preset.
- Shared location drives prayer times and Qibla. The dial animates actual bearing
  changes, retains true-north instructions, and explains the near-Kaaba case.
- Motion includes decorative floating cards, hover/focus icons, count feedback and
  active audio. A persistent pause control and reduced-motion CSS disable it.
- Localized example/evidence metadata, recitation/errors and all eleven pilgrimage
  learning topics now cover nine UI languages. Publisher text, proper names and
  technical audit fields remain original. Non-English examples load the selected
  admitted publisher translation; unavailable editions remain disclosed.
- Verification HTTP 429 now uses Retry-After; a bounded client timeout keeps the
  question editable after a stalled request. It does not automatically retry.

Validation: 473 offline tests passed across 43 files; production build and
TypeScript passed. Shared-accounting regression proves a configured worktree sees
existing reservations and cannot bypass the cap. Read-only local readiness reports
verification, speech, transcription and image configuration available. No paid
model, voice or image-generation request was made; the original spending ledger
retained 2,154 entries during these checks.

Nonpaid live UI checks: Riyadh prayer timetable and next-day countdown loaded;
Qibla displayed 243.8 degrees from true north; Gregorian/Hijri conversion and the
October month calendar loaded from AlAdhan. French published Quran translation
loaded with its original attribution. Mobile-width checks in all nine languages
found no horizontal overflow; Arabic and Urdu remained RTL. Navigation/Escape,
motion pause, Bengali pilgrimage prompts and count/undo were checked in-browser.
This is browser emulation, not physical-device or native-language certification.

Earlier limits still applicable: translated export parity and broader diagnostic
text localization need a separate pass; paid end-to-end model calls were not
retested. Public hosting, final video/deck and submission are separate release work.
