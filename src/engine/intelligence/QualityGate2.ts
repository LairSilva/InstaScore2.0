/**
 * INSTASCORE OS V13 — QUALITY GATE 2.0
 * Multidimensional strategic audit engine that evaluates strategy alignment,
 * originality, brand fit, execution, and contextual profile learnings.
 */

import { QualityGate2Report, ContentBrief } from "../../types/intelligence";
import { ContentDNA, ContentFormatType } from "../../types/content-engine";
import { DigitalTwin } from "../../core/DigitalTwin";
import { ExpandedContentMemory, isDuplicateOrRepetitive } from "../content/ContentMemoryEngine";

export interface EvaluateQuality2Options {
  contentPayload: any;
  format: ContentFormatType;
  dna: ContentDNA;
  brief?: ContentBrief | null;
  digitalTwin?: DigitalTwin | null;
  memory?: ExpandedContentMemory | null;
}

export class QualityGate2 {
  /**
   * Deterministic local audit and scoring against 5 quality dimensions
   */
  static evaluateContentLocally(options: EvaluateQuality2Options): QualityGate2Report {
    const { contentPayload, format, dna, brief, digitalTwin, memory } = options;
    const issuesFound: string[] = [];

    // 1. STRATEGY ALIGNMENT (0-20 pts)
    let strategyAlignmentScore = 20;
    const contentString = JSON.stringify(contentPayload).toLowerCase();

    if (brief?.bottleneck && !contentString.includes(brief.cagePillar)) {
      // Soft check on strategic theme relevance
      strategyAlignmentScore -= 2;
    }
    if (!dna.targetAudience || dna.targetAudience.length < 5) {
      strategyAlignmentScore -= 3;
      issuesFound.push("Público-alvo pouco definido no contexto.");
    }

    // 2. ORIGINALITY & ANTI-GENERIC (0-20 pts)
    let originalityScore = 20;
    const genericCliches = [
      "no mundo de hoje",
      "no cenário atual",
      "arraste para o lado para saber mais",
      "salve para não esquecer",
      "dica de ouro",
      "segredo revelado",
      "transforme sua vida",
      "supercharge",
      "5 dicas para melhorar seu instagram",
      "dicas para melhorar",
      "como crescer no instagram",
      "o segredo do sucesso",
      "conteúdo de valor",
      "dicas imperdíveis",
      "5 dicas para"
    ];

    for (const cliche of genericCliches) {
      if (contentString.includes(cliche)) {
        originalityScore -= 5;
        issuesFound.push(`Expressão ou título genérico/clichê identificado: "${cliche}".`);
      }
    }

    // Memory duplicate check
    if (memory) {
      const hookText = contentPayload.headline || contentPayload.coverHeadline || contentPayload.hookSpoken || "";
      const themeText = brief?.theme || "";
      const sim = isDuplicateOrRepetitive(themeText, hookText, memory);
      if (sim.isDuplicate) {
        originalityScore -= 6;
        issuesFound.push(`Conteúdo muito semelhante a post anterior (${Math.round(sim.similarityScore * 100)}% de similaridade).`);
      }
    }

    // 3. BRAND FIT & TONE (0-20 pts)
    let brandFitScore = 20;
    const excludedThemes = digitalTwin?.preferences?.excludedThemes || [];
    for (const excluded of excludedThemes) {
      if (contentString.includes(excluded.toLowerCase())) {
        brandFitScore -= 10;
        issuesFound.push(`Conteúdo aborda tema explicitamente excluído pelo usuário: "${excluded}".`);
      }
    }

    // 4. EXECUTION QUALITY (0-20 pts)
    let executionScore = 20;
    if (format === "carousel") {
      const slides = contentPayload.slides || [];
      if (slides.length < 4) {
        executionScore -= 6;
        issuesFound.push("Carrossel com pouca densidade (menos de 4 slides).");
      }
      if (!contentPayload.coverHeadline || contentPayload.coverHeadline.length < 8) {
        executionScore -= 5;
        issuesFound.push("Capa do carrossel com gancho fraco ou incompleto.");
      }
    } else if (format === "reel") {
      if (!contentPayload.hookSpoken && !contentPayload.hookVisual) {
        executionScore -= 8;
        issuesFound.push("Reel sem gancho claro definido para os primeiros 3 segundos.");
      }
    }

    // 5. CONTEXT & PREFERENCES (0-20 pts)
    let contextScore = 20;
    const rejectedFormats = digitalTwin?.preferences?.rejectedFormats || [];
    if (rejectedFormats.includes(format)) {
      contextScore -= 10;
      issuesFound.push(`Formato "${format}" está na lista de formatos desaprovados do perfil.`);
    }

    const totalScore = Math.max(0, Math.min(100,
      strategyAlignmentScore + originalityScore + brandFitScore + executionScore + contextScore
    ));

    const passed = totalScore >= 75 && issuesFound.length <= 1;

    return {
      passed,
      score: totalScore,
      dimensions: {
        strategyAlignmentScore,
        originalityScore,
        brandFitScore,
        executionScore,
        contextScore
      },
      issuesFound,
      improvementApplied: passed 
        ? "Aprovado no Quality Gate 2.0 com alta diferenciação e alinhamento estratégico."
        : `Reprovado no Quality Gate 2.0 (${issuesFound.join("; ")}).`,
      iterationCount: 1
    };
  }
}
