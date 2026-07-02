// ============================================================================
// LeakageByStage. Dashboard panel for the leakage_by_stage view
// Stack: React + Tailwind. No shadcn/ui dependency, so it drops into any
// Tailwind app. Reads the view through your Supabase client.
//
// USAGE
//   import LeakageByStagePanel from '@/components/LeakageByStage';
//   import { supabase } from '@/lib/supabaseClient';   // your existing client
//   <LeakageByStagePanel supabase={supabase} />
//
// The import path for the types below assumes rcm-stage.ts is at
// src/lib/rcm/rcm-stage.ts (where you put it). Adjust the alias if yours differs.
// ============================================================================

import { useEffect, useState } from 'react';
import {
  RCM_STAGE_META,
  stageSort,
  type LeakageByStageRow,
  type OfficeLayer,
} from '@/lib/rcm/rcm-stage';

// --- data ------------------------------------------------------------------

/** Fetch + map the view (numeric columns can arrive as strings via PostgREST). */
export async function fetchLeakageByStage(
  supabase: { from: (t: string) => any },
): Promise<LeakageByStageRow[]> {
  const { data, error } = await supabase.from('leakage_by_stage').select('*');
  if (error) throw new Error(error.message ?? 'Failed to load leakage_by_stage');
  return (data ?? []).map((r: any): LeakageByStageRow => ({
    stage: r.stage,
    stageSeq: r.stage_seq === null ? null : Number(r.stage_seq),
    officeLayer: r.office_layer ?? null,
    findingCount: Number(r.finding_count),
    billedAtRisk: Number(r.billed_at_risk ?? 0),
    recoverableAmount: Number(r.recoverable_amount ?? 0),
    recoveredAmount: Number(r.recovered_amount ?? 0),
    openRecoverable: Number(r.open_recoverable ?? 0),
    pctOfBilledAtRisk:
      r.pct_of_billed_at_risk === null ? null : Number(r.pct_of_billed_at_risk),
  }));
}

// --- presentation ----------------------------------------------------------

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const LAYER_ORDER: Record<string, number> = { front: 0, middle: 1, back: 2 };
const LAYER_LABEL: Record<OfficeLayer, string> = {
  front: 'Front office',
  middle: 'Middle office',
  back: 'Back office',
};
// bar color encodes where in the cycle the money is leaking
const LAYER_BAR: Record<OfficeLayer, string> = {
  front: 'bg-sky-500',
  middle: 'bg-violet-500',
  back: 'bg-rose-500',
};

function groupKey(row: LeakageByStageRow): string {
  return row.officeLayer ?? 'unattributed';
}

export function LeakageByStage({ rows }: { rows: LeakageByStageRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-slate-900">No leakage findings yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Run an audit to surface recoverable revenue, then it'll break down by stage here.
        </p>
      </div>
    );
  }

  const totalOpen = rows.reduce((s, r) => s + r.openRecoverable, 0);
  const totalBilled = rows.reduce((s, r) => s + r.billedAtRisk, 0);
  const totalFindings = rows.reduce((s, r) => s + r.findingCount, 0);

  // share of open recoverable, the actionable number, not gross exposure
  const share = (r: LeakageByStageRow) =>
    totalOpen > 0 ? (r.openRecoverable / totalOpen) * 100 : 0;

  // group by office layer, layers in cycle order, unattributed last
  const groups = Array.from(
    rows.reduce((m, r) => {
      const k = groupKey(r);
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
      return m;
    }, new Map<string, LeakageByStageRow[]>()),
  ).sort(([a], [b]) => (LAYER_ORDER[a] ?? 9) - (LAYER_ORDER[b] ?? 9));

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Where revenue is leaking
        </h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-1">
          <div>
            <span className="text-3xl font-semibold text-slate-900">{usd(totalOpen)}</span>
            <span className="ml-2 text-sm text-slate-500">recoverable, still open</span>
          </div>
          <div className="text-sm text-slate-500">
            {usd(totalBilled)} billed at risk · {totalFindings} findings
          </div>
        </div>
      </header>

      <div className="divide-y divide-slate-100">
        {groups.map(([layer, layerRows]) => {
          const layerOpen = layerRows.reduce((s, r) => s + r.openRecoverable, 0);
          const label =
            layer === 'unattributed' ? 'Unattributed' : LAYER_LABEL[layer as OfficeLayer];
          const barColor =
            layer === 'unattributed' ? 'bg-slate-300' : LAYER_BAR[layer as OfficeLayer];
          return (
            <div key={layer} className="px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </span>
                <span className="text-xs text-slate-400">{usd(layerOpen)} open</span>
              </div>

              <ul className="space-y-3">
                {layerRows.sort(stageSort).map((r) => {
                  const meta =
                    r.stage === 'unattributed'
                      ? { label: 'Unattributed', seq: null }
                      : RCM_STAGE_META[r.stage];
                  const pct = share(r);
                  return (
                    <li key={r.stage}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-slate-900">
                          {meta.label}
                        </span>
                        <span className="text-sm tabular-nums text-slate-900">
                          {usd(r.openRecoverable)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                        <span className="w-28 shrink-0 text-right text-xs tabular-nums text-slate-400">
                          {pct.toFixed(0)}% · {r.findingCount} found
                        </span>
                      </div>
                      {r.recoveredAmount > 0 && (
                        <p className="mt-1 text-xs text-slate-400">
                          {usd(r.recoveredAmount)} already recovered of{' '}
                          {usd(r.recoverableAmount)} estimated
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- container (fetch + states) --------------------------------------------

export default function LeakageByStagePanel({
  supabase,
}: {
  supabase: { from: (t: string) => any };
}) {
  const [rows, setRows] = useState<LeakageByStageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLeakageByStage(supabase)
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [supabase]);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm font-medium text-rose-900">Couldn't load leakage data</p>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return <LeakageByStage rows={rows} />;
}
