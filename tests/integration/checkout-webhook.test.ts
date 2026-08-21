import { 
  createCheckoutSessionServer, 
  validateWebhookSignature, 
  processWebhookEvent 
} from "../../src/lib/billing-server";
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

  // 1. Create Pix checkout session
  await test("createCheckoutSessionServer creates valid Pix checkout session with QR Code", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_pix_123",
      planId: "PRO",
      cycle: "monthly",
      paymentMethod: "pix"
    });

    if (!session.sessionId) throw new Error("Missing sessionId in response");
    if (session.amount !== 39.90) throw new Error(`Expected amount 39.90, got ${session.amount}`);
    if (!session.pixQrCodeText || !session.pixQrCodeText.startsWith("000201")) {
      throw new Error("Invalid Pix payload string");
    }
  });

  // 2. Create Card checkout session (Annual cycle with discount)
  await test("createCheckoutSessionServer calculates annual billing discount properly", async () => {
    const session = await createCheckoutSessionServer({
      userId: "test_user_card_annual",
      planId: "PRO",
      cycle: "annual",
      paymentMethod: "card"
    });

    if (!session.sessionId) throw new Error("Missing sessionId in response");
    if (session.amount <= 39.90) throw new Error("Annual price should reflect full year total");
  });

  // 3. Webhook signature validation
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

  // 4. Idempotent webhook event processing
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
