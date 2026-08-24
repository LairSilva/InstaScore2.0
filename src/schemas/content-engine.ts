import { z } from "zod";

export const ContentFormatEnum = z.enum(["post", "carousel", "reel", "story"]);
export const ContentObjectiveEnum = z.enum([
  "authority",
  "engagement",
  "growth",
  "conversion",
  "education",
  "sales"
]);
export const CagePillarEnum = z.enum(["conversion", "authority", "growth", "expression"]);

export const CarouselSlideSchema = z.object({
  slideNumber: z.number(),
  slideType: z.enum(["cover", "context", "problem", "core_solution", "step", "proof", "cta"]).default("step"),
  headline: z.string().min(1),
  body: z.string().default(""),
  visualGuidance: z.string().optional(),
  badgeOrNumber: z.string().optional()
});

export const ReelSceneSchema = z.object({
  sceneNumber: z.number(),
  timeframe: z.string().default("0-5s"),
  visualDirection: z.string().min(1),
  spokenText: z.string().min(1),
  onScreenText: z.string().optional(),
  bRollSuggestion: z.string().optional()
});

export const StoryStepSchema = z.object({
  stepNumber: z.number(),
  goal: z.string().min(1),
  storyType: z.enum(["hook", "context", "value", "interactive", "cta"]).default("value"),
  textOverlay: z.string().min(1),
  visualScene: z.string().min(1),
  suggestedInteraction: z.enum(["enquete", "caixinha", "link", "reacao", "direct"]).optional(),
  ctaText: z.string().optional()
});

export const PostContentPayloadSchema = z.object({
  concept: z.string().min(1),
  headline: z.string().min(1),
  visualStructure: z.string().min(1),
  caption: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.array(z.string()).optional()
});

export const CarouselContentPayloadSchema = z.object({
  coverHeadline: z.string().min(1),
  coverSubtitle: z.string().default(""),
  slides: z.array(CarouselSlideSchema).min(3),
  caption: z.string().min(1),
  finalCta: z.string().min(1),
  hashtags: z.array(z.string()).optional()
});

export const ReelContentPayloadSchema = z.object({
  hookSpoken: z.string().min(1),
  hookVisual: z.string().min(1),
  estimatedDuration: z.string().default("30-45 segundos"),
  scenes: z.array(ReelSceneSchema).min(3),
  caption: z.string().min(1),
  cta: z.string().min(1),
  audioRecommendation: z.string().default("Voz original + Instrumental suave"),
  hashtags: z.array(z.string()).optional()
});

export const StoryContentPayloadSchema = z.object({
  sequenceTitle: z.string().min(1),
  sequenceGoal: z.string().min(1),
  stories: z.array(StoryStepSchema).min(3),
  directTrigger: z.string().default("Responda 'QUERO' no Direct")
});

export const ContentIdeaSchema = z.object({
  id: z.string(),
  type: ContentFormatEnum,
  objective: ContentObjectiveEnum,
  cagePillar: CagePillarEnum,
  strategicReason: z.string().min(1),
  title: z.string().min(1),
  hook: z.string().min(1),
  previewSummary: z.string().default(""),
  whyThisTheme: z.string().default(""),
  caption: z.string().optional(),
  cta: z.string().optional(),
  status: z.enum(["draft", "generated", "ready", "scheduled", "published"]).default("draft"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

export const IdeatorBatchOutputSchema = z.object({
  ideas: z.array(ContentIdeaSchema).min(1),
  strategicRationale: z.string().default(""),
  primaryFocusPillar: CagePillarEnum
});

export const QualityCheckerReportSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  antiGenericScore: z.number().min(0).max(10),
  nicheAlignmentScore: z.number().min(0).max(10),
  hookStrengthScore: z.number().min(0).max(10),
  ctaClarityScore: z.number().min(0).max(10),
  issuesFound: z.array(z.string()).default([]),
  improvementApplied: z.string().optional()
});

export const CalendarItemSchema = z.object({
  id: z.string(),
  dayNumber: z.number(),
  date: z.string(),
  format: ContentFormatEnum,
  theme: z.string().min(1),
  objective: ContentObjectiveEnum,
  cagePillar: CagePillarEnum,
  status: z.enum(["draft", "generated", "ready", "scheduled", "published"]).default("draft"),
  strategicReason: z.string().min(1)
});

export const ContentCalendarPlanSchema = z.object({
  id: z.string(),
  daysCount: z.union([z.literal(7), z.literal(15), z.literal(30)]),
  primaryGoal: z.string().min(1),
  cadenceDescription: z.string().min(1),
  items: z.array(CalendarItemSchema).min(1),
  createdAt: z.string().default(() => new Date().toISOString())
});

export const CampaignPhaseSchema = z.object({
  phaseNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  phaseName: z.enum(["Aquecimento", "Consciência", "Autoridade", "Quebra de Objeções", "Oferta", "Conversão"]),
  objective: z.string().min(1),
  durationDays: z.number().default(3),
  contentTypes: z.array(ContentFormatEnum).min(1),
  ideas: z.array(z.object({
    title: z.string().min(1),
    hook: z.string().min(1),
    format: ContentFormatEnum,
    rationale: z.string().min(1),
    cta: z.string().min(1)
  })).min(1),
  phaseCta: z.string().min(1)
});

export const CampaignBlueprintSchema = z.object({
  id: z.string(),
  campaignType: z.enum(["product_launch", "sell_service", "lead_generation", "build_authority", "event", "promotion", "custom"]),
  title: z.string().min(1),
  productOrServiceName: z.string().min(1),
  targetAudience: z.string().min(1),
  primaryObjective: z.string().min(1),
  totalDurationDays: z.number().min(1),
  phases: z.array(CampaignPhaseSchema).length(6),
  createdAt: z.string().default(() => new Date().toISOString())
});
