/**
 * INSTASCORE OS V13 — STRATEGY ENGINE
 * Central Strategic Brain that decides the NEXT BEST ACTION for a creator.
 * Combines C.A.G.E., Digital Twin, Content Memory, Learning Insights, and Pattern Intelligence.
 */

import { NextBestAction, ContentBrief, EvolutionaryInsight } from "../../types/intelligence";
import { ContentDNA, ContentFormatType, ContentObjectiveType, CagePillarId, CageScores } from "../../types/content-engine";
import { DigitalTwin } from "../../core/DigitalTwin";
import { ExpandedContentMemory, checkThemeFatigue } from "../content/ContentMemoryEngine";
import { PatternIntelligence } from "./PatternIntelligence";
import { ContentBriefEngine } from "./ContentBriefEngine";

export interface StrategyEngineInput {
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  memory?: ExpandedContentMemory | null;
  customGoal?: string;
  cageScores?: CageScores;
}

export class StrategyEngine {
  /**
   * Decides the Next Best Action based on holistic profile intelligence
   */
  static determineNextBestAction(input: StrategyEngineInput): NextBestAction {
    const { dna, digitalTwin, memory } = input;
    const scores = input.cageScores || dna.cageScores || { conversion: 50, authority: 50, growth: 50, expression: 50 };

    // 1. Identify primary bottleneck pillar from C.A.G.E.
    const pillarEntries: [CagePillarId, number][] = [
      ["conversion", scores.conversion],
      ["authority", scores.authority],
      ["growth", scores.growth],
      ["expression", scores.expression]
    ];

    // Sort ascending to find lowest score (gargalo crítico)
    pillarEntries.sort((a, b) => a[1] - b[1]);
    const weakestPillar = pillarEntries[0][0];
    const weakestScore = pillarEntries[0][1];

    // 2. Derive strategic objective and bottleneck summary
    let strategicObjective: ContentObjectiveType = "authority";
    let bottleneck = "";
    let opportunity = "";
    let desiredOutcome = "";

    if (weakestPillar === "authority") {
      strategicObjective = "authority";
      bottleneck = dna.bottleneckSummary || `Baixa percepção de especialização técnica e autoridade diferenciada (${weakestScore}/100).`;
      opportunity = dna.opportunityHeadline || "Publicar conteúdo educativo desconstruindo mitos e erros comuns para elevar status técnico.";
      desiredOutcome = "Aumentar salvamentos, percepção de competência e compartilhamentos qualificados.";
    } else if (weakestPillar === "conversion") {
      strategicObjective = "conversion";
      bottleneck = dna.bottleneckSummary || `Falta de chamadas para ação diretas e mecanismos de captação no feed (${weakestScore}/100).`;
      opportunity = dna.opportunityHeadline || "Conteúdo de prova com oferta clara e gatilho de direct para transformar seguidores em clientes.";
      desiredOutcome = "Gerar leads qualificados, mensagens no direct e conversões de venda.";
    } else if (weakestPillar === "growth") {
      strategicObjective = "growth";
      bottleneck = dna.bottleneckSummary || `Alcance orgânico limitado e ganchos iniciais com baixa retenção (${weakestScore}/100).`;
      opportunity = dna.opportunityHeadline || "Reels de atração rápida com quebra de padrão nos primeiros 3 segundos.";
      desiredOutcome = "Ampliar descoberta orgânica, novos seguidores e taxa de visualização completa.";
    } else {
      strategicObjective = "education";
      bottleneck = dna.bottleneckSummary || `Inconsistência visual e clareza de mensagem no feed (${weakestScore}/100).`;
      opportunity = dna.opportunityHeadline || "Carrosséis estruturados em método proprietário e comunicação visual limpa.";
      desiredOutcome = "Reter o público por mais tempo e reforçar identidade de marca memorável.";
    }

    // 3. Format Selection: Check Preferences & Winning Formats
    const rejectedFormats = digitalTwin?.preferences?.rejectedFormats || [];
    const winningFormats = digitalTwin?.performance?.winningFormats || [];
    
    let recommendedFormat: ContentFormatType = "carousel";

    if (weakestPillar === "growth") {
      recommendedFormat = rejectedFormats.includes("reel") ? "carousel" : "reel";
    } else if (weakestPillar === "conversion") {
      recommendedFormat = rejectedFormats.includes("story") 
        ? (rejectedFormats.includes("post") ? "carousel" : "post")
        : (winningFormats.includes("carousel") ? "carousel" : "post");
    } else {
      recommendedFormat = rejectedFormats.includes("carousel") ? "post" : "carousel";
    }

    // If winning formats exist and are not rejected, respect profile evidence
    if (winningFormats.length > 0 && !rejectedFormats.includes(winningFormats[0])) {
      if (weakestPillar === "authority" && winningFormats.includes("carousel")) {
        recommendedFormat = "carousel";
      }
    }

    // 4. Angle Selection with Pattern Intelligence & Twin Learnings
    const patterns = PatternIntelligence.getPatternsForContext(dna.niche, strategicObjective, recommendedFormat);
    const topPattern = patterns.length > 0 ? patterns[0] : null;

    let selectedAngle = topPattern?.angle || "Contrarian / Erros Comuns e Framework Prático";
    
    // Check if user has explicit preferred angles in Digital Twin
    if (digitalTwin?.preferences?.preferredAngles && digitalTwin.preferences.preferredAngles.length > 0) {
      selectedAngle = digitalTwin.preferences.preferredAngles[0];
    }

    // 5. Theme Generation with Excluded Theme Protection & Memory Anti-Fatigue
    const excludedThemes = digitalTwin?.preferences?.excludedThemes || [];
    let themeCandidate = `${dna.niche}: O erro silencioso que 90% cometem ao tentar ${weakestPillar === "conversion" ? "vender" : "crescer"}`;
    
    if (excludedThemes.some(ex => themeCandidate.toLowerCase().includes(ex.toLowerCase()))) {
      themeCandidate = `${dna.niche}: Framework prático de 3 passos para destravar ${weakestPillar}`;
    }

    if (memory && checkThemeFatigue(themeCandidate, memory)) {
      themeCandidate = `${dna.niche}: Caso de estudo e análise de estratégia avançada`;
    }

    // 6. Calculate Confidence Score
    let confidence = 74; // Baseline for cold start (0 insights)
    const relevantInsights: EvolutionaryInsight[] = (digitalTwin?.learningInsights || []).slice(0, 2);

    if (relevantInsights.length > 0) {
      const topInsightConf = relevantInsights[0].confidence;
      if (topPattern && topPattern.sampleSize >= topPattern.minSampleThreshold) {
        confidence = Math.min(96, Math.max(80, Math.round((topInsightConf + topPattern.confidenceScore) / 2)));
      } else {
        confidence = topInsightConf;
      }
    } else if (topPattern && topPattern.sampleSize >= topPattern.minSampleThreshold) {
      // In cold start with 0 personal insights, use baseline confidence of 74%
      confidence = 74;
    }

    // 7. Synthesize Rationale
    const insightsSummary = relevantInsights.map(i => `• ${i.insight}`).join("\n");

    const rationale = `Recomendação calculada combinando C.A.G.E. (Gargalo em ${weakestPillar.toUpperCase()} com nota ${weakestScore}/100), nicho "${dna.niche}" e padrões agregados de alta conversão (${confidence}% de confiança estatística).${insightsSummary ? `\n\nInsights do Perfil:\n${insightsSummary}` : ""}`;

    // 8. Build the Unified Content Brief
    const brief: ContentBrief = ContentBriefEngine.buildBrief({
      dna,
      digitalTwin,
      cagePillar: weakestPillar,
      bottleneck,
      opportunity,
      objective: strategicObjective,
      format: recommendedFormat,
      angle: selectedAngle,
      theme: themeCandidate,
      confidence,
      strategicReferences: [
        `Gargalo C.A.G.E.: ${weakestPillar.toUpperCase()} (${weakestScore}/100)`,
        `Padrão de Referência: ${topPattern?.observedPattern || "Estrutura orientada a retenção técnica"}`
      ],
      profileLearnings: relevantInsights.map(i => `${i.insight} (${i.confidence}% conf.)`),
      relevantPatterns: topPattern ? [topPattern.observedPattern] : []
    });

    const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const auditRecord = {
      decisionId,
      profileId: dna.handle || "profile-default",
      niche: dna.niche,
      cageContext: {
        scores: {
          conversion: scores.conversion,
          authority: scores.authority,
          growth: scores.growth,
          expression: scores.expression
        },
        weakestPillar,
        weakestScore
      },
      digitalTwinVersion: digitalTwin?.handle ? `v13-${digitalTwin.handle}` : "v13-default",
      relevantInsights,
      confidence,
      patternInputs: topPattern ? [topPattern.observedPattern] : [],
      feedbackInputs: digitalTwin?.preferences?.userFeedbackNotes || [],
      strategyDecision: {
        objective: strategicObjective,
        recommendedFormat,
        selectedAngle
      },
      contentBriefId: brief.id,
      timestamp: nowIso
    };

    return {
      objective: strategicObjective,
      bottleneck,
      opportunity,
      recommendedFormat,
      angle: selectedAngle,
      desiredOutcome,
      priority: weakestScore < 45 ? "high" : "medium",
      confidence,
      rationale,
      brief,
      strategicPillar: weakestPillar,
      auditRecord
    };
  }
}
