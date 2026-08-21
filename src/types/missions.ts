/**
 * InstaScore OS V12 — Mission Engine & Deliverable Types
 */

export type MissionType = 
  | 'seo_name_optimization'
  | 'strategic_highlights'
  | 'humanization_plan'
  | 'authority_strategy'
  | 'bio_generator_pro'
  | 'custom_mission_resolver';

export type BioModifier = 'default' | 'commercial' | 'premium' | 'human' | 'authority' | 'direct';

export interface SeoNameOption {
  name: string;
  handleSuggestion: string;
  strategicKeyword: string;
  rationale: string;
  searchPotential: number; // 0-100
  clarityScore: number;    // 0-100
  overallScore: number;    // 0-100
}

export interface HighlightStoryFrame {
  frameNumber: number;
  title: string;
  content: string;
  visualCue: string;
  cta?: string;
}

export interface StrategicHighlightItem {
  order: number;
  name: string;
  objective: string;
  iconName: string;
  coverSuggestion: string;
  frames: HighlightStoryFrame[];
  cta: string;
}

export interface HumanizationContentPillar {
  title: string;
  description: string;
  weeklyFrequency: string;
  exampleTopic: string;
}

export interface ScriptItem {
  title: string;
  format: 'Reel' | 'Story' | 'Post';
  hook: string;
  body: string[];
  cta: string;
  filmingTips: string;
}

export interface HumanizationDeliverable {
  overview: string;
  pillars: HumanizationContentPillar[];
  reelIdeas: ScriptItem[];
  presentationScript: {
    hook: string;
    transformation: string;
    proofContext: string;
    cta: string;
    filmingGuideline: string;
  };
  interactiveStories: {
    title: string;
    sequence: string[];
    stickerType: string;
  }[];
  behindTheScenesTactics: string[];
}

export interface AuthorityDeliverable {
  strategyOverview: string;
  proofTypesRecommended: {
    type: string;
    howToApply: string;
    priority: 'Alta' | 'Média';
  }[];
  caseStudyTemplates: {
    title: string;
    structure: {
      initialProblem: string;
      appliedMethod: string;
      tangibleResult: string;
      finalTakeaway: string;
    };
    suggestedFormat: string;
  }[];
  authorityReelScript: ScriptItem;
  highlightsStructure: {
    title: string;
    storiesOutline: string[];
  };
}

export interface BioOption {
  id: string;
  archetype: 'AUTORIDADE' | 'CONVERSÃO' | 'POSICIONAMENTO' | 'PERSONALIDADE' | 'PREMIUM';
  title: string;
  bio: string;
  strategy: string;
  whyItWorks: string;
  bestFor: string;
  score: number; // 0-100
  metrics: {
    clarity: number;
    specificity: number;
    differentiation: number;
    ctaStrength: number;
  };
  genericityScore: number; // Must be < 25
}

export interface CustomMissionDeliverable {
  criterionTitle: string;
  rootProblem: string;
  tacticalPlan: string[];
  readyToUseTemplates: {
    title: string;
    content: string;
    instructions: string;
  }[];
  actionChecklist: string[];
  expectedImpactScoreGain: number;
}

export interface MissionExecutionResult {
  success: boolean;
  missionId: string;
  missionType: MissionType;
  title: string;
  targetCriterionId?: string;
  data: {
    seoNames?: SeoNameOption[];
    highlights?: StrategicHighlightItem[];
    humanization?: HumanizationDeliverable;
    authority?: AuthorityDeliverable;
    bios?: BioOption[];
    custom?: CustomMissionDeliverable;
  };
  qualityReport: {
    genericityScore: number;
    specificityRating: 'Alta' | 'Muito Alta' | 'Excepcional';
    contextFitRating: '100% Contextualizado';
  };
  requiresPro?: boolean;
}
