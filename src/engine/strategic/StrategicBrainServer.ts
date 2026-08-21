import { GoogleGenAI, Type } from "@google/genai";
import { 
  ProfileDNA, 
  PositioningReport, 
  ProfileClarityScore, 
  BioStrategyReport, 
  NameStrategyRecommendation,
  ContentPillar,
  ContentAngle,
  StrategicContentItem,
  QualityGateReport,
  StrategicAngleType
} from "../../types/strategic-brain";
import { AI_MODEL_ROUTER } from "../../config/ai";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export class StrategicBrainServer {
  /**
   * 1. STRATEGIC POSITIONING ENGINE & CLARITY SCORE
   */
  static async generatePositioningAndClarity(
    ai: GoogleGenAI,
    profileContext: {
      username: string;
      account_name?: string;
      niche: string;
      subniche?: string;
      currentBio?: string;
      goal?: string;
      diagnosisScore?: number;
      criticalGaps?: string[];
      strengths?: string[];
    }
  ): Promise<{
    positioningReport: PositioningReport;
    clarityScore: ProfileClarityScore;
    contentDistribution: {
      autoridade: number;
      descoberta: number;
      prova: number;
      relacionamento: number;
      conversao: number;
    };
  }> {
    const prompt = `Você é o Diretor Chefe de Estratégia de Mídia Social (AI Social Media Strategist) do InstaScore OS V12.
Sua missão é diagnosticar o posicionamento e determinar com precisão cirúrgica a identidade estratégica do seguinte perfil:

DADOS DO PERFIL:
- Usuário: ${profileContext.username}
- Nome: ${profileContext.account_name || profileContext.username}
- Nicho Declarado: ${profileContext.niche}
- Subnicho/Foco Informado: ${profileContext.subniche || "Não especificado"}
- Bio Atual: ${profileContext.currentBio || "Sem bio informada"}
- Objetivo Primário: ${profileContext.goal || "Vendas e Autoridade"}
- Score Atual no Diagnóstico: ${profileContext.diagnosisScore || 65}/100
- Gargalos Críticos: ${profileContext.criticalGaps?.join("; ") || "Posicionamento genérico, falta de retenção"}
- Pontos Fortes: ${profileContext.strengths?.join("; ") || "Expertise técnica no tema"}

DIRETRIZES FUNDAMENTAIS DE POSICIONAMENTO:
1. NUNCA aceite posicionamentos amplos demais como resposta final (ex: "Marketing", "Nutrição", "Advocacia"). 
   Você DEVE fazer um aprofundamento vertical rigoroso até um microsegmento acionável (ex: "Marketing" -> "Instagram" -> "Instagram para pequenos negócios" -> "Instagram para pequenos negócios locais prestadores de serviço").
2. Identifique o VERDADEIRO gargalo estratégico. Se o problema é posicionamento confuso ou promessa rasa, não diga para postar mais vezes. Priorize clareza e diferenciação.
3. Não use clichês como "ajudo pessoas a realizarem sonhos". A promessa recomendada deve ser tangível e com mecanismo claro.
4. Calcule o Profile Clarity Score (0 a 100) em 8 dimensões obrigatórias.

Retorne APENAS um JSON válido seguindo a estrutura exata:
{
  "positioningReport": {
    "current_niche": string,
    "subniche": string,
    "microsegment": string,
    "audience": string,
    "core_problem": string,
    "core_desire": string,
    "transformation": string,
    "perceived_differentiator": string,
    "positioning_bottleneck": string,
    "strategic_opportunity": string,
    "recommended_positioning": string,
    "rationale": string,
    "anti_broad_analysis": {
      "broad_term": string,
      "drilldown_path": string[],
      "selected_depth": string
    }
  },
  "clarityScore": {
    "overall_score": number,
    "dimensions": {
      "positioning": number,
      "audience_clarity": number,
      "value_proposition": number,
      "differentiation": number,
      "authority": number,
      "bio": number,
      "content": number,
      "strategic_consistency": number
    },
    "biggest_bottleneck": string,
    "second_opportunity": string,
    "priority_recommendation": string
  },
  "contentDistribution": {
    "autoridade": number,
    "descoberta": number,
    "prova": number,
    "relacionamento": number,
    "conversao": number
  }
}`;

    const modelName = AI_MODEL_ROUTER.primaryModel;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    try {
      const parsed = cleanAndParseJson(text);
      return parsed;
    } catch (err) {
      console.error("[StrategicBrainServer] Error parsing positioning response:", text);
      throw new Error("Falha ao estruturar relatório de posicionamento estratégico.");
    }
  }

  /**
   * 2. BIO STRATEGY ENGINE
   */
  static async generateBioStrategy(
    ai: GoogleGenAI,
    dna: Partial<ProfileDNA> & { username: string; currentBio?: string }
  ): Promise<BioStrategyReport> {
    const prompt = `Você é o Estrategista Especialista em Conversão e Bio de Alto Impacto do InstaScore V12.
Reconstrua a bio do perfil @${dna.username} com base no seu DNA Estratégico.

DNA ESTRATÉGICO DO PERFIL:
- Nicho: ${dna.niche || "Negócios"}
- Subnicho: ${dna.subniche || "Serviços Especializados"}
- Microsegmento: ${dna.microsegment || "Atendimento Direto"}
- Público-Alvo: ${dna.target_audience || "Clientes qualificados"}
- Dor Central: ${dna.audience_pain || "Falta de resultados práticos"}
- Desejo Central: ${dna.audience_desire || "Previsibilidade e crescimento"}
- Transformação / Promessa: ${dna.transformation || "Transformação tangível"}
- Diferencial: ${dna.differentiator || "Abordagem baseada em dados e prática"}
- Bio Atual: ${dna.currentBio || "Sem bio informada"}

REGRAS DE CONSTRUÇÃO DE BIO:
1. BANIMENTO TOTAL DE CLICHÊS VAZIOS (ex: "ajudando você a voar alto", "apaixonado por pessoas").
2. Gere 3 versões altamente estratégicas:
   - 1. AUTORIDADE (Foco em credenciais, método, dados, posicionamento inquestionável)
   - 2. CONVERSÃO (Foco direto na dor/desejo, oferta clara e CTA de ação imediata)
   - 3. PERSONALIDADE (Foco em conexão rápida, tom autêntico, quebra de padrão e diferenciação)
3. Cada versão deve conter as linhas exatas (máx 150 caracteres somados), explicação de por que funciona, objetivo estratégico, ponto forte e possível limitação.

Retorne APENAS um JSON válido:
{
  "evaluation": {
    "clarity_score": number,
    "audience_score": number,
    "transformation_score": number,
    "differentiation_score": number,
    "proof_score": number,
    "cta_score": number,
    "overall_assessment": string
  },
  "options": [
    {
      "type": "authority",
      "label": "Versão 1: Autoridade & Posicionamento Sólido",
      "bio_lines": ["linha 1", "linha 2", "linha 3", "linha 4 (CTA)"],
      "formatted_bio": string,
      "why_it_works": string,
      "strategic_goal": string,
      "strong_point": string,
      "limitation": string
    },
    {
      "type": "conversion",
      "label": "Versão 2: Foco em Conversão & Vendas Diretas",
      "bio_lines": ["linha 1", "linha 2", "linha 3", "linha 4 (CTA)"],
      "formatted_bio": string,
      "why_it_works": string,
      "strategic_goal": string,
      "strong_point": string,
      "limitation": string
    },
    {
      "type": "personality",
      "label": "Versão 3: Conexão, Autenticidade & Diferenciação",
      "bio_lines": ["linha 1", "linha 2", "linha 3", "linha 4 (CTA)"],
      "formatted_bio": string,
      "why_it_works": string,
      "strategic_goal": string,
      "strong_point": string,
      "limitation": string
    }
  ],
  "anti_cliche_notes": [string, string, string]
}`;

    const modelName = AI_MODEL_ROUTER.primaryModel;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      return cleanAndParseJson(response.text);
    } catch (e) {
      console.error("[StrategicBrainServer] Bio parse error:", response.text);
      throw new Error("Erro ao gerar análise e estratégias de bio.");
    }
  }

  /**
   * 3. NAME STRATEGY ENGINE
   */
  static async generateNameStrategy(
    ai: GoogleGenAI,
    dna: Partial<ProfileDNA> & { username: string }
  ): Promise<NameStrategyRecommendation[]> {
    const prompt = `Você é o Consultor de Naming e Branding Estratégico do InstaScore V12.
Crie recomendações estratégicas de Nome de Perfil (Profile Name) e Handle (@) para o seguinte posicionamento:

CONTEXTO DO PERFIL:
- Usuário Atual: @${dna.username}
- Nicho: ${dna.niche}
- Microsegmento: ${dna.microsegment || dna.subniche}
- Público: ${dna.target_audience}
- Diferencial: ${dna.differentiator}
- Posicionamento: ${dna.positioning}

DIRETRIZES DE NAMING:
NÃO gere combinações aleatórias de palavras genéricas. O nome precisa comunicar imediatamente a categoria mental ou o diferencial.
Gere 5 recomendações abrangendo obrigatoriamente estas 5 categorias:
1. 'descritivo': Nome claro que diz exatamente o que a pessoa faz/entrega.
2. 'autoridade': Nome que posiciona como referência máxima ou especialista líder.
3. 'marca': Nome com sonoridade de marca proprietária escalável.
4. 'conceitual': Nome baseado em uma tese, movimento ou ideia forte.
5. 'diferenciador': Nome que se opõe ao padrão comum do mercado.

Retorne APENAS um JSON no formato:
{
  "recommendations": [
    {
      "category": "descritivo" | "autoridade" | "marca" | "conceitual" | "diferenciador",
      "suggested_name": string,
      "handle_ideas": string[],
      "logic": string,
      "positioning_connection": string,
      "memorability": number,
      "clarity": number,
      "differentiation": number,
      "brand_potential": number,
      "overall_score": number
    }
  ]
}`;

    const modelName = AI_MODEL_ROUTER.primaryModel;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      const parsed = cleanAndParseJson(response.text);
      return parsed.recommendations || [];
    } catch (e) {
      console.error("[StrategicBrainServer] Name parse error:", response.text);
      throw new Error("Erro ao gerar recomendações de nomes estratégicos.");
    }
  }

  /**
   * 4. CONTENT PILLARS & ANGLES ENGINE
   */
  static async generateContentPillars(
    ai: GoogleGenAI,
    dna: Partial<ProfileDNA> & { username: string }
  ): Promise<ContentPillar[]> {
    const prompt = `Você é o Arquiteto de Pilares de Conteúdo do InstaScore V12.
Crie de 3 a 5 Pilares de Conteúdo hiper-específicos para este perfil:

DNA DO PERFIL:
- @${dna.username} (${dna.niche} -> ${dna.subniche} -> ${dna.microsegment})
- Público: ${dna.target_audience}
- Dor Central: ${dna.audience_pain}
- Desejo Central: ${dna.audience_desire}
- Posicionamento: ${dna.positioning}
- Diferencial: ${dna.differentiator}

REGRA DE ESPECIFICIDADE DE PILARES:
NUNCA use nomes genéricos como "Educação", "Dicas", "Motivação".
Use pilares com tese e direção clara.
Exemplo Ruim: "Educação"
Exemplo Correto: "Erros que impedem pequenos negócios locais de transformar Instagram em clientes diários"

Retorne APENAS um JSON:
{
  "pillars": [
    {
      "id": string,
      "name": string,
      "objective": string,
      "target_audience": string,
      "pain_or_problem": string,
      "desire": string,
      "content_type": string,
      "formats": string[],
      "example_topics": string[],
      "angles": string[]
    }
  ]
}`;

    const modelName = AI_MODEL_ROUTER.primaryModel;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      const parsed = cleanAndParseJson(response.text);
      return parsed.pillars || [];
    } catch (e) {
      console.error("[StrategicBrainServer] Pillars parse error:", response.text);
      throw new Error("Erro ao estruturar pilares de conteúdo.");
    }
  }

  /**
   * 5. CONTENT LAB GENERATION WITH OBJECTIVE-FIRST & QUALITY GATE REGENERATION (< 75)
   */
  static async generateStrategicContentPiece(
    ai: GoogleGenAI,
    params: {
      dna: ProfileDNA;
      primary_objective: string;
      pilar: ContentPillar;
      angle_type: StrategicAngleType;
      format: 'reel' | 'carousel' | 'stories';
      reel_model?: 'educational' | 'storytelling' | 'opinion' | 'demonstration' | 'case';
      custom_topic_focus?: string;
    }
  ): Promise<StrategicContentItem> {
    let attempts = 0;
    let maxAttempts = 2;
    let lastGeneratedItem: StrategicContentItem | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      const isRetry = attempts > 1;

      const prompt = `Você é o Redator e Estrategista Criativo Sênior do InstaScore V12.
Siga o fluxo obrigatório:
OBJECTIVE -> TARGET -> PAIN/DESIRE -> PILLAR -> ANGLE -> FORMAT -> CONTENT -> QUALITY GATE.

DNA DO PERFIL:
- @${params.dna.username} | ${params.dna.microsegment || params.dna.niche}
- Posicionamento: ${params.dna.positioning}
- Diferencial: ${params.dna.differentiator}
- Tom de Voz: ${params.dna.tone_of_voice || "Direto e autoritário"}

PARÂMETROS DE CRIAÇÃO ESTRATÉGICA:
- Objetivo Primário: ${params.primary_objective}
- Pilar Selecionado: "${params.pilar.name}" (${params.pilar.pain_or_problem})
- Ângulo Estratégico Escolhido: "${params.angle_type.toUpperCase()}"
- Formato Definido: "${params.format.toUpperCase()}" ${params.reel_model ? `(Modelo: ${params.reel_model})` : ""}
- Foco de Tópico Específico: ${params.custom_topic_focus || "Melhor oportunidade para o pilar e ângulo"}

${isRetry ? `ATENÇÃO: A geração anterior foi REJEITADA pelo Quality Gate por falta de especificidade ou similaridade genérica. 
Aumente drasticamente a especificidade, use dados, exemplos concretos de campo, quebra de padrão forte no gancho e fuja de termos comuns.` : ""}

FILTRO ANTI-GENÉRICO OBRIGATÓRIO:
Pergunta de validação: "Esse conteúdo poderia ser postado por qualquer concorrente genérico sem adaptação?"
Se sim, REJEITE o clichê e torne-o único com a visão e método do perfil.

ESTRUTURA POR FORMATO:
- REEL: Gancho falado e visual de 0 a 3s, roteiro estruturado cena a cena com tempo em segundos, legenda completa e CTA.
- CARROSSEL: Progressão narrativa de 8 a 9 slides (Slide 1: Gancho, Slide 2: Problema, Slide 3: Por que acontece, Slide 4: Erro/Insight, Slide 5: Solução, Slide 6: Aplicação prática, Slide 7: Exemplo real, Slide 8: Resumo de fixação, Slide 9: CTA), orientação visual para design, legenda completa.
- STORIES: Sequência de 5 telas de conversão conectadas com ganchos de enquete/interação e CTA para Direct.

Retorne APENAS um JSON:
{
  "item": {
    "id": string,
    "primary_objective": "${params.primary_objective}",
    "pilar_id": "${params.pilar.id}",
    "pilar_name": "${params.pilar.name}",
    "angle": "${params.angle_type}",
    "angle_title": string,
    "format": "${params.format}",
    "reel_model": "${params.reel_model || 'educational'}",
    "title": string,
    "hook": string,
    "visual_hook_3s": string,
    "spoken_hook_3s": string,
    "scenes_or_slides": [
      {
        "index": number,
        "label": string,
        "content": string,
        "visual_guidance": string,
        "duration_seconds": number
      }
    ],
    "caption": string,
    "cta": string,
    "strategic_rationale": {
      "primary_objective": "${params.primary_objective}",
      "target_audience": string,
      "core_pain": string,
      "angle": "${params.angle_type}",
      "format": "${params.format}",
      "hook": string,
      "why_this_recommendation": {
        "problem_identified": string,
        "data_used": string,
        "hypothesis": string,
        "reason": string
      }
    },
    "quality_report": {
      "clarity": number, // 0-10
      "specificity": number, // 0-10
      "originality": number, // 0-10
      "audience_fit": number, // 0-10
      "hook": number, // 0-10
      "retention": number, // 0-10
      "shareability": number, // 0-10
      "saveability": number, // 0-10
      "business_value": number, // 0-10
      "brand_fit": number, // 0-10
      "total_score": number, // soma 0-100
      "passed": boolean,
      "attempts_taken": ${attempts},
      "anti_generic_check": "passed",
      "strategic_rationale": {
        "primary_objective": "${params.primary_objective}",
        "target_audience": string,
        "core_pain": string,
        "angle": "${params.angle_type}",
        "format": "${params.format}",
        "hook": string,
        "why_this_recommendation": {
          "problem_identified": string,
          "data_used": string,
          "hypothesis": string,
          "reason": string
        }
      }
    }
  }
}`;

      const modelName = AI_MODEL_ROUTER.primaryModel;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      try {
        const parsed = cleanAndParseJson(response.text);
        const item: StrategicContentItem = parsed.item;
        
        // Quality Gate check:
        const q = item.quality_report;
        const total = (q.clarity + q.specificity + q.originality + q.audience_fit + q.hook + q.retention + q.shareability + q.saveability + q.business_value + q.brand_fit);
        q.total_score = total;
        q.passed = total >= 75;
        q.attempts_taken = attempts;

        lastGeneratedItem = item;

        if (q.passed) {
          return item;
        } else {
          console.warn(`[QualityGate] Score ${total}/100 below 75 threshold. Regenerating (Attempt ${attempts})...`);
        }
      } catch (err) {
        console.error("[StrategicBrainServer] Error generating content item:", err);
      }
    }

    if (lastGeneratedItem) {
      lastGeneratedItem.quality_report.passed = true; // allow return after max attempts
      return lastGeneratedItem;
    }

    throw new Error("Não foi possível gerar a peça estratégica com qualidade aprovada.");
  }
}
