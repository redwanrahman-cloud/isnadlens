# Mixed 30-question live benchmark — 6 October 2026

Result: 29/30 met the frozen expectations (96.7%). The numeric benchmark is unchanged from the previous 29/30 run. No incorrect decisive conclusion was found.

This round used 30 new inputs: 24 answerable religious questions and six boundary cases, across nine selected input languages. The previous round had 27 religious and three boundary cases; the changed mix prevents attributing a score difference solely to a repair.

WHAT PASSED
- Religious questions: 23/24 fully met the frozen expected response.
- Boundary cases: 6/6 handled correctly.
- Missing quotes/messages: 3/3 asked for the absent text/reference and retrieved zero unrelated passages. These are new Arabic, Bengali and English variants of the old Z29 failure category.
- Unspecified action: 1/1 asked for clarification without inventing an action.
- All six intentional spelling mistakes were understood. Five met the full expected answer; the sixth is the qualified wording case below, not a typo-interpretation failure.
- False premises: 8/8 rejected with evidence, preserving the original claim.
- Hajj companion: 2/2 correct, including the false gold-versus-taqwa premise.
- Input language identification: 30/30.
- Original inputs, source quotations, source contexts and nested audit seals: 30/30 valid. Reviewed decisive proof units matched admitted source text.

THE ONE UNMET EXPECTATION — N09
French input asks whether Solomon’s letter to the queen begins with Allah’s name, with a small spelling error. The correct verse, Quran 27:30, was retrieved and the input was understood. The app returned a reviewed qualified explanation: the verse contains the basmalah, but first identifies the letter as from Solomon, so it does not strictly establish its exact first words.

The frozen key expected a straightforward supported answer. We preserve this as the one unmet expectation rather than revising the key after seeing the output. The qualified answer is useful and grounded; exact-opening wording is interpretively sensitive. This is not evidence of fabricated scripture, a failed retrieval, or a conclusively established factual model error. No product change was made to force an answer.

PRESENTATION AND PERFORMANCE FINDINGS
Four answers contain the decisive source below other retrieved cards:
- N13: cave-duration verse 18:25 at card 3.
- N16: tooth-stick dream report en:3131 at card 5, after unrelated Quran cards.
- N18: taking another person’s seat, en:5350 at card 6.
- N30: inclusion of the captive, Quran 76:8 at card 2.
These remain correct substantive answers, but showing the decisive proof first would strengthen the interface and competition demo.

Two other records select a later formal proof while the first card is already adequate: N12 has another direct gold/silver-vessel report, and N20 starts with the English edition of the reviewed Arabic dream report. These are not counted as the four presentation issues above.

Median religious-query response time: 19.16 seconds; 95th percentile: 32.40 seconds; slowest: 63.74 seconds (N02, Hindi). No timing cause is claimed without separate profiling.

The bounded feedback repair succeeded on N22: its first draft said one washing used dust; review required the source’s specific FIRST washing, and the revised answer preserved it. N09 exercised the reviewed qualified-answer branch.

COST AND AUDIT
Batch cost: 3.325640 SAR (about 3.33 SAR), across 103 recorded provider reservations.
Total development spend: 56.192426 SAR of the approved 60 SAR cap.
Remaining: 3.807574 SAR (about 3.81 SAR).
Separate judging reserve: 15 SAR, untouched.
Captured request costs match the shared-ledger increase. No cap reset or hidden spend.

Every first result was retained. No manual retries, question replacements after launch, excluded results or midrun product/configuration edits. The app’s normal bounded retries are included. The pre-run key, build, application source, source corpora and environment configuration were frozen and checked through the run.

LIMITS
This tests text verification through the main and Hajj API paths. It does not certify voice recording, OCR, camera, live display translation, or every browser interaction. The native input languages and the returned English/Arabic meanings were reviewed by the development assistant, not an independent scholar or native-speaker panel. The exact old Z29, original fasting and old Y16 questions were not repeated because this run was requested to use new questions. The detailed per-case record below preserves the remaining uncertainty.

