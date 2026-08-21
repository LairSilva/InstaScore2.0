import { 
  createCheckoutSessionServer, 
  validateWebhookSignature, 
  processWebhookEvent,
  verifyMercadoPagoPaymentS2S
} from "../../src/lib/billing-server";
import { PLANS } from "../../src/config/plans";
import crypto from "crypto";

export async function runCheckoutWebhookIntegrationTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        passed++;
        logs.push(`  \x1b[32m✔\x1b[0m [Integration:CheckoutWebhook] ${name}`);
      } catch (err: any) {
        failed++;
        logs.push(`  \x1b[31m✖\x1b[0m [Integration:CheckoutWebhook] ${name} -> ${err.message}`);
      }
    })();
  }

  // 1. Create Pix checkout session (Monthly)
  await test("createCheckoutSessionServer creates valid Pix checkout session with monthly price 39.90", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_pix_123",
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "pix"
    });

    if (!session.sessionId) throw new Error("Missing sessionId in response");
    if (session.amount !== 39.90) throw new Error(`Expected amount 39.90, got ${session.amount}`);
    if (PLANS.PRO.priceMonthly !== 39.90) throw new Error(`PLANS.PRO.priceMonthly must be 39.90, got ${PLANS.PRO.priceMonthly}`);
    if (!session.pixQrCodeText || !session.pixQrCodeText.startsWith("000201")) {
      throw new Error("Invalid Pix payload string");
    }
  });

  // 2. Create Card checkout session (Annual cycle with R$ 349,90)
  await test("createCheckoutSessionServer calculates annual billing official price (R$ 349,90) properly", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_card_annual",
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });

    if (!session.sessionId) throw new Error("Missing sessionId in response");
    if (session.amount !== 349.90) throw new Error(`Expected annual amount 349.90, got ${session.amount}`);
    if (PLANS.PRO.priceAnnual !== 349.90) throw new Error(`PLANS.PRO.priceAnnual must be 349.90, got ${PLANS.PRO.priceAnnual}`);
    if (PLANS.PRO.formattedPriceAnnual !== "R$ 349,90/ano") {
      throw new Error(`Expected formattedPriceAnnual 'R$ 349,90/ano', got ${PLANS.PRO.formattedPriceAnnual}`);
    }
    if (!session.checkoutUrl) {
      throw new Error("Expected valid checkoutUrl for card redirection");
    }
  });

  // 3. Successful Redirection URL contract validation
  await test("Checkout session returns valid checkoutUrl for card redirection and client navigation", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_redirect_check",
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "card",
      appUrl: "https://staging.instascore.ai"
    });

    if (!session.checkoutUrl || typeof session.checkoutUrl !== "string") {
      throw new Error("Missing or invalid checkoutUrl string");
    }
    if (!session.checkoutUrl.startsWith("http://") && !session.checkoutUrl.startsWith("https://")) {
      throw new Error(`checkoutUrl must be a valid absolute HTTP/HTTPS URL, got ${session.checkoutUrl}`);
    }
  });

  // 4. S2S validation for Annual Plan: accepts 349.90, rejects old 399.00
  await test("verifyMercadoPagoPaymentS2S accepts official annual 349.90 and rejects legacy 399.00 with PRICE_MISMATCH", async () => {
    const testUser = "test_user_annual_s2s_" + Date.now();
    const session = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });

    // Valid S2S payment with official 349.90
    const validAnnualFixture = {
      id: "pay_annual_valid_" + Date.now(),
      status: "approved",
      currency_id: "BRL",
      transaction_amount: 349.90,
      metadata: {
        user_id: testUser,
        session_id: session.sessionId,
        plan_id: "PRO",
        cycle: "annual"
      }
    };
    const validRes = await verifyMercadoPagoPaymentS2S({
      providerPaymentId: validAnnualFixture.id,
      expectedSessionId: session.sessionId,
      fixturePayment: validAnnualFixture
    });
    if (!validRes.verified) {
      throw new Error(`Valid annual payment of 349.90 failed verification: ${validRes.errorMessage}`);
    }

    // Legacy S2S payment with 399.00 should fail with PRICE_MISMATCH
    const legacyAnnualFixture = {
      id: "pay_annual_legacy_" + Date.now(),
      status: "approved",
      currency_id: "BRL",
      transaction_amount: 399.00, // Legacy price must be rejected
      metadata: {
        user_id: testUser,
        session_id: session.sessionId,
        plan_id: "PRO",
        cycle: "annual"
      }
    };
    const legacyRes = await verifyMercadoPagoPaymentS2S({
      providerPaymentId: legacyAnnualFixture.id,
      expectedSessionId: session.sessionId,
      fixturePayment: legacyAnnualFixture
    });
    if (legacyRes.verified) {
      throw new Error("Legacy annual payment of 399.00 was accepted unexpectedly");
    }
    if (legacyRes.errorCode !== "PRICE_MISMATCH" && legacyRes.errorCode !== "AMOUNT_MISMATCH") {
      throw new Error(`Expected PRICE_MISMATCH or AMOUNT_MISMATCH, got ${legacyRes.errorCode}`);
    }
  });

  // 5. Missing Webhook Secret Handling
  await test("validateWebhookSignature returns 503 WEBHOOK_SECRET_UNCONFIGURED when webhook secret is missing", () => {
    const validHeaders = {
      "x-signature": `ts=123456789,v1=abcdef0123456789`,
      "x-request-id": "req_123"
    };
    const reqBody = { data: { id: "pay_123" } };

    // With null / undefined secret
    const result = validateWebhookSignature(validHeaders, reqBody, {}, "");
    if (result.valid) {
      throw new Error("Validation should fail when secret is empty");
    }
    if (result.status !== 503 || (result.error !== "WEBHOOK_SECRET_UNCONFIGURED" && result.error !== "SECRET_NOT_CONFIGURED")) {
      throw new Error(`Expected status 503 and error WEBHOOK_SECRET_UNCONFIGURED, got ${result.status} ${result.error}`);
    }
  });

  // 6. Webhook signature validation (Tamper and Forgery rejection)
  await test("validateWebhookSignature validates authentic signatures and rejects forged requests", () => {
    const secret = "test_webhook_secret_key_12345";
    const dataId = "pay_123456";
    const requestId = "req_abcdef";
    const tsVal = Math.floor(Date.now() / 1000).toString();
    const manifest = `id:${dataId};request-id:${requestId};ts:${tsVal};`;

    const validV1 = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    const validHeaders = {
      "x-signature": `ts=${tsVal},v1=${validV1}`,
      "x-request-id": requestId
    };
    const reqBody = { data: { id: dataId } };

    const validResult = validateWebhookSignature(validHeaders, reqBody, {}, secret);
    if (!validResult.valid) {
      throw new Error(`Valid signature failed verification: ${validResult.message || validResult.error}`);
    }

    // Forged signature
    const forgedHeaders = {
      "x-signature": `ts=${tsVal},v1=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`,
      "x-request-id": requestId
    };
    const forgedResult = validateWebhookSignature(forgedHeaders, reqBody, {}, secret);
    if (forgedResult.valid) {
      throw new Error("Forged signature passed validation unexpectedly");
    }
  });

  // 7. Idempotent webhook event processing
  await test("processWebhookEvent processes payment.succeeded event idempotently", async () => {
    const eventPayload = {
      eventId: "evt_test_unique_idempotent_999",
      eventType: "payment.approved",
      userId: "test_user_webhook_active",
      status: "approved",
      cycle: "monthly" as const
    };

    const firstRun = await processWebhookEvent(eventPayload);
    if (!firstRun.success) {
      throw new Error(`Expected event to succeed, got: ${JSON.stringify(firstRun)}`);
    }

    // Re-running the exact same event should be idempotent and recognized
    const secondRun = await processWebhookEvent(eventPayload);
    if (!secondRun.success) {
      throw new Error("Idempotent check failed on duplicate event execution");
    }
  });

  return { passed, failed, tests: logs };
}
