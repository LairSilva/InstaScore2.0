/**
 * INSTASCORE OS V14 — UNIFIED STRATEGY BRIEF ADAPTER
 * The single source of strategic context and brief synthesis for all formats (Carousel, Static Post, Future Reels).
 * Adheres strictly to the mandate: "NÃO DUPLICAR O CÉREBRO".
 */

import { ContentDNA, ContentObjectiveType, CagePillarId } from "../../types/content-engine";
import {
  StrategicContentProductionBrief,
  ContentProductionFormat,
  VisualThemeId
} from "../../types/content-production";
import { DigitalTwin } from "../../core/DigitalTwin";
import { StrategyEngine } from "../intelligence/StrategyEngine";
import { PatternIntelligence } from "../intelligence/PatternIntelligence";
import { ExpandedContentMemory } from "../content/ContentMemoryEngine";

export interface BuildProductionBriefOptions {
  format: ContentProductionFormat;
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  memory?: ExpandedContentMemory | null;
  objective?: ContentObjectiveType;
  theme?: string;
  themeMode?: "strategic_recommendation" | "custom_theme" | "dna_ideation";
  slideCount?: 5 | 7 | 8 | 10 | 12;
  visualTheme?: VisualThemeId;
  customCta?: string;
  strategicAngle?: string;
}

export class UnifiedStrategyBriefAdapter {
  /**
   * Synthesizes the master Strategic Content Brief for either Carousel or Static Post.
   */
  static createBrief(options: BuildProductionBriefOptions): StrategicContentProductionBrief {
    const { format, dna, digitalTwin, memory } = options;

    // 1. Determine Next Best Action from centralized Strategy Engine
    const nextBestAction = StrategyEngine.determineNextBestAction({
      dna,
      digitalTwin,
      memory,
      cageScores: dna.cageScores
    });

    const primaryPillar: CagePillarId = nextBestAction.strategicPillar || "authority";
    const bottleneckScore = dna.cageScores ? dna.cageScores[primaryPillar] : 50;

    // 2. Resolve Objective
    const objective: ContentObjectiveType =
      options.objective || nextBestAction.brief.objective || "authority";

    // 3. Resolve Funnel Stage
    const funnelStage: "topo" | "meio" | "fundo" =
      objective === "growth"
        ? "topo"
        : objective === "conversion" || objective === "sales"
          ? "fundo"
          : "meio";

    // 4. Resolve Slide Count for Carousel
    const slideCount: 5 | 7 | 8 | 10 | 12 =
      options.slideCount || (objective === "growth" ? 5 : objective === "education" ? 10 : 7);

    // 5. Pattern Intelligence for the chosen format
    const formatKey = format === "carousel" ? "carousel" : "post";
    const patterns = PatternIntelligence.getPatternsForContext(dna.niche, objective, formatKey);
    const topPattern = patterns.length > 0 ? patterns[0] : null;

    // 6. Resolve Strategic Angle
    const strategicAngle =
      options.strategicAngle ||
      digitalTwin?.preferences?.preferredAngles?.[0] ||
      topPattern?.angle ||
      (primaryPillar === "conversion"
        ? "Quebra de Objeção Oculta & Contraste Direto"
        : primaryPillar === "growth"
          ? "Contrarian / Anti-Senso Comum de Mercado"
          : "Diagnóstico de Erro Silencioso & Framework Prático");

    // 7. Resolve Theme & Topic
    const themeMode =
      options.themeMode || (options.theme ? "custom_theme" : "strategic_recommendation");
    let theme = options.theme;

    if (!theme) {
      if (format === "carousel") {
        if (objective === "conversion") {
          theme = `${dna.niche}: A objeção invisível que trava 90% das decisões de compra`;
        } else if (objective === "growth") {
          theme = `${dna.niche}: Por que o conselho mais comum do mercado está estagnando seu perfil`;
        } else if (objective === "education") {
          theme = `${dna.niche}: O passo a passo completo para dominar o processo sem tentativa e erro`;
        } else {
          theme = `${dna.niche}: Como evitar o erro invisível que destrói sua autoridade técnica`;
        }
      } else {
        // Static Post format theme
        if (objective === "conversion") {
          theme = `${dna.niche}: A única métrica que realmente define se sua oferta vai converter`;
        } else if (objective === "growth") {
          theme = `${dna.niche}: O erro básico que 99% cometem ao tentar atrair clientes qualificados`;
        } else {
          theme = `${dna.niche}: A virada de chave para se posicionar como autoridade máxima no seu setor`;
        }
      }
    }

    // 8. Resolve Vetoes and Constraints
    const vetoes: string[] = [
      ...(digitalTwin?.preferences?.excludedThemes || []),
      ...(digitalTwin?.preferences?.rejectedStrategies || [])
    ];

    const constraints: string[] = [
      "Zero clichês genéricos (banidas expressões como '5 dicas', 'segredo revelado', 'no mundo de hoje')",
      format === "carousel"
        ? "Cada slide deve possuir papel narrativo único e direção visual específica"
        : "Post Estático deve focar em uma única ideia central com alta densidade de impacto",
      "Copy adaptada ao tom de voz do perfil sem exageros motivacionais vazios",
      `Nicho estrito: ${dna.niche}`,
      `Público-alvo qualificado: ${dna.targetAudience}`
    ];

    // 9. Resolve Hook Strategy & CTA
    const hookStrategy =
      primaryPillar === "growth"
        ? "Quebra de padrão contrária ao senso comum"
        : primaryPillar === "conversion"
          ? "Evidenciação de custo de inação ou oportunidade perdida"
          : "Declaração de autoridade e erro invisível do mercado";

    const cta =
      options.customCta ||
      (objective === "conversion" || objective === "sales"
        ? `Envie uma mensagem direta com a palavra 'DIAGNÓSTICO' para analisarmos seu caso.`
        : objective === "growth"
          ? `Compartilhe com um colega de ${dna.niche} que precisa virar essa chave hoje.`
          : `Salve este post para consultar quando for implementar essa estratégia.`);

    // 10. Visual Theme selection
    const visualTheme: VisualThemeId =
      options.visualTheme ||
      (primaryPillar === "authority"
        ? "dark_editorial"
        : primaryPillar === "conversion"
          ? "bold_contrast"
          : primaryPillar === "expression"
            ? "creator_vibrant"
            : "tech_noir");

    const briefId = `brief_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id: briefId,
      format,
      objective,
      audience: dna.targetAudience || "Profissionais e tomadores de decisão",
      funnelStage,
      primaryPillar,
      bottleneck: nextBestAction.bottleneck,
      nextBestAction: nextBestAction.objective,
      strategicAngle,
      hookStrategy,
      toneOfVoice: dna.toneOfVoice || "Técnico, seguro, direto e sofisticado",
      positioning: dna.positioning || "Referência técnica no nicho",
      cta,
      contentDNA: dna,
      constraints,
      vetoes,
      evidence: [
        `Gargalo C.A.G.E. no pilar ${primaryPillar.toUpperCase()} (score ${bottleneckScore}/100)`,
        `Padrão de nicho ${dna.niche}: ${topPattern?.observedPattern || "Conteúdo opinativo com framework estruturado gera +40% retenção"}`,
        `Objetivo de funil: ${objective.toUpperCase()} (${funnelStage.toUpperCase()})`
      ],
      confidence: nextBestAction.confidence || 88,
      slideCount: format === "carousel" ? slideCount : undefined,
      theme,
      themeMode,
      visualTheme,
      whyThisContent: {
        identifiedBottleneck: nextBestAction.bottleneck,
        bottleneckScore,
        strategicObjective: nextBestAction.objective,
        recommendedStrategy: strategicAngle,
        rationale: nextBestAction.rationale
      },
      createdAt: new Date().toISOString()
    };
  }
}
