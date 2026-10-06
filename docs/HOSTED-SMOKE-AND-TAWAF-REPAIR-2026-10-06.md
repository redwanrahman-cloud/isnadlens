# Hosted smoke check and tawaf retrieval repair — 6 October 2026

The user approved enabling hosted verification and a light real-provider check within the remaining 60 SAR development cap. The separate 15 SAR judging reserve remains untouched. Local paid testing was disabled and no local Next.js app process was running when the host was enabled. The existing ledger was preserved; no fresh allowance was created.

Webinar priority: Arabic and English. Other language capabilities remain available unchanged, but are outside today's presentation focus.

## Original live smoke result

Four questions ran through the public HTTPS URL. All returned HTTP 200, preserved the original question and passed exact quotation/nested record-seal checks. Three produced supported answers; the fourth safely abstained:

| Case | Input / route | Outcome | Seconds |
|---|---|---|---:|
| HOST-EN | English / main: kindness to parents | Supported; includes 17:23–24 | 16.444 |
| HOST-AR | Arabic / main: helping poor people | Supported; includes 9:60 and 2:271–273 | 14.861 |
| HOST-BN | Bengali / main: seeking help through patience and prayer | Supported; includes 2:45 and 2:153 | 12.915 |
| HOST-HAJJ | English / pilgrimage: number of tawaf circuits | Insufficient evidence; relevant primary narration missed | 23.211 |

This was a deployment smoke check, not a fresh accuracy benchmark. Preserve the three-supported/one-abstained first pass separately from the targeted retest. Round 7's frozen 29/30 benchmark remains unchanged.

Synthetic read-aloud returned a valid WAV in 4.83 seconds. Reusing that fixture for transcription returned its exact sentence in 3.42 seconds. No real microphone or camera test is claimed. OCR live testing was not completed before the user paused further work. Prayer provider lookup, next-day schedule and browser countdown passed; date conversion was requested but its final UI result was not inspected. Physical geolocation remains untested.

The Qibla panel was a fixed bearing diagram, not a live phone compass. Its default Makkah coordinates were effectively at the Kaaba, yielding a near-Kaaba message rather than a useful direction. At the user's request it was removed from the tools UI and its home-page descriptions in all nine display languages. Bearing calculation code and historical tests are retained; no sensor capability is advertised by the released tools page.

## Tawaf root cause and focused fix

The admitted HadeethEnc English record 3309 contains a primary narration describing the first three tawaf rounds and the last four. It was missing from the two English Hadith cards selected for combined Quran/Hadith assessment. Instead the model received related but non-proving material about farewell tawaf, menstruation and the Kaaba. The semantic gate correctly declined to establish the count from that packet.

English search vocabulary did not equate `circuits`/`laps` with publisher `rounds`, or join publisher `Ka‘bah` with query `Kaaba`. A bounded vocabulary normalizer now applies consistently to the derived Hadith query/index/sentence-ranking tokens. Circumambulation variants map to tawaf. It changes no stored source bytes, quotations, source admission pins, number, source ID, model prompt, evidence limit or semantic threshold.

The admitted narration is now retrieved within the existing two-card English allowance for four natural phrasings. A separate farewell-tawaf/menstruation control still retrieves its appropriate source. Before the fix, three of the four count phrasings failed; afterward all five focused tests passed. Full offline regression: **542 tests passed across 51 files**, plus TypeScript.

## Targeted hosted retest

The exact failed question was rerun once after deployment. It returned HTTP 200 and `supported_within_selected_corpus` in **17.762 seconds**, answering seven circuits. The chosen support is admitted primary HadeethEnc `en:3309`; the narration describes three rounds followed by four. The separate Terra source review passed against that unchanged primary source unit. Original-question preservation, quotation hashes and nested record seals passed.

Retest cost: **0.1014020625 SAR**. Development commitment: **56.7618646875 / 60 SAR**; remaining **3.2381353125 SAR**. Total hosted smoke plus retest: **0.56943825 SAR** across 16 settled reservations. No new uncertain reservations; judging reserve untouched.

Deployed image: `isnadlens:20261006-tawaf-fix`, ID `sha256:9dfcef6ab1810dd51dcbd795f982cb183e9e708e65c6e2da38ad6c1d4ba62db6`.

This targeted success repairs the observed miss; it does not retroactively change the first pass or establish a new 4/4 independent benchmark. No more live tests or unrelated work were started after this repair. The user asked to pause before the next task.

See [machine-readable smoke and repair record](../artifacts/hosted-smoke-and-tawaf-repair-2026-10-06.json).
