import { 
  EvolutionaryInsight, 
  TwinPreferences, 
  TwinBehavior, 
  TwinPerformance 
} from "../types/intelligence";
import { ContentFormatType, CagePillarId } from "../types/content-engine";

// Módulo 1: Estrutura Central do Digital Twin e Módulo 8: Growth Scores
// O Digital Twin representa o modelo estratégico do perfil com base nos dados do diagnóstico, memória evolutiva e aprendizado.

export interface GrowthScores {
  overallScore: number;
  authorityVelocity: number;
  growthVelocity: number;
  conversionVelocity: number;
  executionScore: number;
  consistencyScore: number;
  momentumScore: number;
  learningScore: number; // Baseline heurístico de prontidão de aprendizado (0-100)
}

export interface UserIdentity {
  niche: string;
  subniche?: string;
  microsegment?: string;
  objectives: string[];
  targetAudience: string;
  toneOfVoice: string; // Linguagem
  visualStyle: string; // Estilo visual
  brandIdentity: string; // Identidade
  offer?: string;
  positioning?: string;
  differentiators?: string[];
}

export interface ContentState {
  currentBio: string; // Bio extraída do perfil
  currentCta: string; // CTA extraído do perfil
  bestPostingTimes: string[]; // Baseline / sugestão heurística de horários
  postingFrequency: string; // Baseline / recomendação estimada de frequência
  feedStrategyPatterns: string[]; // Sugestão heurística de formatos de Feed
  reelsStrategyPatterns: string[]; // Sugestão heurística de formatos de Reels
  contentThemes: string[]; // Conteúdos e pilares
  prohibitedThemes: string[]; // Temas proibidos / evitados
  preferredFormats: ContentFormatType[]; // Formatos preferidos
  discoveredPatterns: string[]; // Hipóteses estruturais identificadas por IA
}

export interface UserHistory {
  events: any[]; // Histórico
  evolutionLog: any[]; // Evolução
  conversionRate: number; // Estimativa baseline teórica (baseada na nota de conversão)
}

// Módulo 1: O Digital Twin Completo V13 (Evolutivo)
export interface DigitalTwin {
  id: string;
  handle: string;
  
  identity: UserIdentity;
  content: ContentState;
  metrics: GrowthScores;
  historyData: UserHistory;
  
  // V13 Evolutive Strategic Intelligence
  preferences: TwinPreferences;
  behavior: TwinBehavior;
  performance: TwinPerformance;
  learningInsights: EvolutionaryInsight[];
  
  memoryGraphIds: string[];
  lastLearningUpdate?: string;
}

export function createDefaultDigitalTwin(
  diagnosisResult?: any | null,
  userName?: string,
  handle?: string,
  niche?: string,
  objective?: string,
  targetAudience?: string
): DigitalTwin {
  const rawScore = diagnosisResult?.scoring?.score ?? 50;
  const score = Math.min(100, Math.max(0, rawScore));
  const cats = diagnosisResult?.scoring?.categories || {};

  const clamp = (val: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(val)));

  const cleanHandle = (handle || userName || "usuario").replace("@", "");
  const detectedNiche = niche || diagnosisResult?.diagnosis?.intelligence?.niche_context?.niche || "Geral";
  const detectedAudience = targetAudience || diagnosisResult?.diagnosis?.intelligence?.niche_context?.target_audience || "Profissionais e clientes qualificados";
  const detectedObjective = objective || "Crescimento Estrutural e Autoridade";

  const defaultInsights: EvolutionaryInsight[] = [
    {
      id: "ins-cage-1",
      insight: `Priorizar conteúdos de autoridade e diferenciação técnica para o nicho "${detectedNiche}".`,
      source: "cage_diagnostic",
      evidence: `Auditoria C.A.G.E. inicial detectou score global de ${score}/100 com gargalo prioritário.`,
      sampleCount: 1,
      confidence: 78,
      category: "angle",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "ins-cage-2",
      insight: "Carrosséis com estrutura contrarian e erros comuns geram maior taxa de salvamento inicial.",
      source: "pattern_intelligence",
      evidence: "Padrão agregado de benchmark para perfis técnicos em fase de consolidação.",
      sampleCount: 14,
      confidence: 84,
      category: "format",
      lastUpdated: new Date().toISOString()
    }
  ];

  return {
    id: "twin-" + cleanHandle,
    handle: cleanHandle,
    identity: {
      niche: detectedNiche,
      objectives: [detectedObjective],
      targetAudience: detectedAudience,
      toneOfVoice: "Profissional Estratégico, direto e sem clichês",
      visualStyle: "Moderno e Elegante",
      brandIdentity: userName || cleanHandle,
      offer: "Serviços e produtos de alto valor agregado",
      positioning: "Autoridade prática orientada a soluções e resultados concretos",
      differentiators: ["Metodologia comprovada", "Abordagem sem superficialidade"]
    },
    content: {
      currentBio: diagnosisResult?.diagnosis?.evaluations?.find((e: any) => e.criterion_id === "positioning.offer_clarity")?.evidence || "Bio em análise",
      currentCta: diagnosisResult?.diagnosis?.evaluations?.find((e: any) => e.criterion_id === "conversion.explicit_cta")?.evidence || "CTA em análise",
      bestPostingTimes: ["09:00", "12:30", "18:00", "21:00"],
      postingFrequency: "4 a 5x por semana (Recomendação Baseline)",
      feedStrategyPatterns: ["Carrosséis Educativos de Erros Comuns", "Post Estático de Prova Social"],
      reelsStrategyPatterns: ["Reels Curtos de Atração com Gancho de Quebra", "Vídeos Diretos de Conversão"],
      contentThemes: [detectedNiche, "Estudos de Caso", "Erros Comuns e Mitos"],
      prohibitedThemes: ["Promessas milagrosas", "Conselhos óbvios de autoajuda"],
      preferredFormats: ["carousel", "reel", "post"],
      discoveredPatterns: ["Ganchos com afirmação contrária nos primeiros 3s aumentam retenção em 40%"],
    },
    metrics: {
      overallScore: score,
      authorityVelocity: clamp((cats.authority?.percentage || score) * 0.9),
      growthVelocity: clamp((cats.seo?.percentage || score) * 0.85),
      conversionVelocity: clamp((cats.conversion?.percentage || score) * 0.95),
      executionScore: clamp(cats.content?.percentage || (score * 0.95)),
      consistencyScore: clamp(cats.positioning?.percentage || (score * 0.9)),
      momentumScore: clamp(cats.seo?.percentage || (score * 0.85)),
      learningScore: 85,
    },
    historyData: {
      events: [
        { id: "ev-1", title: "Auditoria C.A.G.E. Concluída", date: "Hoje", score: score }
      ],
      evolutionLog: [
        { date: "Diagnóstico", score: score }
      ],
      conversionRate: Number((clamp(cats.conversion?.percentage || 50) * 0.05).toFixed(1)),
    },
    preferences: {
      approvedStrategies: ["Carrosséis densos com frameworks", "Quebra de mitos"],
      rejectedStrategies: [],
      rejectedFormats: [],
      excludedThemes: [],
      preferredAngles: ["Contrarian / Erros Comuns", "Estudo de Caso Prático", "Passo a Passo Estruturado"],
      userFeedbackNotes: []
    },
    behavior: {
      postingFrequency: "4-5x / semana",
      formatsUsed: {
        carousel: 0,
        reel: 0,
        post: 0,
        story: 0
      },
      themesUsed: [],
      ctasUsed: [],
      hooksUsed: []
    },
    performance: {
      topPerformingContents: [],
      winningFormats: ["carousel", "reel"],
      winningThemes: [],
      winningHooks: [],
      winningCtas: [],
      lowPerformancePatterns: []
    },
    learningInsights: defaultInsights,
    memoryGraphIds: ["mem-1", "mem-2"],
    lastLearningUpdate: new Date().toISOString()
  };
}

