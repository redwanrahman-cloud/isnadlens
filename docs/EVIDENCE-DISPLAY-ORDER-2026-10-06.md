# Reviewed evidence first

The workbench previously emphasized the first retrieved card, even when the final source review selected a later passage as the proof. It now displays accepted primary proof cards first, additional required basis cards next, and all remaining cards in their original relative order. The evidence map and citation shortcuts use this same order, including their focus targets and expandable secondary cards.

Ordering uses the final passed source review for supported/conflicting answers, or the final passed qualified explanation review for qualified answers. It matches the recorded proof quotation against an integrity-passed primary or context quotation. Missing, rejected, unavailable or malformed reviews retain retrieval order. Draft relationship labels do not establish display priority.

The helper returns a new array without changing the evidence objects or sealed record. Receipts, sharing, saved checks, model prompts, retrieval, decisions and verification thresholds are unchanged. This is a display improvement with no new model request; it does not itself reduce the cost of producing an answer.

Validation:
- 13 focused tests passed: source order, supporting context, multiple proof units, immutable records, rejected/unavailable reviews, qualified and legacy answers, and invalid proof references.
- All 30 saved round-seven records replayed offline without mutation or dropped sources. The four identified cases now lead with 18:25 (N13), en:3131 (N16), en:5350 (N18) and 76:8 (N30).
- Production build and TypeScript check passed.
- Browser check through an isolated proxy intercepting every API path: N13's first card and evidence-map shortcut show 18:25; its primary shortcut focuses source-0; the secondary 18:11 shortcut opens additional evidence and focuses source-1. N16 displays en:3131 before the unrelated Quran cards. Screenshot saved as a user deliverable.
- No new provider calls or spend. These offline checks do not replace the frozen 29/30 live benchmark.

The updated production preview is served at 127.0.0.1:3302. The temporary offline proxy was stopped after inspection.
