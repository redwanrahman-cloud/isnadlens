# Interpretation-first verification and model upgrade — 4 October 2026

## Product purpose

IsnadLens checks a person's claim, misconception, paraphrase or general Islamic source question against admitted Quran/Hadith evidence. It does not judge the truth or authority of the Quran. The exact Arabic sources remain immutable. An input citation identifies a passage; a correct reference or copied quotation does not establish that the user's attached interpretation follows from it. Citation matching remains an engineering check for transcription/attribution errors, separate from the main meaning assessment.

## Research and evidence ordering

This is an application policy informed by institutional references, not independent scholarly certification or a complete implementation of usul al-fiqh.

- Quran is foundational. Complete, direct Quran evidence can establish a clear textual proposition without demanding unrelated Hadith corroboration.
- Sunnah also explains, specifies and qualifies meaning. The app must not treat it only as optional corroboration or automatically discard relevant qualifications by source-family ranking.
- Preserve general/specific scope, unrestricted/qualified wording, commands/descriptions, speaker attribution, negation, and every material exception. Source conditions belong in the answer; they must not become invented user assertions.
- Do not infer abrogation, consensus, analogy, a madhhab position or reconciliation of disputed evidence from model memory. Ijma and qiyas are jurisprudential sources/methods discussed in the institutional references; this app has no admitted corpus or scholar approval supporting independent use of them.
- Actual competing interpretations, unresolved qualifications or case-specific religious rulings require qualified review. A general educational source question is still eligible for evidence retrieval. Missing retrieval is not proof that evidence does not exist.
- Hadith grades remain attributed to HadeethEnc's publisher. Semantic support does not independently authenticate a narration.

References read online on 4 October 2026, used for methodology research only; their full text was not imported as answer evidence:

1. [Dar al-Ifta: deriving rulings from translations of the Quran](https://www.dar-alifta.org/en/fatwa/details/22595/deriving-legal-rulings-from-the-translations-of-the-quran). Discusses Quran, Sunnah, ijma and qiyas; qualified interpretation; translations of meanings.
2. [Dar al-Ifta: theory of Quranic interpretation](https://www.dar-alifta.org/en/article/details/108/an-introduction-to-the-theory-of-qur%E2%80%99anic-interpretation). Discusses revelation context, general/specific and unrestricted/limited meanings, and the Prophet's explanatory role.

## Application changes

Public source questions about illness, pregnancy or debt no longer receive automatic private-case refusals solely because those topics appear. English learning phrases such as "my understanding", "can I check" and "I am trying to understand" are allowed when attached to a public source question and without personal-case circumstances. Multilingual intake instructions apply the same distinction; native screening still protects identifiable private facts, personal rulings, harmful methods and unrelated requests.

A first-tier semantic scope refusal on a screened public source question receives exactly one stronger reassessment. A response claiming complete positive support while returning incomplete support flags also gets one stronger reassessment; the app never flips those flags itself. Both attempts remain sealed. Ordinary missing evidence does not automatically cause repeated paid calls. No stronger retry for provider failures or source corruption.

Quran context is now bounded to two preceding and two following verses within the same surah. At most eight source cards and forty immutable source units reach the positive checker; the 48,000-character packet bound remains enforced. This covers a governing phrase two verses before a retrieved example without altering any original source text.

## Model configuration

- Default verification, routing, search planning, explanation translation and source-focused positive checking: `gpt-5.6-luna`.
- One bounded stronger reassessment for invalid citations, proposed contradiction, erroneous public-question scope refusal or incomplete positive support flags: `gpt-5.6-terra`.
- Both use explicit `reasoning.effort: low`; `minimal` is not a supported 5.6 effort.
- Standard mode, not the separately billed Pro mode. Legacy 5.4 models remain allowlisted for historical ledgers and controlled comparisons.
- Output ceilings include reasoning tokens: routing 3,200; planning 2,400; Luna assessment 8,000; Terra assessment 4,000; source checker 5,000; translation 5,000. Incomplete responses fail closed.
- Current short-context standard rates per million tokens: Luna $0.20 input/$1.20 output; Terra $2 input/$12 output. Ledger estimates conservatively add the potential 25% cache-write input uplift to all 5.6 input tokens. Cached discounts never enlarge the spending authorization. The existing USD 3.46 cap and unknown reservations remain intact.

Official documentation: [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra), [pricing](https://developers.openai.com/api/docs/pricing).

## Validation boundaries

`tests/model-upgrade.test.ts` exercises configuration, actual serialized low-reasoning requests, both ledger model IDs, public-question admission, private/harmful referrals, bounded context and exactly one scope reassessment. Older adapter fixtures explicitly retain 5.4 configuration for historical behavior comparisons.

`scripts/validate-model-upgrade.mjs --live` is a separate paid command. Both models passed a source-supported Quran 112:1 question with a separate positive source check. H12 from the frozen holdout also passed its targeted end-to-end retest after the context/model changes. The model and context changes occurred together, so this does not isolate which change contributed how much. The public summary is `artifacts/model-upgrade-validation-2026-10-04.json`; raw provider records remain private.

The original holdout first-pass score remains 44/50. These probes are not a new untouched benchmark or proof that all 100 questions pass on 5.6. The offline lab still reports engineering/retrieval checks rather than simulated model accuracy. Independent linguistic and scholarly review remain open.

The first actual production-route pork question passed scope/retrieval but failed final qualification flags, despite a correct affirmative explanation. Its immutable failed artifact is `artifacts/model-upgrade-route-validation-2026-10-04.json`. Prompt 2.5 clarifies that an ordinary general rule does not assert "no exceptions"; actual universal assertions remain checked against source exceptions. The separate final production-route retest passed, including positive source review, in `artifacts/model-upgrade-route-validation-qualification-fix-2026-10-04.json`. No failure was overwritten or reclassified as a success.

Primary-source review of the targeted results: 112:1 states Allah's oneness; the H12 inference uses 90:11–13 together (the checker selected 90:11 as a context anchor, which alone does not mention emancipation); the pork answer uses genuine consumption-prohibition passages and preserves the necessity qualification. This is the developer's source comparison, not independent scholarly approval. All source bytes remain publisher text.
