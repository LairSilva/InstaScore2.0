/**
 * INSTASCORE V12 — CONTENT ENGINE CORE TYPES
 * Centralized Type System for InstaScore Content Engine
 */

export type ContentFormatType = "post" | "carousel" | "reel" | "story";
export type ContentObjectiveType = 
  | "authority" 
  | "engagement" 
  | "growth" 
  | "conversion" 
  | "education" 
  | "sales";

export type ContentItemStatus = "draft" | "generated" | "ready" | "scheduled" | "published";
export type CampaignType = 
  | "product_launch" 
  | "sell_service" 
  | "lead_generation" 
  | "build_authority" 
  | "event" 
  | "promotion" 
  | "custom";

export type CagePillarId = "conversion" | "authority" | "growth" | "expression";

export interface CageScores {
  conversion: number; // 0-25 or normalized 0-100
  authority: number;  // 0-25 or normalized 0-100
  growth: number;     // 0-25 or normalized 0-100
  expression: number; // 0-25 or normalized 0-100
}

export interface ContentDNAPillar {
  id: string;
  name: string;
  objective: string;
  cagePillar: CagePillarId;
  topics: string[];
  targetAudience?: string;
}

/**
 * 1. ContentDNA
 * Central unified representation derived deterministically from existing user profile, C.A.G.E. audits,
 * Start Mode, and Strategic DNA.
 */
export interface ContentDNA {
  niche: string;
  targetAudience: string;
  positioning: string;
  primaryGoal: string;
  toneOfVoice: string;
  cageScores: CageScores;
  strengths: string[];
  weaknesses: string[];
  strategicPriorities: string[];
  contentPillars: ContentDNAPillar[];
  profileStage: string;
  source: "diagnostic" | "start_mode" | "manual";
  handle?: string;
  bottleneckSummary?: string;
  opportunityHeadline?: string;
}

/**
 * Slide structure for Carousels
 */
export interface CarouselSlide {
  slideNumber: number;
  slideType: "cover" | "context" | "problem" | "core_solution" | "step" | "proof" | "cta";
  headline: string;
  body: string;
  visualGuidance?: string;
  badgeOrNumber?: string;
}

/**
 * Scene structure for Reels
 */
export interface ReelScene {
  sceneNumber: number;
  timeframe: string; // e.g. "0-3s", "3-12s"
  visualDirection: string;
  spokenText: string;
  onScreenText?: string;
  bRollSuggestion?: string;
}

/**
 * Story step structure
 */
export interface StoryStep {
  stepNumber: number;
  goal: string;
  storyType: "hook" | "context" | "value" | "interactive" | "cta";
  textOverlay: string;
  visualScene: string;
  suggestedInteraction?: "enquete" | "caixinha" | "link" | "reacao" | "direct";
  ctaText?: string;
}

/**
 * Generated Content Structure for each format
 */
export interface PostContentPayload {
  concept: string;
  headline: string;
  visualStructure: string;
  caption: string;
  cta: string;
  hashtags?: string[];
}

export interface CarouselContentPayload {
  coverHeadline: string;
  coverSubtitle: string;
  slides: CarouselSlide[];
  caption: string;
  finalCta: string;
  hashtags?: string[];
}

export interface ReelContentPayload {
  hookSpoken: string;
  hookVisual: string;
  estimatedDuration: string;
  scenes: ReelScene[];
  caption: string;
  cta: string;
  audioRecommendation: string;
  hashtags?: string[];
}

export interface StoryContentPayload {
  sequenceTitle: string;
  sequenceGoal: string;
  stories: StoryStep[];
  directTrigger: string;
}

export type ContentPayload = 
  | { format: "post"; data: PostContentPayload }
  | { format: "carousel"; data: CarouselContentPayload }
  | { format: "reel"; data: ReelContentPayload }
  | { format: "story"; data: StoryContentPayload };

/**
 * 9. ContentIdea / ContentItem Schema
 */
export interface ContentIdea {
  id: string;
  type: ContentFormatType;
  objective: ContentObjectiveType;
  cagePillar: CagePillarId;
  strategicReason: string;
  title: string;
  hook: string;
  previewSummary: string;
  whyThisTheme: string;
  content?: ContentPayload;
  caption?: string;
  cta?: string;
  status: ContentItemStatus;
  scheduledDate?: string;
  imageUrl?: string;
  imagePrompt?: string;
  createdAt: string;
  updatedAt: string;
  qualityScore?: number;
  qualityPassed?: boolean;
}

/**
 * 6. Calendar Item & Plan
 */
export interface CalendarItem {
  id: string;
  dayNumber: number;
  date: string;
  format: ContentFormatType;
  theme: string;
  objective: ContentObjectiveType;
  cagePillar: CagePillarId;
  status: ContentItemStatus;
  strategicReason: string;
  ideaId?: string;
  content?: ContentPayload;
}

export interface ContentCalendarPlan {
  id: string;
  daysCount: 7 | 15 | 30;
  primaryGoal: string;
  cadenceDescription: string;
  items: CalendarItem[];
  createdAt: string;
}

/**
 * 7. Campaign Builder (6 Fases)
 */
export interface CampaignPhase {
  phaseNumber: 1 | 2 | 3 | 4 | 5 | 6;
  phaseName: "Aquecimento" | "Consciência" | "Autoridade" | "Quebra de Objeções" | "Oferta" | "Conversão";
  objective: string;
  durationDays: number;
  contentTypes: ContentFormatType[];
  ideas: {
    title: string;
    hook: string;
    format: ContentFormatType;
    rationale: string;
    cta: string;
  }[];
  phaseCta: string;
}

export interface CampaignBlueprint {
  id: string;
  campaignType: CampaignType;
  title: string;
  productOrServiceName: string;
  targetAudience: string;
  primaryObjective: string;
  totalDurationDays: number;
  phases: CampaignPhase[];
  createdAt: string;
}

/**
 * 11. Content Memory & Fingerprints
 */
export interface ContentMemory {
  userId: string;
  usedThemes: string[];
  usedHooks: string[];
  usedCtas: string[];
  pillarDistribution: Record<CagePillarId, number>;
  fingerprints: string[]; // Hash or normalized token chains
  lastUpdated: string;
}

/**
 * Firestore Project Document
 */
export interface ContentProject {
  id: string;
  userId: string;
  title: string;
  dnaSnapshot: ContentDNA;
  mode: "create_now" | "fix_problem" | "plan_calendar" | "campaign";
  calendarPlan?: ContentCalendarPlan;
  campaignBlueprint?: CampaignBlueprint;
  totalItemsCount: number;
  createdAt: string;
  updatedAt: string;
}
