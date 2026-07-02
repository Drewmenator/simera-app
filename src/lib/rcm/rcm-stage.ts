// ============================================================================
// RCM stage model. TypeScript domain layer
// Mirrors 20260623_rcm_stage_model.sql (target table: public.findings).
// Keep this as the semantic layer (labels, ordering, CARC priors) on top of
// whatever `supabase gen types` produces for the findings row.
// ============================================================================

export const RCM_STAGES = [
  'pre_registration',
  'registration',
  'charge_capture',
  'utilization_review',
  'coding',
  'claim_submission',
  'remittance_processing',
  'follow_up',
  'patient_collections',
] as const;

export type RcmStage = (typeof RCM_STAGES)[number];

export type OfficeLayer = 'front' | 'middle' | 'back';

export interface RcmStageMeta {
  seq: number;
  label: string;
  layer: OfficeLayer;
}

export const RCM_STAGE_META: Record<RcmStage, RcmStageMeta> = {
  pre_registration:      { seq: 1, label: 'Pre-Registration',      layer: 'front'  },
  registration:          { seq: 2, label: 'Registration',          layer: 'front'  },
  charge_capture:        { seq: 3, label: 'Charge Capture',        layer: 'middle' },
  utilization_review:    { seq: 4, label: 'Utilization Review',    layer: 'middle' },
  coding:                { seq: 5, label: 'Coding',                layer: 'middle' },
  claim_submission:      { seq: 6, label: 'Claim Submission',      layer: 'middle' },
  remittance_processing: { seq: 7, label: 'Remittance Processing', layer: 'back'   },
  follow_up:             { seq: 8, label: 'Follow-Up',             layer: 'back'   },
  patient_collections:   { seq: 9, label: 'Patient Collections',   layer: 'back'   },
};

export type RootCauseMethod = 'ai_inferred' | 'human_confirmed' | 'payer_stated';

/** Attribution fields added to a findings row. */
export interface RootCauseAttribution {
  surfacedStage: RcmStage;                 // where it surfaced (default remittance_processing)
  rootCauseStage: RcmStage | null;         // null = unattributed
  rootCauseMethod: RootCauseMethod | null;
  rootCauseConfidence: number | null;      // 0..1, meaningful for ai_inferred
  rootCauseCode: string | null;            // CARC/RARC (mirror of denial_reason_code)
  rootCauseNote: string | null;
  rootCauseSetAt: string | null;           // ISO timestamp
  rootCauseSetBy: string | null;           // Clerk user id
}

/** One row of the leakage_by_stage view. */
export interface LeakageByStageRow {
  stage: RcmStage | 'unattributed';
  stageSeq: number | null;
  officeLayer: OfficeLayer | null;
  findingCount: number;
  billedAtRisk: number;
  recoverableAmount: number;
  recoveredAmount: number;
  openRecoverable: number;
  pctOfBilledAtRisk: number | null;
}

// ---------------------------------------------------------------------------
// CARC priors. Mirrors denial_code_stage_prior. Prior for AI attribution
// against findings.denial_reason_code; human_confirmed always wins.
// ---------------------------------------------------------------------------
export const CARC_STAGE_PRIOR: Record<string, RcmStage> = {
  '16':  'registration',
  '22':  'registration',
  '27':  'registration',
  '50':  'utilization_review',
  '197': 'utilization_review',
  '11':  'coding',
  '97':  'coding',
  '4':   'coding',
  '18':  'claim_submission',
  '29':  'claim_submission',
  '45':  'charge_capture',
};

/** Normalize a raw CARC (e.g. "CO-16", "16") and return its prior stage, if any. */
export function stageFromCarc(rawCode: string | null | undefined): RcmStage | null {
  if (!rawCode) return null;
  const digits = rawCode.replace(/[^0-9]/g, '');
  return CARC_STAGE_PRIOR[digits] ?? null;
}

/** Stable display order; 'unattributed' (null seq) sorts last. */
export function stageSort(a: LeakageByStageRow, b: LeakageByStageRow): number {
  return (a.stageSeq ?? 99) - (b.stageSeq ?? 99);
}
