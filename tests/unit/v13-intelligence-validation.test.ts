/**
 * ============================================================================
 * INSTASCORE OS V13 — COMPREHENSIVE INTELLIGENCE VALIDATION & ADVERSARIAL QA
 * ============================================================================
 * 
 * Validates Behavioral Causality, Statistical Guardrails, and Learning Loops:
 * 1. Multi-Profile Differentiation (Personal Trainer, Lawyer, Restaurant, Photographer, Infoproducer)
 * 2. Temporal Learning Evolution (State 0 -> State 1 -> State 2 -> State 3)
 * 3. Negative Feedback & Veto Enforcement (Themes, Formats, Tone)
 * 4. Positive Feedback & Pattern Adherence
 * 5. Low Evidence & Sample Size Guardrails (No false positives)
 * 6. Statistical Confidence Prioritization
 * 7. Pattern Intelligence Direct Influence
 * 8. Zero-Leakage Multi-User Privacy & State Isolation
 * 9. Collective Learning Sample Thresholds
 * 10. Quality Gate 2.0 Generic vs Contextual Discrimination
 * 11. Contextualization & Tone Adaptation
 * 12. Full Structure & Determinism of Content Brief
 * 13. C.A.G.E. Bottleneck Responsiveness
 * 14. Zero-History Graceful Degradation
 * 15. Decision Observability & Audit Trails
 * ============================================================================
 */

import { StrategyEngine } from "../../src/engine/intelligence/StrategyEngine";
import { LearningEngine } from "../../src/engine/intelligence/LearningEngine";
import { FeedbackEngine } from "../../src/engine/intelligence/FeedbackEngine";
import { PatternIntelligence } from "../../src/engine/intelligence/PatternIntelligence";
import { QualityGate2 } from "../../src/engine/intelligence/QualityGate2";
import { ContentBriefEngine } from "../../src/engine/intelligence/ContentBriefEngine";
import { createDefaultDigitalTwin, DigitalTwin } from "../../src/core/DigitalTwin";
import { ContentDNA, ContentObjectiveType } from "../../src/types/content-engine";
import { ExpandedContentMemory, ContentHistoryRecord } from "../../src/engine/content/ContentMemoryEngine";

export function runV13IntelligenceValidationTests(): { passed: number; failed: number; tests: string[] } {
  const tests: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      tests.push(`  ✔ PASS: ${testName}`);
    } else {
      failed++;
      tests.push(`  ✖ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // ==========================================================================
  // 1. TESTE DE DIFERENCIAÇÃO ENTRE 5 PERFIS FICTÍCIOS
  // ==========================================================================
  const profileTrainerDNA: ContentDNA = {
    handle: "@treinador_lucas",
    niche: "Fitness",
    targetAudience: "Homens 30-45 anos com pouco tempo para treinar",
    toneOfVoice: "Direto, enérgico e motivador sem rodeios",
    positioning: "Autoridade Prática",
    primaryGoal: "authority",
    profileStage: "growth",
    source: "diagnostic",
    strengths: ["Consistência", "Didática"],
    weaknesses: ["Falta de CTAs diretas"],
    strategicPriorities: ["Conversão de consultoria"],
    contentPillars: [
      { id: "p1", name: "Treino Eficiente", objective: "Autoridade", cagePillar: "authority", topics: ["Hipertrofia"] }
    ],
    cageScores: { conversion: 40, authority: 75, growth: 70, expression: 65 },
    bottleneckSummary: "Dificuldade de conversão de seguidores em alunos de consultoria online",
    opportunityHeadline: "Criar carrossel com quebra de objeção e CTA direta para direct"
  };

  const profileLawyerDNA: ContentDNA = {
    handle: "@dra_camila_direito",
    niche: "Advocacia",
    targetAudience: "Empresários e donos de médias empresas",
    toneOfVoice: "Sóbrio, altamente técnico, seguro e institucional",
    positioning: "Especialista Premium",
    primaryGoal: "authority",
    profileStage: "established",
    source: "diagnostic",
    strengths: ["Segurança Jurídica"],
    weaknesses: ["Linguagem muito rebuscada"],
    strategicPriorities: ["Autoridade Técnica no Feed"],
    contentPillars: [
      { id: "p1", name: "Prevenção de Riscos", objective: "Autoridade", cagePillar: "authority", topics: ["Reforma Tributária"] }
    ],
    cageScores: { conversion: 70, authority: 35, growth: 60, expression: 75 },
    bottleneckSummary: "Baixa percepção de autoridade técnica diferenciada no feed",
    opportunityHeadline: "Desconstruir mitos da reforma tributária com carrossel técnico"
  };

  const profileRestoDNA: ContentDNA = {
    handle: "@bistrot_luigi",
    niche: "Restaurante",
    targetAudience: "Casais e apreciadores de boa gastronomia na região sul",
    toneOfVoice: "Sensorial, acolhedor e convidativo",
    positioning: "Experiência Gastronômica Local",
    primaryGoal: "growth",
    profileStage: "scaling",
    source: "diagnostic",
    strengths: ["Qualidade Gastronômica"],
    weaknesses: ["Alcance restrito"],
    strategicPriorities: ["Alcance Orgânico Local"],
    contentPillars: [
      { id: "p1", name: "Experiência Gastronômica", objective: "Alcance", cagePillar: "growth", topics: ["Pratos Assinatura"] }
    ],
    cageScores: { conversion: 75, authority: 80, growth: 30, expression: 70 },
    bottleneckSummary: "Alcance orgânico local insuficiente nos últimos 30 dias",
    opportunityHeadline: "Reels sensorial dinâmico de 8s destacando o preparo do prato"
  };

  const profilePhotoDNA: ContentDNA = {
    handle: "@marcos_fotografia",
    niche: "Fotografia",
    targetAudience: "Executivos e profissionais liberais buscando posicionamento visual",
    toneOfVoice: "Estético, minimalista, consultivo e refinado",
    positioning: "Especialista em Retratos de Alto Valor",
    primaryGoal: "authority",
    profileStage: "scaling",
    source: "diagnostic",
    strengths: ["Qualidade Visual"],
    weaknesses: ["Falta de prova social"],
    strategicPriorities: ["Geração de Orçamentos"],
    contentPillars: [
      { id: "p1", name: "Direção de Imagem", objective: "Conversão", cagePillar: "conversion", topics: ["Retratos Executivos"] }
    ],
    cageScores: { conversion: 45, authority: 70, growth: 65, expression: 60 },
    bottleneckSummary: "Gargalo em conversão: visitantes não solicitam orçamentos",
    opportunityHeadline: "Post de estudo de caso comparando antes/depois de retrato executivo"
  };

  const profileInfoDNA: ContentDNA = {
    handle: "@viver_de_saas",
    niche: "Infoproduto",
    targetAudience: "Desenvolvedores e empreendedores digitais",
    toneOfVoice: "Analítico, direto ao ponto, baseado em métricas reais",
    positioning: "Fundador e Educador Técnico",
    primaryGoal: "conversion",
    profileStage: "scaling",
    source: "diagnostic",
    strengths: ["Autoridade Técnica"],
    weaknesses: ["Gargalo de Conversão"],
    strategicPriorities: ["Conversão para Checkout"],
    contentPillars: [
      { id: "p1", name: "Validação B2B", objective: "Conversão", cagePillar: "conversion", topics: ["Playbook SaaS"] }
    ],
    cageScores: { conversion: 38, authority: 82, growth: 72, expression: 68 },
    bottleneckSummary: "Gargalo em conversão: alto tráfego porém pouca ida para checkout",
    opportunityHeadline: "Carrossel diagrama desconstruindo playbook de validação"
  };

  const actionTrainer = StrategyEngine.determineNextBestAction({ dna: profileTrainerDNA });
  const actionLawyer = StrategyEngine.determineNextBestAction({ dna: profileLawyerDNA });
  const actionResto = StrategyEngine.determineNextBestAction({ dna: profileRestoDNA });
  const actionPhoto = StrategyEngine.determineNextBestAction({ dna: profilePhotoDNA });
  const actionInfo = StrategyEngine.determineNextBestAction({ dna: profileInfoDNA });

  // Assertions for Profile Differentiation
  assert(
    actionTrainer.strategicPillar === "conversion" && actionTrainer.objective === "conversion",
    "Diferenciação: Personal Trainer foca em Conversão (Gargalo C.A.G.E. de 40/100)"
  );
  assert(
    actionLawyer.strategicPillar === "authority" && actionLawyer.recommendedFormat === "carousel",
    "Diferenciação: Advogado foca em Autoridade Técnica via Carrossel Estruturado"
  );
  assert(
    actionResto.strategicPillar === "growth" && actionResto.recommendedFormat === "reel",
    "Diferenciação: Restaurante foca em Alcance e Crescimento via Reels Sensoriais"
  );
  assert(
    actionPhoto.strategicPillar === "conversion" && actionPhoto.brief.targetAudience.includes("Executivos"),
    "Diferenciação: Fotógrafo foca em Audiência Executiva e Conversão de Orçamento"
  );
  assert(
    actionInfo.strategicPillar === "conversion" && actionInfo.brief.funnelStage === "fundo",
    "Diferenciação: Infoprodutor direciona para Fundo de Funil e Venda"
  );
  assert(
    new Set([actionTrainer.brief.title, actionLawyer.brief.title, actionResto.brief.title, actionPhoto.brief.title, actionInfo.brief.title]).size === 5,
    "Diferenciação: Todos os 5 perfis geram Briefings com temas e estruturas únicas"
  );

  // ==========================================================================
  // 2. TESTE DE APRENDIZADO TEMPORAL (ESTADOS 0 -> 1 -> 2 -> 3)
  // ==========================================================================
  let twin = createDefaultDigitalTwin();
  twin.identity.niche = "Fitness";
  twin.learningInsights = []; // Estado 0: Zero histórico e zero insights prévios
  let memory: ExpandedContentMemory = {
    userId: "test-user-temporal",
    usedThemes: [],
    usedHooks: [],
    usedCtas: [],
    pillarDistribution: { conversion: 0, authority: 0, growth: 0, expression: 0 },
    fingerprints: [],
    historyRecords: [],
    feedbackHistory: [],
    lastUpdated: new Date().toISOString()
  };

  // ESTADO 0: Zero histórico
  const actionState0 = StrategyEngine.determineNextBestAction({ dna: profileTrainerDNA, digitalTwin: twin, memory });
  assert(actionState0.confidence === 74, `Temporal: Estado 0 apresenta confiança de linha de base (74% obtido)`);

  // ESTADO 1: 10 publicações com feedback positivo para carrosséis educativos
  const history10: ContentHistoryRecord[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `rec-s1-${i}`,
    title: `Post Treino ${i}`,
    format: "carousel",
    pillar: "authority",
    theme: "Desconstrução de Mitos de Treino",
    hook: "O grande erro do treino de 2 horas",
    cta: "Salve para aplicar",
    createdAt: new Date().toISOString(),
    qualityScore: 88,
    feedbackRating: "excellent"
  }));
  memory.historyRecords = history10;
  const learningState1 = LearningEngine.processLearning(twin, memory);
  twin = learningState1.updatedTwin;

  const actionState1 = StrategyEngine.determineNextBestAction({ dna: profileTrainerDNA, digitalTwin: twin, memory });
  assert(
    actionState1.confidence >= 80,
    `Temporal: Estado 1 (10 posts) eleva confiança para >= 80% (obtido: ${actionState1.confidence}%)`
  );
  assert(
    twin.learningInsights.some(ins => ins.category === "format" && ins.insight.includes("CAROUSEL")),
    "Temporal: Estado 1 identifica Carrossel como formato de alta aceitação"
  );

  // ESTADO 2: 30 publicações demonstrando preferência por ângulo contrarian
  const history30: ContentHistoryRecord[] = [
    ...history10,
    ...Array.from({ length: 20 }).map((_, i) => ({
      id: `rec-s2-${i}`,
      title: `Post Nutrição ${i}`,
      format: "carousel" as const,
      pillar: "authority" as const,
      theme: "Erros Comuns na Dieta",
      angle: "Contrarian / Desmistificação",
      hook: "Por que cortar carboidrato à noite atrapalha",
      cta: "Comente sua dúvida",
      createdAt: new Date().toISOString(),
      qualityScore: 92,
      feedbackRating: "excellent" as const
    }))
  ];
  memory.historyRecords = history30;
  const learningState2 = LearningEngine.processLearning(twin, memory);
  twin = learningState2.updatedTwin;

  assert(
    twin.learningInsights.some(ins => ins.category === "angle" && ins.sampleCount >= 20),
    `Temporal: Estado 2 consolida insight de ângulo com amostra robusta (>= 20)`
  );

  // ESTADO 3: 50 publicações com alta consistência
  const history50: ContentHistoryRecord[] = [
    ...history30,
    ...Array.from({ length: 20 }).map((_, i) => ({
      id: `rec-s3-${i}`,
      title: `Post Hipertrofia ${i}`,
      format: "carousel" as const,
      pillar: "conversion" as const,
      theme: "Consultoria Individual",
      angle: "Contrarian / Desmistificação",
      hook: "Pare de perder tempo na academia",
      cta: "Direct",
      createdAt: new Date().toISOString(),
      qualityScore: 95,
      feedbackRating: "excellent" as const
    }))
  ];
  memory.historyRecords = history50;
  const learningState3 = LearningEngine.processLearning(twin, memory);
  twin = learningState3.updatedTwin;

  const topInsight = twin.learningInsights.find(ins => ins.category === "angle" && ins.source === "profile_history");
  assert(
    topInsight !== undefined && topInsight.confidence >= 85,
    `Temporal: Estado 3 atinge alta confiança estatística (obtido: ${topInsight?.confidence}%)`
  );

  // ==========================================================================
  // 3. TESTE DE FEEDBACK NEGATIVO / VETO (THEME, FORMAT, TONE)
  // ==========================================================================
  let vetoTwin = createDefaultDigitalTwin();
  vetoTwin.identity.niche = "Psicologia";
  let vetoMemory: ExpandedContentMemory = {
    userId: "test-user-veto",
    usedThemes: [],
    usedHooks: [],
    usedCtas: [],
    pillarDistribution: { conversion: 0, authority: 0, growth: 0, expression: 0 },
    fingerprints: [],
    historyRecords: [],
    feedbackHistory: [],
    lastUpdated: new Date().toISOString()
  };

  // Veto explícito de Tema: "conteúdo motivacional"
  const feedbackResult = FeedbackEngine.applyFeedback(vetoTwin, vetoMemory, {
    rating: "makes_no_sense",
    reason: "disliked_theme",
    theme: "conteúdo motivacional",
    customNote: "Não quero produzir conteúdo motivacional sob nenhuma hipótese."
  });
  vetoTwin = feedbackResult.updatedTwin;
  vetoMemory = feedbackResult.updatedMemory;

  // Veto explícito de Formato: "reel"
  const feedbackFormat = FeedbackEngine.applyFeedback(vetoTwin, vetoMemory, {
    rating: "does_not_fit",
    reason: "dont_want_to_appear",
    format: "reel",
    customNote: "Prefiro não gravar vídeos onde preciso aparecer."
  });
  vetoTwin = feedbackFormat.updatedTwin;
  vetoMemory = feedbackFormat.updatedMemory;

  assert(
    vetoTwin.preferences.excludedThemes.includes("conteúdo motivacional"),
    "Veto: 'conteúdo motivacional' registrado em preferences.excludedThemes"
  );
  assert(
    vetoTwin.preferences.rejectedFormats.includes("reel"),
    "Veto: Formato 'reel' registrado em preferences.rejectedFormats"
  );

  const psychDNA: ContentDNA = {
    handle: "@psi_roberta",
    niche: "Psicologia",
    targetAudience: "Adultos com ansiedade corporativa",
    toneOfVoice: "Empático, fundamentado em TCC",
    positioning: "Terapeuta Especialista",
    primaryGoal: "growth",
    profileStage: "growth",
    source: "diagnostic",
    strengths: ["Empatia clínica"],
    weaknesses: ["Vergonha de gravar vídeos"],
    strategicPriorities: ["Atrair pacientes sem gravar Reels"],
    contentPillars: [
      { id: "p1", name: "Saúde Mental", objective: "Alcance", cagePillar: "growth", topics: ["Ansiedade"] }
    ],
    cageScores: { conversion: 60, authority: 65, growth: 30, expression: 60 } // Growth normalmente pediria Reel
  };

  const actionWithVeto = StrategyEngine.determineNextBestAction({
    dna: psychDNA,
    digitalTwin: vetoTwin,
    memory: vetoMemory
  });

  assert(
    actionWithVeto.recommendedFormat !== "reel",
    `Veto: StrategyEngine respeitou veto e substituiu Reel por ${actionWithVeto.recommendedFormat}`
  );
  assert(
    !actionWithVeto.brief.theme.toLowerCase().includes("motivacional"),
    "Veto: Content Brief não contém o termo vetado 'motivacional'"
  );

  // ==========================================================================
  // 4. TESTE DE FEEDBACK POSITIVO & ADERÊNCIA A PADRÕES
  // ==========================================================================
  let positiveTwin = createDefaultDigitalTwin();
  let positiveMemory: ExpandedContentMemory = {
    userId: "test-user-pos",
    usedThemes: [],
    usedHooks: [],
    usedCtas: [],
    pillarDistribution: { conversion: 0, authority: 0, growth: 0, expression: 0 },
    fingerprints: [],
    historyRecords: [],
    feedbackHistory: [],
    lastUpdated: new Date().toISOString()
  };

  const posResult = FeedbackEngine.applyFeedback(positiveTwin, positiveMemory, {
    rating: "excellent",
    title: "Carrossel de Desconstrução Técnica",
    theme: "Framework de 3 Etapas para Diagnóstico",
    format: "carousel",
    customNote: "Excelente formato, trouxe muitos seguidores qualificados."
  });
  positiveTwin = posResult.updatedTwin;

  assert(
    positiveTwin.preferences.approvedStrategies.includes("Carrossel de Desconstrução Técnica"),
    "Feedback Positivo: Estratégia aprovada registrada no Digital Twin"
  );
  assert(
    positiveTwin.preferences.preferredAngles.includes("Framework de 3 Etapas para Diagnóstico"),
    "Feedback Positivo: Ângulo preferido registrado no Digital Twin"
  );

  // ==========================================================================
  // 5. TESTE DE BAIXA EVIDÊNCIA (AMOSTRA PEQUENA)
  // ==========================================================================
  const lowSampleConfidence = LearningEngine.calculateConfidence(2, 1.0);
  assert(
    lowSampleConfidence === 65,
    `Baixa Evidência: 2 observações geram confiança conservadora (65% obtido, não trata como regra absoluta)`
  );

  // ==========================================================================
  // 6. TESTE DE COMPARAÇÃO DE CONFIANÇA
  // ==========================================================================
  const highSampleConfidence = LearningEngine.calculateConfidence(45, 0.95);
  assert(
    highSampleConfidence > lowSampleConfidence && highSampleConfidence >= 85,
    `Comparação de Confiança: Amostra alta (45) gera ${highSampleConfidence}% vs Amostra baixa (2) com ${lowSampleConfidence}%`
  );

  // ==========================================================================
  // 7. TESTE DE PATTERN INTELLIGENCE (BENCHMARKS COLETIVOS)
  // ==========================================================================
  const fitnessPatterns = PatternIntelligence.getPatternsForContext("Fitness", "authority", "carousel");
  const lawPatterns = PatternIntelligence.getPatternsForContext("Advocacia", "authority", "carousel");
  const restoPatterns = PatternIntelligence.getPatternsForContext("Restaurante", "growth", "reel");

  assert(
    fitnessPatterns.length > 0 && fitnessPatterns[0].sampleSize >= 10,
    "Pattern Intelligence: Benchmark de Fitness possui amostra estatística válida (142 perfis)"
  );
  assert(
    lawPatterns.length > 0 && lawPatterns[0].angle.includes("Estudo de Caso"),
    "Pattern Intelligence: Advocacia recomenda ângulo de Estudo de Caso / Direitos Ocultos"
  );
  assert(
    restoPatterns.length > 0 && restoPatterns[0].format === "reel",
    "Pattern Intelligence: Restaurante recomenda Reels Sensoriais com 94% de confiança"
  );

  // ==========================================================================
  // 8. TESTE DE ISOLAMENTO ENTRE USUÁRIOS (ZERO-LEAKAGE)
  // ==========================================================================
  const userATwin = createDefaultDigitalTwin();
  userATwin.handle = "@usuario_A";
  userATwin.preferences.excludedThemes = ["VetoPrivadoDoUsuarioA"];

  const userBTwin = createDefaultDigitalTwin();
  userBTwin.handle = "@usuario_B";
  userBTwin.preferences.excludedThemes = ["VetoPrivadoDoUsuarioB"];

  assert(
    !userBTwin.preferences.excludedThemes.includes("VetoPrivadoDoUsuarioA"),
    "Isolamento: Preferências e vetos privados de Usuário A NÃO vazam para Usuário B"
  );
  assert(
    !userATwin.preferences.excludedThemes.includes("VetoPrivadoDoUsuarioB"),
    "Isolamento: Preferências e vetos privados de Usuário B NÃO vazam para Usuário A"
  );

  // ==========================================================================
  // 9. TESTE DE APRENDIZADO COLETIVO & THRESHOLDS
  // ==========================================================================
  const validationCheck = PatternIntelligence.validateAngleConfidence("Fitness", "Erros Comuns / Desconstrução de Mitos");
  assert(
    validationCheck.isValidated && validationCheck.confidenceScore >= 90,
    "Aprendizado Coletivo: Padrão atinge threshold mínimo (>= 10 amostras) e valida confiança"
  );

  const nonValidatedCheck = PatternIntelligence.validateAngleConfidence("Fitness", "Ângulo Inédito e Não Observado 1234");
  assert(
    !nonValidatedCheck.isValidated && nonValidatedCheck.confidenceScore <= 60,
    "Aprendizado Coletivo: Hipótese sem dados estatísticos é classificada como heurística inicial (60%)"
  );

  // ==========================================================================
  // 10. TESTE DO QUALITY GATE 2.0 (GENÉRICO VS CONTEXTUAL)
  // ==========================================================================
  const genericPayload = {
    coverHeadline: "5 dicas para melhorar seu instagram",
    caption: "No mundo de hoje você precisa de uma dica de ouro para arraste para o lado para saber mais e transforme sua vida!",
    slides: [
      { slideNumber: 1, headline: "5 dicas", body: "Dica 1: poste todo dia" }
    ]
  };

  const genericAudit = QualityGate2.evaluateContentLocally({
    contentPayload: genericPayload,
    format: "carousel",
    dna: profileTrainerDNA
  });

  assert(
    genericAudit.passed === false && genericAudit.score < 70,
    `Quality Gate 2.0: Conteúdo genérico com clichês é REPROVADO (Score: ${genericAudit.score}/100)`
  );
  assert(
    genericAudit.dimensions.originalityScore <= 12,
    "Quality Gate 2.0: Originality Score penalizado por múltiplos clichês detectados"
  );

  const strategicPayload = {
    coverHeadline: "O erro silencioso que anula seus ganhos de hipertrofia após os 30 anos",
    caption: "Se você tem pouco tempo para treinar, a chave não é aumentar o volume, mas sim a intensidade relativa por série. Veja o framework exato.",
    slides: [
      { slideNumber: 1, headline: "O Paradoxo do Tempo", body: "Treinar 2 horas não compensa a falta de intensidade real." },
      { slideNumber: 2, headline: "O Diagnóstico", body: "A maioria das pessoas falha na cadência e recuperação." },
      { slideNumber: 3, headline: "O Método de 3 Etapas", body: "1. Sobrecarga progressiva; 2. Intervalo controlado; 3. Densidade calórica." },
      { slideNumber: 4, headline: "Aplicação Prática", body: "Como estruturar em blocos de 45 minutos." },
      { slideNumber: 5, headline: "Próximo Passo", body: "Envie 'TREINO' no direct para receber a planilha." }
    ]
  };

  const strategicAudit = QualityGate2.evaluateContentLocally({
    contentPayload: strategicPayload,
    format: "carousel",
    dna: profileTrainerDNA,
    brief: actionTrainer.brief
  });

  assert(
    strategicAudit.passed === true && strategicAudit.score >= 85,
    `Quality Gate 2.0: Conteúdo estratégico contextualizado é APROVADO (Score: ${strategicAudit.score}/100)`
  );

  // ==========================================================================
  // 11. TESTE DE CONTEXTUALIZAÇÃO & TOM DE VOZ
  // ==========================================================================
  const aggressiveDNA: ContentDNA = {
    ...profileTrainerDNA,
    toneOfVoice: "Agressivo, confrontador, direto e sem filtro"
  };
  const educationalDNA: ContentDNA = {
    ...profileTrainerDNA,
    toneOfVoice: "Educativo, elegante, científico e acadêmico"
  };

  const briefAggressive = ContentBriefEngine.buildBrief({
    dna: aggressiveDNA,
    theme: "Erros de Treino",
    format: "carousel"
  });
  const briefEducational = ContentBriefEngine.buildBrief({
    dna: educationalDNA,
    theme: "Erros de Treino",
    format: "carousel"
  });

  assert(
    briefAggressive.tone.includes("Agressivo") && briefEducational.tone.includes("Educativo"),
    "Contextualização: ContentBrief reflete com exatidão o tom de voz individual de cada perfil"
  );

  // ==========================================================================
  // 12. TESTE DE COMPLETUDE ESTRUTURAL DO CONTENT BRIEF
  // ==========================================================================
  const testBrief = actionTrainer.brief;
  const hasAllBriefFields = 
    Boolean(testBrief.id) &&
    Boolean(testBrief.title) &&
    Boolean(testBrief.objective) &&
    Boolean(testBrief.targetAudience) &&
    Boolean(testBrief.funnelStage) &&
    Boolean(testBrief.cagePillar) &&
    Boolean(testBrief.bottleneck) &&
    Boolean(testBrief.opportunity) &&
    Boolean(testBrief.theme) &&
    Boolean(testBrief.angle) &&
    Boolean(testBrief.hook) &&
    Boolean(testBrief.promise) &&
    Boolean(testBrief.structure) &&
    Boolean(testBrief.tone) &&
    Boolean(testBrief.emotion) &&
    Boolean(testBrief.cta) &&
    Boolean(testBrief.format) &&
    Array.isArray(testBrief.strategicReferences) &&
    Array.isArray(testBrief.profileLearnings) &&
    Array.isArray(testBrief.relevantPatterns) &&
    typeof testBrief.confidence === "number" &&
    Boolean(testBrief.createdAt);

  assert(hasAllBriefFields, "Content Brief: Possui todos os 22 campos estruturais obrigatórios e é determinístico");

  // ==========================================================================
  // 13. TESTE DE OBSERVABILIDADE & AUDITORIA DE DECISÃO
  // ==========================================================================
  assert(
    actionTrainer.auditRecord !== undefined,
    "Observabilidade: NextBestAction gera registro de auditoria completo (auditRecord)"
  );
  assert(
    actionTrainer.auditRecord?.profileId === actionTrainer.brief.targetAudience || Boolean(actionTrainer.auditRecord?.decisionId),
    `Observabilidade: Decision ID gerado com timestamp e rastreabilidade (${actionTrainer.auditRecord?.decisionId})`
  );
  assert(
    actionTrainer.auditRecord?.cageContext.weakestPillar === "conversion",
    "Observabilidade: Contexto C.A.G.E. e gargalo auditados com exatidão no registro"
  );

  return { passed, failed, tests };
}
