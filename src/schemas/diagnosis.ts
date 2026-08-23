import { z } from "zod";

// Helper to normalize effort string ("baixo", "medio", "alto", "low", "medium", "high", etc.)
export const normalizeEffort = (val: unknown): "low" | "medium" | "high" => {
  if (typeof val !== "string") return "medium";
  const lower = val.toLowerCase().trim();
  if (lower.includes("low") || lower.includes("baix") || lower.includes("facil") || lower.includes("fácil") || lower.includes("simples")) {
    return "low";
  }
  if (lower.includes("high") || lower.includes("alt") || lower.includes("dificil") || lower.includes("difícil") || lower.includes("complex")) {
    return "high";
  }
  return "medium";
};

// Helper to normalize confidence (supports 0-1 or 0-100 scales)
export const normalizeConfidence = (val: unknown): number => {
  if (val === null || val === undefined || val === "") return 0.85;
  if (typeof val !== "number") {
    const num = Number(val);
    if (isNaN(num)) return 0.85;
    val = num;
  }
  let num = val as number;
  if (num > 1 && num <= 100) {
    num = num / 100;
  }
  return Math.min(1, Math.max(0, Number(num.toFixed(2))));
};

// Helper to normalize grade (0-4 integer or null)
export const normalizeGrade = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "null" || val === "" || val === "undefined") {
    return null;
  }
  const num = Number(val);
  if (isNaN(num)) return null;
  if (num < 0) return 0;
  if (num > 4) return 4;
  return Math.round(num);
};

export const EvaluationItemSchema = z.object({
  criterion_id: z.preprocess(val => typeof val === "string" ? val.trim() : String(val || ""), z.string().min(1)),
  grade: z.preprocess(normalizeGrade, z.union([z.number().int().min(0).max(4), z.null()])),
  confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1)),
  evidence: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Evidência identificada na análise do perfil.", z.string()),
  justification: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Justificativa estrutural baseada nas diretrizes do critério.", z.string()),
  epistemic_layer: z.object({
    evidence: z.string().optional(),
    justification: z.string().optional(),
    grade: z.string().optional()
  }).optional()
});

export const StrengthItemSchema = z.object({
  criterion_id: z.preprocess(val => typeof val === "string" ? val.trim() : String(val || ""), z.string().min(1)),
  title: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Ponto Forte Estrutural", z.string()),
  reason: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Elemento bem estruturado identificado no perfil.", z.string()),
  epistemic_layer: z.string().optional()
});

export const CriticalGapItemSchema = z.object({
  criterion_id: z.preprocess(val => typeof val === "string" ? val.trim() : String(val || ""), z.string().min(1)),
  title: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Oportunidade de Melhoria", z.string()),
  reason: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Gargalo que impacta a conversão ou autoridade.", z.string()),
  impact: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Redução no potencial de conversão e clareza.", z.string()),
  epistemic_layer: z.string().optional()
});

export const RecommendedActionItemSchema = z.object({
  criterion_id: z.preprocess(val => typeof val === "string" ? val.trim() : String(val || ""), z.string().min(1)),
  title: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Ação Recomendada", z.string()),
  instruction: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Implementar melhoria estrutural.", z.string()),
  effort: z.preprocess(normalizeEffort, z.enum(["low", "medium", "high"])),
  expected_effect: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Aumento na clareza e retenção do público.", z.string()),
  epistemic_layer: z.string().optional()
});

export const TomorrowActionSchema = z.object({
  criterion_id: z.preprocess(val => typeof val === "string" ? val.trim() : String(val || ""), z.string().min(1)),
  title: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Ação Imediata de Amanhã", z.string()),
  instruction: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Ajustar o elemento prioritário do perfil.", z.string()),
  epistemic_layer: z.string().optional()
});

// ==========================================
// NEW RESEARCH-INFORMED INTELLIGENCE SCHEMAS
// ==========================================

export const EvidenceSourceEnum = z.enum([
  'screenshot',
  'profile_input',
  'instagram_insights',
  'user_provided_data',
  'official_guideline'
]);

export const EvidenceTypeEnum = z.enum([
  'observed',
  'inferred',
  'hypothesis',
  'projection'
]);

export const normalizeEvidenceSource = (val: unknown): z.infer<typeof EvidenceSourceEnum> => {
  if (typeof val !== 'string') return 'screenshot';
  const lower = val.toLowerCase().trim();
  if (lower.includes('insight') || lower.includes('api')) return 'instagram_insights';
  if (lower.includes('user') || lower.includes('declar') || lower.includes('onboard')) return 'user_provided_data';
  if (lower.includes('profile') || lower.includes('input') || lower.includes('bio') || lower.includes('handle')) return 'profile_input';
  if (lower.includes('guideline') || lower.includes('oficial') || lower.includes('meta') || lower.includes('best_practice')) return 'official_guideline';
  return 'screenshot';
};

export const normalizeEvidenceType = (val: unknown): z.infer<typeof EvidenceTypeEnum> => {
  if (typeof val !== 'string') return 'observed';
  const lower = val.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes('hipot') || lower.includes('hypothesis') || lower.includes('supos')) return 'hypothesis';
  if (lower.includes('infer') || lower.includes('deduc') || lower.includes('tecnic')) return 'inferred';
  if (lower.includes('projec') || lower.includes('simul') || lower.includes('cenario')) return 'projection';
  return 'observed';
};

export const EvidenceSchema = z.object({
  id: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : `ev_${Math.random().toString(36).substring(2, 8)}`, z.string()),
  statement: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Evidência constatada na análise visual estrutural.", z.string()),
  source: z.preprocess(normalizeEvidenceSource, EvidenceSourceEnum),
  type: z.preprocess(normalizeEvidenceType, EvidenceTypeEnum),
  confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1)),
  limitation: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined, z.string().optional())
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const ContentFormatEnum = z.enum([
  'reel',
  'carousel',
  'story',
  'photo',
  'live',
  'profile'
]);

export const normalizeContentFormat = (val: unknown): z.infer<typeof ContentFormatEnum> => {
  if (typeof val !== 'string') return 'reel';
  const lower = val.toLowerCase().trim();
  if (lower.includes('carrossel') || lower.includes('carousel') || lower.includes('slides')) return 'carousel';
  if (lower.includes('stor')) return 'story';
  if (lower.includes('foto') || lower.includes('photo') || lower.includes('imagem') || lower.includes('feed_post')) return 'photo';
  if (lower.includes('live') || lower.includes('ao vivo') || lower.includes('transmissao')) return 'live';
  if (lower.includes('perfil') || lower.includes('profile') || lower.includes('bio') || lower.includes('destaque')) return 'profile';
  return 'reel';
};

export const ActionExperimentSchema = z.object({
  priority: z.preprocess(val => {
    if (typeof val !== 'string') return 'P0';
    const lower = val.toUpperCase().trim();
    if (lower.includes('P1') || lower.includes('1')) return 'P1';
    if (lower.includes('P2') || lower.includes('2')) return 'P2';
    return 'P0';
  }, z.enum(['P0', 'P1', 'P2'])),
  problem: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Gargalo estrutural identificado.", z.string()),
  evidenceIds: z.preprocess(val => {
    if (Array.isArray(val) && val.length > 0) return val.map(String);
    if (typeof val === 'string' && val.length > 0) return [val];
    return ['ev_observed_profile'];
  }, z.array(z.string()).min(1)),
  hypothesis: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Hipótese de teste editorial baseada no gargalo.", z.string()),
  action: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Implementar teste prático em 7 dias.", z.string()),
  format: z.preprocess(normalizeContentFormat, ContentFormatEnum),
  hook: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined, z.string().optional()),
  cta: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined, z.string().optional()),
  primaryMetric: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Taxa de cliques / salvamentos", z.string()),
  testWindow: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "7 dias", z.string()),
  successCriterion: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Aumento mensurável no engajamento por alcance.", z.string()),
  confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1))
});

export type ActionExperiment = z.infer<typeof ActionExperimentSchema>;

export const PillarFunctionEnum = z.enum([
  'discovery',
  'authority',
  'relationship',
  'proof',
  'conversion'
]);

export const normalizePillarFunction = (val: unknown): z.infer<typeof PillarFunctionEnum> => {
  if (typeof val !== 'string') return 'authority';
  const lower = val.toLowerCase().trim();
  if (lower.includes('descoberta') || lower.includes('discovery') || lower.includes('alcance') || lower.includes('atracao')) return 'discovery';
  if (lower.includes('relacionamento') || lower.includes('relationship') || lower.includes('comunidade') || lower.includes('proximidade')) return 'relationship';
  if (lower.includes('prova') || lower.includes('proof') || lower.includes('depoimento') || lower.includes('caso') || lower.includes('resultado')) return 'proof';
  if (lower.includes('conversao') || lower.includes('conversão') || lower.includes('conversion') || lower.includes('venda') || lower.includes('oferta')) return 'conversion';
  return 'authority';
};

export const ContentPillarSchema = z.object({
  name: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Pilar Editorial", z.string()),
  function: z.preprocess(normalizePillarFunction, PillarFunctionEnum),
  audienceProblem: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Dúvida ou dor do público-alvo.", z.string()),
  promise: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Solução editorial prática.", z.string()),
  formats: z.preprocess(val => {
    if (Array.isArray(val) && val.length > 0) return val.map(String);
    if (typeof val === 'string') return [val];
    return ['Reels', 'Carrossel'];
  }, z.array(z.string())),
  exampleIdeas: z.preprocess(val => {
    if (Array.isArray(val) && val.length > 0) return val.map(String);
    if (typeof val === 'string') return [val];
    return ['Ideia prática 1', 'Ideia prática 2'];
  }, z.array(z.string())),
  primaryMetric: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Salvamentos e Compartilhamentos", z.string())
});

export type ContentPillar = z.infer<typeof ContentPillarSchema>;

export const FormatAnalysisSchema = z.object({
  format: z.preprocess(val => {
    if (typeof val !== 'string') return 'reel';
    const lower = val.toLowerCase().trim();
    if (lower.includes('carrossel') || lower.includes('carousel')) return 'carousel';
    if (lower.includes('stor')) return 'story';
    if (lower.includes('foto') || lower.includes('photo')) return 'photo';
    if (lower.includes('live')) return 'live';
    if (lower.includes('bio') || lower.includes('perfil')) return 'bio';
    return 'reel';
  }, z.enum(['reel', 'carousel', 'story', 'photo', 'live', 'bio'])),
  strengths: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
  weaknesses: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
  recommendation: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Otimizar estrutura do formato seguindo boas práticas oficiais.", z.string())
});

export type FormatAnalysis = z.infer<typeof FormatAnalysisSchema>;

export const RecommendationEligibilitySchema = z.object({
  riskLevel: z.preprocess(val => {
    if (typeof val !== 'string') return 'low';
    const lower = val.toLowerCase().trim();
    if (lower.includes('high') || lower.includes('alto')) return 'high';
    if (lower.includes('med') || lower.includes('méd')) return 'medium';
    if (lower.includes('unk') || lower.includes('desconhec')) return 'unknown';
    return 'low';
  }, z.enum(['low', 'medium', 'high', 'unknown'])),
  evidence: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
  limitations: z.preprocess(val => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.length > 0) return [val];
    return ['Análise baseada exclusivamente nas diretrizes públicas da Meta e evidências visuais fornecidas. Não constitui acesso ao algoritmo interno.'];
  }, z.array(z.string()))
});

export type RecommendationEligibility = z.infer<typeof RecommendationEligibilitySchema>;

export const VoiceGuidanceSchema = z.object({
  observedVoice: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Voz descritiva e informativa.", z.string()),
  recommendedVoice: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Voz de autoridade empática e orientada a soluções práticas.", z.string()),
  whatToKeep: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Clareza temática e consistência visual.", z.string()),
  whatToRemove: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Jargões excessivos e aberturas lentas.", z.string()),
  wordsToFavor: z.preprocess(val => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.length > 0) return [val];
    return ['Como fazer', 'Passo a passo', 'Na prática', 'Evite'];
  }, z.array(z.string())),
  wordsToAvoid: z.preprocess(val => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string' && val.length > 0) return [val];
    return ['Compre já', 'Segredo revelado', 'Imperdível', 'Arrasta pra cima'];
  }, z.array(z.string())),
  beforeAfterExample: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Antes: 'Novo post sobre dicas'. Depois: '3 erros comuns que travam sua conversão'.", z.string())
});

export type VoiceGuidance = z.infer<typeof VoiceGuidanceSchema>;

export const EditorialCalendarItemSchema = z.object({
  day: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Dia 1", z.string()),
  format: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Reels", z.string()),
  pillar: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Autoridade", z.string()),
  idea: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Tema editorial", z.string()),
  hook: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Gancho inicial de 3s", z.string()),
  cta: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Comente para receber o material", z.string()),
  metric: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Salvamentos", z.string())
});

export type EditorialCalendarItem = z.infer<typeof EditorialCalendarItemSchema>;

export const InstagramIntelligenceSchema = z.object({
  analysisMode: z.preprocess(val => {
    if (typeof val !== 'string') return 'structural';
    const lower = val.toLowerCase().trim();
    if (lower.includes('performance') || lower.includes('api') || lower.includes('insights')) return 'performance';
    if (lower.includes('content') || lower.includes('lab')) return 'content_lab';
    return 'structural';
  }, z.enum(['structural', 'performance', 'content_lab'])),
  dataFreshness: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : new Date().toISOString(), z.string()),
  observedStrengths: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
  observedRisks: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
  positioning: z.object({
    audience: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Público identificado no perfil.", z.string()),
    promise: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Promessa central comunicada.", z.string()),
    differentiation: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Diferencial perceptível.", z.string()),
    clarityScore: z.preprocess(val => {
      const num = Number(val);
      if (isNaN(num)) return 70;
      return Math.min(100, Math.max(0, Math.round(num)));
    }, z.number().min(0).max(100)),
    confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1))
  }),
  profileArchitecture: z.object({
    diagnosis: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Arquitetura estruturada.", z.string()),
    frictionPoints: z.preprocess(val => Array.isArray(val) ? val : [], z.array(EvidenceSchema)),
    recommendedNextStep: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Ajustar bio e destaques para direcionar tráfego qualificado.", z.string())
  }),
  contentPillars: z.preprocess(val => Array.isArray(val) ? val : [], z.array(ContentPillarSchema)).transform(items => {
    if (items.length < 3) {
      // Guarantee at least 3 pillars
      const fallbackPillars: ContentPillar[] = [
        {
          name: 'Pilar 1 — Autoridade & Metodologia',
          function: 'authority',
          audienceProblem: 'Compreender a expertise técnica por trás das soluções apresentadas.',
          promise: 'Explicar o passo a passo com profundidade e embasamento.',
          formats: ['Carrossel', 'Reels'],
          exampleIdeas: ['3 erros conceituais que seu público comete', 'Bastidores da metodologia na prática'],
          primaryMetric: 'Salvamentos'
        },
        {
          name: 'Pilar 2 — Descoberta & Resolução de Dores',
          function: 'discovery',
          audienceProblem: 'Identificar sintomas imediatos que incomodam no dia a dia.',
          promise: 'Trazer clareza instantânea para dores recorrentes do nicho.',
          formats: ['Reels de 20s', 'Carrossel curto'],
          exampleIdeas: ['O que ninguém te conta sobre o nicho', 'Checklist rápido de validação'],
          primaryMetric: 'Compartilhamentos'
        },
        {
          name: 'Pilar 3 — Conversão & Chamada para Ação',
          function: 'conversion',
          audienceProblem: 'Saber como contratar, comprar ou aprofundar o contato.',
          promise: 'Apresentar a oferta com clareza sem atrito na jornada.',
          formats: ['Stories', 'Carrossel de Estudo de Caso'],
          exampleIdeas: ['Estudo de caso com resultado comprovado', 'Convite direto com link na bio'],
          primaryMetric: 'Cliques no Link e DMs'
        }
      ];
      return fallbackPillars.slice(0, 5);
    }
    return items.slice(0, 5);
  }),
  formatAnalysis: z.preprocess(val => Array.isArray(val) ? val : [], z.array(FormatAnalysisSchema)),
  recommendationEligibility: RecommendationEligibilitySchema,
  voiceGuidance: VoiceGuidanceSchema.optional(),
  priorityExperiments: z.preprocess(val => Array.isArray(val) ? val : [], z.array(ActionExperimentSchema)).transform(items => {
    if (items.length < 1) {
      const fallbackExp: ActionExperiment[] = [{
        priority: 'P0',
        problem: 'Fricção na promessa da bio e falta de prova imediata nos destaques.',
        evidenceIds: ['ev_observed_profile'],
        hypothesis: 'Se a bio explicitar a dor principal e o primeiro destaque for uma prova prática, a taxa de clique no link aumentará.',
        action: 'Reescrever a bio em formato dor -> solução -> CTA e organizar 1 destaque de prova.',
        format: 'profile',
        hook: 'Para quem é: Dor principal resolvida na prática.',
        cta: 'Toque no link abaixo para conhecer a solução.',
        primaryMetric: 'Cliques no link / Visitas ao perfil',
        testWindow: '7 dias',
        successCriterion: 'Maior taxa de cliques no link por visitante no perfil.',
        confidence: 0.85
      }];
      return fallbackExp;
    }
    return items.slice(0, 3);
  }),
  editorialCalendar: z.preprocess(val => Array.isArray(val) ? val : undefined, z.array(EditorialCalendarItemSchema).optional()),
  disclaimer: z.preprocess(val => typeof val === "string" && val.trim().length > 0 ? val.trim() : "Esta consultoria estrutural é baseada em evidências observáveis e diretrizes públicas da Meta. Sem conexão com Insights da API oficial, métricas internas não são estimadas como fatos.", z.string())
});

export type InstagramIntelligence = z.infer<typeof InstagramIntelligenceSchema>;

export const MetadataSchema = z.object({
  is_data_sufficient: z.preprocess(val => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true";
    return true;
  }, z.boolean()),
  missing_elements: z.preprocess(val => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string" && val.length > 0) return [val];
    return [];
  }, z.array(z.string())),
  overall_confidence: z.preprocess(normalizeConfidence, z.number().min(0).max(1)),
  epistemic_summary: z.object({
    evidência_observada: z.string().optional(),
    inferência_técnica: z.string().optional(),
    hipótese_estratégica: z.string().optional(),
    simulação_projetiva: z.string().optional()
  }).optional()
});

export const DiagnosisSchema = z.object({
  methodology_version: z.literal("instascore-structural-0.1-alpha"),
  analysis_type: z.preprocess(val => typeof val === "string" && val.length > 0 ? val : "structural", z.string()),
  metadata: MetadataSchema,
  evaluations: z.array(EvaluationItemSchema),
  strengths: z.array(StrengthItemSchema).transform(items => items.slice(0, 3)),
  critical_gaps: z.array(CriticalGapItemSchema).transform(items => items.slice(0, 5)),
  recommended_actions: z.array(RecommendedActionItemSchema).transform(items => items.slice(0, 10)),
  tomorrow_action: TomorrowActionSchema,
  intelligence: InstagramIntelligenceSchema.optional(),
  disclaimer: z.preprocess(val => typeof val === "string" && val.length > 0 ? val : "Esta auditoria é baseada exclusivamente nas evidências visíveis nas capturas de tela enviadas.", z.string()),
});

export type DiagnosisInput = z.infer<typeof DiagnosisSchema>;

/**
 * Strict server-side Zod validator for the diagnosis request body.
 * Blocks processing before quota check or AI calls if any field is invalid.
 */
export const DiagnosisRequestSchema = z.object({
  userName: z.string()
    .trim()
    .min(1, "Precisamos saber como gostaria de ser chamado.")
    .max(100, "O nome informado excede o limite de 100 caracteres."),
  niche: z.string()
    .trim()
    .min(1, "Precisamos saber qual é o seu negócio ou nicho.")
    .max(150, "O nicho informado excede o limite de 150 caracteres."),
  objective: z.string()
    .trim()
    .min(1, "Precisamos saber qual é seu principal objetivo no Instagram.")
    .max(150, "O objetivo informado excede o limite de 150 caracteres."),
  targetAudience: z.string()
    .trim()
    .min(1, "Precisamos saber quem é o público que você quer alcançar.")
    .max(150, "O público-alvo informado excede o limite de 150 caracteres."),
  handle: z.string()
    .trim()
    .max(100, "O @handle excede o limite de 100 caracteres.")
    .optional()
    .nullable()
    .transform(val => val || undefined),
  consent: z.boolean().refine(val => val === true, {
    message: "É necessário autorizar o processamento temporário das imagens para gerar o diagnóstico."
  }),
  print1: z.string()
    .min(50, "A imagem da captura inicial (Print 1) está inválida ou vazia."),
  print2: z.string()
    .min(50, "A imagem do topo do feed (Print 2) está inválida ou vazia."),
  print3: z.string().optional().nullable().transform(val => val || undefined)
});

export type DiagnosisRequest = z.infer<typeof DiagnosisRequestSchema>;

