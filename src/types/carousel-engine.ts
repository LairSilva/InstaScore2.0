/**
 * INSTASCORE OS V14 — CARROSSEL ENGINE PRO TYPES
 * Strategic Carousel Generation Engine Type System
 */

import { ContentDNA, ContentObjectiveType, CagePillarId } from "./content-engine";
import { QualityGate2Report } from "./intelligence";

export type CarouselRole =
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

export interface CarouselSlidePro {
  slideNumber: number;
  role: CarouselRole;
  roleLabel: string;
  headline: string;
  body: string;
  visualDirection: string;
  emphasis?: string;
  layoutSuggestion?: string;
  imageSuggestion?: string;
  designIntent?: string;
}

export interface CarouselStrategyBrief {
  id: string;
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
  slideCount: 5 | 7 | 8 | 10 | 12;
  theme: string;
  themeMode: "strategic_recommendation" | "custom_theme" | "dna_ideation";
  whyThisCarousel: {
    identifiedBottleneck: string;
    bottleneckScore: number;
    strategicObjective: string;
    recommendedStrategy: string;
    rationale: string;
  };
  createdAt: string;
}

export interface CarouselOutputPro {
  id: string;
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
  slides: CarouselSlidePro[];
  brief: CarouselStrategyBrief;
  qualityReport: QualityGate2Report;
  generationMeta: {
    modelUsed: string;
    durationMs: number;
    iterations: number;
    createdAt: string;
  };
}

export type CarouselFeedbackRating = "excellent" | "good" | "does_not_fit" | "makes_no_sense";

export type CarouselFeedbackReason =
  | "tone"
  | "theme"
  | "depth"
  | "structure"
  | "language"
  | "cta"
  | "positioning"
  | "other";

export interface CarouselFeedbackInput {
  carouselId: string;
  rating: CarouselFeedbackRating;
  reason?: CarouselFeedbackReason;
  customNotes?: string;
  updatedTwinPreferences?: any;
}
