/**
 * Client-safe Data Retention & Minimization Utilities
 * Pure TypeScript functions with zero Node.js/server SDK dependencies.
 */

export const RETENTION_POLICIES = {
  DIAGNOSIS_DAYS: 180,         // 6 months for diagnostic audits
  START_PROJECT_DAYS: 180,     // 6 months for "começar do zero" projects
  DIGITAL_TWIN_DAYS: 365,      // 1 year for digital twin profiles
  PROFILE_DNA_DAYS: 365,       // 1 year for strategic profile DNA
  PERFORMANCE_MEMORY_DAYS: 365,// 1 year for historical post memory
  FEEDBACK_DAYS: 180,          // 6 months for user solution feedback
  AI_LOGS_DAYS: 90,            // 90 days for operational AI logs (no PII)
  WEBHOOK_EVENTS_DAYS: 90,     // 90 days for webhook idempotency
  CHECKOUT_SESSIONS_DAYS: 180, // 180 days for checkout sessions
  RATE_LIMITS_DAYS: 1,         // 1 day for rate limit buckets
} as const;

/**
 * Calculates the expiration timestamp (ms) based on retention policy
 */
export function calculateRetentionUntil(days: number = RETENTION_POLICIES.DIAGNOSIS_DAYS): number {
  return Date.now() + (days * 24 * 60 * 60 * 1000);
}

/**
 * Checks if a retention timestamp has passed
 */
export function isDocumentExpired(retentionUntil?: number): boolean {
  if (!retentionUntil) return false;
  return Date.now() > retentionUntil;
}

/**
 * Minimal diagnosis summary interface for localStorage minimization.
 * Strictly excludes full criteria texts, evidence quotes, prompts, and raw weights.
 */
export interface MinimalDiagnosisSummary {
  id: string;
  handle?: string;
  niche?: string;
  objective?: string;
  score: number;
  coverage: number;
  createdAt: string;
  minimizedAt: number;
  topStrengthTitle?: string;
  topGapTitle?: string;
  tomorrowActionTitle?: string;
  mainRecommendation?: string;
  retentionUntil: number;
  summaryOnly: true;
}

/**
 * Extracts a privacy-minimized summary from a full diagnosis result.
 */
export function extractMinimalDiagnosisSummary(data: any): MinimalDiagnosisSummary | null {
  if (!data || !data.scoring || !data.diagnosis) return null;

  const scoring = data.scoring;
  const diagnosis = data.diagnosis;
  const meta = data.meta;

  const topStrength = (typeof diagnosis.strengths?.[0] === 'string' ? diagnosis.strengths[0] : diagnosis.strengths?.[0]?.title) || 
                      (typeof diagnosis.key_strengths?.[0] === 'string' ? diagnosis.key_strengths[0] : diagnosis.key_strengths?.[0]?.title) || 
                      undefined;

  const topGap = (typeof diagnosis.critical_gaps?.[0] === 'string' ? diagnosis.critical_gaps[0] : diagnosis.critical_gaps?.[0]?.title) || 
                 (typeof diagnosis.critical_flaws?.[0] === 'string' ? diagnosis.critical_flaws[0] : diagnosis.critical_flaws?.[0]?.title) || 
                 undefined;

  const tomorrowAction = diagnosis.tomorrow_action?.title || 
                         (typeof diagnosis.tomorrow_action === 'string' ? diagnosis.tomorrow_action : undefined) ||
                         diagnosis.action_plan?.immediate_actions?.[0] || 
                         undefined;

  const mainRecommendation = tomorrowAction || topStrength || diagnosis.summary || undefined;

  return {
    id: meta?.diagnosticId || data.id || `diag_${Date.now()}`,
    handle: diagnosis.account_info?.handle || meta?.handle || data.handle || undefined,
    niche: diagnosis.account_info?.niche || meta?.niche || data.niche || undefined,
    objective: diagnosis.account_info?.objective || meta?.objective || data.objective || undefined,
    score: typeof scoring.score === 'number' ? scoring.score : 0,
    coverage: typeof scoring.coverage === 'number' ? scoring.coverage : 0,
    createdAt: new Date().toISOString(),
    minimizedAt: Date.now(),
    topStrengthTitle: topStrength,
    topGapTitle: topGap,
    tomorrowActionTitle: tomorrowAction,
    mainRecommendation,
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIAGNOSIS_DAYS),
    summaryOnly: true
  };
}
