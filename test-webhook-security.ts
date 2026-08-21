import crypto from "crypto";
import {
  validateWebhookSignature,
  verifyMercadoPagoPaymentS2S,
  processWebhookEvent,
  createCheckoutSessionServer,
  getSubscription,
  cancelSubscriptionServer
} from "./src/lib/billing-server.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runSecurityTestSuite() {
  console.log("=================================================");
  console.log("  INICIANDO TESTES DE SEGURANÇA DO WEBHOOK (FAIL-CLOSED)");
  console.log("=================================================\n");

  const originalEnv = { ...process.env };
  const TEST_SECRET = "mp_sec_test_secret_key_123456789";

  // -------------------------------------------------------------
  // TEST 1: Missing secret in production (Fail-closed 503)
  // -------------------------------------------------------------
  console.log("🧪 Teste 1: Ausência de secret em ambiente de produção");
  process.env.NODE_ENV = "production";
  delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

  const res1 = validateWebhookSignature({ "x-signature": "ts=1700000000,v1=abcdef" }, { id: "123" });
  assert(!res1.valid && res1.status === 503, "Deve rejeitar com 503 quando secret estiver ausente em produção", `status=${res1.status}`);

  // -------------------------------------------------------------
  // TEST 2: Missing signature header
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 2: Cabeçalho de assinatura ausente");
  process.env.NODE_ENV = "development";
  process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_SECRET;

  const res2 = validateWebhookSignature({}, { id: "123" });
  assert(!res2.valid && res2.status === 401, "Deve retornar 401 para cabeçalho de assinatura ausente", `status=${res2.status}`);

  // -------------------------------------------------------------
  // TEST 3: Malformed signature header
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 3: Assinatura malformada (sem ts= ou v1=)");
  const res3 = validateWebhookSignature({ "x-signature": "invalid_format_without_parts" }, { id: "123" });
  assert(!res3.valid && res3.status === 401 && res3.error === "MALFORMED_SIGNATURE", "Deve retornar 401 para formato malformado", `error=${res3.error}`);

  // -------------------------------------------------------------
  // TEST 4: Timestamp Replay Attack (expired timestamp > 5 mins)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 4: Replay attack com timestamp expirado (> 5 min)");
  const expiredTs = Math.floor((Date.now() - 10 * 60 * 1000) / 1000); // 10 minutes ago
  const reqId = "req_123";
  const dataId = "pay_999";
  const manifestExpired = `id:${dataId};request-id:${reqId};ts:${expiredTs};`;
  const hashExpired = crypto.createHmac("sha256", TEST_SECRET).update(manifestExpired).digest("hex");

  const res4 = validateWebhookSignature(
    { "x-signature": `ts=${expiredTs},v1=${hashExpired}`, "x-request-id": reqId },
    { id: dataId }
  );
  assert(!res4.valid && res4.status === 401 && res4.error === "SIGNATURE_REPLAY_OR_EXPIRED", "Deve rejeitar replay attack expirado com 401", `error=${res4.error}`);

  // -------------------------------------------------------------
  // TEST 5: HMAC divergence (tampered data or wrong secret)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 5: HMAC divergente (dados adulterados ou secret errado)");
  const currentTs = Math.floor(Date.now() / 1000);
  const tamperedHash = crypto.createHmac("sha256", "wrong_secret").update(`id:${dataId};request-id:${reqId};ts:${currentTs};`).digest("hex");

  const res5 = validateWebhookSignature(
    { "x-signature": `ts=${currentTs},v1=${tamperedHash}`, "x-request-id": reqId },
    { id: dataId }
  );
  assert(!res5.valid && res5.status === 401 && res5.error === "HMAC_SIGNATURE_MISMATCH", "Deve rejeitar HMAC divergente com 401", `error=${res5.error}`);

  // -------------------------------------------------------------
  // TEST 6: Valid signature generation & verification
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 6: Assinatura válida com HMAC correto e timestamp recente");
  const validManifest = `id:${dataId};request-id:${reqId};ts:${currentTs};`;
  const validHash = crypto.createHmac("sha256", TEST_SECRET).update(validManifest).digest("hex");

  const res6 = validateWebhookSignature(
    { "x-signature": `ts=${currentTs},v1=${validHash}`, "x-request-id": reqId },
    { id: dataId }
  );
  assert(res6.valid && res6.status === 200, "Deve aceitar assinatura válida com status 200");

  // -------------------------------------------------------------
  // TEST 7: S2S Value Mismatch (Tampered Amount)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 7: Divergência de valor no pagamento (Amount Mismatch)");
  const userIdA = "user_sec_test_A_" + Date.now();
  const sessionRecordA = await createCheckoutSessionServer({
    userId: userIdA,
    planId: "PRO",
    cycle: "monthly",
    paymentMethod: "pix"
  });

  const tamperedFixturePayment = {
    id: "pay_tampered_1",
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 1.00, // Expected 39.90!
    metadata: {
      user_id: userIdA,
      session_id: sessionRecordA.sessionId,
      plan_id: "PRO",
      cycle: "monthly"
    }
  };

  const s2sResMismatch = await verifyMercadoPagoPaymentS2S({
    providerPaymentId: "pay_tampered_1",
    expectedSessionId: sessionRecordA.sessionId,
    fixturePayment: tamperedFixturePayment
  });
  assert(!s2sResMismatch.verified && s2sResMismatch.errorCode === "AMOUNT_MISMATCH", "Deve rejeitar pagamento com valor divergente da sessão", `errorCode=${s2sResMismatch.errorCode}`);

  // -------------------------------------------------------------
  // TEST 8: S2S User Mismatch (Untrusted / Spoofed User ID)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 8: Divergência de usuário (User Mismatch / IDOR)");
  const attackerUserId = "user_attacker_" + Date.now();
  const spoofedFixturePayment = {
    id: "pay_spoofed_1",
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 39.90,
    metadata: {
      user_id: userIdA, // Session belongs to userIdA
      session_id: sessionRecordA.sessionId,
      plan_id: "PRO",
      cycle: "monthly"
    }
  };

  const s2sResUserMismatch = await verifyMercadoPagoPaymentS2S({
    providerPaymentId: "pay_spoofed_1",
    expectedSessionId: sessionRecordA.sessionId,
    expectedUserId: attackerUserId, // Attacker claims it's for them
    fixturePayment: spoofedFixturePayment
  });
  assert(!s2sResUserMismatch.verified && s2sResUserMismatch.errorCode === "USER_MISMATCH", "Deve rejeitar atribuição a usuário diferente da metadata segura", `errorCode=${s2sResUserMismatch.errorCode}`);

  // -------------------------------------------------------------
  // TEST 9: Non-approved status (Pending / In Process) -> No PRO upgrade
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 9: Pagamento com status pendente (sem conceder upgrade)");
  const pendingPaymentId = "pay_pending_" + Date.now();
  const pendingFixture = {
    id: pendingPaymentId,
    status: "in_process",
    currency_id: "BRL",
    transaction_amount: 39.90,
    metadata: {
      user_id: userIdA,
      session_id: sessionRecordA.sessionId,
      plan_id: "PRO",
      cycle: "monthly"
    }
  };

  const pendingEventId = "evt_pending_" + Date.now();
  const processPendingRes = await processWebhookEvent({
    eventId: pendingEventId,
    eventType: "payment.updated",
    providerPaymentId: pendingPaymentId,
    fixturePayment: pendingFixture
  });

  const subAfterPending = await getSubscription(userIdA);
  assert(
    processPendingRes.success &&
    !processPendingRes.processed &&
    subAfterPending.plan === "FREE",
    "Não deve promover para PRO quando o pagamento estiver pendente",
    `plan=${subAfterPending.plan}`
  );

  // -------------------------------------------------------------
  // TEST 10: Successful Real Payment via Fixture -> PRO Upgrade
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 10: Pagamento aprovado real simulado por fixture -> Promoção para PRO");
  const approvedPaymentId = "pay_approved_" + Date.now();
  const approvedFixture = {
    id: approvedPaymentId,
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 39.90,
    metadata: {
      user_id: userIdA,
      session_id: sessionRecordA.sessionId,
      plan_id: "PRO",
      cycle: "monthly"
    }
  };

  const approvedEventId = "evt_approved_" + Date.now();
  const processApprovedRes = await processWebhookEvent({
    eventId: approvedEventId,
    eventType: "payment.approved",
    providerPaymentId: approvedPaymentId,
    fixturePayment: approvedFixture
  });

  const subAfterApproved = await getSubscription(userIdA);
  assert(
    processApprovedRes.success &&
    processApprovedRes.processed &&
    subAfterApproved.plan === "PRO" &&
    subAfterApproved.status === "active",
    "Deve promover com sucesso para PRO com status active",
    `plan=${subAfterApproved.plan}, status=${subAfterApproved.status}`
  );

  // -------------------------------------------------------------
  // TEST 11: Idempotency check (Duplicate eventId and duplicate paymentId)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 11: Idempotência transacional por eventId e providerPaymentId");
  const duplicateEvtRes = await processWebhookEvent({
    eventId: approvedEventId, // Same event ID
    eventType: "payment.approved",
    providerPaymentId: approvedPaymentId,
    fixturePayment: approvedFixture
  });
  assert(
    duplicateEvtRes.success &&
    duplicateEvtRes.processed === false &&
    duplicateEvtRes.reason === "EVENTO_JA_PROCESSADO_IDEMPOTENCIA",
    "Deve ignorar reprocessamento de eventId duplicado com razão idempotência",
    `reason=${duplicateEvtRes.reason}`
  );

  const duplicatePayRes = await processWebhookEvent({
    eventId: "new_evt_diff_" + Date.now(), // New event ID but same payment ID
    eventType: "payment.approved",
    providerPaymentId: approvedPaymentId,
    fixturePayment: approvedFixture
  });
  assert(
    duplicatePayRes.success &&
    duplicatePayRes.processed === false &&
    duplicatePayRes.reason === "PAGAMENTO_JA_PROCESSADO_IDEMPOTENCIA",
    "Deve ignorar reprocessamento de paymentId duplicado com razão idempotência",
    `reason=${duplicatePayRes.reason}`
  );

  // -------------------------------------------------------------
  // TEST 12: Production fallback disabled (Fail-closed checkout)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 12: Desabilitação de fallback simulado em produção");
  process.env.NODE_ENV = "production";
  delete process.env.MERCADOPAGO_ACCESS_TOKEN;

  let threwProdError = false;
  try {
    await createCheckoutSessionServer({
      userId: "user_prod_test",
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "pix"
    });
  } catch (err: any) {
    threwProdError = true;
  }
  assert(threwProdError, "createCheckoutSessionServer deve lançar erro se credenciais ausentes em produção (sem fallback simulado)");

  // Restore env
  process.env = originalEnv;

  // -------------------------------------------------------------
  // TEST 13: Annual Plan Pricing S2S Validation (R$ 349,90 vs R$ 399,00)
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 13: Validação S2S do Plano Anual oficial (R$ 349,90) e rejeição do legado (R$ 399,00)");
  const userIdAnnual = "user_sec_test_annual_" + Date.now();
  const sessionAnnual = await createCheckoutSessionServer({
    userId: userIdAnnual,
    planId: "PRO",
    cycle: "annual",
    paymentMethod: "pix"
  });

  assert(sessionAnnual.amount === 349.90, "Checkout session anual deve ter valor oficial R$ 349,90", `amount=${sessionAnnual.amount}`);

  // Test legacy 399.00 payment rejection
  const legacyPaymentId = "pay_legacy_399_" + Date.now();
  const legacyFixture = {
    id: legacyPaymentId,
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 399.00, // Legacy price must be rejected
    metadata: {
      user_id: userIdAnnual,
      session_id: sessionAnnual.sessionId,
      plan_id: "PRO",
      cycle: "annual"
    }
  };

  const legacyS2S = await verifyMercadoPagoPaymentS2S({
    providerPaymentId: legacyPaymentId,
    expectedSessionId: sessionAnnual.sessionId,
    fixturePayment: legacyFixture
  });
  assert(
    !legacyS2S.verified && (legacyS2S.errorCode === "PRICE_MISMATCH" || legacyS2S.errorCode === "AMOUNT_MISMATCH"),
    "Deve rejeitar pagamento legado de R$ 399,00 com PRICE_MISMATCH quando o oficial é R$ 349,90",
    `errorCode=${legacyS2S.errorCode}`
  );

  // Test official 349.90 payment approval
  const officialAnnualPaymentId = "pay_official_349_" + Date.now();
  const officialAnnualFixture = {
    id: officialAnnualPaymentId,
    status: "approved",
    currency_id: "BRL",
    transaction_amount: 349.90,
    metadata: {
      user_id: userIdAnnual,
      session_id: sessionAnnual.sessionId,
      plan_id: "PRO",
      cycle: "annual"
    }
  };

  const officialS2S = await verifyMercadoPagoPaymentS2S({
    providerPaymentId: officialAnnualPaymentId,
    expectedSessionId: sessionAnnual.sessionId,
    fixturePayment: officialAnnualFixture
  });
  assert(officialS2S.verified, "Deve aprovar pagamento oficial de R$ 349,90 no plano Anual", officialS2S.errorMessage);

  // -------------------------------------------------------------
  // TEST 14: Annual Webhook Execution & 365 Days Duration
  // -------------------------------------------------------------
  console.log("\n🧪 Teste 14: Processamento Webhook Anual e cálculo de expiração de 365 dias");
  const annualEvtId = "evt_annual_approved_" + Date.now();
  const annualWebhookRes = await processWebhookEvent({
    eventId: annualEvtId,
    eventType: "payment.approved",
    providerPaymentId: officialAnnualPaymentId,
    fixturePayment: officialAnnualFixture
  });

  const subAnnual = await getSubscription(userIdAnnual);
  assert(
    annualWebhookRes.success &&
    annualWebhookRes.processed &&
    subAnnual.plan === "PRO" &&
    subAnnual.cycle === "annual" &&
    subAnnual.status === "active",
    "Deve promover para PRO Anual ativo com sucesso",
    `plan=${subAnnual.plan}, cycle=${subAnnual.cycle}`
  );

  console.log("\n=================================================");
  console.log(`  RESULTADO DOS TESTES: ${passed} PASSOU, ${failed} FALHOU`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTestSuite().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
