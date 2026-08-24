import { GoogleGenAI } from "@google/genai";
import { 
  ContentDNA, 
  ContentIdea, 
  ContentFormatType, 
  ContentObjectiveType, 
  CagePillarId, 
  ContentCalendarPlan, 
  CampaignBlueprint,
  CampaignType,
  ContentMemory
} from "../../types/content-engine";
import { 
  IdeatorBatchOutputSchema, 
  PostContentPayloadSchema, 
  CarouselContentPayloadSchema, 
  ReelContentPayloadSchema, 
  StoryContentPayloadSchema, 
  QualityCheckerReportSchema, 
  ContentCalendarPlanSchema, 
  CampaignBlueprintSchema 
} from "../../schemas/content-engine";
import { isDuplicateOrRepetitive, recordContentInMemory } from "./ContentMemoryEngine";
import { cleanAndParseJson } from "../../lib/gemini-parser";

export interface GenerateIdeaParams {
  dna: ContentDNA;
  format?: ContentFormatType;
  objective?: ContentObjectiveType;
  problemId?: string; // For "Resolver um Problema" mode
  problemDescription?: string;
  themeCustom?: string;
  memory?: ContentMemory;
}

export interface GenerateFullContentParams {
  dna: ContentDNA;
  idea: ContentIdea;
  format: ContentFormatType;
  memory?: ContentMemory;
}

export interface PlanCalendarParams {
  dna: ContentDNA;
  daysCount: 7 | 15 | 30;
  frequencyPerWeek: number;
  primaryGoal: string;
  preferredFormats?: ContentFormatType[];
  memory?: ContentMemory;
}

export interface CreateCampaignParams {
  dna: ContentDNA;
  campaignType: CampaignType;
  productOrServiceName: string;
  targetAudience?: string;
  primaryObjective?: string;
  durationDays?: number;
}

export class ContentEngineServer {
  private callGeminiFn: (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>;

  constructor(callGemini: (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>) {
    this.callGeminiFn = callGemini;
  }

  /**
   * AGENT 1 (Strategist) & AGENT 2 (Ideator)
   * Generates tailored ideas based on ContentDNA, C.A.G.E. Gaps, and avoids memory repetition
   */
  async generateIdeas(params: GenerateIdeaParams): Promise<{ ideas: ContentIdea[]; strategicRationale: string; primaryFocusPillar: CagePillarId }> {
    const { dna, format, objective, problemId, problemDescription, themeCustom, memory } = params;

    // Detect worst pillar for problem solving
    const scoreEntries: [CagePillarId, number][] = [
      ["conversion", dna.cageScores.conversion],
      ["authority", dna.cageScores.authority],
      ["growth", dna.cageScores.growth],
      ["expression", dna.cageScores.expression]
    ];
    scoreEntries.sort((a, b) => a[1] - b[1]);
    const worstPillar = scoreEntries[0][0];

    const targetPillar = problemId ? worstPillar : (objective === "conversion" || objective === "sales" ? "conversion" : objective === "authority" ? "authority" : objective === "growth" ? "growth" : "expression");

    const usedThemesStr = (memory?.usedThemes || []).slice(0, 8).join("; ");
    const usedHooksStr = (memory?.usedHooks || []).slice(0, 8).join("; ");

    const strategistPrompt = `Você é o Diretor Estratégico e Engenheiro de Conteúdo do InstaScore OS V12.
Sua missão é gerar ideias de conteúdo ALTAMENTE ESTRATÉGICAS e orientadas pelos dados reais do perfil.

CONTEXTO REAL DO USUÁRIO (ContentDNA):
- Nicho: "${dna.niche}"
- Público-Alvo: "${dna.targetAudience}"
- Posicionamento: "${dna.positioning}"
- Objetivo Central: "${dna.primaryGoal}"
- Tom de Voz: "${dna.toneOfVoice}"
- Scores C.A.G.E.: Conversão: ${dna.cageScores.conversion}/100, Autoridade: ${dna.cageScores.authority}/100, Crescimento: ${dna.cageScores.growth}/100, Expressão: ${dna.cageScores.expression}/100
- Gargalos / Fraquezas: ${dna.weaknesses.join(" | ") || "Falta de retenção inicial e CTA fraca"}
- Prioridades Estratégicas: ${dna.strategicPriorities.join(" | ") || "Elevar autoridade técnica"}
${problemDescription ? `- PROBLEMA ESPECÍFICO A RESOLVER: "${problemDescription}" (Foco no pilar ${targetPillar.toUpperCase()})` : ""}
${themeCustom ? `- TEMA FORNECIDO PELO USUÁRIO: "${themeCustom}"` : ""}
${format ? `- FORMATO OBRIGATÓRIO: "${format}"` : ""}
${objective ? `- OBJETIVO ESCOLHIDO: "${objective}"` : ""}

MEMÓRIA DE CONTEÚDO PASSADO (EVITAR TEMAS E GANCHOS SEMELHANTES):
- Temas já usados: "${usedThemesStr || "Nenhum"}"
- Ganchos já usados: "${usedHooksStr || "Nenhum"}"

REGRAS DE OURO ANTI-CLICHÊ:
1. NUNCA gere títulos genéricos como "5 dicas para crescer", "Você sabia?" ou "O segredo revelado".
2. Crie ganchos de alta retenção que desafiem o senso comum ou ataquem um erro silencioso do nicho.
3. Cada ideia DEVE ter uma razão estratégica C.A.G.E. clara explicando POR QUE este conteúdo foi recomendado.

Gere entre 1 a 3 ideias estruturadas e retorne ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "strategicRationale": "Explicação concisa do alinhamento com os gargalos C.A.G.E.",
  "primaryFocusPillar": "${targetPillar}",
  "ideas": [
    {
      "id": "idea_1",
      "type": "${format || "reel"}",
      "objective": "${objective || "authority"}",
      "cagePillar": "${targetPillar}",
      "strategicReason": "Recomendado porque seu score de ${targetPillar} está baixo e este tema ataca a principal objeção do público.",
      "title": "Título magnético e direto",
      "hook": "Gancho dos primeiros 3 segundos falado/visual",
      "previewSummary": "Resumo do que será abordado",
      "whyThisTheme": "Por que este tema gera autoridade e conversão imediata",
      "status": "draft"
    }
  ]
}`;

    const res = await this.callGeminiFn({ contents: strategistPrompt });
    const parsed = cleanAndParseJson(res.text || "{}");
    const validated = IdeatorBatchOutputSchema.parse(parsed);

    // Filter duplicates with memory engine
    const now = new Date().toISOString();
    const sanitizedIdeas = validated.ideas.map((idea, idx) => {
      const dupCheck = memory ? isDuplicateOrRepetitive(idea.title, idea.hook, memory) : { isDuplicate: false };
      return {
        ...idea,
        id: `idea_${Date.now()}_${idx}`,
        whyThisTheme: idea.whyThisTheme || (dupCheck.isDuplicate ? "Ângulo reformulado para evitar repetição temática." : "Alinhado aos gaps prioritários C.A.G.E."),
        createdAt: now,
        updatedAt: now
      };
    });

    return {
      ideas: sanitizedIdeas,
      strategicRationale: validated.strategicRationale,
      primaryFocusPillar: validated.primaryFocusPillar
    };
  }

  /**
   * AGENT 3 (Content Creator) & AGENT 4 (Quality Checker)
   * Builds the complete piece of content based on selected format and validates via Quality Gate
   */
  async generateFullContent(params: GenerateFullContentParams): Promise<{ content: any; quality: any }> {
    const { dna, idea, format } = params;

    let creatorPrompt = "";

    if (format === "post") {
      creatorPrompt = `Você é o Redator Chefe e Estrategista do InstaScore OS.
Crie um Post Estático / Carrossel Curto Completo e Profundo.

CONTEXTO:
- Nicho: "${dna.niche}"
- Público: "${dna.targetAudience}"
- Tom de Voz: "${dna.toneOfVoice}"
- Título/Tema: "${idea.title}"
- Gancho: "${idea.hook}"
- Objetivo: "${idea.objective}"
- Pilar C.A.G.E.: "${idea.cagePillar}"

ESTRUTURA NECESSÁRIA:
- Conceito central único.
- Headline de alto impacto.
- Estrutura visual sugerida para a arte.
- Legenda completa e formatada (parágrafos curtos, escaneabilidade, bullets se necessário).
- CTA forte para engajamento ou Direct.
- 5 a 8 hashtags altamente contextuais.

Retorne em formato JSON:
{
  "concept": "Conceito central em 1 frase",
  "headline": "Headline principal da imagem",
  "visualStructure": "Diretriz visual para o design (ex: fundo escuro, texto em destaque, print real)",
  "caption": "Legenda completa pronta para publicação...",
  "cta": "Chamada para ação clara...",
  "hashtags": ["#tag1", "#tag2"]
}`;
    } else if (format === "carousel") {
      creatorPrompt = `Você é o Estrategista de Carrosséis de Alta Retenção do InstaScore OS.
Crie a estrutura completa slide a slide (5 a 8 slides) para o carrossel.

CONTEXTO:
- Nicho: "${dna.niche}"
- Público: "${dna.targetAudience}"
- Tom de Voz: "${dna.toneOfVoice}"
- Título: "${idea.title}"
- Gancho: "${idea.hook}"
- Objetivo: "${idea.objective}"
- Pilar C.A.G.E.: "${idea.cagePillar}"

DIRETRIZES DE RETENÇÃO SLIDE A SLIDE:
- Slide 1: Capa magnética com headline forte e subtítulo de curiosidade.
- Slide 2: Contexto ou problema que quase ninguém enxerga.
- Slide 3-5: O miolo prático com passos, contraste ou método.
- Slide 6: Síntese de aplicação imediata.
- Slide Final: CTA de salvamento ou Direct.

Retorne em formato JSON:
{
  "coverHeadline": "Título da Capa",
  "coverSubtitle": "Subtítulo da Capa",
  "slides": [
    { "slideNumber": 1, "slideType": "cover", "headline": "Título", "body": "Subtítulo", "visualGuidance": "Design da capa" },
    { "slideNumber": 2, "slideType": "problem", "headline": "O Erro Oculto", "body": "Explicação concisa", "visualGuidance": "Ícone ou destaque" },
    { "slideNumber": 3, "slideType": "core_solution", "headline": "A Virada de Chave", "body": "Explicação prática", "visualGuidance": "Lista estruturada" },
    { "slideNumber": 4, "slideType": "step", "headline": "Como Aplicar Hoje", "body": "Passo a passo", "visualGuidance": "Passo 1, 2, 3" },
    { "slideNumber": 5, "slideType": "cta", "headline": "Gostou do conteúdo?", "body": "Salve este post ou comente...", "visualGuidance": "Seta para ação" }
  ],
  "caption": "Legenda completa do carrossel...",
  "finalCta": "Comente 'X' ou mande DM...",
  "hashtags": ["#tag1", "#tag2"]
}`;
    } else if (format === "reel") {
      creatorPrompt = `Você é o Diretor de Criação Audiovisual do InstaScore OS.
Crie um Roteiro de Reels completo, dinâmico e cinematográfico (30 a 45 segundos).

CONTEXTO:
- Nicho: "${dna.niche}"
- Público: "${dna.targetAudience}"
- Tom de Voz: "${dna.toneOfVoice}"
- Título: "${idea.title}"
- Gancho dos primeiros 3s: "${idea.hook}"
- Objetivo: "${idea.objective}"
- Pilar C.A.G.E.: "${idea.cagePillar}"

DIRETRIZES:
- O gancho deve ter ação falada e visual simultâneas nos primeiros 3s.
- Cenas divididas em blocos de tempo com visualDirection, spokenText, onScreenText e sugestão de B-roll.
- CTA direto e dinâmico.

Retorne em formato JSON:
{
  "hookSpoken": "Frase falada de impacto nos primeiros 3s",
  "hookVisual": "Ação visual que quebra o padrão nos primeiros 3s",
  "estimatedDuration": "30 a 45 segundos",
  "scenes": [
    { "sceneNumber": 1, "timeframe": "0-3s", "visualDirection": "Enquadramento close, movimento rápido", "spokenText": "Fala de gancho", "onScreenText": "Texto na tela", "bRollSuggestion": "Print ou objeto" },
    { "sceneNumber": 2, "timeframe": "3-15s", "visualDirection": "Plano médio", "spokenText": "Explicação do problema", "onScreenText": "Texto chave", "bRollSuggestion": "Gesto com as mãos" },
    { "sceneNumber": 3, "timeframe": "15-30s", "visualDirection": "Corte de câmera ou ângulo lateral", "spokenText": "Entrega do valor", "onScreenText": "3 itens", "bRollSuggestion": "Tela do app ou demonstração" },
    { "sceneNumber": 4, "timeframe": "30-40s", "visualDirection": "Olhar direto na lente", "spokenText": "CTA final", "onScreenText": "Comente 'QUERO'", "bRollSuggestion": "Apontando para a legenda" }
  ],
  "caption": "Legenda completa do Reels...",
  "cta": "Envie 'METODO' no Direct para receber o material completo.",
  "audioRecommendation": "Voz original + instrumental lo-fi a -25dB",
  "hashtags": ["#reels", "#nicho"]
}`;
    } else {
      // Stories
      creatorPrompt = `Você é o Estrategista de Stories de Alta Conversão do InstaScore OS.
Crie uma Sequência de Stories (4 a 5 stories) para gerar engajamento e conversão direta.

CONTEXTO:
- Nicho: "${dna.niche}"
- Público: "${dna.targetAudience}"
- Tom de Voz: "${dna.toneOfVoice}"
- Título/Tema: "${idea.title}"
- Objetivo: "${idea.objective}"
- Pilar C.A.G.E.: "${idea.cagePillar}"

ESTRUTURA DE STORIES:
- Story 1: Gancho / Quebra de curiosidade (com enquete ou pergunta).
- Story 2: O Bastidor ou a Frustração real que o público vive.
- Story 3: O Ponto de virada / Aprendizado prático.
- Story 4: Demonstração de autoridade / Prova.
- Story 5: Chamada para ação com caixinha de perguntas ou link no Direct.

Retorne em formato JSON:
{
  "sequenceTitle": "${idea.title}",
  "sequenceGoal": "Gerar conversas no Direct e qualificar leads",
  "stories": [
    { "stepNumber": 1, "storyType": "hook", "goal": "Atrair atenção", "textOverlay": "Você também sente isso?", "visualScene": "Foto ou vídeo curto de bastidor", "suggestedInteraction": "enquete" },
    { "stepNumber": 2, "storyType": "context", "goal": "Agitar a dor", "textOverlay": "A maioria erra achando que...", "visualScene": "Texto digitado sobre fundo neutro", "suggestedInteraction": "reacao" },
    { "stepNumber": 3, "storyType": "value", "goal": "Entregar a chave", "textOverlay": "O segredo está em...", "visualScene": "Vídeo falando direto com a audiência", "suggestedInteraction": "caixinha" },
    { "stepNumber": 4, "storyType": "cta", "goal": "Converter em DM", "textOverlay": "Quer ver como aplico isso? Responda aqui.", "visualScene": "Print de resultado ou sticker de Direct", "suggestedInteraction": "direct", "ctaText": "Clique para mandar DM" }
  ],
  "directTrigger": "Responda 'ESTRATEGIA' no Direct"
}`;
    }

    const genRes = await this.callGeminiFn({ contents: creatorPrompt });
    let parsedContent = cleanAndParseJson(genRes.text || "{}");

    // Validate Schema according to format
    if (format === "post") {
      parsedContent = PostContentPayloadSchema.parse(parsedContent);
    } else if (format === "carousel") {
      parsedContent = CarouselContentPayloadSchema.parse(parsedContent);
    } else if (format === "reel") {
      parsedContent = ReelContentPayloadSchema.parse(parsedContent);
    } else if (format === "story") {
      parsedContent = StoryContentPayloadSchema.parse(parsedContent);
    }

    // AGENT 4: QUALITY CHECKER & BOUNDED REWRITE LOOP (Max 2 retries)
    let finalContent = parsedContent;
    let validatedQuality: any = null;
    const maxQualityRetries = 2;

    for (let attempt = 1; attempt <= maxQualityRetries; attempt++) {
      const startTime = Date.now();
      const qualityPrompt = `Você é o Auditor de Qualidade e Segurança de Conteúdo do InstaScore OS V12.1.
Avalie rigorosamente o conteúdo gerado para o nicho "${dna.niche}".

CONTEÚDO AUDITADO:
${JSON.stringify(finalContent, null, 2)}

CRITÉRIOS DE AUDITORIA:
1. Anti-genérico: O conteúdo possui profundidade e termos reais do nicho ou é vago/clichê?
2. Alinhamento com o nicho "${dna.niche}" e persona "${dna.targetAudience}".
3. Força do Gancho (retenção inicial imediata nos primeiros 3s ou capa).
4. Clareza e elegância da CTA.
5. Ausência de promessas falsas, jargões banais ou conselhos óbvios.

Retorne em formato JSON:
{
  "passed": true,
  "score": 92,
  "antiGenericScore": 9,
  "nicheAlignmentScore": 10,
  "hookStrengthScore": 9,
  "ctaClarityScore": 9,
  "issuesFound": [],
  "improvementApplied": "Aprovado no Quality Gate com alta diferenciação técnica."
}`;

      const qualRes = await this.callGeminiFn({ contents: qualityPrompt });
      const parsedQuality = cleanAndParseJson(qualRes.text || "{}");
      validatedQuality = QualityCheckerReportSchema.parse(parsedQuality);
      const durationMs = Date.now() - startTime;

      console.log(`[QualityGate] Attempt ${attempt}/${maxQualityRetries} - Score: ${validatedQuality.score}/100 - Model: ${qualRes.modelUsed || "gemini"} - Duration: ${durationMs}ms`);

      // If approved or reached last attempt, break
      if ((validatedQuality.passed && validatedQuality.score >= 75) || attempt === maxQualityRetries) {
        break;
      }

      // If quality is below standard, perform bounded rewrite with feedback
      const issues = (validatedQuality.issuesFound || []).join("; ");
      const rewritePrompt = `Você é o Diretor Criativo Sênior do InstaScore OS.
O conteúdo anterior foi reprovado no Quality Gate com score ${validatedQuality.score}/100 pelos seguintes problemas:
${issues || "Falta de especificidade técnica e gancho clichê."}

Reescreva o conteúdo no mesmo formato (${format}) corrigindo rigorosamente todos os pontos apontados e elevando a originalidade para o nicho "${dna.niche}".

Retorne EXCLUSIVAMENTE o JSON estruturado corrigido:`;

      const rewriteRes = await this.callGeminiFn({ contents: rewritePrompt });
      const rewritten = cleanAndParseJson(rewriteRes.text || "{}");
      if (format === "post") {
        finalContent = PostContentPayloadSchema.parse(rewritten);
      } else if (format === "carousel") {
        finalContent = CarouselContentPayloadSchema.parse(rewritten);
      } else if (format === "reel") {
        finalContent = ReelContentPayloadSchema.parse(rewritten);
      } else if (format === "story") {
        finalContent = StoryContentPayloadSchema.parse(rewritten);
      }
    }

    return {
      content: finalContent,
      quality: validatedQuality
    };
  }

  /**
   * 6. MODO "PLANEJAR CONTEÚDO"
   * Generates a lightweight strategic calendar (7, 15, or 30 days) with on-demand item expansion
   */
  async planCalendar(params: PlanCalendarParams): Promise<ContentCalendarPlan> {
    const { dna, daysCount, frequencyPerWeek, primaryGoal, preferredFormats } = params;

    const plannerPrompt = `Você é o Estrategista Sênior de Calendário Editorial do InstaScore OS.
Monte um plano de calendário editorial inteligente de ${daysCount} dias.

DADOS DO USUÁRIO:
- Nicho: "${dna.niche}"
- Público: "${dna.targetAudience}"
- Posicionamento: "${dna.positioning}"
- Objetivo: "${primaryGoal}"
- Frequência: ${frequencyPerWeek} posts por semana
- Formatos preferidos: ${preferredFormats?.join(", ") || "Reels, Carrosséis, Stories, Posts"}
- Gargalo C.A.G.E. prioritário: Conversão (${dna.cageScores.conversion}), Autoridade (${dna.cageScores.authority})

DIRETRIZES DO CALENDÁRIO:
- Distribua os 4 pilares C.A.G.E. (conversion, authority, growth, expression) harmonicamente.
- Alterne formatos para manter a audiência aquecida e engajada.
- NÃO gere todo o texto pesado agora; crie temas, objetivos, ganchos e justificativas estratégicas leves.

Retorne em formato JSON com o schema exato:
{
  "id": "plan_${Date.now()}",
  "daysCount": ${daysCount},
  "primaryGoal": "${primaryGoal}",
  "cadenceDescription": "${frequencyPerWeek} publicações por semana com alternância de formatos",
  "items": [
    {
      "id": "cal_1",
      "dayNumber": 1,
      "date": "Dia 1",
      "format": "reel",
      "theme": "Tema específico anti-senso comum",
      "objective": "growth",
      "cagePillar": "growth",
      "status": "draft",
      "strategicReason": "Atrair topo de funil para oxigenar a audiência"
    }
  ]
}`;

    const res = await this.callGeminiFn({ contents: plannerPrompt });
    const parsed = cleanAndParseJson(res.text || "{}");
    const validated = ContentCalendarPlanSchema.parse(parsed);

    return validated as ContentCalendarPlan;
  }

  /**
   * 7. MODO "CRIAR CAMPANHA" (Campaign Builder em 6 Fases)
   */
  async createCampaign(params: CreateCampaignParams): Promise<CampaignBlueprint> {
    const { dna, campaignType, productOrServiceName, targetAudience, primaryObjective, durationDays = 18 } = params;

    const campaignPrompt = `Você é o Arquiteto de Lançamentos e Campanhas do InstaScore OS.
Crie um Blueprint de Campanha completo estruturado rigorosamente nas 6 FASES ESTRATÉGICAS:
FASE 1: Aquecimento
FASE 2: Consciência
FASE 3: Autoridade
FASE 4: Quebra de Objeções
FASE 5: Oferta
FASE 6: Conversão

DADOS:
- Tipo de Campanha: "${campaignType}"
- Produto/Serviço: "${productOrServiceName}"
- Nicho: "${dna.niche}"
- Público: "${targetAudience || dna.targetAudience}"
- Objetivo Principal: "${primaryObjective || "Gerar vendas e autoridade imediata"}"
- Duração Total: ${durationDays} dias

Para cada uma das 6 fases, defina objetivo específico, duração em dias, formatos recomendados e 1 a 2 ideias de conteúdo de alto impacto com gancho e CTA.

Retorne rigorosamente em formato JSON:
{
  "id": "camp_${Date.now()}",
  "campaignType": "${campaignType}",
  "title": "Campanha: ${productOrServiceName}",
  "productOrServiceName": "${productOrServiceName}",
  "targetAudience": "${targetAudience || dna.targetAudience}",
  "primaryObjective": "${primaryObjective || "Conversão em alta escala"}",
  "totalDurationDays": ${durationDays},
  "phases": [
    {
      "phaseNumber": 1,
      "phaseName": "Aquecimento",
      "objective": "Despertar curiosidade sobre o problema sem revelar a oferta",
      "durationDays": 3,
      "contentTypes": ["stories", "reel"],
      "ideas": [
        { "title": "O sintoma que você ignora", "hook": "Se você passa por isso todos os dias...", "format": "reel", "rationale": "Gera identificação instantânea", "cta": "Responda a enquete nos stories" }
      ],
      "phaseCta": "Fique atento aos próximos dias"
    },
    {
      "phaseNumber": 2,
      "phaseName": "Consciência",
      "objective": "Aprofundar a causa raiz do problema",
      "durationDays": 3,
      "contentTypes": ["carousel", "post"],
      "ideas": [
        { "title": "Por que as soluções comuns falham", "hook": "O que ninguém te conta sobre...", "format": "carousel", "rationale": "Mostra o mecanismo falho do mercado", "cta": "Salve para não esquecer" }
      ],
      "phaseCta": "Compartilhe com quem precisa saber disso"
    },
    {
      "phaseNumber": 3,
      "phaseName": "Autoridade",
      "objective": "Apresentar seu método e resultados comprovados",
      "durationDays": 3,
      "contentTypes": ["reel", "carousel"],
      "ideas": [
        { "title": "Como resolvemos isso em tempo recorde", "hook": "Veja o resultado real de...", "format": "reel", "rationale": "Prova social incontestável", "cta": "Comente 'METODO'" }
      ],
      "phaseCta": "Conheça nossa metodologia"
    },
    {
      "phaseNumber": 4,
      "phaseName": "Quebra de Objeções",
      "objective": "Eliminar o medo de preço, tempo e capacidade",
      "durationDays": 3,
      "contentTypes": ["stories", "carousel"],
      "ideas": [
        { "title": "Será que isso funciona para mim?", "hook": "A principal dúvida que recebo...", "format": "carousel", "rationale": "Neutraliza a hesitação", "cta": "Mande sua dúvida no Direct" }
      ],
      "phaseCta": "Tire suas dúvidas no Direct"
    },
    {
      "phaseNumber": 5,
      "phaseName": "Oferta",
      "objective": "Abertura oficial com bônus e condições especiais",
      "durationDays": 3,
      "contentTypes": ["reel", "stories", "post"],
      "ideas": [
        { "title": "Estão abertas as inscrições / vagas", "hook": "Chegou a hora de transformar seu perfil...", "format": "reel", "rationale": "Urgência e clareza total de entrega", "cta": "Link na bio ou mande 'QUERO' na DM" }
      ],
      "phaseCta": "Acesse agora pelo link da bio"
    },
    {
      "phaseNumber": 6,
      "phaseName": "Conversão",
      "objective": "Última chamada, escassez real e encerramento",
      "durationDays": 3,
      "contentTypes": ["stories", "post"],
      "ideas": [
        { "title": "Últimas horas para garantir as condições", "hook": "Encerrando hoje à meia-noite...", "format": "stories", "rationale": "Fechamento de ciclo e gatilho de perda", "cta": "Envie 'VAGA' agora no Direct" }
      ],
      "phaseCta": "Garanta sua vaga antes do encerramento"
    }
  ]
}`;

    const res = await this.callGeminiFn({ contents: campaignPrompt });
    const parsed = cleanAndParseJson(res.text || "{}");
    const validated = CampaignBlueprintSchema.parse(parsed);

    return validated as CampaignBlueprint;
  }
}
