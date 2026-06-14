# Recommended-action copy — voice guide

The source of truth for the **frontend / demo** "what should the practice do about this
finding" copy: **`src/lib/recommended-actions.ts`**.

> **Backend note:** the original plan was a backend twin (`simera/copy/recommended_actions.py`).
> A full audit of the backend action strings (see below) found they were *already*
> recovery-oriented and richer than a generic template — so no twin was built. The
> "payer portal" vitamin framing existed only in the frontend demo data. If backend copy
> ever needs centralizing, mirror this module and these rules.

## Why this exists
Simera is pivoting from *detection* ("here's what you're losing") to *recovery*
("we get it back"). The old action copy told the practice to go work the denial
themselves in the insurer's portal — the "vitamin, not painkiller" framing the
recovery pivot exists to replace. This module makes that framing structurally
impossible to drift back into: there's exactly one place to change the copy.

## Voice rules
1. **Lead with what Simera did/built**, not what the practice should go do.
2. **Never** make "go to the payer portal / do it elsewhere" the action.
3. **Stay honest to current capability.** For denials, Simera *generates the appeal
   package* (real today — Phase 0/1a, in the Appeals queue). Do NOT claim auto-submission.
4. Use the **"Auto-submit coming soon"** teaser *sparingly* — only on denial-appeal
   actions where Phase 1b is the genuine next build. It is gated behind
   `SHOW_AUTOSUBMIT_TEASER` — flip that one constant to remove every teaser at once.
   Treat it as a **dated promise**: if Phase 1b isn't underway within ~2 months, pull it.
5. Point to the in-app place (**Appeals queue**) and lead with the dollar where natural.

## The strings (by finding category)
| Category | Action |
|---|---|
| `unworked_denial` | Work these {n} {payer} denials in the Appeals queue — Simera builds the appeal letter + evidence list for each. Submit before the filing deadline. *(teaser)* |
| `wrong_writeoff` | Reopen these write-offs — Simera flags which are recoverable and generates the appeal package. Review and submit. *(teaser)* |
| `timely_filing` | Deadline risk — these claims are near their timely-filing window. Simera's appeal package is ready; submit now before it closes. *(no teaser — urgency)* |
| `underpayment` | Simera flagged ${amount} paid below your contracted rate. Review the line-level variance and file a payment dispute. *(no teaser)* |
| `undercoding` | Simera identified ${amount} in undercoded encounters — review the suggested codes and rebill the corrected claim. *(no teaser)* |
| _unknown_ | Review this finding in the Appeals queue. *(safe fallback)* |

## Reviewed, intentionally left as-is
- **`denial_predictor._get_recommended_actions()`** (the AI denial-risk widget) — these are
  concrete *pre-submission prevention* fixes ("add modifier 59 to CPT X", "obtain prior
  auth", "submit within N days"). Already on-brand and dynamic per-claim; not the vitamin
  problem. Left unchanged.
- **`ar_dashboard.py`** / **`monitoring.py`** — AR-ops and internal model-monitoring
  guidance, not patient-facing recovery findings. Lower priority; not reshaped.
