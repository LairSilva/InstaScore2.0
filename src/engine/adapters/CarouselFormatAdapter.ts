/**
 * INSTASCORE OS V14 — CAROUSEL FORMAT ADAPTER
 * End-to-End Carousel Narrative, Copy, Visual Direction, Quality Gate, and Render Assembly.
 */

import {
  StrategicContentProductionBrief,
  CarouselProductionOutput,
  ProductionSlide
} from "../../types/content-production";
import { QualityGate2 } from "../intelligence/QualityGate2";
import { CarouselStructureEngine } from "../carousel/CarouselStructureEngine";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export type AiCallFunction = (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>;

export class CarouselFormatAdapter {
  constructor(private callAi: AiCallFunction) {}

  /**
   * Generates a complete publication-ready Strategic Carousel Deliverable
   */
  async generate(brief: StrategicContentProductionBrief): Promise<CarouselProductionOutput> {
    const startTime = Date.now();
    const slideCount = brief.slideCount || 7;
    const validSlideCount: 5 | 7 | 8 | 10 | 12 = (slideCount === 5 || slideCount === 8 || slideCount === 10 || slideCount === 12) ? slideCount : 7;
    const structure = CarouselStructureEngine.generateNarrativeArc(validSlideCount, brief.objective, brief.funnelStage, brief.strategicAngle);

    const systemPrompt = `Você é o Content Production Engine Pro do InstaScore.ai — Diretor Criativo e Estrategista Sênior de Conteúdo para Instagram.
Sua missão é produzir um CARROSSEL COMPLETO, SLIDE A SLIDE, DE ALTO PADRÃO EDITORIAL E DESIGN PARA INSTAGRAM.

DIRETRIZES FUNDAMENTAIS:
1. NÃO GERE RESUMOS OU PLACEHOLDERS. Escreva a copy exata e completa de cada slide.
2. Cada slide precisa ter:
   - "role": O papel narrativo na estrutura (ex: hook, problem, tension, insight, mechanism, step, proof, cta).
   - "roleLabel": Nome da tag do slide (ex: "[ O DIAGNÓSTICO ]", "[ O MÉTODO ]", "[ AÇÃO ]").
   - "headline": Título chamativo e objetivo do slide (máx 12 palavras).
   - "body": O conteúdo central do slide, estruturado e altamente legível para carrossel.
   - "emphasis": Frase de destaque ou ponto-chave memorável (1 linha).
   - "visualConcept": Descrição exata do elemento visual e mood do slide.
   - "visualDirection": Instrução de layout e diagramação para o designer.
   - "designIntent": O objetivo visual do slide.
3. BANIMENTO ABSOLUTO DE CLICHÊS GENÉRICOS ("5 dicas", "arraste para o lado para saber mais", "no mundo de hoje", "dica de ouro").
4. A Capa (Slide 1) DEVE ter um gancho irresistível, específico para o nicho e público-alvo.
5. O Slide Final DEVE conter uma chamada para ação clara e congruente com o objetivo do funil.
6. A Legenda (caption) deve ser aprofundada, com parágrafos claros, gancho, desenvolvimento e CTA idêntica à do carrossel.

Responda ESTRITAMENTE em formato JSON com o seguinte esquema:
{
  "title": "Título de referência interno do carrossel",
  "coverHeadline": "Gancho principal da capa do carrossel",
  "coverSubtitle": "Subtítulo de apoio da capa",
  "slides": [
    {
      "slideNumber": 1,
      "role": "hook",
      "roleLabel": "[ ALERTA ESTRATÉGICO ]",
      "headline": "...",
      "body": "...",
      "emphasis": "...",
      "visualConcept": "...",
      "visualDirection": "...",
      "layoutSuggestion": "...",
      "designIntent": "..."
    }
  ],
  "caption": "Legenda completa do post pronta para publicação com quebras de linha",
  "finalCta": "CTA exata de encerramento",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const userPrompt = `PRODUZA O CARROSSEL COMPLETO PARA ESTE BRIEFING:

- Nicho: ${brief.contentDNA.niche}
- Público-Alvo: ${brief.audience}
- Pilar C.A.G.E.: ${brief.primaryPillar.toUpperCase()}
- Gargalo Identificado: ${brief.bottleneck}
- Ação Recomendada: ${brief.nextBestAction}
- Ângulo Estratégico: ${brief.strategicAngle}
- Estratégia de Gancho: ${brief.hookStrategy}
- Tema: ${brief.theme}
- Tom de Voz: ${brief.toneOfVoice}
- Quantidade Exata de Slides: ${validSlideCount}
- CTA Solicitada: ${brief.cta}

ESTRUTURA NARRATIVA OBRIGATÓRIA DOS SLIDES:
${structure.map((s) => `Slide ${s.slideNumber} (${s.role.toUpperCase()} - ${s.roleLabel}): ${s.narrativeGoal}`).join("\n")}

Gere exatamente ${validSlideCount} slides em JSON.`;

    const aiRes = await this.callAi({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.35
      }
    });

    let parsed: any;
    try {
      parsed = cleanAndParseJson<any>(aiRes.text);
    } catch {
      parsed = {
        title: brief.theme,
        coverHeadline: brief.theme,
        coverSubtitle: "Framework Estratégico",
        slides: [],
        caption: "",
        finalCta: brief.cta,
        hashtags: []
      };
    }

    // Normalize slides
    const slides: ProductionSlide[] = (parsed.slides || []).map((s: any, idx: number) => {
      const fallbackStructure = structure[idx] || structure[0];
      return {
        slideNumber: typeof s.slideNumber === "number" ? s.slideNumber : idx + 1,
        role: s.role || fallbackStructure.role,
        roleLabel: s.roleLabel || `[ ETAPA ${idx + 1} ]`,
        headline: s.headline || `Ponto ${idx + 1}`,
        body: s.body || "",
        emphasis: s.emphasis || "",
        visualConcept: s.visualConcept || "Composição editorial com destaque em cartão escuro translúcido.",
        visualDirection: s.visualDirection || "Foco na tipografia limpa, hierarquia visual e acento sutil.",
        layoutSuggestion: s.layoutSuggestion || "Card centralizado com safe-area respeitada.",
        designIntent: s.designIntent || "Reter a atenção do leitor e conduzir ao próximo slide."
      };
    });

    // Ensure slides count matches requested count
    while (slides.length < slideCount) {
      const idx = slides.length;
      const sStruct = structure[idx] || structure[0];
      slides.push({
        slideNumber: idx + 1,
        role: sStruct.role,
        roleLabel: `[ SLIDE ${idx + 1} ]`,
        headline: `${brief.strategicAngle} — Parte ${idx + 1}`,
        body: `Desenvolvimento prático e acionável do ponto ${idx + 1}.`,
        emphasis: "Aplicação imediata",
        visualConcept: "Composição editorial de alto contraste",
        visualDirection: "Tipografia hierarquizada e espaçamento equilibrado.",
        layoutSuggestion: "Card central",
        designIntent: "Retenção"
      });
    }

    let payload = {
      title: parsed.title || brief.theme,
      coverHeadline: parsed.coverHeadline || (slides[0] ? slides[0].headline : brief.theme),
      coverSubtitle: parsed.coverSubtitle || "Estratégia InstaScore Pro",
      objective: brief.objective,
      strategicAngle: brief.strategicAngle,
      cagePillar: brief.primaryPillar,
      targetAudience: brief.audience,
      funnelStage: brief.funnelStage,
      finalCta: parsed.finalCta || brief.cta,
      caption: parsed.caption || `${parsed.coverHeadline}\n\n${slides.map(s => `▸ ${s.headline}`).join('\n')}\n\n${brief.cta}`,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      slides,
      brief
    };

    // Quality Gate 2.0 Evaluation
    let qualityReport = QualityGate2.evaluateContentLocally({
      contentPayload: payload,
      format: "carousel",
      dna: brief.contentDNA,
      brief
    });

    let iterations = 1;

    // Quality Gate 2.0 Auto-Refinement Loop (up to 2 attempts)
    if (!qualityReport.passed && qualityReport.issuesFound.length > 0) {
      try {
        iterations++;
        const revisionPrompt = `REVISÃO DE QUALIDADE (QUALITY GATE 2.0):
O carrossel gerado teve os seguintes alertas detectados:
${qualityReport.issuesFound.map((iss) => `- ${iss}`).join("\n")}

Por favor, refaça o JSON do carrossel corrigindo estritamente estes pontos:
1. Elimine qualquer clichê ou frase genérica.
2. Certifique-se de que a capa (Slide 1) tenha gancho forte e provocativo para ${brief.contentDNA.niche}.
3. Mantenha exatamente ${validSlideCount} slides com descrições visuais completas e layout limpo.
4. Mantenha tom profissional e autoridade técnica.

Retorne o JSON corrigido:`;

        const revisionRes = await this.callAi({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\n${revisionPrompt}` }] }
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        });

        const revParsed = cleanAndParseJson<any>(revisionRes.text);
        if (revParsed && Array.isArray(revParsed.slides) && revParsed.slides.length > 0) {
          const revisedSlides: ProductionSlide[] = revParsed.slides.map((s: any, idx: number) => {
            const fallbackStructure = structure[idx] || structure[0];
            return {
              slideNumber: typeof s.slideNumber === "number" ? s.slideNumber : idx + 1,
              role: s.role || fallbackStructure.role,
              roleLabel: s.roleLabel || `[ ETAPA ${idx + 1} ]`,
              headline: s.headline || `Ponto ${idx + 1}`,
              body: s.body || "",
              emphasis: s.emphasis || "",
              visualConcept: s.visualConcept || "Composição editorial com destaque em cartão escuro translúcido.",
              visualDirection: s.visualDirection || "Foco na tipografia limpa, hierarquia visual e acento sutil.",
              layoutSuggestion: s.layoutSuggestion || "Card centralizado com safe-area respeitada.",
              designIntent: s.designIntent || "Reter a atenção do leitor e conduzir ao próximo slide."
            };
          });

          while (revisedSlides.length < validSlideCount) {
            const idx = revisedSlides.length;
            const sStruct = structure[idx] || structure[0];
            revisedSlides.push({
              slideNumber: idx + 1,
              role: sStruct.role,
              roleLabel: `[ SLIDE ${idx + 1} ]`,
              headline: `${brief.strategicAngle} — Parte ${idx + 1}`,
              body: `Desenvolvimento prático e acionável do ponto ${idx + 1}.`,
              emphasis: "Aplicação imediata",
              visualConcept: "Composição editorial de alto contraste",
              visualDirection: "Tipografia hierarquizada e espaçamento equilibrado.",
              layoutSuggestion: "Card central",
              designIntent: "Retenção"
            });
          }

          payload = {
            ...payload,
            title: revParsed.title || payload.title,
            coverHeadline: revParsed.coverHeadline || revisedSlides[0]?.headline || payload.coverHeadline,
            coverSubtitle: revParsed.coverSubtitle || payload.coverSubtitle,
            caption: revParsed.caption || payload.caption,
            finalCta: revParsed.finalCta || payload.finalCta,
            hashtags: Array.isArray(revParsed.hashtags) ? revParsed.hashtags : payload.hashtags,
            slides: revisedSlides
          };

          qualityReport = QualityGate2.evaluateContentLocally({
            contentPayload: payload,
            format: "carousel",
            dna: brief.contentDNA,
            brief
          });
          qualityReport.iterationCount = iterations;
        }
      } catch (revErr) {
        console.warn("[Carousel Revision Pass Non-Fatal Error]", revErr);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      id: `carousel_pro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      format: "carousel",
      title: payload.title,
      coverHeadline: payload.coverHeadline,
      coverSubtitle: payload.coverSubtitle,
      objective: brief.objective,
      strategicAngle: brief.strategicAngle,
      cagePillar: brief.primaryPillar,
      targetAudience: brief.audience,
      funnelStage: brief.funnelStage,
      finalCta: payload.finalCta,
      caption: payload.caption,
      hashtags: payload.hashtags,
      slides: payload.slides,
      theme: brief.visualTheme || "dark_editorial",
      brief,
      qualityReport,
      generationMeta: {
        modelUsed: aiRes.modelUsed || "gemini-2.5-flash",
        durationMs,
        iterations,
        createdAt: new Date().toISOString()
      }
    };
  }
}
