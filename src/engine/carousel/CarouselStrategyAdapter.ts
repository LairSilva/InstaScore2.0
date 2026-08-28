/**
 * INSTASCORE OS V14 — CAROUSEL STRATEGY ADAPTER
 * Adapts intelligence from C.A.G.E., NextBestAction, Digital Twin, ContentDNA,
 * Content Memory, Creator Preferences, and Vetoes into a standard CarouselStrategyBrief.
 */

import { ContentDNA, ContentObjectiveType, CagePillarId } from "../../types/content-engine";
import { CarouselStrategyBrief } from "../../types/carousel-engine";
import { DigitalTwin } from "../../core/DigitalTwin";
import { StrategyEngine } from "../intelligence/StrategyEngine";
import { PatternIntelligence } from "../intelligence/PatternIntelligence";
import { ExpandedContentMemory } from "../content/ContentMemoryEngine";

export interface BuildCarouselBriefOptions {
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  memory?: ExpandedContentMemory | null;
  objective?: ContentObjectiveType;
  theme?: string;
  themeMode?: "strategic_recommendation" | "custom_theme" | "dna_ideation";
  slideCount?: 5 | 7 | 8 | 10 | 12;
  customCta?: string;
  strategicAngle?: string;
}

export class CarouselStrategyAdapter {
  /**
   * Translates holistic system intelligence into a deterministic Strategic Content Brief
   */
  static createBrief(options: BuildCarouselBriefOptions): CarouselStrategyBrief {
    const { dna, digitalTwin, memory } = options;

    // 1. Compute Next Best Action from Strategy Engine
    const nextBestAction = StrategyEngine.determineNextBestAction({
      dna,
      digitalTwin,
      memory,
      cageScores: dna.cageScores
    });

    const primaryPillar: CagePillarId = nextBestAction.strategicPillar || "authority";
    const bottleneckScore = dna.cageScores ? dna.cageScores[primaryPillar] : 50;

    // 2. Resolve Objective
    const objective: ContentObjectiveType = options.objective || nextBestAction.brief.objective || "authority";

    // 3. Resolve Funnel Stage
    const funnelStage: "topo" | "meio" | "fundo" = 
      objective === "growth" 
        ? "topo" 
        : objective === "conversion" || objective === "sales" 
          ? "fundo" 
          : "meio";

    // 4. Resolve Slide Count
    const slideCount: 5 | 7 | 8 | 10 | 12 = options.slideCount || (objective === "growth" ? 5 : objective === "education" ? 10 : 7);

    // 5. Resolve Strategic Angle
    const patterns = PatternIntelligence.getPatternsForContext(dna.niche, objective, "carousel");
    const topPattern = patterns.length > 0 ? patterns[0] : null;

    const strategicAngle = options.strategicAngle ||
      (digitalTwin?.preferences?.preferredAngles?.[0]) ||
      (topPattern?.angle) ||
      (primaryPillar === "conversion" 
        ? "Quebra de Objeção Oculta & Contraste" 
        : primaryPillar === "growth"
          ? "Contrarian / Anti-Senso Comum"
          : "Diagnóstico de Erro Silencioso & Framework Prático");

    // 6. Resolve Theme
    const themeMode = options.themeMode || (options.theme ? "custom_theme" : "strategic_recommendation");
    let theme = options.theme;

    if (!theme) {
      if (objective === "conversion") {
        theme = `${dna.niche}: A objeção invisível que trava 90% das decisões de compra`;
      } else if (objective === "growth") {
        theme = `${dna.niche}: Por que o conselho mais comum do mercado está estagnando seu perfil`;
      } else if (objective === "education") {
        theme = `${dna.niche}: O passo a passo completo para dominar o processo sem tentativa e erro`;
      } else {
        theme = `${dna.niche}: Como evitar o erro invisível que destrói sua autoridade técnica`;
      }
    }

    // 7. Resolve Vetoes and Constraints
    const vetoes: string[] = [
      ...(digitalTwin?.preferences?.excludedThemes || []),
      ...(digitalTwin?.preferences?.rejectedStrategies || [])
    ];

    const constraints: string[] = [
      "Zero clichês genéricos (banidas expressões como '5 dicas', 'segredo revelado', 'no mundo de hoje')",
      "Cada slide deve possuir papel narrativo único e direção visual específica",
      "Copy adaptada ao tom de voz do perfil sem exageros motivacionais",
      `Nicho estrito: ${dna.niche}`,
      `Público-alvo qualificado: ${dna.targetAudience}`
    ];

    // 8. Resolve CTA
    let cta = options.customCta;
    if (!cta) {
      if (objective === "conversion" || objective === "sales") {
        cta = "Envie uma mensagem no Direct com a palavra 'METODO' para receber o direcionamento estratégico.";
      } else if (objective === "growth") {
        cta = "Compartilhe este conteúdo com alguém que precisa parar de cometer este erro.";
      } else {
        cta = "Salve este carrossel para consultar e aplicar quando for estruturar sua estratégia.";
      }
    }

    const hookStrategy = strategicAngle.includes("Contrarian") || strategicAngle.includes("Anti-Senso")
      ? "Ruptura de padrão e afirmação contrária ao senso comum"
      : strategicAngle.includes("Erro")
        ? "Identificação de ponto cego técnico de alto custo"
        : "Promessa de clareza e framework prático sem enrolação";

    const evidence: string[] = [
      `Gargalo auditado em ${primaryPillar.toUpperCase()}: ${bottleneckScore}/100`,
      ...(digitalTwin?.learningInsights || []).map(i => `${i.insight} (${i.confidence}% conf.)`).slice(0, 2),
      ...(topPattern ? [topPattern.observedPattern] : [])
    ];

    const confidence = Math.min(96, Math.max(78, nextBestAction.confidence || 86));

    const whyThisCarousel = {
      identifiedBottleneck: `Pilar ${primaryPillar.toUpperCase()} (${bottleneckScore}/100) — ${dna.weaknesses?.[0] || nextBestAction.bottleneck}`,
      bottleneckScore,
      strategicObjective: `${objective.toUpperCase()} (Etapa do funil: ${funnelStage.toUpperCase()})`,
      recommendedStrategy: `${strategicAngle} — Focado em ${nextBestAction.desiredOutcome}`,
      rationale: nextBestAction.rationale
    };

    return {
      id: `cbrief_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      objective,
      audience: dna.targetAudience || "Público qualificado do nicho",
      funnelStage,
      primaryPillar,
      bottleneck: nextBestAction.bottleneck,
      nextBestAction: nextBestAction.opportunity,
      strategicAngle,
      hookStrategy,
      toneOfVoice: dna.toneOfVoice || "Estratégico, assertivo, técnico e direto",
      positioning: dna.positioning || `Especialista em ${dna.niche}`,
      cta,
      contentDNA: dna,
      constraints,
      vetoes,
      evidence,
      confidence,
      slideCount,
      theme,
      themeMode,
      whyThisCarousel,
      createdAt: new Date().toISOString()
    };
  }
}
