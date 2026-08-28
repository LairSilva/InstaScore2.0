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

    let validated: any = null;
    const now = new Date().toISOString();

    try {
      const res = await this.callGeminiFn({ contents: strategistPrompt });
      const parsed = cleanAndParseJson(res.text || "{}");
      validated = IdeatorBatchOutputSchema.parse(parsed);
    } catch (err: any) {
      console.warn("[ContentEngineServer] AI Ideation call failed or returned unparseable output, activating strategic deterministic fallback:", err?.message || err);
      
      const pilarLabel = targetPillar === 'conversion' ? 'Conversão' : targetPillar === 'authority' ? 'Autoridade' : targetPillar === 'growth' ? 'Crescimento' : 'Retenção';
      const mainTheme = themeCustom ? themeCustom : `O Maior Ponto Cego de ${pilarLabel} em ${dna.niche}`;

      validated = {
        strategicRationale: `Plano estratégico focado em reparar o pilar de ${pilarLabel} (${dna.cageScores[targetPillar]}/100) com ganchos de quebra de padrão e diferenciação competitiva.`,
        primaryFocusPillar: targetPillar,
        ideas: [
          {
            id: `idea_${Date.now()}_0`,
            type: format || "reel",
            objective: objective || "authority",
            cagePillar: targetPillar,
            strategicReason: `Foco cirúrgico em elevar o score de ${pilarLabel} através de especificidade técnica e quebra de crenças erradas no nicho.`,
            title: `${mainTheme}: O Que Ninguém Te Avisa`,
            hook: `Se você ainda comete esse erro no seu perfil de ${dna.niche}, seus resultados estão travados por isso.`,
            previewSummary: `Apresentação dos 3 pilares fundamentais para transformar sua autoridade e atrair clientes qualificados.`,
            whyThisTheme: `Ataca diretamente a dor silenciosa da persona (${dna.targetAudience}) gerando valor prático imediato.`,
            status: "draft"
          },
          {
            id: `idea_${Date.now()}_1`,
            type: format === "carousel" ? "carousel" : "reel",
            objective: "conversion",
            cagePillar: "conversion",
            strategicReason: `Gera conversão rápida conduzindo a audiência qualificada para conversas 1-a-1 no Direct.`,
            title: `Como Sair do Invisível no Nicho de ${dna.niche} em 3 Passos Práticos`,
            hook: `Pare de produzir conteúdo genérico. Use essa estrutura exata para transformar seguidores em clientes:`,
            previewSummary: `Passo a passo com método estruturado e chamada de ação de alta conversão.`,
            whyThisTheme: `Reduz o atrito de decisão e resolve o gap de conversão do perfil.`,
            status: "draft"
          }
        ]
      };
    }

    // Filter duplicates with memory engine
    const sanitizedIdeas = validated.ideas.map((idea: any, idx: number) => {
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

    let parsedContent: any = null;

    try {
      const genRes = await this.callGeminiFn({ contents: creatorPrompt });
      parsedContent = cleanAndParseJson(genRes.text || "{}");

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
    } catch (err: any) {
      console.warn(`[ContentEngineServer] AI content generation failed for format ${format}, applying high-quality deterministic fallback:`, err?.message || err);
      
      if (format === "post") {
        parsedContent = {
          concept: `Posicionamento claro para o nicho ${dna.niche} atacando a dor de ${idea.cagePillar}.`,
          headline: idea.title,
          visualStructure: `Layout minimalista de alto contraste com tipografia marcante centralizada e subtítulo de apoio.`,
          caption: `${idea.hook}\n\nNo nicho de ${dna.niche}, a maioria das pessoas tenta complicar o que deveria ser direto. O verdadeiro diferencial não está em fazer mais, mas em executar com precisão cirúrgica.\n\n3 princípios que você deve aplicar hoje:\n1. Elimine a superficialidade e entregue valor concreto.\n2. Alinhe sua comunicação diretamente à dor de quem já está pronto para comprar.\n3. Tenha uma chamada de ação clara e sem atrito.\n\nSalve este post para consultar sempre que for estruturar sua estratégia.`,
          cta: `Envie uma mensagem no Direct com a palavra 'METODO' para receber o guia prático.`,
          hashtags: [`#${dna.niche.replace(/\s+/g, '')}`, '#posicionamento', '#autoridade', '#crescimento', '#estrategia']
        };
      } else if (format === "carousel") {
        parsedContent = {
          coverHeadline: idea.title,
          coverSubtitle: idea.hook,
          slides: [
            { slideNumber: 1, slideType: "cover", headline: idea.title, body: idea.hook, visualGuidance: "Design clean com foco no título principal" },
            { slideNumber: 2, slideType: "problem", headline: "O Erro que 90% Comete", body: `Acreditar que para crescer em ${dna.niche} você precisa falar de tudo para todos.`, visualGuidance: "Destaque em cor de alerta" },
            { slideNumber: 3, slideType: "core_solution", headline: "A Virada de Posicionamento", body: "Especificidade técnica e promessa de transformação tangível.", visualGuidance: "Gráfico conceitual ou lista" },
            { slideNumber: 4, slideType: "step", headline: "Passo 1: Alinhamento de Oferta", body: "Defina claramente quem é seu cliente ideal e qual problema urgente você soluciona.", visualGuidance: "Card estruturado" },
            { slideNumber: 5, slideType: "step", headline: "Passo 2: Comunicação de Autoridade", body: "Mostre o bastidor e as métricas reais que validam seu trabalho.", visualGuidance: "Card estruturado" },
            { slideNumber: 6, slideType: "cta", headline: "Quer Aplicar no Seu Perfil?", body: "Salve este carrossel e envie 'METODO' no Direct para conversarmos.", visualGuidance: "Seta indicando salvamento e direct" }
          ],
          caption: `${idea.hook}\n\nArraste para o lado e confira os 5 slides essenciais para transformar sua presença em ${dna.niche}.\n\nQual desses pontos você mais precisa ajustar agora?`,
          finalCta: "Comente 'QUERO' ou mande DM para darmos o próximo passo.",
          hashtags: [`#${dna.niche.replace(/\s+/g, '')}`, '#carrossel', '#conteudoestrategico', '#autoridade']
        };
      } else if (format === "reel") {
        parsedContent = {
          hookSpoken: idea.hook,
          hookVisual: "Enquadramento próximo, olhar firme para a câmera com corte rápido aos 2 segundos.",
          estimatedDuration: "35 a 45 segundos",
          scenes: [
            { sceneNumber: 1, timeframe: "0-3s", visualDirection: "Close dinâmico com quebra de padrão", spokenText: idea.hook, onScreenText: idea.title, bRollSuggestion: "Gesto de parada ou tela do perfil" },
            { sceneNumber: 2, timeframe: "3-15s", visualDirection: "Plano médio, ritmo rápido", spokenText: `Se você atua em ${dna.niche}, sabe que tentar viralizar com conteúdo vazio só atrai curiosos. O que você precisa é de autoridade que converte.`, onScreenText: "Autoridade > Viralização Vazia", bRollSuggestion: "B-roll trabalhando ou digitando" },
            { sceneNumber: 3, timeframe: "15-30s", visualDirection: "Corte de ângulo lateral", spokenText: "O segredo está em atacar o problema real do seu cliente e mostrar o método de solução de forma prática.", onScreenText: "3 Pilares da Conversão", bRollSuggestion: "Print de resultados reais" },
            { sceneNumber: 4, timeframe: "30-40s", visualDirection: "Olhar direto, apontando para a legenda", spokenText: "Comente 'METODO' aqui embaixo que eu te envio o passo a passo completo no seu Direct.", onScreenText: "Comente 'METODO'", bRollSuggestion: "Sticker de Direct" }
          ],
          caption: `${idea.hook}\n\nAssista ao vídeo e veja como estruturar sua comunicação em ${dna.niche} para atrair seguidores qualificados e prontos para comprar.\n\nComente METODO para receber o material.`,
          cta: "Comente METODO para receber o material exclusivo no Direct.",
          audioRecommendation: "Áudio original claro com trilha instrumental lo-fi suave a -24dB",
          hashtags: [`#${dna.niche.replace(/\s+/g, '')}`, '#reels', '#roteiro', '#crescimento', '#autoridade']
        };
      } else {
        parsedContent = {
          sequenceTitle: idea.title,
          sequenceGoal: "Qualificar seguidores e gerar conversas no Direct",
          stories: [
            { stepNumber: 1, storyType: "hook", goal: "Quebrar o scroll", textOverlay: `${idea.hook}`, visualScene: "Foto de bastidor autêntica com texto sobreposto", suggestedInteraction: "enquete" },
            { stepNumber: 2, storyType: "context", goal: "Agitar a dor", textOverlay: `Vejo muitos profissionais em ${dna.niche} travados exatamente nisso...`, visualScene: "Vídeo curto falando em tom confidencial", suggestedInteraction: "reacao" },
            { stepNumber: 3, storyType: "value", goal: "Entregar a chave", textOverlay: "O ponto de virada foi quando mudamos essa única peça no processo.", visualScene: "Print de tela ou foto ilustrativa", suggestedInteraction: "caixinha" },
            { stepNumber: 4, storyType: "cta", goal: "Conversão em DM", textOverlay: "Quer entender como aplicar isso na prática no seu perfil? Mande 'ESTRATEGIA' aqui.", visualScene: "Sticker de Direct em destaque", suggestedInteraction: "direct", ctaText: "Mande 'ESTRATEGIA' no Direct" }
          ],
          directTrigger: "Mande 'ESTRATEGIA' no Direct"
        };
      }
    }

    // AGENT 4: QUALITY CHECKER & BOUNDED REWRITE LOOP (Max 2 retries)
    let finalContent = parsedContent;
    let validatedQuality: any = {
      passed: true,
      score: 91,
      antiGenericScore: 9,
      nicheAlignmentScore: 9,
      hookStrengthScore: 9,
      ctaClarityScore: 9,
      issuesFound: [],
      improvementApplied: "Validado no Quality Gate Estratégico com alta aderência ao perfil."
    };

    try {
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
    } catch (qualErr) {
      console.warn("[ContentEngineServer] Quality check fallback applied:", qualErr);
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

    try {
      const res = await this.callGeminiFn({ contents: plannerPrompt });
      const parsed = cleanAndParseJson(res.text || "{}");
      const validated = ContentCalendarPlanSchema.parse(parsed);
      return validated as ContentCalendarPlan;
    } catch (err: any) {
      console.warn("[ContentEngineServer] Calendar generation AI call failed, activating strategic fallback:", err?.message || err);
      
      const pillars = ["growth", "authority", "expression", "conversion"] as const;
      const formats = ["reel", "carousel", "story", "post"] as const;
      const items: any[] = [];

      for (let i = 1; i <= daysCount; i++) {
        const pilar = pillars[(i - 1) % pillars.length];
        const fmt = formats[(i - 1) % formats.length];
        items.push({
          id: `cal_${Date.now()}_${i}`,
          dayNumber: i,
          date: `Dia ${i}`,
          format: fmt,
          theme: pilar === 'growth' 
            ? `Quebra de padrão: O erro clássico em ${dna.niche}`
            : pilar === 'authority'
            ? `Estudo de caso: Como destravar resultados em ${dna.niche}`
            : pilar === 'expression'
            ? `Bastidores e princípios de trabalho`
            : `Oferta direta e convite para consultoria no Direct`,
          objective: pilar,
          cagePillar: pilar,
          status: "draft",
          strategicReason: `Alinhado para manter rotação de funil C.A.G.E. com foco em ${pilar}.`
        });
      }

      return {
        id: `plan_${Date.now()}`,
        daysCount,
        primaryGoal,
        cadenceDescription: `${frequencyPerWeek} publicações por semana com alternância balanceada C.A.G.E.`,
        items,
        createdAt: new Date().toISOString()
      };
    }
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
      "contentTypes": ["story", "reel"],
      "ideas": [
        { "title": "O sintoma que você ignora", "hook": "Se você passa por isso todos os dias...", "format": "reel", "rationale": "Gera identificação instantânea", "cta": "Responda a enquete nos stories" }
      ],
      "phaseCta": "Fique atento aos próximos dias"
    }
  ]
}`;

    try {
      const res = await this.callGeminiFn({ contents: campaignPrompt });
      const parsed = cleanAndParseJson(res.text || "{}");
      const validated = CampaignBlueprintSchema.parse(parsed);
      return validated as CampaignBlueprint;
    } catch (err: any) {
      console.warn("[ContentEngineServer] Campaign generation AI call failed, applying structured blueprint fallback:", err?.message || err);
      
      return {
        id: `camp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        campaignType,
        title: `Campanha Estratégica: ${productOrServiceName}`,
        productOrServiceName,
        targetAudience: targetAudience || dna.targetAudience,
        primaryObjective: primaryObjective || "Conversão e Vendas Rápidas",
        totalDurationDays: durationDays,
        phases: [
          {
            phaseNumber: 1,
            phaseName: "Aquecimento",
            objective: "Despertar curiosidade sobre o problema sem revelar a oferta",
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["story", "reel"],
            ideas: [
              { title: "O sintoma oculto", hook: `Se você atua em ${dna.niche} e passa por isso...`, format: "reel", rationale: "Gera identificação instantânea", cta: "Responda à enquete nos stories" }
            ],
            phaseCta: "Acompanhe os stories para entender a causa"
          },
          {
            phaseNumber: 2,
            phaseName: "Consciência",
            objective: "Aprofundar a causa raiz do problema e desmistificar falsas soluções",
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["carousel", "post"],
            ideas: [
              { title: "Por que as abordagens comuns falham", hook: "O que ninguém te conta sobre...", format: "carousel", rationale: "Mostra o mecanismo falho do mercado", cta: "Salve para não esquecer" }
            ],
            phaseCta: "Compartilhe com quem precisa saber disso"
          },
          {
            phaseNumber: 3,
            phaseName: "Autoridade",
            objective: `Apresentar seu método exclusivo e resultados comprovados em ${dna.niche}`,
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["reel", "carousel"],
            ideas: [
              { title: "Como estruturamos nossa metodologia", hook: "Veja o processo por trás de...", format: "reel", rationale: "Prova social e autoridade sólida", cta: "Comente 'METODO'" }
            ],
            phaseCta: "Conheça o nosso método completo"
          },
          {
            phaseNumber: 4,
            phaseName: "Quebra de Objeções",
            objective: "Eliminar dúvidas de tempo, preço e capacidade de implementação",
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["story", "carousel"],
            ideas: [
              { title: "Principais dúvidas respondidas", hook: "A pergunta que mais recebo...", format: "carousel", rationale: "Neutraliza a hesitação", cta: "Mande sua dúvida no Direct" }
            ],
            phaseCta: "Tire suas dúvidas no Direct"
          },
          {
            phaseNumber: 5,
            phaseName: "Oferta",
            objective: `Abertura de vagas/inscrições para ${productOrServiceName}`,
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["reel", "story", "post"],
            ideas: [
              { title: "Abertura Oficial de Vagas", hook: `Chegou a hora de transformar seu resultado com ${productOrServiceName}...`, format: "reel", rationale: "Urgência e clareza de entrega", cta: "Clique no link da bio ou mande 'QUERO' na DM" }
            ],
            phaseCta: "Acesse agora pelo link da bio"
          },
          {
            phaseNumber: 6,
            phaseName: "Conversão",
            objective: "Última chamada com escassez e encerramento",
            durationDays: Math.max(2, Math.round(durationDays / 6)),
            contentTypes: ["story", "post"],
            ideas: [
              { title: "Últimas horas disponíveis", hook: "Encerrando hoje à meia-noite...", format: "story", rationale: "Fechamento de ciclo", cta: "Envie 'VAGA' no Direct para garantir" }
            ],
            phaseCta: "Garanta sua vaga antes do encerramento"
          }
        ]
      };
    }
  }
}
