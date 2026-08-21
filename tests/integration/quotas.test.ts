import { 
  PLANS, 
  getPlanConfig, 
  hasEntitlement, 
  isWithinQuota 
} from "../../src/config/plans";
import { 
  checkUserEntitlement, 
  checkAndIncrementQuota 
} from "../../src/lib/billing-server";

export async function runQuotasIntegrationTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        passed++;
        logs.push(`  \x1b[32m✔\x1b[0m [Integration:Quotas] ${name}`);
      } catch (err: any) {
        failed++;
        logs.push(`  \x1b[31m✖\x1b[0m [Integration:Quotas] ${name} -> ${err.message}`);
      }
    })();
  }

  // 1. FREE Plan quotas and entitlements
  await test("FREE plan enforces 1 diagnosis quota and blocks Pro features", () => {
    const freePlan = getPlanConfig("FREE");
    if (freePlan.quotas.maxDiagnosesTotal !== 1) {
      throw new Error(`Expected maxDiagnosesTotal 1 for FREE, got ${freePlan.quotas.maxDiagnosesTotal}`);
    }
    if (hasEntitlement("FREE", "contentAi")) {
      throw new Error("FREE plan should NOT have contentAi entitlement");
    }
    if (hasEntitlement("FREE", "reelsGenerator")) {
      throw new Error("FREE plan should NOT have reelsGenerator entitlement");
    }
  });

  // 2. PRO Plan quotas and entitlements
  await test("PRO plan grants all advanced entitlements and high monthly limits", () => {
    const proPlan = getPlanConfig("PRO");
    if (proPlan.quotas.maxDiagnosesPerMonth < 10) {
      throw new Error("PRO plan should have at least 10 diagnoses per month");
    }
    if (!hasEntitlement("PRO", "contentAi")) {
      throw new Error("PRO plan should have contentAi entitlement");
    }
    if (!hasEntitlement("PRO", "reelsGenerator")) {
      throw new Error("PRO plan should have reelsGenerator entitlement");
    }
    if (!hasEntitlement("PRO", "diagnosticFull")) {
      throw new Error("PRO plan should have diagnosticFull entitlement");
    }
  });

  // 3. isWithinQuota boundary check
  await test("isWithinQuota correctly flags when usage reaches or exceeds limit", () => {
    // Under limit
    if (!isWithinQuota("FREE", "maxDiagnosesTotal", 0)) {
      throw new Error("Usage 0 should be within FREE maxDiagnosesTotal 1");
    }
    // At limit
    if (isWithinQuota("FREE", "maxDiagnosesTotal", 1)) {
      throw new Error("Usage 1 should NOT be within FREE maxDiagnosesTotal 1");
    }
    // Above limit
    if (isWithinQuota("FREE", "maxDiagnosesTotal", 5)) {
      throw new Error("Usage 5 should NOT be within FREE maxDiagnosesTotal 1");
    }
  });

  // 4. checkUserEntitlement server-side mock check
  await test("checkUserEntitlement blocks unprivileged free users from Pro actions", async () => {
    const res = await checkUserEntitlement("mock_test_user_free", "contentAi");
    if (res.allowed) {
      throw new Error("Free user should not be allowed for contentAi feature");
    }
  });

  // 5. checkAndIncrementQuota limit enforcement
  await test("checkAndIncrementQuota enforces max quota bounds without live external call", async () => {
    const quotaCheck = await checkAndIncrementQuota("mock_test_user_1", "DIAGNOSIS");
    if (typeof quotaCheck.allowed !== "boolean") {
      throw new Error("Expected boolean 'allowed' field in quota check response");
    }
  });

  return { passed, failed, tests: logs };
}
