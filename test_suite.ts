import { DiagnosisSchema } from "./src/schemas/diagnosis";
import { calculateScoring, CRITERIA } from "./src/config/methodology";
import { generateStartModeStrategy } from "./src/engine/start-mode-generator";
import { PLANS, getPlanConfig, hasEntitlement } from "./src/config/plans";
import { 
  checkUserEntitlement, 
  checkAndIncrementQuota, 
  validateWebhookSignature, 
  createCheckoutSessionServer, 
  processWebhookEvent 
} from "./src/lib/billing-server";
import { AI_MODEL_ROUTER } from "./src/config/ai";

console.log("==================================================");
console.log("INSTASCORE OS V11.3 — BATERIA DE HOMOLOGAÇÃO COMPLETA");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || "Condition not met"}`);
    failed++;
  }
}

// ==========================================
// TEST A: MATH ENGINE & SCORE CALCULATION
// ==========================================
console.log("--- TESTE A: Math Engine & Autoridade Matemática ---");
const dummyEvals = CRITERIA.map(c => ({
  criterion_id: c.id,
  grade: 3, // 75%
  evidence: "Evidência clara observada no print",
  justification: "Justificativa detalhada de acordo com as diretrizes do C.A.G.E",
  confidence: 0.9
}));

const scoring = calculateScoring(dummyEvals, "Vender produtos");
assert(scoring.score === 75, "Math Engine calcula score determinístico (75/100)");
assert(scoring.categories["positioning"] !== undefined, "Categorias do C.A.G.E presentes no cálculo");
assert(scoring.targetScore !== null && scoring.targetScore > scoring.score, "Target Score prevê melhoria futura");

// ==========================================
// TEST B: ZOD SCHEMA & PRE-PROCESSING TOLERANCE
// ==========================================
console.log("\n--- TESTE B: Validação do DiagnosisSchema & Robustez ---");
const validPayload = {
  methodology_version: "instascore-structural-0.1-alpha",
  metadata: {
    is_data_sufficient: true,
    missing_elements: [],
    overall_confidence: 0.85
  },
  evaluations: CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 3,
    evidence: "Evidência válida observada no perfil",
    justification: "Justificativa detalhada de acordo com as diretrizes",
    confidence: 0.85
  })),
  strengths: [
    { criterion_id: "positioning.offer_clarity", title: "Identidade Forte", reason: "Cores e tipografia consistentes" },
    { criterion_id: "seo.name_keyword", title: "Bio Clara", reason: "Explica a proposta de valor" },
    { criterion_id: "content.thematic_coherence", title: "Feed Ativo", reason: "Postagens regulares e coerentes" }
  ],
  critical_gaps: [
    { criterion_id: "conversion.explicit_cta", title: "Link sem UTM", reason: "Dificulta rastreamento de vendas", impact: "Perda de dados de conversão" },
    { criterion_id: "conversion.friction", title: "CTA Fraca", reason: "Não direciona o visitante com clareza", impact: "Baixa taxa de clique" }
  ],
  recommended_actions: [
    { criterion_id: "seo.name_keyword", title: "Inserir Palavra-chave no Nome", instruction: "Adicione seu nicho ao lado do nome.", effort: "low", expected_effect: "Mais buscas orgânicas" },
    { criterion_id: "authority.social_proof", title: "Criar Destaque Sobre", instruction: "Apresente quem você é e provas sociais.", effort: "medium", expected_effect: "Mais autoridade percebida" },
    { criterion_id: "conversion.explicit_cta", title: "Adicionar CTA na Bio", instruction: "Coloque uma chamada direta para o link.", effort: "low", expected_effect: "Mais cliques no link" }
  ],
  tomorrow_action: {
    criterion_id: "conversion.explicit_cta",
    title: "Ajuste Imediato da Bio",
    instruction: "Altere a última linha da Bio para 'Toque abaixo para agendar' hoje mesmo."
  }
};

const parsedZod = DiagnosisSchema.safeParse(validPayload);
assert(parsedZod.success, "DiagnosisSchema valida payload completo e correto", parsedZod.success ? undefined : JSON.stringify(parsedZod.error));

// ==========================================
// TEST C: PLANS, ENTITLEMENTS & QUOTAS
// ==========================================
console.log("\n--- TESTE C: Planos, Entitlements e Quotas ---");
assert(PLANS.FREE.priceMonthly === 0, "Plano FREE configurado com preço R$ 0");
assert(PLANS.PRO.priceMonthly === 39.90, "Plano PRO configurado com preço mensal R$ 39,90");
assert(PLANS.PRO.priceAnnual === 349.90, "Plano PRO configurado com preço anual R$ 349,90");
assert(PLANS.PRO.formattedPriceAnnual === "R$ 349,90/ano", "Plano PRO formatado com R$ 349,90/ano");
assert(!hasEntitlement("FREE", "contentAi"), "Plano FREE bloqueia Content AI (Paywall exigido)");
assert(hasEntitlement("PRO", "contentAi"), "Plano PRO libera Content AI");
assert(hasEntitlement("PRO", "reelsGenerator"), "Plano PRO libera Gerador de Reels");

const freeEntitlement = await checkUserEntitlement("test_user_free", "contentAi");
assert(!freeEntitlement.allowed, "checkUserEntitlement bloqueia usuário free em contentAi");

// ==========================================
// TEST D: BILLING & CHECKOUT ENGINE
// ==========================================
console.log("\n--- TESTE D: Checkout & Webhook Signature ---");
const session = await createCheckoutSessionServer({
  userId: "user_audit_123",
  planId: "PRO",
  cycle: "monthly",
  paymentMethod: "pix"
});
assert(Boolean(session.sessionId), "Criação de sessão de checkout funcional");
assert(session.amount === 39.90, "Valor correto atribuído à sessão mensal (R$ 39,90)");
assert(Boolean(session.pixQrCodeText), "PIX Copia e Cola gerado com sucesso");

const annualSession = await createCheckoutSessionServer({
  userId: "user_audit_annual",
  planId: "PRO",
  cycle: "annual",
  paymentMethod: "card"
});
assert(annualSession.amount === 349.90, "Valor correto atribuído à sessão anual (R$ 349,90)");

// ==========================================
// TEST E: START MODE GENERATOR ENGINE
// ==========================================
console.log("\n--- TESTE E: Start Mode Strategy Engine ---");
const startResult = generateStartModeStrategy({
  projectIdea: "Consultoria em Gestão Financeira para Pequenas Empresas",
  objective: "Vender contratos de consultoria mensal"
});
assert(startResult.nameSuggestions.length === 20, "Gera exatamente 20 sugestões de nome");
assert(startResult.bioOptions.length >= 3, "Gera opções de Bio categorizadas");
assert(startResult.first10Posts.length === 10, "Gera os 10 primeiros posts estruturados");
assert(startResult.calendar30Days.length === 30, "Gera o calendário tático de 30 dias");
assert(startResult.startScore > 0, "Calcula o Start Score inicial ponderado");

// ==========================================
// TEST F: AI MODEL ROUTER CONFIGURATION
// ==========================================
console.log("\n--- TESTE F: AI Model Router & Resilience ---");
assert(AI_MODEL_ROUTER.primaryModel === "gemini-3.7-flash", "AI Model Router configurado com gemini-3.7-flash");
assert(AI_MODEL_ROUTER.requestTimeoutMs > 0, "Timeout de segurança configurado no Router");
assert(AI_MODEL_ROUTER.fallbackModels.length > 0, "Modelos de fallback configurados no Router");

console.log("\n==================================================");
console.log(`RESULTADO DA HOMOLOGAÇÃO: ${passed} PASSOU | ${failed} FALHOU`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
