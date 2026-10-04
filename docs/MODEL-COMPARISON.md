# Development model comparison — 4 October 2026

Four reused development claims were assessed by both configured models with identical admitted evidence and prompt `claim-assessment-v1.3-meaning-and-absence`. These labels are provisional and were not independently reviewed; this is not a religious accuracy benchmark or the untouched final evaluation.

The mini model returned supported, refused, insufficient and conflicting respectively. The refusal on the Arabic Ramadan-negation case resulted from a shortened contradiction quotation containing an ellipsis; exact contiguous source-span validation correctly rejected it. The stronger model returned supported, conflicting, insufficient and conflicting, including a valid exact source span for that Arabic case. All returned records passed seals and source quotation integrity checks.

Measured total cost for four mini requests: USD 0.03524325, mean local end-to-end latency 3,235 ms. Four strong requests: USD 0.1205525, mean latency 9,044 ms. Reported snapshots were `gpt-5.4-mini-2026-03-17` and `gpt-5.4-2026-03-05`. Hosted latency, broader accuracy and independent religious validity are not established by this small comparison.

The evidence supports trying a narrow development routing rule: use mini normally; allow one stronger reassessment only for a mechanically invalid semantic source reference or contradiction span. Preserve the failed attempt and its usage in the sealed audit record. Do not escalate ordinary insufficient evidence, personal/out-of-scope questions, source-integrity failures or provider outages. Both attempts must pass the same source constraints and spending controls; no valid second result means the claim remains unevaluated.

Freeze and evaluate this rule independently before final release. Initial paired results remain preserved even if the prompt is later strengthened.
