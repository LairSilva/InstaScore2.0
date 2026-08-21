export interface StartProjectInput {
  projectIdea: string;
  objective: string;
  preferredStyle?: string;
}

export interface NameSuggestion {
  name: string;
  handle: string;
  concept: string;
  category: "Autoridade" | "Memorável" | "Premium" | "Criativo" | "Pessoal" | "Comercial";
  whyItWorks: string;
  memorabilityScore: number; // 0-100
  brandPotentialScore: number; // 0-100
}

export interface NicheTerritory {
  mainNiche: string;
  recommendedSubniche: string;
  targetAudience: string;
  coreProblem: string;
  coreDesire: string;
  potentialDifferential: string;
  rationale: string;
}

export interface PositioningStatement {
  statement: string; // "Eu ajudo [público] a [resultado] através de [diferencial]."
  whoYouAre: string;
  targetAudience: string;
  problemSolved: string;
  transformation: string;
  whyFollow: string;
}

export interface BioOption {
  id: string;
  category: "Autoridade" | "Conversão" | "Crescimento" | "Marca pessoal" | "Premium";
  text: string;
  charCount: number;
  highlight: string;
}

export interface ContentPillar {
  name: string;
  goal: string;
  format: string; // Reels, Carrossel, Stories, Static
  funnelStage: "Descoberta" | "Autoridade" | "Relacionamento" | "Conversão";
  examples: string[];
}

export interface InitialPost {
  dayNumber: number;
  hook: string;
  format: "Reels" | "Carrossel" | "Foto/Estático" | "Stories";
  topic: string;
  goal: string;
  cta: string;
  structure: string[];
  suggestedCaption: string;
  pillar: string;
}

export interface CalendarDay {
  day: number;
  content: string;
  format: string;
  pillar: string;
  goal: string;
  cta: string;
  funnelStage: "Descoberta" | "Autoridade" | "Relacionamento" | "Conversão";
}

export interface StartCageScores {
  conversion: number; // C
  authority: number;  // A
  growth: number;     // G
  expression: number; // E
}

export interface StartModeResult {
  projectInput: StartProjectInput;
  startScore: number; // 0-100
  cageScores: StartCageScores;
  territory: NicheTerritory;
  nameSuggestions: NameSuggestion[];
  selectedName?: NameSuggestion;
  positioning: PositioningStatement;
  bioOptions: BioOption[];
  selectedBio?: BioOption;
  pillars: ContentPillar[];
  first10Posts: InitialPost[];
  calendar30Days: CalendarDay[];
  nextImmediateAction: {
    headline: string;
    description: string;
    checklist: string[];
  };
  createdAt: string;
}
