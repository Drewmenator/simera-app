/**
 * recovery-triage — rank denial findings by expected recovery value and
 * separate the unwinnable ones, so a practice works the highest-value
 * appeals first and stops wasting effort on denials it can't overturn.
 *
 * Pure module (no React, no I/O) so it can be reasoned about and tested in
 * isolation. All inputs already exist on AuditFinding — no new data needed.
 */
import type { AuditFinding } from "@/lib/api";
import { findingIsAppealable, getAppealStrategy } from "@/lib/evidence-engine";

export type TriageTier = "work_first" | "worth_it" | "low_value" | "skip";

export interface RankedFinding {
  finding: AuditFinding;
  rank: number; // 1-based among appealable findings; 0 for "skip"
  tier: TriageTier;
  reason: string; // legible "$4,200 expected · 78% win · easy · your data"
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const CONFIDENCE_ORDER: Record<string, number> = {
  certain: 0,
  empirical: 1,
  network_estimate: 2,
  industry_estimate: 3,
};

export function confidenceLabel(c?: string): string {
  switch (c) {
    case "empirical": return "your data";
    case "network_estimate": return "network data";
    case "certain": return "certain";
    default: return "industry est.";
  }
}

export const TIER_META: Record<TriageTier, { label: string; color: string; bg: string; border: string }> = {
  work_first: { label: "Work first", color: "#0c8174", bg: "#e4f4f1", border: "rgba(12,129,116,0.3)" },
  worth_it:   { label: "Worth it",   color: "#9a6a1e", bg: "#f8efdd", border: "rgba(189,133,47,0.3)" },
  low_value:  { label: "Low value",  color: "#5c747e", bg: "#eef2f3", border: "rgba(92,116,126,0.25)" },
  skip:       { label: "Skip",       color: "#8a98a0", bg: "#f4f6f6", border: "rgba(92,116,126,0.2)" },
};

function buildReason(f: AuditFinding): string {
  const exp = Math.round(f.expected_recovery ?? 0);
  const win = Math.round((f.recovery_probability ?? 0) * 100);
  return [
    `$${exp.toLocaleString("en-US")} expected`,
    win > 0 ? `${win}% win` : null,
    f.difficulty || null,
    confidenceLabel(f.recovery_confidence),
  ].filter(Boolean).join(" · ");
}

/** A denial is "skippable" if it isn't appealable or its strategy says don't appeal. */
export function isSkippable(f: AuditFinding): boolean {
  const codes = f.denial_codes ?? [];
  if (!findingIsAppealable(codes)) return true;
  return getAppealStrategy(codes[0] ?? "").recoverable === false;
}

/**
 * Rank by expected_recovery (= dollar_amount × recovery_probability) descending.
 * Ties: easier difficulty first, then higher-confidence data first.
 * Skippable findings get tier "skip" and are returned after the ranked ones.
 */
export function rankDenials(findings: AuditFinding[]): RankedFinding[] {
  const appealable: AuditFinding[] = [];
  const skip: AuditFinding[] = [];
  for (const f of findings) (isSkippable(f) ? skip : appealable).push(f);

  appealable.sort((a, b) => {
    if ((b.expected_recovery ?? 0) !== (a.expected_recovery ?? 0)) {
      return (b.expected_recovery ?? 0) - (a.expected_recovery ?? 0);
    }
    const da = DIFFICULTY_ORDER[a.difficulty] ?? 1;
    const db = DIFFICULTY_ORDER[b.difficulty] ?? 1;
    if (da !== db) return da - db;
    const ca = CONFIDENCE_ORDER[a.recovery_confidence ?? "industry_estimate"] ?? 3;
    const cb = CONFIDENCE_ORDER[b.recovery_confidence ?? "industry_estimate"] ?? 3;
    return ca - cb;
  });

  const n = appealable.length;
  const ranked: RankedFinding[] = appealable.map((finding, i) => {
    const frac = n > 0 ? i / n : 0;
    const tier: TriageTier = frac < 1 / 3 ? "work_first" : frac < 2 / 3 ? "worth_it" : "low_value";
    return { finding, rank: i + 1, tier, reason: buildReason(finding) };
  });

  const skipped: RankedFinding[] = skip.map((finding) => ({
    finding,
    rank: 0,
    tier: "skip" as const,
    reason: "Not worth appealing — see prevention note",
  }));

  return [...ranked, ...skipped];
}
