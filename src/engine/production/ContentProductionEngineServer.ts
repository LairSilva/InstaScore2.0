/**
 * INSTASCORE OS V14 — CONTENT PRODUCTION ENGINE SERVER
 * Master Server Orchestrator for End-to-End Content Production (Carousel Pro + Static Post Pro).
 * Powers the unified brain architecture without duplication.
 */

import {
  StrategicContentProductionBrief,
  CarouselProductionOutput,
  StaticPostProductionOutput,
  ProductionSlide,
  ContentProductionFeedbackInput
} from "../../types/content-production";
import { UnifiedStrategyBriefAdapter, BuildProductionBriefOptions } from "../adapters/UnifiedStrategyBriefAdapter";
import { CarouselFormatAdapter, AiCallFunction } from "../adapters/CarouselFormatAdapter";
import { StaticPostFormatAdapter } from "../adapters/StaticPostFormatAdapter";
import { DigitalTwin } from "../../core/DigitalTwin";
import { ExpandedContentMemory, recordContentInMemory } from "../content/ContentMemoryEngine";
import { FeedbackEngine } from "../intelligence/FeedbackEngine";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export class ContentProductionEngineServer {
  private carouselAdapter: CarouselFormatAdapter;
  private staticPostAdapter: StaticPostFormatAdapter;

  constructor(private callAi: AiCallFunction) {
    this.carouselAdapter = new CarouselFormatAdapter(callAi);
    this.staticPostAdapter = new StaticPostFormatAdapter(callAi);
  }

  /**
   * 1. Prepares a master Strategic Content Production Brief
   */
  prepareBrief(options: BuildProductionBriefOptions): StrategicContentProductionBrief {
    return UnifiedStrategyBriefAdapter.createBrief(options);
  }

  /**
   * 2. Generates complete Strategic Carousel Deliverable
   */
  async generateCarousel(brief: StrategicContentProductionBrief): Promise<CarouselProductionOutput> {
    return this.carouselAdapter.generate(brief);
  }

  /**
   * 3. Generates complete High-Impact Static Post Deliverable
   */
  async generateStaticPost(brief: StrategicContentProductionBrief): Promise<StaticPostProductionOutput> {
    return this.staticPostAdapter.generate(brief);
  }

  /**
   * 4. Regenerate a single slide of a carousel
   */
  async regenerateSlide(
    carousel: CarouselProductionOutput,
    slideNumber: number,
    customInstruction?: string
  ): Promise<ProductionSlide> {
    const existingSlide = carousel.slides.find((s) => s.slideNumber === slideNumber);
    const role = existingSlide?.role || "insight";
    const roleLabel = existingSlide?.roleLabel || `[ SLIDE ${slideNumber} ]`;

    const prompt = `Você é o Content Production Engine Pro do InstaScore.ai.
Sua tarefa é REGENERAR APENAS O SLIDE ${slideNumber} de um carrossel mantendo a coerência narrativa total.

CONTEXTO DO CARROSSEL:
- Nicho: ${carousel.brief.contentDNA.niche}
- Tema: ${carousel.brief.theme}
- Ângulo: ${carousel.strategicAngle}
- Papel Narrativo do Slide ${slideNumber}: ${role.toUpperCase()} (${roleLabel})
- Tom de Voz: ${carousel.brief.toneOfVoice}
${customInstruction ? `- Instrução Específica do Usuário: "${customInstruction}"` : ""}

OUTROS SLIDES PARA COERÊNCIA:
${carousel.slides
  .filter((s) => s.slideNumber !== slideNumber)
  .slice(0, 4)
  .map((s) => `Slide ${s.slideNumber}: ${s.headline}`)
  .join("\n")}

Retorne ESTRITAMENTE em JSON o novo slide:
{
  "slideNumber": ${slideNumber},
  "role": "${role}",
  "roleLabel": "${roleLabel}",
  "headline": "Novo título de alto impacto",
  "body": "Novo texto explicativo e claro para o slide",
  "emphasis": "Ponto de destaque",
  "visualConcept": "Conceito visual atualizado",
  "visualDirection": "Direção de arte",
  "layoutSuggestion": "Disposição do card",
  "designIntent": "Objetivo do slide"
}`;

    const aiRes = await this.callAi({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", temperature: 0.4 }
    });

    let parsed: any;
    try {
      parsed = cleanAndParseJson<any>(aiRes.text);
    } catch {
      parsed = {
        slideNumber,
        role,
        roleLabel,
        headline: `Ponto Estratégico ${slideNumber}`,
        body: "Conteúdo regenerado com clareza e autoridade.",
        emphasis: "Aplicação imediata",
        visualConcept: "Composição editorial com destaque em cartão escuro translúcido.",
        visualDirection: "Tipografia limpa e hierarquia visual.",
        layoutSuggestion: "Card central",
        designIntent: "Retenção"
      };
    }

    return {
      slideNumber,
      role: parsed.role || role,
      roleLabel: parsed.roleLabel || roleLabel,
      headline: parsed.headline || `Ponto Estratégico ${slideNumber}`,
      body: parsed.body || "",
      emphasis: parsed.emphasis || "",
      visualConcept: parsed.visualConcept || "Composição editorial com destaque em cartão escuro translúcido.",
      visualDirection: parsed.visualDirection || "Tipografia limpa e hierarquia visual.",
      layoutSuggestion: parsed.layoutSuggestion || "Card central",
      designIntent: parsed.designIntent || "Retenção"
    };
  }

  /**
   * 5. Regenerate static post with custom instruction
   */
  async regeneratePost(
    post: StaticPostProductionOutput,
    customInstruction?: string
  ): Promise<StaticPostProductionOutput> {
    const updatedBrief = {
      ...post.brief,
      theme: customInstruction ? `${post.brief.theme} (${customInstruction})` : post.brief.theme
    };
    return this.staticPostAdapter.generate(updatedBrief);
  }

  /**
   * 6. Feedback & Learning Loop for Content Production
   */
  processFeedback(
    userId: string,
    content: CarouselProductionOutput | StaticPostProductionOutput,
    feedback: ContentProductionFeedbackInput,
    currentTwin: DigitalTwin | null,
    currentMemory: ExpandedContentMemory | null
  ): { updatedTwin: DigitalTwin | null; updatedMemory: ExpandedContentMemory | null } {
    let memory = currentMemory;

    // Record in memory if rated good/excellent
    if (feedback.rating === "good" || feedback.rating === "excellent") {
      const hookText = (content as any).coverHeadline || (content as any).headline || content.title;
      const baseMemory: ExpandedContentMemory = memory || {
        userId,
        usedThemes: [],
        usedHooks: [],
        usedCtas: [],
        pillarDistribution: { conversion: 0, authority: 0, growth: 0, expression: 0 },
        fingerprints: [],
        lastUpdated: new Date().toISOString()
      };
      memory = recordContentInMemory(
        baseMemory,
        content.brief.theme,
        hookText,
        content.finalCta,
        content.cagePillar
      );
    }

    let updatedTwin = currentTwin;
    if (updatedTwin) {
      const fbResult = FeedbackEngine.applyFeedback(updatedTwin, memory, {
        contentId: content.id,
        title: content.title,
        theme: content.brief?.theme,
        format: content.format === "carousel" ? "carousel" : "post",
        rating: feedback.rating,
        reason:
          feedback.reason === "depth"
            ? "other"
            : feedback.reason === "tone"
              ? "doesnt_represent_brand"
              : "disliked_theme",
        customNote: feedback.customNotes
      });
      updatedTwin = fbResult.updatedTwin;
      memory = fbResult.updatedMemory;
    }

    return { updatedTwin, updatedMemory: memory };
  }
}
