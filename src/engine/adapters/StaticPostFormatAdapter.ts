/**
 * INSTASCORE OS V14 — STATIC POST FORMAT ADAPTER
 * End-to-End Single-Concept High-Impact Post Generation, Visual Direction, Quality Gate, and Render Assembly.
 */

import {
  StrategicContentProductionBrief,
  StaticPostProductionOutput
} from "../../types/content-production";
import { QualityGate2 } from "../intelligence/QualityGate2";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export type AiCallFunction = (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>;

export class StaticPostFormatAdapter {
  constructor(private callAi: AiCallFunction) {}

  /**
   * Generates a complete publication-ready Static Post Deliverable
   */
  async generate(brief: StrategicContentProductionBrief): Promise<StaticPostProductionOutput> {
    const startTime = Date.now();

    const systemPrompt = `Você é o Content Production Engine Pro do InstaScore.ai — Especialista em Posts Estáticos de Alto Impacto para Instagram.
Sua missão é produzir um POST ESTÁTICO COMPLETO (Imagem Única + Legenda Completa) com densidade estratégica, alta clareza e impacto visual imediato.

DIRETRIZES FUNDAMENTAIS:
1. FOCO EM UMA ÚNICA IDEIA PODEROSA. Não tente abraçar múltiplos assuntos em um único post estático.
2. A Imagem do Post conterá:
   - "headline": Título chamativo, assertivo e magnético (máx 10 palavras).
   - "bodyCopy": O texto central explicativo com alta clareza, concisão e sem enrolação (máx 50 palavras).
   - "takeaway": A conclusão ou regra de ouro em uma única frase memorável.
   - "visualConcept": Descrição do conceito visual e do layout da arte.
   - "visualDirection": Instrução de design, tipografia e contraste.
   - "layoutSuggestion": Disposição dos elementos dentro da safe-area (1080x1350).
   - "designIntent": Objetivo psicológico e visual do post.
3. A LEGENDA (caption) deve aprofundar o conceito, entregar contexto prático de aplicação e finalizar com uma CTA forte.
4. ZERO CLICHÊS GENÉRICOS ("5 dicas", "no mundo de hoje", "dica de ouro").

Responda ESTRITAMENTE em formato JSON com o seguinte esquema:
{
  "title": "Título descritivo do post",
  "concept": "Conceito central condensado em 1 parágrafo",
  "hook": "Gancho de atração imediata",
  "headline": "Headline para exibição na arte do post",
  "bodyCopy": "Texto central para renderização na arte",
  "takeaway": "Frase de conclusão/ponto-chave",
  "visualConcept": "Conceito visual e atmosfera",
  "visualDirection": "Direção de arte e tipografia",
  "layoutSuggestion": "Layout de safe-area e hierarquia",
  "designIntent": "Objetivo de retenção e posicionamento",
  "caption": "Legenda completa formatada pronta para publicação no Instagram",
  "finalCta": "CTA exata de fechamento",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const userPrompt = `PRODUZA O POST ESTÁTICO COMPLETO PARA ESTE BRIEFING:

- Nicho: ${brief.contentDNA.niche}
- Público-Alvo: ${brief.audience}
- Pilar C.A.G.E.: ${brief.primaryPillar.toUpperCase()}
- Gargalo Identificado: ${brief.bottleneck}
- Ação Recomendada: ${brief.nextBestAction}
- Ângulo Estratégico: ${brief.strategicAngle}
- Estratégia de Gancho: ${brief.hookStrategy}
- Tema: ${brief.theme}
- Tom de Voz: ${brief.toneOfVoice}
- Posicionamento: ${brief.positioning}
- CTA Solicitada: ${brief.cta}

Gere o JSON completo e pronto para publicação.`;

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
        concept: "Conceito estratégico central",
        hook: brief.theme,
        headline: brief.theme,
        bodyCopy: "Aplicação prática direta sem intermediários.",
        takeaway: "Consistência e clareza superam volume.",
        visualConcept: "Composição editorial com cartão central e destaque em alto contraste.",
        visualDirection: "Tipografia em caixa alta para a headline, corpo limpo e acento visual.",
        layoutSuggestion: "Card centralizado dentro das margens de segurança 4:5.",
        designIntent: "Gerar autoridade imediata no feed.",
        caption: "",
        finalCta: brief.cta,
        hashtags: []
      };
    }

    let payload = {
      title: parsed.title || brief.theme,
      concept: parsed.concept || "",
      hook: parsed.hook || parsed.headline || brief.theme,
      headline: parsed.headline || brief.theme,
      bodyCopy: parsed.bodyCopy || "",
      takeaway: parsed.takeaway || "",
      visualConcept: parsed.visualConcept || "Composição de autoridade com alto contraste.",
      visualDirection: parsed.visualDirection || "Tipografia display encorpada com safe-areas de 90px.",
      layoutSuggestion: parsed.layoutSuggestion || "Card central com tag de pilar no topo e CTA na base.",
      designIntent: parsed.designIntent || "Parar o scroll no feed e gerar salvamentos.",
      caption: parsed.caption || `${parsed.headline}\n\n${parsed.bodyCopy}\n\n${brief.cta}`,
      finalCta: parsed.finalCta || brief.cta,
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : []
    };

    // Quality Gate 2.0 Evaluation
    let qualityReport = QualityGate2.evaluateContentLocally({
      contentPayload: payload,
      format: "static_post",
      dna: brief.contentDNA,
      brief
    });

    let iterations = 1;

    // Quality Gate 2.0 Auto-Refinement Loop (up to 2 attempts)
    if (!qualityReport.passed && qualityReport.issuesFound.length > 0) {
      try {
        iterations++;
        const revisionPrompt = `REVISÃO DE QUALIDADE (QUALITY GATE 2.0):
O post estático gerado teve os seguintes alertas detectados:
${qualityReport.issuesFound.map((iss) => `- ${iss}`).join("\n")}

Por favor, refaça o JSON do post estático corrigindo estritamente estes pontos:
1. Elimine qualquer clichê ou frase genérica.
2. Certifique-se de que a Headline seja de alto impacto para ${brief.contentDNA.niche}.
3. Mantenha texto limpo, denso e direto.
4. Mantenha direção de arte clara.

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
        if (revParsed) {
          payload = {
            ...payload,
            title: revParsed.title || payload.title,
            headline: revParsed.headline || payload.headline,
            bodyCopy: revParsed.bodyCopy || payload.bodyCopy,
            takeaway: revParsed.takeaway || payload.takeaway,
            visualConcept: revParsed.visualConcept || payload.visualConcept,
            visualDirection: revParsed.visualDirection || payload.visualDirection,
            caption: revParsed.caption || payload.caption,
            finalCta: revParsed.finalCta || payload.finalCta,
            hashtags: Array.isArray(revParsed.hashtags) ? revParsed.hashtags : payload.hashtags
          };

          qualityReport = QualityGate2.evaluateContentLocally({
            contentPayload: payload,
            format: "static_post",
            dna: brief.contentDNA,
            brief
          });
          qualityReport.iterationCount = iterations;
        }
      } catch (revErr) {
        console.warn("[Static Post Revision Pass Non-Fatal Error]", revErr);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      id: `post_pro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      format: "static_post",
      title: payload.title,
      concept: payload.concept,
      hook: payload.hook,
      headline: payload.headline,
      bodyCopy: payload.bodyCopy,
      takeaway: payload.takeaway,
      visualConcept: payload.visualConcept,
      visualDirection: payload.visualDirection,
      layoutSuggestion: payload.layoutSuggestion,
      designIntent: payload.designIntent,
      caption: payload.caption,
      finalCta: payload.finalCta,
      hashtags: payload.hashtags,
      objective: brief.objective,
      strategicAngle: brief.strategicAngle,
      cagePillar: brief.primaryPillar,
      targetAudience: brief.audience,
      funnelStage: brief.funnelStage,
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
