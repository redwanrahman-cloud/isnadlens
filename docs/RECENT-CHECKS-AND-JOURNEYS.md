# Recent checks and starter journeys — 5 October 2026

Redwan authorized saved recent checks, starter questions and a combined input journey review before the evening UI/UX phase, plus traceable engineering evidence for reviewers.

## Implementation

Saved checks are explicit, not automatic. Each tool retains up to eight entries in this browser: unchanged original question, recorded language, source selection, original date/record ID and an abridged evidence receipt. Users can view/download the historical receipt without another provider call, load the question into the editor, delete one item or clear the tool's saved entries. Loading never automatically runs verification. No account sync, public sharing or new provider request is involved. Local receipt copies are labelled historical; they are not rendered as newly authenticated verdicts.

Storage parsing is versioned and bounded to 600,000 UTF-8 bytes per tool. Oversized, duplicate, malformed and unknown-language entries are rejected. Saving evicts oldest entries under count/byte caps. Storage denial and quota errors leave typing and verification available; clearing offers recovery from corrupted saved data. Users on shared devices can clear their entries. Receipts are displayed as text, never executed as HTML.

New starter questions cover everyday source questions, Hadith themes and pilgrimage topics in all nine display languages. Choosing one fills and focuses the input, clears the previous result and does not submit. They are project-written examples, not precomputed answers or a claimed ranking of popular searches.

## Testing and issues

Five new pure tests check exact-script preservation, de-duplication, caps/UTF-8 eviction, corrupted storage and starter coverage. The complete suite passed 448 tests across 38 files; TypeScript and production build passed.

At 1,440 and 390 px, browser checks passed all nine starter-language selections, explicit save with no prior automatic persistence, saved receipt download, reload, question loading without a call, deletion/clearing, and reviewed text/voice/image handoffs without automatic verification. Simulated recording requires a separate Transcribe click. A blocked-storage browser retained typing. Editing or selecting a new question also clears the old result; the text editor is disabled during an active verification. No page errors or horizontal overflow were found. Provider responses and microphone data are mocked; a preserved real verification record is replayed. These are application interaction checks, not new religious accuracy or physical-device tests. No paid calls were made.

Inspection also found stale README wording and an older budget/milestone statement. The front page now identifies the latest local state and points to the reviewer guide, while historical reports retain their original results. No test outcomes have been rewritten to show a better score. The image shortcut added earlier is retained.

Evidence: [browser report](../artifacts/input-journeys-2026-10-05.json), `tests/recent-checks.test.ts`, `scripts/check-input-journeys.mjs`. Review trail: [reviewer guide](REVIEWER-GUIDE.md), [build ledger](BUILD-LEDGER.md), [machine-readable index](../artifacts/reviewer-evidence-index.json). Visual redesign remains the evening phase.
