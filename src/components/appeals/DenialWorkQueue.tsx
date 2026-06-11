"use client";

import { useState } from "react";
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  FileText, Clipboard, ExternalLink, AlertTriangle, Info
} from "lucide-react";
import type { AuditFinding } from "@/lib/api";
import { getAppealStrategy, findingIsAppealable, generateAppealLetter } from "@/lib/evidence-engine";
import { AppealLetterModal } from "@/components/appeal/appeal-letter-modal";

interface DenialWorkQueueProps {
  findings: AuditFinding[];
  practiceName: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  unworked_denial:   "bg-red-500/15 text-red-600 border-red-200",
  wrong_writeoff:    "bg-orange-500/15 text-orange-600 border-orange-200",
  timely_filing:     "bg-yellow-500/15 text-yellow-700 border-yellow-200",
  underpayment:      "bg-blue-500/15 text-blue-600 border-blue-200",
  undercoding:       "bg-purple-500/15 text-purple-600 border-purple-200",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "text-emerald-600",
  medium: "text-amber-600",
  hard:   "text-red-600",
};

function EvidenceChecklist({ carcCode }: { carcCode: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const strategy = getAppealStrategy(carcCode);

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const allRequired = strategy.evidence.filter(e => e.required);
  const optional = strategy.evidence.filter(e => !e.required);
  const doneCount = strategy.evidence.filter(e => checked[e.id]).length;
  const total = strategy.evidence.length;

  if (!strategy.recoverable) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-2">
        <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Do not appeal this denial
        </div>
        <p className="text-xs text-yellow-700 leading-relaxed">{strategy.urgencyNote ?? strategy.coreArgument}</p>
        <p className="text-xs text-yellow-600 mt-1"><strong>Prevention:</strong> {strategy.avoidanceNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {strategy.urgencyNote && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{strategy.urgencyNote}</p>
        </div>
      )}

      <div className="rounded-lg bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Appeal Argument</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic">"{strategy.coreArgument}"</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Evidence Checklist</h4>
          <span className="text-xs text-muted-foreground">{doneCount}/{total} collected</span>
        </div>

        {total > 0 && (
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
        )}

        {allRequired.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Required</p>
            {allRequired.map(item => (
              <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                <button
                  onClick={() => toggle(item.id)}
                  className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${
                    checked[item.id]
                      ? "bg-primary border-primary"
                      : "border-border group-hover:border-primary/50"
                  }`}
                >
                  {checked[item.id] && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                </button>
                <div>
                  <p className={`text-xs font-medium transition-colors ${checked[item.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {optional.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Strongly Recommended</p>
            {optional.map(item => (
              <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group opacity-80">
                <button
                  onClick={() => toggle(item.id)}
                  className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${
                    checked[item.id]
                      ? "bg-primary border-primary"
                      : "border-dashed border-border group-hover:border-primary/50"
                  }`}
                >
                  {checked[item.id] && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                </button>
                <div>
                  <p className={`text-xs font-medium transition-colors ${checked[item.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prevention</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{strategy.avoidanceNote}</p>
      </div>
    </div>
  );
}


export function DenialWorkQueue({ findings, practiceName }: DenialWorkQueueProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealFinding, setAppealFinding] = useState<AuditFinding | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Only show denial-type findings (not undercoding/underpayment — those have different workflows)
  const denialFindings = findings.filter(f =>
    ["unworked_denial", "wrong_writeoff", "timely_filing"].includes(f.category)
  );

  const openAppeal = (f: AuditFinding) => {
    setAppealFinding(f);
    setAppealOpen(true);
  };

  const copyQuickLetter = (f: AuditFinding) => {
    const carcCode = f.denial_codes?.[0] ?? "unknown";
    const letter = generateAppealLetter({
      practiceName,
      payerName: f.payer_name || "Payer",
      carcCode,
      claimIds: f.claim_ids ?? [],
      cptCodes: f.cpt_codes ?? [],
      dollarAmount: f.dollar_amount,
    });
    navigator.clipboard.writeText(letter).then(() => {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    });
  };

  if (denialFindings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
        <p className="text-sm font-medium text-foreground">No open denial work items</p>
        <p className="text-xs text-muted-foreground">Upload more 835 files to populate the work queue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {denialFindings.map((finding, idx) => {
        const isExpanded = expanded === idx;
        const primaryCarcCode = finding.denial_codes?.[0] ?? "";
        const strategy = getAppealStrategy(primaryCarcCode);
        const appealable = findingIsAppealable(finding.denial_codes ?? []);
        const claimCount = finding.claim_count ?? finding.claim_ids?.length ?? 0;
        const catColor = CATEGORY_COLOR[finding.category] ?? "bg-secondary text-muted-foreground border-border";

        return (
          <div
            key={idx}
            className={`rounded-xl border bg-card transition-all ${isExpanded ? "border-primary/30 shadow-sm" : "border-border hover:border-border/80"}`}
          >
            {/* Header row */}
            <button
              className="w-full flex items-start gap-3 p-4 text-left"
              onClick={() => setExpanded(isExpanded ? null : idx)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {appealable
                  ? <AlertCircle className="w-4 h-4 text-red-500" />
                  : <Info className="w-4 h-4 text-muted-foreground" />
                }
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Top row: payer + code badge + amount */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {finding.payer_name || "Unknown Payer"}
                  </span>
                  {finding.denial_codes?.map(code => (
                    <span key={code} className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${catColor}`}>
                      {code}
                    </span>
                  ))}
                  {claimCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {claimCount} claim{claimCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed pr-4">{finding.description}</p>

                {/* Bottom row: amounts + difficulty + win rate */}
                <div className="flex flex-wrap items-center gap-4 pt-0.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">At risk</p>
                    <p className="text-sm font-bold text-foreground">${finding.dollar_amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Expected recovery</p>
                    <p className="text-sm font-bold text-emerald-600">${finding.expected_recovery.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Win rate</p>
                    <p className="text-xs font-semibold text-foreground">{strategy.winRateLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Difficulty</p>
                    <p className={`text-xs font-semibold capitalize ${DIFFICULTY_COLOR[finding.difficulty] ?? "text-foreground"}`}>
                      {finding.difficulty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-2 mt-1">
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </button>

            {/* Expanded: evidence + actions */}
            {isExpanded && (
              <div className="border-t border-border">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: evidence engine */}
                  <div>
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                      Appeal Package — CARC {primaryCarcCode}
                    </h3>
                    <EvidenceChecklist carcCode={primaryCarcCode} />
                  </div>

                  {/* Right: claim IDs + actions */}
                  <div className="space-y-4">
                    {/* Claim IDs */}
                    {(finding.claim_ids?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                          Claim Reference Numbers ({claimCount})
                        </h3>
                        <div className="rounded-lg bg-secondary/40 border border-border p-3 max-h-28 overflow-y-auto">
                          <div className="flex flex-wrap gap-1.5">
                            {finding.claim_ids?.map(id => (
                              <span key={id} className="text-[10px] font-mono bg-background border border-border rounded px-1.5 py-0.5 text-foreground">
                                {id}
                              </span>
                            ))}
                            {(finding.claim_count ?? 0) > (finding.claim_ids?.length ?? 0) && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{(finding.claim_count ?? 0) - (finding.claim_ids?.length ?? 0)} more
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Include these in your appeal letter and on the fax cover sheet.</p>
                      </div>
                    )}

                    {/* CPT codes */}
                    {(finding.cpt_codes?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Procedure Codes</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {finding.cpt_codes?.map(cpt => (
                            <span key={cpt} className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5">
                              {cpt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {appealable && (
                      <div className="space-y-2 pt-2">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Actions</h3>
                        <button
                          onClick={() => openAppeal(finding)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generate AI Appeal Letter
                        </button>
                        <button
                          onClick={() => copyQuickLetter(finding)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                        >
                          {copiedLetter
                            ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied to clipboard</>
                            : <><Clipboard className="w-3.5 h-3.5" /> Copy template letter</>
                          }
                        </button>
                        <p className="text-[10px] text-muted-foreground text-center">
                          AI letter is personalized with your clinical context · Template is instant
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Appeal letter modal (existing AI-powered one) */}
      <AppealLetterModal
        open={appealOpen}
        onClose={() => setAppealOpen(false)}
        finding={appealFinding ? {
          label: appealFinding.category,
          payer: appealFinding.payer_name,
          denialCodes: appealFinding.denial_codes ?? [],
          dollarAmount: appealFinding.dollar_amount,
          expectedRecovery: appealFinding.expected_recovery,
          description: appealFinding.description,
          action: appealFinding.recommended_action,
          cptCodes: appealFinding.cpt_codes ?? [],
          claimIds: appealFinding.claim_ids ?? [],
        } : null}
        practiceName={practiceName}
      />
    </div>
  );
}
