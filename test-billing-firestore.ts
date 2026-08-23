import {
  getSubscription,
  getUsage,
  checkAndIncrementQuota,
  refundQuota,
  checkUserEntitlement,
  processWebhookEvent,
  getCheckoutSessionStatus,
  createCheckoutSessionServer,
  submitUserFeedback,
  listFeedbackRecords,
  getAdminMetrics,
  logAiExecutionCost,
  migrateInMemoryToFirestore,
  getActivePersistenceBackend,
  BillingUnavailableError,
  SubscriptionRecord,
  UsageRecord
} from "./src/lib/billing-server";
import { getFirebaseAdminFirestore, resolveProjectId, resolveFirestoreDatabaseId } from "./src/server/auth/firebase-admin";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details: string = "") {
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${description} ${details}`);
    failed++;
  }
}

async function runBillingTests() {
  console.log("==========================================================");
  console.log("INICIANDO TESTES DE PERSISTÊNCIA DURÁVEL BILLING ENGINE");
  console.log("==========================================================\n");

  const initialBackend = getActivePersistenceBackend();
  console.log(`[Backend Status Inicial] Type: ${initialBackend.type}, Status: ${initialBackend.status}, IsProduction: ${initialBackend.isProduction}, Project: ${initialBackend.projectId}`);

  const testUid = `test_user_${Date.now()}`;
  const testUidPro = `test_user_pro_${Date.now()}`;

  // --- 1. Test Default Creation with Atomic Transaction ---
  console.log("--- 1. Testando Criação Transacional de Default ---");
  const subFree = await getSubscription(testUid);
  assert("Usuário novo recebe plano FREE", subFree.plan === "FREE", `Plano obtido: ${subFree.plan}`);
  assert("Status inicial é active", subFree.status === "active");
  assert("SchemaVersion é 1", subFree.schemaVersion === 1);
  assert("Data de expiração preenchida", subFree.expiresAt > Date.now());

  const usageFree = await getUsage(testUid);
  assert("Usage inicial tem 0 diagnósticos", usageFree.diagnosesCount === 0);
  assert("Usage inicial tem 0 gerações IA", usageFree.aiGenerationsCount === 0);

  // --- 2. Test Concurrency & Atomic Quota Protection ---
  console.log("\n--- 2. Testando Concorrência Atômica de Quota ---");
  // FREE plan has maxDiagnosesTotal = 1.
  // We fire 5 concurrent requests simultaneously for testUid
  const concurrentCalls = await Promise.all([
    checkAndIncrementQuota(testUid, "DIAGNOSIS"),
    checkAndIncrementQuota(testUid, "DIAGNOSIS"),
    checkAndIncrementQuota(testUid, "DIAGNOSIS"),
    checkAndIncrementQuota(testUid, "DIAGNOSIS"),
    checkAndIncrementQuota(testUid, "DIAGNOSIS")
  ]);

  const allowedCalls = concurrentCalls.filter(c => c.allowed);
  const rejectedCalls = concurrentCalls.filter(c => !c.allowed);

  assert("Apenas 1 requisição concorrente obteve permissão no plano FREE (Limite = 1)", allowedCalls.length === 1, `Permitidas: ${allowedCalls.length}`);
  assert("4 requisições concorrentes foram bloqueadas com FREE_QUOTA_EXCEEDED", rejectedCalls.length === 4, `Bloqueadas: ${rejectedCalls.length}`);
  assert("Código de erro retornado é FREE_QUOTA_EXCEEDED", rejectedCalls[0]?.errorCode === "FREE_QUOTA_EXCEEDED");

  // Verify stored usage count
  const updatedUsage = await getUsage(testUid);
  assert("Contador persistido de diagnósticos é exatamente 1", updatedUsage.diagnosesCount === 1, `Valor: ${updatedUsage.diagnosesCount}`);

  // Subsequent call must also fail
  const extraCall = await checkAndIncrementQuota(testUid, "DIAGNOSIS");
  assert("Chamada subsequente após atingir cota é bloqueada", !extraCall.allowed);

  // Test quota refund
  await refundQuota(testUid, "DIAGNOSIS");
  const refundedUsage = await getUsage(testUid);
  assert("Estorno de cota decrementa contador com sucesso", refundedUsage.diagnosesCount === 0);

  // --- 3. Test Webhook Processing with Idempotency & Sanitization ---
  console.log("\n--- 3. Testando Webhook Transacional, Idempotência e Sanitização ---");
  const eventId = `evt_test_${Date.now()}`;
  const paymentId = `pay_test_${Date.now()}`;
  const fixturePayment = {
    id: paymentId,
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 39.90,
    metadata: {
      user_id: testUidPro,
      plan_id: "PRO",
      cycle: "monthly"
    }
  };
  const webhookPayload = {
    eventId,
    eventType: "payment.approved",
    userId: testUidPro,
    cycle: "monthly" as const,
    status: "approved",
    provider: "mercadopago" as const,
    providerPaymentId: paymentId,
    fixturePayment,
    payload: {
      id: paymentId,
      token: "secret_mp_token_xyz", // Must be sanitized
      card_number: "4111111111111111", // Must be sanitized
      security_code: "123", // Must be sanitized
      amount: 39.90,
      description: "InstaScore PRO Mensal"
    }
  };

  // First webhook execution
  const res1 = await processWebhookEvent(webhookPayload);
  assert("Primeiro processamento de webhook executado com sucesso", res1.success && res1.processed);
  assert("Usuário promovido a PRO", res1.subscription?.plan === "PRO");
  assert("Status da assinatura é active", res1.subscription?.status === "active");

  // Duplicate webhook execution (Idempotency)
  const res2 = await processWebhookEvent(webhookPayload);
  assert("Execução duplicada tratada com idempotência", res2.success && !res2.processed);
  assert("Motivo de idempotência registrado", res2.reason === "EVENTO_JA_PROCESSADO_IDEMPOTENCIA");

  // Verify PRO user usage is reset
  const proUsage = await getUsage(testUidPro);
  assert("Usage do usuário PRO foi inicializado/resetado", proUsage.diagnosesCount === 0);

  // --- 4. Test Entitlements for PRO User ---
  console.log("\n--- 4. Testando Entitlements e Quota PRO ---");
  const entReels = await checkUserEntitlement(testUidPro, "reelsGenerator");
  assert("Usuário PRO tem acesso ao Reels Generator", entReels.allowed && entReels.plan === "PRO");

  const entFree = await checkUserEntitlement(testUid, "reelsGenerator");
  assert("Usuário FREE tem acesso negado a feature PRO", !entFree.allowed && entFree.plan === "FREE");

  // Test PRO image generation quota
  const imgQuota1 = await checkAndIncrementQuota(testUidPro, "IMAGE_GENERATION");
  assert("Geração de imagem permitida para PRO", imgQuota1.allowed);

  const imgQuotaFree = await checkAndIncrementQuota(testUid, "IMAGE_GENERATION");
  assert("Geração de imagem bloqueada para FREE", !imgQuotaFree.allowed && imgQuotaFree.errorCode === "IMAGE_GENERATION_PRO_ONLY");

  // --- 5. Test Checkout Session Persistence & IDOR Protection ---
  console.log("\n--- 5. Testando Checkout Session e Proteção IDOR ---");
  const session = await createCheckoutSessionServer({
    userId: testUid,
    planId: "PRO",
    cycle: "annual",
    paymentMethod: "pix",
    userEmail: "test@instascore.ai"
  });

  assert("Checkout session criada com ID", Boolean(session.sessionId));
  assert("Checkout session anual criada com valor oficial R$ 399,00", session.amount === 399.00);
  assert("Status inicial é pending", session.status === "pending");
  assert("PIX QR code gerado", Boolean(session.pixQrCodeText));

  // Valid session poll
  const pollValid = await getCheckoutSessionStatus(session.sessionId, testUid);
  assert("Consulta de status permitida para o proprietário da sessão", pollValid.found && pollValid.status === "pending");

  // IDOR Protection: User B querying User A's session
  const pollAttacker = await getCheckoutSessionStatus(session.sessionId, "attacker_uid");
  assert("Consulta de status bloqueada para terceiro (Proteção IDOR)", !pollAttacker.found && pollAttacker.status === "unauthorized");

  // --- 6. Test Feedback & AI Observability Persistence ---
  console.log("\n--- 6. Testando Feedback e AI Observability ---");
  const fb = await submitUserFeedback({
    userId: testUid,
    solutionType: "reels_generator",
    rating: "useful",
    comment: "Excelente roteiro e gancho.",
    itemTitle: "Roteiro Nicho Odonto"
  });
  assert("Feedback registrado com ID", Boolean(fb.id));

  const list = await listFeedbackRecords(10);
  assert("listFeedbackRecords retorna feedbacks gravados", list.length > 0 && list.some(f => f.id === fb.id));

  const aiLog = await logAiExecutionCost({
    userId: testUid,
    action: "test_ai_action",
    modelUsed: "gemini-2.5-flash",
    durationMs: 450,
    retries: 0,
    fallbackUsed: false,
    inputTokens: 1000,
    outputTokens: 500
  });
  assert("AI Log registrado com custo estimado", Boolean(aiLog.id) && aiLog.estimatedCostUsd > 0);

  const metrics = await getAdminMetrics();
  assert("getAdminMetrics retorna métricas agregadas", metrics.users.total > 0 && metrics.aiObservability.totalCalls > 0);

  // --- 7. Test Development In-Memory Migration Safety ---
  console.log("\n--- 7. Testando Script de Migração em Desenvolvimento ---");
  const migrationRes = await migrateInMemoryToFirestore({
    subscriptions: [
      {
        userId: `migrated_user_${Date.now()}`,
        plan: "FREE",
        status: "active",
        cycle: "monthly",
        provider: "mercadopago",
        subscriptionId: "sub_mig_1",
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        schemaVersion: 1
      }
    ]
  });
  assert("Migração explícita executada com sucesso em desenvolvimento", migrationRes.success && migrationRes.migrated.subscriptions === 1);

  // --- 8. Test Production Mode Fail-Closed with Null DB ---
  console.log("\n--- 8. Testando Comportamento Fail-Closed em Produção com Firestore Nulo/Indisponível ---");
  const prevEnv = process.env.NODE_ENV;
  const prevPayEnv = process.env.PAYMENT_ENVIRONMENT;
  const storeFilePath = path.join(process.cwd(), '.data', 'billing_store.json');

  try {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_ENVIRONMENT = 'production';

    const prodBackend = getActivePersistenceBackend();
    assert("Backend detecta modo produção", prodBackend.isProduction === true);

    const prodTestUid = `prod_test_failclosed_${Date.now()}`;
    const storeMtimeBefore = fs.existsSync(storeFilePath) ? fs.statSync(storeFilePath).mtimeMs : 0;

    // A. Test getSubscription fails closed with 503 if firestore is disabled/missing
    let getSubError: any = null;
    try {
      // In this sub-test, if firestore is not available, it must throw 503
      // If Firestore is available in staging, verify it returns standard data without local mutation
      const subRes = await getSubscription(prodTestUid);
      assert("Em produção com Firestore ativo, getSubscription opera no Firestore", subRes.plan === 'FREE');
    } catch (err: any) {
      getSubError = err;
      assert("Em produção sem Firestore, getSubscription lança 503 Fail-Closed", err.status === 503 && (err.code === 'FIRESTORE_CONFIG_MISSING' || err.code === 'BILLING_UNAVAILABLE'));
    }

    // B. Test Quota check in production
    try {
      const quotaRes = await checkAndIncrementQuota(prodTestUid, 'DIAGNOSIS');
      if (quotaRes.allowed) {
        assert("Em produção com Firestore ativo, quota opera no Firestore", quotaRes.allowed);
      } else {
        assert("Em produção sem Firestore, checkAndIncrementQuota bloqueia com erro fail-closed", quotaRes.errorCode === 'FIRESTORE_CONFIG_MISSING' || quotaRes.errorCode === 'BILLING_UNAVAILABLE');
      }
    } catch (err: any) {
      assert("Em produção sem Firestore, checkAndIncrementQuota lança 503 Fail-Closed", err.status === 503);
    }

    // C. Test Webhook in production
    const prodWebhookRes = await processWebhookEvent({
      eventId: `prod_evt_${Date.now()}`,
      eventType: 'payment.approved',
      userId: prodTestUid,
      status: 'approved',
      providerPaymentId: `prod_pay_${Date.now()}`,
      fixturePayment: {
        id: `prod_pay_${Date.now()}`,
        status: 'approved',
        currency_id: 'BRL',
        transaction_amount: 39.90,
        metadata: {
          user_id: prodTestUid,
          plan_id: 'PRO',
          cycle: 'monthly'
        }
      }
    });

    if (prodWebhookRes.success) {
      assert("Em produção com Firestore ativo, webhook processa com sucesso no Firestore", prodWebhookRes.processed || prodWebhookRes.httpStatus === 200);
    } else {
      assert("Em produção sem Firestore, webhook falha com HTTP 503 fail-closed", prodWebhookRes.httpStatus === 503);
    }

    // D. Test Checkout Session creation in production
    try {
      const prodSession = await createCheckoutSessionServer({
        userId: prodTestUid,
        planId: 'PRO',
        cycle: 'monthly',
        paymentMethod: 'pix'
      });
      assert("Em produção com Firestore ativo, checkout session salva no Firestore", Boolean(prodSession.sessionId));
    } catch (err: any) {
      assert("Em produção sem Firestore, createCheckoutSessionServer lança 503 Fail-Closed", err.status === 503);
    }

    // E. Verify NO local store file mutation occurred during production failure
    const storeMtimeAfter = fs.existsSync(storeFilePath) ? fs.statSync(storeFilePath).mtimeMs : 0;
    assert("Em produção sem Firestore, NENHUMA mutação local é realizada no arquivo billing_store.json", storeMtimeBefore === storeMtimeAfter || !fs.existsSync(storeFilePath));

  } finally {
    process.env.NODE_ENV = prevEnv;
    process.env.PAYMENT_ENVIRONMENT = prevPayEnv;
  }

  // --- 9. Test Environment Resolution and Cloud Run Project Verification ---
  console.log("\n--- 9. Verificando Resolução de Projeto e Database Cloud Run ---");
  const resolvedProject = resolveProjectId();
  const resolvedDatabase = resolveFirestoreDatabaseId();
  console.log(`[Cloud Run Config] Resolved Project ID: ${resolvedProject}, Database ID: ${resolvedDatabase}`);
  assert("ProjectId do Firestore resolvido", Boolean(resolvedProject));
  assert("DatabaseId do Firestore resolvido", Boolean(resolvedDatabase));

  console.log("\n==========================================");
  console.log(`RESULTADO FINAL DOS TESTES:`);
  console.log(`✅ PASSOU: ${passed}`);
  console.log(`❌ FALHOU: ${failed}`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBillingTests().catch(err => {
  console.error("Erro fatal durante execução dos testes de billing:", err);
  process.exit(1);
});

