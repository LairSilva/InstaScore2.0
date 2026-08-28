/**
 * INSTASCORE OS V14 — QUALITY GATE 2.0
 * Unified multidimensional strategic audit engine that evaluates strategy alignment,
 * originality, brand fit, execution, visual coherence, and contextual profile learnings
 * for both Carousel and Static Post (and Reels).
 */

import { QualityGate2Report, ContentBrief } from "../../types/intelligence";
import { ContentDNA, ContentFormatType } from "../../types/content-engine";
import { DigitalTwin } from "../../core/DigitalTwin";
import { ExpandedContentMemory, isDuplicateOrRepetitive } from "../content/ContentMemoryEngine";

export interface EvaluateQuality2Options {
  contentPayload: any;
  format: ContentFormatType | "carousel" | "static_post";
  dna: ContentDNA;
  brief?: ContentBrief | any | null;
  digitalTwin?: DigitalTwin | null;
  memory?: ExpandedContentMemory | null;
}

export class QualityGate2 {
  /**
   * Deterministic strategic audit and scoring against 5 quality dimensions
   */
  static evaluateContentLocally(options: EvaluateQuality2Options): QualityGate2Report {
    const { contentPayload, format, dna, brief, digitalTwin, memory } = options;
    const issuesFound: string[] = [];

    // Extract textual content for evaluation (cleanly excluding nested metadata/twin/brief)
    const textPieces: string[] = [];
    if (contentPayload.title) textPieces.push(String(contentPayload.title));
    if (contentPayload.coverHeadline) textPieces.push(String(contentPayload.coverHeadline));
    if (contentPayload.coverSubtitle) textPieces.push(String(contentPayload.coverSubtitle));
    if (contentPayload.headline) textPieces.push(String(contentPayload.headline));
    if (contentPayload.hook) textPieces.push(String(contentPayload.hook));
    if (contentPayload.concept) textPieces.push(String(contentPayload.concept));
    if (contentPayload.bodyCopy) textPieces.push(String(contentPayload.bodyCopy));
    if (contentPayload.takeaway) textPieces.push(String(contentPayload.takeaway));
    if (contentPayload.caption) textPieces.push(String(contentPayload.caption));
    if (contentPayload.finalCta) textPieces.push(String(contentPayload.finalCta));
    if (contentPayload.cta) textPieces.push(String(contentPayload.cta));
    if (contentPayload.hookSpoken) textPieces.push(String(contentPayload.hookSpoken));
    if (contentPayload.hookVisual) textPieces.push(String(contentPayload.hookVisual));
    if (Array.isArray(contentPayload.slides)) {
      for (const s of contentPayload.slides) {
        if (s.headline) textPieces.push(String(s.headline));
        if (s.body) textPieces.push(String(s.body));
        if (s.emphasis) textPieces.push(String(s.emphasis));
        if (s.roleLabel) textPieces.push(String(s.roleLabel));
      }
    }
    const contentString = textPieces.join(" ").toLowerCase();

    // 1. STRATEGY ALIGNMENT (0-20 pts)
    let strategyAlignmentScore = 20;

    if (brief?.cagePillar && !contentString.includes(brief.cagePillar.toLowerCase())) {
      // Soft check on strategic theme relevance
      strategyAlignmentScore -= 2;
    }
    if (!dna.targetAudience || dna.targetAudience.length < 4) {
      strategyAlignmentScore -= 3;
      issuesFound.push("Público-alvo pouco definido no contexto.");
    }
    if (brief?.strategicAngle && brief.strategicAngle.length > 5) {
      // Ensure strategic angle was respected
      if (!contentString.includes(brief.strategicAngle.substring(0, 10).toLowerCase())) {
        strategyAlignmentScore -= 1;
      }
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
      "5 dicas para",
      "revolucione seus resultados",
      "fórmula mágica",
      "você precisa saber disso"
    ];

    for (const cliche of genericCliches) {
      if (contentString.includes(cliche)) {
        originalityScore -= 4;
        issuesFound.push(`Expressão ou título genérico/clichê identificado: "${cliche}".`);
      }
    }

    // Memory duplicate check
    if (memory) {
      const hookText =
        contentPayload.headline ||
        contentPayload.coverHeadline ||
        contentPayload.hook ||
        contentPayload.hookSpoken ||
        "";
      const themeText = brief?.theme || "";
      const sim = isDuplicateOrRepetitive(themeText, hookText, memory);
      if (sim.isDuplicate) {
        originalityScore -= 6;
        issuesFound.push(
          `Conteúdo muito semelhante a post anterior (${Math.round(sim.similarityScore * 100)}% de similaridade).`
        );
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
    const toneOfVoice = brief?.toneOfVoice || dna.toneOfVoice || "";
    if (toneOfVoice.toLowerCase().includes("técnico") && contentString.includes("top demais")) {
      brandFitScore -= 4;
      issuesFound.push("Tom de voz desalinhado com a persona profissional.");
    }

    // 4. EXECUTION QUALITY & VISUAL COHERENCE (0-20 pts)
    let executionScore = 20;

    if (format === "carousel") {
      // CAROUSEL QUALITY GATE EVALUATION:
      // - Strategic Alignment, Hook, Narrative Flow, Slide-to-slide progression, Retention, Visual coherence, Readability, CTA
      const slides = contentPayload.slides || [];
      if (slides.length < 4) {
        executionScore -= 6;
        issuesFound.push("Carrossel com pouca densidade (menos de 4 slides).");
      }
      if (!contentPayload.coverHeadline || contentPayload.coverHeadline.length < 8) {
        executionScore -= 5;
        issuesFound.push("Capa do carrossel com gancho fraco ou incompleto.");
      }

      // Slide progression and visual coherence check
      let missingVisualDirection = 0;
      let denseSlides = 0;
      for (const slide of slides) {
        if (!slide.visualDirection || slide.visualDirection.length < 5) {
          missingVisualDirection++;
        }
        if (slide.body && slide.body.length > 350) {
          denseSlides++;
        }
      }
      if (missingVisualDirection > 0) {
        executionScore -= 3;
        issuesFound.push("Slides com direção visual ausente ou incompleta.");
      }
      if (denseSlides > 1) {
        executionScore -= 3;
        issuesFound.push("Alguns slides possuem texto muito longo para carrossel (risco de baixa retenção).");
      }
      if (!contentPayload.finalCta && !contentPayload.caption) {
        executionScore -= 3;
        issuesFound.push("Carrossel sem CTA conclusiva ou legenda.");
      }
    } else if (format === "static_post" || format === "post") {
      // STATIC POST QUALITY GATE EVALUATION:
      // - Strategic Alignment, Immediate Impact, Single Idea Clarity, Visual Hierarchy, Text Density, Readability, CTA appropriateness
      const headline = contentPayload.headline || contentPayload.hook || contentPayload.concept || "";
      const bodyCopy = contentPayload.bodyCopy || contentPayload.concept || "";
      const visualConcept = contentPayload.visualConcept || contentPayload.visualDirection || "";

      if (headline.length < 6) {
        executionScore -= 6;
        issuesFound.push("Post Estático sem Headline de alto impacto.");
      }
      if (bodyCopy.length > 400) {
        executionScore -= 4;
        issuesFound.push("Post Estático com excesso de texto visual (densidade muito alta).");
      }
      if (!visualConcept || visualConcept.length < 8) {
        executionScore -= 4;
        issuesFound.push("Post Estático sem conceito visual e direção de arte definidos.");
      }
      if (!contentPayload.finalCta && !contentPayload.cta && !contentPayload.caption) {
        executionScore -= 3;
        issuesFound.push("Post Estático sem CTA apropriada.");
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
    if (rejectedFormats.includes(format as any)) {
      contextScore -= 10;
      issuesFound.push(`Formato "${format}" está na lista de formatos desaprovados do perfil.`);
    }

    const totalScore = Math.max(
      0,
      Math.min(
        100,
        strategyAlignmentScore + originalityScore + brandFitScore + executionScore + contextScore
      )
    );

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
        ? `Aprovado no Quality Gate 2.0 (${format === "carousel" ? "Carrossel Pro" : "Post Estático Pro"}) com alta retenção e aderência à marca.`
        : `Reprovado no Quality Gate 2.0 (${issuesFound.join("; ")}).`,
      iterationCount: 1
    };
  }
}
