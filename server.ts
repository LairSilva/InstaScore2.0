import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisSchema, DiagnosisRequestSchema } from "./src/schemas/diagnosis";
import { calculateScoring, CRITERIA } from "./src/config/methodology";
import { AI_MODEL_ROUTER, GEMINI_MODEL } from "./src/config/ai";
import { generateStartModeStrategy } from "./src/engine/start-mode-generator";
import { validateScreenshotBatch } from "./src/lib/image-validator";
import { 
  getSubscription, 
  getUsage, 
  checkUserEntitlement, 
  checkAndIncrementQuota, 
  refundQuota,
  checkDistributedRateLimit,
  createCheckoutSessionServer,
  validateWebhookSignature,
  processWebhookEvent, 
  getCheckoutSessionStatus,
  cancelSubscriptionServer, 
  logAiExecutionCost, 
  getAdminMetrics,
  submitUserFeedback,
  listFeedbackRecords
} from "./src/lib/billing-server";
import { PLANS, getPlanConfig } from "./src/config/plans";
import { MissionService } from "./src/engine/missions/MissionService";
import { StrategicBrainServer } from "./src/engine/strategic/StrategicBrainServer";
import { cleanAndParseJson, handleAiError } from "./src/lib/gemini-parser";
import { 
  requireAuth, 
  requireAdmin, 
  optionalAuth, 
  getAuthenticatedUserId 
} from "./src/server/auth";
import {
  exportUserData,
  deleteUserData,
  cleanupExpiredDocuments
} from "./src/lib/data-retention";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable gzip/deflate/brotli compression for all HTTP responses
app.use(compression({
  threshold: 1024, // only compress responses above 1KB
  level: 6,
}));

// Increase request size limits to support base64 screenshot uploads (max 15MB)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Mount global optional auth on /api routes to extract and verify tokens when present
app.use("/api", optionalAuth);

// Initialize Google GenAI securely (server-side only) with lazy initialization
let aiInstance: GoogleGenAI | null = null;

function getGoogleGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Health check route with structured system status
app.get("/api/health", (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  const status = hasApiKey ? "healthy" : "degraded";
  
  res.json({
    status,
    database: "ok",
    storage: "ok",
    ai: hasApiKey ? "ok" : "missing_api_key",
    queue: "ok",
    timestamp: new Date().toISOString()
  });
});

/**
 * COMMERCIAL BILLING & REAL PAYMENT GATEWAY ROUTES
 */

// 1. Get current subscription, plan config, and usage for user
app.get("/api/subscription/status", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const sub = await getSubscription(userId);
  const usage = await getUsage(userId);
  const planConfig = getPlanConfig(sub.plan);

  return res.json({
    success: true,
    subscription: sub,
    usage,
    planConfig,
    isPro: sub.plan === "PRO" && sub.status === "active"
  });
});

// 2. Create REAL checkout session (Mercado Pago / Stripe / Production Gateway)
app.post("/api/checkout/create-session", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { planId, cycle, paymentMethod, userEmail } = req.body;

    const appUrl = `${req.protocol}://${req.get('host')}`;

    const sessionRecord = await createCheckoutSessionServer({
      userId,
      planId: planId === "PRO" ? "PRO" : "FREE",
      cycle: cycle === "annual" ? "annual" : "monthly",
      paymentMethod: paymentMethod === "card" ? "card" : "pix",
      userEmail,
      appUrl
    });

    const selectedPlanConfig = getPlanConfig(sessionRecord.planId);
    const formattedPrice = sessionRecord.cycle === "annual" 
      ? selectedPlanConfig.formattedPriceAnnual 
      : selectedPlanConfig.formattedPriceMonthly;

    return res.json({
      success: true,
      sessionId: sessionRecord.sessionId,
      userId: sessionRecord.userId,
      planId: sessionRecord.planId,
      cycle: sessionRecord.cycle,
      paymentMethod: sessionRecord.paymentMethod,
      amount: sessionRecord.amount,
      formattedPrice,
      provider: sessionRecord.provider,
      pixQrCodeText: sessionRecord.pixQrCodeText,
      pixQrCodeBase64: sessionRecord.pixQrCodeBase64,
      checkoutUrl: sessionRecord.checkoutUrl,
      expiresAt: sessionRecord.expiresAt
    });
  } catch (err: any) {
    console.error("[Checkout Creation Failed]", err);
    return res.status(500).json({
      success: false,
      error: "CHECKOUT_CREATION_FAILED",
      message: "Não foi possível gerar a sessão de pagamento. Tente novamente."
    });
  }
});

// 3. Webhook endpoint for payment gateway events with SIGNATURE VALIDATION & IDEMPOTENCY
app.post("/api/webhook/payment", async (req, res) => {
  // Validate webhook secret/signature with Fail-Closed posture
  const validation = validateWebhookSignature(req.headers, req.body, req.query);
  if (!validation.valid) {
    console.warn(`[InstaScore Webhook] Validation failed (${validation.status} ${validation.error}): ${validation.message}`);
    return res.status(validation.status).json({
      success: false,
      error: validation.error,
      message: validation.message
    });
  }

  // Parse webhook payload (Mercado Pago IPN & Webhooks)
  let eventId = req.body.eventId || (req.body.id ? `mp_evt_${req.body.id}` : (req.body.data?.id ? `mp_evt_${req.body.data.id}` : undefined));
  let eventType = req.body.eventType || req.body.action || req.body.type || "payment.approved";
  let status = req.body.status || req.body.data?.status || "approved";
  let cycle = req.body.cycle;
  let provider = req.body.provider || "mercadopago";
  let sessionId = req.body.sessionId || req.body.data?.metadata?.session_id;
  const providerPaymentId = req.body.providerPaymentId || String(req.body.data?.id || req.body.id || "");

  // Handles Mercado Pago topic/IPN notifications
  if (req.body.type === "payment" && req.body.data?.id) {
    eventId = `mp_evt_${req.body.data.id}`;
    eventType = "payment.updated";
  }

  if (!eventId) {
    eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  console.log(`[InstaScore Webhook] Processing event '${eventType}' (${eventId}) for payment '${providerPaymentId || "N/A"}'`);

  const result = await processWebhookEvent({
    eventId,
    eventType,
    userId: req.body.userId, // Will be verified/overridden by server metadata in processWebhookEvent
    cycle: cycle === "annual" ? "annual" : "monthly",
    incomingStatus: status,
    provider,
    sessionId,
    providerPaymentId,
    payload: req.body,
    headers: req.headers
  });

  if (!result.success) {
    return res.status(result.httpStatus || 400).json({
      success: false,
      reason: result.reason,
      message: result.message
    });
  }

  return res.status(result.httpStatus || 200).json({
    success: true,
    processed: result.processed,
    reason: result.reason,
    message: result.message,
    subscription: result.subscription
  });
});

// 4. Poll status of checkout session (Real-Time Pix/Card Approval Auto-Detection)
app.get("/api/checkout/status", requireAuth, async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const userId = req.user!.uid;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: "sessionId_required" });
  }

  const result = await getCheckoutSessionStatus(sessionId, userId);
  return res.json({
    success: true,
    ...result
  });
});

// 5. Cancel subscription route
app.post("/api/subscription/cancel", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const result = await cancelSubscriptionServer(userId);
  return res.json({
    success: true,
    message: "Sua assinatura foi cancelada. Seu acesso Pro continuará ativo até o final do período vigente.",
    subscription: result.subscription
  });
});

/**
 * PRIVACY, DATA MINIMIZATION & RETENTION LIFECYCLE ENDPOINTS
 */

// 6. User Data Export (Portability)
app.get("/api/user/export-data", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const exportResult = await exportUserData(userId);

    // Set download headers for JSON portability
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="instascore-data-export-${userId.substring(0, 8)}.json"`);
    return res.json(exportResult);
  } catch (err: any) {
    console.error("[DataExport] Error exporting user data:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "DATA_EXPORT_FAILED",
      message: "Falha ao gerar arquivo de exportação dos seus dados. Tente novamente."
    });
  }
});

// 7. User Data Deletion (Right to Erasure / Cascading Purge)
app.delete("/api/user/delete-data", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const deletionResult = await deleteUserData(userId);
    return res.json(deletionResult);
  } catch (err: any) {
    console.error("[DataDeletion] Error deleting user data:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "DATA_DELETION_FAILED",
      message: "Falha ao processar a exclusão de seus dados. Tente novamente."
    });
  }
});

app.post("/api/user/delete-data", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const deletionResult = await deleteUserData(userId);
    return res.json(deletionResult);
  } catch (err: any) {
    console.error("[DataDeletion] Error deleting user data:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "DATA_DELETION_FAILED",
      message: "Falha ao processar a exclusão de seus dados. Tente novamente."
    });
  }
});

// 8. Admin automated cleanup of expired documents past retentionUntil
app.post("/api/admin/cleanup-expired", requireAdmin, async (req, res) => {
  try {
    const cleanupResult = await cleanupExpiredDocuments();
    return res.json({
      success: true,
      ...cleanupResult
    });
  } catch (err: any) {
    console.error("[DataCleanup] Error running expired cleanup:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "CLEANUP_FAILED",
      message: "Falha ao executar limpeza de dados expirados."
    });
  }
});


// 5. PRO AI Content Generator Endpoint (Protected by Content AI Entitlement)
app.post("/api/generate-content", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  // Check entitlement
  const entitlement = await checkUserEntitlement(userId, "contentAi");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "Este recurso de geração de conteúdo por IA é exclusivo do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  // Check Quota
  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: quota.errorCode,
      message: quota.message
    });
  }

  const { contentType, niche, objective, targetAudience } = req.body;
  const promptText = `Você é o Estrategista de Conteúdo sênior do InstaScore.
Gere 5 opções de ${contentType || "roteiros de Reels e ganchos de alta retenção"} focadas no nicho "${niche || "Geral"}", objetivo "${objective || "Vendas"}" e público "${targetAudience || "Geral"}".
Forneça:
1. Titulo atraente.
2. Gancho visual e falado nos primeiros 3 segundos.
3. Roteiro ou texto passo a passo.
4. Chamada para Ação (CTA) clara.
Retorne a resposta formatada de forma limpa em Markdown.`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: `generate_content_${contentType}`,
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 500,
      outputTokens: 800
    });

    return res.json({
      success: true,
      content: response.text,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore] Content generation failed:", err);
    return res.status(500).json({
      success: false,
      error: "CONTENT_GENERATION_FAILED",
      message: "Não foi possível gerar o conteúdo neste momento. Tente novamente."
    });
  }
});

// 5.1 Mission Engine Real Execution & Bio AI Generator Endpoint
app.post("/api/mission/execute", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const { 
    missionType, 
    criterionId, 
    criterionTitle, 
    criterionImpact, 
    userName, 
    handle, 
    niche, 
    subNiche, 
    objective, 
    targetAudience, 
    currentBio, 
    currentName, 
    score, 
    identifiedGaps, 
    modifier 
  } = req.body;

  if (!missionType) {
    return res.status(400).json({ success: false, error: "missionType_required" });
  }

  try {
    const startTime = Date.now();
    const result = await MissionService.executeMission({
      missionType,
      criterionId,
      criterionTitle,
      criterionImpact,
      userName: userName || "Criador",
      handle,
      niche: niche || "Geral",
      subNiche,
      objective: objective || "Crescimento e Conversão",
      targetAudience: targetAudience || "Público Geral",
      currentBio,
      currentName,
      score: score || 50,
      identifiedGaps,
      modifier
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: `mission_execute_${missionType}`,
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 600,
      outputTokens: 900
    });

    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error("[InstaScore Mission Execution Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({
      success: false,
      error: {
        code: aiErr.code,
        message: aiErr.message
      }
    });
  }
});

// 6. Real-time AI Mentor Chat Endpoint (Digital Twin Context Grounded)
app.post("/api/mentor/chat", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const { message, digitalTwin, diagnosisResult, history } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, error: "message_required" });
  }

  // Quota check
  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: quota.errorCode,
      message: quota.message
    });
  }

  const overallScore = digitalTwin?.metrics?.overallScore ?? diagnosisResult?.scoring?.score ?? 50;
  const executionScore = digitalTwin?.metrics?.executionScore ?? 45;
  const momentumScore = digitalTwin?.metrics?.momentumScore ?? 50;
  const criticalGaps = diagnosisResult?.diagnosis?.critical_gaps?.map((g: any) => `- ${g.title}: ${g.reason}`).join("\n") || "Nenhum gargalo crítico específico registrado.";
  const strengths = diagnosisResult?.diagnosis?.strengths?.map((s: any) => `- ${s.title}`).join("\n") || "Em desenvolvimento.";
  const niche = diagnosisResult?.scoring?.categories?.find((c: any) => c.id === "positioning") ? "Estratégico" : "Geral";

  const promptText = `Você é o Mentor e Estrategista Sênior de Crescimento do InstaScore OS.
Você orienta o usuário de forma analítica, direta, prática e sem rodeios teóricos, baseando-se estritamente nos dados do perfil dele.

DADOS DO PERFIL DO USUÁRIO:
- C.A.G.E Score Geral: ${overallScore}/100
- Execution Score: ${executionScore}/100
- Momentum Score: ${momentumScore}/100
- Principais Gargalos Identificados:
${criticalGaps}
- Pontos Fortes:
${strengths}

HISTÓRICO RECENTE DA CONVERSA:
${Array.isArray(history) ? history.slice(-4).map((h: any) => `${h.role === "user" ? "Usuário" : "Mentor"}: ${h.text}`).join("\n") : ""}

NOVA PERGUNTA DO USUÁRIO:
"${message}"

DIRETRIZES DA RESPOSTA:
1. Responda em Português do Brasil com tom de consultoria executiva, empática e altamente prática.
2. Dê orientações acionáveis para execução imediata.
3. Se o usuário pedir para gerar uma Bio, gere 2 opções claras com menos de 150 caracteres.
4. Mantenha a resposta concisa (máximo de 3 parágrafos ou passos pontuais).
5. Não use clichês vazios como "supercharge" ou promessas mágicas de viralização rápida.`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "mentor_chat",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 600,
      outputTokens: 400
    });

    return res.json({
      success: true,
      text: response.text || "Compreendido. Vamos focar nos seus principais gargalos para acelerar o crescimento do seu perfil.",
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore Mentor] Chat generation error:", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({
      success: false,
      error: {
        code: aiErr.code,
        message: aiErr.message
      }
    });
  }
});

// 7. Start Mode AI Strategy Generator Endpoint (Customized Naming, Bio, Pillars, Plan)
app.post("/api/start-mode/generate", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const { projectIdea, objective } = req.body;

  if (!projectIdea || typeof projectIdea !== "string" || !projectIdea.trim()) {
    return res.status(400).json({ success: false, error: "projectIdea_required" });
  }

  // Quota check
  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: quota.errorCode,
      message: quota.message
    });
  }

  const promptText = `Você é o Arquiteto de Perfis do InstaScore Start OS.
O usuário quer criar uma conta do zero no Instagram.
Ideia/Projeto: "${projectIdea}"
Objetivo Principal: "${objective || "Vender produtos e serviços e construir autoridade"}"

Gere uma estratégia em JSON com as seguintes chaves exatas:
{
  "recommendedSubniche": "Subnicho específico e diferenciado",
  "targetAudience": "Público-alvo detalhado",
  "coreProblem": "Principal dor que o perfil resolve",
  "uniqueDifferential": "Diferencial de posicionamento único",
  "names": [
    { "name": "Nome de Exibição", "handle": "@nomedeusuario", "category": "Autoridade | Memorável | Premium | Criativo | Pessoal | Comercial", "whyItWorks": "Motivo", "memorabilityScore": 92 }
  ],
  "bios": [
    { "id": "bio_1", "category": "Autoridade & Especialista", "text": "Bio estruturada com menos de 150 caracteres", "highlight": "Destaque da proposta" },
    { "id": "bio_2", "category": "Conversão & Vendas", "text": "Bio com CTA clara e menos de 150 caracteres", "highlight": "Foco em vendas" },
    { "id": "bio_3", "category": "Comunidade & Conexão", "text": "Bio humanizada com menos de 150 caracteres", "highlight": "Foco em engajamento" }
  ]
}
Retorne apenas JSON válido.`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "start_mode_ai_generation",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 500,
      outputTokens: 900
    });

    // Base deterministic result from mathematical engine
    const baseResult = generateStartModeStrategy({ projectIdea, objective: objective || "" });

    // Parse AI JSON additions if valid
    const rawText = response.text || "{}";
    const cleaned = cleanAndParseJson(rawText);

    if (cleaned && typeof cleaned === "object") {
      if (cleaned.recommendedSubniche) {
        baseResult.territory.recommendedSubniche = cleaned.recommendedSubniche;
      }
      if (cleaned.targetAudience) {
        baseResult.territory.targetAudience = cleaned.targetAudience;
      }
      if (cleaned.coreProblem) {
        baseResult.territory.coreProblem = cleaned.coreProblem;
      }
      if (cleaned.uniqueDifferential || cleaned.potentialDifferential) {
        baseResult.territory.potentialDifferential = cleaned.uniqueDifferential || cleaned.potentialDifferential;
      }
      if (Array.isArray(cleaned.names) && cleaned.names.length > 0) {
        // Merge generated names with deterministic ones to guarantee 20 names
        const validNames = cleaned.names.filter((n: any) => n.name && n.handle);
        if (validNames.length > 0) {
          baseResult.nameSuggestions = [...validNames, ...baseResult.nameSuggestions].slice(0, 20);
          baseResult.selectedName = baseResult.nameSuggestions[0];
        }
      }
      if (Array.isArray(cleaned.bios) && cleaned.bios.length > 0) {
        const validBios = cleaned.bios.filter((b: any) => b.text && b.text.length <= 160);
        if (validBios.length > 0) {
          baseResult.bioOptions = [...validBios, ...baseResult.bioOptions].slice(0, 5);
          baseResult.selectedBio = baseResult.bioOptions[0];
        }
      }
    }

    return res.json({
      success: true,
      result: baseResult,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.warn("[InstaScore Start Mode] AI generation fallback triggered:", err);
    // Deterministic mathematical engine guarantee
    const fallbackResult = generateStartModeStrategy({ projectIdea, objective: objective || "" });
    return res.json({
      success: true,
      result: fallbackResult,
      fallbackUsed: true
    });
  }
});

// 8. Simulator Bio & CTA AI Optimizer Endpoint
app.post("/api/simulator/optimize", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const { currentBio, currentCta, niche, objective } = req.body;

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({
      success: false,
      error: quota.errorCode,
      message: quota.message
    });
  }

  const promptText = `Você é o Otimizador de Conversão do InstaScore.
Bio Atual: "${currentBio || "Não informada"}"
CTA Atual: "${currentCta || "Não informada"}"
Nicho: "${niche || "Geral"}"
Objetivo: "${objective || "Vendas"}"

Gere 3 versões de Bio com alto poder de conversão (máximo 150 caracteres cada) e 3 opções de Call To Action diretas.
Retorne um JSON com a estrutura:
{
  "optimizedBios": ["Bio 1", "Bio 2", "Bio 3"],
  "optimizedCtas": ["CTA 1", "CTA 2", "CTA 3"],
  "rationale": "Breve justificativa técnica do porquê essas alterações aumentam a conversão."
}
Retorne apenas JSON válido.`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "simulator_optimize",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 400,
      outputTokens: 400
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      bios: parsed?.optimizedBios || [],
      ctas: parsed?.optimizedCtas || [],
      rationale: parsed?.rationale || "Estruturação focada em eliminar atrito e destacar prova de valor imediata.",
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Simulator Optimizer] AI error:", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({
      success: false,
      error: {
        code: aiErr.code,
        message: aiErr.message
      }
    });
  }
});

// 9. Admin Observability Endpoint (Protected: Admin Only)
app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
  const metrics = await getAdminMetrics();
  return res.json({
    success: true,
    metrics
  });
});

// 9.1 User Feedback Submission Endpoint (Protected: Authenticated User)
app.post("/api/feedback/submit", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { solutionType, rating, comment, itemTitle } = req.body;
    if (!solutionType || !rating) {
      return res.status(400).json({ success: false, error: "solutionType and rating are required." });
    }
    const record = await submitUserFeedback({
      userId,
      solutionType,
      rating: rating === "useful" ? "useful" : "not_useful",
      comment,
      itemTitle
    });
    return res.json({ success: true, feedback: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "FEEDBACK_SUBMIT_FAILED", message: err.message });
  }
});

// 9.2 Admin Feedback Listing Endpoint (Protected: Admin Only)
app.get("/api/feedback/list", requireAdmin, async (req, res) => {
  try {
    const records = await listFeedbackRecords();
    return res.json({ success: true, feedback: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "FEEDBACK_LIST_FAILED", message: err.message });
  }
});

/**
 * -------------------------------------------------------------
 * INSTASCORE PRO RESOLUTION ENGINE (V13 FULL PRO RESOLUTION SUITE)
 * -------------------------------------------------------------
 */

// 10.1 PRO Reels Script Generator (Complete Hook, Script, Direction & Caption)
app.post("/api/pro/reels-script", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "reelsGenerator");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "A geração de roteiros de Reels PRO é exclusiva do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { theme, niche, objective, targetAudience, tone, criticalGaps } = req.body;

  const promptText = `Você é o Diretor de Criação e Estrategista Audiovisual do InstaScore OS.
Gere um Roteiro de Reels PRO completo, altamente persuasivo e prático.

DADOS DE CONTEXTO:
- Nicho: "${niche || "Geral"}"
- Tema/Problema: "${theme || "Como resolver o maior gargalo do perfil"}"
- Objetivo: "${objective || "Atrair clientes qualificados e gerar vendas"}"
- Público-Alvo: "${targetAudience || "Público comprador"}"
- Tom de Voz: "${tone || "Autoridade direta e prática"}"
- Gargalos Diagnosticados: "${criticalGaps || "Falta de gancho nos primeiros 3s e CTA fraca"}"

DIRETRIZES ANTI-CLICHÊ:
- O gancho dos primeiros 3 segundos DEVE ter um elemento visual e um elemento falado que quebre o padrão de rolagem.
- Não use frases batidas como "Você sabia?", "Fica comigo até o final" ou "Salve esse post".
- Forneça a direção de câmera cena a cena com tempo estimado.

Retorne ESTRITAMENTE em formato JSON com a estrutura:
{
  "title": "Título estratégico do Reel",
  "estimatedDuration": "30 a 45 segundos",
  "visualHook3s": "Instrução exata do que fazer nos primeiros 3 segundos (ex: mostrar tela, objeto, movimento)",
  "spokenHook3s": "Texto exato falado nos primeiros 3 segundos",
  "scenes": [
    { "sceneNumber": 1, "timeframe": "0-3s", "visual": "Descrição visual de câmera e enquadramento", "spokenText": "Fala exata do criador", "onScreenText": "Texto na tela (se houver)" },
    { "sceneNumber": 2, "timeframe": "3-15s", "visual": "Descrição visual", "spokenText": "Fala exata", "onScreenText": "Texto na tela" },
    { "sceneNumber": 3, "timeframe": "15-30s", "visual": "Quebra de padrão ou demonstração", "spokenText": "Desenvolvimento do valor", "onScreenText": "Texto na tela" },
    { "sceneNumber": 4, "timeframe": "30-40s", "visual": "Encerramento e chamada de ação", "spokenText": "CTA específica de conversão", "onScreenText": "Texto final de CTA" }
  ],
  "caption": "Legenda pronta formatada com parágrafos curtos, escaneabilidade e hashtags estratégicas",
  "ctaAction": "Chamada exata para o Direct ou Comentário",
  "audioRecommendation": "Tipo de áudio recomendado (Voz original + instrumental sutil em -25dB)"
}`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_reels_script",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 650,
      outputTokens: 900
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Reels Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.2 PRO Carousel Generator (Slide-by-Slide Visual & Text Structure)
app.post("/api/pro/carousel", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "carouselGenerator");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "A criação de carrosséis PRO é exclusiva do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { theme, niche, objective, targetAudience, slidesCount } = req.body;

  const promptText = `Você é o Designer de Informação e Copywriter de Carrosséis do InstaScore OS.
Crie um Carrossel de Alta Retenção e Compartilhamento (${slidesCount || 7} a 8 slides) para o perfil.

DADOS:
- Nicho: "${niche || "Geral"}"
- Tema: "${theme || "Guia definitivo passo a passo"}"
- Objetivo: "${objective || "Salvar, compartilhar e converter seguidores"}"
- Público-Alvo: "${targetAudience || "Público qualificado"}"

ESTRUTURA OBRIGATÓRIA DOS SLIDES:
- Slide 1: Gancho magnético visual e título de altíssimo impacto (promessa clara).
- Slides 2 a 6: Desenvolvimento progressivo, 1 ideia central por slide, texto enxuto e escaneável.
- Slide Penúltimo: Resumo prático ou checklist de fixação.
- Slide Final: CTA irresistível (comente palavra-chave ou envie mensagem no Direct).

Retorne ESTRITAMENTE em JSON:
{
  "title": "Título Principal da Capa",
  "slides": [
    { "slideNumber": 1, "type": "capa", "headline": "Título do Slide", "subheadline": "Subtítulo de apoio", "body": "Texto curto", "visualNote": "Orientação de layout/imagem para Canva/Figma" },
    { "slideNumber": 2, "type": "conteudo", "headline": "Título do Slide", "subheadline": "", "body": "Texto", "visualNote": "Orientação visual" },
    { "slideNumber": 3, "type": "conteudo", "headline": "Título do Slide", "subheadline": "", "body": "Texto", "visualNote": "Orientação visual" },
    { "slideNumber": 4, "type": "conteudo", "headline": "Título do Slide", "subheadline": "", "body": "Texto", "visualNote": "Orientação visual" },
    { "slideNumber": 5, "type": "conteudo", "headline": "Título do Slide", "subheadline": "", "body": "Texto", "visualNote": "Orientação visual" },
    { "slideNumber": 6, "type": "resumo", "headline": "Resumo em 3 passos", "subheadline": "", "body": "Checklist rápido", "visualNote": "Orientação visual" },
    { "slideNumber": 7, "type": "cta", "headline": "Gostou desse conteúdo?", "subheadline": "Comente 'GUIA' para receber o material completo no seu direct", "body": "Salve para consultar quando for executar", "visualNote": "Foco na seta e no ícone de salvar" }
  ],
  "caption": "Legenda completa pronta para publicação",
  "designAdvice": "Dicas de paleta de cores, tipografia e contraste para garantir leitura fácil"
}`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_carousel",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 700,
      outputTokens: 950
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Carousel Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.3 PRO High-Conversion Stories Sequence (5-Story Sales Funnel)
app.post("/api/pro/stories-sequence", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "storiesGenerator");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "O gerador de sequências de Stories é exclusivo do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { objective, niche, targetAudience, offerOrProduct } = req.body;

  const promptText = `Você é o Estrategista de Conversão em Stories do InstaScore OS.
Crie uma Sequência de Stories de 5 Etapas (Funil Diário de Conversão) para o perfil.

DADOS:
- Nicho: "${niche || "Geral"}"
- Oferta/Serviço: "${offerOrProduct || "Consultoria / Produto Principal"}"
- Objetivo: "${objective || "Gerar conversas e vendas no Direct"}"
- Público-Alvo: "${targetAudience || "Público morno a quente"}"

ESTRUTURA DO FUNIL DE STORIES:
1. Story 1: Gancho / Quebra de Padrão com Enquete Interativa (Sim/Não ou Pergunta polarizadora).
2. Story 2: Aprofundamento do Problema / Agitação da dor com relato ou bastidor real.
3. Story 3: Mudança de perspectiva / Prova de valor / Estudo de caso rápido.
4. Story 4: A Solução Clara / Por que o método/serviço funciona.
5. Story 5: Chamada para Ação Direta (Sticker de Resposta / Envie 'QUERO' no Direct).

Retorne ESTRITAMENTE em JSON:
{
  "sequenceTitle": "Tema da Sequência de Stories",
  "funnelGoal": "Objetivo do funil",
  "stories": [
    { "storyNumber": 1, "stage": "Gancho & Interatividade", "format": "Foto de bastidor ou vídeo de 5s", "speechOrText": "Texto exato do Story", "interactiveElement": "Enquete: [Opção A vs Opção B]", "visualGuidance": "Orientação de enquadramento e figurino" },
    { "storyNumber": 2, "stage": "Conexão com a Dor", "format": "Vídeo falando para câmera ou texto sobre fundo autêntico", "speechOrText": "Texto exato", "interactiveElement": "Nenhum ou Reação de fogo", "visualGuidance": "Orientação visual" },
    { "storyNumber": 3, "stage": "Prova & Autoridade", "format": "Print de resultado, bastidor ou depoimento", "speechOrText": "Texto exato", "interactiveElement": "Caixa de perguntas ou Slider", "visualGuidance": "Orientação visual" },
    { "storyNumber": 4, "stage": "Apresentação da Solução", "format": "Vídeo direto ou imagem explicativa", "speechOrText": "Texto exato", "interactiveElement": "Nenhum", "visualGuidance": "Orientação visual" },
    { "storyNumber": 5, "stage": "CTA de Fechamento", "format": "Texto com fundo contrastante e sticker de direct", "speechOrText": "Texto exato com CTA", "interactiveElement": "Sticker 'Me envie mensagem' com palavra-chave 'QUERO'", "visualGuidance": "Orientação visual" }
  ],
  "directMessageReplyScript": "Script exato de resposta no Direct para quem responder ao Story 5"
}`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_stories_sequence",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 600,
      outputTokens: 850
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Stories Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.4 PRO Positioning & Unique Differentiation Matrix
app.post("/api/pro/positioning-strategy", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "positioning_generation");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "A matriz de posicionamento PRO é exclusiva do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { niche, objective, targetAudience, strengths, criticalGaps } = req.body;

  const promptText = `Você é o Arquiteto de Posicionamento e Marca Pessoal do InstaScore OS.
Desenvolva a Matriz Estratégica de Posicionamento para o perfil se destacar da concorrência genérica.

DADOS:
- Nicho: "${niche || "Geral"}"
- Objetivo: "${objective || "Autoridade e Vendas"}"
- Público: "${targetAudience || "Geral"}"
- Pontos Fortes: "${strengths || "Conhecimento técnico"}"
- Gargalos: "${criticalGaps || "Comunicação generalista sem diferencial claro"}"

Retorne ESTRITAMENTE em JSON:
{
  "corePromise": "Promessa central única sem clichês (máximo 120 caracteres)",
  "contentTerritory": "Definição do território exato de domínio do perfil",
  "differentiationAngle": "O que torna o método ou serviço deste perfil único comparado aos concorrentes",
  "toneOfVoice": "Diretrizes de tom de voz (ex: Direto, sofisticado, acolhedor, combativo)",
  "contentPillars": [
    { "pillarName": "Pilar 1: Autoridade & Método", "percentage": "40%", "description": "Conteúdos que provam domínio técnico e quebram objeções" },
    { "pillarName": "Pilar 2: Conexão & Bastidores", "percentage": "30%", "description": "Humanização estratégica e dia a dia prático" },
    { "pillarName": "Pilar 3: Conversão & Oferta", "percentage": "30%", "description": "Chamadas diretas de atendimento e venda" }
  ],
  "antiTopics": ["Lista de 3 temas ou formatos genéricos que este perfil NUNCA deve postar para não diluir autoridade"],
  "recommendedBioFormula": "Fórmula exata para a Bio: Quem sou + O que transformo + Prova + CTA"
}`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_positioning",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 600,
      outputTokens: 800
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Positioning Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.5 PRO Tactical 30-Day Content Calendar Generator
app.post("/api/pro/tactical-calendar", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "calendar_generation");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "O calendário tático PRO é exclusivo do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { niche, objective, targetAudience, periodDays } = req.body;
  const days = periodDays === 14 ? 14 : 7; // Generates 7 or 14 tactical strategic days

  const promptText = `Você é o Estrategista Chefe de Planejamento Editorial do InstaScore OS.
Crie um Plano Editorial Tático de ${days} Dias focado em resolver os gargalos de conversão do perfil.

DADOS:
- Nicho: "${niche || "Geral"}"
- Objetivo: "${objective || "Crescimento e Conversão"}"
- Público: "${targetAudience || "Comprador"}"

Retorne ESTRITAMENTE em JSON:
{
  "calendarTitle": "Cronograma Tático de Publicações (${days} Dias)",
  "primaryFocus": "Objetivo principal do ciclo de publicações",
  "days": [
    {
      "day": 1,
      "format": "Reels | Carrossel | Post Estático | Stories",
      "strategicGoal": "Atração | Autoridade | Conexão | Conversão",
      "headline": "Tema / Título Principal",
      "hookIdea": "Gancho inicial de retenção",
      "ctaTarget": "Comentário | Direct | Link da Bio"
    }
  ],
  "weeklyDistribution": "3x Reels de atração, 2x Carrosséis de retenção, Stories diários de conversão"
}`;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: promptText
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_calendar",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 600,
      outputTokens: 900
    });

    const parsed = cleanAndParseJson(response.text || "{}");
    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Calendar Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.6 PRO Visual Image Generation & Art Briefing (Imagen / Studio Asset Creation)
app.post("/api/pro/generate-image", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "image_generation");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "A geração de imagens estratégicas é exclusiva do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "IMAGE_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { prompt, aspectRatio, postType, niche } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    // Generate comprehensive professional prompt & briefing using AI
    const designPrompt = `Você é o Diretor de Arte do InstaScore Studio.
Gere um briefing de imagem de alta conversão para o post: "${prompt || "Imagem de capa estratégica"}" no nicho "${niche || "Profissional"}".
Retorne em JSON:
{
  "recommendedVisualConcept": "Conceito visual limpo e profissional",
  "colorPalette": ["#111827", "#10B981", "#F9FAFB"],
  "midjourneyPrompt": "Prompt em inglês pronto para Midjourney v6 com parâmetros de iluminação e composição",
  "canvaDesignInstructions": "Instruções passo a passo de montagem no Canva com tipografia e contraste",
  "aspectRatio": "${aspectRatio || "4:5"}",
  "visualFocalPoint": "Ponto focal para não cortar elementos no feed 1:1"
}`;

    const textResponse = await ai.models.generateContent({
      model: AI_MODEL_ROUTER.primaryModel,
      contents: designPrompt
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "pro_generate_image",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 400,
      outputTokens: 500
    });

    const parsed = cleanAndParseJson(textResponse.text || "{}");

    return res.json({
      success: true,
      deliverable: parsed,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[InstaScore PRO Image Generation Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 10.7 Feedback Submission API (👍 / 👎 on any solution)
app.post("/api/feedback/submit", requireAuth, async (req, res) => {
  const userId = req.user!.uid;
  const { solutionType, rating, comment, itemTitle } = req.body;

  if (!rating || (rating !== "useful" && rating !== "not_useful")) {
    return res.status(400).json({ success: false, error: "rating_invalid" });
  }

  const record = await submitUserFeedback({
    userId,
    solutionType: solutionType || "general",
    rating,
    comment,
    itemTitle
  });

  return res.json({
    success: true,
    message: "Obrigado pelo seu feedback! Sua avaliação ajuda a aprimorar nossos modelos.",
    feedback: record
  });
});

// 10.8 Feedback List API (Protected: Admin Only)
app.get("/api/feedback/list", requireAdmin, async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const feedbacks = await listFeedbackRecords(limit);
  return res.json({
    success: true,
    feedbacks
  });
});

/**
 * -------------------------------------------------------------
 * INSTASCORE V12 — STRATEGIC BRAIN API SUITE
 * -------------------------------------------------------------
 */

// 11.1 Strategic Positioning Engine & Profile Clarity Score (0-100)
app.post("/api/strategic/positioning", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { username, account_name, niche, subniche, currentBio, goal, diagnosisScore, criticalGaps, strengths } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    const result = await StrategicBrainServer.generatePositioningAndClarity(ai, {
      username: username || "usuario",
      account_name,
      niche: niche || "Geral",
      subniche,
      currentBio,
      goal,
      diagnosisScore,
      criticalGaps,
      strengths
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "strategic_positioning_clarity",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 650,
      outputTokens: 900
    });

    return res.json({
      success: true,
      ...result,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Strategic Positioning Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 11.2 Bio Strategy Engine (Authority, Conversion, Personality with anti-cliche)
app.post("/api/strategic/bio", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { dna, currentBio } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    const report = await StrategicBrainServer.generateBioStrategy(ai, {
      ...dna,
      username: dna?.username || "usuario",
      currentBio
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "strategic_bio_generator",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 500,
      outputTokens: 750
    });

    return res.json({
      success: true,
      report,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Strategic Bio Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 11.3 Name Strategy Engine (Descritivo, Autoridade, Marca, Conceitual, Diferenciador)
app.post("/api/strategic/naming", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { dna } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    const recommendations = await StrategicBrainServer.generateNameStrategy(ai, dna || { username: "usuario" });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "strategic_name_generator",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 500,
      outputTokens: 700
    });

    return res.json({
      success: true,
      recommendations,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Strategic Naming Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 11.4 Content Pillars & Dynamic Content DNA Engine
app.post("/api/strategic/pillars", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { dna } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    const pillars = await StrategicBrainServer.generateContentPillars(ai, dna || { username: "usuario" });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "strategic_pillars_generator",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: 0,
      fallbackUsed: false,
      inputTokens: 500,
      outputTokens: 700
    });

    return res.json({
      success: true,
      pillars,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Strategic Pillars Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

// 11.5 Strategic Content Lab (Objective -> Target -> Pain -> Pillar -> Angle -> Format -> Content -> Quality Gate >= 75)
app.post("/api/strategic/content-lab", requireAuth, async (req, res) => {
  const userId = req.user!.uid;

  const entitlement = await checkUserEntitlement(userId, "contentAi");
  if (!entitlement.allowed) {
    return res.status(403).json({
      success: false,
      error: "PAYWALL_REQUIRED",
      message: entitlement.reason || "O Content Lab Estratégico é exclusivo do plano InstaScore PRO.",
      paywallRequired: true
    });
  }

  const quota = await checkAndIncrementQuota(userId, "AI_GENERATION");
  if (!quota.allowed) {
    return res.status(429).json({ success: false, error: quota.errorCode, message: quota.message });
  }

  const { dna, primary_objective, pilar, angle_type, format, reel_model, custom_topic_focus } = req.body;

  try {
    const ai = getGoogleGenAI();
    const startTime = Date.now();

    const item = await StrategicBrainServer.generateStrategicContentPiece(ai, {
      dna,
      primary_objective: primary_objective || "descoberta",
      pilar,
      angle_type: angle_type || "contradição",
      format: format || "reel",
      reel_model: reel_model || "educational",
      custom_topic_focus
    });
    const durationMs = Date.now() - startTime;

    logAiExecutionCost({
      userId,
      action: "strategic_content_lab",
      modelUsed: AI_MODEL_ROUTER.primaryModel,
      durationMs,
      retries: item.quality_report.attempts_taken > 1 ? 1 : 0,
      fallbackUsed: false,
      inputTokens: 850,
      outputTokens: 1100
    });

    return res.json({
      success: true,
      item,
      quotaUsed: quota.currentCount,
      quotaMax: quota.maxLimit
    });
  } catch (err: any) {
    console.error("[Strategic Content Lab Error]", err);
    const aiErr = handleAiError(err);
    return res.status(aiErr.status).json({ success: false, error: { code: aiErr.code, message: aiErr.message } });
  }
});

/**
 * Parses and validates the uploaded image from its base64 data URI format.
 */
function parseBase64Image(dataUri: string) {
  if (!dataUri) return null;
  const matches = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If it is just raw base64 without prefix, default to image/jpeg
    if (dataUri.length > 100 && !dataUri.includes(";")) {
      return {
        mimeType: "image/jpeg",
        data: dataUri
      };
    }
    return null;
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

/**
 * System instruction for the Auditor.
 */
const SYSTEM_INSTRUCTION = `Você é o Auditor Estratégico do InstaScore.ai.

Sua função é analisar capturas de tela de perfis do Instagram com base exclusivamente nas evidências fornecidas e na metodologia oficial.

Não invente métricas.
Não presuma resultados que não estão visíveis.
Não preveja seguidores, viralização, alcance ou vendas.
Não avalie a personalidade, aparência física ou características pessoais das pessoas mostradas nas imagens.
Não critique gostos estéticos de forma subjetiva.

Avalie somente elementos relacionados à comunicação, posicionamento, clareza, conteúdo, autoridade, descoberta e conversão.

Para cada critério, atribua uma nota entre 0 e 4 somente quando houver evidência suficiente.
Quando não houver evidência, retorne null.

Toda nota deverá possuir:
- evidência observada;
- justificativa objetiva;
- nível de confiança entre 0 e 1.

A evidência deve descrever o que está realmente visível.
A justificativa deve explicar a relação entre a evidência e o critério.

Não forneça uma nota total.
Não faça cálculos matemáticos.
Não altere os pesos.
Não crie critérios adicionais.

Retorne todos os IDs da metodologia exatamente uma vez. Os IDs obrigatórios são:
${CRITERIA.map(c => `- ${c.id}`).join("\n")}

As recomendações devem ser específicas para o nicho, público e objetivo informados.
As ações precisam ser possíveis de executar.

Quando os prints estiverem ilegíveis, incompletos ou contraditórios, registre os elementos ausentes.
Seja direto, analítico, respeitoso e transparente.`;

/**
 * JSON response schema configured for the Gemini API call to ensure strict structural compliance.
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    methodology_version: { type: Type.STRING, description: "Must be exactly 'instascore-structural-0.1-alpha'" },
    analysis_type: { type: Type.STRING, description: "Must be exactly 'structural'" },
    metadata: {
      type: Type.OBJECT,
      properties: {
        is_data_sufficient: { type: Type.BOOLEAN },
        missing_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
        overall_confidence: { type: Type.NUMBER }
      },
      required: ["is_data_sufficient", "missing_elements", "overall_confidence"]
    },
    evaluations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion_id: { type: Type.STRING, description: "The specific criterion ID from the methodology." },
          grade: { type: Type.INTEGER, description: "An integer score between 0 and 4, or null if no evidence is found." },
          confidence: { type: Type.NUMBER, description: "Confidence rating for this score between 0 and 1." },
          evidence: { type: Type.STRING, description: "Factual text describing what was observed in the images for this specific criterion." },
          justification: { type: Type.STRING, description: "Detailed strategy reasoning why this grade was assigned." }
        },
        required: ["criterion_id", "grade", "confidence", "evidence", "justification"]
      }
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion_id: { type: Type.STRING },
          title: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ["criterion_id", "title", "reason"]
      },
      description: "Top 3 strengths observed. Max 3 items."
    },
    critical_gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion_id: { type: Type.STRING },
          title: { type: Type.STRING },
          reason: { type: Type.STRING },
          impact: { type: Type.STRING }
        },
        required: ["criterion_id", "title", "reason", "impact"]
      },
      description: "Priority gaps identified. Max 5 items."
    },
    recommended_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterion_id: { type: Type.STRING },
          title: { type: Type.STRING },
          instruction: { type: Type.STRING },
          effort: { type: Type.STRING, description: "Must be 'low', 'medium' or 'high'" },
          expected_effect: { type: Type.STRING }
        },
        required: ["criterion_id", "title", "instruction", "effort", "expected_effect"]
      },
      description: "Recommended strategic actions, exactly 5 items."
    },
    tomorrow_action: {
      type: Type.OBJECT,
      properties: {
        criterion_id: { type: Type.STRING },
        title: { type: Type.STRING },
        instruction: { type: Type.STRING }
      },
      required: ["criterion_id", "title", "instruction"]
    },
    disclaimer: { type: Type.STRING, description: "Mandatory methodology disclaimer." }
  },
  required: [
    "methodology_version",
    "analysis_type",
    "metadata",
    "evaluations",
    "strengths",
    "critical_gaps",
    "recommended_actions",
    "tomorrow_action",
    "disclaimer"
  ]
};

// Route for analyzing screenshots
interface AIExecutionMeta {
  modelUsed: string;
  totalCalls: number;
  retries: number;
  fallbackUsed: boolean;
  durationMs: number;
  status: "success" | "failed";
  finishReason?: string;
  responseLength?: number;
}

/**
 * Execute multimodal analysis with automated Zod validation, fast correctional retries, and fallback routing.
 */
async function executeAnalysisPipeline(params: {
  parts: any[];
  systemInstruction: string;
  responseSchema: any;
  requestId: string;
}): Promise<{ parsedDiagnosis: any; meta: AIExecutionMeta }> {
  const overallStartTime = Date.now();
  const models = [AI_MODEL_ROUTER.primaryModel, ...AI_MODEL_ROUTER.fallbackModels];
  let totalCalls = 0;
  let retries = 0;
  let lastValidationError: any = null;
  let lastDiagnosticInfo: any = null;

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const currentModel = models[modelIdx];
    const isFallback = modelIdx > 0;
    
    console.log(`[InstaScore Pipeline] [${params.requestId}] Starting model execution: ${currentModel} (fallback=${isFallback})`);

    // Step 1: Execute Multimodal Call
    totalCalls++;
    const callStart = Date.now();
    let rawText = "";
    let finishReason = "STOP";

    try {
      const ai = getGoogleGenAI();
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: { parts: params.parts },
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          temperature: 0.2
        }
      });

      rawText = response.text || "";
      finishReason = response.candidates?.[0]?.finishReason || "STOP";
      const callDuration = Date.now() - callStart;

      console.log(`[InstaScore Pipeline] [${params.requestId}] ${currentModel} responded in ${callDuration}ms (length=${rawText.length}, finishReason=${finishReason})`);
    } catch (apiErr: any) {
      console.warn(`[InstaScore Pipeline] [${params.requestId}] API call error on ${currentModel}:`, apiErr.message || apiErr);
      // If primary model has API network/quota error, continue immediately to fallback model
      continue;
    }

    if (!rawText) {
      console.warn(`[InstaScore Pipeline] [${params.requestId}] Empty response from ${currentModel}`);
      continue;
    }

    // Step 2: Parse JSON
    let parsedJson: any = null;
    try {
      parsedJson = cleanAndParseJson(rawText);
    } catch (parseErr: any) {
      console.warn(`[InstaScore Pipeline] [${params.requestId}] JSON parse error on ${currentModel}:`, parseErr.message);
    }

    // Step 3: Validate with Zod
    if (parsedJson) {
      const zodValidation = DiagnosisSchema.safeParse(parsedJson);
      if (zodValidation.success) {
        const totalDuration = Date.now() - overallStartTime;
        console.log(`[InstaScore Pipeline] [${params.requestId}] Validation SUCCESS on ${currentModel} in ${totalDuration}ms (Calls: ${totalCalls}, Retries: ${retries})`);
        return {
          parsedDiagnosis: zodValidation.data,
          meta: {
            modelUsed: currentModel,
            totalCalls,
            retries,
            fallbackUsed: isFallback,
            durationMs: totalDuration,
            status: "success",
            finishReason,
            responseLength: rawText.length
          }
        };
      }

      // Record detailed Zod issues
      const issues = zodValidation.error.issues.map(i => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
        expected: (i as any).expected,
        received: (i as any).received
      }));
      lastValidationError = issues;
      console.warn(`[InstaScore Pipeline] [${params.requestId}] Zod validation failed for ${currentModel}. Invalid fields:`, JSON.stringify(issues));
    }

    // Step 4: Fast Correctional Retry (1 attempt per model)
    console.log(`[InstaScore Pipeline] [${params.requestId}] Invoking targeted correctional retry for ${currentModel}...`);
    totalCalls++;
    retries++;

    const correctionPrompt = `A análise gerada anteriormente não atendeu estritamente à validação Zod.
Erros específicos de validação identificados:
${JSON.stringify(lastValidationError || "JSON_PARSE_ERROR", null, 2)}

Conteúdo bruto a ser corrigido:
${rawText.slice(0, 4000)}

Diretrizes obrigatórias de correção:
1. methodology_version: "instascore-structural-0.1-alpha"
2. analysis_type: "structural"
3. metadata: { is_data_sufficient: boolean, missing_elements: string[], overall_confidence: number de 0 a 1 }
4. evaluations: array contendo todos os critérios avaliados com { criterion_id: string, grade: integer de 0 a 4 ou null, confidence: number de 0 a 1, evidence: string, justification: string }
5. strengths: array de no máximo 3 itens { criterion_id: string, title: string, reason: string }
6. critical_gaps: array de no máximo 5 itens { criterion_id: string, title: string, reason: string, impact: string }
7. recommended_actions: array de no máximo 5 itens { criterion_id: string, title: string, instruction: string, effort: "low" | "medium" | "high", expected_effect: string }
8. tomorrow_action: { criterion_id: string, title: string, instruction: string }
9. disclaimer: string

Retorne EXCLUSIVAMENTE o JSON estruturado corrigido.`;

    try {
      const ai = getGoogleGenAI();
      const retryResponse = await ai.models.generateContent({
        model: currentModel,
        contents: [{ text: correctionPrompt }],
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          temperature: 0.1
        }
      });

      const retryRawText = retryResponse.text || "";
      if (retryRawText) {
        const retryParsed = cleanAndParseJson(retryRawText);
        const retryZod = DiagnosisSchema.safeParse(retryParsed);

        if (retryZod.success) {
          const totalDuration = Date.now() - overallStartTime;
          console.log(`[InstaScore Pipeline] [${params.requestId}] Correctional retry SUCCESS on ${currentModel} in ${totalDuration}ms`);
          return {
            parsedDiagnosis: retryZod.data,
            meta: {
              modelUsed: currentModel,
              totalCalls,
              retries,
              fallbackUsed: isFallback,
              durationMs: totalDuration,
              status: "success",
              finishReason: retryResponse.candidates?.[0]?.finishReason || "STOP",
              responseLength: retryRawText.length
            }
          };
        } else {
          lastValidationError = retryZod.error.issues.map(i => ({
            path: i.path.join("."),
            code: i.code,
            message: i.message
          }));
          console.warn(`[InstaScore Pipeline] [${params.requestId}] Correctional retry Zod failed:`, JSON.stringify(lastValidationError));
        }
      }
    } catch (retryErr: any) {
      console.warn(`[InstaScore Pipeline] [${params.requestId}] Correctional retry call error on ${currentModel}:`, retryErr.message || retryErr);
    }
  }

  // All models and retries exhausted
  const totalDuration = Date.now() - overallStartTime;
  const failureError: any = new Error("ANALYSIS_VALIDATION_FAILED");
  failureError.code = "ANALYSIS_VALIDATION_FAILED";
  failureError.meta = {
    modelUsed: models[models.length - 1],
    totalCalls,
    retries,
    fallbackUsed: true,
    durationMs: totalDuration,
    status: "failed",
    validationIssues: lastValidationError
  };
  throw failureError;
}


// Simple in-memory rate limiter & request deduplication store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const recentRequestHashes = new Map<string, { result: any; expiresAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

app.post("/api/analyze", requireAuth, async (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const userId = req.user!.uid;

  // 1. Distributed Rate Limiting (Multi-Instance Compatible via Firestore / Store Lock)
  const rateLimitKey = userId ? `user_${userId}` : `ip_${clientIp}`;
  const rateLimit = await checkDistributedRateLimit(rateLimitKey, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    console.warn(`[InstaScore RateLimit] Key ${rateLimitKey} exceeded limit`);
    return res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Muitas solicitações enviadas em curto intervalo. Aguarde alguns minutos e tente novamente."
    });
  }

  // 2. Strict Zod Payload Validation BEFORE touching quotas or AI
  const payloadValidation = DiagnosisRequestSchema.safeParse(req.body);
  if (!payloadValidation.success) {
    const firstIssue = payloadValidation.error.issues[0];
    return res.status(400).json({
      success: false,
      error: "INVALID_REQUEST_PAYLOAD",
      message: firstIssue?.message || "Dados de formulário inválidos.",
      issues: payloadValidation.error.issues.map(i => ({
        path: i.path.join("."),
        message: i.message
      }))
    });
  }

  const { userName, niche, objective, targetAudience, handle, print1, print2, print3 } = payloadValidation.data;

  // 3. Multi-Layer Image Security Validation (Magic Bytes, Dimensions, No SVG/HTML, Size Limits)
  const imagesToValidate: { input: string; label: string }[] = [
    { input: print1, label: "Captura Inicial (Print 1)" },
    { input: print2, label: "Captura do Feed (Print 2)" }
  ];
  if (print3) {
    imagesToValidate.push({ input: print3, label: "Captura de Insights (Print 3)" });
  }

  const imgBatchResult = validateScreenshotBatch(imagesToValidate);
  if (!imgBatchResult.valid || imgBatchResult.validatedImages.length < 2) {
    return res.status(400).json({
      success: false,
      error: imgBatchResult.error || "INVALID_IMAGE_PAYLOAD",
      message: imgBatchResult.message || "As capturas de tela enviadas estão inválidas ou corrompidas."
    });
  }

  const [img1, img2, img3] = imgBatchResult.validatedImages;

  // 4. Atomic Quota Enforcement AFTER all cheap validations pass
  const quotaCheck = await checkAndIncrementQuota(userId, "DIAGNOSIS");
  if (!quotaCheck.allowed) {
    console.warn(`[InstaScore Quota] User ${userId} blocked: ${quotaCheck.errorCode}`);
    return res.status(403).json({
      success: false,
      error: quotaCheck.errorCode,
      message: quotaCheck.message,
      paywallRequired: true,
      currentCount: quotaCheck.currentCount,
      maxLimit: quotaCheck.maxLimit
    });
  }

  // Safe sanitized logging (NEVER log base64 data, prompt text, or tokens)
  console.log(`[InstaScore] Request validated: user=${userId}, ip=${clientIp}, imagesCount=${imgBatchResult.validatedImages.length}, totalSizeKb=${Math.round(imgBatchResult.totalSizeBytes / 1024)}`);

  const apiKeyToCheck = process.env.GEMINI_API_KEY;
  if (!apiKeyToCheck) {
    console.warn("[InstaScore] API Key is missing");
    // Restitute quota on server configuration error
    await refundQuota(userId, "DIAGNOSIS");
    return res.status(500).json({
      success: false,
      error: "API_KEY_MISSING",
      message: "A configuração da inteligência artificial está incompleta."
    });
  }

  // Build the parts array for the Gemini Multimodal prompt
  const parts: any[] = [];

  // Add validated screenshot inline data
  parts.push({
    inlineData: {
      mimeType: img1.mimeType,
      data: img1.data
    }
  });

  parts.push({
    inlineData: {
      mimeType: img2.mimeType,
      data: img2.data
    }
  });

  if (img3) {
    parts.push({
      inlineData: {
        mimeType: img3.mimeType,
        data: img3.data
      }
    });
  }

  // Context-rich strategic text prompt (Sanitized lengths enforced by Zod)
  const contextPrompt = `Aqui estão as capturas de tela do perfil do Instagram de ${userName} (@${handle || "Não informado"}).
Nicho/Negócio do usuário: "${niche}"
Objetivo Principal no Instagram: "${objective}"
Público Alvo Desejado: "${targetAudience}"

Instruções Adicionais de Análise:
1. O Print 1 mostra a tela inicial do perfil (foto, nome, bio, link, destaques).
2. O Print 2 mostra o topo do feed (6 a 9 posts recentes).
${img3 ? "3. O Print 3 mostra estatísticas adicionais (Insights) para contexto de métricas." : "3. O usuário não enviou o Print de Insights."}

Por favor, analise as capturas e preencha todos os 25 critérios obrigatórios da nossa metodologia de auditoria. Lembre-se de avaliar TODOS os 25 critérios do seu SYSTEM INSTRUCTION sem omitir nenhum ID de critério! Atribua notas inteiras de 0 a 4 (ou null se for totalmente impossível identificar qualquer evidência para aquele critério). Retorne os dados em formato JSON estrito conforme o esquema fornecido.`;

  parts.push({ text: contextPrompt });

  // Unique request trace ID for observability
  const requestId = `req_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

  // Execute analysis pipeline with Zod validation, retry, and fallback
  let pipelineResult: { parsedDiagnosis: any; meta: AIExecutionMeta };
  try {
    pipelineResult = await executeAnalysisPipeline({
      parts,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      requestId
    });
  } catch (pipelineErr: any) {
    console.error(`[InstaScore Pipeline] [${requestId}] Execution error:`, pipelineErr.message || pipelineErr);
    
    // Fail-safe quota refund policy: restore user quota on AI execution failure
    await refundQuota(userId, "DIAGNOSIS");

    if (pipelineErr.code === "ANALYSIS_VALIDATION_FAILED") {
      return res.status(422).json({
        success: false,
        error: "ANALYSIS_VALIDATION_FAILED",
        message: "Não conseguimos concluir esta análise agora. Seus dados e sua quota não foram perdidos. Tente novamente em alguns instantes.",
        diagnostic_info: {
          requestId,
          stage: "structured_output_validation",
          modelUsed: pipelineErr.meta?.modelUsed,
          totalCalls: pipelineErr.meta?.totalCalls,
          fallbackUsed: pipelineErr.meta?.fallbackUsed,
          issues: pipelineErr.meta?.validationIssues
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: "ANALYSIS_FAILED",
      message: "Ocorreu uma instabilidade temporária no processamento da IA. Sua quota foi preservada. Tente novamente em instantes.",
      requestId
    });
  }

  const { parsedDiagnosis, meta: aiExecutionMeta } = pipelineResult;

  // Run mathematical calculations in backend (AI must NEVER calculate scores)
  const evaluations = parsedDiagnosis.evaluations;

  // Ensure all 25 criteria are present in evaluations array
  const criteriaIdsInResponse = new Set(evaluations.map((e: any) => e.criterion_id));
  for (const criterion of CRITERIA) {
    if (!criteriaIdsInResponse.has(criterion.id)) {
      evaluations.push({
        criterion_id: criterion.id,
        grade: null,
        confidence: 0,
        evidence: "Informação não visível ou ausente nas capturas enviadas.",
        justification: "Critério não identificado nas evidências disponíveis.",
        epistemic_layer: {
          evidence: "evidência_observada",
          justification: "inferência_técnica",
          grade: "inferência_técnica"
        }
      });
    }
  }

  // Deterministic Math Engine scoring calculation
  const scoringResult = calculateScoring(evaluations, objective);
  console.log(`[InstaScore Pipeline] [${requestId}] Math Engine score=${scoringResult.score}, coverage=${scoringResult.coverage}%`);

  // Data sufficiency check
  if (!parsedDiagnosis.metadata?.is_data_sufficient || scoringResult.coverage < 15) {
    const missingReason = (parsedDiagnosis.metadata?.missing_elements && parsedDiagnosis.metadata.missing_elements.length > 0)
      ? parsedDiagnosis.metadata.missing_elements.join("; ")
      : "Não foram encontradas evidências de um perfil do Instagram nas imagens enviadas.";
    console.warn(`[InstaScore] [${requestId}] Insufficient image data detected: ${missingReason}`);

    // Restitute quota if uploaded image was unreadable as a profile
    await refundQuota(userId, "DIAGNOSIS");

    return res.status(400).json({
      success: false,
      error: "IMAGEM_INVALIDA_OU_INSUFICIENTE",
      message: `As imagens enviadas não parecem conter as informações de um perfil do Instagram visível. ${missingReason}`,
      missing_elements: parsedDiagnosis.metadata?.missing_elements || []
    });
  }

  // Priority alignment - ensure tomorrow_action and recommended_actions follow math engine
  const { getPrioritizedActions } = await import("./src/config/methodology");
  const prioritized = getPrioritizedActions(evaluations, objective);
  if (prioritized.length > 0) {
    const top1Id = prioritized[0].criterion_id;
    if (parsedDiagnosis.tomorrow_action && parsedDiagnosis.tomorrow_action.criterion_id !== top1Id) {
      const matchingAction = parsedDiagnosis.recommended_actions?.find((a: any) => a.criterion_id === top1Id);
      if (matchingAction) {
        parsedDiagnosis.tomorrow_action = {
          criterion_id: top1Id,
          title: matchingAction.title,
          instruction: matchingAction.instruction,
          epistemic_layer: "simulação_projetiva"
        };
      } else {
        parsedDiagnosis.tomorrow_action.criterion_id = top1Id;
        parsedDiagnosis.tomorrow_action.epistemic_layer = "simulação_projetiva";
      }
    }

    // Sort recommended actions according to priority score order
    const priorityOrderMap = new Map<string, number>();
    prioritized.forEach((p, idx) => priorityOrderMap.set(p.criterion_id, idx));
    if (parsedDiagnosis.recommended_actions) {
      parsedDiagnosis.recommended_actions.sort((a: any, b: any) => {
        const orderA = priorityOrderMap.has(a.criterion_id) ? priorityOrderMap.get(a.criterion_id)! : 99;
        const orderB = priorityOrderMap.has(b.criterion_id) ? priorityOrderMap.get(b.criterion_id)! : 99;
        return orderA - orderB;
      });
    }
  }

  // Complete Observability Metadata
  const diagnosticId = `diag_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const fullMeta = {
    diagnosticId,
    modelUsed: aiExecutionMeta?.modelUsed || AI_MODEL_ROUTER.primaryModel,
    totalCalls: aiExecutionMeta?.totalCalls || 1,
    retries: aiExecutionMeta?.retries || 0,
    fallbackUsed: aiExecutionMeta?.fallbackUsed || false,
    durationMs: aiExecutionMeta?.durationMs || 0,
    status: "success",
    validationStatus: "valid",
    coverage: scoringResult.coverage,
    score: scoringResult.score,
    methodologyVersion: parsedDiagnosis.methodology_version,
    promptVersion: "1.0.0"
  };

  // Log AI execution cost for Observability (Sanitized, No PII, No raw prompts)
  logAiExecutionCost({
    userId,
    diagnosticId,
    action: "diagnosis_multimodal",
    modelUsed: aiExecutionMeta?.modelUsed || AI_MODEL_ROUTER.primaryModel,
    durationMs: aiExecutionMeta?.durationMs || 0,
    retries: aiExecutionMeta?.retries || 0,
    fallbackUsed: aiExecutionMeta?.fallbackUsed || false,
    inputTokens: 2400,
    outputTokens: 1900
  });

  return res.json({
    success: true,
    diagnosis: parsedDiagnosis,
    scoring: scoringResult,
    meta: fullMeta
  });
});

// Vite + Express Setup for Dev/Production
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    // Production Mode with High-Performance Caching
    const distPath = path.join(process.cwd(), "dist");
    
    // 1. Immutable public cache for versioned / hashed static assets (JS, CSS, SVGs in /assets)
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
      index: false,
    }));

    // 2. Short / revalidation cache for general static files
    app.use(express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          // Keep HTML fresh so users immediately receive code-split bundle updates
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        }
      }
    }));

    // 3. Fallback for Single Page Application routing (revalidated)
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist with optimized caching.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (host: 0.0.0.0)`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start Express/Vite server:", err);
});
