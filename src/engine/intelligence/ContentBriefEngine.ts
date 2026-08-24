/**
 * INSTASCORE OS V13 — CONTENT BRIEF ENGINE
 * Synthesizes standardized, rich strategic briefings between Strategy and Generation.
 * Ensures downstream engines (Carrossel, Reel, Post, Story) execute with strategic precision.
 */

import { ContentBrief } from "../../types/intelligence";
import { ContentDNA, ContentFormatType, ContentObjectiveType, CagePillarId } from "../../types/content-engine";
import { DigitalTwin } from "../../core/DigitalTwin";

export interface BuildBriefOptions {
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  cagePillar?: CagePillarId;
  bottleneck?: string;
  opportunity?: string;
  objective?: ContentObjectiveType;
  format?: ContentFormatType;
  angle?: string;
  theme?: string;
  hook?: string;
  promise?: string;
  funnelStage?: "topo" | "meio" | "fundo";
  strategicReferences?: string[];
  profileLearnings?: string[];
  relevantPatterns?: string[];
  confidence?: number;
}

export class ContentBriefEngine {
  /**
   * Builds a deterministic and rich Content Brief from strategic parameters
   */
  static buildBrief(options: BuildBriefOptions): ContentBrief {
    const { dna, digitalTwin } = options;

    const pillar: CagePillarId = options.cagePillar || "authority";
    const format: ContentFormatType = options.format || (digitalTwin?.preferences?.rejectedFormats?.includes("carousel") ? "post" : "carousel");
    const objective: ContentObjectiveType = options.objective || (pillar === "conversion" ? "conversion" : pillar === "growth" ? "growth" : "authority");
    
    // Funnel stage derivation
    const funnelStage: "topo" | "meio" | "fundo" = options.funnelStage || 
      (objective === "growth" ? "topo" : objective === "conversion" || objective === "sales" ? "fundo" : "meio");

    const bottleneck = options.bottleneck || dna.bottleneckSummary || "Posicionamento genérico e baixa retenção inicial";
    const opportunity = options.opportunity || dna.opportunityHeadline || "Diferenciação técnica e quebra de objeções frequentes";

    // Theme derivation with anti-cliche and niche precision
    const theme = options.theme || `${dna.niche}: Como evitar o erro invisível que destrói resultados`;
    const angle = options.angle || (digitalTwin?.preferences?.preferredAngles?.[0] || "Contrarian / Erros Comuns e Solução Prática");
    
    const hook = options.hook || `Se você atua em ${dna.niche}, pare de cometer este erro antes de postar.`;
    const promise = options.promise || `Entenda o framework exato para corrigir este gargalo e acelerar autoridade real.`;
    
    // Structural guidelines based on format
    let structure = "Hook (0-3s / Capa) -> Contexto Real -> Desconstrução do Erro -> Framework da Solução -> CTA Direta";
    if (format === "carousel") {
      structure = "Slide 1: Capa Magnética com Gancho de Ruptura | Slide 2: O Grande Erro | Slides 3-5: Passo a Passo do Método | Slide 6: Aplicação Prática | Slide 7: CTA para Salvamento/Direct";
    } else if (format === "reel") {
      structure = "Cena 1 (0-3s): Afirmação Contrária na Tela | Cena 2 (3-15s): O Porquê do Método Convencional Falhar | Cena 3 (15-30s): A Alternativa de Alto Impacto | Cena 4: CTA Clara na Legenda";
    } else if (format === "story") {
      structure = "Story 1: Pergunta Provocativa (Enquete) | Story 2: Revelação da Resposta e Argumento de Autoridade | Story 3: CTA com Palavra-Chave no Direct";
    }

    const tone = dna.toneOfVoice || digitalTwin?.identity?.toneOfVoice || "Estratégico, direto, assertivo e sem clichês";
    const emotion = pillar === "conversion" ? "Urgência e Decisão Consciente" : pillar === "authority" ? "Segurança e Clareza Técnica" : "Curiosidade e Revelação";
    
    const cta = pillar === "conversion" 
      ? "Envie 'QUERO' no Direct para receber o direcionamento completo."
      : "Salve este conteúdo para consultar quando for executar sua estratégia.";

    const profileLearnings = options.profileLearnings || 
      (digitalTwin?.learningInsights || []).map(ins => `${ins.insight} (${ins.confidence}% conf.)`).slice(0, 3);

    const relevantPatterns = options.relevantPatterns || [
      `Ganchos que quebram o senso comum elevam salvamentos em até 3x no nicho ${dna.niche}.`
    ];

    return {
      id: `brief-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: theme,
      objective,
      targetAudience: dna.targetAudience || digitalTwin?.identity?.targetAudience || "Público qualificado do nicho",
      funnelStage,
      cagePillar: pillar,
      bottleneck,
      opportunity,
      theme,
      angle,
      hook,
      promise,
      structure,
      tone,
      emotion,
      cta,
      format,
      strategicReferences: options.strategicReferences || [`Pilar C.A.G.E.: ${pillar.toUpperCase()}`, `Nicho: ${dna.niche}`],
      profileLearnings,
      relevantPatterns,
      confidence: options.confidence || 88,
      createdAt: new Date().toISOString()
    };
  }
}
