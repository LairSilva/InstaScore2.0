/**
 * INSTASCORE OS V13 — INTELLIGENCE EVOLUTION TYPES
 * Centralized Type System for Digital Twin Evolutivo, Learning Engine,
 * Strategy Engine, Content Brief, Feedback Engine, and Pattern Intelligence.
 */

import { CagePillarId, ContentFormatType, ContentObjectiveType } from "./content-engine";

/**
 * 1. Evolutionary Strategic Insight
 * Every insight must track source, empirical evidence, sample size, and statistical confidence.
 */
export interface EvolutionaryInsight {
  id: string;
  insight: string;
  source: "profile_history" | "user_feedback" | "cage_diagnostic" | "pattern_intelligence" | "baseline_heuristic";
  evidence: string;
  sampleCount: number;
  confidence: number; // 0 to 100%
  category: "format" | "theme" | "hook" | "cta" | "angle" | "audience";
  lastUpdated: string;
}

/**
 * 2. User Explicit and Inferred Preferences
 * Captures what works and crucially what the user DOES NOT want to do.
 */
export interface TwinPreferences {
  approvedStrategies: string[];
  rejectedStrategies: string[];
  rejectedFormats: ContentFormatType[];
  excludedThemes: string[];
  preferredAngles: string[];
  userFeedbackNotes: string[];
}

/**
 * 3. Historical Publishing & Creative Behavior
 */
export interface TwinBehavior {
  postingFrequency: string;
  formatsUsed: Record<ContentFormatType, number>;
  themesUsed: string[];
  ctasUsed: string[];
  hooksUsed: string[];
}

/**
 * 4. Content Performance History
 */
export interface TwinPerformance {
  topPerformingContents: {
    id: string;
    title: string;
    format: ContentFormatType;
    hook: string;
    pillar: CagePillarId;
    score: number;
    savedCount?: number;
    shareCount?: number;
  }[];
  winningFormats: ContentFormatType[];
  winningThemes: string[];
  winningHooks: string[];
  winningCtas: string[];
  lowPerformancePatterns: string[];
}

/**
 * 5. Structured User Feedback
 */
export type FeedbackRating = "excellent" | "good" | "does_not_fit" | "makes_no_sense";

export type FeedbackReason =
  | "not_my_audience"
  | "already_spoke_about_this"
  | "disliked_theme"
  | "disliked_format"
  | "dont_want_to_appear"
  | "doesnt_represent_brand"
  | "no_such_offer"
  | "other";

export interface UserFeedbackRecord {
  id: string;
  contentId?: string;
  title?: string;
  theme?: string;
  format?: ContentFormatType;
  rating: FeedbackRating;
  reason?: FeedbackReason;
  customNote?: string;
  createdAt: string;
}

/**
 * 6. Collective / Aggregated Pattern Intelligence
 * Anonymous aggregated benchmarks with statistical significance controls.
 */
export interface AggregatedPattern {
  id: string;
  niche: string;
  objective: ContentObjectiveType;
  format: ContentFormatType;
  angle: string;
  observedPattern: string;
  sampleSize: number;
  minSampleThreshold: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number; // 0 to 100
  recencyDate: string;
}

/**
 * 7. Structured Content Brief
 * The unified intermediate layer between Strategy and Execution Engines.
 */
export interface ContentBrief {
  id: string;
  title: string;
  objective: ContentObjectiveType;
  targetAudience: string;
  funnelStage: "topo" | "meio" | "fundo";
  cagePillar: CagePillarId;
  bottleneck: string;
  opportunity: string;
  theme: string;
  angle: string;
  hook: string;
  promise: string;
  structure: string;
  tone: string;
  emotion: string;
  cta: string;
  format: ContentFormatType;
  strategicReferences: string[];
  profileLearnings: string[];
  relevantPatterns: string[];
  confidence: number;
  createdAt: string;
}

/**
 * 8. Strategy Decision Observability Record
 * Allows full auditability: "Why did the AI recommend this?"
 */
export interface StrategyDecisionAuditRecord {
  decisionId: string;
  profileId: string;
  niche: string;
  cageContext: {
    scores: {
      conversion: number;
      authority: number;
      growth: number;
      expression: number;
    };
    weakestPillar: CagePillarId;
    weakestScore: number;
  };
  digitalTwinVersion: string;
  relevantInsights: EvolutionaryInsight[];
  confidence: number;
  patternInputs: string[];
  feedbackInputs: string[];
  strategyDecision: {
    objective: string;
    recommendedFormat: ContentFormatType;
    selectedAngle: string;
  };
  contentBriefId: string;
  timestamp: string;
}

/**
 * 9. Next Best Action
 * The primary strategic decision output produced by the Strategy Engine.
 */
export interface NextBestAction {
  objective: string;
  bottleneck: string;
  opportunity: string;
  recommendedFormat: ContentFormatType;
  angle: string;
  desiredOutcome: string;
  priority: "high" | "medium" | "normal";
  confidence: number; // 0 to 100
  rationale: string;
  brief: ContentBrief;
  strategicPillar: CagePillarId;
  auditRecord?: StrategyDecisionAuditRecord;
}

/**
 * 9. Quality Gate 2.0 Report
 */
export interface QualityGate2Report {
  passed: boolean;
  score: number; // 0 to 100
  dimensions: {
    strategyAlignmentScore: number;
    originalityScore: number;
    brandFitScore: number;
    executionScore: number;
    contextScore: number;
  };
  issuesFound: string[];
  improvementApplied: string;
  iterationCount: number;
}
