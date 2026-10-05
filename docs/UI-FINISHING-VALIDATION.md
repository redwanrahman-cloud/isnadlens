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
