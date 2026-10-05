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

## Non-verification QA — 5 October, late evening

The user requested broad testing while explicitly deferring verification and real
API testing. This pass used a local proxy: verification and result translation
were blocked, daily tools returned controlled fixtures, and media readiness was
set unavailable. Coverage, admitted passage translations and PDF generation used
local application code. The request log contained zero `/api/verify` and zero
`/api/translate-result` requests. No provider inference, transcription, image
reading, recitation playback or external daily-tools request was made.

### Findings fixed

- Calendar month navigation no longer changes the prayer date or clears the
  displayed prayer timetable. An empty month cannot be submitted.
- Daily-tool and example-PDF errors follow a language change while still visible.
- Counter reset uses an in-page dialog with a safe initial focus, cancel/Escape,
  and focus restoration. The embedded browser stalled at its former native prompt;
  the new confirmation was exercised successfully.
- Secondary interface text has stronger contrast; audio controls have 44px targets.
- PNG share cards retain source URLs and the record timestamp. Long URLs wrap
  within the card, including Unicode text. PDF requests have a 30-second timeout.

### Validation performed

- 92 supporting-feature tests passed in 17 files, covering daily-tool parsing and
  routes, prayer clocks, location/Qibla, counters, saved records, display copy,
  receipt generation/routes, media boundaries, and share-card wrapping. Provider
  calls in route tests were mocked. No verification test suite was run.
- The final production build and TypeScript check passed. The affected counter
  and share-text suites were repeated after the dialog change: 9 tests passed.
- 81 browser cases: three workspaces times nine languages times three requested
  viewport settings. Actual measured widths ranged from 358 to 1441 CSS pixels
  because the embedded browser applies zoom/minimum sizing. Each case had the
  expected document language/direction, a heading, labelled visible controls, and
  no document-wide horizontal overflow. This is not a physical-device test.
- All eleven Umrah/Hajj topic buttons populated the question and focused the
  editor without submitting it. Counter cap, undo, uncertainty freeze, reload
  persistence, cancel, confirmed reset and Escape were exercised.
- Navigation collapse/reopen and saved-question loading were exercised. An existing
  saved receipt remained readable. Only the temporary QA location record was
  deleted; existing saved checks were preserved. Location/profile restoration was
  exercised with London, calculation method and Asr settings.
- Fixture prayer timetable/countdown, Qibla bearing, both conversion directions,
  month display and service-failure recovery were exercised. These validate UI
  wiring, not the accuracy/availability of live prayer or calendar providers.
- Example PDF returned 200/application-pdf (112,694 bytes); all three rendered A4
  pages were visually inspected, including Arabic shaping, page breaks and source
  notices. The browser download-event waiter stalled, so PDF response bytes and
  rendering were used as evidence; OS download completion was not certified.
- Share preview, source links in the PNG, copy feedback, viewport fit and Escape
  focus return were checked. The preview PNG was visually inspected.
- Method, sources, evaluation, latest evaluation, holdout and 404 pages rendered
  without narrow-screen overflow. These existing information/audit documents keep
  their authored Arabic/English content; they are not nine translated editions.
- Final browser console inspection showed no captured warnings/errors. The
  original main worktree remained clean; source corpus, verification engine and
  frozen assessment artifacts were not modified.

### Explicit limits

Real verification/translation, external providers, microphone capture, image OCR,
audio playback, browser location permission and physical phones remain for the
separately authorized final pass. This audit is not a native-speaker review, a
formal accessibility certification, a full adversarial/security/load test or an
updated semantic benchmark. The historical benchmark numbers are unchanged.
Translated receipt-content parity and broader diagnostic localization from the
earlier review remain separate follow-ups; this pass fixes UI errors, not every
historical receipt's language. No deployment, push or competition submission was
performed.

## First-use visual usability refinement — 5 October

The user reported that the interface looked faded and worn despite the emerald
palette. This pass was an agent usability walkthrough, not research with human
participants. Findings: weak separation between surfaces, small primary reading
text, insufficiently distinct control states, and an example placeholder that
could be mistaken for an already entered question.

The workspace now has a deep emerald navigation header, neutral off-white canvas,
white working cards, stronger selected/action states, and restrained ivory/gold
source cards. Primary report text and secondary controls are larger. Disabled
actions use an explicit neutral treatment rather than transparent green. The
question label is visible and the placeholder is a short typing instruction in
each of the nine languages. The dual workspace and visible sources are retained.

Production build/TypeScript passed. The example-to-editor flow was checked:
it focuses the input and enables the emerald action without submitting it.
Twenty-seven narrow-layout checks (three workspaces times nine languages) found
no horizontal overflow, correct direction, and visible question labels where
applicable. Desktop rendering was visually inspected. Embedded-browser Arabic
screenshot capture had clipping/compositing issues, so this pass claims DOM bounds
checks for RTL, not a new visual certification on a physical Arabic device.
No verification submissions or real provider requests were made. Next validation
should include observing a person complete their first question and find its
source without coaching; that has not occurred in this pass.

## Voice dictation on the question surface — 5 October

Voice no longer hides the editor or introduces a separate recorder above the
form. A compact recording bar sits inside the question box, with cancel, stop,
elapsed time and actual microphone level samples. The editor remains visible and
temporarily read-only. Recording/transcription never submits verification.

The lifecycle now distinguishes microphone opening, recording, transcription and
failure. Stop immediately becomes a disabled progress control; repeated Voice
clicks cannot start another recording. Cancel releases tracks, aborts the pending
request and invalidates late responses. Escape closes the bar and restores editor
focus, including error states. The existing 45-second/size limits remain and the
client transcription request is bounded to 60 seconds.

Dictation inserts at the captured cursor/selection and preserves the surrounding
draft. Overlong combined questions are rejected without truncation. The user's
manual input-language choice is retained. Successful dictation returns keyboard
focus to the editor; it does not verify the text automatically. Provider/privacy
details remain available from the bar's disclosure.

Validation: eight focused tests passed (five provider-boundary tests with mocked
network, three new draft-insertion regressions). Final production build and
TypeScript passed. A separate local fixture bundled the real Workbench/VoiceInput
components with simulated MediaRecorder, permission and fetch responses. Browser
checks confirmed one start/stop/transcription, no extra start when clicking Voice
again, unchanged composer height, preserved draft on cancel, ignored late replies,
editable inserted text/focus, permission denial, transcription failure and Escape.
Nine mobile language cases kept the bar inside the editor without horizontal
overflow; Stop retained a nominal 44px target. The fixture's unexpected-request
counter stayed zero. Simulated fixture code is outside the production project.

No actual microphone capture, provider transcription or verification was performed.
The recording screenshot is explicitly labelled simulated. Live microphone/browser
compatibility and provider accuracy remain for the user's deferred real-API pass.

## Unified composer and phone camera — 5 October

Replaced the Text/Voice/Image tabs with a rounded, growing question box. Image
attachment, microphone and send controls sit along its bottom edge; dictation
reuses that same footer. Source and input-language settings remain in a compact
disclosure below the box. Icon controls retain translated accessible names.

Desktop attachment opens the image picker directly. On narrow or touch screens,
the plus button offers Choose an image and Take a photo. The latter uses the
browser's image capture input with a rear-camera preference. Both routes reuse
the existing image preview, size/type validation and explicit Read image step;
selecting an image does not automatically call OCR or verification.

Validation: 17 focused dictation, voice, image and mocked image-route tests passed;
production build and TypeScript passed. In the isolated browser fixture, the native
image picker displayed a local test PNG while preserving the typed draft and
making no POST request. Simulated dictation inserted text into that same draft
with one start/stop/transcription and no unexpected requests. At 390 CSS pixels,
all nine display languages translated both attachment choices, with no horizontal
overflow and the menu inside the viewport. Escape closed the menu and restored
focus to the plus button. The camera input's environment capture preference was
checked, but physical phone capture has not been tested.

No real camera/microphone capture, OCR, transcription provider or verification
test was performed. Native camera behavior depends on the phone/browser and
remains part of the deferred live-device check. This change does not modify the
verification engine, corpus, provider settings or competition benchmark results.
