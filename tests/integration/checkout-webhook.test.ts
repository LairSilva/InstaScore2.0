import { 
  createCheckoutSessionServer, 
  validateWebhookSignature, 
  processWebhookEvent,
  verifyMercadoPagoPaymentS2S,
  validateAndBuildWebhookNotificationUrl,
  STAGING_APP_URL
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

  // 2. Create Card checkout session (Annual cycle with R$ 399,00)
  await test("createCheckoutSessionServer calculates annual billing official price (R$ 399,00) properly", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_card_annual",
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });

    if (!session.sessionId) throw new Error("Missing sessionId in response");
    if (session.amount !== 399.00) throw new Error(`Expected annual amount 399.00, got ${session.amount}`);
    if (PLANS.PRO.priceAnnual !== 399.00) throw new Error(`PLANS.PRO.priceAnnual must be 399.00, got ${PLANS.PRO.priceAnnual}`);
    if (PLANS.PRO.formattedPriceAnnual !== "R$ 399,00/ano") {
      throw new Error(`Expected formattedPriceAnnual 'R$ 399,00/ano', got ${PLANS.PRO.formattedPriceAnnual}`);
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

  // 4. Notification URL: Valid Staging URL
  await test("validateAndBuildWebhookNotificationUrl accepts official staging URL and constructs valid HTTPS webhook notification_url", () => {
    const res = validateAndBuildWebhookNotificationUrl(STAGING_APP_URL);
    if (!res.valid) {
      throw new Error(`Expected valid staging URL result, got error: ${res.error}`);
    }
    if (res.notificationUrl !== "https://ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app/api/webhook/payment") {
      throw new Error(`Expected exact staging notification_url, got: ${res.notificationUrl}`);
    }
    if (res.baseUrl !== "https://ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app") {
      throw new Error(`Expected exact staging baseUrl, got: ${res.baseUrl}`);
    }
  });

  // 5. Notification URL: Valid custom production HTTPS URL
  await test("validateAndBuildWebhookNotificationUrl accepts custom valid production HTTPS APP_URL", () => {
    const res = validateAndBuildWebhookNotificationUrl("https://instascore.ai");
    if (!res.valid) {
      throw new Error(`Expected valid production URL, got error: ${res.error}`);
    }
    if (res.notificationUrl !== "https://instascore.ai/api/webhook/payment") {
      throw new Error(`Expected notification_url 'https://instascore.ai/api/webhook/payment', got: ${res.notificationUrl}`);
    }
    if (res.baseUrl !== "https://instascore.ai") {
      throw new Error(`Expected baseUrl 'https://instascore.ai', got: ${res.baseUrl}`);
    }
  });

  // 6. Notification URL: Missing / empty candidate
  await test("validateAndBuildWebhookNotificationUrl rejects empty candidate string", () => {
    const res = validateAndBuildWebhookNotificationUrl("");
    if (res.valid) {
      throw new Error("Expected empty string candidate to be invalid");
    }
    if (res.errorCode !== "APP_URL_MISSING") {
      throw new Error(`Expected APP_URL_MISSING error code, got: ${res.errorCode}`);
    }
  });

  // 7. Notification URL: Missing protocol (e.g. without https://)
  await test("validateAndBuildWebhookNotificationUrl rejects URL without protocol", () => {
    const res = validateAndBuildWebhookNotificationUrl("ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app");
    if (res.valid) {
      throw new Error("Expected URL without protocol to be invalid");
    }
    if (res.errorCode !== "INVALID_APP_URL_FORMAT" && res.errorCode !== "INVALID_PROTOCOL") {
      throw new Error(`Expected INVALID_APP_URL_FORMAT or INVALID_PROTOCOL, got: ${res.errorCode}`);
    }
  });

  // 8. Notification URL: Localhost & 127.0.0.1 rejection
  await test("validateAndBuildWebhookNotificationUrl rejects localhost and 127.0.0.1 URLs", () => {
    const resLocalhost = validateAndBuildWebhookNotificationUrl("http://localhost:3000");
    if (resLocalhost.valid) {
      throw new Error("Expected localhost URL to be rejected");
    }
    if (resLocalhost.errorCode !== "INVALID_APP_URL" && resLocalhost.errorCode !== "INVALID_PROTOCOL") {
      throw new Error(`Expected INVALID_APP_URL or INVALID_PROTOCOL for localhost, got: ${resLocalhost.errorCode}`);
    }

    const resIp = validateAndBuildWebhookNotificationUrl("https://127.0.0.1:3000");
    if (resIp.valid) {
      throw new Error("Expected 127.0.0.1 URL to be rejected");
    }
    if (resIp.errorCode !== "INVALID_APP_URL") {
      throw new Error(`Expected INVALID_APP_URL for 127.0.0.1, got: ${resIp.errorCode}`);
    }
  });

  // 9. Notification URL: Undefined / Null / Spaces rejection
  await test("validateAndBuildWebhookNotificationUrl rejects candidate containing undefined, null, or spaces", () => {
    const resUndefined = validateAndBuildWebhookNotificationUrl("https://undefined.com/api");
    if (resUndefined.valid) {
      throw new Error("Expected candidate with 'undefined' to be rejected");
    }

    const resNull = validateAndBuildWebhookNotificationUrl("https://instascore.ai/null");
    if (resNull.valid) {
      throw new Error("Expected candidate with 'null' to be rejected");
    }

    const resSpaces = validateAndBuildWebhookNotificationUrl("https://insta score.ai");
    if (resSpaces.valid) {
      throw new Error("Expected candidate with spaces to be rejected");
    }
  });

  // 10. Notification URL: Hostname without domain extension / single word hostname
  await test("validateAndBuildWebhookNotificationUrl rejects invalid hostnames without top-level domain", () => {
    const res = validateAndBuildWebhookNotificationUrl("https://internalhost/api");
    if (res.valid) {
      throw new Error("Expected hostname without dot to be rejected");
    }
    if (res.errorCode !== "INVALID_HOSTNAME") {
      throw new Error(`Expected INVALID_HOSTNAME, got: ${res.errorCode}`);
    }
  });

  // 11. createCheckoutSessionServer fails with 503 when invalid appUrl is supplied
  await test("createCheckoutSessionServer returns 503 error when candidate appUrl is invalid", async () => {
    try {
      await createCheckoutSessionServer({
        userId: "test_user_invalid_url",
        planId: "PRO",
        cycle: "monthly",
        paymentMethod: "pix",
        appUrl: "http://localhost:3000"
      });
      throw new Error("createCheckoutSessionServer should have thrown 503 for localhost appUrl");
    } catch (err: any) {
      if (err.status !== 503) {
        throw new Error(`Expected status 503, got: ${err.status}`);
      }
    }
  });

  // 12. S2S validation for Annual Plan: accepts 399.00, rejects legacy 349.90
  await test("verifyMercadoPagoPaymentS2S accepts official annual 399.00 and rejects legacy 349.90 with PRICE_MISMATCH", async () => {
    const testUser = "test_user_annual_s2s_" + Date.now();
    const session = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });

    // Valid S2S payment with official 399.00
    const validAnnualFixture = {
      id: "pay_annual_valid_" + Date.now(),
      status: "approved",
      currency_id: "BRL",
      transaction_amount: 399.00,
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
      throw new Error(`Valid annual payment of 399.00 failed verification: ${validRes.errorMessage}`);
    }

    // Legacy S2S payment with 349.90 should fail with PRICE_MISMATCH
    const legacyAnnualFixture = {
      id: "pay_annual_legacy_" + Date.now(),
      status: "approved",
      currency_id: "BRL",
      transaction_amount: 349.90, // Legacy price must be rejected
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
      throw new Error("Legacy annual payment of 349.90 was accepted unexpectedly");
    }
    if (legacyRes.errorCode !== "PRICE_MISMATCH" && legacyRes.errorCode !== "AMOUNT_MISMATCH") {
      throw new Error(`Expected PRICE_MISMATCH or AMOUNT_MISMATCH, got ${legacyRes.errorCode}`);
    }
  });

  // 13. Missing Webhook Secret Handling
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

  // 14. Webhook signature validation (Tamper and Forgery rejection)
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

  // 15. Idempotent webhook event processing
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

  // 16. All 4 Checkout Variants: Monthly Pix, Monthly Card, Annual Pix, Annual Card
  await test("createCheckoutSessionServer handles all 4 payment variants (Monthly/Annual x Pix/Card) accurately", async () => {
    const testUser = "test_user_all_variants_" + Date.now();

    // Variant 1: Monthly Pix
    const v1 = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "pix"
    });
    if (v1.amount !== 39.90 || !v1.pixQrCodeText || !v1.pixQrCodeBase64) {
      throw new Error("Monthly Pix variant failed contract validation");
    }

    // Variant 2: Monthly Card
    const v2 = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "card"
    });
    if (v2.amount !== 39.90 || !v2.checkoutUrl) {
      throw new Error("Monthly Card variant failed contract validation");
    }

    // Variant 3: Annual Pix
    const v3 = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "pix"
    });
    if (v3.amount !== 399.00 || !v3.pixQrCodeText || !v3.pixQrCodeBase64) {
      throw new Error("Annual Pix variant failed contract validation");
    }

    // Variant 4: Annual Card
    const v4 = await createCheckoutSessionServer({
      userId: testUser,
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });
    if (v4.amount !== 399.00 || !v4.checkoutUrl) {
      throw new Error("Annual Card variant failed contract validation");
    }
  });

  return { passed, failed, tests: logs };
}
