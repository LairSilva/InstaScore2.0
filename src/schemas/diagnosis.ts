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

