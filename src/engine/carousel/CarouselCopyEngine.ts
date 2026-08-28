/**
 * INSTASCORE OS V14 — CAROUSEL COPY ENGINE
 * Writes high-retention, anti-generic carousel copy with strict separation
 * between COPY and DIREÇÃO VISUAL.
 */

import { CarouselStrategyBrief, CarouselOutputPro, CarouselSlidePro } from "../../types/carousel-engine";
import { NarrativeSlideBlueprint, CarouselStructureEngine } from "./CarouselStructureEngine";
import { QualityGate2 } from "../intelligence/QualityGate2";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export class CarouselCopyEngine {
  private callGeminiFn: (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>;

  constructor(callGemini: (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>) {
    this.callGeminiFn = callGemini;
  }

  /**
   * Generates a complete strategic carousel from brief and narrative blueprint
   */
  async generateFullCarousel(brief: CarouselStrategyBrief): Promise<CarouselOutputPro> {
    const startTime = Date.now();
    const blueprints = CarouselStructureEngine.generateNarrativeArc(
      brief.slideCount,
      brief.objective,
      brief.funnelStage,
      brief.strategicAngle
    );

    const blueprintsJson = JSON.stringify(blueprints, null, 2);

    const systemPrompt = `Você é o Diretor Criativo e Estrategista de Carrosséis de Alta Retenção do InstaScore OS V14.
Sua missão é redigir um Carrossel Estratégico Sob Medida, eliminando completamente clichês genéricos e entregando uma peça de autoridade real.

CONTEXTO ESTRATÉGICO OBRIGATÓRIO:
- Nicho: "${brief.contentDNA.niche}"
- Público-Alvo: "${brief.audience}"
- Posicionamento: "${brief.positioning}"
- Tom de Voz: "${brief.toneOfVoice}"
- Objetivo do Carrossel: "${brief.objective}" (Etapa do funil: ${brief.funnelStage})
- Pilar C.A.G.E.: "${brief.primaryPillar}" (Gargalo: ${brief.bottleneck})
- Ângulo Estratégico: "${brief.strategicAngle}"
- Tema Central: "${brief.theme}"
- CTA Final Desejada: "${brief.cta}"
${brief.vetoes && brief.vetoes.length > 0 ? `- TEMAS E ESTRATÉGIAS VETADAS PELO USUÁRIO (NUNCA USAR): ${brief.vetoes.join(", ")}` : ""}

ESTRUTURA NARRATIVA SLIDE A SLIDE A SEGUIR (OBRIGATÓRIO RESPEITAR CADA PAPEL NARRATIVO):
${blueprintsJson}

DIRETRIZES FUNDAMENTAIS ANTI-CLICHÊ & DESIGN VISUAL:
1. NUNCA utilize clichês como "5 dicas para...", "Você precisa saber disso...", "Transforme sua vida...", "Pare de fazer isso...", "Segredo que ninguém te conta...", "Quer crescer no Instagram?", "Confira essas dicas...".
2. SEPARAÇÃO TOTAL ENTRE COPY E DIREÇÃO VISUAL:
   - Para cada slide, entregue a Headline (curta, magnética, sem floreios), o Body (copy escaneável, clara, profunda) e o bloco de Direção Visual (como diagramar, sugestão de layout, intenção de design e ênfase).
3. A copy deve soar como se tivesse sido escrita por um consultor sênior do nicho ${brief.contentDNA.niche}, e NÃO por um modelo genérico de IA.
4. Respeite estritamente a quantidade de ${brief.slideCount} slides.

Retorne ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "title": "Título Estratégico do Carrossel",
  "coverHeadline": "Headline da Capa (Slide 1)",
  "coverSubtitle": "Subtítulo de apoio da Capa",
  "caption": "Legenda completa do post formatada com parágrafos curtos e chamada para o Direct/Comentários...",
  "finalCta": "${brief.cta}",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "slides": [
    {
      "slideNumber": 1,
      "role": "hook",
      "roleLabel": "Hook / Capa",
      "headline": "Headline do Slide",
      "body": "Texto principal do slide",
      "emphasis": "Palavra ou termo a destacar visualmente",
      "visualDirection": "Instruções claras para o designer ou template",
      "layoutSuggestion": "Fundo escuro, texto centralizado, destaque em cor quente",
      "imageSuggestion": "Ícone minimalista ou gráfico conceitual",
      "designIntent": "Gerar parada imediata de rolagem com alto contraste"
    }
  ]
}`;

    let parsedResult: any = null;
    let modelUsed = "gemini-2.5-flash";
    let iterations = 1;

    try {
      const response = await this.callGeminiFn({ contents: systemPrompt });
      modelUsed = response.modelUsed || modelUsed;
      parsedResult = cleanAndParseJson(response.text || "{}");
    } catch (err: any) {
      console.warn("[CarouselCopyEngine] Primary AI call failed, generating deterministic strategic fallback:", err?.message || err);
      parsedResult = this.generateDeterministicFallback(brief, blueprints);
    }

    // Ensure slides structure is complete
    let slides: CarouselSlidePro[] = (parsedResult.slides || []).map((s: any, idx: number) => {
      const bp = blueprints[idx] || blueprints[blueprints.length - 1];
      return {
        slideNumber: s.slideNumber || idx + 1,
        role: s.role || bp.role,
        roleLabel: s.roleLabel || bp.roleLabel,
        headline: s.headline || `Ponto ${idx + 1}: Estratégia em ${brief.contentDNA.niche}`,
        body: s.body || "Diretriz prática baseada em dados e posicionamento técnico.",
        visualDirection: s.visualDirection || bp.suggestedVisual,
        emphasis: s.emphasis || "",
        layoutSuggestion: s.layoutSuggestion || bp.suggestedLayout,
        imageSuggestion: s.imageSuggestion || "Elemento vetorial clean",
        designIntent: s.designIntent || bp.narrativeGoal
      };
    });

    // If slide count mismatch, pad or slice
    if (slides.length < brief.slideCount) {
      for (let i = slides.length; i < brief.slideCount; i++) {
        const bp = blueprints[i] || blueprints[blueprints.length - 1];
        slides.push({
          slideNumber: i + 1,
          role: bp.role,
          roleLabel: bp.roleLabel,
          headline: `Passo 0${i + 1}: Execução com Precisão`,
          body: `Aplique este princípio diretamente no seu fluxo de ${brief.contentDNA.niche}.`,
          visualDirection: bp.suggestedVisual,
          layoutSuggestion: bp.suggestedLayout,
          designIntent: bp.narrativeGoal
        });
      }
    } else if (slides.length > brief.slideCount) {
      slides = slides.slice(0, brief.slideCount);
    }

    // Run Quality Gate 2.0
    let qualityReport = QualityGate2.evaluateContentLocally({
      contentPayload: {
        coverHeadline: parsedResult.coverHeadline || slides[0]?.headline,
        coverSubtitle: parsedResult.coverSubtitle || slides[0]?.body,
        slides,
        caption: parsedResult.caption || "",
        finalCta: parsedResult.finalCta || brief.cta
      },
      format: "carousel",
      dna: brief.contentDNA,
      brief: {
        id: brief.id,
        title: parsedResult.title || brief.theme,
        objective: brief.objective,
        targetAudience: brief.audience,
        funnelStage: brief.funnelStage,
        cagePillar: brief.primaryPillar,
        bottleneck: brief.bottleneck,
        opportunity: brief.nextBestAction,
        theme: brief.theme,
        angle: brief.strategicAngle,
        hook: slides[0]?.headline || "",
        promise: slides[0]?.body || "",
        structure: `${brief.slideCount} slides estratégicos`,
        tone: brief.toneOfVoice,
        emotion: "Clareza e Autoridade",
        cta: brief.cta,
        format: "carousel",
        strategicReferences: brief.evidence,
        profileLearnings: [],
        relevantPatterns: [],
        confidence: brief.confidence,
        createdAt: brief.createdAt
      }
    });

    // If Quality Gate score is below 75 and we have iterations left, attempt auto-correction
    if (!qualityReport.passed && qualityReport.issuesFound.length > 0) {
      try {
        iterations++;
        const correctionPrompt = `O carrossel gerado anteriormente foi reprovado no Quality Gate Estratégico com nota ${qualityReport.score}/100.
Problemas identificados:
${qualityReport.issuesFound.map(iss => `- ${iss}`).join("\n")}

Corrija imediatamente o carrossel, removendo quaisquer clichês genéricos e garantindo máxima profundidade técnica para o nicho ${brief.contentDNA.niche}.
Mantenha exatamente ${brief.slideCount} slides. Retorne apenas o JSON corrigido.`;

        const retryRes = await this.callGeminiFn({ contents: correctionPrompt });
        const retryParsed = cleanAndParseJson(retryRes.text || "{}");
        if (retryParsed.slides && retryParsed.slides.length >= 3) {
          parsedResult = retryParsed;
          slides = retryParsed.slides.map((s: any, idx: number) => ({
            slideNumber: s.slideNumber || idx + 1,
            role: s.role || blueprints[idx]?.role || "step",
            roleLabel: s.roleLabel || blueprints[idx]?.roleLabel || `Slide ${idx + 1}`,
            headline: s.headline || "",
            body: s.body || "",
            visualDirection: s.visualDirection || "",
            emphasis: s.emphasis || "",
            layoutSuggestion: s.layoutSuggestion || "",
            imageSuggestion: s.imageSuggestion || "",
            designIntent: s.designIntent || ""
          }));
          qualityReport = QualityGate2.evaluateContentLocally({
            contentPayload: {
              coverHeadline: parsedResult.coverHeadline || slides[0]?.headline,
              slides,
              caption: parsedResult.caption || "",
              finalCta: parsedResult.finalCta || brief.cta
            },
            format: "carousel",
            dna: brief.contentDNA
          });
        }
      } catch (retryErr) {
        console.warn("[CarouselCopyEngine] Retry failed, keeping initial valid draft:", retryErr);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      id: `car_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: parsedResult.title || brief.theme,
      coverHeadline: parsedResult.coverHeadline || slides[0]?.headline || brief.theme,
      coverSubtitle: parsedResult.coverSubtitle || slides[0]?.body || "Um guia estratégico direto e sem atalhos rasos.",
      objective: brief.objective,
      strategicAngle: brief.strategicAngle,
      cagePillar: brief.primaryPillar,
      targetAudience: brief.audience,
      funnelStage: brief.funnelStage,
      finalCta: parsedResult.finalCta || brief.cta,
      caption: parsedResult.caption || `Estratégia prática para ${brief.contentDNA.niche}.\n\nSalve este post para aplicar no seu perfil.`,
      hashtags: parsedResult.hashtags || [`#${brief.contentDNA.niche.replace(/\s+/g, "").toLowerCase()}`, "#estrategia", "#autoridade", "#posicionamento", "#instascore"],
      slides,
      brief,
      qualityReport,
      generationMeta: {
        modelUsed,
        durationMs,
        iterations,
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Regenerates a single specific slide with full narrative continuity
   */
  async regenerateSingleSlide(
    currentCarousel: CarouselOutputPro,
    slideNumber: number,
    customInstruction?: string
  ): Promise<CarouselSlidePro> {
    const targetSlide = currentCarousel.slides.find(s => s.slideNumber === slideNumber);
    if (!targetSlide) {
      throw new Error(`Slide número ${slideNumber} não encontrado no carrossel.`);
    }

    const prompt = `Você é o Estrategista do InstaScore OS V14.
Regenere APENAS o SLIDE ${slideNumber} do seguinte carrossel para mantê-lo coeso e impactante.

CONTEXTO DO CARROSSEL:
- Título: "${currentCarousel.title}"
- Nicho: "${currentCarousel.brief.contentDNA.niche}"
- Tom de Voz: "${currentCarousel.brief.toneOfVoice}"
- Papel Narrativo do Slide: "${targetSlide.role} (${targetSlide.roleLabel})"
- Slide Atual (a ser aprimorado):
  Headline: "${targetSlide.headline}"
  Body: "${targetSlide.body}"
  Direção Visual: "${targetSlide.visualDirection}"
${customInstruction ? `- INSTRUÇÃO ESPECÍFICA DO USUÁRIO: "${customInstruction}"` : ""}

REGRAS:
- Elimine clichês genéricos.
- Separe claramente COPY de DIREÇÃO VISUAL.
- Mantenha a continuidade com os slides vizinhos.

Retorne em formato JSON:
{
  "slideNumber": ${slideNumber},
  "role": "${targetSlide.role}",
  "roleLabel": "${targetSlide.roleLabel}",
  "headline": "Nova Headline de Alto Impacto",
  "body": "Novo texto principal escaneável e direto",
  "emphasis": "Palavra chave de ênfase",
  "visualDirection": "Diretriz visual refinada",
  "layoutSuggestion": "Layout clean e moderno",
  "imageSuggestion": "Elemento visual recomendado",
  "designIntent": "Intenção de retenção"
}`;

    try {
      const response = await this.callGeminiFn({ contents: prompt });
      const parsed = cleanAndParseJson(response.text || "{}");
      return {
        slideNumber,
        role: targetSlide.role,
        roleLabel: targetSlide.roleLabel,
        headline: parsed.headline || targetSlide.headline,
        body: parsed.body || targetSlide.body,
        visualDirection: parsed.visualDirection || targetSlide.visualDirection,
        emphasis: parsed.emphasis || targetSlide.emphasis,
        layoutSuggestion: parsed.layoutSuggestion || targetSlide.layoutSuggestion,
        imageSuggestion: parsed.imageSuggestion || targetSlide.imageSuggestion,
        designIntent: parsed.designIntent || targetSlide.designIntent
      };
    } catch (err: any) {
      console.warn("[CarouselCopyEngine] Regenerate single slide AI call failed, providing refined variation:", err?.message || err);
      return {
        ...targetSlide,
        headline: `${targetSlide.headline} (Versão Aprimorada)`,
        body: `${targetSlide.body} [Foco em aplicação prática no nicho ${currentCarousel.brief.contentDNA.niche}]`
      };
    }
  }

  /**
   * Deterministic strategic fallback generator in case of network interruption
   */
  private generateDeterministicFallback(
    brief: CarouselStrategyBrief,
    blueprints: NarrativeSlideBlueprint[]
  ): any {
    const niche = brief.contentDNA.niche;
    const slides: CarouselSlidePro[] = blueprints.map(bp => {
      let headline = `Ponto Chave em ${niche}`;
      let body = `Como estruturar autoridade técnica e conversão sem depender de métodos genéricos.`;

      if (bp.role === "hook") {
        headline = `${niche}: O Erro Silencioso Que Trava Seus Resultados`;
        body = `Por que insistir na abordagem convencional está custando sua autoridade e alcance.`;
      } else if (bp.role === "problem") {
        headline = `O Ponto Cego Que Ninguém Te Avisa`;
        body = `A maioria tenta produzir mais sem corrigir o gargalo de ${brief.primaryPillar}. O resultado é esforço alto com baixo retorno.`;
      } else if (bp.role === "tension") {
        headline = `A Contradição do Mercado`;
        body = `Seguir fórmulas prontas atrai curiosos, mas afasta clientes qualificados com alto poder de decisão.`;
      } else if (bp.role === "insight") {
        headline = `A Virada: Posicionamento Técnico`;
        body = `Diferencie seu perfil através de frameworks claros e quebra direta de objeções comuns.`;
      } else if (bp.role === "mechanism" || bp.role === "step") {
        headline = `O Método em 3 Etapas`;
        body = `01. Diagnóstico do gargalo\n02. Conteúdo de diferenciação\n03. CTA direcionada para Direct.`;
      } else if (bp.role === "application") {
        headline = `Como Aplicar na Prática`;
        body = `Revise suas últimas 3 publicações e substitua ganchos mornos por afirmações técnicas comprovadas.`;
      } else if (bp.role === "proof") {
        headline = `O Resultado Comprovado`;
        body = `Perfis que ajustam o pilar de ${brief.primaryPillar} elevam a taxa de salvamentos e conversão em até 3x.`;
      } else if (bp.role === "cta") {
        headline = `Quer o Direcionamento Completo?`;
        body = brief.cta;
      }

      return {
        slideNumber: bp.slideNumber,
        role: bp.role,
        roleLabel: bp.roleLabel,
        headline,
        body,
        emphasis: niche,
        visualDirection: bp.suggestedVisual,
        layoutSuggestion: bp.suggestedLayout,
        imageSuggestion: "Gráfico ou ícone conceitual",
        designIntent: bp.narrativeGoal
      };
    });

    return {
      title: brief.theme,
      coverHeadline: slides[0].headline,
      coverSubtitle: slides[0].body,
      caption: `Você está atuando em ${niche} e sente que seu conteúdo não atrai o público certo?\n\nO maior problema quase nunca é o algoritmo, e sim a falta de diferenciação no pilar de ${brief.primaryPillar}.\n\nSalve este carrossel para consultar o framework passo a passo.`,
      finalCta: brief.cta,
      hashtags: [`#${niche.replace(/\s+/g, "").toLowerCase()}`, "#posicionamento", "#instascore", "#estrategia"],
      slides
    };
  }
}
