# Useful feature additions before evening UI/UX — 5 October 2026 Riyadh

Redwan authorized further useful additions in the afternoon and deferred visual UI/UX work until after 18:00 Riyadh. The existing visual system is retained. No new model, paid subscription, source corpus or paid AI run was added.

## Shipped behavior

- Next calculated prayer time and countdown use the prayer location's timezone, not the browser timezone. Tomorrow's separately requested timetable supplies the following Fajr after Isha. Sunrise is excluded from obligatory-prayer selection. Missing, stale, ambiguous or nonexistent local times do not produce invented precision; partial high-latitude schedules are labelled. Cached local-time conversions avoid recalculating timezone offsets every second.
- Twelve named city presets simplify coordinate entry and select an initial regional calculation method, which users can change to their mosque's method. Up to eight manually saved locations can be resumed/deleted on the same device. Saving is optional; no account or location-sync service is introduced.
- Qibla is a local great-circle bearing clockwise from true north, displayed to one decimal degree. It is not a live orientation sensor or magnetic compass. At selected coordinates very close to the Kaaba, no unreliable arrow is shown; the antipodal bearing is also undefined.
- Umrah topic navigation and separate Hajj learning topics put a question in the verification field without automatically submitting. Hajj forms are distinguished rather than imposing one universal sequence. Navigation references admitted HadeethEnc and original official Nusuk pages; no guide text or images were copied into the corpus. Each Tawaf counter remains a single manually reset session; selecting a topic does not certify ritual validity or completion.
- Downloadable UTF-8 evidence receipts preserve the original question, EN/AR explanations, exact primary/context quotations, source links, attributions, edition, publisher-supplied Hadith grades and licence notices. The full original record seal is explicitly distinguished from the abridged receipt. No external sharing is performed.
- `/evaluation/latest` exposes the frozen 29/30 benchmark, all 30 questions, source references, explanations and the retained Indonesian context-selection failure. Older evaluations remain linked and unchanged in score. Later product additions are explicitly separated from the earlier frozen benchmark; no overall population-accuracy or scholarly certification claim is made.

## Validation and evidence

434/434 tests passed with two workers. New cases cover timezone/date rollovers, sunrise exclusion, actual next-day Fajr, stale/missing schedules, UK daylight-saving gaps/repeated times, half-hour transitions in Lord Howe, Qibla edge cases, saved-location validation and exact receipt text/attribution. The final clock revision passed its seven focused tests. Type checking and production build passed.

Headless Chrome at desktop 1440px and mobile 390px passed topic selection, count/resume/undo, receipt download, off-topic transfer without automatic submission, location-timezone countdown, saved-location resume, Qibla, free prayer/date/calendar lookups and display of every benchmark case. No page errors or horizontal overflow found. These checks are emulated viewports, not physical-phone sensor or voice certification. The referral response was replayed from the preserved real record for navigation testing without another paid call.

Local Qibla calculations matched public AlAdhan API results within 0.001 degree for London, Jakarta and Sydney, finer than the one-decimal display. London: reference 118.9872425°, local 118.9872195°; small differences reflect rounded target coordinates. Exact poles and compass sensors are not certified for physical navigation.

Public evidence: `artifacts/feature-window-browser-2026-10-05.json`, `artifacts/qibla-reference-checks-2026-10-05.json`. Screenshots/download captures stay under ignored `artifacts/private/feature-window-2026-10-05/`.

Sources checked: https://aladhan.com/qibla-api, https://umrah.nusuk.sa/Journey, https://hajj.nusuk.sa/Journey and https://hajj.nusuk.sa/nusuk/hajj-rituals. Topic labels and independently written questions provide navigation; source-specific conditions are left to the original references and the reviewed verification flow.

Development commitment remains 47.0542235625/49 SAR; 1.9457764375 SAR remains and the separate 15 SAR judging reserve stays protected. Afternoon work added no paid AI calls. Evening work: Redwan's chosen modern Islamic UI/UX direction, streamlined mobile journey, broader new-tool localization, accessibility and final release preparation. Do not begin the visual redesign before the requested evening slot or invent the unanswered visual preference.
