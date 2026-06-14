/**
 * recommended-actions — single source of truth for "what should the practice do
 * about this finding" copy. See docs/recommended-actions-voice.md for the rules.
 *
 * Voice: lead with what Simera DID (generated the appeal package), never "go to the
 * payer portal." Honest to current capability (Phase 0/1a: we build the package;
 * the practice/biller submits). Keep in lockstep with the backend twin
 * simera/copy/recommended_actions.py.
 */

// One switch to remove every "Auto-submit coming soon" teaser. Treat as a dated
// promise — if Phase 1b (clearinghouse auto-submit) isn't underway in ~2 months, set false.
export const SHOW_AUTOSUBMIT_TEASER = true;

const TEASER = " (Auto-submit via clearinghouse coming soon.)";

export type FindingCategory =
  | "unworked_denial"
  | "wrong_writeoff"
  | "timely_filing"
  | "underpayment"
  | "undercoding"
  | string;

export interface ActionContext {
  payerName?: string;
  claimCount?: number;
  dollarAmount?: number;
}

function money(n?: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function teaser(): string {
  return SHOW_AUTOSUBMIT_TEASER ? TEASER : "";
}

/** Returns the recommended-action copy for a finding category. */
export function actionFor(category: FindingCategory, ctx: ActionContext = {}): string {
  const payer = ctx.payerName?.trim() || "this payer";
  const n = ctx.claimCount && ctx.claimCount > 0 ? ctx.claimCount : null;
  const amount = money(ctx.dollarAmount);

  switch (category) {
    case "unworked_denial": {
      const lead = n
        ? `Work these ${n} ${payer} denial${n === 1 ? "" : "s"} in the Appeals queue`
        : `Work these ${payer} denials in the Appeals queue`;
      return `${lead} — Simera builds the appeal letter + evidence list for each. Submit before the filing deadline.${teaser()}`;
    }
    case "wrong_writeoff":
      return `Reopen these write-offs — Simera flags which are recoverable and generates the appeal package. Review and submit.${teaser()}`;
    case "timely_filing":
      return "Deadline risk — these claims are near their timely-filing window. Simera's appeal package is ready; submit now before it closes.";
    case "underpayment":
      return `Simera flagged ${amount || "the amount"} paid below your contracted rate. Review the line-level variance and file a payment dispute.`;
    case "undercoding":
      return `Simera identified ${amount || "undercoded revenue"} in undercoded encounters — review the suggested codes and rebill the corrected claim.`;
    default:
      return "Review this finding in the Appeals queue.";
  }
}
