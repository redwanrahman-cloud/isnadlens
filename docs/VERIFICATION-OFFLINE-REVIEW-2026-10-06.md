# Verification review — 6 October 2026, Riyadh

The reported fasting question retrieved eight passages, including Quran 2:187.
Its visible stop reason was FINAL_EXPLANATION_UNCONFIRMED. The old UI hid the
specific reviewer diagnostic and incorrectly called this assessment "not
performed". The exact raw response from that browser session was not captured;
this review does not claim to have recovered its rejected draft or exact objection.
The question retrieves 2:187 in the new offline retrieval regression without an
answer hint. Whether the revised live pipeline answers it well remains untested.

## What the previous tests actually established

The five frozen release rounds scored 25, 26, 23, 29 and 29 satisfactory responses
out of 30. Round four failed its stricter gate because a badge contradicted the
otherwise correct explanation. Round five passed the declared release gate, with
26/27 satisfactory religious answers and three boundary controls. Y16 remained
an unnecessary withholding caused by audience/context selection. This is not a
guarantee for every new question, an independent scholarly review, or population
accuracy. All earlier scores and failures remain unchanged.

Recurring blockers in the saved reviews were:

- Correct source retrieved, but a meaning or prose review rejected the answer.
- A necessary condition, audience antecedent or referenced passage missing from
  the bounded proving packet.
- Search ranking missing a direct witness, despite nearby topical evidence.
- Correct explanation paired with an incorrect support/contradiction badge.
- Genuine evidence ambiguity, including promise/oath distinctions and compound
  assertions broader than the supplied source.

## Applied improvements

1. The existing single stronger reassessment now receives the prior draft,
   specific original reviewer diagnostic and checked relationships as untrusted
   data. The original question and authenticated evidence packet stay unchanged.
   This adds no retry loop and does not authorize more spending.
2. A valid narrower reassessment can reach the existing qualified-explanation
   review instead of being immediately disqualified. Only independently approved
   qualified prose is displayed. The broad claim remains unapproved, and the UI
   identifies the answer as qualified. Rejected/unavailable review still withholds
   the draft; a budget stop does not trigger another recovery attempt.
3. Failure paths explicitly clear a prior decisive verdict. A meaning rejection
   is no longer mislabeled as a prose rejection just because a prose field is absent.
4. The UI distinguishes answer-review rejection from an unavailable assessment.
   A disclosure beside the answer shows the recorded objection, preserving a
   specific original reviewer note even when relationship normalization produced
   a generic mismatch. No note is fabricated for older records. Labels cover all
   nine UI languages; original reviewer prose is clearly identified as such.
5. A local JSON diagnostic download preserves the full API record without a new
   API request. The downloaded historical replay was compared with its source and
   matched exactly. The browser automation download-event observer timed out, but
   the actual file was present and verified on disk.
6. The old offline lab's synthetic approvals were missing the current mandatory
   explanation-preserved flag. This caused deeper mechanical mutation checks to
   be skipped. The fixture now explicitly supplies that flag; it is synthetic
   approval for fault injection, not a claim of correct religious meaning. The lab
   also accepts a read-only external capture root so private history need not be
   copied into this branch.

## Offline validation

- Starting suite: 478/478 passed. Final suite: **490/490 passed**, with provider
  requests mocked and native fetch/HTTP/HTTPS blocked in the test process.
- Final production build and TypeScript passed.
- 150 early historical records: **2,924/2,924** replay, tamper, source-byte and
  rejection checks passed. The complete search pass exercised **432 probes** with
  fixed historical query hints. A final-source recheck repeated 2,924 checks and
  36 selected probes after the recovery changes.
- All **150 records across the five release rounds** passed a separate read-only
  audit of source text, nested record seals and agreement with published verdicts.
- The full retrieval audit found all frozen witnesses in 370/432 probes and at
  least one in 376/432. Its 62 incomplete-witness probes include known misses;
  these are query variants, not 432 distinct questions or an accuracy percentage.
- Compared with the older full round-two ranking audit, B42 lost its witness in
  three variants (17:36). Retrieval code is unchanged in this patch. This remains
  a recorded ranking gap, not a claimed repair or an inferred false answer.
- Offline replay verified the corrected failure status and specific Y16 reviewer
  note. The synthetic recovery tests check unchanged evidence, one reassessment,
  required re-review, invalid/rejected drafts, qualified fallback and budget stops.
- **Zero live provider calls.** The historical lab observed zero network attempts
  and unchanged ledger bytes. No credential, corpus, budget cap, stored original
  question or frozen benchmark score was changed.

The audit deliberately demonstrates that a model can still wrongly approve
genuine but unrelated text: byte integrity alone cannot establish meaning. The
offline suite checks program behavior, not the effectiveness of the new prompt
on a live model. The old fasting failure therefore remains a live-validation item.

## Proposed live check — awaiting user approval

The exact six questions and source-witness hashes are saved in
`artifacts/proposed-live-verification-checks-2026-10-06.json`: the reported fasting
question, pre-dawn eating, an explicit never/even-after-sunset contrast, trust and
planning, Y16's context case, and B42's retrieval gap.

Send only the original question, selected input language, automatic source choice
and main service. No references or expected answers enter the request. Preserve
each complete first-pass record and count helpful qualified answers, unnecessary
withholds, wrong decisive answers, source integrity, latency and cost separately.
Use the existing spending cap, at most six end-to-end questions and only existing
built-in recovery. No manual retries, cap increase or live calls before approval.
These known diagnostic cases cannot replace the frozen 29/30 benchmark.

## Reproduction

The historical lab accepts `--captures=<existing private capture directory>` and
`--report=<new output path>`; add `--full-retrieval` for 432 probes. Run
`scripts/audit-saved-release-records.mjs` with the same two arguments for the five
release rounds. Never overwrite the old reports. Tests use Vitest with two workers
and a 15-second timeout. The local network-blocking preload and complete test logs
are retained in the chat's work directory; the checked-in suite summary records
the final counts and scope.
