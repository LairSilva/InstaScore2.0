/**
 * INSTASCORE OS V14 — CONTENT PRODUCTION TYPE SYSTEM
 * End-to-End Content Production for Carrossel Pro + Post Estático Pro
 */

import { ContentDNA, ContentObjectiveType, CagePillarId } from "./content-engine";
import { QualityGate2Report } from "./intelligence";

export type ContentProductionFormat = "carousel" | "static_post" | "reel";

export type VisualThemeId =
  | "dark_editorial"
  | "tech_noir"
  | "gradient_aurora"
  | "clean_minimal"
  | "bold_contrast"
  | "creator_vibrant";

export interface VisualThemeConfig {
  id: VisualThemeId;
  name: string;
  badge: string;
  description: string;
  bgGradient: [string, string, string];
  primaryText: string;
  secondaryText: string;
  accentColor: string;
  accentGradient: [string, string];
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  highlightBg: string;
  glowColor1: string;
  glowColor2: string;
  fontDisplay: string;
  fontBody: string;
}

export type ProductionSlideRole =
  | "hook"
  | "problem"
  | "tension"
  | "insight"
  | "mechanism"
  | "step"
  | "application"
  | "proof"
  | "action"
  | "cta";

export interface ProductionSlide {
  slideNumber: number;
  role: ProductionSlideRole;
  roleLabel: string;
  headline: string;
  body: string;
  emphasis?: string;
  visualConcept: string;
  visualDirection: string;
  layoutSuggestion?: string;
  designIntent?: string;
  renderedDataUrl?: string;
}

export interface StrategicContentProductionBrief {
  id: string;
  format: ContentProductionFormat;
  objective: ContentObjectiveType;
  audience: string;
  funnelStage: "topo" | "meio" | "fundo";
  primaryPillar: CagePillarId;
  bottleneck: string;
  nextBestAction: string;
  strategicAngle: string;
  hookStrategy: string;
  toneOfVoice: string;
  positioning: string;
  offer?: string;
  cta: string;
  contentDNA: ContentDNA;
  constraints: string[];
  vetoes: string[];
  evidence: string[];
  confidence: number;
  // Format specific configurations
  slideCount?: 5 | 7 | 8 | 10 | 12;
  theme: string;
  themeMode: "strategic_recommendation" | "custom_theme" | "dna_ideation";
  visualTheme: VisualThemeId;
  whyThisContent: {
    identifiedBottleneck: string;
    bottleneckScore: number;
    strategicObjective: string;
    recommendedStrategy: string;
    rationale: string;
  };
  createdAt: string;
}

export interface CarouselProductionOutput {
  id: string;
  format: "carousel";
  title: string;
  coverHeadline: string;
  coverSubtitle: string;
  objective: ContentObjectiveType;
  strategicAngle: string;
  cagePillar: CagePillarId;
  targetAudience: string;
  funnelStage: "topo" | "meio" | "fundo";
  finalCta: string;
  caption: string;
  hashtags: string[];
  slides: ProductionSlide[];
  theme: VisualThemeId;
  brief: StrategicContentProductionBrief;
  qualityReport: QualityGate2Report;
  generationMeta: {
    modelUsed: string;
    durationMs: number;
    iterations: number;
    createdAt: string;
  };
}

export interface StaticPostProductionOutput {
  id: string;
  format: "static_post";
  title: string;
  concept: string;
  hook: string;
  headline: string;
  bodyCopy: string;
  takeaway: string;
  visualConcept: string;
  visualDirection: string;
  layoutSuggestion: string;
  designIntent: string;
  caption: string;
  finalCta: string;
  hashtags: string[];
  objective: ContentObjectiveType;
  strategicAngle: string;
  cagePillar: CagePillarId;
  targetAudience: string;
  funnelStage: "topo" | "meio" | "fundo";
  theme: VisualThemeId;
  renderedDataUrl?: string;
  brief: StrategicContentProductionBrief;
  qualityReport: QualityGate2Report;
  generationMeta: {
    modelUsed: string;
    durationMs: number;
    iterations: number;
    createdAt: string;
  };
}

export type ProductionFeedbackRating = "excellent" | "good" | "does_not_fit" | "makes_no_sense";

export type ProductionFeedbackReason =
  | "tone"
  | "theme"
  | "depth"
  | "structure"
  | "language"
  | "visual"
  | "cta"
  | "positioning"
  | "other";

export interface ContentProductionFeedbackInput {
  contentId: string;
  format: ContentProductionFormat;
  rating: ProductionFeedbackRating;
  reason?: ProductionFeedbackReason;
  customNotes?: string;
  updatedTwinPreferences?: any;
}
