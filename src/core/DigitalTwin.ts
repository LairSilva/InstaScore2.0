// Módulo 1: Estrutura Central do Digital Twin e Módulo 8: Growth Scores
// O Digital Twin representa o modelo estratégico do perfil com base nos dados do diagnóstico e baselines heurísticos.

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
  objectives: string[];
  targetAudience: string;
  toneOfVoice: string; // Linguagem
  visualStyle: string; // Estilo visual
  brandIdentity: string; // Identidade
}

export interface ContentState {
  currentBio: string; // Bio extraída do perfil
  currentCta: string; // CTA extraído do perfil
  bestPostingTimes: string[]; // Baseline / sugestão heurística de horários
  postingFrequency: string; // Baseline / recomendação estimada de frequência
  feedStrategyPatterns: string[]; // Sugestão heurística de formatos de Feed
  reelsStrategyPatterns: string[]; // Sugestão heurística de formatos de Reels
  contentThemes: string[]; // Conteúdos e pilares
  discoveredPatterns: string[]; // Hipóteses estruturais identificadas por IA
}

export interface UserHistory {
  events: any[]; // Histórico
  evolutionLog: any[]; // Evolução
  conversionRate: number; // Estimativa baseline teórica (baseada na nota de conversão)
}

// Módulo 1: O Digital Twin Completo
export interface DigitalTwin {
  id: string;
  handle: string;
  
  identity: UserIdentity;
  content: ContentState;
  metrics: GrowthScores;
  historyData: UserHistory;
  
  memoryGraphIds: string[];
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

  return {
    id: "twin-" + (handle || "usuario"),
    handle: handle || "usuario",
    identity: {
      niche: niche || "Geral",
      objectives: [objective || "Crescimento Estrutural"],
      targetAudience: targetAudience || "Geral",
      toneOfVoice: "Profissional Estratégico",
      visualStyle: "Moderno e Elegante",
      brandIdentity: userName || "Perfil Instagram",
    },
    content: {
      currentBio: diagnosisResult?.diagnosis?.evaluations?.find((e: any) => e.criterion_id === "positioning.offer_clarity")?.evidence || "Bio em análise",
      currentCta: diagnosisResult?.diagnosis?.evaluations?.find((e: any) => e.criterion_id === "conversion.explicit_cta")?.evidence || "CTA em análise",
      bestPostingTimes: ["09:00", "12:30", "18:00", "21:00"],
      postingFrequency: "5x por semana (Recomendação Baseline)",
      feedStrategyPatterns: ["Carrosséis Educativos", "Post Estático de Prova Social"],
      reelsStrategyPatterns: ["Reels Curtos de Atração", "Vídeos Diretos de Conversão"],
      contentThemes: [niche || "Conteúdo Geral"],
      discoveredPatterns: ["Hipótese: Ganchos diretos nos primeiros 3s elevam retenção"],
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
    memoryGraphIds: ["mem-1", "mem-2"],
  };
}
